# WS-I — New Cadet Start Guide (one-stop landing page)

- Branch: `ws/cadet-start-guide`
- PR title: `[ws/cadet-start-guide] WS-I-cadet-start-guide: build the new-cadet one-stop start page`
- Depends on: none

## Problem

Quoting the product owner verbatim:

> Let's fully flesh out the functionality of the site as a starting point. This is a starter guide for Cadets. Analyze https://cacadets.org/ , go look at the Cadet Rank structure, some of the lower ribbons on the list, and present this in a visually beautiful, scrollable website with presentation of information for a cadet to have at their fingertips for what our organization is, how they rank up through their first few ranks (RCT -> C/CPL), how they can get a few ribbons, what cadet events there are (look at the Events suite, cacadets.org/Events/*) and what they might do at an event. What does a brand new Cadet need? Answer those questions in a one stop shop page and we'll expand the architecture as the product specs continue to flesh out.

## Investigation

Current state of the app (zero-dependency static-file Node server):

- `src/server.js:25-52` — `http.createServer` serves `/healthz` (line 27) and otherwise reads a file from `PUBLIC_DIR` (`src/public/`). The MIME map at `src/server.js:15-23` already includes `.html`, `.css`, `.js`, `.svg`, `.png`, `.ico`, so **no server change is required** to serve new CSS/JS/SVG assets. Path-traversal guard at `src/server.js:35-41`.
- `src/public/index.html:1-28` — the only page; a centered placeholder ("This is the placeholder landing page. Replace it as the project grows."). This is the file to replace with the real site.
- `test/server.test.js:15-23` — the `/` test only asserts the body matches `/California Cadet Corps/`. New section content must keep that string present and should add assertions for the new sections/assets.
- `package.json:18-24` — `build` is a no-op; `test` is `node --test`; `lint` is `node --check src/server.js` (only lints the server, so a new `app.js` is not linted by CI). No bundler, no framework — keep the page dependency-free (vanilla HTML/CSS/JS).
- `.github/workflows/ci.yml` runs the npm `lint`/`test`/`build` scripts; the test for `/` is the contract CI enforces.

