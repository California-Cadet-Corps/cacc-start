# WS-CO — Unlock the deploy pipeline: guard the trigger, bound the job, fail-open on connectivity blips

- Branch: ws/deploy-pipeline-config-hardening
- PR title: [ws/deploy-pipeline-config-hardening] WS-CO-deploy-pipeline-config-hardening: skip docs-only deploys, add a job timeout, widen connect retries, and keep an already-live release green on pure runner→host connectivity timeouts
- Depends on: (none — edits `.github/workflows/deploy.yml` on `main` as it stands today at commit f04e24a / PR #59)

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The "pipeline" is the **Deploy to Production** workflow,
`.github/workflows/deploy.yml`, which runs on every push to `main`, ships the site to
the Linode host over SSH (`Configure SSH` → `Upload` → `Activate`), then verifies via a
public HTTPS health check.

**Key finding — the fix has never actually landed.** `git diff f04e24a origin/main --
.github/workflows/deploy.yml` is **empty**: despite twelve prior contract commits
(WS-CC through WS-CN) all targeting this exact flakiness, every one is a docs-only
`docs: contract for …` push. The deploy workflow on `main` today is byte-for-byte the
version merged in PR #59. So the SSH client hardening (retries + connection
multiplexing + public HTTPS probe) is present, but the four workflow-config gaps below
are all still unimplemented. This WS re-states them as one concrete, land-able change.

Confirmed from the live Actions runs (`gh run list`) — all failures are pure
runner↔host connectivity DROPs, not logic bugs:

- **When the runner can reach the host, the whole path finishes green in ~15–20s**
  (runs `28705447758`, `28703703368`). The deploy body itself is not the problem; the
  only variable is whether the runner can open the socket.
- **Upload-step failure** — run `28703838530` (2m52s red): the `ssh` in
  *Upload release to server* (`deploy.yml:128-129`) exhausts all 4 retries with
  `ssh: connect to host … Connection timed out` (exit 255).
- **Verify-step failure** — the last *code* merge, PR #66 (run `28693590551`, 3m16s
  red): *Activate* succeeded (release went live) but *Verify deployment*
  (`deploy.yml:215-225`) red-failed because every probe returned `curl (28)` / HTTP
  `000`. A live release was marked failed purely on a network blip.
- **The trigger fires on commits that ship nothing.** `deploy.yml:6-8`
  (`on: push: branches:[main]`) has **no `paths-ignore`**, so each architect
  `docs: contract for …` commit that touches only `docs/workstreams/*.md` fires a full
  production SSH deploy. The recent runs are almost all such docs-only pushes,
  alternating success/failure on connectivity luck — which is what makes `main` look
  "locked"/red half the time.
- **No job timeout.** The `deploy` job (`deploy.yml:19-24`) has no `timeout-minutes`,
  and the concurrency group `production-deploy` uses `cancel-in-progress: false`
  (`deploy.yml:11-13`), so a wedged run would hold the lock and block later deploys.

## Root cause

`deploy.yml` deploys to production on **every** push to `main` (including no-op docs
commits) and treats **any** runner↔host connectivity timeout as a deploy failure —
even after the release has already been activated. Combined with a short 4-try connect
window and no job timeout, intermittent TCP DROPs between GitHub runners and the Linode
host repeatedly paint `main` red, giving the appearance of a locked pipeline.

## Scope

Single file: **`.github/workflows/deploy.yml`**. No application / `src` / `test`
changes; SSH options, multiplexing, and the deploy body stay as they are.

1. **Skip docs-only pushes** — `deploy.yml:6-8`: add a `paths-ignore` list to the
   `push` trigger so commits touching only non-shippable paths don't deploy. Ignore at
   least `docs/**`, `**/*.md`, `LICENSE`, `.editorconfig`, `.gitattributes`. Do **not**
   ignore `.github/workflows/**`, `src/**`, `test/**`, `package*.json`, or `.nvmrc`
   (those must still deploy).

2. **Bound the job** — `deploy.yml:19-24`: add `timeout-minutes: 15` to the `deploy`
   job so a wedged run always releases the `production-deploy` concurrency lock.

3. **Widen the connect retry window** — the shared `retry()` helpers in *Upload*
   (`deploy.yml:99-111`) and *Activate* (`deploy.yml:145-157`) use `max=4 delay=5`
   (~35s total). Raise to ride out a multi-minute connect gap (e.g. `max=6`, exponential
   `delay` capped near 60s) while staying under the new 15-min job timeout. Confine
   edits to these two helpers.

4. **Keep an activated release green on a pure verify-timeout** — *Verify deployment*
   (`deploy.yml:206-225`): today the loop exits 1 whenever the probe never returns 200,
   including when every attempt was a pure connect timeout (curl exit `28` / code `000`).
   Change the final decision so a real HTTP response with a non-2xx status is still a
   hard failure, but if **every** attempt was a pure connectivity timeout (no HTTP
   status ever received) **and** *Activate* succeeded, emit a loud warning to
   `$GITHUB_STEP_SUMMARY` and exit 0. Do not weaken detection of a genuine bad status.

5. **Summary accuracy** — *Deployment summary* (`deploy.yml:227-234`): when the verify
   step took the fail-open path, the summary should read "deployed; health check
   unverified (runner connectivity)" rather than a plain success line.

## Acceptance / DoD

- `npm run build --if-present` and `npm test` still pass (app untouched).
- `deploy.yml` is valid YAML and the workflow parses on GitHub (no schema errors).
- A push that changes only `docs/**` or a `*.md` file does **not** trigger Deploy to
  Production.
- A push that changes `src/**`, `test/**`, `package*.json`, `.nvmrc`, or
  `.github/workflows/**` **does** trigger it.
- The `deploy` job has `timeout-minutes: 15`.
- On a run where *Activate* succeeds but the public probe only ever connect-times-out,
  the job ends **green** with a visible "health check unverified" warning; a run where
  the probe returns a real non-2xx status still ends **red**.
- Connect-retry changes are confined to the two `retry()` helpers; SSH options and
  multiplexing are otherwise unchanged.
- Change is limited to `.github/workflows/deploy.yml`; contract followed.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CO-deploy-pipeline-config-hardening.md.

Work on branch ws/deploy-pipeline-config-hardening in worktree
cacc-ws-deploy-pipeline-config-hardening.

Scope (single file, .github/workflows/deploy.yml, no app/src changes): (1) add a
paths-ignore list to the push trigger so docs-only/*.md commits don't deploy while
src/test/package*/.nvmrc/.github/workflows changes still do; (2) add timeout-minutes: 15
to the deploy job; (3) widen the shared retry() helper in the Upload and Activate steps
to ~6 attempts with backoff capped near 60s; (4) make the Verify step fail-open ONLY
when every probe was a pure connectivity timeout (curl exit 28 / HTTP 000) AND Activate
succeeded — a real non-2xx status must still fail red — and reflect that in the
Deployment summary. Self-verify: a docs-only push no longer triggers deploy, a code push
still does, the job is time-bounded, and an already-live release stays green on a pure
runner→host connect timeout while a genuine bad status stays red.

Build green; the orchestrator handles commit/push/PR.
```
