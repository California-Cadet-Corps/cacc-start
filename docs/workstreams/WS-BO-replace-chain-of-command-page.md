# WS-BO — Replace Chain of Command page content

- Branch: ws/replace-chain-of-command-page
- PR title: [ws/replace-chain-of-command-page] WS-BO-replace-chain-of-command-page: replace chain-of-command.html with owner-supplied markup
- Depends on: (none)

## Problem

Quoting the product owner verbatim:

> replace the chain of command page code from request 38 to
> ```html
> <!DOCTYPE html>
> <html lang="en">
> <head>
> <meta charset="UTF-8">
> <meta name="viewport" content="width=device-width, initial-scale=1.0">
> <title>Chain of Command</title>
> ... (full styled "Chain of Command" page: gradient body, header with CACC
> logo linking to https://start.cacadets.org/, subtitle "California Cadet
> Brigade Structure", a vertical stack of role cards from "Squad Leader" up
> through "Governor of California" / "Gavin Newsom" separated by .chain-line
> dividers, and a footer reading
> "California Cadet Brigade • Leadership • Duty • Honor") ...
> </html>
> ```

The full, authoritative HTML to use is reproduced byte-for-byte in the
**Source HTML (authoritative)** section at the end of this contract. The coder
MUST overwrite the existing page with that block exactly — no edits, no
reformatting, no added comments.

"Request 38" refers to the prior task that introduced this page; its current
form was last shipped via WS-BG (PR #47, `ws/chain-of-command-page`) and lives
at `src/public/chain-of-command.html` on `main`. This requirement replaces that
file's contents wholesale.

## Root cause / Investigation

This is a content-replacement request, not a bug. The page already exists; the
owner wants its full contents swapped for the supplied markup.

- `src/public/chain-of-command.html` (exists on `main`, ~320 lines) — the
  current Chain of Command page. It differs from the requested markup in
  several ways the owner is deliberately overriding: subtitle "California Cadet
  Corps Structure" → "California Cadet Brigade Structure"; real officer names
  (e.g. "Colonel Michael J. Smith", "Brigadier General Peter B. Cross", "Major
  General Matthew P. Beevers") → generic role placeholders; "10th Corps" →
  "10th Brigade"; the brigade-tier card order is rearranged and a
  "10th Brigade …" tier is added; footer "California Cadet Corps • …" →
  "California Cadet Brigade • …"; the `/* FINAL CUSTOM GRADIENT */` CSS comment
  is dropped. These are intentional per the verbatim spec — reproduce the
  supplied HTML exactly rather than preserving the current values.
- `src/server.js:25-52` — zero-dependency static file server. Any path maps to a
  file under `PUBLIC_DIR` (`src/server.js:12`); `*.html` is served as
  `text/html` (MIME table `src/server.js:15-23`). No router/server change is
  needed — overwriting the file republishes it at `/chain-of-command.html`.
- `src/public/index.html:45` — nav links to `/chain-of-command.html`. The
  filename is unchanged, so the link keeps working; no index.html edit needed.
- `src/public/app.js` and `src/public/i18n.js` contain **no** references to the
  chain-of-command page (`grep "chain"` returns nothing in either). The page is
  standalone — no i18n hooks, no script includes — and the supplied markup is
  likewise standalone. No i18n/app.js changes.
- `test/server.test.js:256-264` — existing test asserts
  `GET /chain-of-command.html` returns `200` and the body matches
  `/Chain of Command/`. The new markup still has `<title>Chain of Command</title>`
  and the `<h1>Chain of Command</h1>` heading, so this test stays green
  unchanged.
- `package.json:18-24` — `npm test` → `node --test`; `npm run lint` → syntax
  check of `src/server.js` only; `npm run build` is a no-op. No build/bundler.

Conclusion: overwrite one static HTML file with the authoritative markup. No
server, index, i18n, or test changes are required.

## Scope

- **`src/public/chain-of-command.html`** (EDIT — full overwrite): replace the
  entire file contents with the product owner's supplied HTML **verbatim** (the
  full document from `<!DOCTYPE html>` through `</html>`, reproduced in
  **Source HTML (authoritative)** below). Do not alter markup, styles, the logo
  URL, links, role list/order, names, or footer text. Filename and path stay
  the same so `/chain-of-command.html` and the existing nav link keep working.
- No changes to `src/server.js`, `src/public/index.html`, `src/public/app.js`,
  `src/public/i18n.js`, `test/server.test.js`, `package.json`, deploy config,
  or other docs.

## Acceptance / DoD

- `src/public/chain-of-command.html` is byte-identical to the **Source HTML
  (authoritative)** block below (subtitle "California Cadet Brigade Structure";
  role cards in the supplied order Squad Leader → Governor of California; footer
  "California Cadet Brigade • Leadership • Duty • Honor"; no
  `/* FINAL CUSTOM GRADIENT */` comment).
- `/chain-of-command.html` still serves `200` with `text/html` and the existing
  nav link from `index.html` resolves.
- `npm test` passes (existing `chain-of-command` test at
  `test/server.test.js:256` remains green; the new markup still contains
  "Chain of Command").
- `npm run lint` and `npm run build` pass (both unaffected — no JS changed).
- Contract followed: only `src/public/chain-of-command.html` is modified.

## Source HTML (authoritative)

Copy the following document into `src/public/chain-of-command.html`
**byte-for-byte**, replacing all current contents:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chain of Command</title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:'Segoe UI',Tahoma,sans-serif;
}

body{
    background: linear-gradient(
        to bottom,
        #003b8f 0%,
        #001b44 100%
    );
    color:white;
}

