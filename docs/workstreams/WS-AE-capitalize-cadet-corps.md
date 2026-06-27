# WS-AE — Capitalize the C's in "Cadet Corps"

- Branch: ws/capitalize-cadet-corps
- PR title: [ws/capitalize-cadet-corps] WS-AE-capitalize-cadet-corps: uppercase the C's in "Cadet Corps" across human-readable text
- Depends on: (none)

## Problem

Product owner, verbatim:

> change all the lowercase C's in Cadet Corps all upper case

## Investigation

The organization name is referenced throughout the repo. An exhaustive
case-insensitive sweep for `cadet` / `corps` was run (`grep -rniE` across all
tracked files, excluding `.git/`).

Findings — every occurrence of the brand phrase **"Cadet Corps"** already uses
uppercase C's:

- `src/public/index.html:6` — `<title>California Cadet Corps — Start</title>` (already uppercase)
- `src/public/index.html:22` — `<h1>California Cadet Corps</h1>` (already uppercase)
- `package.json:5,7` — description / author "California Cadet Corps" (already uppercase)
- `README.md:3,9,108`, `CONTRIBUTING.md:3`, `SECURITY.md:9` — prose, already uppercase
- `test/server.test.js:21` — `assert.match(text, /California Cadet Corps/)` (already uppercase)

The **only** human-readable occurrence with a lowercase "c" in the word is the
sample conventional-commit line:

- `CONTRIBUTING.md:66` — `feat: add cadet roster import` → lowercase `cadet`

### Explicitly out of scope (would break the build / links / deploy)

These contain lowercase letters that are part of identifiers, domains, repo
slugs, or service names — NOT the display phrase "Cadet Corps" — and must NOT be
changed:

- Domain `start.cacadets.org` / `cacadets.org` (nginx, deploy, env, systemd, docs)
- GitHub org/repo `California-Cadet-Corps/cacc-start` (URLs, secrets, CI)
- Package name / service `cacc-start`

## Root cause

This is a normalization request, not a bug. The canonical display surfaces
already comply; the lone lowercase word in prose is the commit example at
`CONTRIBUTING.md:66`.

## Scope

File-by-file:

1. `CONTRIBUTING.md` (line 66) — change `feat: add cadet roster import` to
   `feat: add Cadet roster import` (capitalize the leading `c` of `cadet`).
2. No other edits required: all `Cadet Corps` brand occurrences already use
   uppercase C's. The coder must re-run the case-insensitive sweep to confirm
   no lowercase variant of the phrase (`cadet corps`, `Cadet corps`,
   `cadet Corps`) exists anywhere in human-readable text, and leave
   identifiers/domains/URLs (the out-of-scope list above) untouched.

## Acceptance / DoD

- `CONTRIBUTING.md:66` reads `feat: add Cadet roster import`.
- No human-readable occurrence of the org name uses a lowercase C; a
  case-insensitive grep for `cadet`/`corps` shows every brand-phrase hit as
  `Cadet Corps`.
- No identifier, domain (`cacadets.org`), repo slug (`cacc-start`,
  `California-Cadet-Corps`), or service name was altered.
- `npm test` passes (the landing-page assertion `/California Cadet Corps/` is
  unaffected).
- Build/CI green; contract followed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full workstream contract first:
docs/workstreams/WS-AE-capitalize-cadet-corps.md

Branch: ws/capitalize-cadet-corps
Worktree: cacc-ws-capitalize-cadet-corps

Scope: The product owner wants the lowercase C's in the words of "Cadet Corps"
uppercased. Every brand occurrence already uses uppercase C's; the only
human-readable lowercase word is the commit example at CONTRIBUTING.md:66 —
change "feat: add cadet roster import" to "feat: add Cadet roster import".
Do NOT touch identifiers, domains (cacadets.org), repo slugs (cacc-start,
California-Cadet-Corps), or service names. Verify with a case-insensitive grep
and run npm test.

Build green; the orchestrator handles commit/push/PR.
```
