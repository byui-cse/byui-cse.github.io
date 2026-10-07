/**
 * Lightweight verification for the static builder (not a heavy test framework).
 */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { expandIncludes, injectLiveReload, resolveIncludePath } from "../includes.js";
import { buildCssBundle } from "../css.js";
import { createIgnoreMatcher } from "../ignore.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let failed = 0;

/**
 * @param {string} name
 * @param {() => Promise<void> | void} fn
 */
const check = async (name, fn) => {
    try {
        await fn();
        console.log(`ok  ${name}`);
    } catch (err) {
        failed += 1;
        console.error(`FAIL ${name}`);
        console.error(`  ${err?.message ?? err}`);
    }
};

/**
 * @param {boolean} condition
 * @param {string} message
 */
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "byui-site-verify-"));
const source = path.join(tmpRoot, "src");
const templates = path.join(source, "templates");
await fs.mkdir(templates, { recursive: true });

await fs.writeFile(path.join(templates, "header.html"), "<header>HEADER</header>\n");
await fs.writeFile(path.join(templates, "footer.html"), "<footer>FOOTER</footer>\n");
await fs.writeFile(path.join(templates, "nested-inner.html"), "INNER");
await fs.writeFile(
    path.join(templates, "nested-outer.html"),
    'OUTER <include src="nested-inner.html"></include>'
);
await fs.writeFile(
    path.join(templates, "doc-head.html"),
    `<!DOCTYPE html><html><head>
<title>{{title}}</title>
<meta name="description" content="{{description}}">
<meta property="og:title" content="{{say-this-name}}">
{{head}}
</head><body>CHROME</body></html>`
);
await fs.writeFile(
    path.join(source, "page.html"),
    `<!DOCTYPE html><html><body>
<include src="header.html"></include>
<main>PAGE</main>
<include src="footer.html"></include>
</body></html>`
);
await fs.writeFile(
    path.join(source, "meta-page.html"),
    `<include src="doc-head.html"
	title="Hello &amp; Welcome"
	description="A short desc"
	say-this-name="Kebab Works">
	<link rel="stylesheet" href="/css/extra.css">
	<meta name="robots" content="noindex">
</include>
<main>BODY</main>
<include src="footer.html"></include>
`
);

await check("header + footer include", async () => {
    const html = await expandIncludes({
        filePath: path.join(source, "page.html"),
        sourceRoot: source,
        templatesDir: "templates"
    });
    assert(html.includes("<header>HEADER</header>"), "missing header");
    assert(html.includes("<footer>FOOTER</footer>"), "missing footer");
    assert(!html.includes("<include"), "include left in output");
});

await check("nested includes", async () => {
    const html = await expandIncludes({
        filePath: path.join(templates, "nested-outer.html"),
        sourceRoot: source,
        templatesDir: "templates"
    });
    assert(html.includes("OUTER INNER"), `unexpected: ${html}`);
});

await check("include attrs + head slot", async () => {
    const html = await expandIncludes({
        filePath: path.join(source, "meta-page.html"),
        sourceRoot: source,
        templatesDir: "templates"
    });
    assert(html.includes("<title>Hello &amp; Welcome</title>"), "title not substituted");
    assert(
        html.includes('content="A short desc"'),
        "description not substituted"
    );
    assert(html.includes('content="Kebab Works"'), "kebab attr missing");
    assert(html.includes('href="/css/extra.css"'), "head slot link missing");
    assert(html.includes('name="robots"'), "head slot meta missing");
    assert(html.includes("<main>BODY</main>"), "body should stay outside head");
    assert(!html.includes("{{"), "placeholders left in output");
    const headEnd = html.indexOf("</head>");
    const extraCss = html.indexOf('href="/css/extra.css"');
    assert(extraCss > -1 && extraCss < headEnd, "extra css must be inside head");
});

await check("empty title fails", async () => {
    await fs.writeFile(
        path.join(source, "no-title.html"),
        `<include src="doc-head.html" description="x"></include>`
    );

    try {
        await expandIncludes({
            filePath: path.join(source, "no-title.html"),
            sourceRoot: source,
            templatesDir: "templates"
        });
        throw new Error("expected empty title to throw");
    } catch (err) {
        assert(err.code === "INCLUDE_TITLE", `wrong code: ${err.code}`);
    }
});

