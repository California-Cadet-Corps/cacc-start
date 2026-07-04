# WS-CH — Deploy health probe tolerates a pure connect timeout (unlock the pipeline)

- Branch: ws/deploy-probe-connect-timeout-tolerant
- PR title: [ws/deploy-probe-connect-timeout-tolerant] WS-CH-deploy-probe-connect-timeout-tolerant: don't red-fail an activated deploy on a transient public-probe connect timeout, and bound deploy time
- Depends on: none (builds directly on `#59` deploy-hardening in `f04e24a`; supersedes the unimplemented contract-only workstreams WS-CC…WS-CG, none of which changed `deploy.yml`)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

This session had live GitHub Actions access, so the failure was traced to the
actual run logs (prior contracts WS-CC…WS-CG could not reach `gh`/Actions and
reasoned from the tree only). Findings:

**Finding 1 — the app on `main` is green; the failure is in the deploy
machinery, not the site.** The production site is currently reachable
(`curl https://start.cacadets.org/healthz` → `200`, `/` → `200`). The
`/healthz` route is present and correct at `src/server.js:26-31`
(returns `200 {"status":"ok",…}`). `package.json` / `package-lock.json` are in
sync, so `npm ci` / `lint` / `test` pass. Re-running the last commit through CI
would be green.

**Finding 2 — root cause: the last merge's deploy failed at the public
health-check step on a pure outbound connect timeout, AFTER a successful
release activation.** The last failing merge was **PR #66**
(Deploy run `28693590551`). It failed in the
**"Verify deployment (public health check)"** step
(`.github/workflows/deploy.yml:200-225`) with, on every one of 12 attempts:

> `curl: (28) Connection timed out after 10002 milliseconds`
> `Attempt N/12: https://start.cacadets.org/healthz → 000000; retrying in 5s…`
> `Health check FAILED … never returned 200` → `exit 1`

By that point the earlier steps had already succeeded: the release was
`rsync`ed (`deploy.yml:90-134`), the `current` symlink flipped, and
`sudo systemctl restart cacc-start` run (`deploy.yml:170-198`). The deploy was
*live*; only the runner→production **outbound HTTPS probe** timed out for that
~60s window — the same transient "Connection timed out" class that `#59`
hardened on the SSH path but left exposed on this probe.

**Finding 3 — the probe cannot even distinguish "site is broken" from "can't
connect."** The current line is
`code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL" || echo "000")`
(`deploy.yml:216`). With `-f`, a real bad status (e.g. `502`) makes `curl`
exit non-zero, so the `|| echo "000"` *appends* `000` to the written-out code —
producing values like `500000`, and a pure no-connect produces `000000` (seen
in the log). A genuine 5xx regression and a transient connect timeout are thus
conflated, and both hard-fail the job.

**Finding 4 — secondary (belt-and-suspenders): a hung deploy could lock the
queue.** `deploy.yml` uses
`concurrency: { group: production-deploy, cancel-in-progress: false }`
(`deploy.yml:11-13`) and the `deploy` job has **no `timeout-minutes`**
(`deploy.yml:18-24`; `grep -n timeout-minutes .github/workflows/deploy.yml`
returns nothing). GitHub's default job timeout is 360 min, so a wedged run
(stalled `rsync`, blocked `npm ci --omit=dev`, hung `systemctl restart`) would
hold the group for up to 6 hours and queue every later deploy — the literal
"locked pipeline." This was not the cause of the #66 failure, but bounding it
is the cheap, correct guarantee that a stuck run always releases the lock.

## Root cause

The final `Verify deployment (public health check)` step fails the entire
production deploy on a *pure outbound connectivity timeout* (`curl` exit 28 /
HTTP `000`) to `https://start.cacadets.org/healthz`, even though the release was
already rsynced, symlinked, and the service restarted successfully. A transient
network blip between the GitHub-hosted runner and the production host therefore
red-fails an otherwise-successful, live deploy. Compounding this, `-f` plus
`|| echo "000"` makes the step unable to tell a real bad HTTP status from a
no-connect, and the job has no `timeout-minutes`, so a genuinely hung deploy
could additionally hold the `production-deploy` concurrency lock.

## Scope

Single file: **`.github/workflows/deploy.yml`**.

1. **Bound deploy time so a hung run always releases the lock** — add
   `timeout-minutes: 15` to the `deploy` job (`deploy.yml:18-24`, alongside
   `runs-on`). Optionally add a step-level `timeout-minutes` to the two
   long SSH steps (`Upload release…` and `Activate release…`). Do not change
   the `concurrency` block.

2. **Make the public health probe distinguish a bad status from a no-connect**
   in the `Verify deployment (public health check)` step (`deploy.yml:200-225`):
   - Drop `-f` and capture `curl`'s real exit code and the HTTP code separately,
     e.g. run `curl -sS -o /dev/null -w '%{http_code}' --max-time 10` and read
     its exit status into a variable (do not pollute the code with `|| echo`).
   - If the probe returns HTTP `200` → pass (unchanged, `exit 0`).
   - If the probe returns a real non-200 HTTP status (curl connected: exit 0
     but code ≠ 200, e.g. `502`/`500`/`404`) → this is a genuine bad deploy →
     **fail** (`exit 1`) as today.
   - If every attempt is a pure connect/transport failure (curl exit `7`/`28`,
     code `000`) across the full retry budget → the release already activated,
     so **do not red-fail**: log a clear warning to `$GITHUB_STEP_SUMMARY`
     ("release activated; public probe could not connect — verify manually")
     and `exit 0`. Keep the existing 12-attempt / 5s-sleep retry loop as the
     budget before deciding.

3. **Keep the `Deployment summary` step accurate** (`deploy.yml:227-234`): when
   the probe is tolerated, the summary should reflect "deployed, probe
   unverified" rather than a plain success, so a real outage is still visible.

No application/source changes; `src/`, `package.json`, `test/` untouched.

## Acceptance / DoD

- `.github/workflows/deploy.yml` is valid YAML and the `deploy` job carries a
  `timeout-minutes` bound.
- The `Verify deployment` step: passes on `200`; **fails** on a real non-200
  HTTP status; is **non-fatal** when every attempt is a pure connect timeout
  (`000`) — verified by reasoning through the three branches (and, if practical,
  a shell dry-run of the branch logic with stubbed `curl` exit codes).
- `npm run lint` and `npm test` remain green (unchanged app; `node --check`
  and `node --test` unaffected by the workflow edit).
- Contract followed: only `.github/workflows/deploy.yml` changes; no domain,
  host, port, or secret is hardcoded beyond the already-public
  `start.cacadets.org` URL already present in the file.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CH-deploy-probe-connect-timeout-tolerant.md

Work on branch ws/deploy-probe-connect-timeout-tolerant in worktree cacc-ws-deploy-probe-connect-timeout-tolerant.

Scope (self-verify against the contract): edit ONLY .github/workflows/deploy.yml.
(1) Add `timeout-minutes: 15` to the `deploy` job so a hung run releases the
`production-deploy` concurrency lock. (2) Rework the "Verify deployment (public
health check)" step so it distinguishes a real non-200 HTTP status (still fail)
from a pure connect/transport timeout (curl exit 7/28, HTTP 000) — the latter is
NON-fatal after the retry budget because the release was already rsynced,
symlinked and restarted; log a clear "probe unverified" warning to
$GITHUB_STEP_SUMMARY and exit 0. Drop `-f` and stop appending `|| echo "000"` so
the HTTP code isn't polluted. Keep the summary step honest about the tolerated
case. Do not touch src/, package.json, or the concurrency block.

Build green; the orchestrator handles commit/push/PR.
```
