# WS-AO — Ribbon Chart link + Español/English language toggle

- Branch: ws/ribbon-link-spanish-toggle
- PR title: [ws/ribbon-link-spanish-toggle] WS-AO-ribbon-link-spanish-toggle: corrected Ribbon Chart link + EN/ES toggle button
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove "cacadets.org/Cadet/Ribbon-Chart" and replace it with "https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en" in the same location on the website
> also in the top right corner add a button that says "Español" and have it change the website to spanish when pressed, also when it is pressed the text on the button changes to "english" and when pressed again it changes the website back to english

## Root cause / Investigation

The app is a single-page, zero-dependency static site. There is exactly one HTML page and a tiny static-file server.

- `src/public/index.html` (lines 1–28) — the only page. It contains an `<h1>` and four `<p>` elements inside `<main>` (lines 21–26), plus an inline `<style>` block (lines 7–18). `<html lang="en">` is set on line 2.
- `src/server.js` (lines 25–52) — serves files from `src/public/`; no template/render layer, so all markup and behavior must live in `index.html`.
- `test/server.test.js` (lines 15–23) — existing test asserts the landing page contains `California Cadet Corps` via a regex on the response body.

Important finding: a full-repo search (`grep -rni "ribbon" / "cacadets.org/Cadet" / "Español" / "lang="`) returns **no existing `cacadets.org/Cadet/Ribbon-Chart` link and no Spanish/i18n code**. The only `lang=` match is the `<html lang="en">` attribute. Therefore "remove and replace" reduces to: ensure the page's single Ribbon Chart link points at the new URL — i.e. add the link (with the corrected URL) in the page's main content area, since there is no old link to delete. Note this explicitly in the PR description so reviewers know the "removal" was a no-op (target did not exist).

## Scope

### `src/public/index.html` (edit)
- Add a Ribbon Chart link inside `<main>` (the page's content "location"): an `<a href="https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en">` with visible text "Ribbon Chart". Use the new URL verbatim, including the `%20` and `?lang=en`. Do not leave any reference to the old `cacadets.org/Cadet/Ribbon-Chart` URL.
- Add a top-right toggle button: `<button id="lang-toggle">Español</button>`, positioned in the top-right corner via CSS (e.g. `position: fixed; top: …; right: …`) in the existing `<style>` block.
- Make the visible page text translatable: give each translatable text node a stable hook (e.g. `data-i18n="key"` attributes on the `<h1>`/`<p>`/link), and add an inline `<script>` holding an EN/ES string map plus a click handler. On click the handler swaps each element's text to the other language, sets `document.documentElement.lang` to `es`/`en`, and toggles the button label between `Español` (when page is English) and `English` (when page is Spanish). Keep markup/style consistent with the existing inline-style, system-font idiom; keep any inline code snippets small.
- Provide reasonable Spanish translations for the existing copy (heading, welcome/placeholder paragraphs, "Health check", and the Ribbon Chart link text).

### `test/server.test.js` (edit — additive)
- Add a test asserting the served landing page body contains the new Ribbon Chart URL `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` (match on a distinctive substring such as `Ribbon%20Chart?lang=en`).
- Add a test asserting the served page contains the toggle button with text `Español` and the `id="lang-toggle"` hook. (Toggle behavior is client-side JS; server tests only verify the markup is served — do not attempt to exercise DOM events in the node:test runner.)

## Acceptance / DoD
- `npm run build` (no-op placeholder) and `npm test` pass; CI green.
- The page shows a Ribbon Chart link using exactly `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`; no occurrence of the old `cacadets.org/Cadet/Ribbon-Chart` URL remains.
- A top-right button reading "Español" is present; clicking it switches all visible page text to Spanish, sets `<html lang="es">`, and changes the button label to "English"; clicking again restores English and the "Español" label.
- New tests cover the new link and the button markup; existing tests still pass.
- Contract followed: changes limited to `src/public/index.html` and `test/server.test.js`; no new runtime dependencies (stay zero-dependency).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-AO-ribbon-link-spanish-toggle.md — implement exactly what it specifies.

Work on branch ws/ribbon-link-spanish-toggle in worktree cacc-ws-ribbon-link-spanish-toggle.

Scope summary for self-verification: In src/public/index.html, add a Ribbon Chart link using exactly the URL https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en in the main content (no old "Ribbon-Chart" URL anywhere), and add a top-right "Español" button whose inline-JS handler toggles all visible page text between English and Spanish, sets document.documentElement.lang, and toggles its own label between "Español" and "English". Add additive tests in test/server.test.js asserting the new URL substring and the button markup are served. Stay zero-dependency.

Build green; the orchestrator handles commit/push/PR.
```
