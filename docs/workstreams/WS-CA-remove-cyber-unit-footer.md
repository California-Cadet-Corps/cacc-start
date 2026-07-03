# WS-CA — Remove the fixed "cyber unit 2026 was here" footer

- Branch: ws/remove-cyber-unit-footer
- PR title: [ws/remove-cyber-unit-footer] WS-CA-remove-cyber-unit-footer: remove the fixed cyber-unit footer element
- Depends on: none

## Problem

Product owner, verbatim:

> Please remove the Cyber Unit 2026 was here scrollable that continues to follow the mobile navigation around. Just get rid of that entirely that entire element.

## Root cause / Investigation

The "cyber unit 2026 was here" element is a viewport-pinned footer that stays
glued to the bottom of the screen while scrolling — which is the "follows the
mobile navigation around" behavior the owner is describing.

- `src/public/index.html:584` — the element itself:
  `<footer id="cyber-footer">cyber unit 2026 was here</footer>`
  (last child of `<body>`, after the i18n `<script>` tags).
- `src/public/index.html:42` — the CSS that pins it to the viewport:
  `#cyber-footer { position:fixed; bottom:0; left:0; width:100%; ... }`.
  `position:fixed; bottom:0` is what makes it float/follow on scroll.
- `test/server.test.js:27` — an existing assertion requires the text be
  present: `assert.match(text, /cyber unit 2026 was here/, ...)`. This must be
  inverted/removed or the suite will fail once the element is gone.
- `docs/workstreams/WS-BT-cyber-unit-footer.md` — the original contract that
  added this footer (historical; leave as-is, it is a past record).

## Scope

- `src/public/index.html`
  - Delete the `<footer id="cyber-footer">cyber unit 2026 was here</footer>`
    element (line 584).
  - Delete the `#cyber-footer { ... }` CSS rule inside the `<style>` block
    (line 42). No other selector references `#cyber-footer`.
- `test/server.test.js`
  - In the `GET / serves the landing page` test, replace the
    `assert.match(text, /cyber unit 2026 was here/, ...)` assertion (line 27)
    with a negative assertion, e.g.
    `assert.doesNotMatch(text, /cyber unit 2026 was here/i, 'cyber unit footer must be removed');`
    so the suite proves the element is gone.

## Acceptance / DoD

- The served landing page contains no `cyber unit 2026 was here` text and no
  `id="cyber-footer"` element or CSS rule.
- `npm test` passes, including the updated assertion that the footer text is
  absent.
- No other page content, styling, or behavior changes.
- Contract followed; build green.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-CA-remove-cyber-unit-footer.md and implement it exactly.
Branch: ws/remove-cyber-unit-footer   Worktree: cacc-ws-remove-cyber-unit-footer

Scope: Remove the viewport-pinned "cyber unit 2026 was here" footer entirely —
delete the <footer id="cyber-footer"> element (src/public/index.html:584) and its
#cyber-footer CSS rule (src/public/index.html:42). Then update test/server.test.js
so the "GET / serves the landing page" test asserts the text is ABSENT
(doesNotMatch) instead of present. Change nothing else.

Build green; the orchestrator handles commit/push/PR.
```
