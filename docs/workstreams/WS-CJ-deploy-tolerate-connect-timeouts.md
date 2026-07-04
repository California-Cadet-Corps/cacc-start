# WS-CJ — Unlock the deploy pipeline: tolerate transient connect timeouts on both SSH and the health probe, and bound the deploy job

- Branch: ws/deploy-tolerate-connect-timeouts
- PR title: [ws/deploy-tolerate-connect-timeouts] WS-CJ-deploy-tolerate-connect-timeouts: don't red-fail an already-activated deploy on a transient runner→host connect timeout (SSH exit 255 or curl exit 28), and add a job timeout so a hung run releases the lock
- Depends on: none (builds directly on `#59` deploy-hardening in `f04e24a`; supersedes the contract-only workstreams WS-CC…WS-CI, none of which changed `deploy.yml` — verified below)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

This session had live GitHub Actions (`gh`) access; findings are from actual run
logs plus a live production probe, not inference.

**Finding 0 — the site itself is healthy; this is purely CI deploy flakiness.**
Live now: `curl https://start.cacadets.org/healthz` → `200` and `/` → `200`. The
`/healthz` route is present and correct at `src/server.js:26-31` (returns
`200 {"status":"ok",…}`). `package.json`/`package-lock.json` are in sync, so
`npm ci`/lint/test are green. Re-running the last commit through CI would pass.

**Finding 1 — the failure is a transient runner→Linode "Connection timed out"
that lands on TWO different steps across runs.** The prior contracts (WS-CH,
WS-CI) diagnosed only the health-check surface; the live logs show it also hits
the SSH surface, which those contracts would not have prevented:

- **Last real merge — PR #66 → deploy run `28693590551` FAILED** at the
  **`Verify deployment (public health check)`** step
  (`.github/workflows/deploy.yml:200-225`): all 12 probe attempts logged
  `curl: (28) Connection timed out after 10002 milliseconds` → code `000000` →
  `Health check FAILED … never returned 200` → `exit 1`.
- **Most recent failing deploy — WS-CH push → run `28701859348` FAILED** at an
  **SSH step** (`Upload release to server` / `Activate release`,
  `.github/workflows/deploy.yml:90-198`): all 4 retries logged
  `ssh: connect to host *** port ***: Connection timed out` →
  `Process completed with exit code 255`. This is the SSH path `#59` hardened
  (multiplexing + `ConnectTimeout=15` + 4× exponential-backoff `retry`) yet the
  blip outlasted the ~35s retry window.
- **Contrast — runs that connect succeed in ~17-20s** (e.g. run `28701746788`),
  vs. ~3 min for the failing runs (the failing runs burn the full retry/probe
  loop). The only variable is whether the runner can reach the host during that
  window; the deploy machinery itself (rsync + `npm ci --omit=dev` + restart of
  a zero-dependency static Node app) is near-instant.

