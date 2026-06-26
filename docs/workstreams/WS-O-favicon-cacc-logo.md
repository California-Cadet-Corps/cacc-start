# WS-O — Tab favicon → CACC logo

- Branch: ws/favicon-cacc-logo
- PR title: [ws/favicon-cacc-logo] WS-O-favicon-cacc-logo: set browser tab icon to the CACC logo
- Depends on: (none)

## Problem

Product owner, verbatim:

> Please update the icon of the tab to the CACC Logo as featured on the top of the page.

## Investigation

- `src/public/index.html:3-19` — the `<head>` contains `<meta>` tags, `<title>` (line 6) and an inline `<style>` block, but **no `<link rel="icon" ...>`**. With no favicon declared, the browser tab shows its default placeholder icon and requests to `/favicon.ico` return 404 (handled by `src/server.js:48-51`).
- `src/public/index.html:21-26` — the "top of the page" is the `<main>` block whose heading is the **text** `<h1>California Cadet Corps</h1>` (line 22). There is currently **no logo image element** on the page, and **no image/logo asset exists** anywhere under `src/public/` (the directory contains only `index.html`).
- `src/server.js:15-23` — the static-file MIME map already maps `.svg`, `.png`, and `.ico`, so any logo asset dropped into `src/public/` is served correctly with no server change.

## Root cause / scope rationale

The requirement asks the tab icon (favicon) to be "the CACC Logo as featured on the top of the page." Two gaps must be closed: (1) no favicon is declared, and (2) no CACC logo image exists at the top of the page to reference — the header is plain text. To make the tab icon genuinely match the logo at the top of the page, this WS adds one CACC logo asset and uses it in both places: the page header and the favicon link.

## Scope

File-by-file changes:

- `src/public/cacc-logo.svg` (NEW)
  - Add a single self-contained SVG of the California Cadet Corps logo/emblem (no external fetches; vector, square-ish viewBox so it renders cleanly as a favicon). Use CACC branding (e.g. the dark-navy `#0b1d3a` palette already used in `index.html:12`). This one asset serves as both the on-page logo and the favicon.

- `src/public/index.html` (MODIFY)
  - In `<head>` (after the `<title>` at line 6), add `<link rel="icon" type="image/svg+xml" href="/cacc-logo.svg" />`. Optionally add a sensible fallback `<link rel="icon" href="/cacc-logo.svg" sizes="any" />`.
  - In `<main>` (around line 22), render the same logo above/beside the `<h1>` so it is visibly "featured on the top of the page" and matches the tab icon — e.g. an `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120" />`. Add minimal CSS in the existing `<style>` block (lines 7-18) to size/center it; keep the existing visual style intact.

- `test/server.test.js` (MODIFY)
  - Add a test asserting `GET /cacc-logo.svg` returns `200` with `Content-Type` `image/svg+xml`.
  - Extend the existing `GET /` test (lines 15-23) to assert the served HTML contains `rel="icon"` and references `cacc-logo.svg`.

No change to `src/server.js` is required (MIME map already covers `.svg`).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is the placeholder no-op; tests must be green).
- Loading `/` in a browser shows the CACC logo at the top of the page AND the same logo as the browser tab icon.
- `GET /cacc-logo.svg` serves the asset with `image/svg+xml`.
- `index.html` `<head>` declares `<link rel="icon">` pointing at `/cacc-logo.svg`.
- Contract followed: only the files listed in Scope are changed; existing landing-page text and styling remain intact; tests cover the new asset route and the favicon link.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-O-favicon-cacc-logo.md — implement exactly its Scope.

Work on branch ws/favicon-cacc-logo in worktree cacc-ws-favicon-cacc-logo.

Scope summary for self-verification: Add a self-contained CACC logo SVG at src/public/cacc-logo.svg, add a <link rel="icon" type="image/svg+xml" href="/cacc-logo.svg"> in the <head> of src/public/index.html, and render that same logo at the top of the page above the existing <h1>. Add tests in test/server.test.js asserting GET /cacc-logo.svg returns 200 image/svg+xml and that the served HTML references the favicon. Do not modify src/server.js (its MIME map already serves .svg) and keep the existing page text/styling intact.

Build green; the orchestrator handles commit/push/PR.
```
