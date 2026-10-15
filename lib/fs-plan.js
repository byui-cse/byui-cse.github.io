/**
 * Walk source tree: copy static files; collect HTML pages to process.
 */
import fs from "node:fs/promises";
import path from "node:path";

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const listFilesRecursive = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await listFilesRecursive(full)));
        } else if (entry.isFile()) {
            files.push(full);
        }
    }

    return files;
};

/**
 * @param {object} options
 * @param {string} options.source
 * @param {string} options.output
 * @param {(sourceRoot: string, abs: string) => boolean} options.isIgnored
 * @param {string[]} options.cssInputs absolute paths of CSS bundle inputs
 */
export const collectSourcePlan = async ({
    source,
    output,
    isIgnored,
    cssInputs
}) => {
    const allFiles = await listFilesRecursive(source);
    const cssInputSet = new Set(cssInputs.map((p) => path.resolve(p)));

    /** @type {string[]} */
    const htmlPages = [];
    /** @type {{ from: string, to: string }[]} */
    const copies = [];

    for (const file of allFiles) {
        if (isIgnored(source, file)) {
            continue;
        }

        if (cssInputSet.has(path.resolve(file))) {
            continue;
        }

        const rel = path.relative(source, file);

        if (file.toLowerCase().endsWith(".html")) {
            htmlPages.push(file);
            continue;
        }

        copies.push({
            from: file,
            to: path.join(output, rel)
        });
    }

    return { htmlPages, copies };
};

/**
 * @param {string} from
 * @param {string} to
 */
export const copyFile = async (from, to) => {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
};

/**
 * Remove output directory safely (only the configured output path).
 * @param {string} outputDir
 */
export const cleanOutput = async (outputDir) => {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
};
