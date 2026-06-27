# WS-AB — California Cadet Corps logo in top-left corner

- Branch: ws/corner-ccc-logo
- PR title: [ws/corner-ccc-logo] WS-AB-corner-ccc-logo: add small CCC logo to top-left corner of landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the logo in the navbar and replace the logo in the corner to the California cadet corps logo and make it small enough to fit into the top left corner

## Investigation

The application is a minimal zero-dependency static site. The only rendered page is
`src/public/index.html`, served by `src/server.js`.

- `src/public/index.html:20-26` — `<body>` contains a single centered `<main>` block
  (`<h1>California Cadet Corps</h1>` plus three `<p>` elements). There is **no `<nav>` /
  navbar element** and **no `<img>` / logo element anywhere** in the document.
- `src/public/` — directory listing shows only `index.html`; there is **no existing logo
  asset** (no `.svg`/`.png`) to remove or replace.
- `src/server.js:15-23` — the static MIME map already includes `'.svg': 'image/svg+xml'`
  and `'.png': 'image/png'`, so a new logo asset under `src/public/` is served correctly
  with no server change required.
- `src/server.js:33-41` — static files are resolved safely inside `PUBLIC_DIR`; a file at
  `src/public/logo.svg` is reachable at the URL path `/logo.svg`.
- `test/server.test.js:15-23` — existing test only asserts `GET /` returns 200 and the
  HTML contains `California Cadet Corps`.

### Root cause / scope clarification

There is currently no navbar logo and no corner logo in the codebase. The "remove the logo
in the navbar" and "replace the logo in the corner" clauses describe elements that do not
yet exist, so the net deliverable is: **add a small California Cadet Corps logo fixed in the
top-left corner of the landing page.** No removal is needed because no logo is present; this
WS implements the desired end state (a single small CCC logo in the top-left corner).

## Scope

### `src/public/logo.svg` (new file)
- Add a small, self-contained California Cadet Corps logo as an SVG asset (text/vector mark,
  e.g. a roundel/emblem with the "CCC" / California Cadet Corps lettering and the corps
  colors — dark navy `#0b1d3a` to match the page background palette).
- Keep it compact and square-ish with a `viewBox` so it scales cleanly when rendered small.
- This is a placeholder vector mark; the official raster/vector artwork can later replace
  this file in place without other code changes.

### `src/public/index.html` (edit)
- Add the logo as the first child of `<body>` (before `<main>`), e.g. an
  `<img class="corner-logo" src="/logo.svg" alt="California Cadet Corps logo">`.
- Add a CSS rule in the existing `<style>` block positioning it in the top-left corner and
  small: `position: fixed; top: …; left: …; height: ~40px; width: auto;` so it sits in the
  corner and does not disturb the existing `display: grid; place-items: center` layout of
  `<body>`.
- Do not add a navbar; the design is a single corner logo, per the requirement.

### `test/server.test.js` (edit)
- Add a test asserting `GET /logo.svg` returns 200 with `Content-Type` `image/svg+xml`.
- Optionally extend the `GET /` test to assert the served HTML references `logo.svg`.

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed (lint runs `node --check src/server.js`).
- `npm test` passes, including the new logo test(s).
- The landing page renders a single small California Cadet Corps logo in the top-left corner;
  no navbar is introduced and no duplicate/second logo exists.
- `/logo.svg` is served with `Content-Type: image/svg+xml`.
- Changes are confined to `src/public/logo.svg`, `src/public/index.html`, and
  `test/server.test.js`; the contract above is followed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-AB-corner-ccc-logo.md and implement it
exactly. Work on branch ws/corner-ccc-logo in worktree cacc-ws-corner-ccc-logo.

Scope: the landing page src/public/index.html currently has no navbar and no logo. Add a new
small California Cadet Corps logo asset at src/public/logo.svg and reference it from
index.html as a fixed-position element in the top-left corner (small height, ~40px), without
adding a navbar or a second logo. Add a test in test/server.test.js asserting GET /logo.svg
returns 200 with Content-Type image/svg+xml. The server already maps .svg in src/server.js, so
no server change is needed.

Build green; the orchestrator handles commit/push/PR.
```
