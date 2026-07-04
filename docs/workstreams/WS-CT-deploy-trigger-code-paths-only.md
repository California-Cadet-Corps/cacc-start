# WS-CT — Only deploy on real code changes; stop docs-only pushes from reddening main

- Branch: ws/deploy-trigger-code-paths-only
- PR title: [ws/deploy-trigger-code-paths-only] WS-CT-deploy-trigger-code-paths-only: scope the production deploy trigger to deployable code paths
- Depends on: none

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The red the product owner sees on `main` comes from **`Deploy to Production`**
(`.github/workflows/deploy.yml`), not from CI. Two separate, compounding issues produce it.

**1. Every push to `main` deploys — including docs-only orchestrator commits.**
`deploy.yml` triggers on `on: push: branches: [main]` (lines 6–8) with **no path filter**.
The orchestrator pushes contract commits straight to `main` — e.g. the recent
`docs: contract for [ws/deploy-verify-warn-on-unreachable]` and
`docs: contract for [ws/deploy-pipeline-unlock-consolidation]` commits — which change
**only** `docs/workstreams/*.md`. Each such push kicks off a full production deploy that
then reds out. This is exactly why the git log shows a long thrash of deploy-"unlock"
workstreams (WS-CE … WS-CS): every contract commit spawns another red deploy that *looks
like* a broken merge, prompting another "fix the deploy" requirement. This is the code-
fixable half of the problem and the direct cause of the "last merge failed" symptom.

**2. The public health check cannot reach production (environmental — NOT a repo bug).**
The current `main` deploy run (28722443462) shows the SSH deploy **succeeding** end to end
— `Configure SSH` ✓, `Upload release to server` ✓, `Activate release & restart service` ✓
(release symlinked, `sudo systemctl restart cacc-start` ran) — then failing only at
`Verify deployment (public health check)`:

```
curl: (28) Connection timed out after 10002 milliseconds
Attempt 12/12: https://start.cacadets.org/healthz → 000; retrying in 5s…
Health check FAILED: https://start.cacadets.org/healthz never returned 200
```

The `/healthz` route itself is correct (`src/server.js:27–31` returns `200` with
`{status:'ok'}`), and the app is deployed and restarted. A total connection timeout (curl
exit 28, HTTP `000`) to the public URL means nothing answered on `:443` — i.e. the public
front door (Apache vhost / TLS cert / DNS for `start.cacadets.org` / host firewall) is not
reachable from the GitHub runner. Earlier runs (e.g. WS-CR, 28720819609) failed one step
earlier with `ssh: connect to host *** port ***: Connection timed out` at
`Upload release to server` — the same infra flavor. **This half is an operator/infra fix,
outside a repo PR, and must not be papered over by making the health check pass anyway.**

## Root cause

- `.github/workflows/deploy.yml:6–8` — `on: push: branches: [main]` with no `paths:`
  filter, so non-code pushes (the orchestrator's docs-only contract commits) trigger a
  production deploy that reds out `main`.
- Underlying (environmental, out of scope for this PR): `https://start.cacadets.org`
  is unreachable from GitHub runners (`Verify deployment` step, `deploy.yml:200–225`,
  `HEALTH_URL` at line 205) — the deployed app restarts fine but the public endpoint
  times out. Requires an operator to restore the Apache reverse-proxy / TLS / DNS /
  firewall path on the Linode host (see `docs/SERVER_SETUP.md`, `docs/DEPLOYMENT.md`).

## Scope

File-by-file changes. **Only** `.github/workflows/deploy.yml` changes; no application code,
no `ci.yml`, no fail-open behavior.

- `.github/workflows/deploy.yml`
  - Under the `push` trigger (lines 6–8) add a `paths:` allow-list so the production deploy
    runs **only** when a push actually changes deployable code. Include (roughly, ~5 lines):
    `src/**`, `package.json`, `package-lock.json`, `.nvmrc`, and
    `.github/workflows/deploy.yml` (so changes to the deploy pipeline itself still validate).
    A docs-only push (`docs/**`, `**.md`, `LICENSE`, PR/issue templates) no longer triggers
    a deploy — the orchestrator's contract commits stop reddening `main`.
  - Change **nothing else**: keep `concurrency: production-deploy`, `permissions`, all
    build/test/SSH steps, the `retry()` helpers, and the `Verify deployment` health check
    **as strict as they are** (still `exit 1` on a genuinely unreachable production URL).
    Do **not** convert the health check to fail-open / soft-fail / warn-only — a real deploy
    to a down site must still fail loudly. That is the anti-goal that caused prior thrash.

Note (no code change): `Deploy to Production` is a post-merge, push-triggered workflow, not
a PR-required status check (CI in `ci.yml` is the required check), so skipping deploy on
docs-only pushes cannot block or "pend" any PR merge.

## Acceptance / DoD

- A push to `main` that changes only `docs/**` / `**.md` (an orchestrator contract commit)
  does **not** start a `Deploy to Production` run — `main` stops going red on docs merges.
- A push to `main` that changes `src/**`, `package.json`, `.nvmrc`, or `deploy.yml` **still**
  triggers the deploy exactly as before.
- The health check remains strict: a deploy to a genuinely unreachable production URL still
  fails the job and `Deployment summary` reports ❌ (no masking / fail-open).
- `deploy.yml` remains valid YAML; `concurrency`, `permissions`, and every existing step are
  preserved unchanged apart from the added `paths:` filter.
- `ci.yml` untouched and green; `npm run lint`, `npm run build`, `npm test` still pass.
- Change is limited to `.github/workflows/deploy.yml` plus this WS contract file.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS contract first: docs/workstreams/WS-CT-deploy-trigger-code-paths-only.md

Work on branch ws/deploy-trigger-code-paths-only in worktree
cacc-ws-deploy-trigger-code-paths-only.

Scope: main goes red because .github/workflows/deploy.yml triggers a full production deploy
on every push to main (on: push: branches:[main], lines 6-8, no path filter) — so the
orchestrator's docs-only contract commits each fire a deploy that reds out. Add a `paths:`
allow-list under the push trigger so the deploy runs ONLY when deployable code changes
(src/**, package.json, package-lock.json, .nvmrc, .github/workflows/deploy.yml); docs-only
pushes no longer deploy. Do NOT touch anything else and do NOT make the health check
fail-open — a real deploy to an unreachable production URL must still fail loudly (the
underlying public-endpoint outage is an operator/infra fix, not this PR). Keep concurrency,
permissions, and all steps intact; deploy.yml stays valid YAML.

Self-verify: docs/** or **.md pushes would not trigger the deploy, src/**/package.json/.nvmrc
pushes still would, the health check is unchanged and strict, and npm run lint / build / test
pass.

Build green; the orchestrator handles commit/push/PR.
```
