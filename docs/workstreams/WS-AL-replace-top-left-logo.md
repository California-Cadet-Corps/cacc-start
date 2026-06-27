# WS-AL — Top-left logo image on landing page

- Branch: ws/replace-top-left-logo
- PR title: [ws/replace-top-left-logo] WS-AL-replace-top-left-logo: render logo.png in the top-left corner of the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> in the top left corner remove the logo and replace that image with the image file location "https://start.cacadets.org/logo.png" and do not just put the link of it put the image there

## Root cause / Investigation

This is a feature/placement change, not a bug fix.

- The single user-facing page is `src/public/index.html`. It is a centered, text-only placeholder: a `<main>` block containing an `<h1>` and three `<p>` elements (`src/public/index.html:21-26`). The `<body>` uses `display: grid; place-items: center;` (`src/public/index.html:11`).
- There is **no existing logo or `<img>` element anywhere in the repo** — a repo-wide grep for `logo` across `*.html`, `*.js`, `*.css`, `*.md` returns nothing, and `index.html` contains no `<img>` tag. So "remove the logo" has nothing to remove; the effective requirement is to **place** the image in the top-left corner.
- The page styles live in an inline `<style>` block at `src/public/index.html:7-18`. There is no separate CSS file.
- The server (`src/server.js`) statically serves files from `src/public/` and already maps `.png` → `image/png` (`src/server.js:21`), so an `<img src>` pointing at the absolute URL `https://start.cacadets.org/logo.png` works in production without server changes. (The PNG itself is hosted at that production URL and is not committed to this repo.)

## Scope

File-by-file changes:

- `src/public/index.html`
  - Add a real `<img>` element (not a text link) at the top of `<body>`, positioned in the top-left corner. Use `src="https://start.cacadets.org/logo.png"` exactly as given, with a meaningful `alt` (e.g. `alt="California Cadet Corps logo"`).
  - Add minimal CSS in the existing inline `<style>` block to pin the image to the top-left (e.g. a `.logo` class with `position: fixed; top; left;` and a sensible `height`/`width: auto`). Ensure it does not overlap awkwardly with the centered `<main>` (the existing `place-items: center` layout stays).
  - Keep the existing heading/text content unchanged so the current test assertion `assert.match(text, /California Cadet Corps/)` (`test/server.test.js:21`) still passes.

No changes required in `src/server.js` (PNG MIME mapping already present) or `test/server.test.js` (existing serve-page test still applies; optionally extend per DoD below).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; existing two tests still green).
- The rendered landing page shows the logo as an actual image in the top-left corner, sourced from `https://start.cacadets.org/logo.png` — rendered via `<img>`, not displayed as a clickable/text URL.
- Contract followed: only the files listed in Scope are changed; `src/public/index.html` retains the "California Cadet Corps" text so the existing test passes.
- Tests cover new behavior: extend `test/server.test.js` (or add a small test) to assert the served HTML contains an `<img` referencing `start.cacadets.org/logo.png`.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-AL-replace-top-left-logo.md and implement it exactly.

Work on branch ws/replace-top-left-logo in worktree cacc-ws-replace-top-left-logo.

Scope: In src/public/index.html, add a real <img> element pinned to the top-left
corner with src="https://start.cacadets.org/logo.png" and a meaningful alt — render
it as an actual image, never as a text/clickable link. There is no pre-existing logo
to remove. Keep the existing "California Cadet Corps" heading text intact, add minimal
top-left positioning CSS to the existing inline <style> block, and extend
test/server.test.js to assert the served HTML contains the <img> referencing
start.cacadets.org/logo.png. No server changes are needed.

Build green; the orchestrator handles commit/push/PR.
```
