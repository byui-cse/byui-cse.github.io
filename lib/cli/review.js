/**
 * Review checklist generator.
 *
 *   pnpm run review
 *
 * 1. Gives every <mark> highlight and every photo/video note (.slot__note) in src/
 *    a permanent id such as id="review-3fa91c". Existing ids are never changed,
 *    so links in review copies people already filled out keep working.
 * 2. Writes SITE-REVIEW.md at the repo root: a checklist that links each item
 *    to its exact spot on the live site (config.js -> publicUrl).
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = path.join(root, "src");
const templates = path.join(src, "templates");
const outFile = path.join(root, "SITE-REVIEW.md");

const config = (await import(`${pathToFileURL(path.join(root, "config.js")).href}?t=${Date.now()}`)).default;
const publicUrl = String(config.publicUrl || "").replace(/\/?$/, "/");

if (!config.publicUrl) {
    throw new Error("Add publicUrl to config.js (the live site address) so review links work.");
}

/* Page names in the order the checklist lists them. */
const PAGES = [
    ["index.html", "Home"],
    ["computer-science.html", "Computer Science"],
    ["software-engineering.html", "Software Engineering"],
    ["projects.html", "Student Work"],
    ["life.html", "Life Here"],
    ["families.html", "For Families"],
    ["challenges.html", "Challenges"]
];

/* How to reach items that live inside a popup. Links open the popup automatically. */
const POPUPS = {
    "learn-lights": "Inside the Lights popup (header Lights button, then How Does This Work?)",
    "learn-robot": "Inside the robot game popup (How to Build This)",
    "learn-robot-search": "Inside the robot search popup (Computer Science page, Watch the Computer Solve It, then What You Just Saw)"
};

/* Popups whose opening button lives on one specific page. */
const POPUP_PAGES = {
    "learn-robot-search": "computer-science.html"
};

const SHARED = {
    "header.html": "Shared on every page (header)",
    "footer.html": "Shared on every page (footer)",
    "already-student.html": "Shared on Computer Science and Software Engineering",
    "learn-robot.html": "Shared on Home, Computer Science, and Challenges"
};

const decode = (text) => text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&rarr;/g, "→")
    .replace(/&ldquo;|&rdquo;/g, "\"")
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&ndash;/g, "–")
    .replace(/&times;/g, "×")
    .replace(/\s+/g, " ")
    .trim();

const lastMatch = (text, pattern) => {
    let found = null;

    for (const m of text.matchAll(pattern)) {
        found = m;
    }

    return found;
};

/* ---------- 1. Assign ids ---------- */

const listHtml = async (dir) => (await fs.readdir(dir))
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.join(dir, f));

const files = [...await listHtml(src), ...await listHtml(templates)];
const usedIds = new Set();
const sources = new Map();

for (const file of files) {
    const text = await fs.readFile(file, "utf8");

    sources.set(file, text);

    for (const [, id] of text.matchAll(/\bid="(review-[a-f0-9]+)"/g)) {
        usedIds.add(id);
    }
}

const TARGETS = /<mark\b([^>]*)>|<p class="slot__note"([^>]*)>/g;
let added = 0;

for (const file of files) {
    const rel = path.relative(src, file).replace(/\\/g, "/");
    let index = 0;

    const next = sources.get(file).replace(TARGETS, (tag, markAttrs, slotAttrs) => {
        const attrs = markAttrs ?? slotAttrs ?? "";

        index += 1;

        if (/\bid="/.test(attrs)) {
            return tag;
        }

        let salt = 0;
        let id;

        do {
            const hash = crypto.createHash("sha1").update(`${rel}|${index}|${salt}`).digest("hex").slice(0, 6);

            id = `review-${hash}`;
            salt += 1;
        } while (usedIds.has(id));

        usedIds.add(id);
        added += 1;

        return tag.replace(/>$/, ` id="${id}">`);
    });

    if (next !== sources.get(file)) {
        await fs.writeFile(file, next);
        sources.set(file, next);
    }
}

