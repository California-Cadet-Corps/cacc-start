# WS-AU — Delete cacc-logo.svg `<img>` from the code entirely

- Branch: ws/delete-cacc-logo-img
- PR title: [ws/delete-cacc-logo-img] WS-AU-delete-cacc-logo-img: confirm cacc-logo.svg img is absent from the code
- Depends on: none

## Problem

Product owner, verbatim:

> delete this from the code entirely: <img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">

## Investigation

The element does **not** exist anywhere in the current `main` checkout.

- `src/public/index.html` (lines 1–28) is the only HTML/landing page in the repo. Its `<main>` block (lines 21–26) contains an `<h1>`, three `<p>` elements, and a `<code>` — **no `<img>` and no reference to `/cacc-logo.svg`**.
- Repo-wide search for `cacc-logo`, `California Cadet Corps logo`, and `<img` (excluding `.git`/`node_modules`) returns **zero** matches.
- No `cacc-logo.svg` asset exists anywhere in the tree (`find . -name '*.svg'` → none).
- `src/server.js` is a static file server; it has no inline markup that references the logo.

## Root cause

There is nothing to delete. Git history shows the `<img src="/cacc-logo.svg" …>` element was introduced earlier (WS-A `add-cacc-logo`) and was already removed by later workstreams (WS-AG, WS-AP, WS-AT). The desired end state — landing page with no `cacc-logo.svg` `<img>` — already holds on `main`. This WS exists to **verify and confirm** that state, not to re-apply a change.

## Scope

No source change is expected. The coder verifies, and only edits if a stray reference is found.

- `src/public/index.html` — confirm there is no `<img>` tag and no `/cacc-logo.svg` reference. If somehow present, remove that single line so the `<main>` block reads as lines 21–26 do today. Otherwise leave the file byte-for-byte unchanged.
- No other files require changes. Do **not** add, remove, or rename `cacc-logo.svg` (it does not exist).

## Acceptance / DoD

- `grep -rn 'cacc-logo' src/` and a repo-wide search return no matches (already true).
- `src/public/index.html` contains no `<img>` referencing `/cacc-logo.svg`.
- Build/test passes: `npm install` then `npm test` (and `npm run build` if defined) green.
- Contract followed; no unrelated edits. If no change was needed, the PR documents that the element is already absent and the requirement is satisfied (the branch may carry only this confirmation).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-AU-delete-cacc-logo-img.md in full before doing anything.

Work on branch `ws/delete-cacc-logo-img` in worktree `cacc-ws-delete-cacc-logo-img`.

Scope: the product owner asked to delete `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">` from the code entirely. Verify across the repo (grep for `cacc-logo` and `<img`, inspect src/public/index.html) — the element does NOT currently exist on main, so the desired state already holds. Make NO code change unless you find a stray reference, in which case remove only that line; do not touch or create cacc-logo.svg.

Build green; the orchestrator handles commit/push/PR.
```
