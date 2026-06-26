# WS-Q — Clickable hover/highlight buttons that open info modals

- Branch: ws/clickable-buttons-info-modals
- PR title: [ws/clickable-buttons-info-modals] WS-Q-clickable-buttons-info-modals: make hoverable buttons open cacadets.org-sourced info modals
- Depends on: (none)

## Problem

Product owner, verbatim:

> Every button on the site that is hoverable and highlightable should be clickable and open into a modal that expands on the information briefly mentioned - source the main cacadets.org website for more information on it.

## Root cause / Investigation

The site is a single static landing page served by a zero-dependency static file
server. There is no client-side JavaScript, no modal infrastructure, and — critically —
**no `<button>` elements at all** today, hoverable or otherwise.

- `src/public/index.html:21-26` — the entire `<main>` is one `<h1>` and three `<p>`
  elements. The only highlightable/styled affordance is the inline `<code>/healthz</code>`
  at `src/public/index.html:25`. There are no `<button>`, `<a>`, or `[role=button]`
  elements anywhere (confirmed by grepping `src/public/`).
- `src/public/index.html:7-18` — the `<style>` block defines `body`, `main`, `h1`, `p`,
  `code` only. There are no `:hover`/`:focus` rules, so nothing is "hoverable and
  highlightable" yet.
- `src/server.js:25-52` — server returns `/healthz` JSON and otherwise serves static
  files from `PUBLIC_DIR` by MIME type. A new `.js`/`.css` asset under `src/public/`
  is already served correctly (`.js` and `.css` are in the `MIME` map at lines 15-23);
  no server change is required.
- `test/server.test.js:15-23` — only existing page assertion checks the body contains
  "California Cadet Corps". New markup must not break this.

Interpretation of scope: because no buttons exist, satisfying "every button that is
hoverable and highlightable" means introducing the hover/highlight-styled buttons for the
topics the page briefly mentions (California Cadet Corps, the start portal, the health
check) and wiring each to a modal that expands on that topic with information sourced from
the main cacadets.org website. The DoD is "every hoverable/highlightable button opens a
modal," so each interactive button added MUST have a working modal — no decorative
hover-only buttons.

## Scope

File-by-file changes (no full code blocks):

1. `src/public/index.html` (edit)
   - Convert the briefly-mentioned topics in `<main>` (lines 21-26) into a small set of
     `<button>` affordances, each carrying a data attribute (e.g. `data-modal="<key>"`)
     identifying which modal it opens. Keep the existing "California Cadet Corps" heading
     text intact so `test/server.test.js:21` still passes.
   - Add modal container markup (overlay + dialog) using `role="dialog"`,
     `aria-modal="true"`, an accessible label, and a close control.
   - Add `:hover` and `:focus-visible` styles to the buttons in the `<style>` block so
     they are visibly hoverable and highlightable; add modal/overlay styling.
   - Reference the new script, e.g. `<script src="/app.js" defer></script>`.

2. `src/public/app.js` (new file)
   - Wire every `[data-modal]` button: on click, open the matching modal; populate it
     with the topic's expanded copy. Implement open/close, Escape-to-close, overlay-click
     close, and focus management (move focus into dialog, restore on close).
   - Hold the modal content (title + expanded blurb per topic) sourced from the main
     cacadets.org website. Each blurb must factually expand on the topic and cite/link
     back to the relevant cacadets.org page.

3. `src/public/styles.css` (optional new file)
   - If the author prefers, extract the button hover/focus and modal styles here instead
     of inline; either inline-in-`index.html` or this file is acceptable.

4. `test/server.test.js` (edit, additive)
   - Add a test asserting `GET /` serves a `<button` with a `data-modal` attribute, and a
     test asserting `GET /app.js` returns 200 with a JavaScript content-type. Do not
     remove or weaken the existing two tests.

Server (`src/server.js`) needs **no changes** — static `.js`/`.css` are already served.

Content sourcing: pull the expanded modal copy from the main cacadets.org website (e.g.
mission/about/programs pages). Keep blurbs short, accurate, and attributed; do not invent
facts not present on cacadets.org.

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed; `npm test` passes (existing 2 tests + new tests).
- Every button rendered on the landing page that is hoverable and highlightable is
  clickable and opens a modal expanding on the briefly-mentioned topic. No hover-only
  decorative buttons remain.
- Modals are keyboard-accessible: open on click, close on Escape, close on overlay click,
  focus moves into the dialog and is restored on close; `role="dialog"` + `aria-modal`.
- Modal content is sourced from / attributed to the main cacadets.org website.
- Existing assertion that `GET /` contains "California Cadet Corps" still passes.
- New tests cover the new behavior (button markup present, `/app.js` served).
- Contract followed; no out-of-scope files changed (no `src/server.js` change required).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-Q-clickable-buttons-info-modals.md
Follow it exactly; do not extend scope beyond what it specifies.

Branch: ws/clickable-buttons-info-modals
Worktree: cacc-ws-clickable-buttons-info-modals

Scope summary for self-verification: The static landing page (src/public/index.html)
currently has no buttons, hover/focus styles, modals, or client-side JS. Add hover- and
focus-highlightable buttons for the topics the page briefly mentions, and an accessible
modal system (src/public/app.js, optional src/public/styles.css) so each button opens a
modal that expands on its topic using information sourced from and attributed to the main
cacadets.org website. Keep the "California Cadet Corps" heading text, leave src/server.js
unchanged (static .js/.css are already served), and add additive tests in
test/server.test.js (button markup present; GET /app.js returns 200 JS) without weakening
the existing two tests.

Build green; the orchestrator handles commit/push/PR.
```
