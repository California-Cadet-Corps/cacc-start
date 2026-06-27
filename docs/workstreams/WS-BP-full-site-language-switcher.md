# WS-BP — Full-site language switcher with readable options

- Branch: ws/full-site-language-switcher
- PR title: [ws/full-site-language-switcher] WS-BP-full-site-language-switcher: readable language options + whole-page translation
- Depends on: none

## Problem

Product owner, verbatim:

> Can you  make the options on the switching language button text black instead of white so users can see the text clearly and the language options, Also  instead of  putting  certain things into the language  change the entire website to the language that  the user chooses

## Root cause / Investigation

The requirement describes a language switcher that does **not currently exist** on `main`. Investigation of the live code:

- `src/public/index.html` (1–28) — the entire site is a single static placeholder page. It has **no language switcher control**, **no `<select>`/dropdown**, **no JavaScript**, and **no translatable text strings**. The only `lang` reference is the hard-coded `<html lang="en">` at line 2.
- `src/public/index.html` (7–18) — the inline `<style>` block sets `body { background: #0b1d3a; color: #f5f7fa; }` (dark navy bg, near-white text) and `:root { color-scheme: light dark; }`. If a `<select>` were added here, its native `<option>` popup would inherit/contrast poorly — this is exactly the "white text you can't read" symptom the owner reports. The fix is to give the control and its `option`s an explicit light background with black text.
- `src/public/` — the only file is `index.html`; there is no `i18n.js` or translation asset yet (`find src/public -type f`).
- `src/server.js` (15–23, 33–51) — static file handler already serves any file under `public/` and already maps `.js` → `text/javascript` (line 18) and `.html` (line 16). So a new `i18n.js` asset will serve correctly **with no server change required**.
- `test/server.test.js` (15–23) — existing test only asserts the page contains `California Cadet Corps`. Build = no-op (`package.json` line 21); tests = `node --test` (line 22); lint = `node --check src/server.js` (line 23).

Conclusion: both requested behaviors must be **implemented from scratch, done right the first time** — (1) a switcher whose option text is black/readable, and (2) translation that swaps **every** visible string on the page, not just selected fragments.

## Scope

File-by-file changes (no full code dumps):

- `src/public/index.html`
  - Add a language switcher control (a `<select id="lang-switcher">` with one `<option>` per supported language). Place it accessibly (e.g. top of `<main>` or a header) with an associated visible/`aria-label` label.
  - Tag **every** visible text node for translation with a `data-i18n="<key>"` attribute: the `<h1>`, all three `<p>` blocks, and the `<code>` label context (lines 22–25). The point of the "entire website" requirement is that no string is left hard-coded.
  - In the `<style>` block, add rules so the switcher reads clearly against the dark page: `#lang-switcher, #lang-switcher option { color: #000; background: #fff; }` (black text on white — the core readability fix). Keep contrast for the closed control too.
  - Load the translation script: `<script src="/i18n.js" defer></script>`.

- `src/public/i18n.js` (new)
  - Export/define a `translations` dictionary keyed by language code (e.g. `en`, `es`; pick the set the owner expects — at minimum English + one more), each providing a string for **every** `data-i18n` key used in `index.html`.
  - On load and on switcher `change`, apply the chosen language to the **whole page**: update each `[data-i18n]` element's text, set `document.documentElement.lang`, and persist the choice (e.g. `localStorage`) so it survives reloads.
  - Guard against a missing key by falling back to the English string (so a partial dictionary never blanks out the page).

- `test/server.test.js`
  - Add a test asserting `GET /` returns markup containing the switcher (`id="lang-switcher"`) and `data-i18n` attributes.
  - Add a test asserting `GET /i18n.js` returns `200` with a `text/javascript` content-type (proves the asset serves and the full-page translation script is wired in).

No change to `src/server.js` is expected (static handler + `.js` MIME already cover the new asset). If the coder finds a gap, that is the only place a server edit would be justified.

## Acceptance / DoD

- `npm run build` (no-op) and `npm run lint` pass; `npm test` (`node --test`) passes including the new tests.
- The switcher's dropdown **options render in black text on a light background** and are clearly legible against the dark page.
- Selecting a language translates the **entire visible page** (every `data-i18n` node), not a subset; the `<html lang>` updates and the choice persists across reload.
- No hard-coded user-facing string remains untranslated in `index.html`.
- Contract followed: changes limited to the files listed in Scope; new code is covered by tests.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full workstream contract first at:
docs/workstreams/WS-BP-full-site-language-switcher.md

Work on branch ws/full-site-language-switcher in worktree cacc-ws-full-site-language-switcher.

Scope summary for self-verification: The site (src/public/index.html) is a static placeholder with NO existing language switcher — build one from scratch. Add a <select id="lang-switcher"> whose options use black text on a light background (color:#000;background:#fff) so they are readable against the dark page, tag every visible string with data-i18n, and add src/public/i18n.js so choosing a language translates the ENTIRE page (all data-i18n nodes), sets <html lang>, and persists the choice. Extend test/server.test.js to assert the switcher markup is served and /i18n.js returns 200 text/javascript. No src/server.js change is expected.

Build green; the orchestrator handles commit/push/PR.
```
