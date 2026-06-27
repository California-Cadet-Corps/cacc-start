# WS-Z — Remove "California Cadet Corps" heading from landing page

- Branch: ws/remove-cacc-heading-text
- PR title: [ws/remove-cacc-heading-text] WS-Z-remove-cacc-heading-text: remove the California Cadet Corps heading text from the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the california cadet corps text from the top left

## Root cause / Investigation

The served landing page is a single static HTML file rendered by the app.

- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` is the only on-page rendered occurrence of the text "California Cadet Corps". The page uses a centered `<main>` layout (`src/public/index.html:9-14`), so this `<h1>` is the heading text the product owner is referring to.
- `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>` is the browser tab title (not page body content). This is intentionally **left unchanged** — it is metadata, not on-page text, and the requirement is scoped to the visible page text.
- `test/server.test.js:21` — `assert.match(text, /California Cadet Corps/)` asserts the served HTML contains the string. Because the `<title>` (line 6) still contains "California Cadet Corps", this assertion continues to pass after the `<h1>` is removed, so the existing test stays green.
- No other rendered source contains the phrase (confirmed via repo-wide grep; remaining hits are in `README.md` and `package.json` metadata, out of scope).

## Scope

- `src/public/index.html`
  - Remove the `<h1>California Cadet Corps</h1>` line (line 22) so the visible heading text no longer appears. Leave the `<title>` (line 6) and the rest of the `<main>` content intact.
- `test/server.test.js`
  - Add/adjust an assertion to lock in the change: assert the served HTML body no longer contains an `<h1>California Cadet Corps</h1>` element (e.g. `assert.doesNotMatch(text, /<h1>California Cadet Corps<\/h1>/)`). Keep the existing `GET /` 200 test passing.

## Acceptance / DoD

- `npm test` passes (build is green).
- The `<h1>California Cadet Corps</h1>` text no longer appears in the served landing page body.
- The browser tab `<title>` and all other page content remain unchanged.
- New/updated test covers the removal (asserts the heading element is gone).
- Contract followed; no out-of-scope edits (no changes to README/package metadata).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-Z-remove-cacc-heading-text.md and implement it exactly.

Work on branch ws/remove-cacc-heading-text in worktree cacc-ws-remove-cacc-heading-text.

Scope: Remove the `<h1>California Cadet Corps</h1>` line from src/public/index.html so the
visible heading text is gone, leaving the <title> tag and the rest of the page intact. Update
test/server.test.js to assert the heading element is no longer present while keeping the existing
GET / 200 test green.

Build green; the orchestrator handles commit/push/PR.
```
