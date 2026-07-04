# WS-CN — Unlock the deploy pipeline: skip docs-only pushes & survive connectivity timeouts

- Branch: ws/deploy-unlock-pipeline
- PR title: [ws/deploy-unlock-pipeline] WS-CN-deploy-unlock-pipeline: don't deploy on docs-only pushes, bound the job, and keep an already-live release green on pure runner→host connectivity timeouts
- Depends on: (none — edits `.github/workflows/deploy.yml` on `main` as it is today)

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The "pipeline" is the **Deploy to Production** workflow,
`.github/workflows/deploy.yml`, which runs on every push to `main` and ships the
site to the Linode server over SSH, then verifies via a public HTTPS health check.

Confirmed from the live Actions runs (all pure connectivity DROPs, not logic bugs):

- **When the runner can reach the host, the entire SSH → activate → health-check
  path finishes in ~15s green** (e.g. run `28705447758`, `28703703368`). There is
  no bug in the deploy body; the only variable is whether the runner can open the
  socket at all.
- **Upload-step failures** — run `28703838530` (most recent red). The first `ssh`
  in *Upload release to server* (`.github/workflows/deploy.yml:128-129`) never
  connects: all 4 retry attempts print
  `ssh: connect to host *** port ***: Connection timed out` (exit 255), then the
  step exits 255. TCP connect timeout, ~2m52s wasted.
- **Verify-step failures** — the last *code* merge, PR #66 (run `28693590551`),
  activated the release successfully but then red-failed in *Verify deployment*
  (`.github/workflows/deploy.yml:200-225`): every probe returned
  `curl: (28) Connection timed out` / HTTP `000`. The release was already live; the
  job went red purely because the runner→host network path was down at that moment.
- **The trigger fires on commits that ship nothing.** `deploy.yml:6-8`
  (`on: push: branches:[main]`) has **no `paths-ignore`**, so architect
  `docs: contract for …` commits that only touch `docs/workstreams/*.md` each fire a
  full production SSH deploy. The last ~10 runs are all such docs-only pushes,
  alternating success/failure on connectivity luck — which is what makes the
  pipeline *look* "locked" / red on `main` half the time.
- **No job timeout.** The job (`deploy.yml:19-24`) has no `timeout-minutes`, and the
  concurrency group `production-deploy` uses `cancel-in-progress: false`
  (`deploy.yml:11-13`), so a hung run would hold the lock and block later deploys.

Prior workstreams already hardened the SSH client side (retries + connection
multiplexing + the public HTTPS health check are all present today). The remaining,
still-unimplemented gaps are: the over-eager **trigger**, the too-short **connect
retry window**, a missing **job timeout**, and a verify step that **red-fails an
already-activated release on a pure connectivity blip**.

## Root cause

`deploy.yml` deploys to production on every push to `main` (including no-op docs
commits) and treats any runner↔host connectivity timeout as a deploy failure — even
after the release has already been activated. Combined with a short 4-try connect
window and no job timeout, intermittent TCP DROPs between GitHub runners and the
Linode host repeatedly paint `main` red, giving the appearance of a locked pipeline.

## Scope

Single file: **`.github/workflows/deploy.yml`**. No application/src changes.

1. **Skip docs-only pushes** — `deploy.yml:6-8`: add a `paths-ignore` list to the
   `push` trigger so commits touching only non-shippable paths don't deploy. Ignore
   at least: `docs/**`, `**/*.md`, `LICENSE`, `.editorconfig`, `.gitattributes`,
   `.github/**/*.md`. Do **not** ignore `.github/workflows/**` (workflow edits must
   still be exercised) or `src/**`, `test/**`, `package*.json`, `.nvmrc`.

2. **Bound the job** — `deploy.yml:19-24`: add `timeout-minutes: 15` to the `deploy`
   job so a wedged run always releases the `production-deploy` concurrency lock.

3. **Widen the connect retry window** — the shared `retry()` helper in *Upload*
   (`deploy.yml:99-111`) and *Activate* (`deploy.yml:145-157`) uses `max=4 delay=5`
   (~35s total). Raise it to ride out a multi-minute connect gap (e.g. `max=6`, cap
   the exponential `delay` at ~60s) so a genuine deploy survives a transient DROP
   without lengthening a truly-dead host beyond the new job timeout.

4. **Keep an activated release green on a pure verify-timeout** — *Verify deployment*
   (`deploy.yml:200-225`) currently fails whenever the probe never returns 200,
   including when every attempt is a connect timeout (curl exit `28` / code `000`).
   Change the final decision so that: a real HTTP response with a non-2xx status is
   still a hard failure, but if **every** attempt was a pure connectivity timeout
   (no HTTP status ever received) *and* the *Activate* step succeeded, emit a loud
   warning to `$GITHUB_STEP_SUMMARY` and exit 0 (the release is already live; the
   runner simply couldn't reach it). Do not weaken detection of a genuine bad status.

5. **Summary accuracy** — *Deployment summary* (`deploy.yml:227-234`): if the
   verify step took the fail-open path, the summary should say "deployed; health
   check unverified (runner connectivity)" rather than a plain success.

## Acceptance / DoD

- `npm run build --if-present` and `npm test` still pass (unchanged; app untouched).
- `deploy.yml` is valid YAML and the workflow parses on GitHub (no schema errors).
- A push that changes only `docs/**` or a `*.md` file does **not** trigger the
  Deploy to Production workflow.
- A push that changes `src/**`, `test/**`, `package*.json`, `.nvmrc`, or
  `.github/workflows/**` **does** trigger it.
- The `deploy` job has `timeout-minutes: 15`.
- On a run where *Activate* succeeds but the public probe only ever connect-times-out,
  the job ends **green** with a visible "health check unverified" warning; a run where
  the probe returns a real non-2xx status still ends **red**.
- Connect-retry changes are confined to the two `retry()` helpers; the deploy body,
  SSH options, and multiplexing are otherwise unchanged.
- Contract followed; the change is limited to `.github/workflows/deploy.yml`.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CN-deploy-unlock-pipeline.md.

Work on branch ws/deploy-unlock-pipeline in worktree cacc-ws-deploy-unlock-pipeline.

Scope (single file, .github/workflows/deploy.yml, no app/src changes): (1) add a
paths-ignore list to the push trigger so docs-only/*.md commits don't deploy, while
still deploying src/test/package*/.nvmrc/.github/workflows changes; (2) add
timeout-minutes: 15 to the deploy job; (3) widen the shared retry() helper (Upload +
Activate) to ~6 attempts with backoff capped near 60s; (4) make the Verify step
fail-open ONLY when every probe was a pure connectivity timeout (curl exit 28 / HTTP
000) AND Activate succeeded — a real non-2xx status must still fail red — and reflect
that in the deployment summary. Self-verify: docs-only push no longer triggers deploy,
code push still does, the job is time-bounded, and an already-live release stays green
on a pure runner→host connect timeout while a genuine bad status stays red.

Build green; the orchestrator handles commit/push/PR.
```
