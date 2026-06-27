# WS-BF — Remove shield logo SVG from landing page

- Branch: ws/remove-shield-logo-svg
- PR title: [ws/remove-shield-logo-svg] WS-BF-remove-shield-logo-svg: Remove shield logo SVG from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> `<path d="M16 1 L30 7 L30 19 C30 26 16 31 16 31 C16 31 2 26 2 19 L2 7 Z" fill="#1b4332" stroke="#d4a017" stroke-width="1.5" stroke-linejoin="round"></path>` remove this

## Investigation

The element to remove is a shield-shaped SVG `<path>` rendered in the California Cadet
Corps brand colors (`fill="#1b4332"` dark green, `stroke="#d4a017"` gold) — i.e. the
shield/crest logo mark.

A full-repo search confirms this markup is **not present anywhere in the current `main`
checkout**:
- `grep -rn 'M16 1 L30 7'` → no matches
- `grep -rln '1b4332' / 'd4a017'` → no matches
- `grep -rln '<path' / 'viewBox' / '<svg'` over tracked files → no matches in any
  HTML/JS/SVG source. The only `svg` hits are unrelated: shields.io badge URLs in
  `README.md:5-7` and a MIME-type entry `'.svg': 'image/svg+xml'` in `src/server.js:20`.

The single user-facing page is the landing page `src/public/index.html` (28 lines). It
currently contains **no SVG/shield markup at all** — only an `<h1>` title and three
`<p>` paragraphs inside `<main>` (`src/public/index.html:20-26`), with inline `<style>`
in the `<head>` (`src/public/index.html:7-18`).

## Root cause

The shield `<path>` the product owner is looking at is **not committed to this repository**.
The landing page (`src/public/index.html`), which is the only plausible host for a logo
mark, ships without it. The requested removal is therefore either (a) already satisfied on
`main`, or (b) targeting markup that exists only in the product owner's local/working copy.

## Scope

- `src/public/index.html`
  - If any shield SVG (`<svg>`/`<path>` with `fill="#1b4332"` / `stroke="#d4a017"`, or the
    `M16 1 L30 7 ...` path data) is present, remove the entire SVG element and any wrapper
    added solely to position it, plus any now-orphaned logo-specific CSS in the `<head>`
    `<style>` block. Leave the `<h1>`, paragraphs, and existing styles intact.
  - If no such markup is present (current state on `main`), make no content change; the
    coder records that the element is already absent and the landing page renders without
    a shield logo. No empty/whitespace-only commits.
- No other files require changes. `README.md` shields.io badges and the `src/server.js`
  MIME map are unrelated and must not be touched.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build/test stay green).
- A repo-wide search for the shield markup returns zero matches:
  `grep -rn 'M16 1 L30 7\|d4a017\|1b4332' src/` → no results.
- `src/public/index.html` renders the landing page with no shield SVG logo, and the
  surrounding heading, paragraphs, `/healthz` note, and page styling are unchanged.
- Existing tests in `test/server.test.js` still pass; if the SVG removal changes served
  HTML, the test asserting the landing page response is updated to match.
- Contract followed: only the files listed in Scope are modified.

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the workstream contract first: docs/workstreams/WS-BF-remove-shield-logo-svg.md
Work on branch ws/remove-shield-logo-svg in worktree cacc-ws-remove-shield-logo-svg.

Scope: Remove the California Cadet Corps shield logo SVG (a <path> with the data
"M16 1 L30 7 ..." in fill #1b4332 / stroke #d4a017) from the landing page
src/public/index.html, deleting any wrapper element and orphaned logo-only CSS while
leaving the heading, paragraphs, and existing page styling intact. Note that this markup
is not present on current main — if it is genuinely absent, make no content change and
record that the shield logo is already absent rather than creating an empty commit.
Verify with: grep -rn 'M16 1 L30 7\|d4a017\|1b4332' src/ returns nothing, and tests stay green.

Build green; the orchestrator handles commit/push/PR.
```
