# WS-AF — Remove "Formando Líderes Desde 1911" motto and California Military Department blurb from the About tab

- Branch: ws/remove-formando-lideres-about-text
- PR title: [ws/remove-formando-lideres-about-text] WS-AF-remove-formando-lideres-about-text: remove motto + CMD description from About tab
- Depends on: (none)

## Problem

Product owner (verbatim):

> remove Formando Líderes Desde 1911 please we don't need it and also remove this. under the California Military Department in the about tab that gives the description please.

## Investigation

The requested content does **not exist anywhere in this repository's current code or docs.**

- `src/public/index.html` (lines 1–28) is the only HTML file. It is a placeholder landing page containing exactly: an `<h1>California Cadet Corps</h1>` (line 22), a welcome line (line 23), a "placeholder landing page" line (line 24), and a health-check line (line 25). There is **no About tab**, no navigation, no "Formando Líderes Desde 1911" motto, and no "California Military Department" description.
- `src/server.js` (lines 1–66) is a static-file/health-check server only. It renders no About content and injects no such strings server-side.
- Full-repo, case-insensitive searches (excluding `node_modules`/`.git`) for `formando`, `líderes`/`lideres`, `1911`, and `military department` return **zero matches**.

Root cause of the mismatch: the strings the product owner is looking at live on the live/production site (e.g. cacadets.org's About page), not in `cacc-start`, which is a freshly scaffolded placeholder portal. There is nothing in this codebase to remove.

## Scope

No source changes are possible because the target strings are absent. This workstream is **BLOCKED pending clarification** rather than a code edit.

- `src/public/index.html` — no change required (target content not present).
- `src/server.js` — no change required (target content not present).

A coder should NOT invent an About tab or its content in order to then delete part of it — that would be adding scope the product owner did not request. The correct outcome is to verify absence and report back, not to produce an empty/no-op PR.

Clarification needed from the product owner before any code change:
1. Confirm whether the About tab is expected to already exist in `cacc-start` (it does not), or whether the content lives in a different repository/site.
2. If the About tab and this content are meant to be added to `cacc-start` first, that is a separate feature workstream; removal cannot precede creation.

## Acceptance / DoD

- Coder confirms via grep that `formando` / `líderes` / `1911` / `california military department` (case-insensitive) have zero matches across the repo.
- No About tab or motto/description content is fabricated.
- `npm run build` and `npm test` remain green (no source changes expected).
- Findings (target content absent; clarification needed) are reported back to the orchestrator/product owner; no speculative edits are committed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract at docs/workstreams/WS-AF-remove-formando-lideres-about-text.md in full before doing anything.

Use branch ws/remove-formando-lideres-about-text and worktree cacc-ws-remove-formando-lideres-about-text.

Scope: The product owner asked to remove the "Formando Líderes Desde 1911" motto and a "California Military Department" description from the About tab. Investigation shows NONE of this content exists in this repo — the only HTML is the placeholder src/public/index.html (no About tab), and full-repo case-insensitive grep for formando/líderes/1911/"military department" returns zero matches. Do NOT create an About tab or fabricate content to then delete; that is out of scope. Verify the absence with grep, make no source changes, and report that the target content is not in this repository and clarification is needed (the content likely lives on the live site / another repo).

Build green; the orchestrator handles commit/push/PR.
```
