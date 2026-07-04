# WS-CS — Unlock the deploy pipeline: skip docs-only deploys, bound the job, diagnose SSH timeouts

- Branch: ws/deploy-pipeline-unlock-consolidation
- PR title: [ws/deploy-pipeline-unlock-consolidation] WS-CS-deploy-pipeline-unlock-consolidation: stop docs-only pushes from triggering production deploys, bound the deploy job, and surface the real SSH-unreachable root cause
- Depends on: none (this supersedes/consolidates the unmerged WS-CC … WS-CR deploy contracts — see Investigation)

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Root cause

The red X is a **genuine SSH connectivity failure to the production host**, amplified by
the deploy workflow firing on commits that should never deploy.

1. **The failing run.** The last `Deploy to Production` run (GitHub Actions run
   `28720819609`, commit `8ab038a` — the `docs: contract for … WS-CR …` push) failed at
   the **`Upload release to server`** step. Its `retry ssh … mkdir …` call exhausted all
   4 attempts with `ssh: connect to host *** port ***: Connection timed out` (exit 255),
   over ~2.5 min. The release never uploaded, so production was correctly left unchanged.
   This is **before** activation — no code shipped, so "fail-open here" would be wrong.

2. **It is intermittent, not a code defect.** Adjacent runs on identical docs-only commits
   succeed in ~17–21 s (e.g. runs `28720639845`, `28720518862`). The host is reachable
   sometimes and unreachable others — the signature of server-side SSH connection-rate
   limiting / fail2ban banning the runner's IP, or a transient network/host blip. No
   workflow edit can make an unreachable host reachable; that remediation is operational.

3. **The amplifier — every push to `main` triggers a full production deploy.**
   `.github/workflows/deploy.yml` lines 6–8 trigger `on: push: branches: [main]` with **no
   `paths-ignore`**. Architect contract commits (`docs: contract for …`, touching only
   `docs/workstreams/WS-*.md`) therefore each launch a real production deploy that SSHes to
   the server. When the host is transiently unreachable, these docs-only pushes go red for
   ~2.5 min apiece — flooding the deploy history and creating the perpetual "locked
   pipeline" appearance.

4. **No job timeout / lock-release guarantee.** The deploy job (`.github/workflows/deploy.yml`
   line 19, `deploy:`) has **no `timeout-minutes`**, while the workflow holds a
   `concurrency: group: production-deploy` lock with `cancel-in-progress: false`
   (lines 11–13). A hung run would hold that lock indefinitely and queue every later deploy —
   the literal "pipeline locked."

## Investigation

- `.github/workflows/deploy.yml:6-8` — `on: push: branches: [main]`, no path filter → docs
  commits deploy.
- `.github/workflows/deploy.yml:11-13` — `concurrency: group: production-deploy`,
  `cancel-in-progress: false`.
- `.github/workflows/deploy.yml:19-24` — `deploy:` job, no `timeout-minutes`.
- `.github/workflows/deploy.yml:90-134` — `Upload release to server`; the `retry ssh … mkdir`
  (≈ lines 128-129) is where run `28720819609` exhausted 4 retries with exit 255.
- `.github/workflows/deploy.yml:227-234` — `Deployment summary` already reports failure but
  gives no actionable next step for an unreachable host.
- Prior art: `docs/workstreams/WS-R-harden-deploy-ssh-retries.md` (merged as PR #59, commit
  `f04e24a`) already added retries + connection multiplexing. **WS-CC through WS-CR are ~16
  unmerged, near-duplicate contracts** re-attacking this same flakiness (all present on
  `main` only as `docs: contract for …` commits; `git log` shows no coder implementation for
  any of them). This WS consolidates them; the rest should be **closed as superseded**, not
  implemented.

## Scope

File-by-file changes (keep them minimal and honest — do **not** fake a green deploy when the
server is genuinely unreachable):

