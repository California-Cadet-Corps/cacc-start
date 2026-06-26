# WS-H — Hero & navbar logo sizing fixes

- Branch: ws/hero-navbar-logo-sizing
- PR title: [ws/hero-navbar-logo-sizing] WS-H-hero-navbar-logo-sizing: fix hero logo height/box-shadow and navbar logo fit
- Depends on: (none)

## Problem

Product owner, verbatim:

> remove the height and the box shadow from the hero logo and reduce the logo size in the navbar to fit the logo completly

## Investigation

The entire web frontend is a single static file served by the Node HTTP server.

- `src/server.js` — serves `src/public/index.html` at `/` (see test `test/server.test.js:18` "GET / serves the landing page").
- `src/public/index.html` — the only HTML/CSS in the repo. Inline `<style>` block at `src/public/index.html:7-18`; markup body at `src/public/index.html:20-27`.

Key finding (verified via `grep -rniE "logo|navbar|hero|box-shadow"` across the repo and across the `docs/student-guide-update` branch — zero matches):

- There is **no** navbar element, **no** hero section, **no** `<img>`/logo, and **no** `box-shadow` rule anywhere in the current source. `src/public/index.html` is an explicit placeholder ("This is the placeholder landing page. Replace it as the project grows." — `src/public/index.html:24`).
- There are no image assets in the repo (`find` for png/svg/jpg/webp returns only `index.html`).

Therefore the requirement's target elements (hero logo, navbar logo) do not yet exist in the source. The deployed production site at start.cacadets.org may render differently, but the repository source must be brought into the requirement-described end state. This WS delivers that end state within the single frontend file, scoped strictly to the requirement: a hero logo with no fixed height and no box-shadow, and a navbar logo sized to fit completely.

## Scope

All changes confined to `src/public/index.html` (the only frontend file).

1. **Add a logo asset** — add a lightweight brand logo to `src/public/` (e.g. `src/public/logo.svg`). A simple self-contained SVG is acceptable; no external/binary asset required. Ensure `src/server.js` serves it (confirm the static handler returns it with the correct content-type; extend the handler only if static asset serving is not already generic). If server changes are needed, keep them minimal and additive.
2. **Add a navbar** — a top `<nav>` (or `<header>`) containing the logo `<img>` with a `.navbar-logo` class. Size the navbar logo so the whole logo fits inside the bar without clipping or overflow — constrain by a `max-height` (and `width: auto`) tied to the navbar height; do **not** force a fixed pixel `height` larger than the bar. Net effect: "reduce the logo size in the navbar to fit the logo completely."
3. **Add a hero logo** — a hero section displaying the same logo with a `.hero-logo` class. Its CSS must have **no** `height` rule and **no** `box-shadow` rule (use `width`/`max-width` for sizing instead). Net effect: "remove the height and the box shadow from the hero logo."
4. Preserve the existing "California Cadet Corps" text and the page's existing structure/content so the current test (`test/server.test.js`) keeps passing (response body still matches `/California Cadet Corps/`).

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed.
- `npm test` passes — both existing tests (`/healthz` 200, `/` contains "California Cadet Corps") still green; if the logo asset requires a new served route, add a test asserting it returns 200 with an image content-type.
- `.hero-logo` CSS contains no `height` declaration and no `box-shadow` declaration.
- `.navbar-logo` is constrained (e.g. `max-height` + `width: auto`) so the full logo is visible within the navbar with no clipping.
- Contract followed: changes limited to `src/public/` (plus minimal additive `src/server.js` only if needed to serve the asset). No unrelated edits.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-H-hero-navbar-logo-sizing.md in full before starting.

Work on branch ws/hero-navbar-logo-sizing in worktree cacc-ws-hero-navbar-logo-sizing.

Scope (self-verify against the WS): the frontend is the single file src/public/index.html, which is a placeholder with no navbar/hero/logo today. Add a brand logo asset (e.g. src/public/logo.svg, served by src/server.js), a navbar whose .navbar-logo is sized (max-height + width:auto) to fit the logo completely without clipping, and a hero .hero-logo whose CSS has NO height rule and NO box-shadow. Keep the existing "California Cadet Corps" text so test/server.test.js stays green, and confirm npm run lint, npm run build, and npm test all pass.

Build green; the orchestrator handles commit/push/PR.
```
