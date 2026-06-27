# WS-BV — Readable language switcher + full-site translation

- Branch: ws/full-site-language-switcher
- PR title: [ws/full-site-language-switcher] WS-BV-full-site-language-switcher: readable language options + translate whole page
- Depends on: (none)

## Problem

Product owner, verbatim:

> Can you  make the options on the switching language button text black instead of white so users can see the text clearly and the language options, Also  instead of  putting  certain things into the language  change the entire website to the language that  the user chooses

## Root cause / Investigation

The site is a single static page served by a zero-dependency file server:

- `src/server.js:25-52` — serves files from `src/public/`; `/` maps to `index.html` (`src/server.js:35`). No framework, no existing i18n layer.
- `src/public/index.html` is the ENTIRE website (one page). All visible copy is hardcoded English at `src/public/index.html:22-25` (`<h1>`, three `<p>`, `<strong>`, `<code>`).
- There is currently **no** language-switching control anywhere in the repo (grep for `lang`/`i18n`/`translat`/`locale` returns only `index.html`, which only has the `<html lang="en">` attribute at `src/public/index.html:2`).

Two distinct issues to address:

1. **White / unreadable option text.** The body sets `color: #f5f7fa` (near-white) on a dark `#0b1d3a` background with `color-scheme: light dark` (`src/public/index.html:8`, `:12`). When a native `<select>` dropdown is added without explicit option styling, the `<option>` items inherit the near-white text color while the dropdown popup renders on a light/white surface in many browsers, making the options invisible. Fix: explicitly give `select`/`option` dark text (`#000`/near-black) on a light background so the language choices are clearly legible.

2. **Only "certain things" translate.** There is no translation mechanism at all, so the requirement is to translate the WHOLE page rather than a subset. Every visible string in `src/public/index.html:22-25` must update when a language is chosen — title bar text included where practical — not just isolated strings.

## Scope

File-by-file changes (no full code blocks here — coder implements):

- `src/public/index.html`
  - Add a language switcher control near the top of `<main>` (a native `<select>` is sufficient; label it accessibly). Offer at least English + Spanish (Spanish is the primary second language for the CACC audience); structure the option list so more languages can be added by data alone.
  - Add explicit CSS so dropdown options are readable: style `select` and `option` with dark text (e.g. `color:#0b1d3a; background:#fff;`) regardless of the dark page theme. Keep the existing dark page look otherwise.
  - Mark every translatable element with a stable key (e.g. `data-i18n="..."`) so the whole page — `<h1>`, all `<p>`, `<strong>`, the `/healthz` code line — is covered, not a subset. Preserve inline markup (`<strong>`, `<code>`) per string.
  - Add a small inline `<script>` (zero-dependency, matching the project's no-bundler stance) holding a translations dictionary keyed by language → string-key, that: applies the selected language to every `data-i18n` element, updates the `<html lang>` attribute and `document.title`, and persists the choice (e.g. `localStorage`) so it survives reload. Default to the existing English copy.
  - Ensure the existing English text remains byte-stable enough that the current test assertion (`/California Cadet Corps/`) still matches on initial server-rendered HTML.

- `test/server.test.js`
  - Add a test asserting the served `/` HTML contains the language switcher control (e.g. the `<select>` and at least the Spanish option) and the i18n data hooks, so the feature is regression-covered. Keep existing two tests passing.

- `README.md` (optional, only if coder adds user-facing notes)
  - If touched, briefly note the page supports in-browser language switching; keep additive.

Out of scope: server-side locale negotiation, build tooling, additional pages (only one page exists).

## Acceptance / DoD

- `npm run build` (no-op) and `npm test` pass; `npm run lint` clean.
- Language `<select>` options are clearly legible (dark text on light background) in both light and dark OS themes — no white-on-white.
- Selecting a language translates the ENTIRE visible page (every `data-i18n` element), not a subset; `<html lang>` and `document.title` update; choice persists across reload.
- Existing tests still pass; new test covers the switcher being present in served HTML.
- Contract followed; no unrelated files changed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-BV-full-site-language-switcher.md and follow it exactly.

Work on branch ws/full-site-language-switcher in worktree cacc-ws-full-site-language-switcher.

Scope: The site is one static page (src/public/index.html) served by src/server.js. Add a language switcher whose dropdown options have dark, clearly-readable text (not white-on-white), and implement a zero-dependency client-side i18n layer (data-i18n keys + inline script + dictionary) so choosing a language translates the ENTIRE page — every visible string — plus the <html lang> attribute and document.title, persisting the choice across reload. Add a test in test/server.test.js asserting the switcher is in the served HTML, and keep the existing English copy so the current /California Cadet Corps/ test still passes.

Build green; the orchestrator handles commit/push/PR.
```
