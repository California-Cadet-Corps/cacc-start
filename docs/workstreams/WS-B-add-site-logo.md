# WS-B — Add California Cadet Corps logo to the website

- Branch: ws/add-site-logo
- PR title: [ws/add-site-logo] WS-B-add-site-logo: add CACC logo image to landing page
- Depends on: (none)

## Problem

Product owner, verbatim:

> https://upload.wikimedia.org/wikipedia/en/2/24/California_Cadet_Corps_logo.png
>
> This image needs to be used for the logo of the website.

## Investigation

- `src/public/index.html` (lines 20–26) renders the landing page. The `<main>` block currently shows a text-only header — `<h1>California Cadet Corps</h1>` at line 22 — with **no logo image** anywhere in the document.
- `src/server.js` is a static file server. The MIME map (lines 15–24) already includes `'.png': 'image/png'` (line 22), and the request handler (lines 26–53) serves any file found under `PUBLIC_DIR` (`src/public/`, defined line 12). So a PNG dropped into `src/public/` is served automatically with no server code change required.
- `.gitattributes` (line: `*.png  binary`) already marks `*.png` as binary, so the committed image will not be line-ending normalized.
- `test/` currently covers `/healthz` and `GET /` (the landing page text). No test asserts a logo asset is served.

Root cause: the landing page has no logo element and no logo asset exists in `src/public/`. The fix is purely additive — add the image asset and reference it in the page.

## Scope

File-by-file changes:

- **`src/public/logo.png`** (new binary asset) — download the image from the product-owner URL `https://upload.wikimedia.org/wikipedia/en/2/24/California_Cadet_Corps_logo.png` and save it here. Keep the filename `logo.png` so the page can reference `/logo.png`. If the URL is unreachable from the build environment, stop and report — do not substitute a different image.
- **`src/public/index.html`** — inside `<main>` (around lines 21–22), add an `<img src="/logo.png" alt="California Cadet Corps logo">` above the `<h1>`. Add minimal CSS in the existing `<style>` block (lines 7–18) to constrain the logo width (e.g. `max-width` / responsive sizing) and center it consistently with the existing layout. Do not remove the existing `<h1>` text.
- **`test/` (extend, e.g. `test/server.test.js` or matching existing test file)** — add a test asserting `GET /logo.png` returns HTTP 200 with `Content-Type: image/png`. Follow the existing test style (listen on port 0, fetch, assert, close).

## Acceptance / DoD

- `npm run build` and `npm test` pass (build is a no-op placeholder; tests must be green).
- `npm run lint` passes (`node --check src/server.js` — unchanged, still valid).
- The logo image exists at `src/public/logo.png` and is the image from the product-owner URL.
- `src/public/index.html` displays the logo via `<img src="/logo.png">` with a non-empty `alt` attribute; existing landing-page content (the `California Cadet Corps` heading) is preserved.
- A new test verifies `/logo.png` is served with `Content-Type: image/png`.
- Contract followed: changes limited to the files listed in Scope; no server-logic changes to `src/server.js` beyond what is described (none expected).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-B-add-site-logo.md — implement exactly what it specifies.

Work on branch ws/add-site-logo in worktree cacc-ws-add-site-logo.

Scope summary for self-verification: Download the CACC logo PNG from https://upload.wikimedia.org/wikipedia/en/2/24/California_Cadet_Corps_logo.png into src/public/logo.png, then add an <img src="/logo.png" alt="California Cadet Corps logo"> to the <main> of src/public/index.html (keep the existing heading) with small responsive CSS in the existing <style> block. Add a test asserting GET /logo.png returns 200 with Content-Type image/png. The static server already serves src/public/ and already maps .png, so no src/server.js change is expected.

Build green; the orchestrator handles commit/push/PR.
```
