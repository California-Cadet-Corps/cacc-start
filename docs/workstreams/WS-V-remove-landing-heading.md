# WS-V — Remove California Cadet Corps heading from landing page

- Branch: ws/remove-landing-heading
- PR title: [ws/remove-landing-heading] WS-V-remove-landing-heading: remove California Cadet Corps heading text from landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the California Cadet Corp text from the top left corner

## Investigation

The placeholder landing page renders a single visible "California Cadet Corps"
heading. There is exactly one rendered occurrence of that text in the page body:

- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` is the page
  heading (the only on-screen "California Cadet Corps" text the user sees).

Related occurrences that are NOT the rendered heading and should stay:

- `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>`
  (browser tab title, not visible page content; also keeps the existing test
  passing — see below).

Note on "top left corner": the page CSS centers all content
(`body { ... display: grid; place-items: center; }`, `src/public/index.html:11`),
so the heading visually renders centered rather than top-left. The `<h1>` on
line 22 is nonetheless the sole "California Cadet Corps" text shown to the user
and is the clear target of this requirement.

Test coupling:

- `test/server.test.js:21` — `assert.match(text, /California Cadet Corps/);`
  matches against the full HTTP response body. Because the `<title>` on line 6
  still contains "California Cadet Corps", this assertion continues to pass
  after the `<h1>` is removed. No test change is required.

## Scope

- `src/public/index.html`
  - Remove the heading line `src/public/index.html:22`
    (`<h1>California Cadet Corps</h1>`). Do not alter the `<title>` (line 6) or
    any other markup. Leave the remaining `<p>` content intact.

No other files require changes. Do not modify `test/server.test.js` — the
existing assertion still passes via the `<title>`.

## Acceptance / DoD

- The rendered landing page (`GET /`) no longer displays the "California Cadet
  Corps" `<h1>` heading.
- The `<title>` tag (line 6) is unchanged.
- `npm test` passes (the existing `GET /` test stays green via the `<title>`).
- Build/lint passes; WS contract followed; change is limited to
  `src/public/index.html`.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-V-remove-landing-heading.md before starting.

Work on branch ws/remove-landing-heading in worktree cacc-ws-remove-landing-heading.

Scope: In src/public/index.html, remove the heading line `<h1>California Cadet
Corps</h1>` (line 22) so the landing page no longer shows that text. Do NOT touch
the <title> tag on line 6, and do NOT modify test/server.test.js — the existing
test (`assert.match(text, /California Cadet Corps/)`) still passes because the
<title> retains the string. Verify `npm test` is green.

Build green; the orchestrator handles commit/push/PR.
```
