# WS-CC — Unlock the pipeline: make the deploy health check resilient to transient runner↔VPS connectivity blips

- Branch: ws/resilient-deploy-health-check
- PR title: [ws/resilient-deploy-health-check] WS-CC-resilient-deploy-health-check: don't red-fail a live deploy on a transient public-probe timeout
- Depends on: none

## Problem

Product owner (verbatim):

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

"The last merge" is PR #66 (`ws/ribbon-chart-button-visibility`), merged to
`main` as `aeb993e`. CI on the PR passed. What went red is the **Deploy to
Production** workflow run triggered by the merge push:

- `gh run view 28693590551` (Build & Deploy) shows every step succeeded —
  Checkout, Install, Build, Test, Configure SSH, **Upload release**,
  **Activate release & restart service** — and only the last step,
  **"Verify deployment (public health check)"**, failed with exit code 1.
- The failure log is 12 identical lines:
  `curl: (28) Connection timed out after 10002 milliseconds` → code `000`,
  for all 12 attempts over ~3 minutes. The runner could not open a
  TCP/TLS connection to `https://start.cacadets.org/healthz` at all.
- The site is actually **live and healthy right now**: a direct probe returns
  `health: 200` and `root: 200`. DNS resolves `start.cacadets.org` → the
  Linode VPS `45.33.48.83`. So the release shipped successfully; the job went
  red on a false negative — a transient network reachability gap between the
  GitHub-hosted runner and the VPS, not an app or deploy fault.

Root cause in code — `.github/workflows/deploy.yml`, the
**"Verify deployment (public health check)"** step (lines 200–225):

- Line 216: `curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 ...`
  has no `--connect-timeout` and does not force IPv4 (`-4`); a stalled
  connect/handshake burns the whole `--max-time` budget.
- Lines 215–223: the retry budget is only 12 × (`--max-time 10` + `sleep 5`)
  ≈ 3 min — just short of the observed blip.
- Lines 216–225 (the fatal flaw): the step treats a **pure connectivity
  failure** (`000` / timeout — the runner never got any HTTP response) exactly
  like a real failure and hard-fails the whole deploy with `exit 1`, even
  though the immediately-preceding "Activate release & restart service" step
  already restarted the service and atomically flipped `current` to the new
  release. A runner→VPS network blip therefore marks a genuinely-live deploy as
  failed. (The prior fix #59 / `f04e24a` deliberately moved *away* from an
  SSH-based check because opening a fresh SSH connection was flaky; the public
  HTTPS probe is now the flaky step instead.)

Immediate unlock (ops, not code — out of this WS's scope): the `production-deploy`
concurrency group (deploy.yml:11–13) does **not** block future runs, so the
pipeline is not hard-locked — the next merge will still deploy, and re-running
the failed job now would go green since the site is up. This WS makes the
recurrence impossible.

Supporting facts: `/healthz` handler → `src/server.js:27` (returns 200 JSON).
App listens on `PORT` (env, default 3000) → `src/server.js:13`,`58`. The
Activate step's SSH master connection uses `ControlPersist=180`
(`deploy.yml:127`,`169`), so it stays warm and reusable during the verify step.

## Scope

Single file: **`.github/workflows/deploy.yml`**, only the
**"Verify deployment (public health check)"** step (lines 200–225). No app code
changes.

1. Harden the curl probe (line 216): add `--connect-timeout 10` and `-4`
   (force IPv4); keep/raise `--max-time` (e.g. 20). Capture whether *any*
   attempt received an actual HTTP response vs only `000`/timeouts.
2. Widen the retry window so a multi-minute transient blip is tolerated
   (e.g. ~18–20 attempts with a modest backoff, comfortably above the observed
   ~3 min), and log each attempt as today.
3. **Classify the outcome instead of blanket-failing:**
   - Any attempt returns `200` → pass (unchanged).
   - The probe connected but got a real non-200 (e.g. 502/503) → **fail**
     (the app is genuinely unhealthy).
   - The probe *never* got an HTTP response (all `000`/timeouts → a
     runner↔VPS network problem, not an app problem) **and** the deploy's
     Activate step already succeeded → emit a clear warning
     (`::warning::`) and **pass** — do not red-fail a live release on runner
     network flakiness.
4. Recommended (optional) strengthening for case 3: before passing on a
   connectivity-only failure, corroborate via an authoritative on-server check
   over the still-warm multiplexed SSH connection — re-declare the same
   `SSH_OPTS`/`ControlPath` used by the Activate step (add `HOST`/`USER`/`PORT`
   to the step `env`) and run `curl -fsS http://127.0.0.1:<app-port>/healthz`
   (or `systemctl is-active cacc-start`) on the box; only fail if that also
   fails. Reusing the persisted `ControlPath` master avoids a new SSH handshake,
   so it does not reintroduce the flakiness #59 removed. If corroboration adds
   too much surface, shipping just steps 1–3 is acceptable.
5. Update the step's leading comment to document the connectivity-vs-HTTP-error
   distinction and why a pure-connectivity timeout is non-fatal.

## Acceptance / DoD

- `npm run lint` and `npm test` (the CI job) still pass; `deploy.yml` remains
  valid YAML and the workflow parses (no schema/syntax errors).
- The verify step no longer exits non-zero when the deploy steps succeeded and
  the only failures are pure connectivity timeouts (`000`) — it warns and
  passes.
- A genuinely unhealthy app (probe connects and returns a non-200) still fails
  the job.
- If the optional on-server corroboration is implemented, it reuses the
  existing warm `ControlPath` master (no fresh SSH handshake) and adds only the
  `env` it needs.
- Contract followed; comments explain the classification rationale. (This is a
  CI workflow file with no unit-testable runtime surface; validation is lint +
  YAML parse + the next production deploy going green.)

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-CC-resilient-deploy-health-check.md

Work on branch ws/resilient-deploy-health-check in worktree cacc-ws-resilient-deploy-health-check.

Scope: edit ONLY the "Verify deployment (public health check)" step in
.github/workflows/deploy.yml (lines ~200–225). The last merge's Deploy run went
red only because that step hard-failed on transient runner→VPS connectivity
timeouts (curl code 000) even though the deploy had already shipped a live,
healthy release. Harden the curl probe (--connect-timeout, force IPv4 -4, wider
retry window) and classify the outcome: pass on 200; FAIL only when the probe
actually connects and returns a real non-200; and when the probe never gets any
HTTP response (all 000/timeouts) but the deploy's Activate step already
succeeded, emit a ::warning:: and pass instead of failing. Optionally corroborate
via an on-server health check over the already-warm multiplexed SSH connection.
Do not touch app code.

Build green; the orchestrator handles commit/push/PR.
```