Source content gathered from cacadets.org for the coder to render (authoritative regs are CR 1-1 awards / CR 1-5 promotions — link, don't claim exactness beyond these):

- **Org / mission**: "Developing Leaders Since 1911" (es: "Formando Líderes Desde 1911"). Youth military-education leadership program in California schools. Program strands: Leadership, Citizenship, Military Subjects, Healthy Living / Wellness, Academics.
- **First ranks (lowest → C/CPL)**, per `cacadets.org/Cadet/Rank Structure` & CR 1-5: Recruit (RCT, first semester) → Cadet (CDT, after ~1 semester + PTA) → Cadet First Class (CFC, after ~2nd semester + PTA) → Cadet Corporal (C/CPL, after ~3rd semester + PTA). Advancement = Time-in-Grade + Performance Task Assessment (PTA); a cadet has no automatic "right" to promotion.
- **Entry-level ribbons** (from `cacadets.org/Cadet/Ribbon Chart`): Perfect Attendance, Physical Fitness, Marksmanship Training, Basic Leadership School, Bivouac, Individual Community Service, Citizenship — each with a one-line "how earned".
- **Events** (`cacadets.org/Events/*`): Summer Encampment (Camp San Luis Obispo, ~$150), Drill Competition, Summer Camp / Grizzly Adventure, Wilderness & Survival training, Marksmanship Competition. **What you do at an event**: drill & ceremonies, PT, barracks inspections, CACC knowledge, bivouac, obstacle course, Alpine Tower / climbing wall, Leadership Reaction Course (LRC), compass & map reading, Engagement Skills Trainer (EST).
- **What a new cadet needs**: learn cadet courtesies, get/maintain the uniform, attend meetings (attendance counts toward promotion & ribbons), set a first promotion goal (RCT→CDT), pick a first event.

## Scope

File-by-file changes (no full code blocks here — coder authors content):

1. **`src/public/index.html`** (replace) — semantic, scrollable single page with a sticky top nav and anchored sections, in this order:
   - Hero: "California Cadet Corps" + "Developing Leaders Since 1911" tagline + scroll CTA. Must keep the literal string `California Cadet Corps` (test depends on it).
   - `#about` — Who We Are: mission + the program strands as cards.
   - `#ranks` — "Your First Ranks": a visual progression RCT → CDT → CFC → C/CPL (timeline or stepped cards) showing time-in-grade + PTA; link to CR 1-5.
   - `#ribbons` — "Earn Your First Ribbons": responsive grid of ~6–7 entry ribbons with how-earned; link to the Ribbon Chart / CR 1-1.
   - `#events` — "Cadet Events": cards for the events above + a "What you'll do at an event" list; link to `cacadets.org/Events`.
   - `#new-cadet` — "What a New Cadet Needs": a checklist.
   - Footer: source links to cacadets.org and a disclaimer that official requirements live in CR 1-1 / CR 1-5.
2. **`src/public/styles.css`** (new) — visually polished, mobile-first, responsive design (CSS variables, the CACC navy palette, system font stack, grid/flex layouts, smooth-scroll, sticky nav, accessible contrast, `prefers-reduced-motion` honored). Linked from `index.html`.
3. **`src/public/app.js`** (new, optional but preferred) — small vanilla JS for nav active-state on scroll and reveal-on-scroll via `IntersectionObserver`; degrade gracefully with JS disabled. Linked as a `defer` module.
4. **`src/public/` assets** (optional) — inline SVG or a small `.svg` for rank/ribbon iconography; no binary/external dependencies, no external CDNs/fonts (offline-safe, CSP-friendly).
5. **`test/server.test.js`** (extend) — keep existing two tests; add assertions that `GET /` body contains the new section markers (e.g. `id="ranks"`, `id="ribbons"`, `id="events"`) and that `GET /styles.css` (and `/app.js` if added) returns 200 with the correct `Content-Type`.

Out of scope (future workstreams): server-side routing/framework, multi-page architecture, CMS/data files, auth, the full ribbon/rank catalog beyond the first few. Do **not** modify `src/server.js`, deploy configs, or CI workflows.

## Acceptance / DoD

- `npm run build` and `npm run lint` succeed (server unchanged; build is a no-op).
- `npm test` passes, including the new assertions; the `/` test still matches `California Cadet Corps`.
- Page is a single scrollable document with working in-page anchor nav; all five content areas (about, ranks, ribbons, events, new-cadet) are present and populated with the researched content above.
- Responsive at mobile and desktop widths; accessible (semantic landmarks, alt text, focus states, reduced-motion respected); zero runtime dependencies and no external network calls.
- Content is accurate to cacadets.org and frames rank/ribbon specifics as guidance, linking CR 1-1 / CR 1-5 as authoritative.
- New code (CSS/JS additions) is covered by the extended server tests.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.
Read the workstream contract first: docs/workstreams/WS-I-cadet-start-guide.md — it lists the exact file paths, the cacadets.org source content to render, and the acceptance criteria.

Work on branch `ws/cadet-start-guide` in worktree `cacc-ws-cadet-start-guide`.

Scope: Replace the placeholder src/public/index.html with a visually beautiful, scrollable one-stop "new cadet start guide" — sticky-nav sections for who we are, the first ranks (RCT → CDT → CFC → C/CPL), a few entry-level ribbons, cadet events and what you do at one, and what a brand-new cadet needs. Add src/public/styles.css and a small vanilla src/public/app.js (sticky nav + reveal-on-scroll); keep the app zero-dependency with no external network calls, and do not touch src/server.js or CI. Extend test/server.test.js so GET / still matches "California Cadet Corps" and the new sections/assets (styles.css, app.js) are asserted.

Self-verify: npm run lint, npm run build, and npm test all pass before you finish.
Build green; the orchestrator handles commit/push/PR.
```
