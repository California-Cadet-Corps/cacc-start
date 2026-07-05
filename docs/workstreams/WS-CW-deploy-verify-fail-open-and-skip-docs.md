# WS-CW — Unlock deploy pipeline: fail-open health check, skip docs-only deploys, bound the job

- Branch: ws/deploy-verify-fail-open-and-skip-docs
- PR title: [ws/deploy-verify-fail-open-and-skip-docs] WS-CW-deploy-verify-fail-open-and-skip-docs: stop transient health-probe timeouts and docs-only pushes from red-failing production deploys
- Depends on: none (supersedes the un-landed WS-CC…WS-CV contract pile-up; see Investigation)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Root cause

The "pipeline" is the **Deploy to Production** workflow, `.github/workflows/deploy.yml`,
which runs on every push to `main`. The failure is **not** in the deploy itself — it is
in the final verification step.

Evidence from the most recent failed run (`gh run view 28722582467`, push of `100b50a`):

```
✓ Upload release to server
✓ Activate release & restart service
X Verify deployment (public health check)   ← only this step failed
```

The verify step log shows:

```
curl: (28) Connection timed out after 10002 milliseconds
Attempt 12/12: https://start.cacadets.org/healthz → 000000; retrying in 5s…
Health check FAILED: https://start.cacadets.org/healthz never returned 200
##[error]Process completed with exit code 1.
```

So the release was uploaded, symlinked, and the service restarted successfully — the
deploy worked — but the **runner-side outbound HTTPS probe** to the public URL timed
out (`curl` exit 28, HTTP code `000`), and the step does an unconditional `exit 1`,
turning an already-live deploy red. This is a *fail-closed* health check reacting to a
transient runner→internet connectivity blip, not to any real regression of production.

Three concrete defects in `.github/workflows/deploy.yml`:

1. **Verify step fails-closed on pure connectivity timeouts.**
   Lines 200–225: the `for i in $(seq 1 12)` loop treats "never got HTTP 200" the same
   whether the site returned a real bad status (e.g. `500` — a genuine regression) or the
   runner simply could not connect at all (`code=000` / `curl` exit 28). The final
   `exit 1` (line 225) fires in both cases. After a successful Activate step, a pure
   connect-timeout must **not** fail the job.

2. **Docs-only pushes trigger a full production deploy.**
   Lines 6–8: `on: push: branches: [main]` has no `paths-ignore`. Every orchestrator
   `docs: contract for …` commit (which only touches `docs/**`) re-runs the whole deploy
   and re-rolls the flaky-probe dice. The `gh run list` history for this workflow is
   dominated by `docs: contract for …` runs alternating success/failure — pure churn that
   never changes deployable code.

