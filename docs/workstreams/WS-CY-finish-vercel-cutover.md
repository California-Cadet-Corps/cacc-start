# WS-CY — Finish the Vercel cutover: retire stale "Deploy to Production" pipeline references

- Branch: ws/finish-vercel-cutover
- PR title: [ws/finish-vercel-cutover] WS-CY-finish-vercel-cutover: align docs with the live Vercel pipeline so merges no longer look "stuck"
- Depends on: PR #68 (Migrate hosting to Vercel, commit 1083f52) — already merged. No open WS deps.

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The failing/locking pipeline was the **Linode SSH "Deploy to Production"** GitHub
Actions workflow. It repeatedly timed out and held its `concurrency` lock — the
whole WS-CN…WS-CX contract series (see `docs/workstreams/`) was attempts to
unlock it. Confirmed red runs: WS-CR / WS-CS / WS-CT ("Deploy to Production",
~3 min timeouts) via `gh run list --repo California-Cadet-Corps/cacc-start`.

**That pipeline no longer exists.** PR #68 (commit `1083f52`, "Migrate hosting to
Vercel (static)") **deleted `.github/workflows/deploy.yml`** (234 lines removed)
and moved production to **Vercel's Git integration** via a new `vercel.json`
(serves `src/public/` as static output, no build). Verified on `origin/main`:

- `.github/workflows/` now contains only `ci.yml` — no `deploy.yml`
  (`git ls-tree -r origin/main -- .github/workflows`).
- The last two merges are **green on CI**: #68 (Vercel migration) and #69
  (system-context re-sync). No "Deploy to Production" run exists after #68 —
  because the workflow was removed. So the old pipeline is already **structurally
  unlocked**; there is no GitHub-Actions deploy job left to fail or hold a lock.

**Root cause of the "last merge failed" perception:** the cutover was left
half-finished. Six tracked files still describe the removed GitHub-Actions deploy
as the live production path and tell people to watch a **"Deploy to Production"**
Actions run after merging. Following those docs after a merge, a contributor/cadet
finds no such run (or finds the old red runs) and concludes the merge/pipeline
failed. Production actually deploys fine via Vercel; the docs just point everyone
at the dead pipeline. The fix is to finish the migration so the documented
pipeline matches reality (Vercel).

Dangling references (all on `origin/main`, all pointing at the deleted
`deploy.yml` / retired "Deploy to Production"):

- `README.md:83` — repo-tree comment: `deploy.yml (production deploy)` (file gone).
- `docs/DEPLOYMENT.md:1-5` and `:59` — whole doc presents Linode + `deploy.yml`
  as the live automated deploy and links the deleted file; line 59 re-run steps
  reference *Deploy to Production*.
- `docs/CONTRIBUTING-PRS.md:81-85` — "6. Merge & deploy" links `DEPLOYMENT.md`
  for how merging deploys.
- `docs/ONBOARDING.md:50-51` — "Watch the deploy: merging triggers *Deploy to
  Production*. Confirm it goes green and …/`/healthz` are up" (no `/healthz` on a
  static Vercel site).
- `docs/students/03-how-deployment-works.md:60-70` — cadet guide: "Find the run
  named **Deploy to Production** for your merge … ❌ Red = something failed."
- `docs/SECRETS.md:46` — instructs editing the `ssh-keyscan` step in `deploy.yml`.

Authoritative model to align to (already correct): `README.md` Deployment section
and `vercel.json` — production runs on **Vercel**, merge to `main` triggers a
production deploy via Vercel Git integration, PRs get preview deployments; Linode
artifacts under `deploy/` are retained for rollback reference only.

## Scope

Documentation/reference-only cleanup. No behavior change; the pipeline is already
Vercel. Do not re-add `deploy.yml` and do not delete the `deploy/` rollback
artifacts.

- `README.md` (line 83): fix the repo-tree comment so `.github/workflows/` lists
  only `ci.yml (PR checks)` — drop the `deploy.yml` entry.
- `docs/DEPLOYMENT.md`: reframe as the **Vercel** deployment doc — merge to `main`
  → Vercel production deploy, PRs → preview deploys, source is `src/public/` via
  `vercel.json`; remove the dead `deploy.yml` link and the "Deploy to Production /
  re-run the workflow" steps. Keep a short **Legacy Linode (retired 2026-07-04)**
  note pointing at `deploy/` + `docs/ROLLBACK.md` for rollback reference (match the
  README's existing wording).
- `docs/students/03-how-deployment-works.md`: update the "is it live?" section so
  cadets check the **Vercel deployment** (via the maintainer / Vercel dashboard)
  rather than a "Deploy to Production" Actions run; keep the CI-green-before-merge
  guidance.
- `docs/ONBOARDING.md` (lines 50-51): change "Watch the deploy: merging triggers
  *Deploy to Production* … `/healthz`" to the Vercel deploy, and drop the
  non-existent `/healthz` check for the static site.
- `docs/CONTRIBUTING-PRS.md` (lines 81-85): keep "Merging to `main` deploys to
  production" but describe it as automatic via Vercel; leave the `DEPLOYMENT.md`
  link (now accurate once DEPLOYMENT.md is updated).
- `docs/SECRETS.md` (line 46 area): mark the `LINODE_*` / `deploy.yml` secrets as
  **legacy (retired with the Linode deploy)** rather than active setup steps.
- Optional verify (only change if actually broken): `vercel.json` serves a
  multi-page static site (`index.html`, `chain-of-command.html`) with
  `cleanUrls: true`; confirm internal links to `chain-of-command.html` still
  resolve. Do not change `vercel.json` unless a broken link is confirmed.

## Acceptance / DoD

- No tracked file outside `docs/workstreams/` references `.github/workflows/deploy.yml`
  or instructs watching a "Deploy to Production" Actions run as the live path
  (`git grep -nE "deploy\.yml|Deploy to Production"` returns only workstream docs).
- README, `docs/DEPLOYMENT.md`, `docs/students/03-how-deployment-works.md`,
  `docs/ONBOARDING.md`, `docs/CONTRIBUTING-PRS.md`, and `docs/SECRETS.md` describe
  **Vercel** as the production pipeline; Linode is present only as a clearly
  labeled retired/rollback reference.
- No `/healthz` liveness instruction remains for the static Vercel site.
- `deploy/` rollback artifacts and `vercel.json` are unchanged (unless the optional
  link check finds a real break).
- CI is green (`npm run lint` / `npm run build --if-present` / `npm test`); the
  contract in this file is followed. Docs-only change, so no new runtime code to
  test; if any file/link is touched, ensure referenced paths exist.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CY-finish-vercel-cutover.md
(read it at that exact path before editing anything).

Branch: ws/finish-vercel-cutover   Worktree: cacc-ws-finish-vercel-cutover

Scope (self-verify against the contract): PR #68 already migrated production to
Vercel and deleted .github/workflows/deploy.yml, but six tracked files still
point contributors/cadets at the removed "Deploy to Production" GitHub Actions
pipeline, so merges look stuck. Update README.md (line ~83 repo tree),
docs/DEPLOYMENT.md, docs/students/03-how-deployment-works.md, docs/ONBOARDING.md,
docs/CONTRIBUTING-PRS.md, and docs/SECRETS.md to describe the live Vercel
pipeline (merge→prod deploy, PR→preview) and treat Linode as a retired rollback
reference only. Do NOT re-add deploy.yml, do NOT delete deploy/ artifacts, and do
NOT change vercel.json unless a real broken link is confirmed. Docs-only change.

Build green; the orchestrator handles commit/push/PR.
```
