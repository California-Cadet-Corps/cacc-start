# WS-BC — English/Spanish language toggle button

- Branch: ws/spanish-language-toggle
- PR title: [ws/spanish-language-toggle] WS-BC-spanish-language-toggle: add English/Spanish language toggle
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you change the language  button to only  English Spanish and have the button say "Español"    and please have the button change the entire website and information to spanish for any spanish speakers that want to use the website

## Root cause / Investigation

The requirement assumes a language button already exists. It does not — the site is a
single static placeholder page with no language switcher and no i18n of any kind.

- `src/public/index.html:1` — single static HTML page. `<html lang="en">` at line 2.
  User-visible copy is hard-coded in English:
  - `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>`
  - `src/public/index.html:22` — `<h1>California Cadet Corps</h1>`
  - `src/public/index.html:23-25` — three `<p>` paragraphs ("Welcome to…", "This is the
    placeholder landing page…", "Health check: /healthz")
- `src/server.js:25-52` — minimal zero-dependency static file server; serves
  `index.html` for `/`. No translation/locale handling, and none is needed: the toggle
  is purely client-side.
- `src/public/` contains only `index.html` — no JS/CSS asset files; styling/scripting is
  inline in the page.
- `test/server.test.js:15-23` — existing test asserts the landing page contains
  "California Cadet Corps".
- `package.json` scripts: `lint` = `node --check src/server.js`, `test` = `node --test`,
  `build` = no-op. No bundler or framework.

Conclusion: this is an additive feature — introduce a two-language (English/Spanish)
client-side toggle on the landing page. There is no existing button to "reduce"; we add
one limited to exactly English and Spanish.

## Scope

### `src/public/index.html`
- Add a language toggle `<button id="lang-toggle">` positioned in a top corner of the
  page (small fixed/absolute style consistent with existing inline `<style>`).
- Default page language is English; the button label reads **"Español"** (it names the
  language the user can switch to). After switching to Spanish, the label reads
  **"English"** so the user can switch back. Only these two languages exist.
- Wrap each user-visible string (h1 + the three `<p>` paragraphs at lines 22–25) so it
  can be swapped — e.g. give each element a `data-i18n` key, and store an inline JS
  translation map `{ en: {...}, es: {...} }` covering every visible string plus the
  document `<title>`.
- Add an inline `<script>` that, on click, swaps all `data-i18n` text to the chosen
  language, updates `document.documentElement.lang` ("en"/"es"), updates `<title>`, and
  toggles the button label between "Español" and "English". Persist the choice in
  `localStorage` and apply it on load so the preference sticks across visits.
- Provide Spanish translations for: title, "California Cadet Corps" (keep proper noun as
  is or localize subtitle), the welcome line, the placeholder-page line, and the
  "Health check: /healthz" line (keep the `/healthz` code literal unchanged).
- Keep it zero-dependency and inline — no new asset files, no framework.

### `test/server.test.js`
- Add a test asserting the served `/` HTML contains the toggle button labeled `Español`
  and at least one Spanish translation string from the inline map (so the feature is
  present in the shipped page). Keep existing tests passing.

## Acceptance / DoD

- `npm run build`, `npm run lint`, and `npm test` all pass (CI green).
- Landing page shows a language button labeled **"Español"** by default; only English and
  Spanish are offered.
- Clicking the button translates the entire visible page (heading, all paragraphs, and
  `<title>`) to Spanish and sets `<html lang="es">`; the button then reads "English" and
  clicking again returns to English.
- Choice persists across reloads via `localStorage`.
- New test covers the added markup/strings; contract (file scope above) followed; no
  files outside this scope changed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-BC-spanish-language-toggle.md

Branch: ws/spanish-language-toggle
Worktree: cacc-ws-spanish-language-toggle

Scope: There is NO existing language button — add one. In src/public/index.html add a
client-side English/Spanish toggle button labeled "Español" (top corner) that, on click,
translates the whole landing page (heading, all paragraphs, and <title>) to Spanish, sets
<html lang>, persists the choice in localStorage, and toggles its own label to "English"
to switch back. Keep it zero-dependency and inline (no new asset files, no framework), and
add a test in test/server.test.js asserting the served page contains the "Español" button
and a Spanish string.

Self-verify: only English and Spanish exist; default label is "Español"; toggling swaps
all visible copy both ways and survives reload.

Build green; the orchestrator handles commit/push/PR.
```
