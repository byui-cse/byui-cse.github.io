# Implement a Lightweight Static Site Builder

Implement a small, custom static site builder for this repository. Do not introduce Eleventy, Nunjucks, EJS, Liquid, Astro, Vite, React, or another general-purpose site framework. The site does not need template logic. It only needs to assemble reusable HTML fragments, bundle CSS, copy static files, and provide a simple development server with live reload.

Before changing files, inspect the existing repository structure and preserve the current site content, paths, naming conventions, and package-manager choice where possible.

## Goals

The source site lives under `src/` at the repository root. The built site must be written to `www/` at the repository root.

The builder must support:

1. Production builds that clean and rebuild `www/` from scratch.
2. Development mode with an initial build, a local HTTP server, file watching, incremental rebuilds, and browser live reload.
3. A configurable ignore list or glob pattern list.
4. Automatic copying of files and directories from `src/` unless they are ignored or processed specially.
5. Simple custom HTML includes with attribute placeholders and a reserved `{{head}}` slot (no conditionals, layouts, front matter, or general template language).
6. CSS bundling from CSS entry points that use modern CSS, including `@import` and `@layer`.

## Configuration

Create a clearly named configuration file, preferably `site.config.mjs`, unless the repository has an established configuration convention.

The configuration should support values equivalent to:

```js
export default {
    source: "src",
    output: "www",

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
        liveReloadPort: 35729,
        reloadDelay: 250,
        restartBackoff: 1000
    }
};
```

The exact shape may be adjusted to fit the repository, but these concepts must remain configurable.

The copy behavior should be default-allow:

> Copy everything under `src/` to the matching path under `www/` unless the path matches an ignore pattern or is a processed source file.

This means newly added images, fonts, downloads, JSON files, and other static files should work automatically without requiring a configuration change.

Markdown files are useful as repository notes but must not be copied to `www/` by default.

## HTML includes

Use a custom include tag:

```html
<include src="templates/header.html"
    title="About"
    description="About this site">
</include>

<main>
    <h1>About</h1>
</main>

<include src="templates/footer.html"></include>
```

During the build, replace each include tag with the contents of the referenced file.

Allowed placeholders in included files (no general template language):

- `{{name}}` from matching include attributes (HTML-escaped). Names: `[A-Za-z][A-Za-z0-9_-]*` (kebab-case OK).
- `{{head}}` reserved: raw inner HTML of the include tag. Place this only inside `<head>` for page-specific meta, link, or script tags.

Requirements:

- Includes may be nested.
- Include paths should resolve relative to the file containing the include, or follow one clearly documented repository-wide rule.
- Reject missing include files with a useful error containing the source file and requested include.
- Detect circular includes and report the include chain.
- Prevent includes from escaping the configured source directory.
- Do not add conditionals, expressions, or general template-language features beyond attribute placeholders and `{{head}}`.
- Do not copy the templates directory to `www/`.

HTML pages outside ignored directories should be assembled automatically. Preserve their relative paths. For example:

```text
src/index.html       -> www/index.html
src/about/index.html -> www/about/index.html
```

## CSS processing

CSS source directories must not be copied directly to `www/`.

For each configured CSS bundle:

- Use Lightning CSS if it is not already handled by an existing repository tool.
- Resolve and bundle `@import` dependencies.
- Preserve the authored behavior of `@layer`.
- Minify only in production mode unless the repository already has a different convention.
- Write the result to the configured output path.
- Report CSS errors with the input file and useful context.

Do not add Sass, PostCSS, Tailwind, or another CSS abstraction unless the existing repository already requires it.

## Production mode

Add a simple command such as:

```bash
npm run build
```

Production behavior:

1. Remove only the configured `www/` directory.
2. Recreate it.
3. Process HTML includes.
4. Build CSS bundles.
5. Copy all eligible files and directories from `src/`.
6. Do not inject the live reload script.
7. Fail with a nonzero exit code if any build step fails.

The production build must be deterministic and safe to run repeatedly.

## Development mode

Add a command such as:

```bash
npm run dev
```

Development behavior:

