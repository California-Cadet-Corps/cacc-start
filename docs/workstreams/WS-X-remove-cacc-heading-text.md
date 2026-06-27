# WS-X — Remove "California Cadet Corps" heading text

- Branch: ws/remove-cacc-heading-text
- PR title: [ws/remove-cacc-heading-text] WS-X-remove-cacc-heading-text: remove California Cadet Corps heading from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the california cadet corps text from the top left

## Root cause / Investigation

The landing page is a single static HTML file served at `/`.

- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` is the only on-page visible "California Cadet Corps" text. It is the page heading. (The page body uses `display: grid; place-items: center` at `src/public/index.html:11`, so the heading renders as the top-most content block — the text the product owner refers to.)
- Other occurrences of the phrase are NOT in scope: `src/public/index.html:6` `<title>California Cadet Corps — Start</title>` (browser tab title, not on-page text), plus `README.md`, `LICENSE`, `package.json`, `SECURITY.md`, `CONTRIBUTING.md` (project metadata/docs).
- `test/server.test.js:21` asserts `assert.match(text, /California Cadet Corps/)` against the full `/` response body. This match is satisfied by the `<title>` on line 6, so removing only the `<h1>` text keeps the test passing. Do NOT change the `<title>` or this assertion will need updating.

## Scope

- `src/public/index.html` — remove the heading text at line 22. Remove the `<h1>California Cadet Corps</h1>` element entirely (delete the line), leaving the surrounding `<main>` block intact. Do not touch line 6 (`<title>`), the CSS, or the welcome paragraphs.

No server, build, or test file changes are required. The existing test continues to pass via the `<title>` tag.

## Acceptance / DoD

- `npm run build` (and `npm test`) pass; the existing test suite stays green unchanged.
- The on-page "California Cadet Corps" heading no longer renders at `/`; `<h1>California Cadet Corps</h1>` is gone from `src/public/index.html`.
- The `<title>` tag, CSS, and remaining paragraphs are unchanged.
- Contract followed: only `src/public/index.html` is modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-X-remove-cacc-heading-text.md before starting.

Work on branch ws/remove-cacc-heading-text in worktree cacc-ws-remove-cacc-heading-text.

Scope: Remove the visible "California Cadet Corps" heading from the landing page by
deleting the `<h1>California Cadet Corps</h1>` element at src/public/index.html:22.
Do NOT modify the `<title>` on line 6, the CSS, or the paragraphs — and do NOT touch
test/server.test.js (its assertion is satisfied by the remaining `<title>` tag, so the
suite stays green). Only src/public/index.html should change.

Build green; the orchestrator handles commit/push/PR.
```
