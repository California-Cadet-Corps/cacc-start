# WS-M — Ribbon images instead of solid colors

- Branch: ws/ribbon-images
- PR title: [ws/ribbon-images] WS-M-ribbon-images: render ribbons as images sourced from cacadets.org
- Depends on: (none)

## Problem

Product owner, verbatim:

> change the ribbons from solid colors to actual pictures of the ribbons and take the pictures from the California Cadet Corp website

## Root cause / Investigation

This repository is currently a scaffold/placeholder, and **no ribbon feature exists yet**:

- `grep -rin "ribbon"` across `src/`, `test/`, and `docs/` returns **zero matches** — there is no ribbon list, no solid-color ribbon swatches, and no ribbon data anywhere.
- The only served page is the placeholder landing page at `src/public/index.html` (lines 1–32). It contains a single `<main>` with a heading and three `<p>` elements (`src/public/index.html:18–25`). The only colors present are the page background/foreground in the inline `<style>` (`src/public/index.html:12`). None of these represent ribbons.
- `src/server.js` is a zero-dependency static file server. It already serves anything placed under `src/public/`, and its MIME map already covers `.svg` (`src/server.js:20`), `.png` (`src/server.js:21`), and `.ico` (`src/server.js:22`), so image assets will be served correctly with no server change required.
- `.gitattributes` already marks `*.png` and `*.jpg` as `binary` (lines 14–15), so committed ribbon raster images will not be line-ending normalized.

Conclusion: the requirement presupposes ribbons currently shown as solid colors, but that prior state does not exist in this codebase. The deliverable is therefore to **introduce a ribbons display that uses actual ribbon pictures (sourced from the California Cadet Corps website) rather than solid color swatches**, served as static assets through the existing server. The "solid colors → pictures" change is satisfied by ensuring the ribbon display is image-based from the outset. This gap should be confirmed with the product owner if a pre-existing solid-color ribbon view was expected elsewhere.

## Scope

- `src/public/ribbons/` (new directory) — ribbon image assets sourced from the California Cadet Corps website (https://cacadets.org / start.cacadets.org). Use the actual ribbon graphics (e.g. `.png` or `.svg`), one file per ribbon, named in kebab-case after each ribbon. Confirm the images are CACC's own and permitted for use; record the source URL(s) in a short `src/public/ribbons/SOURCES.md`.
- `src/public/index.html` — add a ribbons section that renders each ribbon as an `<img>` referencing the files under `ribbons/`, each with descriptive `alt` text (the ribbon name). Replace any solid-color swatch markup with the image-based markup. Keep the existing inline `<style>` approach; add minimal layout/grid styling for the ribbon images. Do not introduce a build step or new dependency.
- `src/server.js` — no change expected; verify `.svg`/`.png` MIME entries (lines 20–21) cover whatever image format is chosen. Add a MIME entry only if a different format (e.g. `.jpg`/`.webp`) is used.
- `test/server.test.js` — add a test asserting that at least one ribbon image asset is served with a 200 and an image `Content-Type`, and that `GET /` returns markup containing a ribbon `<img>` (e.g. `assert.match(text, /ribbons\//)`). Follow the existing test style (listen on port 0, `fetch`, close).

## Acceptance / DoD

- `npm run build` (placeholder no-op) and `npm run lint` pass; `npm test` passes including the new ribbon assertions.
- Ribbons render as actual ribbon pictures (images), not solid-color blocks, on the landing page.
- Ribbon images are sourced from the California Cadet Corps website and their origin is recorded in `src/public/ribbons/SOURCES.md`.
- No new runtime dependency and no build tooling introduced; server remains zero-dependency.
- Contract followed (files limited to the Scope list); new code is covered by the added test(s).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first at docs/workstreams/WS-M-ribbon-images.md and follow it exactly.

Work on branch ws/ribbon-images in worktree cacc-ws-ribbon-images.

Scope summary for self-verification: There is currently no ribbon feature in this repo — the page at src/public/index.html is a placeholder and no solid-color ribbons exist. Introduce an image-based ribbons display: add actual ribbon picture assets sourced from the California Cadet Corps website under src/public/ribbons/ (record their source in src/public/ribbons/SOURCES.md), render them as <img> elements with alt text in src/public/index.html, and add a test in test/server.test.js asserting a ribbon image is served (200, image Content-Type) and that GET / includes a ribbon <img>. Do not add dependencies or a build step; the static server already serves .png/.svg from src/public.

Build green; the orchestrator handles commit/push/PR.
```