/* ---------- 2. Collect items ---------- */

const pageFor = (rel) => {
    if (!rel.startsWith("templates/")) {
        return rel;
    }

    const name = path.basename(rel);

    for (const [page] of PAGES) {
        if (sources.get(path.join(src, page))?.includes(`<include src="${name}"`)) {
            return page;
        }
    }

    return "index.html";
};

const items = [];

for (const file of files) {
    const rel = path.relative(src, file).replace(/\\/g, "/");
    const text = sources.get(file);
    const pattern = /<mark\b([^>]*)>([\s\S]*?)<\/mark>|<p class="slot__note"([^>]*)>([\s\S]*?)<\/p>/g;

    for (const m of text.matchAll(pattern)) {
        const isMark = m[1] !== undefined;
        const attrs = isMark ? m[1] : m[3];
        const body = isMark ? m[2] : m[4];
        const id = attrs.match(/\bid="([^"]+)"/)[1];
        const before = text.slice(0, m.index);
        const section = lastMatch(before, /<h2\b[^>]*>([\s\S]*?)<\/h2>/g);
        const sub = lastMatch(before.slice(section ? section.index : 0), /<(h3|summary)\b[^>]*>([\s\S]*?)<\/\1>/g);
        const dialog = lastMatch(before, /<dialog\b[^>]*id="([^"]+)"/g);
        const dialogClosed = dialog && before.lastIndexOf("</dialog>") > dialog.index;
        const note = isMark ? attrs.match(/data-verify="([^"]*)"/)?.[1] : null;
        const strong = isMark ? null : body.match(/<strong>([\s\S]*?)<\/strong>/)?.[1];

        let where = [section && decode(section[1]), sub && decode(sub[2])]
            .filter((v, i, all) => v && all.indexOf(v) === i && v !== decode(body))
            .join(" › ");

        /* Photo spots at the top of a card: name the card they belong to. */
        if (!isMark) {
            const after = text.slice(m.index + m[0].length, m.index + m[0].length + 900);
            const card = after.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/);

            if (card && !after.slice(0, card.index).includes("</article>") && after.slice(0, card.index).includes("project-card__body")) {
                where = `Card: ${decode(card[1])}`;
            }
        }

        if (dialog && !dialogClosed && POPUPS[dialog[1]]) {
            where = POPUPS[dialog[1]];
        }

        const popup = dialog && !dialogClosed ? dialog[1] : null;

        items.push({
            id,
            rel,
            page: POPUP_PAGES[popup] || pageFor(rel),
            shared: SHARED[path.basename(rel)] || null,
            kind: isMark ? "mark" : /^Reserved Space/i.test(decode(strong || "")) ? "activity" : "media",
            where,
            text: isMark ? decode(body) : decode(body.replace(/<strong>[\s\S]*?<\/strong>/, "")),
            label: isMark ? note : decode(strong || "Media needed")
        });
    }
}

/* ---------- 3. Write SITE-REVIEW.md ---------- */

const pageName = Object.fromEntries(PAGES);
const link = (page, id) => `${publicUrl}${page === "index.html" ? "" : page}${id ? `#${id}` : ""}`;
const today = new Date().toISOString().slice(0, 10);
const marks = items.filter((i) => i.kind === "mark");
const media = items.filter((i) => i.kind === "media");
const activities = items.filter((i) => i.kind === "activity");

const lines = [];
const out = (s = "") => lines.push(s);

