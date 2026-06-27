# WS-AC — Landing page: Events section + Promotion Path rank images

- Branch: ws/events-promotion-content
- PR title: [ws/events-promotion-content] WS-AC-events-promotion-content: add Events disclaimer/links and Promotion Path rank images
- Depends on: (none)

## Problem

Product owner requirement, verbatim:

> remove the text "barracks inspections" and "Alpine Tower/Climbing Wall". Also put in the events section a line of text below the events saying "*Events NOT guaranteed*" also add links to the events get the links from the California Cadet Corp website. add rank pictures to the promotion path section and get the pictures from the California Cadet Corps website.

## Root cause / Investigation

The requirement targets page content that does **not currently exist** in the repository. The site is still a placeholder.

- `src/public/index.html` (28 lines) is a single placeholder landing page: an `<h1>California Cadet Corps</h1>` and three `<p>` lines (`src/public/index.html:22-25`). There is **no Events section**, **no Promotion Path section**, and **no `<head>`/CSS for them** (only the inline `<style>` block at `src/public/index.html:7-18`).
- A full-repo search for `barracks`, `alpine`, `climbing`, `promotion`, `inspection`, and `rank` returns **no matches** outside `.git` — the phrases "barracks inspections" and "Alpine Tower/Climbing Wall" appear nowhere. The two "remove the text" clauses therefore become **ensure-absent guards** (the text must not appear in the new content), not deletions of existing lines.
- The page is served statically: `src/server.js:11` sets `PUBLIC_DIR = join(__dirname, 'public')`, and `src/server.js:34-50` reads `/index.html` for `/`. MIME map at `src/server.js:15-23` already supports `.png`, `.svg`, `.ico`, `.css` — so locally-hosted rank images would serve, but external `https://...` image URLs need no server change.
- Tests: `test/server.test.js` asserts only `GET /healthz` → `{status:"ok"}` and that `GET /` contains `California Cadet Corps` (the `assert.match(text, /California Cadet Corps/)` check). New content must keep that substring present.
- Build/lint are trivial: `npm run build` is a no-op placeholder and `npm run lint` only runs `node --check src/server.js` (`package.json` scripts). No bundler; edits are plain static HTML.

Conclusion: this WS **adds** an Events section and a Promotion Path section to `src/public/index.html`, sourcing event links and rank images from the California Cadet Corps website (`https://cacadets.org`), while ensuring the two named phrases never appear.

## Scope

`src/public/index.html` — the only application file changed:
- Add an **Events section** (`<section id="events">` with a heading) listing events, where each event title is a hyperlink (`<a href>`) to its page on the California Cadet Corps website (`https://cacadets.org`). The coder must source the actual event links from `cacadets.org` (e.g. the Cadets / programs / activities pages); do not invent URLs — use real links found on the site.
- Directly **below the events list**, add a line of text: `*Events NOT guaranteed*` (render the asterisks/emphasis as italic text, e.g. `<em>Events NOT guaranteed</em>` or literally with asterisks — match the product owner's wording).
- Add a **Promotion Path section** (`<section id="promotion-path">` with a heading) that displays **rank pictures** (`<img>` per rank) sourced from the California Cadet Corps website (`https://cacadets.org`). Each `<img>` must have descriptive `alt` text naming the rank. Use the real rank-insignia image URLs from cacadets.org; if images cannot be hot-linked, download them into `src/public/` (e.g. `src/public/img/ranks/`) and reference them by relative path (the server already serves `.png`/`.svg` via `src/server.js:15-23`).
- **Ensure-absent guard:** the rendered HTML must NOT contain the strings "barracks inspections" or "Alpine Tower/Climbing Wall" (case-insensitive). They are not present today; the coder must not introduce them.
- Extend the inline `<style>` block (`src/public/index.html:7-18`) as needed for the new sections (lists, images, links) so the page remains readable; keep the existing dark theme.
- Keep the literal text `California Cadet Corps` in the page so `test/server.test.js` stays green.

`test/server.test.js` (optional, additive) — if practical, add assertions that `GET /` contains `Events NOT guaranteed` and a promotion/rank marker, and does NOT contain the two removed phrases. Do not weaken existing assertions.

No changes to `src/server.js`, deploy config, or CI.

## Acceptance / DoD

- `npm run build` and `npm run lint` pass; `npm test` passes (existing two tests stay green; any added tests pass).
- `src/public/index.html` renders an Events section whose event titles link to real pages on `https://cacadets.org`, with the line `Events NOT guaranteed` (italicized) immediately below the events.
- A Promotion Path section displays rank images sourced from the California Cadet Corps website, each with rank-naming `alt` text.
- The strings "barracks inspections" and "Alpine Tower/Climbing Wall" do not appear anywhere in the served HTML.
- The page still contains the literal text `California Cadet Corps`.
- Contract followed; no edits outside the files listed in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full workstream contract first: docs/workstreams/WS-AC-events-promotion-content.md

Work on branch ws/events-promotion-content in worktree cacc-ws-events-promotion-content.

Scope: edit src/public/index.html (currently a placeholder landing page) to add an Events
section where event titles link to real pages on the California Cadet Corps website
(https://cacadets.org), with an italic line "Events NOT guaranteed" directly below the events,
and a Promotion Path section showing rank pictures sourced from cacadets.org (each <img> with
rank-naming alt text). Source real links/images from cacadets.org — do not invent URLs; if rank
images can't be hot-linked, download them into src/public/ and reference by relative path.
Ensure the served HTML never contains "barracks inspections" or "Alpine Tower/Climbing Wall",
and keep the literal text "California Cadet Corps" so the existing test stays green.

Self-verify: npm run lint, npm run build, and npm test all pass (existing /healthz and / tests
green); optionally add additive tests for the new content.

Build green; the orchestrator handles commit/push/PR.
```
