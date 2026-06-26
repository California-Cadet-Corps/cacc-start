# WS-L — Fix Rank Structure URL & make the site mobile-responsive

- Branch: ws/rank-url-mobile-responsive
- PR title: [ws/rank-url-mobile-responsive] WS-L-rank-url-mobile-responsive: correct Rank Structure URL and ensure mobile responsiveness (incl. hero title)
- Depends on: the redesigned new-cadet landing page (`src/public/index.html`, `src/public/styles.css`, `src/public/app.js`) from WS-I `cadet-start-guide` being present on the working base. If the base checkout still shows the 28-line placeholder `index.html` with no hero/links, this WS cannot proceed and the orchestrator must integrate the redesigned page first.

## Problem

Product owner, verbatim:

> Fix the Rank Structure URL to use this: https://cacadets.org/Cadet/Rank%20Structure?lang=en.
>
> Also ensure that the entire site is responsive on mobile screens including the title on the hero of the page.

## Root cause / Investigation

Investigated the redesigned landing page as it exists in the active development line (integrated commit `6c17cbf`; the current local `main` checkout still holds the pre-redesign placeholder, so line numbers below are anchored to the redesigned `index.html`/`styles.css` and the coder MUST grep for the quoted strings rather than trust exact line numbers).

**1. Wrong Rank Structure URL — two occurrences in `src/public/index.html`:**
- `src/public/index.html:189` — in the Ranks section `<p class="rank-ref">`: `<a href="https://www.cacadets.org/Cadet/Rank-Structure" target="_blank" rel="noopener">cacadets.org/Cadet/Rank-Structure</a>`
- `src/public/index.html:419` — in the footer `<ul class="footer-links">`: `<li><a href="https://www.cacadets.org/Cadet/Rank-Structure" target="_blank" rel="noopener">Rank Structure</a></li>`

Both point at `https://www.cacadets.org/Cadet/Rank-Structure` (hyphenated path, `www.` host, no `lang` query). The required canonical URL is `https://cacadets.org/Cadet/Rank%20Structure?lang=en` (no `www.`, space-encoded path segment, `?lang=en`). Note the sibling Ribbon Chart link already uses the analogous `...Ribbon%20Chart?lang=en` form (`src/public/index.html:272`); this brings Rank Structure in line with the product owner's exact spec.

**2. Hero title not safely responsive — `src/public/index.html:52` + `src/public/styles.css:199`:**
- Markup: `src/public/index.html:52` → `<h1>California&nbsp;<em>Cadet&nbsp;Corps</em></h1>`. The `&nbsp;` non-breaking spaces force "California" and "Cadet Corps" onto unbreakable runs.
- Style: `src/public/styles.css:199-206` → `.hero h1 { font-size: clamp(2.2rem, 7vw, 5rem); letter-spacing: 0.06em; ... }`. With a 2.2rem floor + letter-spacing and non-breaking words, "California" overflows the viewport horizontally on narrow phones (~320–360px), causing a horizontal scrollbar / clipped title.
- The `@media (max-width: 480px)` block (`src/public/styles.css:758-800`) styles `.hero`, `.hero-logo`, etc., but has **no `.hero h1` rule**, so the title is never shrunk for the smallest screens.

**3. Whole-site mobile pass:** existing breakpoints are `@media (max-width: 900px)` (nav collapse, `src/public/styles.css:687`), `600px` (`:720`), `480px` (`:758`), plus overflow safety for `code, strong, a` (`src/public/styles.css:802-805`). Coder must audit for any element causing horizontal overflow on small screens (long URLs/tokens, fixed widths, tables/timelines, wide rank/ribbon cards) and confirm no `overflow-x` scroll at 320/375/414px widths.

## Scope

- `src/public/index.html`
  - Replace both Rank Structure `href` values (lines ~189 and ~419) with exactly `https://cacadets.org/Cadet/Rank%20Structure?lang=en`. Update the visible link text at line ~189 from `cacadets.org/Cadet/Rank-Structure` to match (e.g. `cacadets.org/Cadet/Rank Structure`); footer text "Rank Structure" at line ~419 stays. Do not alter the `target`/`rel` attributes.
  - Hero title (line ~52): allow the title to wrap/shrink on narrow screens — remove or replace the `&nbsp;` non-breaking spaces with normal spaces (keep the `<em>` around "Cadet Corps"), so the title can break instead of overflowing.
- `src/public/styles.css`
  - Make `.hero h1` overflow-safe: lower the clamp floor and/or add `overflow-wrap: break-word` (and reduce `letter-spacing` if needed) so it never exceeds viewport width; add a `.hero h1` override inside the `@media (max-width: 480px)` block (around line 758) to step the font-size down for small phones.
  - Verify/adjust other rules as needed so there is no horizontal overflow at 320/375/414px (nav, hero, rank timeline, ribbon cards, footer links). Keep changes minimal and consistent with existing breakpoints (900/600/480px).
- `test/server.test.js`
  - Extend the existing `GET /` test (or add a focused test) to assert the served HTML contains the corrected URL `https://cacadets.org/Cadet/Rank%20Structure?lang=en` and no longer contains `cacadets.org/Cadet/Rank-Structure`. Keep the two existing tests passing. (Responsiveness is CSS/layout; verify it manually — automated DOM-width testing is out of scope given the zero-dependency test setup.)

Out of scope: `src/server.js`, deploy configs, CI workflows, the Ribbon Chart / Events / About links, and any non-mobile redesign. Do not add dependencies or external CDNs/fonts.

## Acceptance / DoD

- `npm run build` and `npm test` pass (CI green).
- Both Rank Structure links resolve to exactly `https://cacadets.org/Cadet/Rank%20Structure?lang=en`; the old `https://www.cacadets.org/Cadet/Rank-Structure` string no longer appears in `src/public/`.
- The hero title renders fully without horizontal overflow at 320px / 375px / 414px widths; the entire page has no `overflow-x` scrollbar at those widths.
- New/updated test covers the corrected URL; existing tests still pass.
- Contract followed: only the files in Scope are touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-L-rank-url-mobile-responsive.md (read it in full before editing).

Work on branch ws/rank-url-mobile-responsive in worktree cacc-ws-rank-url-mobile-responsive.

Scope to self-verify: (1) In src/public/index.html, change BOTH Rank Structure links (Ranks section ~line 189 and footer ~line 419) to href="https://cacadets.org/Cadet/Rank%20Structure?lang=en" — grep for "Cadet/Rank-Structure" to find them; update the visible text at the first one to match. (2) Make the site mobile-responsive with no horizontal overflow at 320/375/414px, including the hero title: in src/public/index.html line ~52 remove the &nbsp; non-breaking spaces in the <h1> so it can wrap, and in src/public/styles.css make .hero h1 overflow-safe (lower the clamp floor / add overflow-wrap, add a .hero h1 override in the @media (max-width: 480px) block). (3) Extend test/server.test.js to assert the served HTML contains the corrected URL and not the old "Cadet/Rank-Structure". Do not touch src/server.js, deploy configs, or CI.

Build green; the orchestrator handles commit/push/PR.
```
