/**
 * Expand custom <include src="..."> tags with optional attribute placeholders.
 *
 * Placeholders in the included file:
 * - {{name}} from matching include attributes (HTML-escaped). Name: [A-Za-z][A-Za-z0-9_-]*
 * - {{head}} reserved; raw inner HTML of the include tag (for extra <head> tags only)
 *
 * Resolution order:
 * 1. If src uses ./ or ../, resolve relative to the including file.
 * 2. Resolve from the configured source root.
 * 3. If still missing, try source/templatesDir/src.
 *
 * Paths must stay inside the source directory.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ATTR_NAME = "[A-Za-z][A-Za-z0-9_-]*";
const ATTR_RE = new RegExp(`\\b(${ATTR_NAME})\\s*=\\s*(["'])([\\s\\S]*?)\\2`, "g");
const PLACEHOLDER_RE = /\{\{([A-Za-z][A-Za-z0-9_-]*)\}\}/g;

/**
 * Find the next <include ...>...</include> starting at fromIndex.
 * Attribute values may contain `>` so do not stop the open tag at the first `>`.
 * @param {string} html
 * @param {number} fromIndex
 * @returns {{ start: number, end: number, attrText: string, headInner: string } | null}
 */
const findNextInclude = (html, fromIndex) => {
    const openRe = /<include\b/gi;
    openRe.lastIndex = fromIndex;
    const open = openRe.exec(html);

    if (!open) {
        return null;
    }

    const start = open.index;
    let i = openRe.lastIndex;
    /** @type {string | null} */
    let quote = null;

    while (i < html.length) {
        const ch = html[i];

        if (quote) {
            if (ch === quote) {
                quote = null;
            }
            i += 1;
            continue;
        }

        if (ch === '"' || ch === "'") {
            quote = ch;
            i += 1;
            continue;
        }

        if (ch === ">") {
            break;
        }

        i += 1;
    }

    if (i >= html.length || html[i] !== ">") {
        return null;
    }

    const attrText = html.slice(start + "<include".length, i);
    const innerStart = i + 1;
    const closeRe = /<\/include>/gi;
    closeRe.lastIndex = innerStart;
    const close = closeRe.exec(html);

    if (!close) {
        return null;
    }

    return {
        start,
        end: close.index + close[0].length,
        attrText,
        headInner: html.slice(innerStart, close.index)
    };
};

/**
 * @param {string} candidate
 * @param {string} sourceRoot
 */
const assertInsideSource = (candidate, sourceRoot) => {
    const resolved = path.resolve(candidate);
    const root = path.resolve(sourceRoot);
    const rel = path.relative(root, resolved);

    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        const error = new Error(
            `Include escapes source directory.\n  Resolved: ${resolved}\n  Source: ${root}`
        );
        error.code = "INCLUDE_ESCAPE";
        throw error;
    }

    return resolved;
};

/**
 * Decode common entities from raw attribute text, then escape for HTML text/attrs.
 * @param {string} value
 */
const unescapeAttr = (value) => {
    return value
        .replace(/&quot;/gi, '"')
        .replace(/&#0*39;/g, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&");
};

/**
 * @param {string} value
 */
export const escapeHtml = (value) => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
};

/**
 * @param {string} attrText
 * @returns {{ src: string | null, attrs: Record<string, string> }}
 */
export const parseIncludeAttributes = (attrText) => {
    /** @type {Record<string, string>} */
    const attrs = {};
    let src = null;
    const re = new RegExp(ATTR_RE.source, "g");
    let match = re.exec(attrText);

    while (match) {
        const name = match[1];
        const raw = match[3];

        if (name === "src") {
            src = raw;
        } else if (name !== "head") {
            attrs[name] = unescapeAttr(raw);
        }

        match = re.exec(attrText);
    }

    return { src, attrs };
};

/**
 * @param {string} fragment
 * @param {Record<string, string>} attrs
 * @param {string} headHtml
 * @param {string} fromFile
 */
export const applyIncludePlaceholders = (fragment, attrs, headHtml, fromFile) => {
    if (/\{\{title\}\}/.test(fragment) && !String(attrs.title ?? "").trim()) {
        const error = new Error(
            `Include requires a non-empty title attribute.\n  In: ${fromFile}`
        );
        error.code = "INCLUDE_TITLE";
        throw error;
    }

    return fragment.replace(PLACEHOLDER_RE, (_full, name) => {
        if (name === "head") {
            return headHtml;
        }

        const value = attrs[name];

        if (value === undefined || value === null) {
            return "";
        }

        return escapeHtml(value);
    });
};

/**
 * @param {object} options
 * @param {string} options.includeSrc
 * @param {string} options.fromFile
 * @param {string} options.sourceRoot
 * @param {string} options.templatesDir
 */
