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
 *
 * Layout: src/index.html + src/css/styles.css are the original landing page
 * (copied as-is); the CS & SE site lives in src/cs-se/.
 */
export default {
    source: "src",
    output: "www",

    /** Directory (under source) for reusable fragments. Not copied to output. */
    templatesDir: "cs-se/templates",

    ignore: [
        "**/*.md",
        "**/*.njk",
        "**/templates/**",
        "cs-se/css/**"
    ],

    cssBundles: [
        {
            input: "src/cs-se/css/main.css",
            output: "www/cs-se/css/main.css"
        }
    ],


    dev: {
        host: "localhost",
        port: 3000,
        reloadDelay: 250,
        restartBackoff: 1000
    }
};