**Finding 2 — the health probe cannot distinguish "site is broken" from "can't
connect," and treats both as fatal.** `deploy.yml:216` is
`code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL" || echo "000")`.
With `-f`, a real bad status (e.g. `502`) makes `curl` exit non-zero, so the
`|| echo "000"` *appends* `000` (producing `502000`), and a pure no-connect
yields `000000` (seen in the #66 log). A genuine 5xx regression and a transient
connect timeout are conflated, and the step unconditionally `exit 1`s
(`deploy.yml:224-225`) — even though `Activate release` already flipped the
`current` symlink (`deploy.yml:182`) and ran `systemctl restart cacc-start`
(`deploy.yml:185`) successfully, i.e. the release is already live.

**Finding 3 — the "locked" symptom: a hung deploy has no upper bound.**
`deploy.yml` serializes deploys with
`concurrency: { group: production-deploy, cancel-in-progress: false }`
(`deploy.yml:11-13`) and the `deploy` job (`deploy.yml:18-24`) has **no
`timeout-minutes`** (`grep -n timeout-minutes .github/workflows/deploy.yml`
returns nothing; GitHub default is 360 min). No wedged run appears in current
evidence (failures complete in ~3 min), but with no bound a future stalled run
(hung `rsync`, wedged control-master socket, blocked remote `npm ci`/`systemctl`)
would hold the `production-deploy` group for up to 6 hours and queue every later
deploy — the literal "locked pipeline." Bounding the job removes that latent lock.

**Not the cause (verified — do NOT change):** app code is green (`/healthz`
exists; `GET /healthz returns ok` test passes every run); `npm ci`/lint/test
pass; no merge-conflict markers; the concurrency serialization itself is correct.

## Root cause

Intermittent connection-level timeouts between the GitHub-hosted runner and the
production Linode host red-fail an otherwise-successful deploy on whichever
network-bound step happens to be running when the blip occurs — the SSH
upload/activate steps (`ssh` exit 255, `.github/workflows/deploy.yml:90-198`) or
the final public health probe (`curl` exit 28 / code `000`,
`deploy.yml:200-225`). The health probe additionally treats a pure no-connect as
identical to a bad HTTP status and hard-fails even though the release is already
activated. Compounding both, the `deploy` job has no `timeout-minutes`, so a
genuinely hung run could indefinitely hold the non-cancelling `production-deploy`
concurrency group.

## Scope

Single file: **`.github/workflows/deploy.yml`** (no app-code changes).

1. **Bound the job so a hung run always releases the lock.** Add
   `timeout-minutes` to the `deploy` job (near `deploy.yml:19-24`) — a small
   bound (e.g. `15`) comfortably above a healthy ~20s deploy but far below the
   360-min default. This is the guaranteed "unlock."

2. **Widen the transient-connect tolerance on the SSH steps** (`Upload release`
   `deploy.yml:90-134` and `Activate release` `deploy.yml:136-198`), since the
   most recent failure exhausted the current window there. Increase the `retry`
   ceiling (e.g. `max` 4→6) and/or the per-connection `ConnectTimeout`
   (`deploy.yml:124,166`, 15→~30) so a multi-second blip is ridden out rather
   than failing the merge. Keep total work inside the new `timeout-minutes`
   bound; do not weaken `BatchMode`/`known_hosts` safety from `#59`.

3. **Make the public health probe fail-open on a pure connect timeout, but stay
   fail-closed on a real bad status** (`Verify deployment`,
   `deploy.yml:200-225`). Capture `curl`'s exit status separately from the HTTP
   code (drop the `-f` + `|| echo "000"` conflation on `deploy.yml:216`): a
   `200` still passes immediately; a genuine HTTP status `>= 400` (502/503/500)
   still hard-fails; but if every attempt is a pure no-connect (`curl` exit 28 /
   no HTTP status) — carrying zero signal about app health, after the release was
   already activated — log a clear warning and exit `0` instead of `exit 1`.
   Keep the retry loop; only the terminal all-timeouts branch changes.

## Acceptance / DoD

- `npm run build --if-present`, `npm run lint`, and `npm test` are green (app
  code unchanged; CI unaffected).
- `.github/workflows/deploy.yml` is valid YAML and the `deploy` job carries a
  `timeout-minutes` bound.
- A transient runner→host connect timeout on the SSH steps is ridden out by the
  widened retry window; a sustained one still fails cleanly within the job bound
  (never holding the `production-deploy` lock past `timeout-minutes`).
- The health-probe step: passes on `200`; **fails** on a real HTTP status
  `>= 400`; **does not** fail on an all-attempts pure connect timeout (exit 28 /
  code `000`) — it logs a warning and succeeds, because the release was already
  activated. The `-f`/`|| echo "000"` status-vs-code conflation is removed.
- No change to production behavior, hostnames, secrets, or the concurrency group
  semantics; contract followed; comments explain each change.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CJ-deploy-tolerate-connect-timeouts.md

Work on branch ws/deploy-tolerate-connect-timeouts in worktree cacc-ws-deploy-tolerate-connect-timeouts.

Scope (single file, .github/workflows/deploy.yml — no app-code changes): (1) add a
`timeout-minutes` bound to the `deploy` job so a hung run always releases the
`production-deploy` concurrency lock; (2) widen the SSH steps' transient-connect
tolerance (raise the `retry` ceiling and/or `ConnectTimeout`) so a runner→host
"Connection timed out" blip is ridden out instead of failing the merge, without
weakening the BatchMode/known_hosts safety from #59; (3) make the final public
health probe fail-open on a pure connect timeout (curl exit 28 / code 000, after
the release is already activated) while still hard-failing on a real HTTP status
>= 400, and remove the `-f` + `|| echo "000"` status-vs-code conflation.

Self-verify: the site is already healthy — this only makes the deploy workflow
tolerant of transient runner→Linode connectivity blips and bounded in time.
Keep 200→pass and >=400→fail; only the all-timeouts terminal branch changes.

Build green; the orchestrator handles commit/push/PR.
```
