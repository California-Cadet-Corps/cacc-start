# WS-E — Redesign landing page with CACC navbar/hero/about layout

- Branch: ws/landing-page-redesign
- PR title: [ws/landing-page-redesign] WS-E-landing-page-redesign: replace landing page UI with new CACC design
- Depends on: (none)

## Problem

Product owner, verbatim:

> change the ui to this design

(followed by a full standalone HTML document — a California Cadet Corps landing page with a sticky navbar containing brand logo + "CALIFORNIA CADET CORPS" title, MENU/SEARCH/ASK AN AI buttons, IG/FB/X social buttons; a hero section with a floating circular logo, "CACC" heading, and "LEADERSHIP • EXCELLENCE • SERVICE" tagline; and an "ABOUT THE CORPS" content section with three paragraphs about the Corps' 1911 founding. The design uses a blue/gold (`--primary-blue: #0f3a7d`, `--accent-gold: #d4af37`) theme with embedded `<style>`, CSS custom properties, animations, and responsive breakpoints at 1024px / 768px / 480px.)

## Investigation

The app is a single zero-dependency Node static-file server; the landing page is one self-contained HTML file. There is no bundler, framework, CSS pipeline, or component system to touch.

- `src/server.js:25-52` — `http.createServer` serves static files from `PUBLIC_DIR`. `src/server.js:34-36` maps `/` → `/index.html`. The only behavioral endpoint is `/healthz` (`src/server.js:27-31`); the redesign does not touch it.
- `src/public/index.html:1-28` — the current placeholder landing page (dark `#0b1d3a` background, single `<h1>California Cadet Corps</h1>`, inline `<style>`). This is the entire file to be replaced.
- `test/server.test.js:15-23` — `GET /` test asserts the response body matches `/California Cadet Corps/`. The new design contains "CALIFORNIA CADET CORPS" and "California Cadet Corps" literally (navbar `<h1>` and about-box `<h3>`), so the existing test continues to pass. `test/server.test.js:5-13` (`/healthz`) is unaffected.
- `package.json:18-24` — `build` is a no-op placeholder; `lint` only runs `node --check src/server.js` (does not parse HTML); `test` runs `node --test`. No build/lint step inspects HTML, so the only gate is the two server tests.

Root cause: N/A (feature/UI change, not a bug). Exact scope is the contents of `src/public/index.html`.

## Scope

- `src/public/index.html` — **replace the entire file** with the product owner's provided HTML document, verbatim, including its `<!DOCTYPE html>`, `<head>` (meta tags, `<title>California Cadet Corps</title>`, the full embedded `<style>` block with `:root` custom properties, navbar/hero/content/responsive rules, and `@keyframes logoFloat`), and `<body>` (the `.navbar` header, `.hero` section, and `.content` main with the `.about-box`). Keep the external logo image references (`https://cacc.us-east-1.linodeobjects.com/Website%20Source/California_Cadet_Corps_logo.png`) exactly as given. Do not add a build step or extract the CSS into a separate file — the design ships as one self-contained HTML document, matching how the current `index.html` already inlines its styles.

No other files change. `src/server.js`, `test/server.test.js`, and `package.json` are unchanged — the static server already serves whatever `index.html` contains.

## Acceptance / DoD

- `src/public/index.html` is byte-for-byte the design supplied by the product owner (the page renders the navbar, floating-logo hero, and ABOUT THE CORPS section as described).
- `npm test` passes — both existing tests (`GET /healthz` → ok, `GET /` body matches `/California Cadet Corps/`) stay green; the new markup contains "California Cadet Corps".
- `npm run lint` and `npm run build` pass (both are unaffected — they don't inspect HTML).
- No changes outside `src/public/index.html`. Contract followed; no new dependencies, no server/route changes.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-E-landing-page-redesign.md

Work on branch ws/landing-page-redesign in worktree cacc-ws-landing-page-redesign.

Scope: Replace the entire contents of src/public/index.html with the new
California Cadet Corps landing-page design quoted in the requirement (navbar +
floating-logo hero + "ABOUT THE CORPS" section, blue/gold theme, embedded
<style>, responsive breakpoints). Change ONLY src/public/index.html — do not
touch src/server.js, test/server.test.js, or package.json, and do not add a
build step or extract the CSS. Self-verify: the served page contains the literal
text "California Cadet Corps" so the existing GET / test stays green, and
npm test passes.

Build green; the orchestrator handles commit/push/PR.
```
