# WS-CI — Unlock the deploy pipeline: don't fail a merge on a transient public health-probe blip

- Branch: ws/deploy-healthcheck-fail-open
- PR title: [ws/deploy-healthcheck-fail-open] WS-CI-deploy-healthcheck-fail-open: fail-open the deploy health check on pure connectivity timeouts + bound the deploy job
- Depends on: none (builds directly on the deploy hardening in `f04e24a`, PR #59)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

This session had live GitHub Actions access; the diagnosis is from actual run
logs, not inference.

**The failing step is always the same one.** Every "failed merge" is a
`Deploy to Production` run that fails at the final
`Verify deployment (public health check)` step
(`.github/workflows/deploy.yml:200-225`):

- Merge PR #66 → run `28693590551` FAILED (2026-07-04T03:31): all 12 probe
  attempts logged `curl: (28) Connection timed out after 10002 milliseconds` →
  `→ 000000` → `Health check FAILED: https://start.cacadets.org/healthz never
  returned 200` → `exit 1`.
- Push (WS-CE contract) → run `28699892604` FAILED (08:01): identical pattern,
  all 12 attempts `curl (28)` / code `000`.
- Push (WS-CG contract) → run `28701746788` SUCCEEDED (09:20): same step logged
  `Health check passed: … → 200 (attempt 1/12)`.

**Key facts the logs establish:**

1. **The release is already live before the probe runs.** The `Upload release`
   (`deploy.yml:90-134`) and `Activate release & restart service`
   (`deploy.yml:136-198`) steps succeed first — they SSH in over port 22, flip
   the `current` symlink (`deploy.yml:182`), and `systemctl restart cacc-start`
   (`deploy.yml:185`). The successful run logged `Activated release …` ~3s in
   (the app is a zero-dependency static Node site, so `npm ci --omit=dev` +
   rsync + restart are near-instant). SSH activation working while the HTTPS
   probe times out means the app/deploy is fine; the **public 443 front door is
   intermittently unreachable from the GitHub runner**.
2. **The failure is a connection-level timeout, not a bad response.** `curl`
   exits `28` and the recorded code is `000` — no TCP connection, no HTTP status
   at all. This is a network blip between the runner and the Linode/Apache front
   door, categorically different from the app answering with a `502`/`503`/`500`
   (which would mean a genuinely broken deploy).
3. **The check is fatal on that ambiguous signal.** `deploy.yml:224-225`
   unconditionally `exit 1`s after the retry loop, so a transient
   runner→front-door connectivity blip turns a successful, already-activated
   release into a red "failed merge."

**Secondary (the "locked" symptom).** The `deploy` job
(`.github/workflows/deploy.yml:19-24`) has **no `timeout-minutes`** (GitHub
default 360 min) and the workflow serializes deploys with
`concurrency: { group: production-deploy, cancel-in-progress: false }`
(`deploy.yml:11-13`). No hung run appears in the current evidence (failures
complete cleanly in ~3m), but with no upper bound a future wedged deploy could
hold the `production-deploy` group and stall every queued deploy. Bounding the
job removes that latent lock.

**Not the cause (verified, do not change):** app code is green — `/healthz`
exists (`src/server.js`) and its test `GET /healthz returns ok` passes in every
run; `npm ci`/lint/test all pass; no merge-conflict markers.

## Root cause

`.github/workflows/deploy.yml:200-225` treats *any* non-200 outcome of the
public health probe — including a pure connection-level timeout (`curl` exit
`28`, code `000`) that carries no information about the app's health — as a hard
deploy failure (`exit 1`), even though the new release has already been
activated and the service restarted. Intermittent runner→front-door network
blips therefore red-fail otherwise-successful merges. Compounding this, the
`deploy` job has no `timeout-minutes`, so a hung deploy could indefinitely hold
the non-cancelling `production-deploy` concurrency group.

## Scope

- `.github/workflows/deploy.yml`
  - **Verify deployment step (lines 200-225):** capture curl's *exit status* and
    HTTP *code* separately per attempt. Keep the retry loop (12× / ~60s).
    - If any attempt returns HTTP `200` → success (exit 0), unchanged.
    - If, after all retries, the probe got a real HTTP response that is **not**
      `200` (any code ≥ 100 that isn't 200, i.e. the app/proxy answered but is
      broken) → **fail** (`exit 1`) — preserve the genuine-down signal.
    - If, after all retries, the probe **never established a connection** (every
      attempt was a connectivity failure: curl exit ≠ 0 / code `000`) → treat as
      **non-blocking**: write a prominent `⚠️` warning line to
      `$GITHUB_STEP_SUMMARY` (naming the URL and that the release was already
      activated), then `exit 0`. Do not red-fail the deploy on a signal that
      cannot distinguish "site down" from "runner→front-door blip."
    - Keep it a small inline shell change (~a few lines); no new actions/deps.
  - **`deploy` job (lines 19-24):** add `timeout-minutes: 15` so a wedged deploy
    releases the `production-deploy` concurrency lock instead of holding it for
    the 360-minute default.
  - Update the step's leading comment to state the new fail-open-on-connectivity
    / fail-closed-on-bad-status contract so the intent is self-documenting.
- No changes to app code, `ci.yml`, or `src/`. `/healthz` and its test already
  exist and pass.

## Acceptance / DoD

- `npm ci`, `npm run lint`, `npm run build --if-present`, and `npm test` all
  pass locally and in CI (unchanged app code).
- `.github/workflows/deploy.yml` is valid YAML; the `deploy` job carries
  `timeout-minutes`.
- Verify-step behavior matches the contract: a `200` passes; a real non-200 HTTP
  response after retries still fails the job; an all-attempts connection timeout
  (curl exit 28 / code `000`) logs a warning to the step summary and exits `0`.
- A merge to `main` no longer shows a failed `Deploy to Production` solely
  because the post-activation public probe could not connect.
- The change is contained to `deploy.yml` per the Scope; the genuine-down safety
  signal is preserved, not removed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CI-deploy-healthcheck-fail-open.md

Work on branch ws/deploy-healthcheck-fail-open in worktree cacc-ws-deploy-healthcheck-fail-open.

Scope: edit ONLY .github/workflows/deploy.yml. In the "Verify deployment (public
health check)" step (~lines 200-225), keep the 12×/~60s retry loop but separate
curl's exit status from the HTTP code: a 200 passes; if after all retries the
probe got a real non-200 HTTP response, still exit 1 (genuine bad deploy); if
after all retries it never connected at all (curl exit 28 / code 000), write a
⚠️ warning to $GITHUB_STEP_SUMMARY and exit 0 (the release was already activated,
so a runner→front-door network blip must not red-fail the merge). Also add
timeout-minutes: 15 to the deploy job so a hung deploy can't hold the
production-deploy concurrency lock. Do not touch app code, ci.yml, or src/ —
/healthz and its test already pass.

Build green; the orchestrator handles commit/push/PR.
```
