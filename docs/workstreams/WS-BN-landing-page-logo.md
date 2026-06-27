# WS-BN — Use public/logo.png as the only logo on the landing page

- Branch: ws/landing-page-logo
- PR title: [ws/landing-page-logo] WS-BN-landing-page-logo: use public/logo.png as the only page logo
- Depends on: (none)

## Problem

Product owner, verbatim:

> "public/logo.png"  is the only image you should use for a logo on the page

## Root cause / Investigation

This is a constraint/feature, not a bug — the landing page currently has **no logo image at all**, and there is no `logo.png` asset in the repo. The product owner is fixing the single permitted logo source.

- `src/public/index.html:20-26` — the `<main>` block renders an `<h1>` text heading and three `<p>` lines. There is **no `<img>` element** anywhere on the page (grep for `<img`/`logo`/`.png` across HTML/CSS/JS returns no matches in markup).
- `src/server.js:12` — `PUBLIC_DIR = join(__dirname, 'public')`; the static directory is `src/public/`, served at the URL root. A file at `src/public/logo.png` is therefore served at the URL path **`/logo.png`**. (The product owner's "public/logo.png" maps to repo path `src/public/logo.png` and served URL `/logo.png`.)
- `src/server.js:21` — `'.png': 'image/png'` is already registered in the `MIME` map, so PNG assets are served with the correct content type with no server change needed.
- `src/public/` currently contains only `index.html` (no `logo.png` exists yet) — `ls src/public/` confirms.
- `test/server.test.js` — existing tests cover `/healthz` and `/` only; no asset test exists.

## Scope

File-by-file changes:

- **`src/public/logo.png`** (new binary asset) — add the logo image at this exact path so it is served at `/logo.png`. This is the only image permitted for use as the page logo. (Use the official California Cadet Corps logo PNG; if a real asset is unavailable, commit a valid placeholder PNG so the route resolves.)
- **`src/public/index.html`** (edit, in `<main>` at lines 20-26) — add a single `<img src="/logo.png" alt="California Cadet Corps logo">` above the `<h1>` (~line 22). Add minimal CSS in the existing `<style>` block (e.g. a `max-width`/`height: auto` rule) so it renders sensibly. This must be the **only** image element on the page — do not add any other logo/image source (no inline SVG, no external URL, no data URI).
- **`test/server.test.js`** (edit) — add a test that `GET /logo.png` returns status `200` with `Content-Type: image/png`, mirroring the existing test structure (listen on port 0, fetch, assert, close).

## Acceptance / DoD

- `npm run build` and `npm test` pass (CI green).
- `src/public/logo.png` exists and is served at `/logo.png` with `Content-Type: image/png`.
- `src/public/index.html` references `/logo.png` and contains exactly one image element; no other logo image source appears anywhere on the page.
- New test covers the `/logo.png` route.
- Contract followed; no unrelated files touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BN-landing-page-logo.md

Branch: ws/landing-page-logo
Worktree: cacc-ws-landing-page-logo

Scope: Add src/public/logo.png (served at /logo.png) and reference it as the
single logo <img> in src/public/index.html — it must be the ONLY image used as
a logo on the page (no other image source, SVG, external URL, or data URI). Add
a test in test/server.test.js asserting GET /logo.png returns 200 with
Content-Type image/png. The server already maps .png in src/server.js, so no
server change is needed.

Build green; the orchestrator handles commit/push/PR.
```
