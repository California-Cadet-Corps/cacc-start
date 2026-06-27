# WS-BB — English/Spanish language toggle ("Español" button)

- Branch: ws/spanish-language-toggle
- PR title: [ws/spanish-language-toggle] WS-BB-spanish-language-toggle: add English/Spanish language toggle button
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you change the language  button to only  English Spanish and have the button say "Español"    and please have the button change the entire website and information to spanish for any spanish speakers that want to use the website

## Root cause / Investigation

This is a **feature add**, not a bug fix. The requirement says "change the language button," but no language button exists yet in the codebase.

- `src/public/index.html` (lines 1–28) is the entire user-facing site: a single static landing page with `<html lang="en">` (line 2), an inline `<style>` block (lines 7–18), and a `<main>` (lines 21–26) containing one `<h1>` and three `<p>` elements. There is **no `<script>`, no button, and no i18n/translation machinery anywhere**.
- A repo-wide grep for `language|español|spanish|i18n|locale|translat` returns zero matches — confirming nothing language-related currently exists.
- `src/server.js` (lines 25–52) is a static file server with a `/healthz` endpoint (lines 27–31); it serves `index.html` as-is and does no templating or content negotiation. It is **out of scope** for this WS — the toggle must be client-side.
- `test/server.test.js` (lines 15–23) asserts `GET /` returns 200 and the body matches `/California Cadet Corps/`. That string must remain present in the served HTML.
- Build is a no-op (`package.json` line 21); `npm test` runs `node --test`; lint (`node --check src/server.js`) only checks server.js syntax. No bundler, no framework — keep the implementation dependency-free and inline.

## Scope

File-by-file changes (no full code blocks — implementer decides exact markup):

1. **`src/public/index.html`** — the only functional change:
   - Add a single language toggle button inside `<main>` (or a small top corner). It is the only language control and offers exactly two languages: English and Spanish.
   - Initial button label text: **`Español`**. When the site is showing Spanish, the button label flips to `English` so the user can switch back (a two-state toggle — still "only English Spanish").
   - Mark every visible text string for translation. Recommended approach: add `data-i18n` keys to the `<h1>` and each `<p>` (lines 22–25) plus the page `<title>` (line 6), and embed a small inline `<script>` holding an English + Spanish dictionary that swaps `textContent` on toggle.
   - Translate **all** current copy: the heading "California Cadet Corps" (proper noun — may stay, translator's choice), the welcome/placeholder paragraphs, and the "Health check:" label. Keep the literal `start.cacadets.org`, the `/healthz` `<code>` value, and the string "California Cadet Corps" present somewhere in the default-rendered HTML so the existing test still matches.
   - On toggle, update `document.documentElement.lang` between `en` and `es`.
   - Persist the chosen language in `localStorage` and apply it on page load so the choice survives reloads (progressive enhancement — default English render must work with JS disabled).
   - Keep all CSS inline in the existing `<style>` block; add minimal styling for the button consistent with the dark theme (lines 9–17).

2. **No server change.** `src/server.js` stays as-is — the toggle is pure client-side JS in the static page.

3. **`test/server.test.js`** — add one test (additive, do not weaken existing two) asserting that `GET /` returns HTML containing the language toggle button (e.g. body matches `/Español/`) so the feature is regression-covered. Existing `/California Cadet Corps/` assertion must continue to pass.

## Acceptance / DoD

- `npm run build` and `npm test` pass; `npm run lint` passes.
- `GET /` renders in English by default with a visible button labeled **Español**; the existing test's `/California Cadet Corps/` match still holds.
- Clicking the button translates **all** visible page copy to Spanish, flips the button label to `English`, and sets `<html lang="es">`; clicking again returns to English.
- Only two languages are selectable (English, Spanish) — no third option, no dropdown of other languages.
- Language choice persists across page reloads; default English render works with JavaScript disabled.
- A new test covers the presence of the toggle button in served HTML.
- Contract followed; no out-of-scope files changed (server, deploy, CI untouched).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BB-spanish-language-toggle.md

Work on branch ws/spanish-language-toggle in worktree cacc-ws-spanish-language-toggle.

Scope: This is a client-side feature add. Add a single language toggle button to
src/public/index.html labeled "Español" that, when clicked, translates the entire
landing page's visible text between English and Spanish (only those two languages),
flips the button label to "English" while in Spanish, sets <html lang>, and persists
the choice in localStorage. Keep it dependency-free with an inline <script> and inline
CSS; do not change src/server.js. Add one additive test in test/server.test.js asserting
the toggle button appears in the served HTML, and keep the existing two tests green
(the "California Cadet Corps" string must remain in the default render).

Build green; the orchestrator handles commit/push/PR.
```