await check("attr values are escaped", async () => {
    await fs.writeFile(
        path.join(templates, "escape.html"),
        `<p>{{title}}</p>`
    );
    await fs.writeFile(
        path.join(source, "escape-page.html"),
        `<include src="escape.html" title='<b>"x"</b>'></include>`
    );
    const html = await expandIncludes({
        filePath: path.join(source, "escape-page.html"),
        sourceRoot: source,
        templatesDir: "templates"
    });
    assert(html.includes("&lt;b&gt;"), "should escape <");
    assert(html.includes("&quot;x&quot;"), "should escape quotes");
    assert(!html.includes("<b>"), "raw tags must not leak");
});

await check("missing include", async () => {
    await fs.writeFile(path.join(source, "missing.html"), '<include src="nope.html"></include>');

    try {
        await expandIncludes({
            filePath: path.join(source, "missing.html"),
            sourceRoot: source,
            templatesDir: "templates"
        });
        throw new Error("expected missing include to throw");
    } catch (err) {
        assert(err.code === "INCLUDE_MISSING", `wrong code: ${err.code}`);
    }
});

await check("circular include", async () => {
    await fs.writeFile(path.join(templates, "a.html"), '<include src="b.html"></include>');
    await fs.writeFile(path.join(templates, "b.html"), '<include src="a.html"></include>');

    try {
        await expandIncludes({
            filePath: path.join(templates, "a.html"),
            sourceRoot: source,
            templatesDir: "templates"
        });
        throw new Error("expected circular include to throw");
    } catch (err) {
        assert(err.code === "INCLUDE_CIRCULAR", `wrong code: ${err.code}`);
    }
});

await check("include escape blocked", async () => {
    try {
        await resolveIncludePath({
            includeSrc: "../outside.html",
            fromFile: path.join(source, "page.html"),
            sourceRoot: source,
            templatesDir: "templates"
        });
        throw new Error("expected escape to throw");
    } catch (err) {
        assert(
            err.code === "INCLUDE_ESCAPE" || err.code === "INCLUDE_MISSING",
            `wrong code: ${err.code}`
        );
    }
});

await check("ignore markdown", async () => {
    const isIgnored = createIgnoreMatcher(["**/*.md", "**/templates/**", "**/css/**"]);
    assert(isIgnored(source, path.join(source, "notes.md")), "md should be ignored");
    assert(!isIgnored(source, path.join(source, "js", "app.js")), "js should copy");
});

await check("css @import + @layer bundle", async () => {
    const cssDir = path.join(source, "css");
    await fs.mkdir(cssDir, { recursive: true });
    await fs.writeFile(path.join(cssDir, "tokens.css"), ":root { --x: 1; }\n");
    await fs.writeFile(
        path.join(cssDir, "main.css"),
        `@layer tokens;\n@import "./tokens.css" layer(tokens);\nbody { color: red; }\n`
    );
    const out = path.join(tmpRoot, "main.out.css");
    await buildCssBundle({
        input: path.join(cssDir, "main.css"),
        output: out,
        minify: true
    });
    const css = await fs.readFile(out, "utf8");
    assert(
        css.includes("--x") || css.includes("color:red") || css.includes("color: red"),
        "bundle empty"
    );
});

await check("dev css sourcemap", async () => {
    const cssDir = path.join(source, "css-map");
    await fs.mkdir(cssDir, { recursive: true });
    await fs.writeFile(path.join(cssDir, "a.css"), "body{color:blue}");
    await fs.writeFile(path.join(cssDir, "main.css"), '@import "./a.css";\n');
    const out = path.join(tmpRoot, "mapped.css");
    await buildCssBundle({
        input: path.join(cssDir, "main.css"),
        output: out,
        minify: true,
        sourceMap: true
    });
    await fs.access(`${out}.map`);
    const css = await fs.readFile(out, "utf8");
    assert(css.includes("sourceMappingURL"), "missing sourceMappingURL");
});

await check("live reload inject", () => {
    const withBody = injectLiveReload("<html><body><p>x</p></body></html>");
    assert(withBody.includes("EventSource"), "missing EventSource client");
    assert(withBody.includes("</body>"), "body missing");
    assert(withBody.indexOf("EventSource") < withBody.indexOf("</body>"), "script not before body");
});

