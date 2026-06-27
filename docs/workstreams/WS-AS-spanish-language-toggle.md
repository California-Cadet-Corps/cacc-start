# WS-AS — English/Spanish language toggle button

- Branch: ws/spanish-language-toggle
- PR title: [ws/spanish-language-toggle] WS-AS-spanish-language-toggle: add English/Spanish "Español" toggle that translates the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you change the language  button to only  English Spanish and have the button say "Español"    and please have the button change the entire website and information to spanish for any spanish speakers that want to use the website

## Root cause / Investigation

This is a **feature request**, not a bug. The premise ("change the language button") assumes a
language button already exists — it does **not**. Investigation:

- `src/public/index.html:1-28` — the entire website is one static placeholder page. Visible text:
  - `index.html:6` `<title>California Cadet Corps — Start</title>`
  - `index.html:22` `<h1>California Cadet Corps</h1>`
  - `index.html:23` `Welcome to <strong>start.cacadets.org</strong>.`
  - `index.html:24` `This is the placeholder landing page. Replace it as the project grows.`
  - `index.html:25` `Health check: <code>/healthz</code>`
  - There is no `<button>`, no `<script>`, no language selector, and `<html lang="en">` is hard-coded (`index.html:2`).
- `src/server.js:25-52` — server is a zero-dependency static file server. It only serves files
  from `src/public/` plus a `/healthz` JSON endpoint. No templating, no per-request locale logic.
  Translation must therefore be **client-side** inside `index.html`.
- Grep for `language|español|spanish|i18n|locale|translat` across all source: **no matches** —
  no existing i18n machinery to modify or reuse.
- `test/server.test.js:15-23` — current page test asserts the served `/` HTML matches
  `/California Cadet Corps/`. New assertions should follow this same served-HTML pattern.

Conclusion: add a brand-new two-language (English/Spanish) toggle button to the single landing
page, with all visible copy translated client-side. "Only English Spanish" = exactly two
languages, no others.

## Scope

### `src/public/index.html` (modify — the main change)
- Add a language toggle `<button id="lang-toggle">` near the top of `<main>` (or fixed top-right).
  Per the requirement, when the page is in **English** the button reads **`Español`** (offering the
  switch to Spanish). When the page is in Spanish it reads `English` to switch back — a standard
  two-state toggle. Keep exactly two languages: English and Spanish.
- Mark every piece of visible copy with a `data-i18n="<key>"` attribute (h1, the two paragraphs,
  the "Health check" label, and `<title>` via a key). Keep `start.cacadets.org` and `/healthz`
  literals intact inside the translated strings.
- Add a small inline `<script>` (zero-dependency, no build step) holding an `en`/`es` translations
  dictionary and a `setLang(lang)` function that: swaps each `data-i18n` element's text, updates
  `document.documentElement.lang` (`en`/`es`), updates the button label, and persists the choice in
  `localStorage` so it survives reloads. On load, read the saved choice (default `en`) and apply it.
- Provide Spanish translations for all keys, e.g. title → "Cuerpo de Cadetes de California — Inicio",
  welcome → "Bienvenido a start.cacadets.org.", placeholder line → "Esta es la página de inicio
  provisional. Reemplázala a medida que el proyecto crezca.", health → "Verificación de estado:".
  (Final wording is the coder's to refine; keep it natural Spanish.) "California Cadet Corps" /
  "Cuerpo de Cadetes de California" for the h1.
- Add minimal CSS for the button consistent with the existing inline `<style>` (dark navy theme).

### `test/server.test.js` (modify — add coverage)
- Add a test asserting the served `/` HTML contains the toggle button (e.g. matches `Español` and
  `id="lang-toggle"`).
- Add a test asserting the served HTML embeds the Spanish translation strings (e.g. matches
  `Bienvenido` / `Verificación`), confirming both languages ship to the client.
- Do not break the existing two tests.

### No server changes
`src/server.js` already serves `index.html` and needs no changes. Do not add server-side locale
logic — translation is entirely client-side.

## Acceptance / DoD
- `npm test` passes (existing two tests + new toggle/Spanish-string tests).
- `npm run lint` (`node --check src/server.js`) passes; `npm run build` (no-op) succeeds.
- The landing page shows a single language button reading **`Español`** in the default (English)
  state; clicking it translates **all** visible page copy to Spanish and the button flips to
  `English`; clicking again returns to English. Exactly two languages offered.
- `document.documentElement.lang` updates to `es`/`en` with the selection; choice persists across
  reloads via `localStorage`.
- No new runtime dependencies; change stays within `index.html` (+ test). Contract followed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full workstream contract first: docs/workstreams/WS-AS-spanish-language-toggle.md

Work on branch `ws/spanish-language-toggle` in worktree `cacc-ws-spanish-language-toggle`.

Scope: The site is a single static placeholder page at src/public/index.html served by a
zero-dependency static server — there is currently NO language button. Add a two-language
(English/Spanish only) toggle button that reads "Español" in the English state and flips the entire
page's visible copy to Spanish (button then reads "English") via an inline client-side script with
an en/es translations dictionary, updating <html lang> and persisting the choice in localStorage.
Add tests in test/server.test.js asserting the served HTML contains the button and the Spanish
strings; keep the existing tests passing. Do not add server-side locale logic or new dependencies.

Self-verify: npm test, npm run lint, and npm run build all pass; the button toggles all copy
between English and Spanish.

Build green; the orchestrator handles commit/push/PR.
```
