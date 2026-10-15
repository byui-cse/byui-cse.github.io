# BYU-Idaho Computer Science & Software Engineering Website

The public website for Computer Science and Software Engineering at the [BYU-Idaho Department of Computer Science & Engineering](https://www.byui.edu/computer-science-engineering/).

**Live site:** [byui-cse.github.io](https://byui-cse.github.io/)

---

## Just Visiting?

If you found this repository while exploring the department, start here:

| I want to... | Start here |
| --- | --- |
| See the website itself | [Open the live site](https://byui-cse.github.io/) |
| Learn about CSE programs, faculty, and opportunities | [BYU-Idaho Computer Science & Engineering](https://www.byui.edu/computer-science-engineering/) |
| Browse every public department repository | [View all repositories](https://github.com/orgs/byui-cse/repositories) |
| Find course code and assignments | [Search repositories for a course](https://github.com/search?q=org%3Abyui-cse+course&type=repositories) |
| See student and capstone work | [Search repositories for projects](https://github.com/search?q=org%3Abyui-cse+project&type=repositories) |
| Watch student demos and interviews | [BYU-Idaho CSE on YouTube](https://www.youtube.com/@byui-cse) |

If you are an online BYU-Pathway student in the Software Development program, see [BYU-Pathway Software Development](https://www.byupathway.edu/bachelors-degree/software-development).

Questions and suggestions are welcome in this repository's issues.

---

## Maintaining the Site

For developers, faculty, and staff who update the website. Everything below assumes you will edit files in `src/` and let the builder produce the public site in `www/`.

### Quick Start

```bash
pnpm install
pnpm approve-builds    # allow the lightningcss-cli native binary (once)
pnpm run dev           # local server with live reload at http://localhost:3000/
pnpm run build         # production build -> www/
pnpm run verify        # sanity checks; run before every commit
```

Settings live in [`config.js`](config.js).

### Where Things Live

```text
src/
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

### Common Content Updates

- **Change copy:** edit the page in `src/`. Keep headings and buttons in Chicago title case, use short sentences, and avoid em dashes.
- **Facts that can change** (tuition, salaries, meeting times, course numbers): check the official source and update the hidden `<!-- Source checked ... -->` comment next to the claim. Verified sources are listed in [`SITE_APPROVED.md`](SITE_APPROVED.md).
- **Photos:** add the file to `src/images/` (about 1440px wide, compressed) and point an `<img class="slot__media">` at it inside a `data-media-cycle` spot. Two images in one spot switch every 3 seconds.
- **Videos:** use a CSE YouTube video in a `data-media-cycle="video"` spot. Videos skip their first and last 30 seconds, loop, and switch every 10 seconds when a spot has two.
- **Four-year plan:** edit `src/templates/four-year-path.html` against the official course plans for the current catalog year.
- **Games:** levels are plain data at the top of `src/js/robot.js` and `src/js/puzzles.js`.

`pnpm run verify` fails if a review highlight (`<mark>`, `data-verify`, `slot__note`) is left on a page, so placeholders cannot ship by accident.

### HTML Includes

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
3. From `src/templates/` (`templatesDir` in config)

No conditionals or expressions; attribute placeholders and `{{head}}` only.

### Paths and Deployment

The site is deployed to a subfolder on GitHub Pages, so **all local paths are relative**, never root-relative:

- Pages and templates: `href="computer-science.html"`, `src="js/nav.js"`, `href="css/main.css"` (not `/css/main.css`)
- CSS `url()`: relative to the built stylesheet `www/css/main.css`, e.g. `url("../fonts/…")`
- Pages live at the top level of `src/`. If a page is ever added in a subfolder, its links need `../`.

The same build works on the dev server, GitHub Pages, or any other host or folder with no hard-coded domain. `pnpm run verify` fails if a root-relative path sneaks back in.

### CSS

Bundled with **lightningcss-cli**.

- Always minified (`--minify`)
- Development also writes `www/css/main.css.map` so DevTools can map back to sources
- Production: no source map
