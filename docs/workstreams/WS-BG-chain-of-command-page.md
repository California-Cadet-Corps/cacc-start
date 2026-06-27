# WS-BG — Chain of Command page

- Branch: ws/chain-of-command-page
- PR title: [ws/chain-of-command-page] WS-BG-chain-of-command-page: add Chain of Command static page
- Depends on: (none)

## Problem

Quoting the product owner verbatim:

> Replace the Chain of command page code with this
> ```html
> <!DOCTYPE html>
> <html lang="en">
> <head>
> <meta charset="UTF-8">
> <meta name="viewport" content="width=device-width, initial-scale=1.0">
> <title>Chain of Command</title>
> ... (full styled "Chain of Command" page: gradient body, header with CACC
> logo linking to https://start.cacadets.org/, a vertical stack of role cards
> from "Squad Leader" up through "Governor of California", separated by
> .chain-line dividers, and a footer reading
> "California Cadet Corps • Leadership • Duty • Honor") ...
> </html>

The full, authoritative HTML to use is reproduced verbatim in the
**Source HTML (authoritative)** section at the end of this contract. The coder
MUST copy that block byte-for-byte — no edits, no reformatting, no added
comments.

## Root cause / Investigation

This is a feature/content request, not a bug. There is **no existing "Chain of
Command" page** in the repository today, so "replace … with this" means
**create the page** with exactly the supplied markup.

- `src/server.js:25-52` — the app is a zero-dependency static file server. Any
  request path maps to a file under `PUBLIC_DIR` (`src/server.js:12`,
  `src/public/`). `/` rewrites to `/index.html` (`src/server.js:35`); any other
  `*.html` under `src/public/` is served as `text/html` (MIME table
  `src/server.js:15-23`). No router changes are required — dropping a new
  `.html` file into `src/public/` publishes it automatically at its filename.
- `src/public/index.html:1-28` — the only page that exists today (the landing
  placeholder). There is no chain-of-command file alongside it; `grep -ri
  "chain of command"` across the source tree returns nothing.
- `test/server.test.js:1-23` — tests use `node:test` + `node:assert/strict`,
  importing `server` from `../src/server.js`, listening on port 0, and
  asserting status/body via `fetch`. New page test should follow this exact
  shape.
- `package.json:18-24` — `npm test` → `node --test`; `npm run lint` → syntax
  check of `src/server.js` only; `npm run build` is a no-op placeholder. No
  bundler, no framework, no client routing.

Conclusion: add one new static HTML file; optionally add one test mirroring the
existing pattern. No `src/server.js` change is needed.

## Scope

- **`src/public/chain-of-command.html`** (NEW): create this file containing the
  product owner's supplied HTML **verbatim** (the full document from
  `<!DOCTYPE html>` through `</html>`, reproduced in **Source HTML
  (authoritative)** below). Filename chosen so the page is served at
  `/chain-of-command.html` by the existing static handler. Do not alter the
  markup, styles, logo URL, links, or role list.
- **`test/server.test.js`** (EDIT, additive): append one `node:test` case
  mirroring lines 15-23 — `GET /chain-of-command.html` returns `200`,
  `Content-Type` is `text/html`, and the body matches `/Chain of Command/`.
  Open/close the server within the test as the existing cases do.
- No changes to `src/server.js`, `package.json`, deploy config, or other docs.

## Acceptance / DoD

- `src/public/chain-of-command.html` exists and is byte-identical to the
  supplied markup (title "Chain of Command"; all role cards present in order
  Squad Leader → Governor of California; footer present).
- `npm run lint` passes (no server changes, so it stays green).
- `npm test` passes, including the new case asserting the page is served at
  `/chain-of-command.html` with a 200 and the expected content.
- `npm run build` still succeeds (no-op).
- Contract followed: only the two files in **Scope** are touched; no edits to
  any other file in the checkout.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
  docs/workstreams/WS-BG-chain-of-command-page.md

Work on branch `ws/chain-of-command-page` in worktree `cacc-ws-chain-of-command-page`.

Scope: Create the new static file src/public/chain-of-command.html containing
the product owner's supplied "Chain of Command" HTML verbatim (the full
<!DOCTYPE html> … </html> document reproduced in the "Source HTML
(authoritative)" section of the WS file) — no edits to the markup. The existing
static server (src/server.js) serves it automatically at /chain-of-command.html,
so do NOT change src/server.js. Add one additive test in test/server.test.js,
mirroring the existing GET / case, asserting GET /chain-of-command.html returns
200, Content-Type text/html, and a body matching /Chain of Command/. Self-verify
that only these two files are modified, the page content is unaltered, and
`npm test` and `npm run lint` pass.

Build green; the orchestrator handles commit/push/PR.
```

## Source HTML (authoritative)

The coder must place the following document, verbatim, into
`src/public/chain-of-command.html`:

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

/* FINAL CUSTOM GRADIENT */
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
<p>California Cadet Corps Structure</p>
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
<div class="role">Brigade Command Sergeant Major</div>
<div class="name">Brigade Command Sergeant Major</div>
<div class="description">
Senior enlisted leader for the brigade ensuring discipline, mentorship, and standards.
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
<div class="role">10th Corps Command Sergeant Major</div>
<div class="name">10th Corps Command Sergeant Major</div>
<div class="description">
Senior enlisted advisor for the 10th Corps, overseeing discipline and cadet development.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">10th Corps Commander</div>
<div class="name">10th Corps Commander</div>
<div class="description">
Commands all brigade-level operations within the 10th Corps and provides overall leadership.
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
<div class="role">Brigade Advisor</div>
<div class="name">Brigade Advisor</div>
<div class="description">
Adult mentor who supervises cadet leadership and ensures program compliance and success.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">CACC Executive Officer</div>
<div class="name">Colonel Michael J. Smith</div>
<div class="description">
Manages statewide operations and implements policies for the California Cadet Corps.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">Commander, Youth & Community Programs Task Force Commander</div>
<div class="name">Brigadier General Peter B. Cross</div>
<div class="description">
Oversees youth programs including the California Cadet Corps across the state.
</div>
</div>

<div class="chain-line"></div>

<div class="card">
<div class="role">The Adjutant General</div>
<div class="name">Major General Matthew P. Beevers</div>
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
California Cadet Corps • Leadership • Duty • Honor
</footer>

</body>
</html>
