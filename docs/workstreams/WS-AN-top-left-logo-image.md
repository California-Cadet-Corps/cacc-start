# WS-AN — Top-left logo image on landing page

- Branch: ws/top-left-logo-image
- PR title: [ws/top-left-logo-image] WS-AN-top-left-logo-image: render logo image in top-left corner
- Depends on: (none)

## Problem

Product owner, verbatim:

> in the top left corner remove the logo and replace that image with the image file location "https://start.cacadets.org/logo.png" and do not just put the link of it put the image there

## Investigation

The only user-facing page is the static landing page served by the app.

- `src/public/index.html` — the full landing page. Its `<body>` (lines 20–26) contains only a centered `<main>` block (`<h1>`, three `<p>` elements). There is **no existing logo, image, or top-left element** of any kind. The `<style>` block (lines 7–18) centers everything via `body { display: grid; place-items: center; }`.
- `src/server.js:12,35,44` — serves any file under `src/public/` as a static asset; `MIME` (lines 15–23) already maps `.png` → `image/png`. No server change is needed; the requested image is loaded directly from the absolute URL `https://start.cacadets.org/logo.png` at render time.
- `grep -rni "logo" src/ test/` returns nothing — confirms there is no current logo to remove. The "remove the logo" instruction is therefore satisfied by ensuring no stray/placeholder logo exists; the substantive change is adding the image.

Root cause / scope: the requirement is to display the logo as a real rendered `<img>` element (not a clickable/text link) positioned in the top-left corner. This requires adding an `<img>` element to `index.html` plus minimal CSS to pin it to the top-left.

## Scope

- `src/public/index.html`
  - Add an `<img>` element as the first child of `<body>` with `src="https://start.cacadets.org/logo.png"` and a descriptive `alt` (e.g. `alt="California Cadet Corps logo"`). Render the actual image — do **not** wrap it in an `<a>` or print the URL as text.
  - Add a CSS rule (e.g. a `.site-logo` class in the existing `<style>` block) positioning it in the top-left corner: `position: fixed; top: 1rem; left: 1rem;` with a sensible `height`/`max-width` (e.g. `height: 48px; width: auto;`) so it does not get centered by the existing grid layout.
  - Do not remove or alter the existing `<main>` content or the `California Cadet Corps` text (the landing-page test asserts that string is present).

No changes to `src/server.js` or `test/server.test.js` are required (`.png` MIME already mapped; image is fetched from the absolute URL). Optionally add a test asserting the page markup contains the logo `<img>` src.

## Acceptance / DoD

- `npm run build` and `npm test` pass (the existing `GET /` test still matches `/California Cadet Corps/`).
- `src/public/index.html` renders an actual `<img>` (not a text link, not an anchor) whose `src` is exactly `https://start.cacadets.org/logo.png`, visually pinned to the top-left corner of the viewport.
- No leftover/placeholder logo elsewhere on the page.
- Contract followed: only the files listed in Scope are changed; any new behavior is covered by a test where practical.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-AN-top-left-logo-image.md

Branch: ws/top-left-logo-image
Worktree: cacc-ws-top-left-logo-image

Scope: In src/public/index.html, add an <img> element pinned to the top-left
corner of the page with src exactly "https://start.cacadets.org/logo.png" and a
descriptive alt attribute, plus minimal CSS (e.g. position: fixed; top/left) so the
existing grid centering does not move it. Render the real image — do NOT wrap it in
an <a> or output the URL as text — and keep the existing "California Cadet Corps"
content intact so the GET / test still passes. There is no pre-existing logo to
delete; "remove the logo" is satisfied by ensuring no other logo element exists.

Build green; the orchestrator handles commit/push/PR.
```
