# WS-AJ — Replace top-left logo with the hosted logo.png image

- Branch: ws/replace-logo-top-left
- PR title: [ws/replace-logo-top-left] WS-AJ-replace-logo-top-left: show hosted logo.png image in top-left corner
- Depends on: (none)

## Problem

Product owner, verbatim:

> in the top left corner remove the logo and replace that image with the image file location "https://start.cacadets.org/logo.png" and do not just put the link of it put the image there

## Root cause / Investigation

The landing page is a single static HTML file served by the zero-dependency
server.

- `src/public/index.html:1-29` is the entire served landing page. It contains
  **no `<img>` element and no existing logo asset** — the only "logo-like"
  element is the centered text heading `<h1>California Cadet Corps</h1>` at
  `src/public/index.html:22`.
- The page body is centered via `display: grid; place-items: center`
  (`src/public/index.html:11`); there is currently nothing rendered in the
  top-left corner.
- `src/server.js:11-50` serves files from `src/public/` and already maps
  `.png` → `image/png` in its MIME table (`src/server.js:24`). There is no
  local `logo.png` in `src/public/` (only `index.html` exists), so the page
  must reference the absolute hosted URL the product owner specified rather
  than a local file.

Conclusion: there is no pre-existing logo image to remove; the work is to add
a real rendered `<img>` (NOT a text link) in the top-left corner of the page
whose `src` is the exact URL `https://start.cacadets.org/logo.png`.

## Scope

File-by-file changes (no other files):

- `src/public/index.html`
  - Add an `<img>` element positioned in the top-left corner of the page with
    `src="https://start.cacadets.org/logo.png"` (use this URL verbatim) and a
    meaningful `alt` (e.g. `alt="California Cadet Corps logo"`). It must render
    as an actual image, not appear as a clickable text URL.
  - Add minimal CSS so the image sits in the top-left corner (e.g. an absolute/
    fixed-positioned element anchored top-left with small padding and a capped
    width such as a `max-width` of a few rem) without disrupting the existing
    centered `<main>` content.
  - Keep the existing `<h1>` text heading and the rest of the page content
    intact (the requirement is about the top-left corner image only).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; existing
  server test in `test/` continues to pass).
- The landing page renders an actual image in the top-left corner sourced from
  `https://start.cacadets.org/logo.png` — verifiable by viewing the served
  `index.html` and confirming an `<img>` tag with that exact `src`, not a bare
  hyperlink/text URL.
- Existing centered content (`<h1>`, welcome paragraphs, health-check note)
  remains visible and is not overlapped in a way that breaks readability.
- Contract followed: only `src/public/index.html` is modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-AJ-replace-logo-top-left.md

Branch: ws/replace-logo-top-left
Worktree: cacc-ws-replace-logo-top-left

Scope: Edit only src/public/index.html. Add a real, rendered <img> element in
the top-left corner of the landing page whose src is exactly
"https://start.cacadets.org/logo.png" (with a meaningful alt attribute) — it
must display as an image, not as a clickable text link. Add minimal CSS to
anchor it top-left without breaking the existing centered <main> content; keep
all existing page content intact.

Build green; the orchestrator handles commit/push/PR.
```
