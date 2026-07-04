# WS-CD — Unlock the pipeline: stop the deploy verify step from red-failing a live release on a transient network blip

- Branch: ws/deploy-verify-tolerate-blips
- PR title: [ws/deploy-verify-tolerate-blips] WS-CD-deploy-verify-tolerate-blips: treat pure-connectivity health-probe timeouts as non-fatal
- Depends on: none

## Problem

Product owner (verbatim):

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

"The last merge" is PR #66 (`ws/ribbon-chart-button-visibility`), merged to
`main` as commit `aeb993e`. The PR's **CI** check passed; nothing about the
merge itself is broken. What went red is the **Deploy to Production** workflow
run the merge push triggered:

- `gh run view 28693590551` (Build & Deploy) shows every step **green** —
  Checkout, Install, Build, Test, Configure SSH, **Upload release to server**,
  **Activate release & restart service** — and only the final step,
  **"Verify deployment (public health check)"**, failed with `exit 1`.
- The failure log is 12 identical lines:
  `curl: (28) Connection timed out after 10002 milliseconds` → HTTP code `000`,
  for all 12 attempts. The runner never opened a TCP/TLS connection to
  `https://start.cacadets.org/healthz` at all — it got zero HTTP responses.
- The site is **live and healthy**: a probe right now returns `healthz → 200`
  and `/ → 200`, and the very next push to `main` (the WS-CC docs-contract
  commit, run `28693929249`) deployed green in 15s with the same verify step
  passing. So the release from PR #66 shipped fine; the job went red on a
  **false negative** — a transient GitHub-runner↔Linode-VPS reachability gap,
  not an app or deploy fault.

Root cause in code — `.github/workflows/deploy.yml`, the
**"Verify deployment (public health check)"** step (lines 200–225):

- The Activate step (`deploy.yml:136–198`) has **already** run
  `npm ci --omit=dev`, flipped the `current` symlink, and
  `sudo systemctl restart cacc-start` before verify runs. By the time verify
  executes, the new release is live.
- Line 216: `curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL"`
  has no `--connect-timeout` and does not force IPv4 (`-4`); a stalled connect
  burns the full `--max-time` and the retry window is only
  12 × (`--max-time 10` + `sleep 5`) ≈ 3 min — right at the observed blip
  length.
- Lines 215–225 (the actual defect): the loop makes **no distinction** between
  "the probe connected and the app answered non-200" (a real outage) and "the
  probe never connected at all" (`000`/timeout — a runner-side network
  problem). Both collapse to `exit 1`, so a pure connectivity blip red-fails a
  genuinely-live deploy. Fix #59 (`f04e24a`) deliberately replaced an
  SSH-based check with this public HTTPS probe because SSH re-connects were
  flaky; the probe is now the flaky step instead.

Pipeline is **not hard-locked**: the deploy concurrency group
(`deploy.yml:11–13`, `group: production-deploy`, `cancel-in-progress: false`)
does not block future runs, and the next push already deployed green.
"Unlocking" here means making this false-negative class of failure
non-fatal so a live release is never reported red again. Manually re-running
the failed job now would also go green (ops action, out of code scope).

Supporting facts (accurate to file:line):
- `/healthz` handler returns `200` JSON (`{status:'ok',uptime}`) →
  `src/server.js:27–31`.
- App port is `PORT` env, default `3000` → `src/server.js:13`; `listen` at
  `src/server.js:58`.
- The Activate step's SSH master uses `ControlPersist=180`
  (`deploy.yml:127`, `deploy.yml:169`), so the multiplexed connection stays
  warm and reusable during verify.

## Scope

Single file: **`.github/workflows/deploy.yml`** — modify **only** the
**"Verify deployment (public health check)"** step (lines 200–225). No app-code
or other-step changes.

1. Harden the curl probe (line 216): add `--connect-timeout 10` and `-4`
   (force IPv4); keep/raise `--max-time` (~20). Track whether *any* attempt
   received a real HTTP response versus only `000`/timeouts.
2. Widen the retry window past the observed ~3-min blip (e.g. ~18–20 attempts
   with modest backoff), logging each attempt as today.
3. Classify the outcome instead of blanket-failing:
   - Any attempt returns `200` → **pass** (unchanged).
   - Probe connected but returned a real non-200 (e.g. 502/503) → **fail**
     (app genuinely unhealthy).
   - Probe **never** got an HTTP response (all `000`/timeouts) — a runner↔VPS
     network problem, not an app problem — → emit `::warning::` and **pass**,
     since the Activate step already shipped a live release.
4. (Optional, non-blocking) Corroborate a connectivity-only pass with an
   on-server check over the **already-warm** multiplexed SSH master: re-declare
   the same `SSH_OPTS`/`ControlPath` from the Activate step (add `HOST`/`USER`/
   `PORT` to this step's `env`) and run
   `curl -fsS http://127.0.0.1:$PORT/healthz` (or `systemctl is-active
   cacc-start`) on the box; only fail if that also fails. Reusing the persisted
   master avoids a new handshake, so it does not reintroduce #59's flakiness.
   Shipping steps 1–3 alone is acceptable.
5. Update the step's leading comment to document the
   connectivity-vs-HTTP-error distinction and why a pure-connectivity timeout
   is non-fatal.

## Acceptance / DoD

- Build passes: `npm run lint` (`node --check`) and `npm test` (`node --test`)
  still green; `deploy.yml` remains valid YAML and the workflow parses (no
  schema/syntax errors).
- Contract followed: only the verify step is touched; no app-code changes.
- The verify step no longer exits non-zero when the deploy steps succeeded and
  the sole failures are pure-connectivity timeouts (`000`) — it warns and
  passes.
- A genuinely unhealthy app (probe connects, returns non-200) still fails the
  job.
- If the optional on-server corroboration is added, it reuses the existing warm
  `ControlPath` master (no fresh SSH handshake) and adds only the `env` it
  needs.
- Tests cover new code where applicable: this is a CI workflow file with no
  unit-testable runtime surface, so validation is lint + YAML parse + the next
  production deploy going green.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first:
docs/workstreams/WS-CD-deploy-verify-tolerate-blips.md

Work on branch ws/deploy-verify-tolerate-blips in worktree
cacc-ws-deploy-verify-tolerate-blips.

Scope: edit ONLY the "Verify deployment (public health check)" step in
.github/workflows/deploy.yml (lines ~200–225). The last merge's Deploy run went
red only because that step hard-failed on transient runner→VPS connectivity
timeouts (curl exit 28 / HTTP code 000) even though the Activate step had
already restarted the service and flipped `current` to a live, healthy release.
Harden the curl probe (--connect-timeout 10, force IPv4 -4, wider retry window)
and classify the outcome: pass on 200; FAIL only when the probe actually
connects and returns a real non-200; and when the probe never gets any HTTP
response (all 000/timeouts) but the deploy already shipped, emit a ::warning::
and pass instead of failing. Optionally corroborate via an on-server /healthz
check over the already-warm multiplexed SSH connection. Do not touch app code.

Build green; the orchestrator handles commit/push/PR.
```