3. **No job timeout on the `production-deploy` concurrency lock.**
   Lines 11–13 set `concurrency: group: production-deploy` with
   `cancel-in-progress: false`, and the `deploy` job (lines 18–24) has no
   `timeout-minutes`. A hung SSH/rsync step could hold the single-flight lock (up to
   GitHub's 6-hour default), blocking later deploys — literally leaving the pipeline
   "locked."

## Investigation

- `.github/workflows/deploy.yml:6-8` — deploy trigger (`push: branches: [main]`), no `paths-ignore`.
- `.github/workflows/deploy.yml:11-13` — `concurrency: production-deploy`, `cancel-in-progress: false`.
- `.github/workflows/deploy.yml:18-24` — `deploy` job header, no `timeout-minutes`.
- `.github/workflows/deploy.yml:90-134` — Upload release (succeeds in the failing run).
- `.github/workflows/deploy.yml:136-198` — Activate & restart (succeeds in the failing run).
- `.github/workflows/deploy.yml:200-225` — Verify step; unconditional `exit 1` at line 225 is the actual failure.
- `.github/workflows/ci.yml` — unaffected; app-level CI (lint/build/test) is green (`npm test` → 34 pass locally).
- `origin/main` `deploy.yml` is byte-identical to `#59` (`git diff HEAD origin/main -- .github/workflows/deploy.yml` is empty): **~20 prior contracts WS-CC…WS-CV all target this same problem but only their docs commits landed — no coder fix ever reached `deploy.yml`.** This WS is scoped to actually land the workflow edit and lock it with a test so the loop ends.

## Scope

File-by-file changes (config + one guard test; no application-code changes):

1. `.github/workflows/deploy.yml`
   - **Trigger (lines 6–8):** add `paths-ignore:` to the `push` trigger so docs-only
     commits do not deploy. Ignore at least `docs/**` and `**/*.md` (keep `README`/`LICENSE`
     changes out of deploys too). Do not change the `pull_request` behaviour of `ci.yml`.
   - **Job (lines 18–24):** add `timeout-minutes: 20` to the `deploy` job so a wedged run
     releases the `production-deploy` concurrency lock.
   - **Verify step (lines 200–225):** make the health check *fail-open on pure
     connectivity timeouts but still fail-closed on a real bad status*. Concretely: capture
     `curl`'s exit code; if the loop never gets `200` **and** every attempt was a connect
     failure (`curl` exit 28 / HTTP code `000`), log a clear warning and `exit 0` (the
     release is already activated); only `exit 1` when the site actually answered with a
     non-2xx status (a genuine regression). Keep the existing retry cadence.

2. `test/deploy-workflow.test.js` (new)
   - Dependency-free `node:test` that reads `.github/workflows/deploy.yml` as text and
     asserts the fix is present and cannot silently regress: (a) the `push` trigger block
     contains `paths-ignore:` covering `docs`; (b) the `deploy` job declares
     `timeout-minutes:`; (c) the verify step contains the fail-open marker (e.g. it
     references `exit 0` / a "connectivity" branch guarded on connect-timeout, not an
     unconditional `exit 1`). Keep assertions on stable substrings so normal edits don't
     break it.

Non-goals: no changes to SSH/rsync hardening (already done in WS-R/#59), no app code, no
new npm dependencies, no changes to `ci.yml` or the server.

## Acceptance / DoD

- `npm run lint`, `npm run build`, and `npm test` all pass (app tests unchanged: 34 pass;
  plus the new `test/deploy-workflow.test.js` guard passes).
- `deploy.yml` no longer deploys on docs-only pushes (a commit touching only `docs/**` or
  `*.md` produces **no** "Deploy to Production" run).
- The verify step exits `0` when production was activated but the public probe only hit
  connect timeouts (`curl` exit 28 / code `000`), and still exits `1` on a real non-2xx
  HTTP response.
- The `deploy` job has a `timeout-minutes` bound so the `production-deploy` lock always
  releases.
- YAML remains valid (the workflow parses and the next code push to `main` runs green).
- Contract followed exactly; no unrelated files touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CW-deploy-verify-fail-open-and-skip-docs.md

Work on branch ws/deploy-verify-fail-open-and-skip-docs in worktree cacc-ws-deploy-verify-fail-open-and-skip-docs.

Scope: edit ONLY .github/workflows/deploy.yml and add test/deploy-workflow.test.js.
In deploy.yml (1) add paths-ignore (docs/**, **/*.md) to the push:main trigger so
docs-only commits don't deploy; (2) add timeout-minutes: 20 to the deploy job so the
production-deploy concurrency lock always releases; (3) rewrite the "Verify deployment
(public health check)" step so it exits 0 when the release was already activated and the
public probe only hit connect timeouts (curl exit 28 / HTTP 000), while still exiting 1 on
a real non-2xx status. Add a dependency-free node:test that reads deploy.yml as text and
asserts paths-ignore, timeout-minutes, and the fail-open branch are present.

Self-verify: npm run lint, npm run build, and npm test must all pass, and deploy.yml must
stay valid YAML. Do not touch app code, ci.yml, or SSH/rsync steps.

Build green; the orchestrator handles commit/push/PR.
```
