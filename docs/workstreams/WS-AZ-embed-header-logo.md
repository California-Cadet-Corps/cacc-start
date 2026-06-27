# WS-AZ — Embed logo image in top-left corner

- Branch: ws/embed-header-logo
- PR title: [ws/embed-header-logo] WS-AZ-embed-header-logo: embed logo.png image in top-left corner of landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> in the top left corner remove the logo and replace that image with the image file location "https://start.cacadets.org/logo.png" and do not just put the link of it put the image there

## Root cause / Investigation

The only user-facing page is the static landing page `src/public/index.html` (served by `src/server.js`). There is currently **no** logo or image of any kind on the page:

- `src/public/index.html:20-26` — the `<body>` contains only a centered `<main>` with an `<h1>` and three `<p>` elements. No `<img>` tag and no element in the top-left corner exists.
- `grep -rniE "logo|<img"` across `src/` returns no matches (only `src/server.js:21` `'.png': 'image/png'` MIME entry, unrelated).
- `src/server.js:25-52` serves files from `PUBLIC_DIR` and already maps `.png` MIME types; no server change is required because the image is loaded from the external absolute URL `https://start.cacadets.org/logo.png`.

So "remove the logo" has no existing element to remove — the effective intent is to **place an actual embedded image** (an `<img>` element, not a clickable text link) sourced from `https://start.cacadets.org/logo.png` in the **top-left corner** of the page.

## Scope

- `src/public/index.html`
  - Add an `<img>` element pointing at `src="https://start.cacadets.org/logo.png"` rendered as an actual image (not an `<a>` link or visible URL text). Give it an `alt` such as `California Cadet Corps logo`.
  - Position it in the top-left corner. Since `body` currently uses `display: grid; place-items: center`, place the logo so it sits at the top-left independent of that centering — e.g. a small header/anchor element with `position: absolute; top` and `left` (or a fixed top-left header bar). Constrain its size (e.g. `height`/`max-width`) so it does not overflow.
  - Add minimal CSS in the existing `<style>` block (`src/public/index.html:7-18`) for the logo's positioning and sizing; keep the existing centered `<main>` content intact.
  - Do not introduce the literal URL as visible text or as an anchor — the image must render.

No changes to `src/server.js` or tests' existing assertions are needed; the page must still contain the text `California Cadet Corps` so `test/server.test.js` continues to pass.

## Acceptance / DoD

- `npm run build` (placeholder) and `npm test` pass; `npm run lint` passes.
- `src/public/index.html` renders an actual `<img>` with `src="https://start.cacadets.org/logo.png"` in the top-left corner; the raw URL is not shown as text and not wrapped only as a hyperlink.
- Existing tests in `test/server.test.js` still pass (page still serves and still contains `California Cadet Corps`).
- A test asserts the served landing page HTML contains the logo image, e.g. matches `https://start.cacadets.org/logo.png` inside an `<img` tag (extend `test/server.test.js` "serves the landing page" coverage).
- Contract followed: only files listed in Scope are modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-AZ-embed-header-logo.md before starting and follow it exactly.

Use branch ws/embed-header-logo and worktree cacc-ws-embed-header-logo.

Scope: in src/public/index.html, add an actual embedded <img> element with src="https://start.cacadets.org/logo.png" (alt "California Cadet Corps logo") positioned in the top-left corner via CSS in the existing <style> block — not a visible URL or hyperlink — while keeping the centered <main> content and the "California Cadet Corps" text intact. Add a test in test/server.test.js asserting the served HTML embeds that logo image.

Self-verify: the served page renders the logo as a real image top-left, existing tests still pass, and lint passes.

Build green; the orchestrator handles commit/push/PR.
```
