# WS-AT — Remove cacc-logo.svg `<img>` from the landing page

- Branch: ws/remove-cacc-logo-img
- PR title: [ws/remove-cacc-logo-img] WS-AT-remove-cacc-logo-img: confirm cacc-logo.svg img is gone from the landing page
- Depends on: none

## Problem

Product owner, verbatim:

> delete this from the code entirely: `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">`

## Root cause / Investigation

The requested `<img>` element **does not exist anywhere in the current codebase**. Investigation:

- The only HTML file is `src/public/index.html` (28 lines). Its `<main>` block (lines 21–26) contains an `<h1>`, three `<p>` elements, and a `<code>` health-check note — no `<img>` tag. See `src/public/index.html:21`–`src/public/index.html:26`.
- Repo-wide search found zero matches:
  - `grep -rn 'cacc-logo'` → no hits
  - `grep -rn 'California Cadet Corps logo'` → no hits
  - `grep -rn '<img'` → no hits
  - `find . -name '*.svg'` → no `cacc-logo.svg` (no SVG files at all)
- `git show HEAD:src/public/index.html | grep -n 'img\|logo'` → no matches.
- Git history shows the element was added and then already removed before this WS:
  - Added in `WS-A-add-cacc-logo` (commit `2af9619` contract; image landed later).
  - Removed in `WS-AG-remove-cacc-logo-img` (commit `6af7dc0`).
  - Removed again / kept absent in `WS-AP-drop-cacc-logo-img` (commit `863958c`).

Conclusion: the deletion the product owner asked for has already taken effect on `main`. The correct outcome for this WS is to **verify absence** and make no code change.

## Scope

This is a verification-only (no-op) workstream. No production source changes are expected.

- `src/public/index.html` — VERIFY the file contains no `<img>` referencing `cacc-logo.svg` (and no logo `<img>` at all). Confirm the `<main>` block matches lines 21–26 as investigated. Make no edit unless a stray reference is found.
- No other files reference `cacc-logo.svg`; none should be touched.

If — and only if — the coder discovers a live occurrence of the exact `<img src="/cacc-logo.svg" ...>` tag (or any `cacc-logo.svg` reference) that this investigation missed, delete that single line and nothing else.

## Acceptance / DoD

- Build passes (`npm test` / CI green).
- A repo-wide grep for `cacc-logo` and `California Cadet Corps logo` returns zero matches.
- `src/public/index.html` contains no logo `<img>` element.
- No unrelated files modified. If no live reference exists, the diff is empty (the contract documenting verification is the deliverable) — the orchestrator is informed the requirement was already satisfied.
- Contract followed; any new code (none expected) is covered by existing tests.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-AT-remove-cacc-logo-img.md in full before doing anything.

Work on branch ws/remove-cacc-logo-img in worktree cacc-ws-remove-cacc-logo-img.

Scope: The product owner asked to delete `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">` from the code. Investigation found this element does NOT exist anywhere in the repo — it was already removed by prior workstreams, and src/public/index.html (the only HTML file) has no logo <img>. Verify this with a repo-wide grep for `cacc-logo` and `California Cadet Corps logo` (expect zero hits). Make NO code change unless a stray live reference turns up; in that case delete only that one line.

Build green; the orchestrator handles commit/push/PR.
```
