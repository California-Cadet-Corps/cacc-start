# WS-A — Add California Cadet Corps logo to the landing page

- Branch: ws/add-cacc-logo
- PR title: [ws/add-cacc-logo] WS-A-add-cacc-logo: add CACC logo to center of landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> Add the California Cadet Corps logo image to the center of the landing page of the site

## Root cause / Investigation

This is a feature, not a bug. Findings from investigation:

- The landing page is the single static file `src/public/index.html`. It is served
  for `/` by the zero-dependency static server.
  - `src/public/index.html:20-26` — `<body>` contains a centered `<main>` block with
    an `<h1>California Cadet Corps</h1>` and three `<p>` lines. There is currently **no
    image** on the page.
  - `src/public/index.html:9-13` — `body` is already centered via
    `display: grid; place-items: center;` and `text-align: center;`. The `<main>`
    block (`index.html:14`, `max-width: 40rem`) is therefore the visual center of the page.
- The static server resolves `/` to `index.html` and serves files from `PUBLIC_DIR`
  (`src/public/`) with a MIME map.
  - `src/server.js:34-47` — path resolution + file serving from `PUBLIC_DIR`.
  - `src/server.js:15-23` — MIME map already includes `'.svg': 'image/svg+xml'` and
    `'.png': 'image/png'`, so a logo asset placed in `src/public/` is served with no
    server change required.
- There is **no logo asset** in the repo today (`src/public/` contains only
  `index.html`). A logo image file must be added.
- Tests live in `test/server.test.js`. The `GET /` test (`test/server.test.js:16-24`)
  asserts the page contains `California Cadet Corps` but does not check for a logo.

Decision: ship the logo as a committed **SVG** asset (`src/public/logo.svg`) — it is
text/reproducible (no binary blob needed), scales crisply, and is already covered by the
server MIME map. Reference it with an `<img>` at the top of the centered `<main>` block.

## Scope

File-by-file changes:

1. `src/public/logo.svg` — **new file**. A self-contained SVG of the California Cadet
   Corps logo/emblem (e.g. a roundel with "CALIFORNIA CADET CORPS" / "CACC" lettering),
   no external references, `viewBox` set so it scales. Keep it lightweight.

2. `src/public/index.html` — add the logo to the center of the page:
   - Insert an `<img src="/logo.svg" alt="California Cadet Corps logo" class="logo" />`
     as the first child of `<main>` (before the `<h1>` at `index.html:22`).
   - Add a `.logo` rule to the existing `<style>` block (`index.html:7-18`) to size and
     center it, e.g. width/max-width with `margin: 0 auto 1rem;` and `display: block;`.
     Match the existing CSS style/idiom.

3. `test/server.test.js` — extend coverage for the new asset (additive, follow existing
   test idiom):
   - In/after the `GET /` test, assert the served HTML references the logo
     (e.g. `assert.match(text, /logo\.svg/)`).
   - Add a test that `GET /logo.svg` returns `200` with `Content-Type` containing
     `image/svg+xml`.

No changes to `src/server.js` are required (MIME + static serving already cover `.svg`).

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed; `npm test` passes (`node --test`).
- The landing page (`GET /`) renders the CACC logo centered above the heading in the
  `<main>` block.
- `GET /logo.svg` serves the asset with `Content-Type: image/svg+xml`.
- New/updated tests cover the logo reference in the page and the asset being served.
- Contract followed: only the files listed in Scope are changed; no binary blob committed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-A-add-cacc-logo.md

Work on branch `ws/add-cacc-logo` in worktree `cacc-ws-add-cacc-logo`.

Scope summary for self-verification: Add the California Cadet Corps logo to the center
of the landing page. Create a self-contained `src/public/logo.svg` and reference it with
a centered `<img>` as the first child of the `<main>` block in `src/public/index.html`,
adding a `.logo` CSS rule to size/center it. Extend `test/server.test.js` to assert the
page references the logo and that `GET /logo.svg` serves it as `image/svg+xml`. Do not
change `src/server.js`.

Build green; the orchestrator handles commit/push/PR.
```
