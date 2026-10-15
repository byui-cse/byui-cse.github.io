/**
 * Lights: a 1–100% page dimmer whose colors stay readable at every level.
 *
 * Why not blend light and dark palettes? Blending moves text and background
 * toward each other, so mid values end up gray on gray. Instead:
 *  - The background lightness skips the band (OKLCH L ≈ 0.45–0.70) where no
 *    text color can reach comfortable contrast. 51–100% stays light, 1–50% dark.
 *  - Every other color is solved against the background for a contrast target.
 *
 * Loaded as a classic script in <head> so the page paints at the saved level
 * (no flash). Also loaded by lib/cli/verify.js, which sweeps 1–100 and checks contrast.
 */
(function (global) {
    "use strict";

    const STORAGE_KEY = "byui-cse-lights";
    const DEFAULT_LEVEL = 100;
    const OS_DARK_LEVEL = 20;

    /* ---------- color math (OKLCH -> sRGB) ---------- */

    const toLinearRgb = (l, c, h) => {
        const hr = (h * Math.PI) / 180;
        const a = c * Math.cos(hr);
        const b = c * Math.sin(hr);
        const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
        const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
        const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

        return [
            4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
            -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
            -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
        ];
    };

    const inGamut = (rgb) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

    /** OKLCH -> linear sRGB, reducing chroma until it fits the sRGB gamut. */
    const oklch = (l, c, h) => {
        let rgb = toLinearRgb(l, c, h);

        if (!inGamut(rgb)) {
            let lo = 0;
            let hi = c;

            for (let i = 0; i < 20; i += 1) {
                const mid = (lo + hi) / 2;

                if (inGamut(toLinearRgb(l, mid, h))) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }

            rgb = toLinearRgb(l, lo, h);
        }

        return rgb.map((v) => Math.min(1, Math.max(0, v)));
    };

    const luminance = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

    const contrast = (a, b) => {
        const la = luminance(a);
        const lb = luminance(b);

        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };

    const toHex = (rgb) => "#" + rgb
        .map((v) => {
            const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

            return Math.round(Math.min(1, Math.max(0, s)) * 255).toString(16).padStart(2, "0");
        })
        .join("");

    const mix = (a, b, t) => a + (b - a) * t;

    /**
     * Find the lightness closest to `fromL` (moving toward `towardL`) that still
     * meets `target` contrast against every background. Falls back to `towardL`.
     */
    const solveL = (fromL, towardL, c, h, backgrounds, target) => {
        let lo = 0;
        let hi = 1;
        const ok = (t) => {
            const rgb = oklch(mix(fromL, towardL, t), c, h);

            return backgrounds.every((bg) => contrast(rgb, bg) >= target);
        };

        if (!ok(1)) {
            return towardL;
        }

        for (let i = 0; i < 24; i += 1) {
            const mid = (lo + hi) / 2;

            if (ok(mid)) {
                hi = mid;
            } else {
                lo = mid;
            }
        }

        return mix(fromL, towardL, hi);
    };

    /* ---------- the palette for one level ---------- */

    const BRAND_HUE = 250;

    /**
     * @param {number} level 1–100
     * @returns {{ scheme: "light" | "dark", colors: Record<string, string>, rgb: Record<string, number[]>, photo: number }}
     */
    const palette = (level) => {
        const v = Math.round(Math.min(100, Math.max(1, Number(level) || DEFAULT_LEVEL)));
        const light = v >= 51;
        const t = light ? (v - 51) / 49 : (v - 1) / 49;

        /* Background: warm lamplight when light, cool moonlight when dark. */
        const bgL = light ? mix(0.74, 0.985, t) : mix(0.16, 0.39, t);
        const bgC = light ? mix(0.024, 0.008, t) : mix(0.034, 0.02, t);
        const bgH = light ? 85 : 258;

        const rgb = {};

        rgb.paper = oklch(bgL, bgC, bgH);
        rgb.surface = light
            ? oklch(Math.min(0.998, bgL + 0.014), bgC * 0.5, bgH)
            : oklch(bgL + mix(0.05, 0.03, t), bgC, bgH);
        rgb.tint = light
            ? oklch(bgL - 0.03, bgC + 0.006, bgH)
            : oklch(bgL + mix(0.03, 0.02, t), bgC, bgH);

        const backs = [rgb.paper, rgb.surface, rgb.tint];

        /* Body text: aim for 7:1 (AAA) on every surface. */
        const inkL = light
            ? solveL(0.26, 0.12, 0.02, BRAND_HUE, backs, 7)
            : solveL(0.9, 0.99, 0.01, BRAND_HUE, backs, 7);

        rgb.ink = oklch(inkL, light ? 0.02 : 0.01, BRAND_HUE);

        /* Muted text (used sparingly): clearly secondary but still strong at 6:1. */
        const mutedL = solveL(bgL, inkL, 0.02, BRAND_HUE, backs, 6);

        rgb.muted = oklch(mutedL, 0.02, BRAND_HUE);

        /* Brand blue as text and links: 5:1, deeper on light, brighter on dark. */
        const linkL = light
            ? solveL(0.6, 0.3, 0.16, BRAND_HUE, backs, 5)
            : solveL(0.6, 0.92, 0.12, BRAND_HUE, backs, 5);

        rgb.link = oklch(linkL, light ? 0.16 : 0.12, BRAND_HUE);
        rgb.linkHover = oklch(light ? linkL - 0.08 : Math.min(0.95, linkL + 0.06), 0.14, BRAND_HUE);

        /* Decorative hairlines (no contrast requirement) and UI borders (3:1). */
        rgb.line = oklch(mix(bgL, inkL, 0.14), 0.01, BRAND_HUE);
        rgb.border = oklch(solveL(bgL, inkL, 0.02, BRAND_HUE, [rgb.paper, rgb.surface], 3), 0.02, BRAND_HUE);

        /* Brand fills: buttons and full-width bands, always with white text. */
        rgb.brand = oklch(0.5, 0.15, BRAND_HUE);
        rgb.brandHover = oklch(0.43, 0.14, BRAND_HUE);
        rgb.onBrand = oklch(0.99, 0, 0);
        rgb.band = light ? oklch(0.41, 0.13, BRAND_HUE) : oklch(mix(0.24, 0.3, t), 0.09, BRAND_HUE);
        rgb.bandDeep = light ? oklch(0.33, 0.11, BRAND_HUE) : oklch(mix(0.2, 0.25, t), 0.08, BRAND_HUE);
        rgb.onBand = oklch(0.99, 0.005, BRAND_HUE);
        rgb.onBandMuted = oklch(solveL(0.6, 0.99, 0.03, BRAND_HUE, [rgb.band, rgb.bandDeep], 5), 0.03, BRAND_HUE);
        rgb.bandAccent = oklch(0.86, 0.13, 85);

        /* Focus ring: visible against both the page and brand fills. */
        rgb.focus = light
            ? oklch(solveL(0.62, 0.3, 0.17, 55, [rgb.paper], 3), 0.17, 55)
            : oklch(solveL(0.7, 0.95, 0.14, 75, [rgb.paper], 3), 0.14, 75);

        const colors = {};

        Object.keys(rgb).forEach((key) => {
            colors[key] = toHex(rgb[key]);
        });

        return {
            level: v,
            scheme: light ? "light" : "dark",
            colors,
            rgb,
            photo: light ? 1 : mix(0.82, 0.95, t)
        };
    };

    const CSS_VARS = {
        paper: "--color-paper",
        surface: "--color-surface",
        tint: "--color-tint",
        ink: "--color-ink",
        muted: "--color-muted",
        link: "--color-link",
        linkHover: "--color-link-hover",
        line: "--color-line",
        border: "--color-border",
        brand: "--color-brand",
        brandHover: "--color-brand-hover",
        onBrand: "--color-on-brand",
        band: "--color-band",
        bandDeep: "--color-band-deep",
        onBand: "--color-on-band",
        onBandMuted: "--color-on-band-muted",
        bandAccent: "--color-band-accent",
        focus: "--color-focus"
    };

    /** Pairs that must stay readable, checked by `pnpm run verify`. */
    const CONTRAST_RULES = [
        ["ink", "paper", 7], ["ink", "surface", 7], ["ink", "tint", 7],
        ["muted", "paper", 4.5], ["muted", "surface", 4.5], ["muted", "tint", 4.5],
        ["link", "paper", 4.5], ["link", "surface", 4.5], ["link", "tint", 4.5],
        ["border", "paper", 3], ["border", "surface", 3],
        ["onBrand", "brand", 4.5], ["onBrand", "brandHover", 4.5],
        ["onBand", "band", 7], ["onBand", "bandDeep", 7],
        ["onBandMuted", "band", 4.5], ["onBandMuted", "bandDeep", 4.5],
        ["bandAccent", "band", 4.5], ["bandAccent", "bandDeep", 4.5],
        ["focus", "paper", 3]
    ];

    /* ---------- applying a level to the page ---------- */

    const readSaved = () => {
        try {
            const raw = global.localStorage.getItem(STORAGE_KEY);
            const value = raw === null ? NaN : Number.parseInt(raw, 10);

            return Number.isFinite(value) ? value : null;
        } catch {
            return null;
        }
    };

    const save = (level) => {
        try {
            global.localStorage.setItem(STORAGE_KEY, String(level));
        } catch {
            /* storage can be blocked; the page still works */
        }
    };

    const initialLevel = () => {
        const saved = readSaved();

        if (saved !== null) {
            return saved;
        }

        const prefersDark = global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches;

        return prefersDark ? OS_DARK_LEVEL : DEFAULT_LEVEL;
    };

    const apply = (level) => {
        const p = palette(level);
        const root = global.document.documentElement;

        Object.keys(CSS_VARS).forEach((key) => {
            root.style.setProperty(CSS_VARS[key], p.colors[key]);
        });
        root.style.setProperty("--lights", String(p.level / 100));
        root.style.setProperty("--photo-brightness", p.photo.toFixed(3));
        root.style.colorScheme = p.scheme;
        root.dataset.lights = p.scheme;

        return p;
    };

    const api = { palette, contrast, apply, save, initialLevel, CONTRAST_RULES, CSS_VARS, STORAGE_KEY };

    global.BYUILights = api;

    if (global.document && global.document.documentElement) {
        api.current = apply(initialLevel()).level;
    }
})(globalThis);
