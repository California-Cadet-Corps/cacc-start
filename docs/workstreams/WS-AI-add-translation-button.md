# WS-AI — Site translation button (language switcher)

- Branch: ws/add-translation-button
- PR title: [ws/add-translation-button] WS-AI-add-translation-button: client-side language switcher for the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> add I translation button that let you chose to what language translate the site example spanish, chinese, german, multiple languages

## Investigation

The app is a minimal, zero-dependency Node HTTP server that serves static files from `src/public/`:

- `src/server.js:25-52` — request handler. It serves any file under `PUBLIC_DIR` and already maps `.js` to `text/javascript` (`src/server.js:18`), so a new static JS asset needs **no server change**.
- `src/public/index.html` — the only page. The user-visible, translatable strings are:
  - `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>`
  - `src/public/index.html:22` — `<h1>California Cadet Corps</h1>`
  - `src/public/index.html:23` — "Welcome to start.cacadets.org."
  - `src/public/index.html:24` — "This is the placeholder landing page…"
  - `src/public/index.html:25` — "Health check: /healthz"
  - `<html lang="en">` at `src/public/index.html:2` should be updated to reflect the active language.
- `test/server.test.js` — two existing tests assert `/healthz` and `/` (matches `/California Cadet Corps/`). Tests boot the real server on an ephemeral port, so a new asset can be asserted the same way.

Root cause / scope: this is a **feature**, not a bug. Because the site is fully static and client-rendered, the correct, framework-free approach (matching the existing zero-dependency style) is a **client-side i18n switcher**: a language `<select>`, `data-i18n` keys on each translatable element, a translation dictionary, and persistence of the choice. No server, deploy, or dependency changes are required.

## Scope

File-by-file changes:

1. **`src/public/i18n.js`** (new static asset)
   - Export-free browser script (loaded via `<script src="/i18n.js">`).
   - A `translations` dictionary keyed by language code (`en`, `es`, `zh`, `de`) — English plus the three examples; structured so adding a language is one entry ("multiple languages").
   - Each language maps the `data-i18n` keys (`title`, `heading`, `welcome`, `placeholder`, `health`) to translated strings.
   - `applyLanguage(lang)`: set `document.documentElement.lang`, update `document.title`, and replace `textContent`/relevant markup for every `[data-i18n]` element; persist to `localStorage` under a key like `cacc-lang`.
   - On load: read saved language (or `navigator.language` fallback, default `en`) and apply it; wire the selector's `change` event.

2. **`src/public/index.html`**
   - Add `data-i18n="<key>"` attributes to the translatable elements at lines 22-25 (keep English as the default inline text so the page is readable with JS disabled).
   - Add a language switcher control in `<main>` (or a small fixed header) — a `<select id="lang-switcher">` with options for English / Español / 中文 / Deutsch (value = code). Add minimal CSS consistent with the existing inline `<style>`.
   - Reference the new script before `</body>`: `<script src="/i18n.js"></script>`.
   - The strings inside `index.html:23-25` containing `<strong>`/`<code>` should keep that inline markup intact; translate only the surrounding text (use distinct `data-i18n` keys for the text spans rather than overwriting the whole element's innerHTML, to preserve `<strong>start.cacadets.org</strong>` and `<code>/healthz</code>`).

3. **`test/server.test.js`**
   - Add a test: `GET /i18n.js` returns 200 with `Content-Type` containing `javascript` and the body contains the language codes (`es`, `zh`, `de`).
   - Add a test: `GET /` body contains `id="lang-switcher"` and at least one `data-i18n=` attribute.

No changes to `src/server.js`, deploy artifacts, or `package.json`.

## Acceptance / DoD

- `npm run build` (no-op placeholder) and `npm run lint` (`node --check src/server.js`) pass; server file is untouched so lint stays green.
- `npm test` passes, including the two new tests for `/i18n.js` and the switcher markup.
- The landing page shows a language selector; choosing Español / 中文 / Deutsch live-translates the title, heading, and body text without a page reload, and the choice persists across reloads via `localStorage`.
- With JavaScript disabled the page still renders readable English (inline defaults preserved).
- `<strong>start.cacadets.org</strong>` and `<code>/healthz</code>` markup is preserved after translation.
- Contract followed: only the files listed in Scope are changed; no new runtime dependencies.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-AI-add-translation-button.md and implement exactly what its Scope section specifies.

Work on branch ws/add-translation-button in worktree cacc-ws-add-translation-button.

Scope summary for self-verification: Add a client-side language switcher to the static landing page. Create src/public/i18n.js (a translation dictionary for en/es/zh/de plus an applyLanguage() that swaps [data-i18n] text, updates <html lang> and document.title, and persists the choice in localStorage); add a <select id="lang-switcher"> and data-i18n keys to src/public/index.html (keeping English inline defaults and preserving the <strong>/<code> markup); and add tests in test/server.test.js asserting /i18n.js is served and the switcher markup is present. Do not touch src/server.js, deploy artifacts, or package.json — the existing static server already serves the new .js asset.

Build green; the orchestrator handles commit/push/PR.
```
