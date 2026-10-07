# BYU-Idaho CSE marketing site

Static marketing pages for Computer Science & Engineering. Source lives in `src/`; the custom builder writes the public site to `www/`.

## Commands

```bash
pnpm install
pnpm approve-builds    # allow lightningcss-cli native binary (once)
pnpm run build         # production -> www/
pnpm run dev           # local server + live reload + CSS source maps
pnpm run verify        # builder sanity checks
pnpm run review        # id every highlight, regenerate SITE-REVIEW.md
```

## Reviewing the site

[`SITE-REVIEW.md`](SITE-REVIEW.md) is a checklist for reviewers. Every yellow highlight (`<mark>`) and photo note (`.slot__note`) has a permanent `id="review-xxxxxx"`, and the checklist links straight to each one on the live site (`publicUrl` in `config.js`). A link scrolls to the item, outlines it, and opens its popup or FAQ answer if needed.

After adding or changing highlights, run `pnpm run review`. New items get ids, existing ids never change, and the checklist is rewritten. `pnpm run verify` fails if a highlight is missing an id or is not in the checklist.

- Dev server: `http://localhost:3000/`
- Config: [`config.js`](config.js)

## Layout

```text
config.js
lib/
  cli/build.js         pnpm run build / dev
  cli/verify.js        pnpm run verify
  load-config.js
  css.js
  includes.js
  ignore.js
  fs-plan.js
  server.js
src/
www/
```

## HTML includes

```html
<include src="header.html"
	title="Page title"
	description="Page description">
	<!-- optional: extra tags for document head only -->
	<meta property="og:type" content="website">
</include>

<main id="main">…</main>

<include src="footer.html"></include>
```

In templates, `{{title}}` / `{{description}}` / any matching attribute name are filled from the include (HTML-escaped). Kebab-case names work (`say-this-name` → `{{say-this-name}}`).

`{{head}}` is reserved: the include’s inner HTML is inserted raw where the template places it (use this only inside `<head>`).

Resolution order:

1. `./` or `../` relative to the including file (must stay under `src/`)
2. From `src/`
3. From `src/templates/` (`templatesDir` in config)

No conditionals or expressions; attribute placeholders and `{{head}}` only.

## Paths and deployment

The site is deployed to a subfolder on GitHub Pages, so **all local paths are relative**, never root-relative:

- Pages and templates: `href="computer-science.html"`, `src="js/nav.js"`, `href="css/main.css"` (not `/css/main.css`)
- CSS `url()`: relative to the built stylesheet `www/css/main.css`, e.g. `url("../fonts/…")`
- Pages live at the top level of `src/`. If a page is ever added in a subfolder, its links need `../`.

The same build then works on the dev server, GitHub Pages, or any other host or folder, with no hard-coded domain. `pnpm run verify` fails if a root-relative path sneaks back in.

## CSS

Bundled with **lightningcss-cli**.

- Always minified (`--minify`)
- Development also writes `www/css/main.css.map` so DevTools can map back to sources
- Production: no map
