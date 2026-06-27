# WS-AR — Fix the translation button so it translates the whole site

- Branch: ws/fix-site-translation-toggle
- PR title: [ws/fix-site-translation-toggle] WS-AR-fix-site-translation-toggle: working in-page translation toggle covering all content
- Depends on: (none)

## Problem

Product owner, verbatim:

> fix the translation buttton so that it is not broken make it translate the whole site not just the top of the site

## Root cause / Investigation

The site is a single static placeholder page served by a zero-dependency Node HTTP server. The investigation shows **there is no translation button and no internationalization (i18n) logic anywhere in the repository** — so the existing "button" is effectively non-functional (it does not exist in source), which matches the report that it is "broken."

- `src/public/index.html:20-26` — the entire visible body: `<h1>` (line 22) plus three `<p>` elements (lines 23-25). All text is hard-coded English with no markup hooks, no `<button>`, and no `<script>`.
- `src/public/index.html:1` — `<html lang="en">`; the `lang` attribute is static and never updated.
- `src/server.js:25-52` — server only serves static files from `PUBLIC_DIR` and a `/healthz` endpoint; there is no translation route or query handling. No server change is required.
- `grep -rni "translat|i18n|lang" src test` — the **only** match is the `lang="en"` attribute at `src/public/index.html:2`. Confirms zero existing translation code.
- `package.json:13-24` — zero runtime dependencies; `build` is a no-op; `test` runs `node --test`; `lint` runs `node --check src/server.js`. The solution must stay dependency-free.

Interpretation of "translate the whole site, not just the top": the heading (`<h1>`, the "top") must translate along with **every** paragraph below it. The fix is a self-contained client-side language toggle that swaps all text nodes (heading + all paragraphs), not a partial one.

## Scope (file-by-file)

- `src/public/index.html`
  - Add a visible translation toggle `<button id="lang-toggle">` (e.g. in a top corner of `<main>` or `<body>`), labeled to switch between English and Spanish (Español). Spanish is the target language appropriate for the California Cadet Corps audience.
  - Tag **every** translatable text element with a stable key attribute, e.g. `data-i18n="title"`, `data-i18n="welcome"`, `data-i18n="placeholder"`, `data-i18n="health"`. Cover the `<h1>` (line 22) and all three `<p>` elements (lines 23-25) so the whole page is covered, not just the heading.
  - Add a small inline `<script>` (no external libraries) holding an `en`/`es` string dictionary and a function that, on button click, swaps the text of every `[data-i18n]` element, updates `document.documentElement.lang`, and updates the button label to offer the reverse direction. Keep the inline script concise.
  - Preserve inline markup currently inside paragraphs (e.g. `<strong>start.cacadets.org</strong>` and `<code>/healthz</code>`) — translate surrounding text without dropping these elements.

- `test/server.test.js`
  - Extend the existing "serves the landing page" test (or add a new test) to assert the served HTML contains the translation toggle (e.g. `id="lang-toggle"`) and at least one Spanish string from the dictionary, proving the feature ships in the response. Follow the existing `node:test` + `assert/strict` + `fetch` style.

No changes to `src/server.js` (static serving already delivers the updated HTML). No new dependencies.

## Acceptance / DoD

- `npm run build` and `npm run lint` pass (lint only checks `src/server.js`, which is unchanged).
- `npm test` passes, including the new assertion(s) that the toggle and Spanish strings are present in the served page.
- Clicking the toggle in a browser switches **all** page text (heading and every paragraph) between English and Spanish, updates `<html lang>`, and toggles the button label; clicking again switches back.
- No external/runtime dependencies added; solution is plain HTML + inline JS, consistent with the zero-dependency codebase.
- Contract followed; changes limited to the two files listed in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-AR-fix-site-translation-toggle.md

Work on branch ws/fix-site-translation-toggle in worktree cacc-ws-fix-site-translation-toggle.

Scope: The site (src/public/index.html) is a static placeholder page with no translation
button and no i18n logic. Add a visible English/Spanish toggle button plus a small inline
(no-dependency) script that swaps the text of EVERY element on the page — the heading and all
three paragraphs, not just the top — via data-i18n keys, and updates document.documentElement.lang.
Then extend test/server.test.js to assert the served HTML contains the toggle and a Spanish string.
Self-verify that clicking the button translates the whole page both directions and that npm test,
npm run lint, and npm run build all pass.

Build green; the orchestrator handles commit/push/PR.
```
