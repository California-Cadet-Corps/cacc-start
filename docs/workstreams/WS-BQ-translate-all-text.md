# WS-BQ — Translate every text on the site for all language options

- Branch: ws/translate-all-text
- PR title: [ws/translate-all-text] WS-BQ-translate-all-text: full-coverage i18n so every visible string translates
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you translate every single text on the website  for the language options instead of only translating some texts and not every single texts please and thank you

## Root cause / Investigation

The complaint assumes a language switcher exists that translates *some* strings but not others. Investigation shows there is **no i18n system at all** — every visible string is hardcoded English with no language options:

- `src/public/index.html:2` — `<html lang="en">` is static; `lang` never changes.
- `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>` (document title, untranslated).
- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>`.
- `src/public/index.html:23` — `Welcome to <strong>start.cacadets.org</strong>.`
- `src/public/index.html:24` — `This is the placeholder landing page. Replace it as the project grows.`
- `src/public/index.html:25` — `Health check: <code>/healthz</code>`.
- `src/server.js:25-52` — serves static files only; no server-side templating/locale logic. Any i18n must be client-side.
- `test/server.test.js:21` — asserts the served page contains `California Cadet Corps`; the default (English) render must keep that string present so this test stays green.

So the real scope is not "fix a partial translation" — it is "introduce a language switcher whose translation set covers **100%** of the page's visible text, leaving no string in only one language."

## Scope (file-by-file)

- `src/public/index.html`
  - Tag **every** text-bearing node with a stable `data-i18n="<key>"` (or `data-i18n-html` for nodes containing inline markup like `<strong>`/`<code>`): h1 (`src/public/index.html:22`), the three paragraphs (`:23`, `:24`, `:25`), and the document title (`:6`, e.g. `data-i18n-title`).
  - Add a visible language-selector control (e.g. a `<select>` or button group) inside `<main>`; its own label/option names must also be keyed so the control itself is fully translated.
  - Link the new i18n script (below). On load and on language change: apply translations to all `[data-i18n]`/`[data-i18n-html]` nodes, set `document.title`, set `document.documentElement.lang`, and persist the choice (e.g. `localStorage`).
- `src/public/i18n.js` (new)
  - Export/define a dictionary keyed by language code; **every** key used in `index.html` must have an entry for **every** offered language — no missing keys, no English fallback masking a gap.
  - Provide an `applyTranslations(lang)` routine that iterates all keyed nodes plus title and `<html lang>`. Default language = English so existing behavior and the server test are preserved.
  - Offer at least English (`en`) and Spanish (`es`); structure the dictionary so adding a language is just one more block (document the full key list at top).
- `test/server.test.js`
  - Add a test asserting the served page links `i18n.js` and exposes the language selector markup, and that the English default still contains `California Cadet Corps` (keeps `:21` assertion valid).
- `src/public/` static serving already supports `.js` via `src/server.js:18` MIME map — no server change needed; confirm `i18n.js` is reachable at `/i18n.js`.

Out of scope: server-side rendering, build tooling, third-party i18n libraries (keep zero-dependency per `src/server.js:1-2`).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is the no-op placeholder; tests include the new coverage).
- `npm run lint` passes (`node --check src/server.js`); new `i18n.js` is valid ES module syntax.
- Switching language updates **every** visible string — h1, all paragraphs (including the `<strong>`/`<code>` ones), the language-selector labels, the document `<title>`, and `<html lang>` — with **zero** strings left untranslated. Verify by confirming each `data-i18n` key has an entry in each language.
- Default load renders English so `test/server.test.js:21` (`/California Cadet Corps/`) still matches.
- Contract followed: no edits outside the files listed in Scope; no new runtime dependencies.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-BQ-translate-all-text.md in full before starting.
Work on branch ws/translate-all-text in worktree cacc-ws-translate-all-text.

Scope: The site is a single static placeholder page (src/public/index.html) served by a
zero-dependency static server (src/server.js); there is currently NO i18n system. Add a
client-side language switcher plus a new src/public/i18n.js translation dictionary so that
EVERY visible string — h1, all three paragraphs, the language-selector labels, the document
<title>, and <html lang> — translates for every offered language (at least English and
Spanish), with no string left untranslated and English as the default. Add a test in
test/server.test.js for the i18n script/selector and keep the existing "California Cadet Corps"
assertion green.

Build green; the orchestrator handles commit/push/PR.
```
