# WS-BZ — Fix mobile top-nav overflow / horizontal scroll

- Branch: ws/mobile-nav-viewport-overflow
- PR title: [ws/mobile-nav-viewport-overflow] WS-BZ-mobile-nav-viewport-overflow: keep top-right nav controls inside the mobile viewport
- Depends on: none

## Problem

Product owner, verbatim:

> Some of the elements on the top right like the English translator and the hamburger menu are hanging off the right side of the menu And it's allowing people to horizontally scroll everything should be within one viewport and mobile

## Root cause / Investigation

The sticky top bar is a single non-wrapping flex row whose contents are wider
than a narrow phone viewport, and nothing clips the overflow — so the language
control and hamburger spill past the right edge and the whole page scrolls
horizontally.

- `src/public/styles.css:83-97` — `.site-nav` is `display:flex` with the default
  `flex-wrap:nowrap`, `justify-content:space-between`, `padding:0 2rem`, `gap:1rem`.
- `src/public/styles.css:99-106` — `.nav-brand` has `flex-shrink:0`, so it never
  gives up width.
- `src/public/styles.css:114-120` — `.nav-brand span` ("California Cadet Corps")
  is `white-space:nowrap`; duplicated inline at `src/public/index.html:27`.
- `src/public/styles.css:725-755` — the `@media (max-width:900px)` block hides
  `.nav-links` (dropdown) and shows `.nav-toggle`, but keeps `.site-nav`
  `flex-wrap:nowrap` (line 748). The row now holds: `.nav-brand` (unshrinkable,
  nowrap) + `.qr-btn` (`flex-shrink:0`, `styles.css:948-963`) + `#lang-switcher`
  (`index.html:82-88`, styled `index.html:34`) + `.nav-toggle` hamburger
  (`index.html:90-96`). Their combined intrinsic width exceeds ~360–414px phones,
  and because the brand can't shrink or wrap, `#lang-switcher` and `.nav-toggle`
  hang off the right edge.
- `src/public/styles.css:29-31` (`html`) and `44-50` (`body`) set no
  `overflow-x`/`max-width` guard, so the overflow becomes a page-wide horizontal
  scroll instead of being contained.
- Secondary crowding: a separate fixed translator button `#lang-toggle`
  (`index.html:33` style, `index.html:50` markup) is pinned at `top:1rem;
  right:1rem`, adding a second "English/Español" control to the top-right cluster.

## Scope (file-by-file)

- `src/public/styles.css`
  - `html`/`body` (lines 29-31 / 44-50): add a document-level guard so nothing can
    force horizontal scroll — `overflow-x: hidden;` and `max-width: 100%` (or
    `width:100%`). Keep vertical scroll intact.
  - `@media (max-width:900px)` block (lines 725-755): tighten the top bar so all
    controls fit — reduce `.site-nav` `gap`/`padding`, let `.nav-brand` shrink
    (`min-width:0; flex-shrink:1;`) and let its wordmark truncate with ellipsis
    (`overflow:hidden; text-overflow:ellipsis;`) or hide the `.nav-brand span`
    text on the narrowest screens while keeping the logo. Ensure `.qr-btn`,
    `#lang-switcher`, `.nav-toggle` remain fully within the viewport.
  - `@media (max-width:480px)` block (lines 788-814): apply the smallest-screen
    treatment (e.g. hide brand wordmark text, minimal nav padding) so the row
    fits at ~360px.
- `src/public/index.html`
  - Inline `#lang-switcher`/`#lang-toggle` styles (lines 33-34): trim padding/size
    on mobile if needed so the translator control does not extend past the right
    edge; ensure the fixed `#lang-toggle` (line 33/50) does not overlap or crowd
    the nav controls (align it into the safe area or hide it where the in-nav
    `#lang-switcher` already covers translation). Do not remove translation
    functionality — both controls must keep working per `src/public/i18n.js`.
  - Inline `.nav-brand-name` rule (line 27): keep consistent with the CSS change
    (truncate/hide) so desktop is unaffected.

Do not alter desktop layout (≥901px) behavior, the language logic in
`src/public/i18n.js`, or the nav dropdown toggle in `src/public/app.js`.

## Acceptance / DoD

- At 320px, 360px, 390px, and 414px widths the page has **no horizontal scroll**
  and every top-bar control (logo/brand, QR, language selector, hamburger) is
  fully visible within one viewport width.
- Tapping the hamburger still opens/closes the nav dropdown; the language
  selector still switches languages (en/es/zh/de).
- Desktop (≥901px) top bar is visually unchanged.
- `npm run lint` and `npm test` pass (`node --test`; existing
  `test/i18n.test.js`, `test/server.test.js` stay green).
- Contract followed; no unrelated files touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-BZ-mobile-nav-viewport-overflow.md

Branch: ws/mobile-nav-viewport-overflow
Worktree: cacc-ws-mobile-nav-viewport-overflow

Scope: On mobile the sticky top nav is a non-wrapping flex row (src/public/styles.css:83-97,
media blocks at 725-755 and 788-814) whose unshrinkable brand wordmark plus QR button,
language selector, and hamburger exceed narrow viewport widths, and html/body have no
overflow-x guard — so the language control and hamburger hang off the right and the page
scrolls horizontally. Add an overflow-x/width guard to html+body, and in the mobile media
queries let the brand shrink/truncate (or hide its wordmark) and tighten nav gap/padding so
every top-right control fits inside one viewport at 320–414px; keep the fixed #lang-toggle
(src/public/index.html:33/50) from crowding the right edge without breaking translation
(src/public/i18n.js). Leave desktop (≥901px), app.js nav toggle, and i18n logic unchanged.
Self-verify: no horizontal scroll and all controls visible at 320/360/390/414px, hamburger and
language switch still work.

Build green; the orchestrator handles commit/push/PR.
```
