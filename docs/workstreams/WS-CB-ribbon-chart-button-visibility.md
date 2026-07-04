# WS-CB — Ribbon chart button legibility + centered reference text

- Branch: ws/ribbon-chart-button-visibility
- PR title: [ws/ribbon-chart-button-visibility] WS-CB-ribbon-chart-button-visibility: legible ribbon chart button + centered reference text
- Depends on: (none)

## Problem

Product owner, verbatim:

> The ribbon chart button can't see the text until you mouseover, the text is inviisible. The text at the bottom for "Want more information" (the text below it) is not centered properly.

## Root cause / Investigation

Both complaints are in the **Ribbons** section of the landing page,
`src/public/index.html`, at the bottom of the section (the ribbon-chart
call-to-action the owner calls "the ribbon chart button" and "Want more
information").

The relevant markup is the two `.ribbon-ref` paragraphs that close the section:

- `src/public/index.html:312-316` — the "Full ribbon criteria: … CR 1-1 …"
  reference paragraph.
- `src/public/index.html:317-319` — the **ribbon chart button**: a bare inline
  anchor labelled "California Cadet Corps Full Ribbon Chart" pointing at
  `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`.

Styling that drives the two bugs lives in `src/public/styles.css`:

1. **"Text invisible until you mouseover."** The ribbon chart link is only styled
   by `.ribbon-ref a { color: var(--gold); }` (`src/public/styles.css:567-569`).
   It has **no button affordance and no resting-state contrast/emphasis** — it is
   a plain inline link nested inside the muted `.ribbon-ref` paragraph
   (`color: var(--text-dim)`, `src/public/styles.css:561-565`). Rendered as a
   "button" it reads as illegible/blended at rest and only stands out once the
   cursor lands on it. There is no `.ribbon-ref a:hover` rule, so the resting
   state must be fixed to be legible on its own — it cannot rely on hover.
2. **"Not centered properly."** `.ribbon-ref` (`src/public/styles.css:561-565`)
   has **no `text-align`**, so both bottom paragraphs and the chart button inherit
   the section's left alignment and sit left-justified rather than centered under
   the ribbons, which is what the owner expects.

No JS is involved (`src/public/app.js` only handles nav/reveal/modals). The
existing tests (`test/server.test.js`) only assert the ribbon chart **URL** and
the `ribbon-grid`/`ribbon-card` structure — none assert the button styling or
alignment, so this change is additive to the test surface.

## Scope

- `src/public/styles.css`
  - Give the ribbon chart button a clearly-visible resting state modelled on the
    site's existing ghost CTA (`.cta-btn-ghost`, `src/public/styles.css:272-281`):
    an `inline-block` with a visible gold border, gold **legible-at-rest** text,
    padding/radius consistent with `.topic-btn`, and a hover state that only
    changes emphasis (e.g. filled gold background + `var(--navy-dark)` text) — the
    label must be readable **before** hover.
  - Center the bottom reference block: add `text-align: center;` to `.ribbon-ref`
    (`src/public/styles.css:561-565`) so both closing paragraphs and the button
    center under the ribbons section.
- `src/public/index.html`
  - Add a distinguishing class (e.g. `ribbon-chart-btn`) to the existing anchor at
    `src/public/index.html:317-319` so the new button style targets it. Keep the
    exact `href` (`https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en`, `%20`
    preserved), `target="_blank"`, `rel="noopener noreferrer"`, and the
    `data-i18n="ribbon-chart-link"` attribute unchanged.
- `test/server.test.js`
  - Add a test asserting the served CSS gives `.ribbon-ref` a `text-align: center`
    rule and that the chart-button selector is present, locking both fixes. Keep
    the existing ribbon URL/structure assertions passing.

Do not change the ribbon card grid, the translation strings, the URL, or any
other section.

## Acceptance / DoD

- `npm run build` and `npm test` pass.
- On the rendered page, the "California Cadet Corps Full Ribbon Chart" button
  label is legible at rest (before any mouseover) with clear button affordance.
- The bottom ribbon reference paragraphs and the chart button are centered under
  the ribbons section.
- The ribbon chart `href` remains exactly
  `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` (existing URL test still
  passes); `target`/`rel`/`data-i18n` unchanged.
- Contract followed: only `src/public/styles.css`, `src/public/index.html`, and
  `test/server.test.js` change. New test covers the styling contract.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first, in full, before editing:
docs/workstreams/WS-CB-ribbon-chart-button-visibility.md

Branch: ws/ribbon-chart-button-visibility
Worktree: cacc-ws-ribbon-chart-button-visibility

Scope: In the Ribbons section of src/public/index.html, the "California Cadet
Corps Full Ribbon Chart" link (index.html:317-319) reads as invisible until
hover and its bottom reference text is left-aligned instead of centered. Give
that anchor a distinguishing class and style it in src/public/styles.css as a
clearly-visible button (legible gold text + visible border at rest, filled on
hover — never relying on hover to reveal the label), and add text-align: center
to .ribbon-ref (styles.css:561-565) so the closing text and button center under
the section. Keep the href (%20 preserved), target, rel, and data-i18n
unchanged; add a test/server.test.js assertion locking the centering + button
selector. Change only those three files.

Build green; the orchestrator handles commit/push/PR.
```