export const resolveIncludePath = async ({
    includeSrc,
    fromFile,
    sourceRoot,
    templatesDir
}) => {
    const tried = [];

    const tryPath = async (candidate) => {
        const safe = assertInsideSource(candidate, sourceRoot);
        tried.push(safe);

        try {
            await fs.access(safe);
            return safe;
        } catch {
            return null;
        }
    };

    const normalized = includeSrc.replace(/\\/g, "/");
    const isRelativeHint =
        normalized.startsWith("./") ||
        normalized.startsWith("../") ||
        normalized.includes("/../") ||
        normalized.includes("/./");

    if (isRelativeHint) {
        const fromDir = path.dirname(fromFile);
        const hit = await tryPath(path.resolve(fromDir, includeSrc));

        if (hit) {
            return hit;
        }
    }

    const fromSource = await tryPath(path.resolve(sourceRoot, includeSrc));

    if (fromSource) {
        return fromSource;
    }

    const alreadyUnderTemplates =
        normalized === templatesDir ||
        normalized.startsWith(`${templatesDir}/`);

    if (!alreadyUnderTemplates) {
        const fromTemplates = await tryPath(
            path.resolve(sourceRoot, templatesDir, includeSrc)
        );

        if (fromTemplates) {
            return fromTemplates;
        }
    }

    const error = new Error(
        `Missing include.\n  In: ${fromFile}\n  Requested: ${includeSrc}\n  Tried:\n    - ${tried.join("\n    - ")}`
    );
    error.code = "INCLUDE_MISSING";
    throw error;
};

/**
 * Expand include tags within an HTML string.
 * @param {object} options
 * @param {string} options.html
 * @param {string} options.fromFile
 * @param {string} options.sourceRoot
 * @param {string} options.templatesDir
 * @param {string[]} [options.chain]
 */
export const expandIncludesInHtml = async ({
    html,
    fromFile,
    sourceRoot,
    templatesDir,
    chain = []
}) => {
    let result = "";
    let cursor = 0;
    let found = findNextInclude(html, cursor);

    while (found) {
        result += html.slice(cursor, found.start);

        const { src: includeSrc, attrs } = parseIncludeAttributes(found.attrText);

        if (!includeSrc) {
            const error = new Error(
                `Include missing src attribute.\n  In: ${fromFile}`
            );
            error.code = "INCLUDE_MISSING_SRC";
            throw error;
        }

        const resolved = await resolveIncludePath({
            includeSrc,
            fromFile,
            sourceRoot,
            templatesDir
        });

        const expanded = await expandIncludes({
            filePath: resolved,
            sourceRoot,
            templatesDir,
            chain
        });

        const headHtml = await expandIncludesInHtml({
            html: found.headInner,
            fromFile,
            sourceRoot,
            templatesDir,
            chain
        });

        result += applyIncludePlaceholders(
            expanded,
            attrs,
            headHtml.trim() ? `${headHtml.trim()}\n` : "",
            fromFile
        );
        cursor = found.end;
        found = findNextInclude(html, cursor);
    }

    result += html.slice(cursor);
    return result;
};

/**
 * @param {object} options
 * @param {string} options.filePath
 * @param {string} options.sourceRoot
 * @param {string} options.templatesDir
 * @param {string[]} [options.chain]
 */
export const expandIncludes = async ({
    filePath,
    sourceRoot,
    templatesDir,
    chain = []
}) => {
    const absoluteFile = path.resolve(filePath);

    if (chain.includes(absoluteFile)) {
        const cycle = [...chain, absoluteFile].join(" -> ");
        const error = new Error(`Circular include detected:\n  ${cycle}`);
        error.code = "INCLUDE_CIRCULAR";
        throw error;
    }

    const html = await fs.readFile(absoluteFile, "utf8");
    const nextChain = [...chain, absoluteFile];

    return expandIncludesInHtml({
        html,
        fromFile: absoluteFile,
        sourceRoot,
        templatesDir,
        chain: nextChain
    });
};

/**
 * Inject live-reload client before </body>, or append if missing.
 * Uses EventSource (SSE) on the same origin.
 * @param {string} html
 * @param {{ path?: string }} [live]
 */
export const injectLiveReload = (html, live = {}) => {
    const livePath = live.path ?? "/__livereload";
    const script = `<script>
(function () {
  var url = ${JSON.stringify(livePath)};

  function connect() {
    var es = new EventSource(url);

    es.onmessage = function (event) {
      if (event.data === "reload") {
        location.reload();
      }
    };

    es.onerror = function () {
      if (es.readyState === EventSource.CLOSED) {
        es.close();
        setTimeout(connect, 1000);
      }
    };
  }

  connect();
})();
</script>`;

    if (/<\/body>/i.test(html)) {
        return html.replace(/<\/body>/i, `${script}\n</body>`);
    }

    return `${html}\n${script}\n`;
};
