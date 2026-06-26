# WS-K — Ribbon Chart link points to cacadets.org ribbon chart

- Branch: ws/ribbon-chart-link
- PR title: [ws/ribbon-chart-link] WS-K-ribbon-chart-link: link Full Ribbon Chart to cacadets.org
- Depends on: (none)

## Problem

Product owner, verbatim:

> change the link to the california cadet corp full ribbon chart to lead to this link: https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en

## Investigation

The requirement assumes an existing "California Cadet Corps full ribbon chart"
link in the app. **No such link currently exists** in the repository — there is
nothing to repoint. Evidence:

- `git ls-files` over the whole repo; a repo-wide grep for `ribbon`, `Ribbon Chart`,
  `cacadets.org/Cadet`, `<a `, and `href=` returns **zero** matches in any source,
  HTML, or asset file.
- The only user-facing page is `src/public/index.html` — a placeholder landing page.
  Its `<main>` block (`src/public/index.html:21-26`) contains only headings and
  paragraphs; there are no anchor (`<a>`) elements at all.
- `src/server.js:25-52` serves files statically out of `src/public/` (PUBLIC_DIR,
  `src/server.js:12`); `/` maps to `index.html` (`src/server.js:35`). So the landing
  page that a visitor sees is exactly `src/public/index.html`.

### Root cause / resolution

Because no ribbon chart link exists, the faithful way to satisfy the product owner's
intent ("the link ... should lead to this link") is to **add** a Full Ribbon Chart
link on the landing page whose `href` is exactly
`https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`. The `%20` in the URL is an
encoded space and MUST be preserved literally in the `href` (do not unencode it).

## Scope

- `src/public/index.html`
  - In the `<main>` block (`src/public/index.html:21-26`), add an anchor linking to
    the ribbon chart. Suggested: a new `<p>` after line 24 containing
    `<a href="https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en">California Cadet Corps Full Ribbon Chart</a>`.
  - Open the link in a new tab safely (`target="_blank" rel="noopener noreferrer"`)
    since it points to an external site.
  - Optional: add a minimal `a { color: ... }` rule to the existing `<style>` block
    so the link is legible on the dark `#0b1d3a` background. Keep styling minimal and
    consistent with the existing inline style.

- `test/server.test.js`
  - Extend the existing `GET / serves the landing page` test (or add a sibling test)
    to assert the served HTML contains the exact ribbon chart URL, e.g.
    `assert.match(text, /cacadets\.org\/Cadet\/Ribbon%20Chart\?lang=en/)`.
    This locks the contract: the encoded URL must be present and unaltered.

No other files change. No server-side routing changes are needed — the page is static.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; tests run via
  `node:test`).
- `src/public/index.html` contains a single, clearly-labelled anchor whose `href` is
  exactly `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` (with `%20`
  preserved, not decoded to a space).
- The external link uses `rel="noopener noreferrer"` when `target="_blank"`.
- A test asserts the served landing-page HTML includes the exact ribbon chart URL.
- Contract followed: only `src/public/index.html` and `test/server.test.js` are
  modified; no unrelated changes.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-K-ribbon-chart-link.md
(read the whole file before editing).

Branch: ws/ribbon-chart-link
Worktree: cacc-ws-ribbon-chart-link

Scope: There is currently NO ribbon chart link in the repo, so add one on the
landing page src/public/index.html — an anchor labelled "California Cadet Corps
Full Ribbon Chart" whose href is exactly
https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en (keep the %20 encoded,
do not decode it), opened with target="_blank" rel="noopener noreferrer". Then
extend test/server.test.js to assert the served HTML contains that exact URL.
Change only those two files.

Build green; the orchestrator handles commit/push/PR.
```
