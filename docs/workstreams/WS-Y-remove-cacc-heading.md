# WS-Y — Remove "California Cadet Corps" heading from landing page

- Branch: ws/remove-cacc-heading
- PR title: [ws/remove-cacc-heading] WS-Y-remove-cacc-heading: remove California Cadet Corps heading text from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the california cadet corps text from the top left

## Root cause / Investigation

The landing page is a static HTML file served at `/`.

- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` is the visible "California Cadet Corps" text rendered on the page. The `<body>` uses a centered grid layout (`src/public/index.html:11`, `display: grid; place-items: center`), so this heading is the prominent on-page text the requirement refers to.
- `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>` also contains the phrase, but this is the browser tab/document title, not on-page content. It is out of scope (the requirement targets visible page text), and keeping it preserves the existing test (see below).
- `test/server.test.js:21` — `assert.match(text, /California Cadet Corps/)` asserts the phrase appears in the served HTML. Because the `<title>` (line 6) retains the phrase, removing only the `<h1>` keeps this test green.

No build step transforms this HTML (`npm run build` is a no-op placeholder per README), and the server serves `src/public/index.html` directly, so the file edit is the complete change.

## Scope

- `src/public/index.html`
  - Remove the `<h1>California Cadet Corps</h1>` element (line 22).
  - Leave the surrounding `<main>` block, the `<title>` (line 6), and all other content intact.
  - Optional, only if it improves the result: the unused `h1` CSS rule (line 15) may be left as-is; do not introduce unrelated changes.

## Acceptance / DoD

- The `<h1>California Cadet Corps</h1>` text no longer appears in the rendered page body.
- `<title>California Cadet Corps — Start</title>` (line 6) is unchanged.
- `npm test` passes — `test/server.test.js:21` still matches because the `<title>` retains the phrase. No new test is required for a pure content removal; if the coder wishes, an assertion that the served body no longer contains an `<h1>California Cadet Corps</h1>` may be added to `test/server.test.js`.
- `npm run build` (no-op) and `npm run lint` pass; CI is green.
- Contract followed; no unrelated files changed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-Y-remove-cacc-heading.md

Work on branch ws/remove-cacc-heading in worktree cacc-ws-remove-cacc-heading.

Scope: In src/public/index.html, remove the visible heading element `<h1>California Cadet Corps</h1>` (line 22). Do NOT change the `<title>` on line 6 — leaving it keeps test/server.test.js:21 (which matches /California Cadet Corps/ against the served HTML) green. Make no other content changes.

Self-verify: the rendered page body no longer shows "California Cadet Corps", the document <title> is unchanged, and `npm test` passes.

Build green; the orchestrator handles commit/push/PR.
```
