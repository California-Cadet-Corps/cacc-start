# WS-CM — Skip production deploys for docs-only pushes & widen SSH connect retry

- Branch: ws/deploy-skip-docs-only-pushes
- PR title: [ws/deploy-skip-docs-only-pushes] WS-CM-deploy-skip-docs-only-pushes: don't deploy on docs-only pushes; ride out multi-minute SSH connect gaps
- Depends on: (none — edits the current `.github/workflows/deploy.yml` on main as-is)

## Problem

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

The "pipeline" is the **Deploy to Production** workflow (`.github/workflows/deploy.yml`),
which runs on every push to `main` and ships the site to the Linode server over SSH.

What actually failed (run `28703838530`, the most recent red run at 2026-07-04T10:50Z):

- Failing step: **Upload release to server** (`.github/workflows/deploy.yml:90-134`).
- The very first `ssh` (`deploy.yml:128-129`) never connects — all 4 retry attempts
  emit `ssh: connect to host *** port ***: Connection timed out` (exit 255), then
  `##[error]Process completed with exit code 255`. This is a **TCP connect timeout**
  (a silent DROP), not auth failure or "connection refused".
- Successful deploys finish the entire SSH → activate → HTTPS health-check path in
  **~15s** (e.g. run `28703703368`). So there is no logic bug in the deploy body; the
  only variable is whether the runner can open the SSH socket at all.

Correlation that pins the root cause — the trigger, not the SSH client options:

- `deploy.yml:6-8` triggers on **every** push to `main` with **no `paths-ignore`**.
- The last 8 deploy runs were **all `push` events whose titles are
  `docs: contract for [ws/...]`** — i.e. architect contract commits that touch only
  `docs/workstreams/*.md`. They alternate success/failure (`28703838530` fail,
  `28703703368` ok, `28703534937` fail, `28702010807` ok, `28701859348` fail…).
- These docs-only commits have **zero runtime impact** yet each fires a full
  production SSH deploy. That both (a) paints `main` red ~half the time on commits
  that change nothing shippable, and (b) multiplies SSH connection churn against the
  server's sshd within minutes, which is the most plausible source of the intermittent
  connect-timeout DROPs (connection-rate / fail2ban-style throttling — the repo's own
  `deploy/scripts/server-setup.sh:63-65` only opens `ufw allow OpenSSH`, so any rate
  protection is outside version control and cannot be tuned from this repo).

Prior workstreams already hardened the SSH client side (retries + connection
multiplexing + HTTPS health check are present in `deploy.yml` today, lines 99-134 and
200-225). The remaining gap is the **trigger** (docs pushes should not deploy) and the
**retry window width** (4 attempts over ~35s of backoff cannot ride out a multi-minute
connect gap). This WS closes both without touching the working deploy body.

## Root cause

`deploy.yml` deploys to production on *every* push to `main`, including docs-only
architect contract commits. Those unnecessary deploys (1) mark `main` failed whenever
the SSH connect transiently times out, giving the appearance of a "locked" pipeline,
and (2) add SSH churn that makes the intermittent connect timeouts more likely. The
existing connect retry window (4 tries, 5→10→20s backoff) is also too short to survive
a genuine multi-minute connectivity gap.

## Scope

Single file: `.github/workflows/deploy.yml`.

1. **Add `paths-ignore` to the push trigger** (`deploy.yml:6-8`). Under
   `on: push:` alongside `branches: [main]`, add a `paths-ignore:` list so pushes that
   touch only docs/markdown do not deploy. Ignore at least: `docs/**`, `**/*.md`,
   `LICENSE`, `.github/CODEOWNERS` (keep `.github/workflows/**` deployable). Add a short
   comment explaining docs-only commits carry no shippable change.
2. **Widen the SSH connect retry window** in the two SSH steps. In the `retry()` helper
   used by **Upload release to server** (`deploy.yml:99-111`) and **Activate release &
   restart service** (`deploy.yml:145-157`), raise `max` from `4` to `6` and cap the
   exponential `delay` (e.g. `delay=$(( delay*2 > 60 ? 60 : delay*2 ))` or equivalent)
   so total wait grows to ~3–4 min instead of ~35s — enough to ride out a transient
   multi-minute gap. Keep the "do not swallow errors after retries" behavior intact.
   Do **not** change the `ssh-keyscan` retry in **Configure SSH** semantics (it must
   still hard-fail on an empty `known_hosts`, `deploy.yml:84-88`).
3. Leave the deploy body, multiplexing `SSH_OPTS`, activate script, and the HTTPS
   health check (`deploy.yml:200-225`) **unchanged** — they work when the socket opens.

No changes to `src/`, no new dependencies. `ci.yml` is untouched.

## Acceptance / DoD

- `.github/workflows/deploy.yml` parses as valid YAML and the workflow still runs on
  pushes to `main` that touch shippable paths (`src/**`, `.github/workflows/**`,
  `package*.json`, etc.).
- A push that changes **only** files under `docs/` or any `*.md` does **not** start a
  Deploy to Production run (verifiable from the Actions tab after merge).
- The Upload and Activate steps retry the SSH connect at least 6 times over ~3–4 min
  before failing, and still hard-error (non-zero exit) if the server stays unreachable —
  no silent success on a real outage.
- `npm run lint` / `npm test` (`ci.yml`) stay green; this WS changes only workflow YAML.
- Contract followed: only `.github/workflows/deploy.yml` is modified.

Operational note (not a code change, for the maintainer): production currently runs the
last SHA that deployed successfully; because the failing runs were docs-only, no
shippable change is missing. After this merges, a maintainer can re-run the latest
Deploy workflow if they want `main`'s tip re-shipped.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the full contract first: docs/workstreams/WS-CM-deploy-skip-docs-only-pushes.md

Work on branch ws/deploy-skip-docs-only-pushes in worktree cacc-ws-deploy-skip-docs-only-pushes.

Scope (single file, .github/workflows/deploy.yml): (1) add a `paths-ignore` list to the
`on: push:` trigger so docs-only / markdown-only pushes (docs/**, **/*.md, LICENSE) no
longer trigger production deploys, while keeping src/**, package*.json, and
.github/workflows/** deployable; (2) in the `retry()` helper of both the "Upload release
to server" and "Activate release & restart service" steps, raise max attempts from 4 to
6 and cap the exponential backoff at ~60s so the SSH connect rides out a multi-minute
gap, keeping the hard-fail-on-real-outage behavior. Do not touch the deploy body,
SSH_OPTS multiplexing, the keyscan hard-fail, the HTTPS health check, or any src/ files.
Self-verify: the YAML is valid, docs-only pushes won't deploy, and a persistent outage
still fails the job.

Build green; the orchestrator handles commit/push/PR.
```