/* HEADER */
header{
    background:#002D72;
    text-align:center;
    padding:40px 20px;
    border-bottom:5px solid #FFD700;
    box-shadow:0 8px 20px rgba(0,0,0,.4);
    position:relative;
}

header h1{
    color:#FFD700;
    font-size:40px;
}

header p{
    color:#EDEDED;
    margin-top:10px;
}

/* LOGO */
.logo{
    position:absolute;
    top:12px;
    right:12px;
}

.logo img{
    width:75px;
    height:auto;
    background:transparent;
    border:none;
    box-shadow:none;
    filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));
}

.container{
    max-width:1100px;
    margin:40px auto;
    padding:20px;
}

.card{
    background:rgba(255,255,255,.08);
    backdrop-filter:blur(10px);
    border:2px solid #FFD700;
    border-radius:20px;
    padding:22px;
    margin:18px auto;
    width:90%;
    box-shadow:0 10px 25px rgba(0,0,0,.35);
}

.role{
    font-size:22px;
    font-weight:bold;
    color:#FFD700;
    margin-bottom:6px;
}

.name{
    font-size:18px;
    font-weight:600;
    margin-bottom:10px;
}

.description{
    font-size:15px;
    color:#E6E6E6;
    line-height:1.5;
}

.chain-line{
    width:6px;
    height:35px;
    background:#FFD700;
    margin:0 auto;
    border-radius:10px;
}

footer{
    text-align:center;
    padding:25px;
    margin-top:40px;
    background:#001b44;
    border-top:4px solid #FFD700;
    color:#FFD700;
}
</style>

</head>

<body>

<header>

<div class="logo">
    <a href="https://start.cacadets.org/" target="_blank">
        <img src="https://cacc.us-east-1.linodeobjects.com/Website%20Source/California_Cadet_Corps_logo.png" 
             alt="CACC Logo">
    </a>
</div>

<h1>Chain of Command</h1>
<p>California Cadet Brigade Structure</p>
</header>

<div class="container">

<div class="card">
<div class="role">Squad Leader</div>
<div class="name">Squad Leader</div>
<div class="description">
Leads a small squad of cadets and ensures discipline, training, and task execution at the lowest unit level.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Platoon Sergeant</div>
<div class="name">Platoon Sergeant</div>
<div class="description">
Assists the platoon leader and maintains discipline, accountability, and training standards within the platoon.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Platoon Leader</div>
<div class="name">Platoon Leader</div>
<div class="description">
Leads platoon-level operations, training, and ensures mission readiness of assigned squads.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">First Sergeant</div>
<div class="name">First Sergeant</div>
<div class="description">
Senior enlisted advisor at the company level responsible for discipline, welfare, and standards.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Company Commander</div>
<div class="name">Company Commander</div>
<div class="description">
Commands a company and is responsible for training, leadership, and mission execution.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Battalion Command Sergeant Major</div>
<div class="name">Battalion Command Sergeant Major</div>
<div class="description">
Senior enlisted advisor at the battalion level responsible for discipline and leadership standards.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Battalion Commander</div>
<div class="name">Battalion Commander</div>
<div class="description">
Commands all companies within a battalion and oversees training, operations, and readiness.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Commandant</div>
<div class="name">Commandant</div>
<div class="description">
Senior authority responsible for oversight of cadet training programs and leadership development.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Principal</div>
<div class="name">Principal</div>
<div class="description">
School-level authority supporting cadet program implementation and coordination.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Brigade Commander</div>
<div class="name">Brigade Commander</div>
<div class="description">
Leads all battalions within the brigade and is responsible for overall brigade readiness.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Brigade Advisor</div>
<div class="name">Brigade Advisor</div>
<div class="description">
Adult mentor supervising cadet leadership and ensuring program compliance and success.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Brigade Command Sergeant Major</div>
<div class="name">Brigade Command Sergeant Major</div>
<div class="description">
Senior enlisted leader for the brigade ensuring discipline, mentorship, and standards.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">10th Brigade Command Sergeant Major</div>
<div class="name">10th Brigade Command Sergeant Major</div>
<div class="description">
Senior enlisted advisor for the 10th Brigade, overseeing discipline and cadet development.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">10th Brigade Commander</div>
<div class="name">10th Brigade Commander</div>
<div class="description">
Commands all brigade-level operations within the 10th Brigade and provides overall leadership.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">CACC Executive Officer</div>
<div class="name">CACC Executive Officer</div>
<div class="description">
Manages statewide operations and implements policies for the California Cadet Corps.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Commander, Youth & Community Programs Task Force</div>
<div class="name">Commander</div>
<div class="description">
Oversees youth programs including the California Cadet Corps across the state.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">The Adjutant General</div>
<div class="name">The Adjutant General</div>
<div class="description">
Leads the California Military Department and oversees all state military programs.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Governor of California</div>
<div class="name">Gavin Newsom</div>
<div class="description">
Commander-in-Chief of the California National Guard and highest state executive authority.
</div>
</div>

</div>

<footer>
California Cadet Brigade • Leadership • Duty • Honor
</footer>

</body>
</html>
```

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-BO-replace-chain-of-command-page.md

Work on branch ws/replace-chain-of-command-page in worktree cacc-ws-replace-chain-of-command-page.

Scope: overwrite src/public/chain-of-command.html with the exact HTML in the
contract's "Source HTML (authoritative)" section, byte-for-byte (subtitle
"California Cadet Brigade Structure"; role cards Squad Leader → Governor of
California; footer "California Cadet Brigade • Leadership • Duty • Honor").
Change nothing else — no server, index.html, app.js, i18n.js, test, or
package.json edits. The existing test/server.test.js chain-of-command test
must stay green (new markup still contains "Chain of Command").

Build green; the orchestrator handles commit/push/PR.
```
