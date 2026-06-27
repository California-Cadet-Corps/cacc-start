# WS-AM — Ribbon Chart link + Español/English language toggle

- Branch: ws/ribbon-link-spanish-toggle
- PR title: [ws/ribbon-link-spanish-toggle] WS-AM-ribbon-link-spanish-toggle: update Ribbon Chart link and add Español toggle
- Depends on: (none)

## Problem

Product owner requirement, verbatim:

> remove "cacadets.org/Cadet/Ribbon-Chart" and replace it with "https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en" in the same location on the website
> also in the top right corner add a button that says "Español" and have it change the website to spanish when pressed, also when it is pressed the text on the button changes to "english" and when pressed again it changes the website back to english

## Root cause / Investigation

The site is a single static landing page served by a zero-dependency Node HTTP server.

- `src/public/index.html:1-28` — the entire user-facing page. It contains the `<main>` heading and three `<p>` paragraphs but **no Ribbon Chart link currently exists**. A repo-wide grep for `Ribbon`, `cacadets.org/Cadet`, `Ribbon-Chart` finds **zero matches** in `src/` (the only `cacadets.org` references are documentation/config). The page is described in `index.html:24` as a placeholder.
  - Consequence: there is no `cacadets.org/Cadet/Ribbon-Chart` anchor to "remove." The faithful execution is to **add** the Ribbon Chart link pointing at the new URL `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` in the page body. If a future change introduces the old link before this lands, replace its `href` in place instead of adding a duplicate.
- `src/public/index.html:2` — `<html lang="en">`; should be updated by the toggle to `lang="es"` when Spanish is active.
- `src/public/index.html:7-18` — inline `<style>` block; the top-right toggle button needs styling (e.g. `position: fixed; top; right`).
- `src/server.js:25-52` — static file server; serves `index.html` as-is. No server-side rendering, so the language toggle must be **client-side JavaScript** inside `index.html`. No build/bundler step (`package.json` build is a no-op), so plain inline `<script>` is appropriate.
- `test/server.test.js:16-25` — existing test asserts `GET /` returns 200 and body matches `/California Cadet Corps/`. New tests should assert the page contains the new Ribbon Chart URL and the `Español` button without breaking this.

## Scope

File-by-file changes (no full code blocks):

- `src/public/index.html`
  - Add an anchor in the `<main>` body linking to `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` with visible text (e.g. "Ribbon Chart"). This is the "same location" the requirement refers to — the page body. If an existing `cacadets.org/Cadet/Ribbon-Chart` link is ever present, swap its `href` rather than adding a second link.
  - Add a language-toggle `<button>` positioned in the top-right corner. Initial label: `Español`. Add CSS in the existing `<style>` block to fix it to the top-right (`position: fixed; top; right;`) above page content.
  - Mark the translatable text (the `<h1>` and the paragraphs at `index.html:22-25`) so the script can swap between English and Spanish strings — e.g. `data-en` / `data-es` attributes, or an id-keyed string map in the script.
  - Add an inline `<script>` that, on button click: toggles all marked text between English and Spanish, sets `document.documentElement.lang` to `es`/`en`, and toggles the button label between `Español` (when page is English) and `english` (when page is Spanish). Pressing again reverts to English. Provide Spanish translations for the heading and each paragraph. Keep the literal string `California Cadet Corps` present in the English state so the existing test still matches.
- `test/server.test.js`
  - Add a test asserting `GET /` body contains `Ribbon%20Chart?lang=en` (the new URL) and contains the `Español` button label. Do not remove the existing two tests.

Notes:
- Keep everything dependency-free and inline (no new npm packages, no framework) to match the existing zero-dependency design.
- Button text casing per requirement: `Español` then `english` (lowercase as written) — follow verbatim.

## Acceptance / DoD

- `npm run build` succeeds (no-op) and `npm test` passes, including the existing `/healthz` and `GET /` tests plus the new assertions.
- `npm run lint` (`node --check src/server.js`) passes.
- `src/public/index.html` contains a link whose href is exactly `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`, and no remaining reference to `cacadets.org/Cadet/Ribbon-Chart`.
- A button labeled `Español` appears fixed in the top-right corner; clicking it switches all page text to Spanish, sets `<html lang="es">`, and changes the label to `english`; clicking again restores English text, `<html lang="en">`, and the `Español` label.
- No new runtime dependencies added; change is contained to `src/public/index.html` and `test/server.test.js`.
- Contract followed; build green.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-AM-ribbon-link-spanish-toggle.md in full before writing any code.

Work on branch ws/ribbon-link-spanish-toggle in worktree cacc-ws-ribbon-link-spanish-toggle.

Scope: In src/public/index.html, add (or, if it ever exists, replace in place) a Ribbon Chart link whose href is exactly https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en in the page body, and add a fixed top-right button labeled "Español" that toggles all page text between English and Spanish (also updating <html lang> and the button label between "Español" and "english"). Keep it dependency-free inline HTML/CSS/JS, preserve the literal "California Cadet Corps" text in English state, and add a test in test/server.test.js asserting the new URL and the "Español" button are served without removing the existing tests.

Self-verify: npm test, npm run lint, and npm run build all pass.

Build green; the orchestrator handles commit/push/PR.
```
