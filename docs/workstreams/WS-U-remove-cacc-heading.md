# WS-U — Remove CACC heading text from the landing page

- Branch: ws/remove-cacc-heading
- PR title: [ws/remove-cacc-heading] WS-U-remove-cacc-heading: remove CACC branding text from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the cacc text from the top left of the site

## Investigation

The "site" is a single static placeholder landing page served by a zero-dependency
HTTP server. There is no SPA framework, no header/nav component, and no CSS that
positions any element in the top-left corner.

- `src/server.js:11-12` — `PUBLIC_DIR = join(__dirname, 'public')`; the server serves
  static files from `src/public/`.
- `src/public/index.html` is the only page (`find src/public -type f` returns just
  this one file). The body is laid out with `display: grid; place-items: center`
  (`src/public/index.html:11`), so all content is centered — nothing is rendered in
  a top-left position today.
- The only on-page "CACC" text is the heading:
  - `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` (the visible
    "CACC" / California Cadet Corps branding text the owner is referring to).
- Related occurrences of the same wording, considered and intentionally left in scope
  vs. out of scope below:
  - `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>`
    (browser tab title, not on-page text — out of scope).
  - `src/public/index.html:23` — `start.cacadets.org` (the domain, not CACC branding
    text — out of scope).
  - `src/public/index.html:15` — `h1 { ... }` CSS rule that styles the heading.

Root-cause interpretation: there is no element actually positioned at the top-left; the
prominent on-page CACC text is the `<h1>` California Cadet Corps heading. Removing that
heading is the faithful execution of the requirement.

Test impact:
- `test/server.test.js:15-24` asserts the served page matches `/California Cadet Corps/`.
  This assertion still passes after removing the `<h1>`, because the same phrase remains
  in the `<title>` (`src/public/index.html:6`). No existing test breaks.

## Scope

- `src/public/index.html`
  - Remove the heading element on line 22: `<h1>California Cadet Corps</h1>`.
  - Remove the now-unused `h1 { ... }` CSS rule on line 15 (additive cleanup; the `h1`
    selector has no other markup after the heading is removed).
  - Do NOT change the `<title>` (line 6), the `start.cacadets.org` text (line 23), the
    intro/health-check paragraphs, or any server/deploy file.

## Acceptance / DoD

- `<h1>California Cadet Corps</h1>` no longer appears in `src/public/index.html`.
- The dangling `h1` CSS rule is removed; remaining HTML/CSS is valid and well-formed.
- No other visible page text is altered (intro paragraph, health-check line, domain).
- `npm run lint` and `npm test` pass; `npm run build` (placeholder no-op) succeeds.
- Existing tests in `test/server.test.js` remain green (the `/California Cadet Corps/`
  assertion still holds via the `<title>`).
- Contract followed: only `src/public/index.html` is modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
  docs/workstreams/WS-U-remove-cacc-heading.md

Branch: ws/remove-cacc-heading
Worktree: cacc-ws-remove-cacc-heading

Scope summary (self-verify against the WS file): The site is a single static page at
src/public/index.html. Remove the on-page CACC branding heading `<h1>California Cadet
Corps</h1>` (line 22) and the now-unused `h1 { ... }` CSS rule (line 15). Do not touch
the <title>, the start.cacadets.org text, the other paragraphs, or any server/deploy
file; existing tests stay green because "California Cadet Corps" remains in the <title>.

Build green; the orchestrator handles commit/push/PR.
```
