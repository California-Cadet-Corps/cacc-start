# WS-BW — Align Cadet Events with cacadets.org

- Branch: ws/align-cadet-events
- PR title: [ws/align-cadet-events] WS-BW-align-cadet-events: reorder/relabel Cadet Events to match cacadets.org and link each event to its official page
- Depends on: none (builds on WS-AC events section, WS-Q info modals, WS-S correct-site-links, WS-BV language switcher — all already on main)

## Problem

Product owner, verbatim:

> Edit the Cadet Events to more closely align with the cacadets.org website with Summer Encampment being the first one. With XTC, Drill Competition, and Individual Major Awards (IMAs) being the next. Should I guess also highlight Wilderness Skills, Survival Training, and Marksmanship Competition as events. Each of these should link to the main site for more information after the modal popup.
>
> The full events calendar is not cacadets.org/Events its /Events/YTC

## Investigation

Everything is a static single-page site served from `src/public/`; there is no build step for content (Node `http` server in `src/server.js`).

- **Events grid** — `src/public/index.html:323-397`. The grid (`div.events-grid`) holds five `article.event-card` blocks at lines **335-373**, in this current order:
  1. Summer Encampment (`index.html:335-341`) — title `<a>` → `cacadets.org/Events/SummerCamp`, `data-modal="summer-encampment"`.
  2. Drill Competition (`343-349`) — `cacadets.org/Events/DrillCompetition`, `data-modal="drill-competition"`.
  3. **Grizzly Adventure / Summer Camp** (`351-357`) — `data-modal="grizzly-adventure"`. Not in the product owner's list → to be removed.
  4. Wilderness & Survival Training (`359-365`) — `cacadets.org/Events/WSC`, `data-modal="wilderness-survival"`.
  5. Marksmanship Competition (`367-373`) — links to `cacadets.org/Curriculum/MilSubjects`, `data-modal="marksmanship"`.
  - Each card is: `event-icon` span, `<h3><a href=… data-i18n=…>` title, `<p data-i18n=…>` body, `<span class="event-meta" data-i18n=…>`, and a `<button class="topic-btn" data-modal="…" data-i18n="event-learn-more">`.
- **Full events calendar reference** — `src/public/index.html:393-395`: `Full events calendar: <a href="https://www.cacadets.org/Events">cacadets.org/Events</a>` (this is the line the product owner is correcting to `/Events/YTC`). Text carried in i18n key `events-ref`. A second footer "Events" link exists at `index.html:510` (also `.../Events`).
- **Info modals** — `src/public/app.js:74-135` `MODAL_CONTENT` map. Event modals live at lines **105-134**: `summer-encampment`, `drill-competition`, `grizzly-adventure`, `wilderness-survival`, `marksmanship`. Each entry has `title`, `body`, `sourceHref`, `sourceLabel`. `openModal` (`app.js:146-159`) renders the modal and, at line **152**, injects `Source: <a href=sourceHref>sourceLabel</a>` at the bottom — **this is the "link to the main site for more information after the modal popup"** the requirement asks for. Today every event `sourceHref` is generic (`/Events` or `/Curriculum/MilSubjects`); each must point to that event's specific official page. Modal content is English-only (not translated).
- **i18n** — `src/public/i18n/translations.js` has four language dicts: `en` (line 6), `es` (124), `zh` (242), `de` (360). Event keys per language: `event-summer-*`, `event-drill-*`, `event-grizzly-*`, `event-wilderness-*`, `event-marksmanship-*`, plus `events-ref`. `src/public/i18n/i18n.js:32-33` applies a key **only if it exists** in the active dict (`if (dict[key] !== undefined) el.innerHTML = dict[key]`) — otherwise the hardcoded English in `index.html` stays. So any NEW event key (XTC, IMAs, Survival Training) must be added to **all four** dicts, or non-English pages fall back to English for those cards.
- **Tests** — `test/server.test.js:200-211` asserts the disclaimer plus the three URLs `Events/SummerCamp`, `Events/DrillCompetition`, `Events/WSC`. `test/server.test.js:160-166` asserts a `data-modal` button exists. These must keep passing (the three URLs above are all retained by this WS).

Target event set and order (per requirement): **Summer Encampment → XTC → Drill Competition → Individual Major Awards (IMAs) → Wilderness Skills → Survival Training → Marksmanship Competition** (7 cards; Grizzly Adventure removed; the combined "Wilderness & Survival Training" card is split into two).

## Scope

**URL policy (important):** Do NOT invent broken links. Use the `https://cacadets.org/Events/<Code>` pattern the site uses. Confirmed pages already in the repo: `Events/SummerCamp`, `Events/DrillCompetition`, `Events/WSC` (Wilderness Skills Course). For events whose dedicated page you cannot confirm (XTC, IMAs, Survival Training, Marksmanship), use the best-matching official page; if none can be confirmed, link to the master calendar `https://cacadets.org/Events/YTC` rather than guess a 404. Prefer, in order of confidence: SummerCamp→`/Events/SummerCamp`, Wilderness Skills→`/Events/WSC`, Drill Competition→`/Events/DrillCompetition`; XTC→`/Events/XTC`; IMAs→`/Events/IMA`; Survival Training→`/Events/WSC` or `/Events/YTC`; Marksmanship→`/Events/YTC` (move off `/Curriculum/MilSubjects`).

