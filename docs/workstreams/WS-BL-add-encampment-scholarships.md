# WS-BL — Add "scholarships available" to summer encampment event description

- Branch: ws/add-encampment-scholarships
- PR title: [ws/add-encampment-scholarships] WS-BL-add-encampment-scholarships: add "scholarships available" to summer encampment event description
- Depends on: (none)

## Problem

Product owner, verbatim:

> Add "scholarships available" to the summer encampment description in the event section

## Investigation

The application serves a single static HTML page through a zero-dependency Node HTTP
server. The page is the source of all user-facing content.

- `src/server.js:25-52` — request handler. `GET /` serves `src/public/index.html`
  verbatim (`src/server.js:35`, `src/server.js:44-47`). There is no templating or
  data layer; page content lives entirely in the HTML file.
- `src/public/index.html:21-26` — the `<main>` block. It currently contains only a
  placeholder landing message (heading + three `<p>` lines). **There is no "event
  section" and no "summer encampment" description anywhere in the file.**
- `grep -rni "encampment\|event\|summer\|scholarship"` across `src/` and `test/`
  returns no content matches (only an unrelated code comment at `src/server.js:33`).
- `test/server.test.js:15-23` asserts `GET /` returns 200 and the body matches
  `/California Cadet Corps/`; it does not assert on event content.

### Conclusion / exact scope

Because neither the event section nor the summer encampment description exists yet,
satisfying the requirement requires creating an event section in
`src/public/index.html` containing a summer encampment description, and that
description must include the text "scholarships available". This is a content
addition to one static HTML file; no server, routing, or build changes are needed.

## Scope

- `src/public/index.html`
  - Inside `<main>` (`src/public/index.html:21-26`), add an event `<section>`
    (e.g. an `<h2>` such as "Events" and a "Summer Encampment" sub-block with a
    short description paragraph).
  - The summer encampment description paragraph must contain the literal phrase
    `scholarships available`.
  - Reuse the existing inline `<style>` conventions (`src/public/index.html:7-18`);
    add minimal styling only if needed and keep the dark-theme look consistent.
  - Keep the existing heading "California Cadet Corps" and the `/healthz` line so the
    current test (`/California Cadet Corps/`) still passes.

- `test/server.test.js`
  - Add a test (or extend the existing `GET /` test) asserting the served `/` body
    matches `/scholarships available/` so the new content is covered.

## Acceptance / DoD

- `src/public/index.html` renders an event section whose summer encampment
  description includes the text "scholarships available".
- `npm test` passes, including a new/updated assertion covering the
  "scholarships available" content.
- `npm run build` (no-op placeholder) and `npm run lint` succeed.
- Existing `/healthz` and `GET /` (`/California Cadet Corps/`) tests still pass.
- Change is limited to `src/public/index.html` and `test/server.test.js`; contract
  followed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-BL-add-encampment-scholarships.md

Branch: ws/add-encampment-scholarships
Worktree: cacc-ws-add-encampment-scholarships

Scope: The site is a single static page served from src/public/index.html and there
is currently no event section or summer encampment description. Add an event section
to src/public/index.html containing a summer encampment description whose text
includes the literal phrase "scholarships available", matching the existing inline
dark-theme styling. Add/extend a test in test/server.test.js asserting the served /
body matches /scholarships available/, and keep the existing "California Cadet Corps"
and /healthz content intact so current tests still pass.

Build green; the orchestrator handles commit/push/PR.
```
