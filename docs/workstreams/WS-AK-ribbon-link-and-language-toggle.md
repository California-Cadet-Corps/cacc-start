# WS-AK — Ribbon Chart link swap + English/Español toggle

- Branch: ws/ribbon-link-and-language-toggle
- PR title: [ws/ribbon-link-and-language-toggle] WS-AK-ribbon-link-and-language-toggle: swap Ribbon Chart URL and add Español/English language toggle
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove "cacadets.org/Cadet/Ribbon-Chart" and replace it with "https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en" in the same location on the website
> also in the top right corner add a button that says "Español" and have it change the website to spanish when pressed, also when it is pressed the text on the button changes to "english" and when pressed again it changes the website back to english

## Root cause / Investigation

The site is a single static placeholder page served by a zero-dependency Node HTTP server. Relevant files:

- `src/public/index.html` — the entire rendered page. Lines 7–18 hold inline `<style>`; lines 21–26 hold the `<main>` content (`<h1>` line 22, three `<p>` lines 23–25, `/healthz` `<code>` line 25). The root `<html lang="en">` tag is at line 2.
- `src/server.js` — static file server; serves `index.html` for `/` (lines 33–47). No templating, no framework, no JS bundler (`npm run build` is a no-op per README). Any client behavior must be vanilla JS inline in `index.html`.
- `test/server.test.js` — node:test suite; line 21 asserts the served `/` page matches `/California Cadet Corps/`. This is where new HTML assertions go.

Key finding: there is currently **no** `cacadets.org/Cadet/Ribbon-Chart` link (and no link of any kind) anywhere in the repo — confirmed by grep across all files. So the "remove and replace … in the same location" instruction has no existing target. The faithful interpretation is to ensure a Ribbon Chart link exists on the page pointing at the new URL `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` (replacing the old path if/when present). There is likewise no existing top-right area or i18n mechanism; the toggle is net-new.

## Scope

All work is in `src/public/index.html` (plus a test addition). No server changes needed.

- `src/public/index.html`
  - Add a Ribbon Chart anchor in the `<main>` content area (the "same location" — the body content), with `href="https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en"`. If an old `cacadets.org/Cadet/Ribbon-Chart` href is ever present, replace it in place; here, add it as new content. Give the visible link text a `data-en`/`data-es` pair so it participates in the toggle.
  - Add a fixed top-right `<button id="lang-toggle">` reading `Español`. Add minimal CSS (position the button top-right, e.g. `position: fixed; top: 1rem; right: 1rem;`).
  - Mark every translatable text node with `data-en="…"` `data-es="…"` attributes (h1, the welcome/placeholder/health paragraphs, the ribbon link text).
  - Add a small inline `<script>`: on button click, toggle a current-language flag; for each `[data-en]` element set `textContent` to the matching `data-es`/`data-en`; set `document.documentElement.lang` to `es`/`en`; flip the button label between `Español` (when site is English) and `english` (when site is Spanish). Start in English with the button showing `Español`.
  - Keep Spanish translations reasonable for the existing copy (e.g. "Bienvenido a…", "Esta es la página de inicio provisional…", "Comprobación de estado:").

- `test/server.test.js`
  - Extend the existing `GET / serves the landing page` test (or add one) to assert the served HTML contains the new Ribbon Chart URL (`Ribbon%20Chart?lang=en`) and the `Español` toggle button (e.g. `assert.match(text, /Español/)` and `assert.match(text, /Ribbon%20Chart\?lang=en/)`). Note `assert.match` needs the literal as a regex — escape `?`.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op; tests must stay green including new assertions).
- Page served at `/` contains exactly one Ribbon Chart link with `href="https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en"` and no remaining `Cadet/Ribbon-Chart` reference.
- A top-right button labeled `Español` is present; clicking it switches all page text (and `<html lang>`) to Spanish and relabels the button `english`; clicking again restores English and relabels `Español`. Behavior works with no network/build step (vanilla inline JS).
- Tests cover the new HTML (URL present, toggle button present). Contract followed; no server or unrelated files changed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-AK-ribbon-link-and-language-toggle.md before doing anything, and implement exactly what it specifies.

Branch: ws/ribbon-link-and-language-toggle
Worktree: cacc-ws-ribbon-link-and-language-toggle

Scope summary for self-verification: In src/public/index.html, add a Ribbon Chart link with href "https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en" in the page body (there is no pre-existing Ribbon-Chart link, so this is added; ensure no old Cadet/Ribbon-Chart path remains), and add a fixed top-right button labeled "Español" with inline vanilla JS that toggles all data-en/data-es text and the <html lang> attribute between English and Spanish, relabeling the button "english"/"Español" on each press. Update test/server.test.js to assert the served page contains the new URL and the toggle button. No server-side changes.

Build green; the orchestrator handles commit/push/PR.
```
