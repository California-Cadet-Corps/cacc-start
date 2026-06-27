# WS-BA — Remove the "Start here" anchor from the landing page

- Branch: ws/remove-start-here-anchor
- PR title: [ws/remove-start-here-anchor] WS-BA-remove-start-here-anchor: remove "Start here" anchor and guard against regression
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove this <a class="start-here" href="#new-cadet">Start here</a>

## Investigation

The requested element does **not** exist anywhere in the repository.

- The only HTML file served by the app is `src/public/index.html`. It contains no `<a>` tags at all — its `<main>` block (lines 21–26) has an `<h1>` and three `<p>` elements only. There is no `class="start-here"` anchor and no `#new-cadet` target.
- A full search across every tracked file returns zero matches:
  - `git grep -ni 'start.here'` → no matches
  - `git grep -ni 'new-cadet'` → no matches
  - `git grep -ni '<a '` → no matches
- `docs/workstreams/` does not yet exist in the checkout; this WS file is the first entry (the orchestrator creates the directory on copy).

## Root cause

The anchor `<a class="start-here" href="#new-cadet">Start here</a>` is already absent from the codebase. There is nothing to delete. The desired end state (no such anchor in the served page) is already true. This workstream therefore confirms removal and adds a regression guard so the anchor cannot reappear unnoticed.

## Scope

- `src/public/index.html` — **No edit expected.** Verify no `class="start-here"` anchor or `#new-cadet` href is present. Only if one is found (e.g. introduced by a concurrent change), delete that single `<a>` element and nothing else; leave all surrounding markup untouched.
- `test/server.test.js` — Add one regression test that fetches `GET /` and asserts the served HTML does **not** contain `class="start-here"` (use `assert.doesNotMatch(text, /class="start-here"/)`). Follow the existing test style: start the server on port 0, fetch, read text, close the server. ~8 lines, mirroring the existing `GET / serves the landing page` test (lines 15–23).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; tests must be green).
- No `class="start-here"` anchor and no `#new-cadet` href exist in `src/public/index.html` (or anywhere tracked); `git grep -ni 'start-here'` returns nothing.
- The new regression test in `test/server.test.js` fails if the anchor is reintroduced and passes against current `main`.
- The contract is followed: `src/public/index.html` is left unchanged unless the anchor is actually present.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BA-remove-start-here-anchor.md

Work on branch ws/remove-start-here-anchor in worktree cacc-ws-remove-start-here-anchor.

Scope: The product owner asked to remove `<a class="start-here" href="#new-cadet">Start here</a>`,
but this anchor does not exist anywhere in the repo (src/public/index.html has no anchors). Make no
edit to src/public/index.html unless you actually find that anchor — if found, delete only that one
<a> element. Then add a regression test in test/server.test.js asserting the served `GET /` HTML does
not contain `class="start-here"`, mirroring the existing landing-page test style.

Build green; the orchestrator handles commit/push/PR.
```
