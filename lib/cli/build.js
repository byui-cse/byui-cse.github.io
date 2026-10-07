/**
 * Lightweight static site builder.
 *
 *   pnpm run build   production -> www/
 *   pnpm run dev     watch + local server + live reload
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { watch } from "node:fs";

import { loadConfig } from "../load-config.js";
import { createIgnoreMatcher } from "../ignore.js";
import { expandIncludes, injectLiveReload } from "../includes.js";
import { buildCssBundle } from "../css.js";
import { cleanOutput, collectSourcePlan, copyFile } from "../fs-plan.js";
import { startStaticServer } from "../server.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const args = new Set(process.argv.slice(2));
const isDev = args.has("--dev");
const isProduction = args.has("--production") || !isDev;

/**
 * @param {Awaited<ReturnType<typeof loadConfig>>} config
 * @param {{ liveReload: boolean, quiet?: boolean }} options
 */
const buildOnce = async (config, options) => {
    const quiet = Boolean(options.quiet);
    const isIgnored = createIgnoreMatcher(config.ignore);

    await cleanOutput(config.output);

    const { htmlPages, copies } = await collectSourcePlan({
        source: config.source,
        output: config.output,
        isIgnored,
        cssInputs: config.cssBundles.map((bundle) => {
            return bundle.input;
        })
    });

    for (const bundle of config.cssBundles) {
        await buildCssBundle({
            input: bundle.input,
            output: bundle.output,
            minify: true,
            sourceMap: isDev
        });

        if (!quiet) {
            console.log(
                `CSS  ${path.relative(rootDir, bundle.input)} -> ${path.relative(rootDir, bundle.output)}`
            );
        }
    }

    for (const page of htmlPages) {
        let html = await expandIncludes({
            filePath: page,
            sourceRoot: config.source,
            templatesDir: config.templatesDir
        });

        if (options.liveReload) {
            html = injectLiveReload(html);
        }

        const rel = path.relative(config.source, page);
        const outFile = path.join(config.output, rel);
        await fs.mkdir(path.dirname(outFile), { recursive: true });
        await fs.writeFile(outFile, html, "utf8");

        if (!quiet) {
            console.log(`HTML ${rel}`);
        }
    }

    for (const item of copies) {
        await copyFile(item.from, item.to);
    }

    if (!quiet && copies.length > 0) {
        console.log(`Copied ${copies.length} static file(s)`);
    }
};

/**
 * @param {() => Promise<void>} fn
 * @param {number} waitMs
 */
const debounce = (fn, waitMs) => {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timer = null;
    let running = false;
    let pending = false;

    const run = async () => {
        if (running) {
            pending = true;
            return;
        }

        running = true;

        try {
            await fn();
        } finally {
            running = false;

            if (pending) {
                pending = false;
                run();
            }
        }
    };

    return () => {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            timer = null;
            run();
        }, waitMs);
    };
};

const main = async () => {
    const config = await loadConfig(rootDir);

    if (isDev) {
        await buildOnce(config, { liveReload: true, quiet: true });
        const { broadcast } = await startStaticServer({
            root: config.output,
            host: config.dev.host,
            port: config.dev.port
        });

        const rebuildAndReload = debounce(async () => {
            try {
                await buildOnce(config, { liveReload: true, quiet: true });
                await new Promise((resolve) => {
                    setTimeout(resolve, config.dev.restartBackoff);
                });
                broadcast("reload");
                console.log("Rebuild Complete.");
            } catch (err) {
                console.error(err?.message ?? err);
            }
        }, config.dev.reloadDelay);

        /** @type {import('node:fs').FSWatcher[]} */
        const watchers = [];

        /**
         * Watch a directory tree. Recursive watch is flaky on some Windows setups,
         * so also attach watchers to each subdirectory.
         * @param {string} dir
         */
        const watchTree = async (dir) => {
            try {
                watchers.push(
                    watch(dir, { recursive: true }, () => {
                        rebuildAndReload();
                    })
                );
            } catch {
                watchers.push(
                    watch(dir, () => {
                        rebuildAndReload();
                    })
                );

                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        await watchTree(path.join(dir, entry.name));
                    }
                }
            }
        };

        await watchTree(config.source);

        watchers.push(
            watch(path.join(rootDir, "config.js"), () => {
                rebuildAndReload();
            })
        );

        process.on("SIGINT", () => {
            for (const watcher of watchers) {
                watcher.close();
            }
            process.exit(0);
        });
        return;
    }

    console.log("Production Build…");
    await buildOnce(config, { liveReload: false, quiet: false });
    console.log("Build Complete.");
};

main().catch((err) => {
    console.error(err?.message ?? err);
    process.exit(1);
});
