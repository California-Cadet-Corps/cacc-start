# WS-CK — Deploy pipeline: fail a merge only on real breakage, not a transient connectivity blip

- Branch: ws/deploy-connectivity-resilience
- PR title: [ws/deploy-connectivity-resilience] WS-CK-deploy-connectivity-resilience: make the production deploy green unless SSH never connects or the app returns a real non-2xx, and bound the job so a hung run releases the lock
- Depends on: none (builds directly on the `#59` deploy-hardening in `f04e24a`; this is the first workstream to actually change `deploy.yml` — the contract-only WS-CC…WS-CJ never landed an implementing PR, so `deploy.yml` on `main` is still the `#59` version)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

This session had live GitHub Actions (`gh`) access and probed production live, so
the findings below are from actual run logs, not inference.

**Finding 0 — the site and the app are healthy; this is purely CI deploy
flakiness.** Live now: `curl https://start.cacadets.org/healthz` → `200` and
`/` → `200`. The `/healthz` route is correct at `src/server.js:27-31`.
`package.json` / `package-lock.json` are in sync (zero-dependency app), so
`npm ci` / `npm run lint` / `npm test` are green. Re-running the last commit
through CI would pass. The merge gate is the separate **CI** workflow
(`.github/workflows/ci.yml`), which is passing on every branch — so nothing
actually blocks merging. The "failed merge" the PO sees is a red ❌ on the
**Deploy to Production** workflow that runs on every push to `main`.

**Finding 1 — root cause: a transient runner→Linode "Connection timed out"
that red-fails an otherwise-fine deploy, landing on EITHER of two steps.** The
TCP connection from the GitHub-hosted runner to the Linode host intermittently
times out; whichever step is mid-connection when the blip hits is the one that
fails:
- **Latest failing run `28703534937`** (deploying the WS-CJ contract commit,
  2026-07-04T10:37) failed at **`Upload release to server`**
  (`.github/workflows/deploy.yml:90-134`): all 4 retries logged
  `ssh: connect to host *** port ***: Connection timed out` →
  `Process completed with exit code 255`. The blip outlasted the ~35s
  retry window (4 attempts, 5→10→20s backoff).
- **Last real merge — PR #66, run `28693590551`** failed at the
  **`Verify deployment (public health check)`** step
  (`.github/workflows/deploy.yml:200-225`): all 12 probe attempts logged
  `curl: (28) Connection timed out … → 000000` → `exit 1` — even though the
  earlier SSH steps had already flipped the `current` symlink
  (`deploy.yml:182`) and run `sudo systemctl restart cacc-start`
  (`deploy.yml:185`), i.e. **the release was already live**.
- **Contrast:** runs that connect finish green in ~17-20s; failing runs burn
  the full ~3 min retry/probe loop. The only variable is whether the runner can
  reach the host during that window. `#59` hardened the SSH path (multiplexing +
  `ConnectTimeout=15` + 4× backoff) but the blips regularly outlast its window,
  and the health probe added no fail-open at all.

**Finding 2 — the health probe conflates "app is broken" with "can't connect,"
and treats both as fatal.** `deploy.yml:216` is
`code=$(curl -fsS -o /dev/null -w '%{http_code}' … || echo "000")`. With `-f`,
a real bad status (e.g. `502`) makes `curl` exit non-zero, so `|| echo "000"`
*appends* `000` (yielding `502000`), and a pure no-connect yields `000000`. A
genuine 5xx regression (release IS broken — should fail) and a transient connect
timeout (release is fine — should pass) are indistinguishable, and both
unconditionally `exit 1` at `deploy.yml:224-225`.

**Finding 3 — the "unlock" ask: a hung deploy has no upper bound.** The workflow
serializes deploys with `concurrency: { group: production-deploy,
cancel-in-progress: false }` (`deploy.yml:11-13`) and the `deploy` job
(`deploy.yml:19-24`) has **no `timeout-minutes`** (GitHub default 360 min). No
hung run is in the current evidence (failures complete in ~3 min), but with no
bound a future wedged deploy (stalled `rsync`, blocked remote `npm ci`, hung
`systemctl restart`) would hold the `production-deploy` group and stall every
queued deploy. Bounding the job removes that latent lock.

## Root cause

The Deploy workflow marks a merge failed on a **transient runner↔host TCP
connectivity blip** — a condition that means neither "the release didn't deploy"
nor "the app is broken." The two delivery steps (SSH upload/activate) give up
too soon, and the verification step fails-closed on a no-connect signal it
should treat as inconclusive, so an already-activated, healthy release is
reported red.

## Scope

