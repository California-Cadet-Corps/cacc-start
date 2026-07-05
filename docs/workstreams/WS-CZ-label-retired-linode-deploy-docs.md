# WS-CZ — Finish the Vercel cutover: label the retired Linode operational docs

- Branch: ws/label-retired-linode-deploy-docs
- PR title: [ws/label-retired-linode-deploy-docs] WS-CZ-label-retired-linode-deploy-docs: banner the retired Linode/SSH deploy docs so no one mistakes them for the live pipeline
- Depends on: PR #68 (Migrate hosting to Vercel, commit `1083f52`) — already merged. PR #70 / WS-CY (`ws/finish-vercel-cutover`) — OPEN, does the primary doc realignment; this WS finishes only the two operational docs WS-CY leaves untouched. Coordinate merge order after #70.

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The pipeline that used to fail/lock was the **Linode SSH "Deploy to Production"**
GitHub Actions workflow. It timed out and held its `concurrency` lock; the entire
WS-CN…WS-CX contract series was attempts to unlock it. Confirmed red runs on
`main`: WS-CR / WS-CS / WS-CT ("Deploy to Production", ~3 min timeouts) via
`gh run list --repo California-Cadet-Corps/cacc-start`.

**That pipeline is already unlocked — structurally.** PR #68 (commit `1083f52`,
"Migrate hosting to Vercel (static)") **deleted `.github/workflows/deploy.yml`**
and moved production onto **Vercel's Git integration** via a new `vercel.json`
(serves `src/public/` statically, no build). Verified against `origin/main`:

- `.github/workflows/` now holds only `ci.yml` — no `deploy.yml`
  (`git ls-tree -r origin/main -- .github/workflows`).
- `gh run list` reports **no** "Deploy to Production" workflow after #68; the last
  such run was #67 (00:42). Every merge since (#68 Vercel migration, #69
  system-context re-sync, #70 CI) is **green on CI**. There is no Actions deploy
  job left to fail or hold a lock.

So the "last merge failed" report is a **perception left by a half-finished
cutover**: tracked docs still describe the deleted GitHub-Actions/Linode deploy
as the live production path. **PR #70 / WS-CY (`ws/finish-vercel-cutover`, OPEN)
already realigns the six primary files** (`README.md`, `docs/DEPLOYMENT.md`,
`docs/CONTRIBUTING-PRS.md`, `docs/ONBOARDING.md`,
`docs/students/03-how-deployment-works.md`, `docs/SECRETS.md`).

**Remaining gap this WS closes.** WS-CY deliberately keeps the Linode *operational*
docs as rollback references but never relabels their own headers, so on
`origin/main` they still read as live setup/runbooks pointing at the dead SSH +
`/healthz` pipeline:

- `docs/SERVER_SETUP.md:1` — titled "Linode server setup (one time)"; `:47`
  `LINODE_DEPLOY_PATH`, `:145` `curl … http://127.0.0.1:3002/healthz`. Reads as a
  current provisioning runbook.
- `docs/ROLLBACK.md:1` — "Rolling back a deployment"; `:13`/`:32` `ssh
  deploy@<LINODE_HOST>`, `:27`/`:43`/`:66` `/healthz` liveness. Reads as the
  current rollback procedure (it *is* still the rollback path, but it's Linode,
  not the live deploy path).
- `deploy/scripts/server-setup.sh`, `deploy/scripts/rollback.sh`,
  `deploy/apache/start.cacadets.org.conf`, `deploy/systemd/cacc-start.service` —
  retained-by-design Linode artifacts with no header saying so.

Production actually deploys via Vercel; `src/server.js` + `/healthz` and the whole
`deploy/` tree only ran on Linode, which is retired (2026-07-04). Note `/healthz`
is still legitimately exercised by `test/server.test.js` locally — **do not**
remove the server or its test; this WS only labels docs.

## Scope

Documentation/reference-only labeling. No behavior change; no code, no
`vercel.json`, no workflow edits. Do NOT re-add `deploy.yml`, do NOT delete the
`deploy/` artifacts, and do NOT touch the six files owned by WS-CY.

- `docs/SERVER_SETUP.md`: add a top-of-file banner marking it **RETIRED — Linode
  legacy, kept for rollback/reference only (production is Vercel; see
  `docs/DEPLOYMENT.md`)**. Match README's existing "retired 2026-07-04" wording.
  Body steps unchanged.
- `docs/ROLLBACK.md`: add the same top-of-file banner clarifying this is the
  **Linode** rollback path (retired host), not the live Vercel deploy; keep the
  procedure intact for emergency rollback.
- `deploy/scripts/server-setup.sh` and `deploy/scripts/rollback.sh`: add a
  one-line comment header near the top — `# RETIRED: Linode legacy, kept for
  rollback reference only. Production is Vercel.` No logic change.
- Leave `deploy/apache/*.conf` and `deploy/systemd/*.service` as-is (config files;
  optional single leading comment only if trivial — do not risk breaking parsing).

## Acceptance / DoD

- `docs/SERVER_SETUP.md` and `docs/ROLLBACK.md` each open with a clear
  RETIRED/Linode-legacy banner pointing to the live Vercel pipeline; no reader can
  mistake them for the current deploy path.
- The two `deploy/scripts/*.sh` files carry a one-line "retired Linode legacy"
  header comment; scripts remain syntactically valid.
- No content owned by WS-CY (`README.md`, `docs/DEPLOYMENT.md`,
  `docs/CONTRIBUTING-PRS.md`, `docs/ONBOARDING.md`,
  `docs/students/03-how-deployment-works.md`, `docs/SECRETS.md`) is modified here —
  avoid conflicts with PR #70.
- `src/server.js`, `test/server.test.js`, `vercel.json`, and every `deploy/`
  artifact remain functionally unchanged (banners/comments only).
- CI is green (`npm run lint`, `npm run build --if-present`, `npm test`); the
  contract in this file is followed. Docs/comment-only change, so no new runtime
  code to test; verify any path referenced in a banner actually exists.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CZ-label-retired-linode-deploy-docs.md
(read it at that exact path before editing anything).

Branch: ws/label-retired-linode-deploy-docs   Worktree: cacc-ws-label-retired-linode-deploy-docs

Scope (self-verify against the contract): PR #68 already migrated production to
Vercel and deleted .github/workflows/deploy.yml, and PR #70 (WS-CY) realigns the
six primary docs. This WS closes the last gap: add a top-of-file "RETIRED — Linode
legacy, kept for rollback reference only; production is Vercel" banner to
docs/SERVER_SETUP.md and docs/ROLLBACK.md, and a one-line retired-legacy comment
header to deploy/scripts/server-setup.sh and deploy/scripts/rollback.sh. Do NOT
touch the six WS-CY files, do NOT re-add deploy.yml, do NOT delete deploy/
artifacts, and do NOT change vercel.json, src/server.js, or the tests. Banners and
comments only — no behavior change.

Build green; the orchestrator handles commit/push/PR.
```
