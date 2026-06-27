# WS-BH — Remove E-1…E-4 from the ranks-tab circle

- Branch: ws/remove-e1-e4-rank-circle
- PR title: [ws/remove-e1-e4-rank-circle] WS-BH-remove-e1-e4-rank-circle: remove junior-enlisted grades from ranks-tab circle
- Depends on: (none)

## Problem

Product owner, verbatim:

> can you remove the E-1, E-2 and E-3, and E-4 form the circle in the ranks tab please

## Root cause / Investigation

The requested feature **does not exist in this repository**. `cacc-start` is currently a
zero-dependency placeholder landing page; there is no ranks tab, no rank "circle"
visualization, and no E-1/E-2/E-3/E-4 rank tokens anywhere.

Evidence:
- Full source tree under `src/` is only `src/server.js` and `src/public/index.html`
  (plus `test/server.test.js`). Verified via `ls -R src`.
- `src/public/index.html:21-27` — the entire body is the "California Cadet Corps"
  placeholder landing page (heading + three paragraphs). No tabs, no SVG/canvas circle,
  no rank list.
- `src/server.js:25-52` — server only serves `/healthz` and static files from
  `src/public/`; there is no ranks route or rank data.
- Repo-wide search for `rank`, `circle`, `E-1`, `E-2`, `E-3`, `E-4`, `E1`–`E4`
  (`grep -rni` across all non-`node_modules`, non-`package-lock` files) returns **zero**
  matches.

Conclusion: there is nothing to remove. The removal cannot be performed as written because
the ranks tab and its circle were never built in this repo.

## Scope

No production code change is possible for the requirement as written, because the target
UI does not exist. This WS is a **blocked / no-op contract**:

- `src/public/index.html` — confirmed: no ranks tab or circle markup. No change.
- `src/server.js` — confirmed: no ranks route or rank data. No change.
- No file in the checkout contains E-1…E-4 or a rank circle to edit.

Action for the coder: re-verify the absence (single grep, below), then make **no code
change**. Report back to the orchestrator/product owner that the ranks-tab circle feature
is not present in `cacc-start`, so there is nothing to remove. The product owner likely
meant a different repository, or this is a request to first *build* the ranks tab — which
is out of scope for a removal WS and must be re-filed as a feature requirement.

## Acceptance / DoD

- `npm run build` and `npm test` remain green (no regressions; expected, since no code
  changes).
- Contract followed: no files inside the checkout were edited speculatively; no ranks tab
  was invented.
- The coder's PR/summary explicitly states that E-1…E-4 / the ranks-tab circle does not
  exist in this repository and quotes the verifying grep result.
- If, and only if, a ranks tab + circle is later discovered (e.g. added by a dependency
  WS), this WS is reopened with concrete file:line scope before any edit.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-BH-remove-e1-e4-rank-circle.md in full before doing anything.

Work on branch ws/remove-e1-e4-rank-circle in worktree cacc-ws-remove-e1-e4-rank-circle.

Scope: The product owner asked to remove E-1, E-2, E-3, and E-4 from the "circle in the ranks tab." This repo is currently a placeholder landing page — there is no ranks tab, no circle, and no E-1…E-4 tokens. First re-verify with: grep -rni "rank\|circle\|E-1\|E-2\|E-3\|E-4" --include=*.html --include=*.js src test. If (as expected) it returns nothing, make NO code change and write a short PR/summary stating the feature does not exist in cacc-start so there is nothing to remove, quoting the grep output. Do not invent or scaffold a ranks tab — that would exceed this removal-only requirement.

Build green; the orchestrator handles commit/push/PR.
```
