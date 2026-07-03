# WS-BY — Buttonize links, drop "What You'll Do at an Event" & Quick Links (main-site CTA)

- Branch: ws/link-buttons-and-section-cleanup
- PR title: [ws/link-buttons-and-section-cleanup] WS-BY-link-buttons-and-section-cleanup: buttonize link CTAs, remove low-value sections, add main-site CTA
- Depends on: none

## Problem

Product owner (verbatim):

> A few more changes that I need to make prior to making this actually go live to clean things up properly. Um... I want to make sure every plain text link button is a button and not just like some plain text on the screen. Um... The what you'll do it in the event area is not really helpful. That entire section can probably be removed. Just the what you'll do it in the event area. Um... The quick links bar at the bottom can completely be removed because there's like duplicate of all that shit. And that's from the main website. Um... Maybe replace that entire section at the bottom with if you want more information go to our main site with a big button to direct to the main website.

## Investigation

Single-page site; the landing page is `src/public/index.html`, styled by `src/public/styles.css`, translated by `src/public/i18n/translations.js` (en/es/zh/de). There are four independent asks:

1. **"Every plain text link button is a button, not plain text."** The site already has proper button styles: `.cta-btn` / `.cta-btn-ghost` (`styles.css:283`, `:272`) and `.topic-btn` (`styles.css:881`). The one standalone call-to-action link that renders as flat inline text is the **Full Ribbon Chart** link — `src/public/index.html:317-319` (`<p class="ribbon-ref"><a ... data-i18n="ribbon-chart-link">California Cadet Corps Full Ribbon Chart</a></p>`), styled only by `.ribbon-ref a { color: var(--gold); }` (`styles.css:567`). It reads as a line of text, not a button. Event-card titles (`.event-card h3 a`, `index.html:29-30`, `:337` etc.) are gold heading links and each card already carries a proper `.topic-btn` "Learn more" button, so they are acceptable as-is. Inline citation links inside sentences (rank-ref/ribbons-ref/events-ref) are contextual references, not buttons, and keep their gold link styling.

2. **"What You'll Do at an Event" section is not helpful — remove it.** This is the `.at-event` block at `src/public/index.html:379-391` (heading `at-event-title` + `<ul class="at-event-list">` with items `at-event-drill/pt/knowledge/bivouac/obstacle/lrc/compass/est`). CSS for it: `styles.css:626-664` plus responsive rules at `styles.css:820` and `:853`. i18n keys `at-event-*` appear in all four languages in `translations.js` (en `:83-91`, es `:202-210`, zh `:320-328`, de `:438-446`).

3 + 4. **"Quick Links bar at the bottom" duplicates the main site — remove and replace with a big main-site button.** This is the `#official-links` section at `src/public/index.html:463-489` (title literally "Quick Links", `official-links-title`), containing the duplicate link list (`link-official-home`, `link-how-to-join`, `link-about-cacc`, `link-curriculum`, `link-events-summer`, `link-documents`, `link-resources`, `link-contact`) and the social row (`social-label` + Facebook/Instagram/YouTube/LinkedIn). Replace the entire section with a short "want more information → go to our main site" blurb and one big button linking to `https://cacadets.org/`.

### Test constraints the coder MUST satisfy

- `test/server.test.js:127-138` (`contains official cacadets.org links and no bare placeholder href`) asserts BOTH `href="https://cacadets.org/"` AND `href="https://cacadets.org/Commandant/HowtoJoin"`. The `HowtoJoin` link lives ONLY in the section being removed (`index.html:471`), so this assertion will break. The new big button must use the exact URL `https://cacadets.org/` (with trailing slash) to keep the first assertion green, and the coder MUST update/remove the `HowtoJoin` assertion in this test.
- `test/i18n.test.js` enforces symmetric i18n coverage: every `data-i18n` key in `index.html` must exist in all four langs, and no language may hold a key `en` lacks. So removed keys must be deleted from en/es/zh/de, and any new key added to all four.
- Keep passing: events disclaimer (`server.test.js:200-212`, `events-disclaimer` at `index.html:377` stays), Ribbon Chart URL test (`:140-148`), Rank Structure URL test (`:82-90`), `no href="#"` / no `example.com` (`:135-136`). The site-footer (`index.html:504-521`) and its `footer-*` keys stay untouched.

