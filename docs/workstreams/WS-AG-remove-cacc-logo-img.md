# WS-AG — Remove California Cadet Corps logo image from landing page

- Branch: ws/remove-cacc-logo-img
- PR title: [ws/remove-cacc-logo-img] WS-AG-remove-cacc-logo-img: Remove cacc-logo.svg image from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove this from the page `<img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">`

## Root cause / Investigation

The page served at `start.cacadets.org` is the single static file `src/public/index.html`,
returned by the zero-dependency HTTP server in `src/server.js`:

- `src/server.js:35` — maps `/` to `/index.html`.
- `src/server.js:36` — serves files out of `src/public/` (`PUBLIC_DIR`).
- `src/public/index.html:20-26` — the `<body>` / `<main>` block that renders the visible page.

Key finding from investigation of the current `main` checkout:

- There is **no** `<img>` element anywhere in the repository. `grep -rn "<img"` over the tree
  returns nothing, and `src/public/index.html` (lines 1-28) contains only `<h1>`, `<p>`, and
  `<code>` inside `<main>` — no logo image.
- There is **no** `cacc-logo.svg` asset. A search for `cacc-logo` across the repo returns nothing,
  and `src/public/` contains only `index.html`.

Therefore the exact element the product owner asked to remove is already absent from the codebase
on `main`. The desired end state — a landing page with no `cacc-logo.svg` `<img>` — already holds.
The coder's task is to confirm/enforce that end state, not to fabricate a deletion.

## Scope

- `src/public/index.html`
  - Confirm the `<main>` block (around lines 21-26) contains **no** `<img>` element referencing
    `/cacc-logo.svg` (or any logo image). It currently does not.
  - If — and only if — the element is present in the coder's working tree, delete that single
    `<img src="/cacc-logo.svg" ...>` line so it is no longer rendered. Make no other markup,
    style, or copy changes.
- `src/public/` assets
  - If a `cacc-logo.svg` file exists in the working tree, remove it as a now-orphaned asset.
    On current `main` no such file exists, so this is expected to be a no-op.

No changes to `src/server.js`, routing, styles, or any other file.

## Acceptance / DoD

- `src/public/index.html` contains no `<img>` element referencing `cacc-logo.svg` (verifiable via
  `grep -n "cacc-logo" src/public/index.html` returning nothing).
- No `cacc-logo.svg` asset remains under `src/public/`.
- `npm run build` and `npm test` pass (build is green).
- The diff is minimal: it either removes exactly the offending `<img>` line (and orphaned asset) or
  is empty with the PR description noting the element was already absent on `main`. No unrelated
  edits, no new dependencies.
- Existing server behavior (`/`, `/healthz`, 404 handling) is unchanged; existing tests in
  `test/server.test.js` still pass.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-AG-remove-cacc-logo-img.md

Work on branch `ws/remove-cacc-logo-img` in worktree `cacc-ws-remove-cacc-logo-img`.

Scope: The product owner wants the `<img src="/cacc-logo.svg" alt="California Cadet Corps logo"
width="120" height="120">` element removed from the landing page `src/public/index.html`.
Investigation shows this `<img>` element and the `cacc-logo.svg` asset are already absent on
`main`, so the desired end state already holds — confirm via `grep -n "cacc-logo" src/public/index.html`
and only delete the element/asset if your working tree actually contains it; otherwise leave the
diff empty and note in the PR that the element was already absent. Do not touch `src/server.js`,
styles, or any other file.

Build green; the orchestrator handles commit/push/PR.
```
