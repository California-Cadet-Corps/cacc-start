# WS-AD — Top-left corner logo image

- Branch: ws/top-left-logo-image
- PR title: [ws/top-left-logo-image] WS-AD-top-left-logo-image: render logo.png in the top-left corner of the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> in the top left corner remove the logo and replace that image with the image file location "https://start.cacadets.org/logo.png" and do not just put the link of it put the image there

## Root cause / Investigation

The only user-facing page is the static landing page served by the zero-dependency HTTP server.

- `src/public/index.html` — the landing page. It currently has **no logo and no `<img>` element at all**. The `<body>` contains only a centered `<main>` block (`src/public/index.html:20-26`) with an `<h1>` and three `<p>` lines. There is no image in the top-left corner today.
- `src/server.js:43-47` serves files from `PUBLIC_DIR` and already maps `.png` → `image/png` (`src/server.js:21`), but the requested image is an absolute external URL (`https://start.cacadets.org/...`), so no local asset or MIME wiring is needed; the browser fetches it directly.
- `test/server.test.js:15-23` asserts `GET /` returns 200 and the body matches `/California Cadet Corps/`.

Interpretation: the owner believes a logo already sits in the top-left corner. None exists in the markup. The intent is to have the file at `https://start.cacadets.org/logo.png` rendered as an actual image (an `<img>` element, **not** a text link / anchor) pinned to the top-left corner of the page. So the work is: add a real `<img>` in the top-left corner pointing at that URL (and, per the wording, ensure no stray logo/link remains there — there is none to remove).

## Scope

- `src/public/index.html`
  - Add an `<img>` element rendering `https://start.cacadets.org/logo.png` positioned in the top-left corner of the viewport. Include a descriptive `alt` (e.g. `alt="California Cadet Corps logo"`) and a sensible bounded size.
  - Pin it to the top-left: the existing `body` uses `display: grid; place-items: center` (`src/public/index.html:11`), so the logo must be positioned independently of that centering — e.g. an `<img>` with `position: fixed; top` / `left` (or absolute), with a small inset (~1rem). Keep it a rendered image, never an `<a>`/visible URL text.
  - Add the matching style rule inside the existing `<style>` block (`src/public/index.html:7-18`); do not introduce external CSS files.
  - Do not remove or alter the existing `<main>` content, the health-check copy, or the `<title>`.

No changes to `src/server.js` (external URL needs no MIME/route changes). No new local asset is added.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; existing tests in `test/server.test.js` must still pass — the `/California Cadet Corps/` body assertion stays satisfied).
- `src/public/index.html` contains an `<img>` whose `src` is exactly `https://start.cacadets.org/logo.png`, rendered as an image (not an anchor or printed URL text), positioned in the top-left corner.
- The image has a non-empty `alt` attribute and a bounded display size (does not overflow or cover the centered heading).
- No other landing-page content is removed or broken; no external CSS/JS files introduced.
- Add or extend a test in `test/server.test.js` asserting the served `/` HTML contains the logo image reference (e.g. `assert.match(text, /https:\/\/start\.cacadets\.org\/logo\.png/)` and that it appears within an `<img` tag), so the contract is regression-covered.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-AD-top-left-logo-image.md

Work on branch ws/top-left-logo-image in worktree cacc-ws-top-left-logo-image.

Scope: In src/public/index.html, add a real rendered <img> (not a text link/anchor) whose src
is exactly https://start.cacadets.org/logo.png, pinned to the top-left corner of the page via a
style rule in the existing <style> block (use position: fixed/absolute with a small inset since
body uses grid place-items:center), with a descriptive alt and a bounded size; do not change the
existing <main> content or src/server.js. Add/extend a test in test/server.test.js asserting the
served "/" HTML contains the logo image reference so the change is regression-covered.

Build green; the orchestrator handles commit/push/PR.
```
