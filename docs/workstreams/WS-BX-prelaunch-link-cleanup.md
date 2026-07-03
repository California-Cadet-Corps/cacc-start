# WS-BX — Pre-launch link/button cleanup (buttons, drop "What You'll Do", main-site CTA)

- Branch: ws/prelaunch-link-cleanup
- PR title: [ws/prelaunch-link-cleanup] WS-BX-prelaunch-link-cleanup: buttonize CTA links, remove low-value sections, add main-site CTA
- Depends on: none (touches sections landed by earlier WS but no unmerged deps)

## Problem

Product owner, verbatim:

> A few more changes that I need to make prior to making this actually go live to clean things up properly. Um... I want to make sure every plain text link button is a button and not just like some plain text on the screen. Um... The what you'll do it in the event area is not really helpful. That entire section can probably be removed. Just the what you'll do it in the event area. Um... The quick links bar at the bottom can completely be removed because there's like duplicate of all that shit. And that's from the main website. Um... Maybe replace that entire section at the bottom with if you want more information go to our main site with a big button to direct to the main website.

## Investigation

All work is in `src/public/` (static site served by `src/server.js`). Line numbers below are current `main`.

1. **Plain-text link that should be a button.** `src/public/index.html:317-319` — a standalone call-to-action link "California Cadet Corps Full Ribbon Chart" rendered as bare text inside `<p class="ribbon-ref">` (key `ribbon-chart-link`). It is a destination link, not inline prose, so it should read as a button.
   - Existing button styling to reuse: `.cta-btn` at `src/public/styles.css:283-301` (solid gold pill) and `.cta-btn-ghost` at `:272-281`. The hero already uses these at `index.html:102-103`.
   - Do NOT buttonize inline prose reference links (`index.html:235`, `:313`, `:394`, `:517`) or nav links (`:60-65`) or the `<h3><a>` event-card title links (`:337,345,353,361,369`) — those are headings/inline text by design, not buttons. The Ribbon Chart href must stay exactly `https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en` (asserted by `test/server.test.js:140-145`).

2. **"What You'll Do at an Event" block.** `src/public/index.html:379-391` — the `<div class="at-event">` containing `<h3 data-i18n="at-event-title">` and the `<ul class="at-event-list">` with 8 `<li>` items (keys `at-event-title`, `at-event-drill`, `at-event-pt`, `at-event-knowledge`, `at-event-bivouac`, `at-event-obstacle`, `at-event-lrc`, `at-event-compass`, `at-event-est`). Owner wants only this block removed — keep the rest of the Events section (`#events`), the event cards, the `events-disclaimer` at `:377`, and the `events-ref` at `:393-395`.
   - CSS for the removed block: `.at-event` and `.at-event-list*` at `styles.css:626-673` and responsive overrides at `:820-825` and `:853-857` become dead rules.

3. **"Quick Links" section at the bottom.** `src/public/index.html:463-489` — `<section id="official-links">`. Its `<nav>` "Quick Links" list (`:468-479`) duplicates links to the main site (cacadets.org). Keys: `official-links-label`, `official-links-title`, `link-official-home`, `link-how-to-join`, `link-about-cacc`, `link-curriculum`, `link-events-summer`, `link-documents`, `link-resources`, `link-contact`. The same section also holds a `social-label` + social-media follow list (`:480-487`, Facebook/Instagram/YouTube/LinkedIn) which is NOT duplicated content.
   - The small disclaimer `<footer class="site-footer">` at `:504-521` is a separate element — leave it as-is.

4. **i18n parity is enforced.** `test/i18n.test.js:49-` requires every `data-i18n` key in `index.html` to exist in all four locales, AND every key present in `en` to exist in `es`, `zh`, `de`. Locales in `src/public/i18n/translations.js`: `en` (line 6), `es` (124), `zh` (242), `de` (360). Any new key MUST be added to all four; any key removed from `en` MUST be removed from all four.

## Scope

