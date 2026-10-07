/**
 * Simple ignore matching for the few globs we actually use.
 * Supports **, *, and ? without a glob package.
 */
import path from "node:path";

/**
 * Convert a glob to a RegExp. `**` may match zero path segments.
 * @param {string} pattern
 */
const globToRegExp = (pattern) => {
    let i = 0;
    let out = "^";

    while (i < pattern.length) {
        const ch = pattern[i];

        if (ch === "*" && pattern[i + 1] === "*") {
            if (pattern[i + 2] === "/") {
                out += "(?:.*/)?";
                i += 3;
                continue;
            }

            out += ".*";
            i += 2;
            continue;
        }

        if (ch === "*") {
            out += "[^/]*";
            i += 1;
            continue;
        }

        if (ch === "?") {
            out += "[^/]";
            i += 1;
            continue;
        }

        if ("+.^${}()|[]\\".includes(ch)) {
            out += `\\${ch}`;
        } else {
            out += ch;
        }

        i += 1;
    }

    out += "$";
    return new RegExp(out);
};

/**
 * @param {string[]} patterns
 */
export const createIgnoreMatcher = (patterns) => {
    const matchers = patterns.map((pattern) => {
        return globToRegExp(pattern);
    });

    /**
     * @param {string} sourceRoot
     * @param {string} absolutePath
     */
    return (sourceRoot, absolutePath) => {
        const relative = path.relative(sourceRoot, absolutePath).split(path.sep).join("/");

        if (relative.startsWith("..")) {
            return true;
        }

        return matchers.some((re) => {
            return re.test(relative);
        });
    };
};
