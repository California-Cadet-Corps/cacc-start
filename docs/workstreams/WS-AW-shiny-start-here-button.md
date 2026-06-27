# WS-AW — Shiny "Start here" button on the landing page

- Branch: ws/shiny-start-here-button
- PR title: [ws/shiny-start-here-button] WS-AW-shiny-start-here-button: add a shiny "Start here" button to the landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> make the "start here" button shiny

## Root cause / Investigation

There is currently **no "Start here" button anywhere in the codebase**. A
repository-wide search for `start here` (`grep -rni "start here"`) returns no
matches, and the only user-facing surface is the static landing page.

- `src/public/index.html:21-26` — the `<main>` block contains a heading and
  three `<p>` paragraphs (welcome text, placeholder note, health-check link). No
  link, `<button>`, or call-to-action element exists.
- `src/public/index.html:7-18` — the inline `<style>` block defines styling for
  `body`, `main`, `h1`, `p`, and `code` only. There is no button styling.
- `src/server.js:30-52` — static files under `src/public/` are served as-is from
  `PUBLIC_DIR`; the landing page is plain static HTML/CSS with no build step
  (`package.json` `build` is a no-op placeholder).
- `test/server.test.js:15-23` — the existing landing-page test only asserts the
  response contains `California Cadet Corps`; nothing covers a button.

Therefore "make the button shiny" requires **adding** the "Start here" button
and giving it a shiny (glossy/gradient + sheen/glow) visual treatment. This is a
front-end-only, additive change scoped entirely to the static landing page.

## Scope

File-by-file changes (no full code blocks — implement to taste within these bounds):

- `src/public/index.html`
  - In the `<main>` block (around line 21-26), add a "Start here" call-to-action
    rendered as an anchor styled as a button, e.g. `<a class="start-here" ...>Start here</a>`.
    Use an `<a>` so it works without JS; `href` may point to `#` (or a sensible
    placeholder anchor) since no destination is specified by the requirement.
  - In the inline `<style>` block (lines 7-18), add a `.start-here` rule giving it
    a "shiny" look consistent with the existing dark navy theme (`#0b1d3a` bg,
    `#f5f7fa` text): a gradient fill, rounded corners, subtle box-shadow/glow, and
    a glossy highlight or animated sheen. Keep it accessible (visible focus state,
    sufficient contrast, respects `prefers-reduced-motion` if animation is used).
  - Keep all existing content; this is purely additive.

- `test/server.test.js`
  - Extend the existing "GET / serves the landing page" test (or add a sibling
    test) to assert the served HTML contains the "Start here" button text, e.g.
    `assert.match(text, /Start here/i);`. Follow the existing node:test style.

## Acceptance / DoD

- `npm run lint` and `npm run build` succeed (build is a no-op placeholder).
- `npm test` passes, including a test that asserts the landing page serves a
  "Start here" button.
- The landing page renders a visibly shiny "Start here" button consistent with
  the existing theme; existing content and the `/healthz` link remain intact.
- Change is confined to `src/public/index.html` and `test/server.test.js`.
- Contract followed; no unrelated files modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream file at docs/workstreams/WS-AW-shiny-start-here-button.md and
implement it exactly.

Work on branch ws/shiny-start-here-button in worktree cacc-ws-shiny-start-here-button.

Scope: The landing page src/public/index.html has no "Start here" button today.
Add a "Start here" call-to-action (an <a> styled as a button) inside <main> and a
.start-here CSS rule in the inline <style> giving it a shiny look (gradient,
rounded corners, glow/sheen) that fits the existing dark-navy theme and stays
accessible. Then extend test/server.test.js to assert the served page contains
the "Start here" text. Change only those two files.

Build green; the orchestrator handles commit/push/PR.
```
