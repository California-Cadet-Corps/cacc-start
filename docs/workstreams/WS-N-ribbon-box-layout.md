# WS-N — Ribbon box layout: fit picture and description

- Branch: ws/ribbon-box-layout
- PR title: [ws/ribbon-box-layout] WS-N-ribbon-box-layout: lay out ribbon cards so picture and description fit in the box
- Depends on: (none)

## Problem

Product owner, verbatim:

> change the layout of the ribbons so that the picture and the description can fit in the box

## Investigation

The requirement references a "ribbons" UI where each ribbon has a picture and a
description shown inside a box. The current checkout has no such UI:

- `src/public/index.html:21-26` — the entire rendered page is a placeholder
  `<main>` containing an `<h1>`, three `<p>` elements, and a health-check note.
  There is no ribbons markup, no card/box element, no `<img>`, and no
  ribbon-specific CSS.
- `src/public/index.html:7-18` — the only styles are global `body`/`main`/`h1`/`p`/`code`
  rules; there is no grid, flex, or card layout to modify.
- `grep -rin "ribbon"` across `*.html`, `*.js`, `*.css`, `*.md` returns **no matches**
  (exit code 1). Confirmed there is nothing named "ribbon" in the repo.
- `src/server.js:25-52` — server is a zero-dependency static-file server: `/` serves
  `index.html`, other paths map to files under `src/public/`. No templating, no API.
- `test/server.test.js:15-23` — the page test only asserts the served HTML matches
  `/California Cadet Corps/`.

### Root cause / scope conclusion

There is no existing ribbon layout to "change"; it does not yet exist in this repo.
The faithful, minimal interpretation is to **establish the ribbons layout** as a
self-contained static section (consistent with the current single-file static-HTML
approach) such that each ribbon's picture and description both fit cleanly inside a
fixed card "box": a responsive grid of cards, each a vertical (column) box with the
image sized via `object-fit` and the description wrapping without overflowing the box.

## Scope

- `src/public/index.html`
  - Add a "Ribbons" section inside `<main>` (after the existing intro `<p>` elements,
    keeping the `California Cadet Corps` heading so the existing test still passes).
  - Add a responsive card grid: a container using CSS grid (e.g.
    `repeat(auto-fill, minmax(...))`) holding ribbon "box" cards.
  - Each ribbon box is a flex column: an `<img>` (picture) with constrained
    height + `object-fit: contain/cover` so it fits the box, and a description block
    that wraps and stays within the box bounds (no overflow / clipping).
  - Render 2–3 sample ribbons (picture + name + short description) so the layout is
    demonstrable. Use lightweight placeholder images (inline SVG `data:` URIs or a
    small committed SVG under `src/public/`) to avoid external network dependencies.
  - Adjust `text-align` so card content reads correctly inside the box (the global
    `body { text-align: center }` currently centers everything).
- `test/server.test.js`
  - Add a test asserting `GET /` returns markup containing the ribbons layout
    (e.g. matches a `ribbon`/`ribbons` class or section marker added above), so the
    new layout is covered.
- (If a separate SVG asset is added) `src/public/<ribbon-placeholder>.svg`
  - Small placeholder image served as a static file; confirm `.svg` MIME already
    exists at `src/server.js:20`.

Keep the implementation framework-free (plain HTML/CSS) to match the existing app.

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed (lint runs `node --check src/server.js`).
- `npm test` passes, including the existing `/California Cadet Corps/` assertion and
  the new ribbons-layout assertion.
- Each ribbon card renders as a box where the picture and description both fit inside
  without overflowing or clipping (verified by the card CSS: constrained image sizing
  + wrapping description); layout reflows responsively across viewport widths.
- No new runtime dependencies; app remains a zero-dependency static server.
- Contract followed: changes limited to the files in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-N-ribbon-box-layout.md
Follow its Scope and Acceptance sections exactly.

Branch: ws/ribbon-box-layout
Worktree: cacc-ws-ribbon-box-layout

Scope summary for self-verification: The repo currently has no ribbons UI — the only
page is the placeholder src/public/index.html. Add a framework-free "Ribbons" section
to that page: a responsive grid of card "boxes", each a flex column with a picture
(img sized via object-fit so it fits) and a wrapping description that stays inside the
box. Keep the existing "California Cadet Corps" heading, use inline/committed
placeholder SVG images (no external network calls), and add a test in
test/server.test.js asserting the served HTML contains the ribbons layout.

Build green; the orchestrator handles commit/push/PR.
```