await check("production www has no live reload", async () => {
    const built = path.join(root, "www", "index.html");
    const html = await fs.readFile(built, "utf8");
    assert(!html.includes("EventSource"), "production HTML should not inject live reload");
    assert(html.includes("BYU-Idaho"), "missing site content");
    assert(html.includes("<header"), "header include missing");
});

await check("static asset copied", async () => {
    await fs.access(path.join(root, "www", "js", "nav.js"));
    await fs.access(path.join(root, "www", "css", "main.css"));
});

await check("repeated production builds", async () => {
    const runBuild = () => {
        return new Promise((resolve, reject) => {
            const child = spawn(
                "node",
                ["lib/cli/build.js", "--production"],
                {
                    cwd: root,
                    stdio: "ignore"
                }
            );
            child.on("exit", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`build exit ${code}`));
                }
            });
        });
    };

    await runBuild();
    const first = await fs.readFile(path.join(root, "www", "index.html"), "utf8");
    await runBuild();
    const second = await fs.readFile(path.join(root, "www", "index.html"), "utf8");
    assert(first === second, "production builds differed");
});

/* ---------- Lights: every level from 1 to 100 must stay readable ---------- */

const loadLights = async () => {
    const vm = await import("node:vm");
    const code = await fs.readFile(path.join(root, "src", "js", "lights-core.js"), "utf8");
    const context = {};

    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(code, context);

    return context.BYUILights;
};

await check("lights contrast holds at every level 1-100", async () => {
    const lights = await loadLights();
    const failures = [];

    for (let level = 1; level <= 100; level += 1) {
        const p = lights.palette(level);

        for (const [fg, bg, target] of lights.CONTRAST_RULES) {
            const ratio = lights.contrast(p.rgb[fg], p.rgb[bg]);

            if (ratio < target) {
                failures.push(`${level}%: ${fg} on ${bg} = ${ratio.toFixed(2)} (needs ${target})`);
            }
        }
    }

    assert(failures.length === 0, `${failures.length} contrast failure(s):\n  ${failures.slice(0, 10).join("\n  ")}`);
});

await check("css color defaults match lights at 100% and 20%", async () => {
    const lights = await loadLights();
    const css = await fs.readFile(path.join(root, "src", "css", "tokens", "colors.css"), "utf8");
    const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
    const lightCss = css.slice(0, darkStart);
    const darkCss = css.slice(darkStart);

    for (const [blockCss, level] of [[lightCss, 100], [darkCss, 20]]) {
        const p = lights.palette(level);

        for (const [key, name] of Object.entries(lights.CSS_VARS)) {
            assert(
                blockCss.includes(`${name}: ${p.colors[key]};`),
                `${name} at ${level}% should be ${p.colors[key]} (regenerate src/css/tokens/colors.css)`
            );
        }
    }
});

await check("robot levels are solvable with no unreachable squares", async () => {
    const vm = await import("node:vm");
    const code = await fs.readFile(path.join(root, "src", "js", "robot.js"), "utf8");
    const context = {
        window: { matchMedia: () => ({ matches: false }) },
        document: { querySelectorAll: () => [] }
    };

    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(code, context);

    const robot = context.window.BYUIRobot;
    const problems = [];

    for (const id of Object.keys(robot.LEVELS)) {
        try {
            robot.parseLevel(id);
        } catch (err) {
            problems.push(err.message);
        }
    }

    for (const [set, ids] of Object.entries(robot.SETS)) {
        for (const id of ids) {
            if (!robot.LEVELS[id]) {
                problems.push(`set "${set}" lists unknown level "${id}"`);
            }
        }
    }

    assert(problems.length === 0, problems.join("\n  "));
});

await check("external links open in a new tab", async () => {
    const www = path.join(root, "www");
    const pages = (await fs.readdir(www)).filter((f) => f.endsWith(".html"));
    const missing = [];

    for (const page of pages) {
        const html = await fs.readFile(path.join(www, page), "utf8");

        for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
            if (/href="https?:\/\//i.test(tag) && !(/target="_blank"/i.test(tag) && /rel="[^"]*noopener/i.test(tag))) {
                missing.push(`${page}: ${tag.slice(0, 90)}`);
            }
        }
    }

    assert(missing.length === 0, `${missing.length} external link(s) without target="_blank" rel="noopener":\n  ${missing.slice(0, 10).join("\n  ")}`);
});

await fs.rm(tmpRoot, { recursive: true, force: true });

if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
}

console.log("\nAll verify checks passed.");
