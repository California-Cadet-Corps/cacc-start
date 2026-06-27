# WS-BU — Readable language switcher with full-site translation

- Branch: ws/full-site-language-switcher
- PR title: [ws/full-site-language-switcher] WS-BU-full-site-language-switcher: black-text language options and whole-page translation
- Depends on: (none)

## Problem

Product owner (verbatim):

> Can you  make the options on the switching language button text black instead of white so users can see the text clearly and the language options, Also  instead of  putting  certain things into the language  change the entire website to the language that  the user chooses

## Root cause / Investigation

The requirement assumes a language switcher already exists, but the current
codebase has none:

- `src/public/index.html` (lines 1–28) is a static placeholder landing page. Its
  only visible content is the `<main>` block at lines 21–26 (`h1`, three `p`
  lines, a `code` span). There is no language control, no `<select>`, and no
  `<option>` elements.
- `src/server.js` (lines 25–52) is a static file server with a `/healthz`
  endpoint (lines 27–31); it does no translation or content negotiation.
- A repo-wide search for `lang|translat|i18n|locale|switch` finds only
  `lang="en"` on `index.html:2` and unrelated `git switch` mentions in `docs/`.
  No i18n dictionary or language state exists anywhere.
- `test/server.test.js` asserts only `/healthz` and that `/` contains
  "California Cadet Corps"; no language behavior is covered.

Therefore the two requested fixes must be delivered by building the feature
correctly the first time:

1. **Black option text** — When a `<select>` lives on the page's dark theme
   (`body { background:#0b1d3a; color:#f5f7fa }`, `index.html:12`) and inherits
   that light `color`, the dropdown's `<option>` items can render light-on-light
   and be unreadable. The control must explicitly set option text to black on a
   light background so choices are clearly visible.
2. **Whole-site translation** — Translation must replace **every** visible string
   on the page (the `<title>` and all text in `<main>`, `index.html:6` and
   `21–26`), not just "certain things," when the user picks a language.

## Scope

File-by-file changes (no full code blocks here — see kickoff for the contract):

- `src/public/index.html`
  - Add a language switcher control (a `<select id="lang-switcher">` is the
    simplest fit) near the top of `<main>` (around line 21).
  - In the `<style>` block (lines 7–18), add a rule giving the switcher and its
    `<option>` elements explicit `color:#000` on a light `background` (e.g.
    `#fff`) so option text is black and clearly readable on the dark theme.
  - Wrap each user-visible string (the `<title>` at line 6 and every text node in
    `<main>`, lines 22–25) so it can be swapped — e.g. give each a stable
    `data-i18n="<key>"` attribute.
  - Add an inline `<script>` with an i18n dictionary keyed by language for **all**
    of those strings (at minimum English + Spanish; structure so more languages
    are easy to add). On switcher `change`, update every `data-i18n` node, the
    `document.title`, and the `<html lang>` attribute so the **entire** page
    changes language. Persist the choice (e.g. `localStorage`) and apply it on
    load so the selection sticks across reloads.

- `test/server.test.js`
  - Add a test asserting the served `/` HTML contains the language switcher
    (e.g. `id="lang-switcher"`) and the i18n markup/dictionary (e.g. a
    `data-i18n` attribute and a Spanish string), so the feature is regression
    covered. Keep existing tests passing.

Keep the change confined to the static page + its test; no `server.js` changes
are required (the page is fully client-side translated).

## Acceptance / DoD

- `npm run build` and `npm test` pass (CI green).
- The contract above is followed: option text renders black on a light
  background and is clearly readable; selecting a language swaps **all** visible
  page text (title + every `<main>` string) and the `<html lang>` attribute, not
  only some strings.
- Language choice persists across reloads.
- New tests cover the added markup/behavior; existing `/healthz` and `/` tests
  still pass.
- No files outside `src/public/index.html` and `test/server.test.js` are
  modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-BU-full-site-language-switcher.md
and implement exactly what it specifies.

Work on branch ws/full-site-language-switcher in worktree cacc-ws-full-site-language-switcher.

Scope (self-verify against this): the repo has NO language switcher yet, so build
one in src/public/index.html — a <select> language control whose <option> text is
black on a light background so it is clearly readable on the dark theme, plus an
inline i18n dictionary + script that translates the ENTIRE page (the <title>, every
visible <main> string, and the <html lang> attribute) when the user picks a
language, persisting the choice across reloads. Add a test in test/server.test.js
covering the new markup, and keep the existing /healthz and / tests passing.

Build green; the orchestrator handles commit/push/PR.
```
