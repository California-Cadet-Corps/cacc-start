# WS-CF — Unlock the pipeline: stop a runner→VPS connectivity blip from red-failing a live deploy

- Branch: ws/deploy-health-probe-nonblocking
- PR title: [ws/deploy-health-probe-nonblocking] WS-CF-deploy-health-probe-nonblocking: fail the deploy only on a bad HTTP status, not on a pure connect timeout
- Depends on: none
- Relationship: **Duplicate requirement of WS-CC (`ws/resilient-deploy-health-check`), WS-CD (`ws/deploy-verify-tolerate-blips`), and WS-CE (`ws/deploy-verify-connectivity-nonfatal`)** — all three already on `main` as docs-only contracts for the *same* product-owner request and the *same* root cause, and all edit the one "Verify deployment" step in `deploy.yml`. **None has been coded yet**, so `main` is still red. **Deploy-master: merge exactly ONE of {WS-CC, WS-CD, WS-CE, WS-CF} and close the rest — they conflict.**

## Problem

Product owner (verbatim):

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The **CI** check (`.github/workflows/ci.yml`, required on PRs) is green on every
PR — merges are not blocked by CI. What is red is the **Deploy to Production**
workflow (`.github/workflows/deploy.yml`, `on: push: branches: [main]`), which
runs on every push to `main`.

The most recent `main` push at investigation time is run **28699892604**
(`gh run view 28699892604`). Every step is green — Checkout, Install, Build,
Test, Configure SSH, **Upload release to server**, **Activate release & restart
service** — and only the final step, **"Verify deployment (public health
check)"**, fails with `exit 1`:

- The failure log is 12 identical lines:
  `curl: (28) Connection timed out after 10002 milliseconds` → HTTP code `000`,
  for all 12 attempts over ~3 min. The runner never opened a TCP/TLS connection
  to `https://start.cacadets.org/healthz`; it received **zero** HTTP responses.
- Because **Activate release & restart service** (`deploy.yml:136–198`) already
  ran `npm ci --omit=dev`, flipped the `current` symlink, and
  `sudo systemctl restart cacc-start` *before* verify runs, the release shipped
  successfully. The job went red on a **false negative** — a transient
  GitHub-runner ↔ Linode-VPS reachability gap, not an app or deploy fault. The
  `/healthz` handler exists (`src/server.js:27`) and the site is live.
- Successful `main` deploys finish in ~20s (e.g. runs `28693929249`,
  `28694073215`); the failing ones burn ~3m16s exhausting the verify retry
  budget — the signature of pure connectivity loss, not a code regression.

## Root cause

`.github/workflows/deploy.yml`, the **"Verify deployment (public health
check)"** step (lines 200–225):

- Line 216: `curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL"`
  has no `--connect-timeout` and does not force IPv4 (`-4`); a stalled connect
  burns the full `--max-time` each attempt.
- Lines 215–223: retry budget is only 12 × (`--max-time 10` + `sleep 5`) ≈ 3 min.
- Line 225: `exit 1` hard-fails the **whole** deploy job whenever the probe
  never returns 200 — **including** the case where it never connected at all
  (`000`), even though Activate (lines 136–198) already restarted the live app.
  The verify step is treated as a gate when it is really a post-deploy
  confirmation.

## Scope

Only `.github/workflows/deploy.yml`, the "Verify deployment (public health
check)" step (lines 200–225). No application code, no `ci.yml` change.

- Harden the probe: add `--connect-timeout 5` and `-4` to the `curl` on line 216
  so a stalled connect fails fast instead of eating the whole `--max-time`.
- Classify the outcome instead of collapsing everything to `exit 1`:
  - Any attempt returns **200** → pass (`exit 0`), unchanged.
  - The probe returned an actual HTTP status that is **non-200** (app reachable
    but unhealthy, e.g. `502`/`503`) → **hard-fail** (`exit 1`) — a real
    regression must still red the deploy.
  - Every attempt was **pure non-connectivity** (`000` / `curl` exit `28`), i.e.
    the runner never got any HTTP response → emit a GitHub `::warning::`
    annotation ("public probe could not reach the VPS from the runner; release
    was activated successfully — treating as non-fatal") and **pass** (`exit 0`).
- Track the last non-`000` code seen across attempts to drive the decision above
  (small shell var; keep the existing `for i in $(seq 1 12)` loop and messages).
- Preserve `set -euo pipefail`, the `HEALTH_URL` env, the `concurrency` group,
  `permissions`, and the `Deployment summary` step (lines 227–235) unchanged.

## Acceptance / DoD

- A merge to `main` whose deploy activates successfully but whose public probe
  only ever times out (`000`) **passes** the Deploy job with a warning
  annotation — the pipeline is unblocked.
- A probe that returns a non-200 **HTTP** status still fails the job (`exit 1`);
  genuine outages are not masked.
- `deploy.yml` remains valid YAML and the verify `run:` block is `bash -n` clean;
  `set -euo pipefail`, `concurrency`, `permissions` preserved; only the verify
  step changed.
- CI (`ci.yml`) untouched and green; `npm run build`, `npm run lint`, `npm test`
  all pass on the branch.
- Change limited to `.github/workflows/deploy.yml` plus this WS contract file.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS contract first: docs/workstreams/WS-CF-deploy-health-probe-nonblocking.md

Work on branch ws/deploy-health-probe-nonblocking in worktree cacc-ws-deploy-health-probe-nonblocking.

Scope: In .github/workflows/deploy.yml, edit ONLY the "Verify deployment (public health
check)" step (lines 200-225). The deploy activates the release and restarts the service
before this step, so a pure runner->VPS connect timeout (curl code 000 / exit 28) is a
false negative that currently hard-fails a live deploy and reds out main. Add
--connect-timeout 5 and -4 to the curl probe, then classify the outcome: 200 passes; an
actual non-200 HTTP status still hard-fails (exit 1); but if every attempt was pure
non-connectivity (000), emit a ::warning:: annotation and pass (exit 0). Preserve
set -euo pipefail, the HEALTH_URL env, concurrency, permissions, and the Deployment
summary step. Do not touch ci.yml or application code.

Self-verify: deploy.yml is valid YAML and the verify run: block is bash -n clean;
npm run build, npm run lint, and npm test pass.

Build green; the orchestrator handles commit/push/PR.
```