1. **`.github/workflows/deploy.yml`**
   - Add `paths-ignore` to the `push` trigger so pushes touching **only** docs/markdown do
     not deploy: e.g. `docs/**`, `**/*.md`, `LICENSE`. Mixed commits that also touch app
     code still deploy (paths-ignore skips only when every changed file matches). This stops
     architect contract commits and docs-only integrations from launching production deploys.
   - Add `timeout-minutes:` to the `deploy:` job (suggest `20`) so a stuck run always releases
     the `production-deploy` concurrency lock.
   - In the `Upload release to server` / `Configure SSH` steps, when SSH retries are exhausted,
     emit a clear, actionable diagnostic (host unreachable → check host is up, sshd, and
     fail2ban bans on the runner IP) before exiting non-zero. Keep the **hard failure** — an
     un-uploaded release must stay red; production is intentionally unchanged.
   - Update the `Deployment summary` failure branch to point at the new troubleshooting
     section (below) in addition to `docs/ROLLBACK.md`.
   - Do not change the SSH options, retry counts, or the activate/health-check logic already
     added by WS-R.

2. **`docs/DEPLOYMENT.md`** (additive)
   - Add a **"Troubleshooting: `Connection timed out` deploy failures"** section documenting:
     the intermittent runner→host SSH timeout root cause; that docs-only pushes no longer
     deploy; the server-side checklist (confirm the Linode host is up, `sshd` is listening on
     `LINODE_PORT`, and fail2ban/`MaxStartups` are not banning GitHub Actions runner IP
     ranges); and how to safely re-run a failed deploy once the host is reachable
     (`gh run rerun <run-id>` or an empty re-push to `main`).

3. **`docs/workstreams/WS-CS-deploy-pipeline-unlock-consolidation.md`** — this contract (added
   by the orchestrator).

Out of scope: application/source code (`src/**`), the CI workflow, and any server-side
configuration (fail2ban/sshd) — those are operational, not repo changes.

## Acceptance / DoD

- `npm ci`, `npm run lint`, `npm run build --if-present`, and `npm test` all pass (CI green).
- `deploy.yml` parses as valid YAML; the `push` trigger has a `paths-ignore` list covering
  docs/markdown, and the `deploy:` job has `timeout-minutes`.
- A docs-only push to `main` (e.g. the next contract commit) does **not** trigger a
  `Deploy to Production` run; a push touching `src/**` still does.
- On exhausted SSH retries the job still fails (non-zero) and prints the actionable
  host-unreachable diagnostic; production is left unchanged.
- `docs/DEPLOYMENT.md` contains the new troubleshooting section with the server-side checklist
  and the re-run instructions.
- Contract followed; no unrelated files touched.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CS-deploy-pipeline-unlock-consolidation.md

Work on branch ws/deploy-pipeline-unlock-consolidation in worktree cacc-ws-deploy-pipeline-unlock-consolidation.

Scope: In .github/workflows/deploy.yml, add a `paths-ignore` list (docs/**, **/*.md, LICENSE)
to the `on: push` trigger so docs-only pushes to main no longer trigger production deploys,
and add `timeout-minutes: 20` to the `deploy:` job so a stuck run releases the
`production-deploy` concurrency lock. When SSH retries are exhausted, keep the hard failure but
print an actionable "host unreachable — check host up / sshd / fail2ban" diagnostic, and point
the failure summary at the new troubleshooting section. Then add a "Troubleshooting:
Connection timed out deploy failures" section to docs/DEPLOYMENT.md (root cause, server-side
checklist, and how to re-run a failed deploy with `gh run rerun` or a re-push). Do NOT fake a
green deploy on a genuinely unreachable host, and do NOT touch src/** or the CI workflow.

Self-verify: a pure docs push must not deploy while a src/** push still does; the job is
bounded by a timeout; and DEPLOYMENT.md documents the intermittent SSH-timeout root cause.

Build green; the orchestrator handles commit/push/PR.
```
