# WS-BJ — Legible language switcher + full-site translation

- Branch: `ws/language-switcher-fix-and-full-translation`
- PR title: `[ws/language-switcher-fix-and-full-translation] WS-BJ: black switcher option text + translate whole site`
- Depends on: the workstream that introduces the multilingual landing page and `i18n.js` (currently in-flight as `origin/ws/remove-enlisted-ranks-from-circle`, rev `73c3716`). The language switcher, `src/public/i18n.js`, `src/public/styles.css`, and `src/public/chain-of-command.html` do **not** exist on `main` yet — they must land first. The orchestrator sequences this; branch off `main` only after that content is present.

## Problem

Product owner, verbatim:

> Can you  make the options on the switching language button text black instead of white so users can see the text clearly and the language options, Also  instead of  putting  certain things into the language  change the entire website to the language that  the user chooses

Two asks: (1) the language-switcher option text renders white/illegible — make it black so the options are readable; (2) translation is partial ("certain things") — selecting a language must translate the **entire** site, not a handful of strings.

## Root cause / Investigation

All line numbers are against `origin/ws/remove-enlisted-ranks-from-circle` (rev `73c3716`), the source of the language feature.

### Ask 1 — white option text
- `src/public/index.html:20-21` style `#lang-switcher` and `#lang-switcher option` with `color:#0b1d3a` on `background:#fff`, but **no `color-scheme` is declared** anywhere — `src/public/styles.css:2` (`:root`) does not set it, and the old inline `:root { color-scheme: light dark }` was dropped during the styles.css migration (see TODO at `index.html:6`). On a dark-mode OS the native `<select>` popup ignores the author `color` and paints options with the OS dark theme → white text on a dark popup. The fix is to force a light rendering context on the control (`color-scheme: light`) and keep the explicit dark `color`.
- `src/public/index.html:19` styles `#lang-toggle` as `background:transparent; border:1px solid currentColor`, so its label inherits the body's near-white `--text-light` (`styles.css:9`, `#f5f7fa`). The "switching language button" itself is therefore white-on-navy. Treat both controls.

### Ask 2 — only "certain things" translate
- **Two competing, half-wired i18n systems coexist.** Inline `<script>` at `index.html:503-560` defines `setLang()` (`index.html:524`) which **clamps to en/es** (`if (lang !== 'en' && lang !== 'es') lang = 'en'`) and is bound to the `#lang-toggle` button (`index.html:35`, only English↔Español). Separately, `/i18n.js` (loaded at `index.html:561`) defines `applyLanguage()` (`i18n.js:37`), is bound to the `#lang-switcher` dropdown (`index.html:52-57`, four options en/es/zh/de), and supports four languages — but its inline-attribute pass only resolves es vs en (`i18n.js:52`, `langAttr = lang === 'es' ? 'es' : 'en'`). So choosing 中文/Deutsch only swaps the ~6 `data-i18n` dictionary keys and leaves every `data-en`/`data-es` element in English.
- **Coverage is tiny.** index.html has only 4 `data-i18n` occurrences and 22 `data-en` occurrences (11 elements); **61 `<p>/<h2>/<h3>` elements carry no translation attribute at all** (plus list items, CTAs, the footer, alt/aria text). The bulk of the page is hard-coded English regardless of language.
- **Second page is entirely untranslated.** `src/public/chain-of-command.html` (307 lines) has no `i18n.js` include, no switcher, and no `data-*` translation attributes. "The entire website" must include it.

## Scope (file-by-file — no full code blocks)

1. `src/public/index.html`
   - Switcher legibility: on `#lang-switcher` and `#lang-switcher option` (lines 20-21) add `color-scheme: light` and keep an explicit dark `color` so the native popup paints black text. Give `#lang-toggle` (line 19) a legible treatment (explicit readable color/contrast). Verify in a dark-mode browser.
   - Consolidate to ONE engine: make `#lang-switcher` the single canonical control driven by `i18n.js`. Remove (or make delegate to `i18n.js`) the duplicate inline `setLang()` block (lines 503-560) and the redundant 2-language `#lang-toggle` so there is no en/es-only path overriding the 4-language selection. If `#lang-toggle` is kept, it must call the same `applyLanguage` and support all offered languages.
   - Full coverage: ensure every user-visible string is translatable. Standardize on `data-i18n` keys (recommended for maintainability) — tag the 61 untranslated text elements and all remaining nav/CTA/footer/aria/alt/title strings — or extend the inline-attribute approach to `data-en/-es/-zh/-de` consistently. Do not leave any visible copy hard-coded.

2. `src/public/i18n.js`
   - Generalize the inline-attribute pass (lines 51-57) to apply `data-` + `lang` for **all** offered languages with English fallback, not just es/en.
   - Provide **complete** dictionaries for en/es/zh/de covering every key/string introduced above (currently only ~6 keys exist). This is the bulk of the translation-content work; flag any strings left machine-untranslated for human review rather than silently dropping them.
   - Keep `localStorage` persistence and `navigator.language` detection already present.

3. `src/public/styles.css`
   - If switcher styles are migrated here, add the `color-scheme: light` + dark-`color` rules for `#lang-switcher`/`option` and the legible `#lang-toggle` treatment here instead of inline. Keep one home for these rules; don't duplicate across files.

4. `src/public/chain-of-command.html`
   - Bring into the i18n system: include `/i18n.js`, render the same `#lang-switcher`, tag its content with the same `data-i18n`/`data-*` scheme, and add its strings to the `i18n.js` dictionaries so this page also switches fully.

5. `test/server.test.js`
   - Add coverage asserting the served pages wire up the switcher and that translation markup is present (e.g. `i18n.js` is referenced and key elements carry translation attributes). Keep tests aligned with the zero-dependency server setup; do not add heavyweight test deps.

## Acceptance / DoD

- `npm run build` and `npm test` pass; `npm run lint` clean.
- Selecting any of the four languages (English/Español/中文/Deutsch) translates **all** visible copy on **both** `index.html` and `chain-of-command.html` — no English remnants except intentionally-untranslated proper nouns/links.
- The switcher's option list and the switcher control render with legible black/dark text in both light- and dark-mode browsers (no white-on-white or invisible options).
- Only one language engine drives the UI; the previous en/es-only inline path no longer overrides the 4-language selection.
- New/updated tests cover the switcher wiring and translation markup.
- Contract followed; changes confined to the files in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full workstream contract first:
docs/workstreams/WS-BJ-language-switcher-fix-and-full-translation.md

Work on branch `ws/language-switcher-fix-and-full-translation` in worktree
`cacc-ws-language-switcher-fix-and-full-translation`, branched off `main` after the
multilingual-site workstream (i18n.js, styles.css, chain-of-command.html, the
#lang-switcher dropdown) has landed on main.

Scope to self-verify: (1) Make the language switcher legible — force `color-scheme: light`
plus an explicit dark color on `#lang-switcher`/its `option`s and give `#lang-toggle` a
readable treatment so option text is black, not white, in dark-mode browsers. (2) Translate
the ENTIRE site: consolidate onto the single `i18n.js` engine, generalize its inline-attribute
pass to all four languages (en/es/zh/de) with English fallback, tag every untranslated visible
string on both index.html and chain-of-command.html, and supply complete dictionaries — leaving
no hard-coded English and removing the duplicate en/es-only inline path. Add tests for switcher
wiring and translation markup.

Build green; the orchestrator handles commit/push/PR.
```
