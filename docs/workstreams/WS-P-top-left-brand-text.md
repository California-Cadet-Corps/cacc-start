# WS-P — Top-left brand wordmark on landing page

- Branch: ws/top-left-brand-text
- PR title: [ws/top-left-brand-text] WS-P-top-left-brand-text: add top-left "California Cadet Corp" brand to landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> change the cacc text in the top left to california cadet corp

## Investigation

The only user-facing page is the static landing page served by the zero-dependency
server.

- `src/public/index.html` — the rendered landing page. Its layout centers everything
  (`body { display: grid; place-items: center }`, line 11) and contains:
  - `<title>California Cadet Corps — Start</title>` (line 6) — browser tab text.
  - `<h1>California Cadet Corps</h1>` (line 22) — the only visible brand text, centered.
  - There is **no element positioned in the top-left**, and no literal string `cacc`
    rendered anywhere on the page.
- `src/server.js:59` — the only literal `cacc` in source is the startup console log
  (`cacc-start listening ...`). This is server-side only and never reaches the browser,
  so it is **out of scope**.
- `src/server.js:25-52` — server statically serves files from `src/public/`; no
  templating, so the change is pure HTML/CSS in `index.html`.
- `test/server.test.js:21` — existing test asserts the served page matches
  `/California Cadet Corps/`.

Root cause / interpretation: there is no existing "cacc" text in the top-left to edit.
The actionable change is to add a brand wordmark anchored to the top-left of the page
reading the owner's requested text. Per the requirement verbatim the text is
"California Cadet Corp" (note: singular "Corp"; the org's canonical name is "Corps", but
the contract honors the owner's wording — a coder should use "California Cadet Corp").

## Scope

- `src/public/index.html`
  - Add a top-left brand element inside `<body>` (e.g. a `<header class="brand">` or
    `<a class="brand">`) before `<main>`, with the text `California Cadet Corp`.
  - Add CSS in the existing `<style>` block (lines 7-18) to anchor the brand to the
    top-left: position it at the top-left corner (e.g. `position: absolute; top; left;`
    or a top-aligned flex header) so it is not affected by the existing
    `place-items: center` body grid. Keep the existing centered `<main>` intact.
  - Do not remove or alter the centered `<h1>` or the `<title>`; this WS only adds the
    top-left wordmark.

- `test/server.test.js`
  - Add an assertion in the "GET / serves the landing page" test (around line 21) that
    the served HTML contains the new top-left brand text `California Cadet Corp`.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; tests must be green).
- The landing page renders "California Cadet Corp" anchored visually in the top-left
  corner of the viewport, distinct from the centered `<h1>`.
- New test covers the added brand text so a regression would fail CI.
- Contract followed: changes limited to `src/public/index.html` and `test/server.test.js`;
  no server-logic or deploy changes.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-P-top-left-brand-text.md

Work on branch `ws/top-left-brand-text` in worktree `cacc-ws-top-left-brand-text`.

Scope: In src/public/index.html, add a brand wordmark anchored to the top-left corner of
the page reading "California Cadet Corp" (added as a header/anchor element before <main>,
with CSS so it sits top-left despite the body's centered grid). Leave the centered <h1>
and <title> unchanged. Then add an assertion to test/server.test.js verifying the served
page contains "California Cadet Corp".

Build green; the orchestrator handles commit/push/PR.
```
