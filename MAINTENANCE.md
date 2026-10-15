# Maintaining the Site

For developers, faculty, and staff who update the website. Everything below assumes you will edit files in `src/` and let the builder produce the public site in `www/`.

For now the original department landing page stays at the site root and the Computer Science & Software Engineering site lives in a subfolder:

| Live URL | Source | Build output |
| --- | --- | --- |
| https://byui-cse.github.io/ | `src/index.html`, `src/css/styles.css` (plain files, copied as-is) | `www/` |
| https://byui-cse.github.io/cs-se/ | `src/cs-se/` | `www/cs-se/` |

## Quick Start

```bash
pnpm install
pnpm approve-builds    # allow the lightningcss-cli native binary (once)
pnpm run dev           # local server with live reload at http://localhost:3000/ (CS & SE at /cs-se/)
pnpm run build         # production build -> www/ and www/cs-se/
pnpm run verify        # sanity checks; run before every commit
```

Settings live in [`config.js`](config.js).

## Where Things Live

```text
src/
  index.html          original landing page (links to cs-se/)
  css/styles.css      landing page styles (not bundled)
src/cs-se/
  *.html              one file per page (home, majors, student work, life, families, challenges)
  templates/          shared pieces: header, footer, four-year plan, popups
  css/                tokens -> base -> layout -> components -> utilities (bundled into one file)
  js/
    nav.js            menu, FAQs, current page
    lights-*.js       the "Lights" brightness dimmer and Learn popups
    media-slots.js    A|B photo and video spots that switch on their own
    robot.js          robot path puzzle
    puzzles.js        Circuit Builder, Security Puzzles, Flip the Bits
    path-toggle.js    Computer Science / Software Engineering four-year plan switch
  images/             site photos and illustrations
docs/                 content plan, research notes, and copy guidance
SITE_APPROVED.md      verified facts and approved media sources
lib/                  the custom static builder (build, dev server, verify)
www/                  build output; never edit by hand
```

## Common Content Updates

- **Change copy:** edit the page in `src/cs-se/`. Keep headings and buttons in Chicago title case, use short sentences, and avoid em dashes.
- **Facts that can change** (tuition, salaries, meeting times, course numbers): check the official source and update the hidden `<!-- Source checked ... -->` comment next to the claim. Verified sources are listed in [`SITE_APPROVED.md`](SITE_APPROVED.md).
- **Photos:** add the file to `src/cs-se/images/` (about 1440px wide, compressed) and point an `<img class="slot__media">` at it inside a `data-media-cycle` spot. Two images in one spot switch every 3 seconds.
- **Videos:** use a CSE YouTube video in a `data-media-cycle="video"` spot. Videos skip their first and last 30 seconds, loop, and switch every 10 seconds when a spot has two.
- **Four-year plan:** edit `src/cs-se/templates/four-year-path.html` against the official course plans for the current catalog year.
- **Games:** levels are plain data at the top of `src/cs-se/js/robot.js` and `src/cs-se/js/puzzles.js`.

`pnpm run verify` fails if a review highlight (`<mark>`, `data-verify`, `slot__note`) is left on a page, so placeholders cannot ship by accident.

## HTML Includes

```html
<include src="header.html"
	title="Page title"
	description="Page description">
	<!-- optional: extra tags for the document head only -->
	<meta property="og:type" content="website">
</include>

<main id="main">…</main>

<include src="footer.html"></include>
```

In templates, `{{title}}`, `{{description}}`, or any matching attribute name is filled from the include (HTML-escaped). Kebab-case names work (`say-this-name` → `{{say-this-name}}`).

`{{head}}` is reserved: the include's inner HTML is inserted raw where the template places it (use it only inside `<head>`).

Resolution order:

1. `./` or `../` relative to the including file (must stay under `src/`)
2. From `src/`
3. From `src/cs-se/templates/` (`templatesDir` in config)

No conditionals or expressions; attribute placeholders and `{{head}}` only.

## Paths and Deployment

The site is deployed to a subfolder on GitHub Pages, so **all local paths are relative**, never root-relative:

- Pages and templates: `href="computer-science.html"`, `src="js/nav.js"`, `href="css/main.css"` (not `/css/main.css`)
- CSS `url()`: relative to the built stylesheet `www/cs-se/css/main.css`, e.g. `url("../fonts/…")`
- Pages live at the top level of `src/cs-se/`. If a page is ever added in a subfolder, its links need `../`.

The same build works on the dev server, GitHub Pages, or any other host or folder with no hard-coded domain. `pnpm run verify` fails if a root-relative path sneaks back in.

## CSS

Bundled with **lightningcss-cli**.

- Always minified (`--minify`)
- Development also writes `www/cs-se/css/main.css.map` so DevTools can map back to sources
- Production: no source map
