# WS-CP — Unlock deploy pipeline: soft-fail the health check when the runner can't reach the host

- Branch: ws/deploy-healthcheck-soft-fail
- PR title: [ws/deploy-healthcheck-soft-fail] WS-CP-deploy-healthcheck-soft-fail: don't fail a live deploy when the runner-side health probe times out
- Depends on: none

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The "last merge failed" is the **Deploy to Production** workflow going red on
pushes to `main`. Evidence gathered live via `gh`:

- Latest deploy run `28705739793` (push of the WS-CO docs contract) **failed**
  at the **`Verify deployment (public health check)`** step:
  ```
  curl: (28) Connection timed out after 10001 milliseconds
  Attempt 1/12: https://start.cacadets.org/healthz → 000 … (all 12 attempts → 000)
  Health check FAILED: https://start.cacadets.org/healthz never returned 200
  ##[error]Process completed with exit code 1.
  ```
- The upload / activate / restart steps **succeeded** — the release was shipped
  and `cacc-start` restarted. Only the final public probe failed.
- The site is **actually up**: `curl https://start.cacadets.org/healthz` from
  outside the runner returns `200` (verified twice during this investigation;
  DNS → `45.33.48.83`). So the app is healthy; the GitHub runner simply cannot
  reach it.
- The failures scatter across steps that all open a socket to the Linode host —
  run `28703534937` timed out at **`Upload release to server`**
  (`ssh: connect to host *** port ***: Connection timed out`), others at the
  health probe. Common thread: **intermittent TCP "Connection timed out"
  between GitHub's Azure runners and the Linode host**, while the host serves
  everyone else fine. `docs/SERVER_SETUP.md` §8 shows only `ufw` (OpenSSH +
  Apache Full) — no fail2ban — so this is transient runner→host network / sshd
  connection-burst throttling, not an app outage.

Root cause of the *red pipeline* (as opposed to any real outage): the health
check treats **"no response at all" (curl exit 28 / HTTP `000`)** the same as a
**real bad HTTP status**, so a purely runner-side connectivity blip fails an
otherwise-successful, already-activated deploy and blocks the pipeline.

### Current code (origin/main `.github/workflows/deploy.yml`)

- Line 200 — `- name: Verify deployment (public health check)`
- Line 216 — `code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL" || echo "000")`
- Lines 217–220 — on `200`, `exit 0`
- Line 221 — per-attempt retry log
- Lines 224–225 — `echo "Health check FAILED…"` then unconditional `exit 1`

## Root cause

`.github/workflows/deploy.yml` line 225 fails the whole deploy job on *any*
unsuccessful health probe, without distinguishing:
- **Received an HTTP response but not 200** (e.g. `502`/`500`) → app is genuinely
  broken → should stay a hard failure.
- **Received no response at all** (`000` / connection timed out on every
  attempt) → runner can't reach the host; the release already activated
  successfully server-side → should be a non-fatal warning, not a pipeline lock.

## Scope

**Primary — `.github/workflows/deploy.yml`, `Verify deployment (public health
check)` step (lines ~200–225):**
- Track, across the 12 attempts, whether *any* attempt received a real HTTP
  status (i.e. `code` was not `000`).
- Keep the existing behavior: a `200` → log success and `exit 0`.
- After the loop, branch instead of the unconditional `exit 1`:
  - If at least one attempt returned a non-`000` status but never `200`
    (persistent `5xx`/`4xx`) → keep `exit 1` (app is unhealthy).
  - If *every* attempt was `000` (connection-level failure, never reached the
    app) → emit a GitHub `::warning::`, append a note to `$GITHUB_STEP_SUMMARY`
    that the release is activated but the runner could not reach the public URL
    (transient runner↔host connectivity), and `exit 0` so the deploy is not
    blocked.
- Do **not** weaken the SSH `Upload`/`Activate` steps — a real upload timeout
  means nothing shipped and must stay a hard failure. (Optional, bounded: you
  may lengthen those steps' `retry` backoff so the total window better spans a
  transient throttle, but keep `max`/`delay` finite and do not swallow their
  final failure.)

**Secondary (additive docs) — `docs/SERVER_SETUP.md`:** add a short
"Deploy troubleshooting — intermittent Connection timed out" subsection near §8
noting the permanent, human-side fixes that are out of the workflow's reach:
raise sshd `MaxStartups`, avoid `ufw`/rate-limiting the deploy source (or
whitelist GitHub Actions runner IP ranges), and the option of a pull-based
deploy. Additive prose only — do not change any setup commands.

No product/runtime code changes; `src/` and `test/` are untouched.

## Acceptance / DoD

- `npm test` and `npm run lint` stay green (no `src/`/`test/` changes; the node
  test suite does not cover workflow YAML).
- `.github/workflows/deploy.yml` remains valid YAML and the health-check step:
  - still passes on `200`,
  - **soft-fails (exit 0 + warning)** when every attempt is `000`,
  - **still hard-fails (exit 1)** when a real non-200 HTTP status is received.
- SSH upload/activate steps still hard-fail on genuine failure.
- Contract followed: change confined to the deploy workflow (+ additive docs
  note); no domain/host/secret hardcoded beyond the existing public
  `start.cacadets.org` health URL.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CP-deploy-healthcheck-soft-fail.md

Work on branch ws/deploy-healthcheck-soft-fail in worktree cacc-ws-deploy-healthcheck-soft-fail.

Scope: In .github/workflows/deploy.yml, change ONLY the "Verify deployment (public
health check)" step so the deploy is not failed by a purely runner-side
connectivity blip. Track whether any of the 12 probe attempts got a real HTTP
status: a 200 passes (exit 0); if every attempt was "000" (curl connection
timeout, app never reached) emit a ::warning::, note it in $GITHUB_STEP_SUMMARY,
and exit 0 since the release already activated; but if a real non-200 status
(e.g. 5xx) came back, keep exit 1. Do NOT weaken the SSH upload/activate steps.
Additionally add a short additive "intermittent Connection timed out"
troubleshooting note to docs/SERVER_SETUP.md near the firewall section. Do not
touch src/ or test/.

Build green; the orchestrator handles commit/push/PR.
```
