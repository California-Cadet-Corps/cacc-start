# WS-BD — English/Spanish language toggle ("Español" button)

- Branch: ws/english-spanish-language-toggle
- PR title: [ws/english-spanish-language-toggle] WS-BD-english-spanish-language-toggle: add EN/ES language toggle button
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you change the language  button to only  English Spanish and have the button say "Español"    and please have the button change the entire website and information to spanish for any spanish speakers that want to use the website

## Root cause / Investigation

There is **no existing language button** anywhere in the codebase. The site today is a
single static placeholder page with no JavaScript and no internationalization (i18n).

- `src/public/index.html:1-28` — the entire site. `<html lang="en">` (line 2). All
  user-facing copy is hardcoded English: the `<h1>` (line 22) and three `<p>` blocks
  (lines 23–25, including the `/healthz` health-check line). There is no `<button>`,
  no `<select>`, and no `<script>` element.
- `src/server.js:25-52` — a static file server. `/` serves `src/public/index.html`
  (line 35); `.js` files are served with the correct MIME type (line 21), so additional
  static assets under `src/public/` would be served if added.
- `test/server.test.js:15-23` — the existing "serves the landing page" test fetches `/`
  and regex-matches the response body (no DOM). Client-side behavior is asserted by
  string-matching the served HTML, since the project is zero-dependency (no jsdom).
- `package.json` — `"type": "module"`, `npm test` runs `node --test`, `npm run build`
  is a no-op placeholder, `npm run lint` runs `node --check src/server.js` only. No
  bundler, no framework, zero runtime dependencies.

Because no language button exists, the literal "change the language button" cannot be
done; the faithful interpretation is to **add** an English/Spanish toggle that (a) is
labeled "Español", and (b) translates all on-page content. "The entire website" is, at
present, the single `index.html` placeholder page.

## Scope

Keep the implementation **vanilla and zero-dependency** to match the existing style.

- `src/public/index.html`
  - Add a language toggle `<button id="lang-toggle">` whose default (English-mode) label
    is exactly `Español`. When the page is in Spanish, the label flips to `English` so the
    user can switch back (button label always names the language you switch TO).
  - Give each translatable text node a stable `data-i18n` key: the `<h1>` and the three
    `<p>` blocks (lines 22–25). Keep the existing English text as the default content.
  - Add an inline `<script>` holding an `en`/`es` translation dictionary keyed by the same
    `data-i18n` keys, plus toggle logic that: swaps each element's text, sets
    `document.documentElement.lang` to `en`/`es`, updates the button label, persists the
    choice to `localStorage`, and on load applies the saved choice (falling back to
    `navigator.language` starting with `es`, else English).
  - Provide accurate Spanish translations for the title, welcome line, placeholder line,
    and the health-check line. Add `aria-label` on the button for accessibility.
  - The toggle must offer **only** English and Spanish (no other languages).

- `test/server.test.js`
  - Add a test asserting `GET /` returns HTML that contains the `Español` button text and
    the Spanish translation strings (proving the translation payload ships to the client).
    Server-side regex match only — do not add a DOM/jsdom dependency.
  - Leave the existing two tests unchanged.

No changes to `src/server.js` are required (it already serves `index.html` and `.js`).

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed; `npm test` passes including the new test.
- The served landing page renders a single button labeled `Español` (English mode) that,
  when clicked, translates the whole page to Spanish, sets `<html lang="es">`, and flips
  its own label to `English`; clicking again returns to English.
- Only English and Spanish are offered. Language choice persists across reloads.
- No new runtime dependencies; implementation stays vanilla HTML/JS.
- Contract followed; new client behavior is covered by the server-side string assertion.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
  docs/workstreams/WS-BD-english-spanish-language-toggle.md

Work on branch `ws/english-spanish-language-toggle` in worktree
`cacc-ws-english-spanish-language-toggle`.

Scope: Add an English/Spanish language toggle to src/public/index.html — a button
labeled "Español" (label flips to "English" in Spanish mode) that translates all page
copy (h1 + the three paragraphs incl. the /healthz line), sets <html lang>, persists
the choice to localStorage, and offers only English and Spanish. Keep it vanilla and
zero-dependency (inline <script> + en/es dictionary). Add one server-side test in
test/server.test.js asserting GET / serves the "Español" button and the Spanish strings;
leave the existing tests untouched.

Build green; the orchestrator handles commit/push/PR.
```
