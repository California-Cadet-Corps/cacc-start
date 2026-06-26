# WS-R — Stop transient SSH timeouts from failing production deploys

- Branch: ws/harden-deploy-ssh-retries
- PR title: [ws/harden-deploy-ssh-retries] WS-R-harden-deploy-ssh-retries: retry SSH-dependent deploy steps so transient timeouts don't break main
- Depends on: none

## Problem

> It looks like one of the main merges broke, please investigate and unblock the pipeline.

## Investigation

The product owner is seeing a red ✗ on **main** after merges. This is **not** a code
regression introduced by any merge — the source, lint, and tests are fine.

Two separate workflows run in this repo:
- `.github/workflows/ci.yml` — required check, runs on PRs / feature pushes. **Always green**
  (verified: every PR's `CI` run is `success`). PR merges are therefore *not* actually
  blocked by CI.
- `.github/workflows/deploy.yml` — `Deploy to Production`, runs on every push to `main`
  (`on: push: branches: [main]`). This is the workflow turning main red.

Evidence from recent `Deploy to Production` runs on `main`:
- Failures occur **only** at SSH-dependent steps; `Build`, `Test`, and lint always pass.
- Run #19 (28270743140) and the WS-J push (28269064306): failed at **Verify deployment
  (health check)** with `ssh: connect to host *** port ***: Connection timed out`
  (~15s after start — exactly the `ConnectTimeout=15` handshake bound).
- Run #18 (28270210727): `Upload release` and `Activate release & restart service`
  (both SSH) **succeeded**, then the very next SSH step (health check) failed with
  `Timeout, server *** not responding.`
- Run #17 (28270080504): failed earlier, at **Configure SSH**, via the intentional
  guard when `ssh-keyscan` returned no host key (host unreachable at that instant).
- Successful deploys interleave with the failures (e.g. WS-O 28270782407 success right
  next to PR #19 failure), which is the signature of **transient connectivity**, not a
  persistent break or a bad commit.

Root cause: every SSH/`ssh-keyscan`/`rsync` invocation in `deploy.yml` runs exactly
**once**. A single transient connection timeout to the Linode host aborts the entire
production deploy and marks the merge commit failed. The PR #9 "hardening" added timeouts
and `BatchMode` (so steps fail fast instead of hanging) but added **no retry**, so fast
failures now surface as red builds.

## Root cause (files / lines, origin/main `.github/workflows/deploy.yml`)

- `Configure SSH` (lines 45–62): `ssh-keyscan -p "$PORT" -H "$HOST"` at line 58 runs
  once; a transient miss trips the `exit 1` guard at line 61.
- `Upload release to server` (lines 64–87): single `ssh $SSH_OPTS ... mkdir` (~line 81)
  and single `rsync ... -e "ssh $SSH_OPTS"` (lines 83–86).
- `Activate release & restart service` (lines 89–125): single `ssh $SSH_OPTS` (~line 101).
- `Verify deployment (health check)` (lines 127–154): single outer `ssh $SSH_OPTS`
  (~line 141). The `for i in $(seq 1 10)` loop (lines 147–152) only retries the remote
  `curl` *after* SSH connects — it does **not** retry the SSH connection itself, which is
  what times out.

## Scope

File-by-file changes (no application code changes; CI behavior unchanged):

- `.github/workflows/deploy.yml`
  - Add a small bounded retry-with-backoff shell helper (e.g. a `retry()` function:
    N attempts, sleep between attempts, return the last failure's exit code) and apply it
    to each transient, network-bound invocation:
    - wrap the `ssh-keyscan` in `Configure SSH` so a transient empty result retries before
      the guard fails the step;
    - wrap the `ssh` (mkdir) and `rsync` calls in `Upload release to server`;
    - wrap the `ssh` call in `Activate release & restart service` (idempotent — `mkdir -p`,
      `ln -sfn`, `npm ci`, restart are safe to re-run);
    - wrap the outer `ssh` in `Verify deployment (health check)` so a dropped handshake
      retries (keep the existing inner `curl` poll loop).
  - Keep all existing `SSH_OPTS` (`BatchMode=yes`, `ConnectTimeout=15`, `ServerAlive*`,
    `StrictHostKeyChecking=accept-new`), `set -euo pipefail`, the `concurrency` group, and
    `permissions`. After exhausting retries the step must still exit non-zero so a genuine
    persistent outage still fails loudly (do not mask real failures).
  - Preserve the `ssh-keyscan` empty-result guard (lines 60–61) as the final check after
    retries are exhausted.

No other files change. Do not touch `ci.yml`, application code, or any docs other than
this WS file.

## Acceptance / DoD

- `Deploy to Production` no longer fails on a single transient SSH/rsync connection
  timeout: each SSH-dependent step retries a bounded number of times before failing.
- A genuinely unreachable host still fails the step after retries are exhausted (failures
  are not swallowed) and `Deployment summary` still reports ❌.
- `deploy.yml` remains valid YAML and each `run:` script remains valid bash
  (`bash -n` clean); `set -euo pipefail`, `concurrency`, and `permissions` preserved.
- CI (`ci.yml`) is untouched and stays green; `npm run build`, `npm run lint`, `npm test`
  all pass on the branch.
- Change is limited to `.github/workflows/deploy.yml` plus this WS contract file.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS contract first: docs/workstreams/WS-R-harden-deploy-ssh-retries.md

Work on branch ws/harden-deploy-ssh-retries in worktree cacc-ws-harden-deploy-ssh-retries.

Scope: The "Deploy to Production" workflow (.github/workflows/deploy.yml) intermittently
fails on merges to main because each SSH/ssh-keyscan/rsync invocation runs exactly once,
so a single transient connection timeout aborts the whole deploy and reds out main (CI
itself is always green). Add a bounded retry-with-backoff helper and wrap the SSH-dependent
invocations in the Configure SSH, Upload release, Activate release, and Verify health check
steps; keep the existing SSH_OPTS, the ssh-keyscan empty-result guard, set -euo pipefail,
concurrency, and permissions, and still exit non-zero after retries are exhausted so a real
persistent outage fails loudly. Touch only deploy.yml; do not change ci.yml or app code.

Self-verify: deploy.yml is valid YAML and each run: block is bash -n clean; npm run build,
npm run lint, and npm test pass.

Build green; the orchestrator handles commit/push/PR.
```
