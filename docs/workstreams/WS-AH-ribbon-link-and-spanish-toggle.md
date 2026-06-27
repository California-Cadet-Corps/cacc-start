# WS-AH — Ribbon Chart link fix + Spanish/English language toggle

- Branch: ws/ribbon-link-and-spanish-toggle
- PR title: [ws/ribbon-link-and-spanish-toggle] WS-AH-ribbon-link-and-spanish-toggle: fix Ribbon Chart link and add ES/EN toggle
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove "cacadets.org/Cadet/Ribbon-Chart" and replace it with "https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en" in the same location on the website
> also in the top right corner add a button that says "Español" and have it change the website to spanish when pressed, also when it is pressed the text on the button changes to "english" and when pressed again it changes the website back to english

## Root cause / Investigation

The site is a single static placeholder page served by a zero-dependency Node HTTP server.

- `src/public/index.html` — the only user-facing page (lines 1–28). Body content lives in `<main>` at lines 21–26. Inline `<style>` is at lines 7–18. `<html lang="en">` is at line 2.
- `src/server.js` — static file server; serves `index.html` for `/` (lines 33–52) and `/healthz` (lines 27–31). No templating; the page is plain HTML/CSS, no client JS today.
- `test/server.test.js` — `node:test` suite; asserts `/healthz` returns ok (lines 5–13) and `/` HTML matches `/California Cadet Corps/` (lines 15–23).

Findings that shape the contract:
1. **No `cacadets.org/Cadet/Ribbon-Chart` link exists anywhere** (grep across the repo for `Ribbon`, `Ribbon-Chart`, `Cadet/`, `cacadets` returns only the server comments and the welcome copy). There is nothing to literally "remove." The intended end state is a Ribbon Chart link pointing at the new URL. Implement as: if an old `Ribbon-Chart` link is present, replace its `href`; otherwise add the link to the landing-page body ("the same location on the website" = the single landing page). Final href MUST be exactly `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`.
2. **No language toggle / Spanish content exists.** A client-side toggle and Spanish translations of the page text must be added from scratch. Since the server does no templating, the toggle must be inline client-side JS in `index.html`.

## Scope

### `src/public/index.html` (edit)
- Add a Ribbon Chart anchor in `<main>` linking to `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` (the literal `%20`, do not re-encode). If a pre-existing `Ribbon-Chart` anchor is found, update its `href` in place instead of duplicating.
- Add a top-right toggle button, e.g. `<button id="lang-toggle">Español</button>`, with CSS positioning it in the top-right corner (`position: fixed; top: 1rem; right: 1rem;`).
- Mark translatable text nodes with `data-en` / `data-es` attributes (welcome copy, headings, link label, etc.) so the toggle can swap them. Provide Spanish translations for each English string currently shown.
- Add an inline `<script>` that on button click: swaps every `data-en`/`data-es` element to the other language, sets `document.documentElement.lang` to `es`/`en`, and toggles the button label between `Español` (when page is English) and `english` (when page is Spanish). Default state is English on load.

### `test/server.test.js` (edit)
- Add a test asserting `/` HTML contains the exact Ribbon Chart href `Ribbon%20Chart?lang=en`.
- Add a test asserting `/` HTML contains the language toggle button with text `Español`.
- (Toggle behavior is client-side DOM; assert markup presence only — node:test has no DOM.)

## Acceptance / DoD
- `npm run build` (no-op placeholder) and `npm run lint` pass; `npm test` passes including the new assertions.
- The served landing page contains an anchor whose href is exactly `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` and no remaining `Ribbon-Chart` (hyphen) link.
- A button in the top-right corner reads `Español`; clicking it renders the page text in Spanish and changes the button to `english`; clicking again restores English and the `Español` label.
- Contract followed; changes limited to the files in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-AH-ribbon-link-and-spanish-toggle.md and implement exactly what it specifies.
Work on branch ws/ribbon-link-and-spanish-toggle in worktree cacc-ws-ribbon-link-and-spanish-toggle.

Scope: In src/public/index.html, ensure the Ribbon Chart link points to exactly
https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en (add it to the landing page if no
Ribbon-Chart link exists), and add a top-right button labeled "Español" with inline client-side
JS that toggles the page text between English and Spanish (using data-en/data-es attributes) and
flips the button label to "english" and back. Add tests in test/server.test.js asserting the new
href and the "Español" button are present in the served HTML.

Self-verify the three acceptance behaviors before finishing. Build green; the orchestrator handles commit/push/PR.
```
