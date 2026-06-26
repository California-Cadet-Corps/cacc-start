# WS-C — Color the "California Cadet Corps" heading logo-yellow

- Branch: ws/yellow-heading-color
- PR title: [ws/yellow-heading-color] WS-C-yellow-heading-color: color landing heading logo-yellow
- Depends on: (none)

## Problem

Product owner (verbatim):

> Change the Text color of "California Cadet Corps" to the yellow matching the logo theme
>
> https://upload.wikimedia.org/wikipedia/en/2/24/California_Cadet_Corps_logo.png

## Root cause / Investigation

This is a styling change, not a bug.

- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` is the heading whose text color must change.
- `src/public/index.html:15` — the `h1` CSS rule (`h1 { font-size: clamp(1.8rem, 5vw, 3rem); margin-bottom: 0.5rem; }`) currently sets no `color`, so the heading inherits the page text color (`color: #f5f7fa` from the `body` rule at `src/public/index.html:12`).

The California Cadet Corps logo theme color is a gold/yellow. Use `#FFC72C` (a gold-yellow consistent with the CCC logo). The coder may adjust the exact hex if a closer match to the linked logo is evident, but it must remain a logo-matching yellow/gold and stay legible against the dark `#0b1d3a` background.

## Scope

- `src/public/index.html` — add a `color` declaration to the `h1` rule at line 15 so the heading text renders in logo-yellow (`color: #FFC72C;`). Single-line CSS change inside the existing `<style>` block; no markup or layout changes. Do not touch the `<title>` at line 6 (browser-tab text, not the visible heading).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; existing server tests must remain green).
- The visible `<h1>` "California Cadet Corps" renders in a logo-matching yellow/gold against the dark background.
- Only `src/public/index.html` is modified; no new dependencies; existing markup/layout unchanged.
- Contract followed; change is minimal and scoped to the `h1` color.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-C-yellow-heading-color.md before starting.
Work on branch ws/yellow-heading-color in worktree cacc-ws-yellow-heading-color.

Scope: in src/public/index.html, add a `color` declaration to the existing `h1`
CSS rule (line 15) so the visible "California Cadet Corps" heading (line 22)
renders in the California Cadet Corps logo yellow/gold (`#FFC72C`), legible
against the dark #0b1d3a background. Change only the h1 text color — do not alter
the <title>, markup, or layout, and add no dependencies.

Build green; the orchestrator handles commit/push/PR.
```
