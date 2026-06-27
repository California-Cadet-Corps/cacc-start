# WS-BM — Translate every UI string for all language options

- Branch: ws/translate-all-ui-text
- PR title: [ws/translate-all-ui-text] WS-BM-translate-all-ui-text: full translation coverage for all site text
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you translate every single text on the website  for the language options instead of only translating some texts and not every single texts please and thank you

## Root cause / Investigation

The complaint describes a language switcher that leaves some strings
untranslated. Investigating the current checkout:

- `src/public/index.html` is the entire website — a single placeholder
  landing page. All user-visible text is hardcoded English, inline, with
  **no** translation keys, **no** language switcher, and **no** i18n system:
  - `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>`
  - `src/public/index.html:22` — `<h1>California Cadet Corps</h1>`
  - `src/public/index.html:23` — `<p>Welcome to <strong>start.cacadets.org</strong>.</p>`
  - `src/public/index.html:24` — `<p>This is the placeholder landing page. Replace it as the project grows.</p>`
  - `src/public/index.html:25` — `<p>Health check: <code>/healthz</code></p>`
  - `src/public/index.html:2` — `<html lang="en">` (static lang attribute)
- `grep -rniE "lang|translat|i18n|locale" src/ test/` returns only the
  static `lang="en"` attribute and the `lang` substring — confirming no
  translation layer exists today.
- `src/server.js` is a static file server (`src/server.js:43-51`); it does
  no templating or language negotiation, so translation must be done
  client-side in the static page.

Root cause of "only some texts get translated": there is no single source of
truth that enumerates every visible string. The fix is to introduce one
translation dictionary that keys **every** text node, plus a switcher that
re-renders **all** keyed nodes (and `document.title` + `<html lang>`) on
change — so partial coverage becomes structurally impossible. New strings
added later must go through the same dictionary.

## Scope

File-by-file changes (no full code blocks here):

- `src/public/index.html` (edit)
  - Wrap/annotate every visible text node with a stable `data-i18n` key:
    the `<h1>`, all three `<p>` elements (preserving the embedded
    `<strong>` / `<code>` markup), and the page title.
  - Add a visible language selector control (e.g. a `<select>` or button
    group) listing the supported language options.
  - Include/reference the new i18n script (below). Ensure the
    `<html lang>` attribute is updated, not left static.

- `src/public/i18n.js` (new)
  - Export/define a `translations` object: one entry per supported
    locale, each containing a value for **every** `data-i18n` key used in
    `index.html`. No key may be missing for any locale — this is what
    guarantees full coverage.
  - Supported locales: `en` (default) and `es` (Spanish) at minimum,
    given the California Cadet Corps audience. Structure must make adding
    more locales additive (drop in a new locale block).
  - On load and on selector change: translate every `[data-i18n]` node,
    set `document.title`, set `document.documentElement.lang`, and
    persist the choice (e.g. `localStorage`) so it survives reloads.
  - Guard: if any `[data-i18n]` key is absent from the chosen locale,
    fall back to `en` (and the code should make such gaps obvious in dev,
    e.g. console warn) rather than silently showing the key.

- `test/i18n.test.js` (new)
  - Parse `src/public/index.html`, collect every `data-i18n` key.
  - Assert every collected key exists in **every** locale of the
    `translations` object in `src/public/i18n.js` (no missing/empty
    values) — the regression guard against "only some texts translated".
  - Assert the page contains the language selector control and references
    `i18n.js`.

- `src/server.js` (verify only, likely no change)
  - Confirm `.js` files under `public/` are served with the JS MIME type
    (`src/server.js:15-23` already maps `.js`); no change expected.

Keep the existing visible English copy identical for the `en` locale so the
default page is unchanged.

## Acceptance / DoD

- `npm run build` is green and `npm test` passes, including the new
  `test/i18n.test.js`.
- Every user-visible string in `src/public/index.html` is driven by a
  `data-i18n` key; no hardcoded translatable text remains outside the
  dictionary (the `<strong>`/`<code>` literal tokens like
  `start.cacadets.org` and `/healthz` may stay as-is as proper nouns/paths).
- The `translations` object contains a value for every key in **every**
  supported locale — the test enforces zero gaps.
- Switching the language option updates **all** text on the page, the
  document title, and `<html lang>`; nothing remains in the prior language.
- The choice persists across reload.
- Contract followed; new tests cover the new code.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BM-translate-all-ui-text.md
Follow it exactly.

Branch: ws/translate-all-ui-text
Worktree: cacc-ws-translate-all-ui-text

Scope: The site (src/public/index.html) currently has hardcoded English text
and no language switcher. Introduce a single client-side i18n dictionary
(src/public/i18n.js) that keys EVERY visible string, add a language selector
(English + Spanish at minimum), and ensure switching languages re-renders all
[data-i18n] nodes plus document.title and <html lang>, persisting the choice.
Add test/i18n.test.js asserting every data-i18n key in index.html has a value
in every locale, so partial translation can never regress. Self-verify: load
the page, switch language, confirm no string stays untranslated.

Build green; the orchestrator handles commit/push/PR.
```
