# WS-BI — Remove E-1–E-4 from the ranks-tab circle

- Branch: ws/remove-enlisted-ranks-from-circle
- PR title: [ws/remove-enlisted-ranks-from-circle] WS-BI-remove-enlisted-ranks-from-circle: remove E-1–E-4 from ranks-tab circle (BLOCKED — feature absent)
- Depends on: none

## Problem

Product owner, verbatim:

> can you remove the E-1, E-2 and E-3, and E-4 form the circle in the ranks tab please

## Investigation

The requested UI **does not exist anywhere in this repository**. `cacc-start` is
currently a minimal scaffold whose entire user-facing surface is one placeholder
landing page.

Evidence (searched the full working tree, excluding `node_modules` and `.git`):

- Case-insensitive grep for `E-1`, `E-2`, `E-3`, `E-4`, `rank`, and `circle`
  across all source/markup returns **zero matches**.
- The only frontend asset is `src/public/index.html` (lines 1–34) — a static
  placeholder page with the text "This is the placeholder landing page."
  It contains no tabs, no SVG/canvas circle, and no rank designators.
- `src/server.js` (lines 1–63) is a zero-dependency static file server plus a
  `/healthz` endpoint. It serves files from `src/public/` only.
- The complete file inventory (`src/public/index.html`, `src/server.js`,
  `test/server.test.js`, docs, deploy artifacts) contains no component, route,
  template, or data structure related to ranks.

## Root cause

There is no ranks tab and no rank circle to edit. The feature the requirement
references has not been built in `cacc-start`. This work cannot be implemented as
literally described against the current codebase — there is no E-1/E-2/E-3/E-4
element to remove. The requirement most likely targets a different application,
a different branch/repo, or a feature that is still unbuilt here.

## Scope

No in-repo target exists, so no code change can satisfy the requirement as
written. This WS is therefore a **BLOCKED / needs-clarification** contract rather
than an edit set:

- `src/public/index.html` — inspected; no ranks UI present. No change.
- `src/server.js` — inspected; static server only. No change.
- (no other candidate files exist)

Resolution path for the coder agent: confirm the absence (re-run the greps below),
then **do not fabricate** a ranks tab or rank circle. Report the finding back to
the orchestrator/product owner so they can either (a) point to the correct
repository/branch, or (b) open a separate WS to build the ranks tab first, after
which removing E-1–E-4 becomes a real edit.

Verification greps (expected: no matches):

```
grep -rniE 'E-[1-4]|rank|circle' src test
```

## Acceptance / DoD

- Coder re-runs the verification grep and confirms zero matches — the ranks
  tab/circle genuinely does not exist.
- No placeholder, stub, or fabricated ranks UI is added to satisfy the wording.
- Finding is reported clearly; WS is escalated for product-owner clarification.
- `npm run build` and `npm test` remain green (no regression to the scaffold).
- If clarification arrives during the session pointing to a real target, that is
  handled under a follow-up WS, not silently here.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-BI-remove-enlisted-ranks-from-circle.md
in full before doing anything.

Branch: ws/remove-enlisted-ranks-from-circle
Worktree: cacc-ws-remove-enlisted-ranks-from-circle

Scope summary for self-verification: The product owner asked to remove the
E-1/E-2/E-3/E-4 designators from a "circle" in a "ranks tab." That UI does NOT
exist in this repo — the entire frontend is the placeholder src/public/index.html
and grep for 'E-[1-4]|rank|circle' returns nothing. Re-run that grep to confirm,
then DO NOT fabricate a ranks tab or rank circle; instead report the absence and
flag the WS as needing product-owner clarification (likely wrong repo/branch or an
unbuilt feature).

Build green; the orchestrator handles commit/push/PR.
```
