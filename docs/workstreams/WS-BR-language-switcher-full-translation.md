# WS-BR — Readable language switcher with full-site translation

- Branch: ws/language-switcher-full-translation
- PR title: [ws/language-switcher-full-translation] WS-BR-language-switcher-full-translation: add readable language switcher that translates the whole page
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you  make the options on the switching language button text black instead of white so users can see the text clearly and the language options, Also  instead of  putting  certain things into the language  change the entire website to the language that  the user chooses

## Root cause / Investigation

The requirement references a language-switching button and partial translation, but **neither currently exists in the repository**. The app is a static placeholder:

- `src/public/index.html:20-26` — a single `<main>` block with one `<h1>` and three `<p>` elements; all copy is hard-coded English. There is no `<select>`, no language button, no `data-i18n` hooks, and no `<script>`.
- `src/public/index.html:7-18` — the `<style>` block sets a dark theme (`background: #0b1d3a; color: #f5f7fa`) but defines no rule for `<select>`/`<option>`. A native `<option>` dropdown that inherits the page's light text on the OS's white menu surface is what produces the unreadable "white text on white" the owner describes.
- `src/server.js:43-47` — serves `index.html` verbatim; translation must be client-side (no template/i18n layer exists).
- `test/server.test.js:15-24` — only asserts the page contains "California Cadet Corps"; no coverage for a switcher or translation.

So this is a build-from-scratch feature, scoped to two guarantees: (1) the switcher's option text renders in black for readability, and (2) selecting a language translates **every** visible string on the page, not a subset.

## Scope

- `src/public/index.html`
  - Add a `<select id="lang-switcher">` control (positioned top-right) with `<option>` entries for English (`en`) and Spanish (`es`) at minimum; mark each element of body copy (`h1`, the three `p` strings, the `code` label) with a `data-i18n="<key>"` attribute so the translator can reach all of them.
  - Add CSS so option text is readable: a rule giving `#lang-switcher option { color: #000; background: #fff; }` and a sensible `color`/`background` on `#lang-switcher` itself. (See ~5-line snippet rule below.)
  - Add an inline `<script>` holding a translations dictionary that contains a key for **every** `data-i18n` element in every supported language, plus a function that, on `change`, iterates all `[data-i18n]` nodes and replaces their text, updates `document.documentElement.lang`, and persists the choice to `localStorage` (and restores it on load). No string may be left untranslated — completeness is the acceptance bar.
- `test/server.test.js`
  - Add a test asserting the served HTML contains the `lang-switcher` control and at least one `data-i18n` attribute, so the switcher cannot silently regress out of the page.

Illustrative CSS (keep the real change in `index.html`):

```css
#lang-switcher option { color: #000; background: #fff; }
```

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; tests must be green).
- Dropdown `<option>` text renders in black on a white surface and is clearly legible against the dark page theme.
- Switching language translates **all** visible page text (heading and every paragraph), not just selected phrases; `<html lang>` updates to match.
- Every `data-i18n` key has a value in every supported language — no missing/fallback-to-English gaps for supported locales.
- Selection persists across reloads (localStorage) and restores on load.
- New behavior is covered by an added test; the WS contract above is followed; no unrelated files changed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BR-language-switcher-full-translation.md

Work on branch ws/language-switcher-full-translation in worktree cacc-ws-language-switcher-full-translation.

Scope: src/public/index.html currently has no language switcher and no i18n. Add a top-right <select id="lang-switcher"> (English + Spanish at minimum) whose <option> text is styled black on white for readability, tag every visible string with data-i18n, and add an inline script with a complete translations dictionary that swaps ALL tagged text on change, updates <html lang>, and persists the choice in localStorage. Add a test in test/server.test.js asserting the served HTML includes the switcher and a data-i18n attribute. Translate the entire page for each supported language — leave no string untranslated.

Build green; the orchestrator handles commit/push/PR.
```
