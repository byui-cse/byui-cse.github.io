/**
 * CSS bundling via lightningcss-cli (devDependency).
 * Always minify. Development also writes a sourcemap next to the output in www/
 * so DevTools can map back to sources.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Resolve the native lightningcss binary (avoid .cmd + shell on Windows).
 */
const resolveCli = async () => {
    try {
        const parent = pathToFileURL(path.join(repoRoot, "package.json")).href;
        const pkgJson = fileURLToPath(import.meta.resolve("lightningcss-cli/package.json", parent));
        const pkgDir = path.dirname(pkgJson);
        const binName = process.platform === "win32" ? "lightningcss.exe" : "lightningcss";
        const bin = path.join(pkgDir, binName);
        await fs.access(bin);
        return bin;
    } catch {
        return null;
    }
};

/**
 * @param {string[]} args
 */
const runCli = async (args) => {
    const bin = await resolveCli();

    if (!bin) {
        throw new Error(
            "lightningcss-cli not found. Run: pnpm add -D lightningcss-cli && pnpm approve-builds"
        );
    }

    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, {
            cwd: repoRoot,
            stdio: ["ignore", "pipe", "pipe"]
        });

        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += String(chunk);
        });

        child.on("error", reject);
        child.on("exit", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(stderr || `lightningcss exited with code ${code}`));
            }
        });
    });
};

/**
 * @param {object} options
 * @param {string} options.input
 * @param {string} options.output
 * @param {boolean} options.minify
 * @param {boolean} [options.sourceMap]
 */
export const buildCssBundle = async ({ input, output, minify, sourceMap = false }) => {
    try {
        await fs.mkdir(path.dirname(output), { recursive: true });

        const args = ["--bundle", input, "-o", output];

        if (minify) {
            args.push("--minify");
        }

        if (sourceMap) {
            args.push("--sourcemap");
        }

        await runCli(args);
    } catch (err) {
        const message = err?.message ?? String(err);
        const error = new Error(`CSS bundle failed for ${input}\n${message}`);
        error.code = "CSS_BUNDLE";
        throw error;
    }
};
