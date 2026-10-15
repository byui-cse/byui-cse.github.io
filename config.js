/**
 * Static site builder configuration.
 *
 * Copy is default-allow: everything under `source` is copied to `output`
 * unless ignored or processed (HTML includes, CSS bundles, templates).
 *
 * Include resolution (see lib/html/includes.js):
 * 1. Paths with `../` or `./` resolve relative to the including file.
 * 2. Otherwise resolve from the configured `source` root.
 * 3. If still missing, try under `templatesDir` (so `header.html` works).
 */
export default {
    source: "src",
    output: "www",

    /** Directory (under source) for reusable fragments. Not copied to output. */
    templatesDir: "templates",

    ignore: [
        "**/*.md",
        "**/*.njk",
        "**/templates/**",
        "**/css/**"
    ],

    cssBundles: [
        {
            input: "src/css/main.css",
            output: "www/css/main.css"
        }
    ],


    dev: {
        host: "localhost",
        port: 3000,
        reloadDelay: 250,
        restartBackoff: 1000
    }
};