1. Perform a complete initial build.
2. Start a local HTTP server serving `www/`.
3. Watch the source directory for additions, changes, and deletions.
4. Rebuild only what is reasonably necessary:
   - HTML page or template change: rebuild affected HTML, or rebuild all HTML pages if dependency tracking is not worth the complexity.
   - CSS change: rebuild the affected CSS bundle.
   - Static asset change: copy, replace, or remove the corresponding file in `www/`.
   - Configuration change: restart or perform a complete rebuild.
5. Notify connected browsers after a successful rebuild.
6. Do not notify browsers after a failed rebuild. Print the error and keep the development process alive where practical.

For a small site, rebuilding all HTML pages when any HTML template changes is acceptable and preferred over complicated dependency graph logic.

## Live reload

Inject a live reload script automatically into generated HTML only in development mode. Do not require authors to place a tag in every page.

Inject the script immediately before `</body>`. If a page does not contain `</body>`, append the script to the end of the document.

The script should connect to a WebSocket on the configured live reload port and reload the current page after receiving a message such as `reload`.

Use a small debounce so multiple filesystem events caused by one editor save produce one rebuild and one browser reload.

### Restart backoff requirement

The local server may be stopped and started again by a student. The browser must not reload immediately during a short server restart window.

Implement both of the following:

1. Browser reconnect backoff:
   - If the WebSocket connection closes or fails, retry automatically.
   - Start with a short delay.
   - Increase the delay after repeated failures up to a reasonable maximum.
   - Reset the delay after a successful connection.
   - Do not show noisy uncaught errors in the browser console for normal server restarts.

2. Server-side reload delay:
   - Debounce file events.
   - Wait for the configured `restartBackoff` or equivalent delay before sending the reload message after a rebuild.
   - Coalesce additional changes during that window into one reload.

The goal is that stopping and immediately restarting the local server does not cause a reload loop or a confusing browser error. A normal edit should still reload promptly after the rebuild completes.

## Local HTTP server

Use Node's standard `http` module unless an existing server dependency is already present. The server should:

- Serve files from `www/`.
- Prevent path traversal outside `www/`.
- Return the correct basic content types.
- Serve `index.html` for directory requests.
- Print the local URL when it starts.
- Use the configured host and port.

Use a minimal WebSocket dependency only if the repository does not already have an appropriate implementation. Keep the server implementation small and readable.

## Dependencies

Prefer Node standard-library APIs for:

- File traversal
- File copying
- Directory creation
- HTML include expansion
- The local HTTP server

Use small focused dependencies only where they materially reduce complexity. A reasonable starting point is:

- `lightningcss-cli` for CSS bundling
- `picomatch` or an equivalent small glob matcher for ignore patterns
- `ws` for the development WebSocket

Do not add a full site framework or frontend framework.

## Commands

Provide simple package scripts, preferably:

```json
{
    "scripts": {
        "build": "node build.mjs --production",
        "dev": "node build.mjs --dev"
    }
}
```

Adjust the commands to match the existing package manager and repository conventions.

## Validation

Add focused tests or an executable verification path for at least:

- A page with a header and footer include.
- Nested includes.
- A missing include.
- A circular include.
- An include attempting to escape `src/`.
- An ignored Markdown file.
- A copied static asset.
- A CSS bundle containing `@import` and `@layer`.
- Production output without live reload code.
- Development output with live reload code.
- Multiple rapid file events producing one rebuild and one reload.
- WebSocket reconnect behavior when the development server is temporarily unavailable.
- Repeated clean production builds producing the same output.

Run the repository's existing checks, then run a production build and inspect the resulting `www/` directory.

## Implementation principles

- Keep the implementation understandable to students who are learning web tooling.
- Prefer explicit code over clever abstractions.
- Keep configuration small and documented.
- Do not add features that are not required by this prompt.
- Preserve existing content and URLs.
- Use four spaces for indentation in JavaScript, JSON, and HTML examples.
- Provide a short README section explaining the source structure and the `npm run build` and `npm run dev` commands.

At the end, report:

1. Files created or changed.
2. Dependencies added.
3. Commands to build and develop the site.
4. Any assumptions or limitations.
5. The verification commands that passed.
