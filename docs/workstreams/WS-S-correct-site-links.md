# WS-S — Correct every site link to the official California Cadet Corps URLs

- Branch: ws/correct-site-links
- PR title: [ws/correct-site-links] WS-S-correct-site-links: link the landing page to official cacadets.org URLs
- Depends on: (none)

## Problem

Product owner, verbatim:

> change every link on the site to their correct links. get the links directly from the california cadet corp website

## Root cause / Investigation

The only user-facing page served by the app is the static landing page
`src/public/index.html`. It is served by the zero-dependency HTTP server
`src/server.js` (`PUBLIC_DIR = src/public`, see `src/server.js:12` and the
static-file handler at `src/server.js:33-51`).

Findings from the current checkout:

- `src/public/index.html` contains **zero clickable links** — there is no
  `<a href>`, no nav, and no external URL anywhere in the page. A repo-wide
  grep for `href=` / `<a ` under `src/` returns nothing.
- The page is purely placeholder copy:
  - `src/public/index.html:22` — `<h1>California Cadet Corps</h1>`
  - `src/public/index.html:23` — `<p>Welcome to <strong>start.cacadets.org</strong>.</p>` (plain text, not a link)
  - `src/public/index.html:24` — placeholder "Replace it as the project grows."
  - `src/public/index.html:25` — `<p>Health check: <code>/healthz</code></p>`
- Other occurrences of URLs in the repo are infrastructure/docs only
  (`README.md`, `docs/*`, `package.json`, `src/server.js` comments) and are
  **out of scope** — the requirement is about links "on the site", i.e. the
  rendered page, not documentation or code comments.

Root cause: the landing page never had real navigation links, so there are no
"correct" outbound links pointing cadets/visitors to the official program
resources. The fix is to make the site link to the canonical California Cadet
Corps destinations, taken directly from the official website
`https://cacadets.org`.

### Canonical links (verified from the official CACC website, June 2026)

Use these exact URLs. Base site is `https://cacadets.org`. The coder must use
these verbatim and must NOT invent or guess paths:

- Official home: `https://cacadets.org/`
- How to Join: `https://cacadets.org/Commandant/HowtoJoin`
- About — CACC Today: `https://cacadets.org/About/CACCToday`
- Curriculum Overview: `https://cacadets.org/Curriculum/Overview`
- Events — Summer Camp: `https://cacadets.org/Events/SummerCamp`
- Documents — Forms: `https://cacadets.org/Documents/Forms`
- Links & Resources: `https://cacadets.org/Commandant/QuickLinks`
- Contact Us: `https://cacadets.org/About/Contact`

Social (official CACC accounts):

- Facebook: `https://www.facebook.com/groups/34663686999`
- Instagram: `https://www.instagram.com/hqcacc/`
- YouTube: `https://www.youtube.com/hqcacc`
- LinkedIn: `https://www.linkedin.com/company/hqcacc/`

## Scope

File-by-file changes:

- `src/public/index.html`
  - Make the `start.cacadets.org` mention on line 23 a real link to the
    official site `https://cacadets.org/`.
  - Add a small navigation block (e.g. a `<nav>` with a `<ul>` of `<a>`
    elements) inside `<main>` linking to the canonical destinations listed
    above (Home, How to Join, About/CACC Today, Curriculum, Events/Summer
    Camp, Documents/Forms, Links & Resources, Contact). All external links use
    the exact URLs above, with `rel="noopener noreferrer"` and
    `target="_blank"`.
  - Optionally add the social links as a secondary row using the exact URLs
    above.
  - Add minimal CSS in the existing inline `<style>` block (lines 7-18) so the
    new links are legible against the dark background (`#0b1d3a`); do not
    introduce external stylesheets or scripts.
  - Leave the `/healthz` reference (line 25) as plain `<code>` — it is an
    internal endpoint, not a navigation link.

- (No changes to `src/server.js`, `docs/*`, `README.md`, or `package.json` —
  those URLs are infrastructure/docs, explicitly out of scope.)

If a test asserting the landing page exists/serves, extend it; otherwise add a
small test (see DoD).

## Acceptance / DoD

- `npm run build` and `npm test` pass (`npm run lint` clean).
- Every `<a href>` on the rendered landing page resolves to one of the exact
  canonical URLs listed in this contract — no placeholder, `#`, `example.com`,
  or guessed paths remain.
- `start.cacadets.org` text on the page is now a working link to
  `https://cacadets.org/`.
- External links carry `target="_blank"` and `rel="noopener noreferrer"`.
- A test under the project test suite verifies the served `/` HTML contains the
  expected official links (at minimum `https://cacadets.org/` and
  `https://cacadets.org/Commandant/HowtoJoin`) and contains no leftover
  placeholder href (no `href="#"`, no `example.com`).
- No changes outside `src/public/index.html` (plus the test file).
- Contract followed; CI green.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-S-correct-site-links.md

Work on branch `ws/correct-site-links` in worktree `cacc-ws-correct-site-links`.

Scope (for self-verification): The landing page src/public/index.html currently
has zero clickable links. Add a navigation block of real <a> links pointing to
the exact official California Cadet Corps URLs listed in the contract (base
https://cacadets.org), make the existing `start.cacadets.org` text link to
https://cacadets.org/, and add a test that the served `/` HTML contains the
official links and no placeholder href. Use the contract's URLs verbatim — do
not invent paths. Touch only src/public/index.html and a test file; leave
docs/, README, server.js, and package.json untouched.

Build green; the orchestrator handles commit/push/PR.
```
