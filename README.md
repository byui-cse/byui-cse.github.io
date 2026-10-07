# BYU-Idaho CSE marketing site

Static marketing pages for Computer Science & Engineering. Source lives in `src/`; the custom builder writes the public site to `www/`.

## Commands

```bash
pnpm install
pnpm approve-builds    # allow lightningcss-cli native binary (once)
pnpm run build         # production -> www/
pnpm run dev           # local server + live reload + CSS source maps
pnpm run verify        # builder sanity checks
```

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
## CSS

Bundled with **lightningcss-cli**.

- Always minified (`--minify`)
- Development also writes `www/css/main.css.map` so DevTools can map back to sources
- Production: no map
