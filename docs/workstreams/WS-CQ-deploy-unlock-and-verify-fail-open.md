# WS-CQ — Unlock the deploy pipeline: bound the job, skip docs-only deploys, and fail-open the health probe

- Branch: ws/deploy-unlock-and-verify-fail-open
- PR title: [ws/deploy-unlock-and-verify-fail-open] WS-CQ-deploy-unlock-and-verify-fail-open: bound the deploy job, skip docs-only pushes, and fail-open the health check on pure connectivity timeouts
- Depends on: none

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The failing pipeline is the **Deploy to Production** workflow
(`.github/workflows/deploy.yml`), which runs on every push to `main`
(`on.push.branches: [main]`, lines 6–8). CI (`.github/workflows/ci.yml`) is
green on every PR; the red X the product owner sees is always the deploy job.

Actual run history (`gh run list` for "Deploy to Production" on `main`) shows
the deploy alternating success/failure with the *same* code — deploy.yml is
byte-identical between the local checkout and `origin/main`, so **no prior fix
has ever landed** despite ~16 docs-only contracts (WS-CC … WS-CP) describing
one. Every failure is an intermittent runner→Linode "Connection timed out",
and it lands in one of two steps:

- **"Verify deployment (public health check)"** (deploy.yml lines 200–225).
  In the failed run 28705739793 the prior steps **"Upload release to server"
  (line 90) and "Activate release & restart service" (line 136) both
  succeeded** — the new release symlink was flipped and `cacc-start` restarted
  — yet the job went red because the outbound `curl` to
  `https://start.cacadets.org/healthz` returned `curl: (28) Connection timed
  out` / HTTP `000` on all 12 attempts (lines 215–225). The release was
  **already live**; only the probe couldn't connect, so the red X is a false
  alarm. `/healthz` itself is healthy — it returns `200` at
  `src/server.js:27–31`.

- **"Upload release to server"** (line 90) fails outright in other runs
  (28703838530, 28703534937, 28701859348) when the SSH/rsync burst never
  connects. Here production is genuinely **not** updated, so this step must
  stay fatal — the existing 4× exponential-backoff `retry()` (lines 99–111) is
  the right tool and must not be softened.

Two structural gaps make this worse:

1. **Every docs/contract push triggers a full production deploy.** This repo
   pushes a `docs: contract for …` commit to `main` constantly (e.g.
   `30cc860`, `fd71551`), and each one fires deploy.yml — re-reddening the
   pipeline over a change that ships nothing deployable. `on.push` has no
   `paths-ignore` (lines 6–8).

2. **The deploy job has no `timeout-minutes`.** The `concurrency` group is
   `production-deploy` with `cancel-in-progress: false` (lines 11–13), so a
   genuinely hung SSH/rsync step would hold the lock indefinitely and block all
   future deploys — the literal "locked pipeline." The job (lines 19–24) needs
   an upper bound so the lock always releases.

## Root cause

The health-check step treats a *pure connectivity timeout* (curl exit 28 /
HTTP `000`, i.e. the runner never reached the host) identically to a real bad
HTTP status, red-failing a deploy whose release was already activated and
restarted. Combined with (a) docs-only pushes needlessly triggering deploys and
(b) no job timeout to guarantee the concurrency lock releases, the pipeline
shows recurring, misleading failures and can wedge.

## Scope

All changes are confined to **`.github/workflows/deploy.yml`**. No app/source
changes.

- **Skip docs-only pushes** — under `on.push` (lines 7–8), add a
  `paths-ignore:` list covering `'**.md'` and `'docs/**'` so documentation and
  workstream-contract commits do not trigger a production deploy. (Keep
  `branches: [main]`.)
- **Bound the job so the lock always releases** — on the `deploy` job (around
  line 19), add `timeout-minutes: 15`. This directly satisfies "unlock the
  pipeline": a hung run can no longer hold the `production-deploy` concurrency
  lock indefinitely.
- **Fail-open the health check on pure connectivity timeouts** — in the
  "Verify deployment (public health check)" step (lines 206–225): track whether
  *any* attempt returned a real HTTP status vs. only `000`/exit-28. Keep the
  existing 12× loop and the `200` → `exit 0` fast path. On loop exhaustion:
  if a real non-2xx status was ever observed, keep `exit 1` (genuine bad
  release); if **every** attempt was a pure connection failure (`000`), emit a
  warning to `$GITHUB_STEP_SUMMARY` noting the release was already activated and
  `exit 0`. Rationale: this step runs only after "Activate release & restart
  service" succeeded, so a probe that never connects is a runner→host network
  blip, not a broken deploy. Do **not** change the "Upload release" or
  "Activate release" steps — those must stay fatal.
- **Deployment summary** — leave the existing `if: always()` summary step
  (lines 227–234) working; ensure the soft-pass path still reports a sensible
  message (a warning line, not a false "✅ deployed" claim that hides a skipped
  verification).

## Acceptance / DoD

- `.github/workflows/deploy.yml` is valid YAML and the workflow parses on
  GitHub (no schema errors on push).
- A push to `main` that touches only `**.md` / `docs/**` does **not** start a
  Deploy to Production run.
- A code push to `main` still deploys; when `/healthz` returns `200` the job is
  green as before.
- Simulated/real pure-connectivity health-probe failure (all attempts `000`,
  after a successful activate) yields a **green** job with a warning in the run
  summary; a real non-2xx `/healthz` response still yields a **red** job.
- The `deploy` job has an explicit `timeout-minutes`, guaranteeing the
  `production-deploy` concurrency lock is always released.
- `npm run lint` and `npm test` pass (`node --check src/server.js`,
  `node --test`); no source files changed, so existing tests remain green.
- The change is contained to `.github/workflows/deploy.yml`; the "Upload" and
  "Activate" steps remain fatal on failure.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CQ-deploy-unlock-and-verify-fail-open.md

Work on branch ws/deploy-unlock-and-verify-fail-open in worktree cacc-ws-deploy-unlock-and-verify-fail-open.

Scope (all in .github/workflows/deploy.yml only): (1) add paths-ignore ['**.md','docs/**'] to the on.push trigger so docs/contract commits don't deploy; (2) add timeout-minutes: 15 to the deploy job so a hung run always releases the production-deploy concurrency lock; (3) in the "Verify deployment (public health check)" step, fail-open only when EVERY probe attempt was a pure connection failure (curl exit 28 / HTTP 000) — since the release was already activated and restarted — but still exit 1 if any attempt returned a real non-2xx status. Do NOT soften the Upload or Activate steps; they must stay fatal. Verify the workflow YAML parses and existing lint/tests pass.

Build green; the orchestrator handles commit/push/PR.
```
