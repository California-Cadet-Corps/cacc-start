# WS-AQ — Add "Chain Of Command" button and page

- Branch: ws/add-chain-of-command-page
- PR title: [ws/add-chain-of-command-page] WS-AQ-add-chain-of-command-page: Add Chain Of Command nav button and page
- Depends on: (none)

## Problem

Product owner, verbatim:

> generate a button labed "Chain Of Command" and the top next to the about button. when clicked it will send you to a page with this html code

(followed by a full `<!DOCTYPE html>` document titled "California Cadet Corps Chain of Command" — a styled vertical chain-of-command list from Governor of California down to Squad Member / Element Leader, with the CACC logo in the header and a footer reading "California Cadet Corps • Leadership • Duty • Honor". The complete HTML is the verbatim source the new page must contain.)

## Investigation

- `src/server.js:25-52` — zero-dependency static server. `/healthz` returns JSON (`:27-31`); everything else is resolved safely inside `PUBLIC_DIR` (`src/public/`) and served with a MIME type from the `MIME` map, which already includes `.html` (`:16`). **Any new `.html` file dropped into `src/public/` is served automatically — no server.js change is required.**
- `src/public/index.html` — current landing page. It is a single centered `<main>` block (`:21-26`). **There is no navigation bar and no "About" button.** The requirement says "next to the about button," but no About button exists in the codebase. The coder must therefore add a small top navigation area to host the new button; it should not invent unrelated About behavior.
- `test/server.test.js:15-23` — existing test asserts `GET /` returns 200 and body matches `/California Cadet Corps/`. New page warrants a parallel test.
- No `docs/AGENT_RULES.md`, no `docs/workstreams/README.md`, no build tooling beyond the placeholder `npm run build` (package.json). `npm test` runs `node --test`; `npm run lint` runs `node --check src/server.js`.

## Scope

File-by-file changes:

1. **`src/public/chain-of-command.html`** (new) — Contains the product owner's HTML document **verbatim**, exactly as supplied in the requirement (DOCTYPE through closing `</html>`, including the inline `<style>`, the right-logo link, all role cards and `chain-line` dividers, and the footer). Do not edit, reformat, or "improve" the markup.
2. **`src/public/index.html`** — Add a top navigation element (e.g. a `<nav>` or header bar above/within `<main>`) containing a link styled as a button, label text exactly `Chain Of Command`, that navigates to `/chain-of-command.html` (e.g. `<a href="/chain-of-command.html">`). Place it "at the top." Since no About button exists, the Chain Of Command button stands as the top nav item; keep styling consistent with the existing dark theme. Keep changes minimal and additive.
3. **`test/server.test.js`** — Add a test: `GET /chain-of-command.html` returns 200 and body matches `/Chain of Command/`. Follow the existing listen/fetch/close pattern (`:15-23`).

## Acceptance / DoD

- `npm run lint` and `npm test` pass; the new test for `/chain-of-command.html` passes.
- `GET /chain-of-command.html` serves the verbatim product-owner HTML with `Content-Type: text/html; charset=utf-8`.
- `src/public/index.html` shows a top button labeled exactly `Chain Of Command` that links to `/chain-of-command.html`.
- The new page's HTML matches the supplied source verbatim (no markup edits).
- Changes are additive; `server.js` is unchanged; no new dependencies.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the WS file at docs/workstreams/WS-AQ-add-chain-of-command-page.md in full before starting.
Work on branch ws/add-chain-of-command-page in worktree cacc-ws-add-chain-of-command-page.

Scope: Create src/public/chain-of-command.html containing the product owner's supplied HTML verbatim (do not edit the markup). Add a top nav button labeled exactly "Chain Of Command" to src/public/index.html that links to /chain-of-command.html — there is no existing About button, so this button is the top nav item. Add a test in test/server.test.js asserting GET /chain-of-command.html returns 200 and contains "Chain of Command". The static server in src/server.js already serves any .html under src/public/, so do not modify server.js.

Build green; the orchestrator handles commit/push/PR.
```
