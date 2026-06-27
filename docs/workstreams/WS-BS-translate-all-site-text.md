# WS-BS — Translate every text on the site for all language options

- Branch: ws/translate-all-site-text
- PR title: [ws/translate-all-site-text] WS-BS-translate-all-site-text: translate all visible page text for every language option
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you translate every single text on the website  for the language options instead of only translating some texts and not every single texts please and thank you

## Root cause / Investigation

The live site is a single static placeholder page served by a zero-dependency
Node server. There is currently **no internationalization mechanism at all** —
no language switcher, no translation dictionary, and no `data-i18n` markup.
The only language signal is the static `lang="en"` attribute.

Investigated files:

- `src/public/index.html` — the entire user-facing page. Visible text strings:
  - `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>`
  - `src/public/index.html:22` — `<h1>California Cadet Corps</h1>`
  - `src/public/index.html:23` — `<p>Welcome to <strong>start.cacadets.org</strong>.</p>`
  - `src/public/index.html:24` — `<p>This is the placeholder landing page. Replace it as the project grows.</p>`
  - `src/public/index.html:25` — `<p>Health check: <code>/healthz</code></p>`
- `src/server.js:25-52` — static file server; serves `index.html` and `.js`
  assets from `src/public/` (MIME for `.js`/`.json` already present at lines 17-19).
  No server-side rendering or templating; translation must be client-side.
- `test/server.test.js:15-24` — asserts `GET /` contains `California Cadet Corps`.
  Any restructure must keep that string present in the served HTML.

Conclusion: because no i18n exists, "only translating some texts" maps to
"nothing is wired up yet." The fix is to introduce language options **and**
guarantee **100% coverage** — every visible string (including `<title>` and the
language-switcher's own labels) is keyed and translated, with no English
left behind when a non-English language is selected.

## Scope

File-by-file changes (no full code blocks — coder implements):

1. `src/public/index.html`
   - Add a language `<select>` (or button group) control with an
     `id`/`aria-label`, offering at minimum **English + Spanish** (extendable).
   - Add a `data-i18n` key attribute to **every** text-bearing element:
     `<h1>`, all three `<p>` paragraphs, and any inline label. Use
     `data-i18n` on the element and, where an element mixes text + inline tags
     (e.g. `<strong>start.cacadets.org</strong>`, `<code>/healthz</code>`),
     either key the surrounding text nodes or keep the brand/path tokens
     untranslated by design and document that choice in a comment.
   - Give the `<title>` a key (e.g. `data-i18n-title` on `<html>`/handled in JS)
     so the document title also translates.
   - Keep the literal string `California Cadet Corps` present in the default
     served HTML so `test/server.test.js` still passes.
   - Reference the new translations + switcher script via `<script>` tags.

2. `src/public/i18n/translations.js` (new) — single source of truth: an object
   keyed by language code (`en`, `es`, …) → key → translated string. Must
   contain an entry for **every** `data-i18n` key used in the HTML. No missing
   keys per language.

3. `src/public/i18n/i18n.js` (new) — client script that: reads the saved/last
   language from `localStorage` (fallback `navigator.language`, then `en`);
   applies translations to all `[data-i18n]` nodes and the document title;
   updates `document.documentElement.lang`; wires the switcher `change` event to
   re-apply and persist the choice.

4. `test/i18n.test.js` (new) — coverage test that loads `translations.js` and
   asserts: (a) every key present in `en` exists in every other language, and
   (b) every `data-i18n` key referenced in `index.html` exists in all languages
   (parse the HTML string for `data-i18n="..."`). This is the guardrail that
   enforces "every single text."

5. `README.md` (optional, additive) — one line noting the i18n location
   (`src/public/i18n/`) and how to add a language. Only if the coder finds it
   helpful; not required for DoD.

Constraints: stay zero-dependency (vanilla JS, no build step — `npm run build`
is a no-op placeholder). Do not modify `src/server.js` request logic; `.js`
assets already have a MIME mapping.

## Acceptance / DoD

- `npm run build` and `npm test` pass (Node 20+).
- New `test/i18n.test.js` proves **no missing translation keys** for any
  language and that every `data-i18n` key in `index.html` is covered — this is
  the literal enforcement of "every single text."
- Existing `test/server.test.js` still passes (`GET /` contains
  `California Cadet Corps`; `GET /healthz` returns ok).
- Selecting any offered language translates **all** visible page text
  (heading, every paragraph, the document title, and the switcher labels) with
  no untranslated English left behind, except intentionally-literal brand/URL
  tokens (`start.cacadets.org`, `/healthz`) which are documented as deliberate.
- Language choice persists across reloads and updates `<html lang>`.
- Contract followed: changes limited to the files in Scope; zero new runtime
  dependencies; new code is tested.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BS-translate-all-site-text.md.

Work on branch ws/translate-all-site-text in worktree cacc-ws-translate-all-site-text.

Scope: the site (src/public/index.html) currently has no i18n at all. Add a
language switcher (English + Spanish minimum, extendable) plus a vanilla-JS
translation layer in src/public/i18n/ (translations.js + i18n.js) so that EVERY
visible string — heading, all paragraphs, the document <title>, and the switcher
labels — is keyed with data-i18n and fully translated, with the choice persisted
to localStorage and <html lang> updated. Add test/i18n.test.js that fails if any
data-i18n key in index.html is missing from any language, enforcing full
coverage; keep the literal "California Cadet Corps" in the served HTML so the
existing server test still passes. Stay zero-dependency.

Build green; the orchestrator handles commit/push/PR.
```
