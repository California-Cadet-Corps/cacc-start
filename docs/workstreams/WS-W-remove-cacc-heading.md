# WS-W — Remove "California Cadet Corps" heading text

- Branch: ws/remove-cacc-heading
- PR title: [ws/remove-cacc-heading] WS-W-remove-cacc-heading: remove California Cadet Corps heading text from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the california cadet corps text from the top left

## Root cause / Investigation

The landing page is a single static HTML file served at `/`.

- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` is the only visible on-page "California Cadet Corps" text. It is the heading the product owner is referring to (the prominent page text). The page uses a centered `place-items: center` grid layout, so this heading is the topmost visible text block.
- `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>` is the browser-tab title, NOT on-page text and NOT "top left". Leave it unchanged.
- `test/server.test.js:21` — `assert.match(text, /California Cadet Corps/)` asserts the string appears anywhere in the served HTML response. Because the `<title>` (line 6) still contains "California Cadet Corps", this test remains green after removing only the `<h1>`. Do not modify this test and do not remove the `<title>`.

No build/bundler step is involved; `src/public/index.html` is served as-is.

## Scope

- `src/public/index.html`
  - Remove the `<h1>California Cadet Corps</h1>` element at line 22.
  - Leave the surrounding `<main>` block, the `<title>` (line 6), and the `h1 { ... }` CSS rule (line 15) in place (the CSS rule is harmless dead style; removing it is optional and out of scope).
  - Make no other content changes.

No other files require changes. Do not edit `test/server.test.js`.

## Acceptance / DoD

- `<h1>California Cadet Corps</h1>` no longer appears in `src/public/index.html`.
- `<title>California Cadet Corps — Start</title>` is unchanged.
- `npm test` passes (the existing landing-page test stays green via the `<title>`).
- `npm run build` / `npm run lint` pass (no-op build; no lint regressions).
- Contract followed; no unrelated edits.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-W-remove-cacc-heading.md in full before starting.

Work on branch ws/remove-cacc-heading in worktree cacc-ws-remove-cacc-heading.

Scope: In src/public/index.html, remove the `<h1>California Cadet Corps</h1>`
element (line 22) — the only visible on-page "California Cadet Corps" text. Do
NOT touch the `<title>` on line 6 and do NOT modify test/server.test.js; the
existing test (/California Cadet Corps/) stays green because the <title> still
contains that string. No other files change.

Build green; the orchestrator handles commit/push/PR.
```
