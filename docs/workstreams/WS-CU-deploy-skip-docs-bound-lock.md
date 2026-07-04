# WS-CU — Unlock the deploy pipeline: don't deploy on docs-only pushes, and bound the job so the lock always releases

- Branch: ws/deploy-skip-docs-bound-lock
- PR title: [ws/deploy-skip-docs-bound-lock] WS-CU-deploy-skip-docs-bound-lock: skip production deploy on docs-only pushes + add a job timeout so the concurrency lock releases
- Depends on: none

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The red the product owner sees on `main` is the **`Deploy to Production`** workflow
(`.github/workflows/deploy.yml`), not CI. Two things compound:

**1. Every push to `main` runs a full production deploy — including the orchestrator's
docs-only contract commits.** The trigger is `on: push: branches: [main]`
(`.github/workflows/deploy.yml:6–8`) with **no `paths` filter**. The orchestrator pushes
`docs: contract for …` commits (touching only `docs/workstreams/*.md`) directly to `main`;
each one kicks off a real production deploy. This is the visible cause of the thrash: the
git log shows an unbroken run of "deploy-unlock" contracts (WS-CC … WS-CT), and each new
contract commit spawns *another* red deploy that looks like "the last merge failed,"
prompting yet another identical requirement. Confirmed against live runs — e.g. run
`28722443462` (`docs: contract for [ws/deploy-pipeline-unlock-consolidation]`) and
`28720819609` (WS-CR) are pure docs pushes that each triggered a full deploy and reddened
`main`. **This is the code-fixable root cause and is what this WS fixes.**

**2. The public health check is genuinely unreachable (environmental — NOT a repo bug, and
deliberately NOT fixed here).** On the code-carrying runs, SSH deploy succeeds end to end —
`Configure SSH` ✓, `Upload release to server` ✓, `Activate release & restart service` ✓
(`sudo systemctl restart cacc-start` ran) — then only `Verify deployment (public health
check)` fails (`.github/workflows/deploy.yml:200–225`):

```
curl: (28) Connection timed out after 10002 milliseconds
Attempt 12/12: https://start.cacadets.org/healthz → 000; retrying in 5s…
Health check FAILED: https://start.cacadets.org/healthz never returned 200
```

The `/healthz` route is correct and returns `200 {status:'ok'}` (`src/server.js:27–29`), and
the app is deployed and restarted. A total connection timeout (curl exit 28, HTTP `000`) to
`:443` means the public front door — Apache reverse-proxy vhost / TLS cert / DNS for
`start.cacadets.org` / host firewall — is not answering from the GitHub runner. **This is an
operator/infra fix on the Linode host (see `docs/SERVER_SETUP.md`, `docs/DEPLOYMENT.md`),
outside any repo PR.** Per WS-CT's correct call, we do **not** weaken the health check to
fake green — a real code merge that can't verify production is a signal, not noise. Once
docs-only pushes stop deploying (fix #1), the only deploys left are real code merges, and
the health check will pass on its own the moment infra is restored.

## Root cause

- `.github/workflows/deploy.yml:6–8` — `on: push: branches: [main]` has **no `paths` /
  `paths-ignore` filter**, so non-deployable pushes (the orchestrator's docs-only contract
  commits) trigger a production deploy and red out `main`. This is the direct source of the
  "last merge failed" symptom.
- `.github/workflows/deploy.yml:18–21` — the `deploy` job has **no `timeout-minutes`**;
  combined with `concurrency.group: production-deploy` + `cancel-in-progress: false`
  (`lines 11–13`), a hung run would hold the lock and block later deploys indefinitely.
- Underlying, **out of scope** (environmental): `https://start.cacadets.org` is unreachable
  from runners (`Verify deployment`, `deploy.yml:200–225`, `HEALTH_URL` line 205). Operator
  action required; not a repo change.

## Scope

Single file: `.github/workflows/deploy.yml`. No application-code changes.

- **Path-filter the trigger** (`deploy.yml:6–8`): keep `on: push: branches: [main]` and add
  a `paths-ignore` list so documentation-only pushes don't deploy. Ignore at least
  `docs/**` and `**/*.md` (also non-deployable meta like `.github/ISSUE_TEMPLATE/**`,
  `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`). Use `paths-ignore` (not `paths`) so a new
  deployable file type is deployed by default rather than silently skipped. Add a one-line
  comment stating orchestrator docs commits must not trigger production deploys.
- **Bound the job** (`deploy.yml:18–21`, under `jobs: deploy:`): add
  `timeout-minutes: 20` so a stuck run fails fast and releases the `production-deploy`
  concurrency lock — the literal "unlock the pipeline" for the lock.
- **Do NOT** modify the `Verify deployment (public health check)` step
  (`deploy.yml:200–225`) or make it fail-open. Leave the hard fail intact; the health check
  must still fail if production is truly down.
- Add/extend a short comment near the trigger noting the remaining public-URL health-check
  failure is an infra/operator issue tracked in `docs/SERVER_SETUP.md`, not a workflow bug.

## Acceptance / DoD

- `.github/workflows/deploy.yml` parses as valid YAML and the workflow still runs on code
  pushes to `main` (validate with `npm run lint` for the app and a YAML sanity check /
  `actionlint` if available).
- A push that changes **only** files under `docs/**` or any `*.md` does **not** start the
  `Deploy to Production` workflow (verify from the branch/PR: the workflow shows no run for
  a docs-only commit).
- A push that changes deployable code (e.g. `src/**`, `package.json`, or `deploy.yml`
  itself) **still** triggers the deploy workflow.
- The `deploy` job has `timeout-minutes` set so it cannot hold the concurrency lock forever.
- The health-check step is unchanged (still `exit 1` on failure); no code path masks a real
  outage.
- Contract followed; the PR touches only `.github/workflows/deploy.yml`.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CU-deploy-skip-docs-bound-lock.md

Work on branch ws/deploy-skip-docs-bound-lock in worktree cacc-ws-deploy-skip-docs-bound-lock.

Scope (edit ONLY .github/workflows/deploy.yml): (1) add a `paths-ignore` filter to the
`on: push: branches: [main]` trigger so documentation-only pushes — `docs/**` and `**/*.md`
(and non-deployable meta like `.github/ISSUE_TEMPLATE/**`, `LICENSE`, `SECURITY.md`,
`CODE_OF_CONDUCT.md`) — do NOT run a production deploy; and (2) add `timeout-minutes: 20`
to the `deploy` job so a hung run releases the `production-deploy` concurrency lock. Do NOT
touch the `Verify deployment (public health check)` step and do NOT make it fail-open — the
remaining public-URL timeout is an infra/operator issue, out of scope. Self-verify: valid
YAML, docs-only pushes skip the deploy while code pushes still deploy, health check
unchanged.

Build green; the orchestrator handles commit/push/PR.
```
