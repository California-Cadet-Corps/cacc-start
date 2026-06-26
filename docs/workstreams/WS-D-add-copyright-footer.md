# WS-D — Add copyright footer to landing page

- Branch: ws/add-copyright-footer
- PR title: [ws/add-copyright-footer] WS-D-add-copyright-footer: add a footer with copyright to the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> add a footer with copyrights

## Root cause / Investigation

This is a feature, not a bug. The app is a single static landing page served
by a zero-dependency Node HTTP server.

- `src/public/index.html:20-26` — the `<body>` contains only a single `<main>`
  block (`<h1>`, three `<p>`); there is no `<footer>` element and no copyright
  notice anywhere on the page.
- `src/public/index.html:7-18` — inline `<style>` block; styles `body`, `main`,
  `h1`, `p`, `code`. No footer styling exists yet.
- `src/server.js:43-47` — server reads and returns `index.html` verbatim; no
  templating, so the footer is added directly in the HTML file. No server change
  needed.
- `test/server.test.js:15-23` — the existing `GET /` test only asserts the body
  matches `/California Cadet Corps/`. Nothing asserts a footer/copyright.
- `LICENSE:3` and `package.json` (`"author": "California Cadet Corps"`) confirm
  the copyright holder is **California Cadet Corps**.

## Scope

- `src/public/index.html`
  - Add a `<footer>` element inside `<body>`, after the closing `</main>`
    (around current line 26), containing a copyright line such as
    `© 2026 California Cadet Corps. All rights reserved.` Use the `©` entity/glyph
    and the current year (2026).
  - Add minimal `footer` CSS to the existing `<style>` block (lines 7-18) so the
    footer is visually distinct (e.g. reduced opacity, small font, padding). Note
    the current `body` uses `display: grid; place-items: center` — adjust layout
    so both `main` and `footer` render sensibly (e.g. footer pinned/positioned at
    the bottom rather than overlapping the centered main).

- `test/server.test.js`
  - Extend the existing `GET /` test (or add a new test) to assert the served
    HTML contains the copyright text (e.g. `assert.match(text, /California Cadet Corps/)`
    plus a check for the footer/copyright marker such as `/©|copyright/i`).

## Acceptance / DoD

- `npm run build` (placeholder) and `npm run lint` succeed.
- `npm test` passes, including a test asserting the footer copyright text is present in `GET /`.
- The footer renders on the landing page with a copyright notice attributing
  California Cadet Corps and the year 2026, without overlapping the centered main content.
- Contract followed: only `src/public/index.html` and `test/server.test.js` changed; no server logic or dependencies added.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS contract at docs/workstreams/WS-D-add-copyright-footer.md and implement it exactly.

Work on branch ws/add-copyright-footer in worktree cacc-ws-add-copyright-footer.

Scope: Add a <footer> with a copyright notice ("© 2026 California Cadet Corps. All rights reserved.")
to src/public/index.html after the <main> block, plus minimal footer CSS in the existing inline <style>
so the footer sits at the bottom without overlapping the centered main content. Extend test/server.test.js
so GET / asserts the footer copyright text is present. Touch only those two files — no server logic or
new dependencies.

Build green; the orchestrator handles commit/push/PR.
```