## Scope

- `src/public/index.html`
  - **Change 1:** give the standalone Full Ribbon Chart link (`:317-319`) a button appearance — add class `cta-btn` (or `cta-btn cta-btn-ghost`) to the `<a>` so it renders as a button, not flat text. Keep `href`, `target`, `rel`, and `data-i18n="ribbon-chart-link"` unchanged (Ribbon Chart URL test must still match).
  - **Change 2:** delete the entire `.at-event` block (`:379-391`). Leave the events disclaimer (`:377`) and events-ref (`:393-395`) intact.
  - **Change 3+4:** replace the whole `#official-links` section (`:463-489`) with a new compact section (e.g. `id="more-info"`, `class="section section-alt"`) containing a short `data-i18n` blurb ("If you want more information, visit our official site") and one big button `<a class="cta-btn cta-btn-lg" href="https://cacadets.org/" ... data-i18n="more-info-btn">`. Do NOT reintroduce a `HowtoJoin` link.
- `src/public/styles.css`
  - Add a `.cta-btn-lg` modifier (larger padding/font) for the big main-site button.
  - Remove now-dead `.at-event`, `.at-event h3`, `.at-event-list`, `.at-event-list li`, `.at-event-list li::before` rules (`:626-664`) and their responsive references (`:820`, `:853`). Do NOT remove `.footer-links` (still used by the site-footer).
- `src/public/i18n/translations.js`
  - Remove `at-event-*` keys and the `#official-links` keys (`official-links-label`, `official-links-title`, `link-official-home`, `link-how-to-join`, `link-about-cacc`, `link-curriculum`, `link-events-summer`, `link-documents`, `link-resources`, `link-contact`, `social-label`) from ALL FOUR languages (en/es/zh/de).
  - Add the new `more-info-*` key(s) used by the replacement section to ALL FOUR languages. Keep `footer-*` and `ribbon-chart-link` keys.
- `test/server.test.js`
  - Update the test at `:127-138`: drop the `href="https://cacadets.org/Commandant/HowtoJoin"` assertion (that link is intentionally removed); keep the `href="https://cacadets.org/"` and no-placeholder/no-example.com assertions.
  - Add coverage for the new state: assert the removed content is gone (e.g. `doesNotMatch` for "Quick Links" / "What You'?ll Do at an Event") and that the big main-site button to `https://cacadets.org/` is present.

## Acceptance / DoD

- `npm run build` and `npm test` pass (both i18n parity tests and server tests green).
- No standalone actionable link renders as flat body text; the Full Ribbon Chart link is visibly a button.
- The `.at-event` "What You'll Do at an Event" block is gone; events disclaimer and events-ref remain.
- The `#official-links` "Quick Links" section (links + social) is gone, replaced by a single big button linking to `https://cacadets.org/` with a short "more information" blurb.
- All removed i18n keys are deleted from en/es/zh/de; any new keys exist in all four; language switching still works with no missing-key errors.
- `test/server.test.js` no longer asserts the removed HowtoJoin link and adds coverage for the new section; the contract-relevant existing assertions still pass.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-BY-link-buttons-and-section-cleanup.md.

Work on branch ws/link-buttons-and-section-cleanup in worktree cacc-ws-link-buttons-and-section-cleanup.

Scope: (1) make the standalone "Full Ribbon Chart" link in src/public/index.html render as a button (add cta-btn styling; keep its href/rel/data-i18n so the Ribbon Chart URL test still matches); (2) delete the ".at-event" ("What You'll Do at an Event") block; (3) remove the "#official-links" Quick Links + social section and replace it with a short blurb plus one big button linking to https://cacadets.org/ (exact trailing slash). Then sync i18n (remove at-event-* and official-links/link-*/social-label keys from all four languages en/es/zh/de, add the new more-info key(s) to all four), remove dead .at-event CSS, add a .cta-btn-lg style, and update test/server.test.js — drop the removed Commandant/HowtoJoin assertion and add coverage that the removed sections are gone and the new main-site button is present.

Self-verify: npm run build and npm test must be green (i18n key parity is enforced), the two removed sections must be absent, and the new big button must link to https://cacadets.org/.

Build green; the orchestrator handles commit/push/PR.
```
