# WS-CV — Unlock the deploy pipeline: stop docs-only pushes from deploying + bound the deploy job so the lock always releases

- Branch: ws/deploy-paths-ignore-and-job-timeout
- PR title: [ws/deploy-paths-ignore-and-job-timeout] WS-CV-deploy-paths-ignore-and-job-timeout: add paths-ignore so docs-only pushes don't deploy, and a job timeout so the production-deploy lock always releases
- Depends on: none (this supersedes/consolidates the unmerged WS-CC … WS-CU deploy-unlock contracts — see Investigation)

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Root cause

The red the product owner sees on `main` is the **`Deploy to Production`** workflow
(`.github/workflows/deploy.yml`), not CI. CI (`.github/workflows/ci.yml`) is green on every
PR. Two code-fixable structural gaps, plus one environmental cause that is deliberately
**out of scope**:

**1. Every push to `main` runs a full production deploy — including docs-only contract
commits.** The trigger is `on: push: branches: [main]` at `.github/workflows/deploy.yml:6-8`
with **no `paths` / `paths-ignore` filter**. The orchestrator pushes `docs: contract for …`
commits (touching only `docs/workstreams/*.md`) directly to `main`; each one launches a real
production deploy that SSHes to the Linode host. This is the visible source of the thrash and
the literal "last merge failed": the most recent failing runs are *pure docs pushes* —
e.g. run `28722582467` (`docs: contract for … WS-CT …`) and `28722443462` (WS-CS) each fired
a full deploy and reddened `main` even though they ship nothing deployable.

**2. The deploy job has no upper time bound, so a hung run can hold the pipeline lock
forever.** The `deploy` job (`.github/workflows/deploy.yml:19-21`) has **no
`timeout-minutes`**, while the workflow holds `concurrency: group: production-deploy` with
`cancel-in-progress: false` (`.github/workflows/deploy.yml:11-13`). A run that hangs inside
an SSH/rsync step would hold that lock indefinitely and queue every later deploy behind it —
the literal "pipeline locked." An explicit job timeout guarantees the lock is always released.

