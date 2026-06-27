# WS-BK — Add CACC logo to nav bar + fix dead website links

- Branch: ws/nav-logo-and-broken-links
- PR title: [ws/nav-logo-and-broken-links] WS-BK-nav-logo-and-broken-links: Add CACC logo to nav bar and fix broken external links
- Depends on: (none)

## Problem

Product owner, verbatim:

> on the very left side of the nav bar add the california cadet corps logo
> also i want you to fix all links that send you to a website that does not exist

## Investigation / Root cause

The deployed product is a single static landing page served by a zero-dependency
HTTP server.

- `src/public/index.html` (lines 1–28) is the entire rendered site. It contains:
  - **No `<nav>` element** — there is no nav bar at all. The body holds only a
    `<main>` block (lines 21–26) with an `<h1>` and three `<p>` tags.
  - **No `<a>`/`href` anchors anywhere** — a grep for `href=` across `src/`
    returns nothing. So there is currently no nav bar to add a logo to, and the
    served page has zero hyperlinks.
- **No logo/image asset exists** in the repo (no `.svg`/`.png`/`.ico` under
  `src/public/` or elsewhere). The server already maps these MIME types in
  `src/server.js` (lines 15–23: `.svg`, `.png`, `.ico`), and serves any file
  under `src/public/` via the static handler (lines 33–47), so a new asset
  dropped into `src/public/` will be served without server changes.
- **"Links to a website that does not exist":** every `http(s)://` URL in the
  repo is in docs/config/markdown (README, CONTRIBUTING, deploy configs, etc.),
  **not** in the served app. The user is describing the rendered site, which has
  no links yet. Therefore part 2 means: every link present on the page *after*
  this change must resolve to a real, live destination (no placeholder `#`, no
  dead/invented URLs). The canonical live external site for the org is the
  public CACC homepage referenced throughout the repo as
  `https://start.cacadets.org` (see `package.json` line 8, `src/server.js`
  line 3); the public-facing org site is `https://www.cacadets.org`.

Net: this is a small feature (introduce a nav bar with the logo on the far left)
plus a correctness guarantee (any link the nav introduces must point to a
real destination), with no pre-existing in-app broken links to remove.

## Scope

File-by-file changes:

- **`src/public/index.html`** — Add a `<nav>` bar as the first child of `<body>`
  (before `<main>`). Place the CACC logo as the **left-most** item in the nav
  (an `<img>` wrapped in an `<a href="/">` home link, or the logo + wordmark).
  Add accompanying CSS in the existing `<style>` block (lines 7–18) so the nav
  is a horizontal bar with the logo flush-left (e.g. `display:flex` /
  `align-items:center`, logo `height` capped ~40px, `alt` text set). If any
  additional nav links are added beyond the logo home-link, each `href` must
  point to a real live URL (the org site / `https://start.cacadets.org`) — no
  `#` placeholders and no invented paths. Keep the existing `California Cadet
  Corps` `<h1>` text so `test/server.test.js` (line 18, `/California Cadet
  Corps/`) still passes.

- **New asset under `src/public/`** (e.g. `src/public/cacc-logo.svg`, or `.png`)
  — Add a California Cadet Corps logo asset that the nav references. Prefer an
  inline SVG or a lightweight committed asset; do not hotlink an external image
  that could 404. No server change needed (MIME already supported).

- **`test/server.test.js`** — Add a test asserting the served `/` page contains
  the nav bar with the logo (e.g. `assert.match(text, /<nav/)` and a match on
  the logo `img`/`alt` text or asset path), and a test asserting the logo asset
  is served (GET the asset path → status 200). This covers the new code per DoD.

Out of scope: server logic, deploy config, and the markdown/docs URLs (those are
not links on the rendered product).

## Acceptance / DoD

- `npm run build` (placeholder) and `npm run lint` (`node --check`) pass.
- `npm test` passes, including the existing two tests and the new nav/logo +
  asset tests.
- The rendered `/` page shows a nav bar with the CACC logo as the left-most
  element; the logo asset loads (200, not 404).
- No link on the page points to a nonexistent/placeholder destination; the logo
  links to `/` (home) and any extra nav link resolves to a real live URL.
- Contract followed; no changes outside the files listed in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full workstream contract first:
docs/workstreams/WS-BK-nav-logo-and-broken-links.md

Work on branch ws/nav-logo-and-broken-links in worktree cacc-ws-nav-logo-and-broken-links.

Scope: The served site is the single page src/public/index.html, which currently
has no nav bar and no links. Add a <nav> bar to that page with the California
Cadet Corps logo as the left-most item (commit a logo asset under src/public/,
referenced by the nav — do not hotlink an external image), and ensure every link
on the page resolves to a real live destination (logo links to "/"; no "#" or
invented URLs). Add tests in test/server.test.js asserting the nav + logo render
and that the logo asset serves with status 200, and keep the existing "California
Cadet Corps" text so current tests pass.

Build green; the orchestrator handles commit/push/PR.
```
