# WS-CE — Unlock the pipeline: don't red-fail a live deploy on a pure runner→VPS connectivity blip

- Branch: ws/deploy-verify-connectivity-nonfatal
- PR title: [ws/deploy-verify-connectivity-nonfatal] WS-CE-deploy-verify-connectivity-nonfatal: treat health-probe connect timeouts as non-fatal after a successful activate
- Depends on: none
- Relationship: **Duplicate requirement of WS-CC (`ws/resilient-deploy-health-check`) and WS-CD (`ws/deploy-verify-tolerate-blips`)**, both already on `main` as docs-only contracts for the *same* product-owner request and the *same* root cause. All three edit the one "Verify deployment" step in `deploy.yml` and will conflict. **Deploy-master: merge exactly ONE of {WS-CC, WS-CD, WS-CE} and close the other two.** This file documents the fix so the pipeline is unblocked even if CC/CD are never coded.

## Problem

Product owner (verbatim):

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

"The last merge" is PR #66 (`ws/ribbon-chart-button-visibility`), merged to
`main` as `aeb993e`. The PR's **CI** check passed — nothing about the merge
itself is broken. What went red is the **Deploy to Production** workflow run the
merge push triggered:

- `gh run view 28693590551` (Build & Deploy) shows every step green — Checkout,
  Install, Build, Test, Configure SSH, **Upload release to server**,
  **Activate release & restart service** — and only the final step,
  **"Verify deployment (public health check)"**, failed with `exit 1`.
- The failure log is 12 identical lines:
  `curl: (28) Connection timed out after 10002 milliseconds` → HTTP code `000`,
  for all 12 attempts (~3 min). The runner never opened a TCP/TLS connection to
  `https://start.cacadets.org/healthz` — it received zero HTTP responses.
- The site is **live and healthy**: a probe right now returns `healthz → 200`
  and `root → 200`, and the next two pushes to `main` (the WS-CC and WS-CD
  docs-contract commits, runs `28693929249` / `28694073215`) both deployed
  green in ~20s with the same verify step passing. So PR #66's release shipped
  fine; the job went red on a **false negative** — a transient GitHub-runner ↔
  Linode-VPS reachability gap, not an app or deploy fault.

Root cause in code — `.github/workflows/deploy.yml`, the
**"Verify deployment (public health check)"** step (lines 200–225):

- By the time verify runs, the **Activate** step (`deploy.yml:136–198`) has
  already run `npm ci --omit=dev`, flipped the `current` symlink
  (`deploy.yml:182`), and `sudo systemctl restart cacc-start`
  (`deploy.yml:185`). The new release is already live.
- `deploy.yml:216` — `curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL"`
  has no `--connect-timeout` and does not force IPv4 (`-4`); a stalled connect
  burns the whole 10s `--max-time`, and the retry window is only
  12 × (`--max-time 10` + `sleep 5`) ≈ 3 min — right at the observed blip length.
- `deploy.yml:215–225` (the actual defect) — the loop makes **no distinction**
  between "probe connected, app answered non-200" (a real outage) and "probe
  never connected" (`000`/exit-28 — a runner-side network problem). Both
  collapse to `exit 1`, so a pure connectivity blip red-fails a genuinely-live
  deploy. Fix #59 (`f04e24a`) deliberately swapped an SSH-based check for this
  public HTTPS probe because SSH re-connects were flaky; the probe is now the
  flaky step instead.

Supporting facts: `/healthz` handler → `src/server.js:27` (returns 200 JSON);
`server.listen(PORT…)` → `src/server.js:58`; `PORT` default 3000 →
`src/server.js:13`.

The pipeline is **not hard-locked**: the `production-deploy` concurrency group
(`deploy.yml:11–13`, `cancel-in-progress: false`) does not block future runs,
and the next push already deployed green. "Unlocking" means making this
false-negative class non-fatal so a live release is never reported red again.
(Re-running the failed job now would also go green — an ops action, out of code
scope.)

## Scope

Single file. Do **not** touch `src/`, tests, or any other workflow step.

- `.github/workflows/deploy.yml` — rewrite only the "Verify deployment (public
  health check)" step body (lines ~206–225), keeping the step name and the
  `HEALTH_URL` env:
  - Capture curl's exit status and the HTTP code separately (drop the `|| echo
    "000"` swallow). Add `--connect-timeout 10 -4` to the curl invocation.
  - **Success:** HTTP `200` → pass (`exit 0`), unchanged.
  - **Real failure:** the probe *connected* but returned a non-200 HTTP status
    (curl exit 22 with `-f`, or any real HTTP code ≠ 200) on the final attempt →
    keep `exit 1` (a genuine bad deploy must still fail).
  - **Non-fatal blip:** every attempt was a pure connectivity failure (curl exit
    28/7/6/35 — timeout/refused/DNS/TLS, code `000`) → after the retry loop
    exhausts, print a clear "⚠ could not reach the public endpoint from the
    runner; the release was already activated — treating as a network blip, not
    a deploy failure" warning and `exit 0`. Append the same warning to
    `$GITHUB_STEP_SUMMARY` so it's visible.
  - Widen the retry budget modestly (e.g. 18 attempts, `sleep 5`) so a real
    slow-start still gets a 200 before the non-fatal path is taken.
  - Keep `set -euo pipefail`; ensure the connectivity branch does not trip it.

## Acceptance / DoD

- `npm run lint` and `npm test` still pass (no `src/` change, but keep green).
- `deploy.yml` remains valid YAML; only the verify step body changes; step name
  and job structure unchanged.
- A run where the endpoint returns **200** still passes exactly as before.
- A run where **every** health probe is a connection timeout/refusal (code
  `000`) ends the job **green** with a visible warning in the log and step
  summary — reproducing PR #66's condition without red-failing.
- A run where the endpoint **connects but returns a non-200** still fails
  (`exit 1`) — a truly broken deploy is not masked.
- Contract followed: single-file change, WS metadata intact, no domain/secret
  hardcoded beyond the already-public `HEALTH_URL` default.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the WS contract at docs/workstreams/WS-CE-deploy-verify-connectivity-nonfatal.md and implement exactly that scope — no more.

Work on branch ws/deploy-verify-connectivity-nonfatal in worktree cacc-ws-deploy-verify-connectivity-nonfatal.

Scope: edit ONLY the "Verify deployment (public health check)" step in .github/workflows/deploy.yml (lines ~206–225). The release is already activated before this step runs, so the step must distinguish a real outage (probe connected but got a non-200 HTTP status → keep exit 1) from a pure runner→VPS connectivity blip (curl exit 28/000 with no HTTP response on every attempt → print a warning and exit 0 so a live deploy is not red-failed). A 200 still passes; widen the retry budget slightly and add curl --connect-timeout 10 -4. Do not touch src/, tests, or any other step. Note WS-CC and WS-CD are duplicate contracts for the same fix; the deploy-master will merge only one.

Build green; the orchestrator handles commit/push/PR.
```