out("# CSE Website Review Checklist");
out();
out(`Live site: ${publicUrl}`);
out();
out(`*Generated ${today} by \`pnpm run review\`. ${marks.length} highlights to check, ${media.length} photo and video spots, plus page-by-page feedback.*`);
out();
out("## How to Use This");
out();
out("1. **Make a copy** of this file and add your name to the file name, for example `SITE-REVIEW-jane.md`.");
out("2. **Open each link.** It jumps straight to that spot on the live site and outlines it. Items inside a popup open the popup for you.");
out("3. **Check the box** next to each item you review, then mark `Correct as written` or `Needs a change` (put an `x` in the brackets: `[x]`). Add corrections or comments on the `Notes:` line. Skip anything you are not sure about.");
out("4. **Add any other feedback** in the page-by-page and general sections at the bottom. Short notes are perfect.");
out("5. **Email your copy back** to the site lead. Every reviewer's file will be combined before the next update.");
out();
out("Do as much or as little as you like. Every comment helps.");
out();
out("**Reviewer:** ");
out();
out("**Date:** ");
out();
out("**Role or office (optional):** ");
out();
out("### What the Yellow Highlights Mean");
out();
out("Yellow highlights mark text that is unverified or still needs content. Each item below says what to check. You do not need to know every answer. \"I think this is right\" or \"ask the Registrar\" is useful too.");
out();

out("## Part 1: Highlights to Check");
out();

for (const [page, name] of PAGES) {
    const group = marks.filter((i) => i.page === page);

    if (!group.length) {
        continue;
    }

    out(`### ${name}`);
    out();
    out(`Page: ${link(page)}`);
    out();

    for (const item of group) {
        out(`- [ ] **[${item.id.replace("review-", "")}](${link(item.page, item.id)})** · ${item.where || name}${item.shared ? ` *(${item.shared})*` : ""}`);
        out(`  - Highlighted: "${item.text}"`);

        if (item.label) {
            out(`  - Check: ${item.label}`);
        }

        out("  - [ ] Correct as written");
        out("  - [ ] Needs a change (say what in Notes)");
        out("  - Notes: ");
        out();
    }
}

out("## Part 2: Photos and Video We Need");
out();
out("These spots are waiting for real, approved photos or video. If you have one, know who might, or have an idea, add a note.");
out();

for (const [page, name] of PAGES) {
    const group = media.filter((i) => i.page === page);

    if (!group.length) {
        continue;
    }

    out(`### ${name}`);
    out();

    for (const item of group) {
        out(`- [ ] **[${item.id.replace("review-", "")}](${link(item.page, item.id)})** · ${item.label}${item.text ? `: ${item.text}` : ""}${item.where && item.where.startsWith("Card:") ? ` (${item.where})` : ""}`);
        out("  - Notes: ");
    }

    out();
}

if (activities.length) {
    out("### Interactive Activities Still to Build");
    out();
    out("These spaces are reserved for activities that are planned but not built yet. Ideas welcome.");
    out();

    for (const item of activities) {
        out(`- [ ] **[${item.id.replace("review-", "")}](${link(item.page, item.id)})** · ${pageName[item.page]}: ${item.text}`);
        out("  - Notes: ");
    }

    out();
}

out("## Part 3: Page-by-Page Feedback");
out();
out("Anything goes: Wording that feels off, a fact that is wrong, a section that should move, something that is missing, or something you love.");
out();

for (const [page, name] of PAGES) {
    out(`### ${name}`);
    out();
    out(`Page: ${link(page)}`);
    out();
    out("- First impression: ");
    out("- What works: ");
    out("- What to change: ");
    out();
}

out("## Part 4: General Feedback");
out();
out("- **Message:** Does the site make you want to study Computer Science or Software Engineering here? Does it keep people front and center? ");
out("- **Tone and wording:** Anything that sounds off, too casual, too formal, or not like BYU-Idaho? ");
out("- **Robot game and Lights control:** Easy to figure out? Any bugs? ");
out("- **Phone:** Anything hard to read or tap on your phone? ");
out("- **Accessibility:** Anything hard to read, see, or use with a keyboard or screen reader? ");
out("- **Missing:** What should the site say that it does not? ");
out("- **Anything else:** ");
out();
out("---");
out();
out("*Thank you for helping. Please email your completed copy back to the site lead.*");
out();

await fs.writeFile(outFile, lines.join("\n"));

console.log(`Review ids added: ${added}`);
console.log(`Wrote ${path.relative(root, outFile)}: ${marks.length} highlights, ${media.length} media spots`);
