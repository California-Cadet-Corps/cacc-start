# WS-F — Remove circular frame around hero & nav logo images

- Branch: ws/remove-logo-circle
- PR title: [ws/remove-logo-circle] WS-F-remove-logo-circle: remove circular frame around hero and nav logo images
- Depends on: (none)

## Problem

Product owner, verbatim:

> on the hero and the nav bar remove the circle around the logo images.

## Investigation

The rendered frontend is a single static page served by the zero-dependency
HTTP server.

- `src/server.js:11-12` — `PUBLIC_DIR` is `src/public`; `/` resolves to
  `index.html` (`src/server.js:35`). That file is the entire UI surface.
- `src/public/index.html` is the only HTML/CSS/JS asset under `src/public/`
  (verified: `ls -R src/public` lists `index.html` only). It is a placeholder
  landing page — `<main>` with an `<h1>` and three `<p>` (lines 21-26).

Searching the whole repo (excluding `node_modules`) for the referenced UI:

- No hero section, no nav bar / `<header>` / `<nav>` element exists.
- No `<img>` / logo image exists anywhere in `src/`.
- The only `border-radius` in the codebase is `4px` on the `<code>` selector
  (`src/public/index.html:17`). There is **no** `border-radius: 50%`,
  `border-radius: 9999px`, `clip-path: circle(...)`, or `rounded-full` class
  anywhere.

### Root cause / scope note (discrepancy — read before coding)

The elements named in the requirement (hero, nav bar, logo images, and the
circular frame around those logos) **do not exist on `main`**. The requirement
appears to target a richer page than the placeholder currently in the repo —
likely the live production markup at start.cacadets.org has not yet landed in
this repository, or the logos/nav are expected to be added by another
workstream.

This WS is therefore scoped as: **ensure no circular framing is applied to
logo images in the hero or nav bar within the page's CSS/markup.** Because no
such markup exists today, the literal "remove" is currently a no-op
verification. The coder must NOT invent a hero, nav bar, or logos to delete a
circle from — that is out of scope. The deliverable is to confirm/guarantee the
absence of circular logo styling and, if hero/nav logo markup is present at
implementation time, strip the circular treatment from it only.

## Scope

- `src/public/index.html`
  - Inspect the `<style>` block (lines 7-18) and `<body>` (lines 20-27).
  - If hero/nav logo `<img>` elements exist with circular framing
    (`border-radius: 50%`/`9999px`, `clip-path: circle(...)`, or a
    `rounded`/`rounded-full` utility class), remove only that circular
    treatment so logos render with their natural/square corners. Leave the
    unrelated `code { border-radius: 4px }` rule untouched.
  - If no such markup exists (the current state on `main`), make no functional
    change; the work is verification only.

No changes to `src/server.js`, build config, or any other file.

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; the
  existing server test suite must stay green).
- No `border-radius: 50%`, `border-radius: 9999px`, `clip-path: circle`, or
  `rounded-full` styling is applied to logo images in the hero or nav bar.
- The `code { ... border-radius: 4px }` rule is unchanged.
- Contract followed: only `src/public/index.html` is touched, and no hero/nav/
  logo markup is fabricated to satisfy the requirement.
- If the targeted markup genuinely does not exist, the PR description states
  this explicitly so the product owner can confirm the intended target.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-F-remove-logo-circle.md in full before
making changes.

Work on branch ws/remove-logo-circle in worktree cacc-ws-remove-logo-circle.

Scope: in src/public/index.html, remove any circular framing (border-radius:
50%/9999px, clip-path: circle, or rounded-full class) applied to logo images in
the hero and nav bar so the logos render with natural corners. IMPORTANT: on
main this markup does not exist — the only border-radius is 4px on the <code>
selector (line 17), which must stay. Do NOT invent a hero, nav bar, or logo
images to delete a circle from; if no circular logo styling exists, make no
functional change and note that in the PR description. Touch only
src/public/index.html.

Build green; the orchestrator handles commit/push/PR.
```
