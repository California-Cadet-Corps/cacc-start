# WS-AY — Remove the cacc-logo.svg `<img>` element

- Branch: ws/remove-cacc-logo-img
- PR title: [ws/remove-cacc-logo-img] WS-AY-remove-cacc-logo-img: remove cacc-logo.svg img element
- Depends on: (none)

## Problem

Product owner, verbatim:

> delete this from the code entirely: `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">`

## Investigation

The requested element **does not exist anywhere in the repository**. A full-tree search (excluding `node_modules`) was performed:

- `grep -rn 'cacc-logo'` over the whole repo → **0 matches**.
- `grep -rni 'California Cadet Corps logo'` over the whole repo → **0 matches**.
- `grep -rln '<img'` over the whole repo → **0 matches** (no `<img>` tag exists at all).
- The only landing/markup file is `src/public/index.html` (28 lines); it contains no `<img>` tag and no logo reference. Its `<main>` (lines 21–26) is text-only: an `<h1>` plus three `<p>` elements.
- The only `.svg` occurrence in source is an unrelated MIME-type map entry: `src/server.js:20` → `'.svg': 'image/svg+xml',` (a content-type lookup for the static file server, not a reference to any logo).
- No `cacc-logo.svg` asset exists under `src/public/` or anywhere in the tree.

## Root cause

There is nothing to delete: the target `<img src="/cacc-logo.svg" ...>` markup, the `cacc-logo.svg` asset, and any logo `<img>` element are all already absent from the codebase. The desired end state ("this is not in the code") is already satisfied.

## Scope

No source files require modification. The deletion is a no-op because the element is not present.

- `src/public/index.html` — verify no `<img>` / `cacc-logo` reference exists (already true; no change).
- `src/server.js:20` — leave untouched; the `.svg` MIME entry is unrelated infrastructure, NOT the logo element, and must not be removed.
- No asset to remove (no `cacc-logo.svg` exists).

The coder should re-run the searches below to confirm the finding, then make no code changes. If the contract requires a tracked artifact, the only acceptable change is documentation of the verification — do not invent or add the element in order to delete it.

## Acceptance / DoD

- Build passes (`npm run build`) and tests pass (`npm test`).
- Verification searches reproduce zero matches:
  - `grep -rn 'cacc-logo' .` (excluding `node_modules`) → 0 matches.
  - `grep -rn '<img' .` (excluding `node_modules`) → 0 matches.
- `src/server.js:20` MIME map is left intact.
- No new files, assets, or markup are introduced.
- PR description states the element was already absent and no functional change was needed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-AY-remove-cacc-logo-img.md before starting.

Work on branch ws/remove-cacc-logo-img in worktree cacc-ws-remove-cacc-logo-img.

Scope: The product owner asked to delete the element `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">`. Investigation found this element does not exist anywhere in the repo — there is no `<img>` tag and no `cacc-logo` reference; the only `.svg` mention is an unrelated MIME-type entry at src/server.js:20 which must stay. Re-run `grep -rn 'cacc-logo' .` and `grep -rn '<img' .` (excluding node_modules) to self-verify zero matches, make no functional code changes, and do not remove the server.js MIME entry.

Build green; the orchestrator handles commit/push/PR.
```
