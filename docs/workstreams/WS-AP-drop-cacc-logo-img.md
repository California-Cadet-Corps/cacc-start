# WS-AP — Remove the CACC logo image from the landing page

- Branch: ws/drop-cacc-logo-img
- PR title: [ws/drop-cacc-logo-img] WS-AP-drop-cacc-logo-img: remove cacc-logo.svg img from landing page
- Depends on: (none — but see Investigation: the `<img>` is introduced by the separate `ws/add-cacc-logo` workstream; if that lands first, this WS deletes it)

## Problem

Product owner, verbatim:

> remove this <img src="/cacc-logo.svg" alt="California Cadet Corps logo" width="120" height="120">

## Root cause / Investigation

The only user-facing page is the single static file `src/public/index.html`, served by the
zero-dependency HTTP server in `src/server.js`:

- `src/server.js:34-36` — maps `/` to `/index.html` and serves files out of `PUBLIC_DIR`
  (`src/public/`); `src/server.js:20` registers the `.svg` MIME type.
- `src/public/index.html:21-26` — the `<main>` block that renders the visible page.

Findings on the current `main` checkout:

- There is **no** `<img>` element anywhere in the repo. `grep -rn "<img" .` returns nothing, and
  `src/public/index.html:1-28` contains only `<h1>`, `<p>`, and `<code>` inside `<main>`.
- There is **no** `cacc-logo.svg` asset. `grep -rn "cacc-logo" .` returns nothing under `src/`,
  and `src/public/` contains only `index.html`.
- Git history (`git log --all -S cacc-logo`) shows the `<img src="/cacc-logo.svg" ...>` element is
  added by the unmerged `ws/add-cacc-logo` workstream — that branch is the source of the element
  the product owner is looking at.

So the offending `<img>` does **not** exist on `main` today: the desired end state already holds
on `main`. The coder's job is to enforce that end state — delete the element/asset if the working
tree actually contains it (e.g. if `ws/add-cacc-logo` has merged), otherwise leave an empty diff.

## Scope

- `src/public/index.html`
  - If present, delete the single line `<img src="/cacc-logo.svg" alt="California Cadet Corps logo"
    width="120" height="120">` from the `<main>` block (around lines 21-26). Remove no surrounding
    copy, headings, or styles. On current `main` this line is absent → no-op.
- `src/public/` assets
  - If a `cacc-logo.svg` file exists in the working tree, delete it as a now-orphaned asset. On
    current `main` no such file exists → no-op.
- No changes to `src/server.js`, routing, MIME table, styles, or any other file.

## Acceptance / DoD

- `grep -n "cacc-logo" src/public/index.html` returns nothing; no `<img>` referencing
  `cacc-logo.svg` is rendered.
- No `cacc-logo.svg` asset remains under `src/public/`.
- `npm run build` passes (green) and `npm test` passes — existing `test/server.test.js` coverage of
  `/`, `/healthz`, and 404 handling is unchanged.
- Diff is minimal: it either removes exactly the offending `<img>` line (plus the orphaned asset)
  or is empty, with the PR description noting the element was already absent on `main`. No unrelated
  edits and no new dependencies.
- Contract followed; no files outside the Scope list are touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-AP-drop-cacc-logo-img.md

Work on branch `ws/drop-cacc-logo-img` in worktree `cacc-ws-drop-cacc-logo-img`.

Scope: The product owner wants the `<img src="/cacc-logo.svg" alt="California Cadet Corps logo"
width="120" height="120">` element removed from the landing page `src/public/index.html`.
Investigation shows this `<img>` and the `cacc-logo.svg` asset are already absent on `main`
(introduced only by the separate ws/add-cacc-logo branch), so confirm via
`grep -n "cacc-logo" src/public/index.html` and delete the element/asset only if your working
tree actually contains it; otherwise leave the diff empty and note in the PR that it was already
absent. Do not touch src/server.js, styles, or any other file.

Build green; the orchestrator handles commit/push/PR.
```
