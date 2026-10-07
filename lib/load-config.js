/**
 * Load and normalize config.js paths relative to the repo root.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @param {string} rootDir
 */
export const loadConfig = async (rootDir) => {
    const configPath = path.join(rootDir, "config.js");
    const mod = await import(`${pathToFileURL(configPath).href}?t=${Date.now()}`);
    const raw = mod.default;

    if (!raw || typeof raw !== "object") {
        throw new Error("config.js must export a default object");
    }

    const source = path.resolve(rootDir, raw.source ?? "src");
    const output = path.resolve(rootDir, raw.output ?? "www");
    const templatesDir = raw.templatesDir ?? "templates";

    return {
        rootDir,
        source,
        output,
        templatesDir,
        ignore: Array.isArray(raw.ignore) ? raw.ignore : [],
        cssBundles: (raw.cssBundles ?? []).map((bundle) => {
            return {
                input: path.resolve(rootDir, bundle.input),
                output: path.resolve(rootDir, bundle.output)
            };
        }),
        dev: {
            host: raw.dev?.host ?? "localhost",
            port: Number(raw.dev?.port ?? 3000),
            reloadDelay: Number(raw.dev?.reloadDelay ?? 250),
            restartBackoff: Number(raw.dev?.restartBackoff ?? 1000)
        }
    };
};