- `src/public/index.html`
  - **Buttonize the Ribbon Chart link** (`:317-319`): give the `<a data-i18n="ribbon-chart-link">` a button class (`class="cta-btn cta-btn-ghost"` or `class="cta-btn"`), keeping the exact href, `target`, `rel`, and `data-i18n`. Center/space it consistently with other CTAs.
  - **Remove the "What You'll Do at an Event" block** (`<div class="at-event">…</div>`, `:379-391`) entirely. Leave `events-disclaimer` and `events-ref` intact.
  - **Replace the `#official-links` "Quick Links" content** (`:463-489`): remove the `official-links-title` "Quick Links" heading and the entire `<nav>` duplicate-link list. In its place add a short lead line ("If you want more information, visit our main site") and a **big prominent button** linking to `https://cacadets.org/` (`target="_blank" rel="noopener noreferrer"`), reusing `.cta-btn` (optionally a larger variant). Keep the social-media "Follow" block (`social-label` + Facebook/Instagram/YouTube/LinkedIn) below the new CTA. Use a new `data-i18n` key for the lead and the button label (e.g. `main-site-lead`, `main-site-btn`); the `official-links-label` key may be reused or replaced.
- `src/public/i18n/translations.js`
  - Add the new key(s) (`main-site-lead`, `main-site-btn`, and any replacement for the section heading) to **all four** locales (`en`, `es`, `zh`, `de`) with appropriate translations.
  - Remove the now-unused keys from **all four** locales for cleanliness: `at-event-*` (8 keys), and the removed Quick Links keys (`official-links-title` and the `link-*` set, plus `official-links-label`/`link-resources`/`link-contact` etc.) — but only keys no longer referenced by any `data-i18n` in the final HTML. Removal is optional but, if done, MUST be symmetric across all four locales to keep parity tests green. Keep `social-label` if the social block is retained.
- `src/public/styles.css`
  - Remove the now-dead `.at-event` / `.at-event-list` rules (`:626-673`, `:820-825`, `:853-857`).
  - Add styling for the "big" main-site button if a larger variant is introduced (e.g. `.cta-btn-lg`); otherwise reuse `.cta-btn`.

### Interpretation notes (for reviewer)
- "Quick links bar at the bottom" = the `#official-links` **Quick Links** nav list (the `<footer class="site-footer">` disclaimer is separate and stays).
- Social-media follow links are preserved because they are not duplicates of main-site quick links; the owner's "duplicate" concern targets the cacadets.org link list. If the owner truly wants the whole section gone, the social block can also be removed — flag in PR description.

## Acceptance / DoD

- `npm test` passes (i18n key parity across all four locales; `server.test.js` Ribbon Chart URL assertion still passes).
- `npm run lint` passes.
- No plain-text standalone CTA link remains where a button is expected: the "Full Ribbon Chart" link renders as a button.
- The `<div class="at-event">` "What You'll Do at an Event" block is gone; the rest of the Events section is unchanged.
- The duplicate "Quick Links" nav list is gone and replaced by a single prominent big button linking to `https://cacadets.org/` with an intro line; social follow links preserved.
- No orphaned `data-i18n` keys referenced in HTML but missing from any locale, and no `en`-only keys.
- No dead CSS left for removed blocks; page renders cleanly in EN/ES/ZH/DE.
- Contract followed; changes limited to `src/public/index.html`, `src/public/i18n/translations.js`, `src/public/styles.css`.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS file at docs/workstreams/WS-BX-prelaunch-link-cleanup.md and implement it exactly.
Branch: ws/prelaunch-link-cleanup   Worktree: cacc-ws-prelaunch-link-cleanup

Scope (self-verify against the WS): In src/public/index.html — (1) turn the standalone
"California Cadet Corps Full Ribbon Chart" text link (data-i18n="ribbon-chart-link", ~line 318)
into a button using the existing .cta-btn styles while keeping its exact href/target/rel;
(2) delete the <div class="at-event"> "What You'll Do at an Event" block (~lines 379-391) only,
leaving the rest of the Events section intact; (3) replace the #official-links "Quick Links"
nav list (~lines 463-489) with a short intro line and one big button linking to
https://cacadets.org/, keeping the social-media follow links. Add any new data-i18n keys to ALL
FOUR locales in src/public/i18n/translations.js (en/es/zh/de) and, if you remove now-unused keys,
remove them from all four; then drop dead .at-event CSS in src/public/styles.css.

Run `npm test` and `npm run lint` — both must be green. The Ribbon Chart href must stay exactly
https://www.cacadets.org/Cadet/Ribbon%20Chart?lang=en.

Build green; the orchestrator handles commit/push/PR.
```
