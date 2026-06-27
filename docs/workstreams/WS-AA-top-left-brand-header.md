# WS-AA — Top-left brand header: full "California Cadet Corps" text, no logo overlap

- Branch: ws/top-left-brand-header
- PR title: [ws/top-left-brand-header] WS-AA-top-left-brand-header: replace top-left CACC text with full name and stop logo overlap
- Depends on: (none)

## Problem

Product owner, verbatim:

> in the top left corner replace the cacc text with California Cadet Corps text and dont overlap the logo and the california cadet corps. also get  rid of the old california cadet corp text in the top left

## Investigation

The application is a single static landing page served by the Node HTTP server.

- `src/server.js` serves `src/public/index.html` for `GET /` (only static asset in `src/public/` — confirmed via `find src/public -type f`).
- `src/public/index.html` (28 lines total) is the entire rendered UI. Its body uses `display: grid; place-items: center` (line 11) so the single `<main>` is centered. There is **no** top-left header/nav region.
- The only branding text is the centered `<h1>California Cadet Corps</h1>` at `src/public/index.html:22`.
- There is **no logo image anywhere** in the repo (`find . -iname '*.svg'/'*.png'/...` returns nothing) and **no abbreviated "CACC" text** in the rendered page (`grep -niE '\bCACC\b' src/public/index.html` → no match).

### Root cause / scope note

The "old CACC text" and "logo" the owner describes do **not currently exist on `main`** as separate top-left elements — the page only has the centered title. The owner is asking for a proper top-left brand area: a logo mark sitting beside the full "California Cadet Corps" wordmark, laid out so the two do not overlap, with any short/"CACC" placeholder text removed. This WS therefore creates that top-left header (logo mark + full-name wordmark) and guarantees no overlap, rather than editing pre-existing markup that isn't there.

- `test/server.test.js:21` asserts the response body matches `/California Cadet Corps/`. The full name MUST remain present so this test keeps passing.

## Scope

All changes are confined to `src/public/index.html` (no server or asset-pipeline changes).

- `src/public/index.html`
  - Add a top-left `<header>` (fixed/absolute or flex top-left) containing:
    - a logo mark — use a small **inline SVG** placeholder (no binary asset added; keeps build/CI green); reuse the page's color palette.
    - a wordmark element with the full text `California Cadet Corps` (NOT "CACC").
  - Lay the header out with `display: flex; align-items: center; gap: …` (or equivalent) so the logo and the wordmark never overlap at any viewport width; add minimal CSS in the existing `<style>` block (lines 7–18).
  - Ensure no abbreviated "CACC" string is introduced; if the centered `<h1>` (line 22) is kept, leave it as the full name or remove it in favor of the header — but the string `California Cadet Corps` MUST still appear in the served HTML.
  - Verify nothing overlaps the new header (the centered `<main>` and the top-left header must not collide on small screens).

## Acceptance / DoD

- `npm run build` and `npm test` pass (test asserting `/California Cadet Corps/` still green — `test/server.test.js:21`).
- Top-left corner shows a logo mark beside the full "California Cadet Corps" wordmark with visible spacing; the two do not overlap at desktop or mobile widths.
- No abbreviated "CACC" text remains anywhere in `src/public/index.html`.
- Contract followed: changes limited to `src/public/index.html`; no new binary assets, no server changes.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-AA-top-left-brand-header.md and implement it exactly.

Work on branch ws/top-left-brand-header in worktree cacc-ws-top-left-brand-header.

Scope: In src/public/index.html only, add a top-left brand header containing an inline-SVG logo mark next to the full "California Cadet Corps" wordmark, using flex + gap so the logo and text never overlap at any width. Remove any abbreviated "CACC" text and keep the literal string "California Cadet Corps" in the served HTML so test/server.test.js stays green. Add no binary assets and do not touch the server.

Build green; the orchestrator handles commit/push/PR.
```
