# WS-AX — Ribbon Chart link fix + Español/English language toggle

- Branch: ws/ribbon-link-and-spanish-toggle
- PR title: [ws/ribbon-link-and-spanish-toggle] WS-AX-ribbon-link-and-spanish-toggle: fix Ribbon Chart link and add ES/EN toggle
- Depends on: (none)

## Problem

Product owner requirement, verbatim:

> remove "cacadets.org/Cadet/Ribbon-Chart" and replace it with "https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en" in the same location on the website
> also in the top right corner add a button that says "Español" and have it change the website to spanish when pressed, also when it is pressed the text on the button changes to "english" and when pressed again it changes the website back to english

## Root cause / Investigation

The entire user-facing website is a single static page served by a zero-dependency
Node server.

- `src/public/index.html` — the only page. `<main>` content lives at lines 21–26
  (`<h1>`, three `<p>` elements). Inline `<style>` block is at lines 7–18.
  `<html lang="en">` at line 2.
- `src/server.js:25-52` — static file server; serves `index.html` for `/`. No build
  step (`package.json` `build` is a no-op).
- `test/server.test.js` — node:test suite; line 21 asserts the page contains
  "California Cadet Corps".

Finding on the Ribbon Chart link: a search across the repo
(`grep -rni "ribbon" / "Ribbon-Chart" / "Ribbon%20Chart"`) returns **no matches**.
The string `cacadets.org/Cadet/Ribbon-Chart` does not currently exist anywhere in the
checkout — the page (lines 21–26) has no links at all. Therefore "remove X and replace
with Y in the same location" resolves to: **add** the corrected link
`https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` to the landing content area
(the `<main>` block), which is the "same location" the requirement refers to. If the
coder finds the old link present at implementation time, replace it in place instead.

No internationalization exists. The toggle must be implemented client-side (no
framework, no bundler) as inline JS in `index.html`.

## Scope

- `src/public/index.html`
  - Add a Ribbon Chart link in the `<main>` content (lines 21–26) pointing to
    `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`. If an existing
    `cacadets.org/Cadet/Ribbon-Chart` link is found, replace its href in place instead
    of adding a new one. Link text: "Ribbon Chart" / "Tabla de Cintas".
  - Add a button fixed to the top-right corner with initial label `Español`. On click,
    swap all translatable page text (h1, paragraphs, link text) to Spanish and change
    the button label to `English`; on next click, revert text and label to English.
  - Implement the toggle with a small inline `<script>`: keep EN/ES strings via
    `data-en` / `data-es` attributes on each translatable element (or an equivalent
    map), update `document.documentElement.lang` to `en`/`es`, and toggle the button
    label. Add minimal CSS for the fixed top-right button (e.g. `position: fixed; top;
    right; z-index`) so it does not overlap the centered `<main>`.

- `test/server.test.js`
  - Add a test asserting the served `/` HTML contains the exact Ribbon Chart URL
    `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`.
  - Add a test asserting the served HTML contains the `Español` button label and the
    Spanish strings (so the toggle source data ships to the client).

## Acceptance / DoD

- `npm test` passes (existing + new node:test cases).
- `npm run lint` passes (`node --check src/server.js`) and `npm run build` runs clean.
- Ribbon Chart link present in `<main>` with href exactly
  `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`; no remaining reference to
  `cacadets.org/Cadet/Ribbon-Chart`.
- A top-right button reads `Español` on load; clicking switches all page text to
  Spanish and the button to `English`; clicking again reverts both. Verified by loading
  the page (`npm start`) and toggling.
- No new runtime dependencies; implementation stays in static `index.html` + inline JS.
- Contract followed; new behavior covered by tests.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-AX-ribbon-link-and-spanish-toggle.md

Branch: ws/ribbon-link-and-spanish-toggle
Worktree: cacc-ws-ribbon-link-and-spanish-toggle

Scope: In src/public/index.html add (or replace, if already present) a Ribbon Chart link
in the <main> content pointing exactly to
https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en, and add a fixed top-right button
labeled "Español" whose inline JS toggles all page text between English and Spanish and
flips its own label to "English"/"Español" on each press. Add node:test cases in
test/server.test.js asserting the served HTML contains the exact Ribbon Chart URL and the
"Español" button/Spanish strings. Keep it zero-dependency (static HTML + inline script).

Self-verify: npm test, npm run lint, and npm run build all pass; loading the page shows the
Español button top-right that toggles language and label both ways.

Build green; the orchestrator handles commit/push/PR.
```
