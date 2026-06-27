# WS-BT — Add "cyber unit 2026 was here" footer to landing page

- Branch: ws/cyber-unit-footer
- PR title: [ws/cyber-unit-footer] WS-BT-cyber-unit-footer: add cyber unit footer to landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> put "cyber unit 2026 was here" at the bottom of the page

## Root cause / Investigation

This is a feature (content addition), not a bug.

The "page" is the single static landing page served by the app:

- `src/public/index.html` — the only HTML page. Its body (lines 20–27) contains a single `<main>` element (lines 21–26) with the page content. There is no footer element today; the last content line before `</main>` is `<p>Health check: <code>/healthz</code></p>` (line 25).
- `src/server.js:25-52` serves files from `PUBLIC_DIR` (`src/public`), mapping `/` → `index.html` (`src/server.js:35`). No server change is needed — the text lives in the static HTML.
- `test/server.test.js:15-23` asserts `GET /` returns 200 and the body matches `/California Cadet Corps/`. New content must not break this; a new assertion should cover the footer text.

The body currently uses `display: grid; place-items: center;` on `<body>` (`src/public/index.html:11`), which centers `<main>`. A footer added as a sibling of `<main>` must be positioned at the bottom of the page (e.g. fixed/absolute to the bottom, or by making the body a column layout) so it visually sits "at the bottom".

## Scope

- `src/public/index.html`
  - Add a `<footer>` element as the last child of `<body>`, immediately after the closing `</main>` (after line 26), containing the exact text `cyber unit 2026 was here`.
  - Add minimal CSS in the existing `<style>` block (lines 7–18) to anchor the footer to the bottom of the page given the current `place-items: center` body layout — e.g. a `footer { position: fixed; bottom: 0; ... }` rule with small padding and reduced opacity to match the page's muted text style (`opacity: 0.85` used on `p`). Keep it consistent with existing styling; do not restructure unrelated CSS.
  - Preserve the existing `<main>` content and the `California Cadet Corps` heading unchanged.

- `test/server.test.js`
  - Extend the existing `GET / serves the landing page` test (lines 15–23), or add a focused test, asserting the served `/` body matches `/cyber unit 2026 was here/`.

## Acceptance / DoD

- `npm run build` and `npm run lint` pass (build is a no-op placeholder; lint runs `node --check src/server.js`).
- `npm test` passes, including a new assertion that `GET /` returns the exact text `cyber unit 2026 was here`.
- The footer text reads exactly `cyber unit 2026 was here` (lowercase, no added punctuation).
- The footer renders at the bottom of the rendered page, not merged into the centered `<main>` block.
- No server logic changed; only static HTML/CSS and the test are touched.
- Contract followed; no unrelated files modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-BT-cyber-unit-footer.md and implement it exactly.

Branch: ws/cyber-unit-footer
Worktree: cacc-ws-cyber-unit-footer

Scope: Add a <footer> with the exact text "cyber unit 2026 was here" as the last
child of <body> in src/public/index.html, after the closing </main> (line 26), and
add minimal CSS in the existing <style> block to anchor it to the bottom of the page
(the body uses place-items: center, so the footer needs explicit bottom positioning).
Then extend test/server.test.js so GET / asserts the body contains "cyber unit 2026
was here". Do not change server logic.

Build green; the orchestrator handles commit/push/PR.
```
