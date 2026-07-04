# WS-CL — Unlock the deploy pipeline: bound the job + don't red-fail an already-live release on a connectivity blip

- Branch: ws/deploy-unlock-connectivity-tolerant
- PR title: [ws/deploy-unlock-connectivity-tolerant] WS-CL-deploy-unlock-connectivity-tolerant: bound the deploy job so the concurrency lock always releases, and keep an activated release green on pure connectivity timeouts
- Depends on: none (supersedes the undelivered contracts WS-CC…WS-CK, which all describe this same fix but never landed in `.github/workflows/deploy.yml`)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The stale local checkout is at `#59` (`f04e24a`); the real state is `origin/main` (`b8d90c9`). Findings from `gh run list` and the failing-run logs:

- **`.github/workflows/deploy.yml` has NOT changed since `#59`.** `git log f04e24a..origin/main -- .github/workflows/` is empty. Nine "docs: contract for …" commits (WS-CC through WS-CK) each describe a fix for this exact deploy flakiness, but **none was ever implemented** — the workflow is untouched. The pipeline keeps re-flaking because no code fix has landed.
- **The last failed deploy** was run `28703534937` (WS-CJ, 2026-07-04T10:37). It died at the **"Upload release to server"** step, in the very first `ssh` (the `mkdir`): `Connection to *** port *** timed out`, then `ssh: connect to host *** port ***: Connection timed out` on all 4 retries → job exits 255. `deploy.yml:128` (the `retry ssh … mkdir`) is where it surfaces.
- **Root cause = intermittent TCP-level unreachability of the Linode host from GitHub runner IPs.** It is *not* auth, *not* fail2ban rate-limiting. Proof: the successful run `28703703368` connected instantly — "Upload" took 2s, "Activate" 2s, health check returned `200` on attempt 1 (`~17s` total). Failing runs burn `~2m35s` entirely inside the bounded SSH connect-timeout retries (`deploy.yml:52-64`, `123-134`). The `#59` connection-multiplexing change (`ControlMaster` at `deploy.yml:127`) cannot help — the failure is on the *first* connect, before any master session exists.
- **Why it reads as "locked":** the deploy job has a `concurrency` group `production-deploy` with `cancel-in-progress: false` (`deploy.yml:11-13`) and **no `timeout-minutes`** (job defined at `deploy.yml:18-24`). A run that hangs instead of exiting would hold that lock and stall every later deploy. Separately, every transient-connectivity red X blocks the perception (and the merge-queue signal) of a healthy pipeline.

### Honest boundary (what we do NOT paper over)

If the **"Upload release to server"** (`deploy.yml:90-134`) or **"Activate release & restart service"** (`deploy.yml:136-198`) steps never connect, nothing was uploaded or activated — the release genuinely did not deploy and the job **must stay red** (production correctly remains on the prior release; see the summary at `deploy.yml:227-234`). This WS only stops red-failing a release that *did* activate, and guarantees the lock always releases. It does not fake a green deploy.

## Root cause

Two independent defects in `.github/workflows/deploy.yml`, both unaddressed since `#59`:

1. The `deploy` job has no `timeout-minutes`, so under the non-cancelling `production-deploy` concurrency group a hung run can hold the lock indefinitely — the literal "locked pipeline."
2. The **"Verify deployment (public health check)"** step (`deploy.yml:200-225`) treats a pure runner→host connectivity timeout identically to a real bad HTTP status: after 12 attempts it always `exit 1`. But reaching this step means "Activate" already flipped the `current` symlink and restarted `cacc-start` (`deploy.yml:181-185`) — the release is live — so a transient outbound-HTTPS blip red-fails an already-deployed release.

## Scope

File-by-file changes (workflow only; no application code):

- **`.github/workflows/deploy.yml`**
  - In the `deploy` job block (`deploy.yml:18-24`), add `timeout-minutes: 15` (immediately under `runs-on: ubuntu-latest`, before/after `environment:`). Guarantees the `production-deploy` concurrency lock is always released — the "unlock."
  - Rework the retry loop in **"Verify deployment (public health check)"** (`deploy.yml:215-225`) so it distinguishes outcomes: capture each `curl` result and remember whether any attempt returned a **real HTTP status that was non-2xx** (e.g. `502`, `500`, `4xx`) versus **pure connectivity failure** (`curl` non-zero / code `000`). After the loop:
    - If a `200` was ever seen → success (unchanged behavior).
    - If any **real non-2xx** status was seen → `exit 1` (a genuinely broken app must still fail the deploy).
    - If **every** failure was pure connectivity (never got an HTTP status) → `echo` a clear WARNING that the release was activated but the post-deploy probe could not reach the endpoint, and `exit 0`. Because "Activate" already succeeded, the release is live; a transient probe blip must not red-fail it.
  - Keep "Upload release to server" and "Activate release & restart service" exactly as-is: they stay hard-fail on no-connect (see Honest boundary above).
  - Update the step's leading comment (`deploy.yml:206-214`) to document the new connectivity-vs-bad-status semantics so a future maintainer doesn't "fix" it back.

- **`docs/DEPLOYMENT.md`** (additive, if a "health check" / "troubleshooting" section exists): one short paragraph noting that a post-activate health probe that only sees connectivity timeouts is treated as a non-fatal warning (release stays live), while a real non-2xx from the app fails the deploy, and that the job is bounded by `timeout-minutes: 15`. Skip if no natural home; do not restructure the doc.

No changes to `ci.yml`, to `src/`, or to the SSH/upload/activate logic.

## Acceptance / DoD

- `npm ci`, `npm run lint`, `npm run build --if-present`, `npm test` all pass (CI green on the PR).
- `.github/workflows/deploy.yml` is valid YAML and the `deploy` job carries `timeout-minutes: 15`.
- The health-check step: passes on `200`; **fails** if the app returns a real non-2xx status; **warns and passes** only when every attempt was a pure connectivity timeout (no HTTP status ever obtained).
- "Upload release to server" and "Activate release & restart service" remain hard-fail on no-connect (a release that never uploaded/activated still shows red).
- Contract followed; comments in the workflow explain the new semantics. No secrets, hostnames, or ports hardcoded (all still come from `secrets.*`).

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CL-deploy-unlock-connectivity-tolerant.md

Work on branch ws/deploy-unlock-connectivity-tolerant in worktree cacc-ws-deploy-unlock-connectivity-tolerant.

Scope: edit only .github/workflows/deploy.yml (plus an optional additive note in docs/DEPLOYMENT.md). Add `timeout-minutes: 15` to the `deploy` job so the `production-deploy` concurrency lock always releases. Rework the "Verify deployment (public health check)" retry loop so it distinguishes a real non-2xx HTTP status (still `exit 1`) from a pure connectivity timeout after a successful activate (WARN and `exit 0`, because the release is already live); a `200` still passes. Do NOT touch the "Upload release to server" or "Activate release & restart service" steps — they must stay hard-fail on no-connect, and no secrets/hostnames may be hardcoded.

Self-verify: confirm the workflow is valid YAML and that the three health-check outcomes (200-pass, non-2xx-fail, connectivity-only-warn-pass) are correct before finishing.

Build green; the orchestrator handles commit/push/PR.
```