All changes are in **`.github/workflows/deploy.yml`** only (the app, CI workflow,
and docs are untouched):

1. **`deploy` job (around `deploy.yml:19-21`)** — add `timeout-minutes: 20` to
   the job so a wedged run is killed and releases the `production-deploy`
   concurrency lock instead of holding it for the 360-min default. (20 min is
   generous: a healthy deploy is ~20s.)

2. **`Upload release to server` + `Activate release & restart service` retry
   loops (`deploy.yml:90-134` and `136-198`)** — these deliver the release and
   MUST NOT fail-open (if SSH never connects, nothing shipped). Widen the shared
   `retry` helper so it survives a multi-minute blip instead of ~35s: raise
   `max` from 4 to 6 and cap the exponential backoff (e.g. `delay` doubles but is
   clamped, ~5→10→20→40→60→60s ≈ 3 min window). Keep the existing SSH
   multiplexing and `ConnectTimeout`. Apply the same widened helper to both steps
   (they each define their own copy).

3. **`Verify deployment (public health check)` step (`deploy.yml:200-225`)** —
   rewrite the probe to distinguish three outcomes and fix the exit-code
   conflation bug:
   - Capture curl's exit code and HTTP code separately — drop the ambiguous
     `|| echo "000"` append (do not use `-f`; read `%{http_code}` and `$?`).
   - **HTTP 200** → pass (`exit 0`), unchanged.
   - **Connected but non-2xx** (a real `4xx`/`5xx` from the app) → the release is
     genuinely broken; keep retrying and, if it persists across all attempts,
     **fail (`exit 1`)** with a clear "app returned <code>" message. Track that we
     saw at least one real HTTP response.
   - **Never connected** across all attempts (curl exit 7/28/35, code `000`) →
     the prior `Activate release` step already flipped the symlink and restarted
     the service, so the release is live; **fail-open**: log a loud
     `::warning::` that the post-deploy probe could not reach the host and
     `exit 0`. Do not turn a runner-side network blip into a red merge.
   - Update the step's leading comment to describe this fail-open-on-connectivity
     / fail-closed-on-bad-status contract.

4. **`Deployment summary` step (`deploy.yml:227-234`)** — no logic change needed;
   confirm the summary still reads correctly when the job succeeds via the
   fail-open path (it keys off `job.status`, which will be `success`).

## Acceptance / DoD

- `npm run lint` and `npm test` remain green (the app is untouched — this is a
  workflow-only change).
- `.github/workflows/deploy.yml` is valid YAML and the modified `run:` blocks are
  shell-clean (`bash -n`; no `shellcheck` errors on the retry/probe logic).
- Behavior contract holds by construction:
  - a deploy where SSH never connects within the widened (~3 min) window still
    fails (nothing shipped) — no false green;
  - a deploy where the app answers with a real `5xx`/`4xx` still fails — no false
    green;
  - a deploy that activates the release but then hits a transient runner→host
    connect timeout on the public probe is **green** with a warning — the bug the
    PO hit;
  - the `deploy` job has `timeout-minutes` set, so a hung run cannot hold the
    `production-deploy` lock indefinitely.
- The real end-to-end signal is the merge of this PR itself: merging to `main`
  triggers a live Deploy run, which must end green (either a clean deploy or the
  fail-open path), unlocking the pipeline.
- Contract followed; no unrelated files changed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CK-deploy-connectivity-resilience.md

Work on branch ws/deploy-connectivity-resilience in worktree cacc-ws-deploy-connectivity-resilience.

Scope (workflow-only, edit .github/workflows/deploy.yml and nothing else): the
Deploy to Production workflow red-fails merges on transient runner↔Linode
"Connection timed out" blips even though production stays healthy. (1) Add
timeout-minutes: 20 to the deploy job so a hung run releases the
production-deploy concurrency lock. (2) Widen the shared retry helper in BOTH
SSH steps (Upload release, Activate release) from 4 to 6 attempts with capped
backoff (~3 min window) so real blips are ridden out — these steps must still
fail if SSH never connects. (3) Rewrite the "Verify deployment" step to
distinguish outcomes: HTTP 200 passes; a connected non-2xx (real app breakage)
fails; but a pure never-connected result (curl exit 7/28/35, code 000) fails
OPEN with a ::warning:: because the release was already activated — do not
red-fail a network blip. Drop the ambiguous `|| echo "000"` append and read
curl's exit code separately.

Self-verify: `npm run lint` and `npm test` stay green (app untouched); `bash -n`
on deploy.yml passes; the three failure/success cases above are each handled
explicitly.

Build green; the orchestrator handles commit/push/PR.
```