- **`src/public/index.html` (events grid, lines 335-373):** Rebuild the seven cards in the order above.
  - Card title `<a href>` links to that event's official page (per URL policy) with the existing `target="_blank" rel="noopener noreferrer"` and a `data-i18n` title key.
  - Keep each card's `event-icon`, body `<p>`, `event-meta` span, and a `Learn more` button (`data-i18n="event-learn-more"`) with a `data-modal` key matching a new/updated `MODAL_CONTENT` entry.
  - Remove the Grizzly Adventure card entirely.
  - New/renamed `data-i18n` keys to introduce: `event-xtc-title`/`-body`/`-meta`, `event-ima-title`/`-body`/`-meta`, `event-wilderness-title`/`-body`/`-meta` (retitle to "Wilderness Skills"), `event-survival-title`/`-body`/`-meta`. Reuse `event-summer-*`, `event-drill-*`, `event-marksmanship-*`. New `data-modal` keys: `xtc`, `individual-major-awards`, `wilderness-skills`, `survival-training` (and keep `summer-encampment`, `drill-competition`, `marksmanship`).
- **`src/public/index.html:394`** (and footer link `:510` for consistency): change the full-events-calendar href/text from `.../Events` to `https://cacadets.org/Events/YTC` (display `cacadets.org/Events/YTC`).
- **`src/public/app.js` (`MODAL_CONTENT`, lines 105-134):** remove `grizzly-adventure`; add `xtc`, `individual-major-awards`, `survival-training`; rename `wilderness-survival` → `wilderness-skills`; keep `summer-encampment`, `drill-competition`, `marksmanship`. Each entry's `sourceHref` must be that event's specific official page (per URL policy) and `sourceLabel` a readable label (e.g. `cacadets.org — Events`). Keys must match the card `data-modal` values exactly.
- **`src/public/i18n/translations.js`:** in all four dicts (`en`/`es`/`zh`/`de`): remove `event-grizzly-*`; add `event-xtc-*`, `event-ima-*`, `event-survival-*`; update `event-wilderness-title` to "Wilderness Skills" (localized); change `events-ref` to point at `/Events/YTC` in every language. Provide translated strings for es/zh/de where sensible; English is the fallback if a key is omitted, but prefer full coverage to match the language-switcher direction (WS-BV).
- **`test/server.test.js` (lines 200-211):** update the events test to reflect the new set — keep the `SummerCamp`/`DrillCompetition`/`WSC` and disclaimer assertions, and add assertions that the served HTML contains the new events (e.g. `XTC`, `Individual Major Awards`/`IMA`, `Survival Training`) and that the full calendar link now contains `Events/YTC`. Do not assert on invented URLs — assert on titles for events whose URL is uncertain.

## Acceptance / DoD

- `npm test` passes (existing suite + updated events test); `npm run` build/lint (if any) stays green.
- The rendered `/` Cadet Events grid shows exactly seven cards in the order: Summer Encampment, XTC, Drill Competition, Individual Major Awards (IMAs), Wilderness Skills, Survival Training, Marksmanship Competition. No Grizzly Adventure card remains.
- Each event card title links to a cacadets.org page, and each event's modal (opened via "Learn more") shows a "Source:" link to that event's official page — no fabricated/404 URLs (uncertain ones fall back to `/Events/YTC`).
- The "Full events calendar" reference points to `https://cacadets.org/Events/YTC`.
- Switching language (en/es/zh/de) translates the event cards; new keys exist in all four dicts (or fall back cleanly to English with no empty text).
- `Events NOT guaranteed` disclaimer still present and italicized; `data-modal` buttons still present.
- Contract followed; no unrelated files touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-BW-align-cadet-events.md
Work on branch ws/align-cadet-events in worktree cacc-ws-align-cadet-events.

Scope: Rework the "Cadet Events" section of the static landing site to match cacadets.org. In src/public/index.html rebuild the events grid (currently lines 335-373) as seven cards in this order — Summer Encampment, XTC, Drill Competition, Individual Major Awards (IMAs), Wilderness Skills, Survival Training, Marksmanship Competition — removing the Grizzly Adventure card and splitting the old "Wilderness & Survival Training" card into two; each card title links to that event's official cacadets.org page and its "Learn more" modal (MODAL_CONTENT in src/public/app.js, lines 105-134) must carry a sourceHref to that same specific page (the modal already renders it as a "Source:" link). Add/rename the matching data-i18n and data-modal keys, add the new event keys to all four language dicts in src/public/i18n/translations.js (en/es/zh/de), change the "Full events calendar" reference to https://cacadets.org/Events/YTC, and update test/server.test.js (lines 200-211) accordingly.

Do not invent broken URLs: keep the confirmed SummerCamp/DrillCompetition/WSC links, use the /Events/<Code> pattern for the rest, and fall back to /Events/YTC when a dedicated page can't be confirmed.

Self-verify: seven cards in the required order, Grizzly gone, every modal links to the main site, calendar points to /Events/YTC, language switcher still translates the cards, and npm test passes.

Build green; the orchestrator handles commit/push/PR.
```
