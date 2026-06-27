# WS-BE — Full-site language switcher with readable options

- Branch: ws/full-site-language-switcher
- PR title: [ws/full-site-language-switcher] WS-BE-full-site-language-switcher: readable language menu that translates the whole page
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you  make the options on the switching language button text black instead of white so users can see the text clearly and the language options, Also  instead of  putting  certain things into the language  change the entire website to the language that  the user chooses

## Root cause / Investigation

The repository does **not yet contain a language switcher** — the requirement
describes behavior the product owner expects but which is not implemented. This
WS therefore builds the feature from scratch while honoring both asks:
(1) the language menu options must be readable (dark text), and (2) choosing a
language must translate the **entire** page, not a few strings.

Evidence from the current checkout:

- `src/public/index.html:1-28` — the only page. It is a static placeholder
  (`<h1>California Cadet Corps</h1>`, three `<p>` lines, a `<code>` health-check
  hint). There is no `<select>`, no button, no `data-i18n`, no script, and no
  translation logic anywhere on the page.
- `src/public/index.html:8-13` — the page styling sets a dark background
  (`background: #0b1d3a`) with near-white text (`color: #f5f7fa`). This is the
  exact condition that, once a native `<select>` is added, makes its dropdown
  options render as white-on-white (invisible) in browsers that inherit the
  control color into the option popup — i.e. the "options text is white, users
  can't see them" symptom the owner is anticipating. The fix is to set an
  explicit dark `color` (and light `background`) on the `<select>` and its
  `<option>` elements rather than letting them inherit the page's near-white
  color.
- Repo-wide search for `lang|translat|i18n|locale|switch` across
  `src/`/`test/` returns nothing (only `<html lang="en">`), confirming no
  existing i18n to extend.
- `src/server.js:15-23,43-47` — the static server already maps `.js` to
  `text/javascript` and serves any file under `src/public/`. A new
  `src/public/i18n.js` will be served correctly with **no server changes**.
- `test/server.test.js:15-23` — existing test asserts `GET /` returns 200 and
  the body matches `/California Cadet Corps/`; the switcher markup must not
  break this assertion.

## Scope

File-by-file changes (no full code blocks — coder fills in):

1. `src/public/index.html` (edit)
   - Add a language switcher control near the top of `<main>` (or fixed
     top-right): a native `<select id="lang-switcher" aria-label="...">` with one
     `<option>` per supported language (at minimum English + Spanish; structure so
     more languages are trivial to add).
   - In the `<style>` block add a rule giving the `<select>` and its `<option>`
     elements an explicit **dark text color** (e.g. `color:#0b1d3a;`) on a
     **light background** (e.g. `background:#fff;`) so the options are clearly
     readable — directly addresses ask (1). Do not rely on inherited page color.
   - Wrap every piece of visible page text (`<h1>`, each `<p>`, the `<code>`
     content, `<title>` if practical) in elements carrying a `data-i18n="<key>"`
     attribute so the whole page can be retranslated — addresses ask (2).
   - Add `<script type="module" src="/i18n.js"></script>` (or a plain script tag)
     before `</body>`.

2. `src/public/i18n.js` (new file)
   - Export/define a translations dictionary keyed by language code, each holding
     every `data-i18n` key used in `index.html` (full coverage — no partial
     translation).
   - On load: read the saved choice from `localStorage` (fallback to `navigator`
     language, then English), apply it, and set `document.documentElement.lang`.
   - `apply(lang)`: walk **all** `[data-i18n]` nodes and replace their text for the
     chosen language so the entire visible page switches, then persist the choice
     and update `<html lang>`.
   - Wire the `<select>` `change` event to `apply()`.
   - Keep it zero-dependency vanilla JS to match the project's minimal style.

3. `test/server.test.js` (edit — additive)
   - Add a test that `GET /i18n.js` returns 200 with a `text/javascript`
     content-type (proves the new asset is served).
   - Add a test that `GET /` body contains the switcher hook (e.g. matches
     `/id="lang-switcher"/`) and at least one `data-i18n` attribute, so the
     contract stays enforced. Keep the existing two tests passing.

No changes to `src/server.js` are required (static `.js` serving already works).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; tests must
  be green, including the existing `GET /healthz` and `GET /` tests).
- Language `<select>` options render with dark, clearly readable text on a light
  background (no white-on-white) — verified by the added CSS rule.
- Selecting a language translates **every** visible text node on the page (all
  `[data-i18n]` elements), not a subset; `<html lang>` updates accordingly.
- Choice persists across reloads via `localStorage`.
- At least English + Spanish fully covered; adding a language is just a new
  dictionary entry + `<option>`.
- New code is covered by tests in `test/server.test.js`; the existing
  `/California Cadet Corps/` assertion still holds.
- Contract followed: only the files listed in Scope are touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-BE-full-site-language-switcher.md — follow its Scope and
Acceptance/DoD exactly.

Branch: ws/full-site-language-switcher
Worktree: cacc-ws-full-site-language-switcher

Scope summary for self-verification: Build a full-site language switcher. Add a
native <select id="lang-switcher"> to src/public/index.html whose options use
explicit dark text on a light background (so they are readable — they must NOT be
white-on-white), mark every visible text node with data-i18n keys, and add a new
zero-dependency src/public/i18n.js that translates ALL [data-i18n] nodes on change,
persists the choice in localStorage, and sets <html lang>. Cover English + Spanish
fully. No changes to src/server.js. Extend test/server.test.js to assert /i18n.js
is served and that index.html contains the switcher + a data-i18n attribute, while
keeping the existing healthz and landing-page tests green.

Build green; the orchestrator handles commit/push/PR.
```
