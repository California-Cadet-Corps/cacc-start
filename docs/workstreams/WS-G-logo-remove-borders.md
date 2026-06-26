# WS-G — Remove borders from hero & navbar logo image

- Branch: ws/logo-remove-borders
- PR title: [ws/logo-remove-borders] WS-G-logo-remove-borders: remove borders from hero & navbar logo image
- Depends on: (none confirmed — see Investigation; this work is blocked on a workstream that introduces the logo image, hero, and navbar markup)

## Problem

Product owner, verbatim:

> Remove the borders from the logo image on the hero and navbar

## Investigation

The referenced UI elements **do not currently exist** in the checkout. Findings:

- `src/public/index.html` (the only HTML asset, 28 lines) is an explicit placeholder. Line 24: `This is the placeholder landing page. Replace it as the project grows.`
- There is **no logo image**: no `<img>` element anywhere in `src/`; `find src -type f` returns no `.svg/.png/.jpg/.webp` asset (`src/public/` contains only `index.html`).
- There is **no hero** and **no navbar**: `grep -rni 'hero|navbar|nav |header'` over `src/`, `test/`, `docs/` returns nothing. The body is a single centered `<main>` (`src/public/index.html:21-26`).
- The **only** `border*` declaration in the repo is `border-radius: 4px` on the `code` selector at `src/public/index.html:17` — unrelated to any logo.
- `src/server.js` serves static files from `src/public/` and supports `.svg/.png` MIME types (`src/server.js:15-23`), but no image is present to serve.
- `docs/` contains no `AGENT_RULES.md` and no `workstreams/` directory yet; this is the first workstream file.

Conclusion: there are no logo-image borders to remove because the logo image, hero, and navbar have not yet been built. The requested change cannot be implemented against the current `main`.

## Root cause

Scope mismatch, not a bug. The requirement targets markup/styles that are absent from the placeholder landing page. A border can only be removed from an element that exists and currently has a border; neither precondition holds.

## Scope

This WS is **blocked** pending a workstream (or product decision) that introduces the logo image, hero, and navbar. No faithful, accurate source change exists today. The coder's deliverable is therefore one of the following, in priority order:

1. If a hero/navbar with a logo `<img>` has landed on the branch base by the time this runs (re-grep to confirm): in the file(s) that style that logo `<img>` (expected `src/public/index.html` `<style>` block, or a future CSS file under `src/public/`), remove only the `border`, `border-*`, and `outline` declarations that target the hero logo and the navbar logo. Change nothing else.
2. If those elements are still absent (current state): make **no source change**. Confirm via grep that no logo `<img>` and no `border`/`outline` declaration targeting a logo exist, so the requirement is already vacuously satisfied. The build stays green.

Files potentially touched (case 1 only): `src/public/index.html` (inline `<style>`) — surgical removal of border/outline rules on the logo image.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build green).
- No new border or outline styling is applied to any hero/navbar logo image; any pre-existing such styling is removed.
- No unrelated edits: the `border-radius` on the `code` selector (`src/public/index.html:17`) is left untouched.
- Existing tests in `test/server.test.js` still pass; if case 1 applies, the change is covered by a test asserting the served HTML/CSS contains no border styling on the logo image.
- The PR description states explicitly whether case 1 or case 2 was taken, with the grep evidence.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-G-logo-remove-borders.md in full before doing anything.

Use branch ws/logo-remove-borders and worktree cacc-ws-logo-remove-borders.

Scope: Remove the borders from the logo image on the hero and navbar. IMPORTANT —
first re-verify the codebase, because as of this contract no logo image, hero, or
navbar exists (src/public/index.html is a placeholder; the only border declaration is
an unrelated border-radius on `code`). If those elements now exist, surgically remove
only the border/border-*/outline CSS targeting the hero and navbar logo image and add
a covering test. If they still do not exist, make no source change and confirm via grep
that the requirement is vacuously satisfied. Touch nothing else (leave the `code`
border-radius alone). State in the PR which case applied with grep evidence.

Build green; the orchestrator handles commit/push/PR.
```
