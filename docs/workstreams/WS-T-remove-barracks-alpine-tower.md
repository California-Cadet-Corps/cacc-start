# WS-T — Remove barracks inspections & alpine tower climbing from the site

- Branch: ws/remove-barracks-alpine-tower
- PR title: [ws/remove-barracks-alpine-tower] WS-T-remove-barracks-alpine-tower: drop barracks-inspection / alpine-tower content from the site
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove barracks inspections and alpine tower climbing from the site

## Root cause / Investigation

The "site" served by this app is a **single placeholder landing page**. There is
no activity/program listing anywhere that mentions barracks inspections or alpine
tower climbing — so there is no such content to delete.

Evidence:

- `src/public/index.html` — the entire served page. Body content lives in
  `index.html:21-26` (`<main>`): an `<h1>` "California Cadet Corps", a welcome
  line, a "placeholder landing page" line, and a `/healthz` note. No reference to
  barracks, inspections, alpine, tower, or climbing.
- `src/server.js:25-52` — server only exposes `/healthz` (`server.js:27-31`) and
  statically serves files out of `PUBLIC_DIR` (`server.js:33-51`). `index.html` is
  the only HTML asset (`src/public/` contains just `index.html`).
- Repo-wide grep for `barracks|alpine|tower|inspection|climb` (case-insensitive,
  excluding `.git`) returns **zero** content matches. The strings do not exist in
  the codebase.
- `test/server.test.js:15-23` already asserts the landing page serves and contains
  "California Cadet Corps"; nothing about the two activities.

Conclusion: nothing to remove today. The faithful, durable interpretation of the
requirement is "these two activities must not appear on the site" — encode that as
an additive regression guard so the content cannot be (re)introduced unnoticed.

## Scope

File-by-file:

- `test/server.test.js` — **add** one test that fetches `/`, reads the HTML, and
  asserts the served body does **not** match `/barracks\s+inspection/i` nor
  `/alpine\s+tower/i` (also reject `/tower\s+climb/i`). Follow the existing
  listen-on-port-0 / `server.close` pattern used at `test/server.test.js:5-23`.
- `src/public/index.html` — **no change required**; the offending content is
  already absent (verified at `index.html:21-26`). Do not add it. If a future edit
  in this branch happens to introduce either phrase, the new test must fail.
- No change to `src/server.js`, build scripts, or CI config.

## Acceptance / DoD

- `npm run lint` passes (`node --check src/server.js`).
- `npm run build` no-op passes.
- `npm test` passes, including the new regression test.
- The new test fails if either "barracks inspection" or "alpine tower (climbing)"
  is present in the served landing page; it passes against the current page.
- Contract followed: changes limited to the files listed in Scope; no unrelated
  edits.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-T-remove-barracks-alpine-tower.md
before doing anything.

Work on branch ws/remove-barracks-alpine-tower in worktree cacc-ws-remove-barracks-alpine-tower.

Scope: The requirement is to remove "barracks inspections" and "alpine tower
climbing" from the site. Investigation confirms neither phrase exists anywhere in
the repo — the site is just the placeholder landing page at src/public/index.html
(lines 21-26), so there is nothing to delete. Your only change is additive: add a
test in test/server.test.js (matching the existing port-0 / server.close pattern)
that fetches "/" and asserts the served HTML does NOT contain "barracks inspection"
or "alpine tower" (case-insensitive). Do not modify index.html or server.js.

Build green; the orchestrator handles commit/push/PR.
```
