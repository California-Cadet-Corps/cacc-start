# WS-J — Responsive landing page for small screens and mobile

- Branch: ws/responsive-mobile-layout
- PR title: [ws/responsive-mobile-layout] WS-J-responsive-mobile-layout: make the landing page responsive on mobile/small screens
- Depends on: (none)

## Problem

> make the website responsive when on a smaller screen or on mobile

## Root cause / Investigation

The entire user-facing "website" is a single static page served by the
zero-dependency HTTP server. There is no framework, bundler, or external
stylesheet — all markup and CSS are inline.

- `src/public/index.html` — the only rendered page. Relevant lines:
  - Line 5: `<meta name="viewport" content="width=device-width, initial-scale=1" />` — viewport meta is already present (good baseline, keep it).
  - Lines 7–18: inline `<style>` block. This is where all layout/responsiveness lives.
  - Line 9–13: `body` uses `display: grid; place-items: center; min-height: 100vh` — a centered single-column layout.
  - Line 14: `main { padding: 2rem; max-width: 40rem; }` — fixed `2rem` side padding; on narrow phones (~320–360px) this wastes horizontal space, and there is no `box-sizing: border-box`, so padding adds to width.
  - Line 15: `h1 { font-size: clamp(1.8rem, 5vw, 3rem); }` — heading already scales fluidly (good pattern; extend the same idea to body text).
  - Lines 16–17: `p` and `code` have fixed sizing; long `code`/`strong` tokens can overflow on very narrow screens.
  - **There are no `@media` queries anywhere** — this is the core gap for small-screen tuning.
- `src/server.js` — serves `index.html` for `/` (lines 34–47) with correct `text/html` MIME; no server changes required.
- `test/server.test.js` — current tests assert `/healthz` and that `/` contains "California Cadet Corps" (lines 15–23). A responsiveness regression test fits here.
- `package.json` — `lint` only runs `node --check src/server.js` (HTML is not linted); `test` runs `node --test`; `build` is a no-op. So the only gating signal for HTML changes is the test suite.

Conclusion: this is a CSS-only feature. Make the existing single page degrade
cleanly on small/mobile viewports by adding `box-sizing`, fluid spacing/type,
overflow safety, and at least one `@media` breakpoint — all within the inline
`<style>` block of `index.html`.

## Scope

- `src/public/index.html` (inline `<style>`, lines 7–18):
  - Add a universal `box-sizing: border-box` reset so padding never expands element width.
  - Keep the existing viewport meta (line 5) and the `clamp()` heading (line 15).
  - Make `main` side padding fluid (e.g. clamp/percentage) so it tightens on narrow screens instead of a fixed `2rem`; keep the `max-width: 40rem` cap for large screens.
  - Apply fluid sizing to `p` (and keep line-height) so body copy scales like the heading.
  - Add overflow safety for inline `code`/`strong` (e.g. `overflow-wrap: break-word`) so long tokens don't cause horizontal scroll.
  - Add at least one `@media (max-width: 480px)` (and optionally a mid-tier breakpoint) reducing padding and adjusting font sizes for phones.
  - Do not add external CSS/JS files, frameworks, or new pages — keep it inline and zero-dependency to match the current architecture.

- `test/server.test.js` (additive test, follow the existing `node:test` + `fetch` style at lines 15–23):
  - Add a test that GETs `/`, and asserts the served HTML contains the viewport meta tag (`width=device-width`) and at least one responsive rule (`@media`). This locks in the responsive contract without depending on a browser/visual harness.

## Acceptance / DoD

- `npm run build` succeeds (no-op placeholder) and `npm run lint` passes (`node --check src/server.js`).
- `npm test` passes, including the new responsiveness assertion and the existing `/healthz` and `/` tests.
- The served page keeps the `width=device-width` viewport meta and now contains at least one `@media` breakpoint plus `box-sizing: border-box`.
- On a narrow viewport (~320–375px wide) the page has no horizontal scroll, padding is reduced versus desktop, and heading/body text scale down; layout stays centered and readable on desktop (≥40rem) as before.
- Change is CSS-only inside `src/public/index.html` (plus the added test); no new dependencies, files, or server logic.
- Contract followed: no edits outside the files listed in Scope.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-J-responsive-mobile-layout.md.

Work on branch ws/responsive-mobile-layout in worktree cacc-ws-responsive-mobile-layout.

Scope: This is a CSS-only feature on the single static landing page. Edit the inline <style> block of src/public/index.html to make it responsive on small/mobile screens — add box-sizing: border-box, fluid padding/type, overflow-wrap safety for long inline tokens, and at least one @media (max-width: 480px) breakpoint that tightens padding and font sizes — while keeping the existing viewport meta (line 5), the clamp() heading (line 15), and the max-width: 40rem cap. Add one additive test in test/server.test.js (matching the existing node:test + fetch style) asserting the served HTML still contains the width=device-width viewport meta and at least one @media rule. Do not add frameworks, external CSS/JS files, new pages, or server changes; keep it zero-dependency.

Self-verify: npm run lint, npm run build, and npm test all pass. Build green; the orchestrator handles commit/push/PR.
```