**3. (Environmental — NOT fixed here.)** On the code-carrying runs, the SSH deploy steps
succeed end-to-end (`Configure SSH` ✓, `Upload release to server` ✓, `Activate release &
restart service` ✓) and only `Verify deployment (public health check)`
(`.github/workflows/deploy.yml:200-225`) fails with `curl: (28) Connection timed out` / HTTP
`000` on all 12 attempts. The `/healthz` route is correct and returns `200 {status:'ok'}`
(`src/server.js:27-29`). A total connection timeout to `:443` means the public front door
(Apache reverse-proxy vhost / TLS / DNS for `start.cacadets.org` / host firewall or SSH
rate-limiting / fail2ban) is intermittently not answering from GitHub runners. **No workflow
edit can make an unreachable host reachable** — this is an operator fix on the Linode host
(`docs/SERVER_SETUP.md`, `docs/DEPLOYMENT.md`), outside any repo PR. Per the WS-CT/WS-CU
consensus, we do **not** weaken the health check or the SSH `retry()` logic to fake green: a
*real* code merge that cannot verify production is a legitimate signal, not noise. Once
docs-only pushes stop deploying (fix #1), the only deploys left are real code merges, and the
health check passes on its own the moment infra is restored.

## Investigation

- `.github/workflows/deploy.yml:6-8` — `on: push: branches: [main]`, **no path filter** →
  docs-only contract commits deploy to production. This is the direct source of the
  "last merge failed" symptom.
- `.github/workflows/deploy.yml:11-13` — `concurrency: group: production-deploy`,
  `cancel-in-progress: false` → the deploy lock is serialized and never force-cancelled.
- `.github/workflows/deploy.yml:19-21` — `deploy:` job, `runs-on: ubuntu-latest`, **no
  `timeout-minutes`** → a hung run holds the lock above indefinitely.
- `.github/workflows/deploy.yml:200-225` — `Verify deployment (public health check)`; ends
  with `exit 1` (line 225). This is where the code-carrying runs go red on curl exit 28 /
  HTTP `000`. **Left unchanged** (environmental, see Root cause #3).
- `src/server.js:27-29` — `/healthz` returns `200 {status:'ok', uptime}`; the app itself is
  healthy, confirming the failure is front-door reachability, not the app.
- Prior art: `docs/workstreams/WS-R-harden-deploy-ssh-retries.md` (merged as PR #59, commit
  `f04e24a`) already added SSH retries + connection multiplexing. **WS-CC … WS-CU are ~16
  near-duplicate deploy-unlock contracts present on `main` only as `docs: contract for …`
  commits — `git log` shows no coder implementation landed for any of them**, and
  `deploy.yml` on `origin/main` is still byte-for-byte the pre-fix version (no `paths-ignore`,
  no `timeout-minutes`, hard health check). This WS consolidates them into the single minimal
  change that actually unlocks the pipeline; the earlier unmerged deploy-unlock contracts
  should be **closed as superseded**, not implemented.

## Scope

Single file changed: `.github/workflows/deploy.yml`.

1. **`.github/workflows/deploy.yml:6-8` — add a `paths-ignore` filter to the push trigger** so
   docs-only / non-deployable pushes never trigger a production deploy. Ignore at minimum
   `docs/**` and `**.md` (contract commits, READMEs). Keep `branches: [main]`. Example shape:
   ```yaml
   on:
     push:
       branches: [main]
       paths-ignore: ['docs/**', '**.md']
   ```
2. **`.github/workflows/deploy.yml:19-21` — add `timeout-minutes` to the `deploy` job** (a
   sensible bound, e.g. `timeout-minutes: 15`) so a hung SSH/rsync step can never hold the
   `production-deploy` concurrency lock indefinitely. Place it on the `deploy:` job alongside
   `runs-on: ubuntu-latest`.
3. **Do NOT modify** the `Verify deployment (public health check)` step
   (`deploy.yml:200-225`), the SSH `retry()` helpers, or `concurrency`. The health-check
   failure is environmental (production front door unreachable) and must remain a real signal.

No changes to `src/`, `ci.yml`, or any other file. This is a workflow-config-only change.

## Acceptance / DoD

- `.github/workflows/deploy.yml` push trigger has a `paths-ignore` that excludes `docs/**` and
  `**.md`; a docs-only commit to `main` (e.g. a new `docs/workstreams/WS-*.md`) does **not**
  start a `Deploy to Production` run.
- The `deploy` job has a `timeout-minutes` bound so it can never hold the `production-deploy`
  lock indefinitely.
- The health check step, SSH retry logic, and `concurrency` block are unchanged.
- The workflow YAML remains valid (parses / renders in the Actions UI); `npm run lint`,
  `npm run build`, and `npm test` still pass (unaffected — no source changed).
- Contract followed: only `.github/workflows/deploy.yml` is modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CV-deploy-paths-ignore-and-job-timeout.md

Work on branch ws/deploy-paths-ignore-and-job-timeout in worktree cacc-ws-deploy-paths-ignore-and-job-timeout.

Scope (workflow-config-only, single file .github/workflows/deploy.yml): (1) add a
`paths-ignore` filter to the `on: push` trigger (lines 6-8) so docs-only / non-deployable
pushes don't deploy — ignore at least `docs/**` and `**.md`, keep `branches: [main]`;
(2) add `timeout-minutes` (e.g. 15) to the `deploy` job (lines 19-21) so a hung run can never
hold the `production-deploy` concurrency lock. Do NOT touch the health-check step
(lines 200-225), the SSH `retry()` logic, or the `concurrency` block — the health-check
timeout is an environmental production-reachability issue, not a code bug, and must stay a
real signal. Keep the YAML valid.

Build green; the orchestrator handles commit/push/PR.
```
