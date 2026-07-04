# WS-CG — Unlock the production deploy pipeline (bound deploy time so a hung run can't lock the queue)

- Branch: ws/unlock-deploy-pipeline
- PR title: [ws/unlock-deploy-pipeline] WS-CG-unlock-deploy-pipeline: add job/step timeouts so a stuck deploy releases the concurrency lock
- Depends on: none (builds directly on `#59` deploy-hardening in `f04e24a`)

## Problem

Product owner, verbatim:

> The last merge failed, can you go investigate and unlock the pipeline?

## Investigation

Direct CI/Actions run logs were **not reachable from this session** (no GitHub
API/`gh` access here), so the investigation was done against the tree on `main`.

**Finding 1 — the app code on `main` is green; the failure is in the deploy
machinery, not the site.** Everything CI/Deploy actually run was verified
consistent:
- `npm ci` — `package.json` and `package-lock.json` are in sync (both
  `cacc-start@0.1.0`, no dependencies, matching `engines.node >=20`).
  `package-lock.json:1-14`, `package.json:1-30`.
- `npm run lint` (`node --check src/server.js`) — `src/server.js` is valid;
  `/healthz` route present at `src/server.js:27-31`.
- `npm test` (`node --test`) — the strict i18n contract in
  `test/i18n.test.js` passes: all **115** `data-i18n` keys in
  `src/public/index.html` exist in every language, and the four language
  dictionaries in `src/public/i18n/translations.js` (`en`/`es`/`zh`/`de`,
  lines `6-123`, `124-241`, `242-359`, `360-477`) have **identical key sets**
  (116 real keys each). `server.test.js` assertions (hero `<h1>`, cyber-unit
  footer `src/public/index.html:558`, `lang-toggle` button
  `src/public/index.html:50`, `lang-switcher` select + `option value="es"`
  `src/public/index.html:68,71`) all still match the current markup.
- No merge-conflict markers anywhere in the repo.

Conclusion: re-running the last commit through CI would pass. The "failed
merge / locked pipeline" is therefore in the **Deploy to Production** workflow,
which is exactly what the last merge (`f04e24a`, PR #59 — deploy hardening)
last touched.

**Finding 2 — root cause: an unbounded deploy holds the production
concurrency group and blocks every later deploy.**
`.github/workflows/deploy.yml`:
- `concurrency: { group: production-deploy, cancel-in-progress: false }`
  (`.github/workflows/deploy.yml:11-13`) — deploys are serialized and a new one
  is **queued behind**, never cancelling, an in-flight one.
- The `deploy` job (`.github/workflows/deploy.yml:18-21`) has **no
  `timeout-minutes`** — confirmed: `grep -rn timeout-minutes .github/workflows`
  returns nothing. GitHub's default job timeout is **360 minutes**.
- The SSH-heavy steps (`Upload release to server` at lines `90-134`,
  `Activate release & restart service` at lines `136-198`) each wrap work in a
  `retry` loop (max 4 attempts, exponential 5→10→20s backoff). `ssh` has a
  per-connection `ConnectTimeout=15` + `ServerAlive*`
  (`.github/workflows/deploy.yml:123-127,165-169`), but `rsync`
  (`:130-134`) and the remote `bash -s` activate step (`:194-197`) have **no
  overall time bound**.

Combined effect: if one production deploy hangs (a stalled `rsync`, a wedged
control-master socket, `npm ci --omit=dev` on the server, or a `systemctl
restart` that blocks), it holds the `production-deploy` group for up to 6 hours.
During that window every subsequent merge's deploy sits **queued and never
runs** — the pipeline is "locked," and the last merge's deploy appears to have
"failed" because it never finished. This is a design gap in `deploy.yml`, not a
site bug.

Secondary (note, not in scope to change): the final `Verify deployment` step
(`.github/workflows/deploy.yml:200-225`) fails the whole job if the public
`https://start.cadets… /healthz` URL isn't `200` within ~60s. That is correct
fail-closed behavior; it is not the lock, but it means a genuinely-down site
will also surface here.

## Root cause

`deploy.yml` serializes production deploys (`cancel-in-progress: false`) with no
upper bound on how long any single deploy may run (`timeout-minutes` absent on
the job and on the long SSH/rsync steps). One hung deploy therefore holds the
`production-deploy` concurrency group indefinitely and blocks all queued
deploys — the observed "locked pipeline."

## Scope (file-by-file)

- `.github/workflows/deploy.yml`
  - Add `timeout-minutes: 20` to the `deploy` job (under
    `runs-on: ubuntu-latest`, near line `21`) so a wedged deploy fails and
    **releases the concurrency lock automatically**, letting the next queued
    deploy run.
  - Add a tighter per-step `timeout-minutes` to the two long steps as defense
    in depth: `Upload release to server` (line `90`) and
    `Activate release & restart service` (line `136`) — e.g. `timeout-minutes:
    12` each. (Keep values comfortably above the existing retry budget so
    healthy-but-slow deploys still succeed.)
  - Do **not** change the `concurrency`/`environment` blocks, the SSH options,
    the retry helpers, or the health-check step.
- `docs/ROLLBACK.md` (additive)
  - Append a short **"Unlocking a stuck deploy"** subsection: how to cancel the
    in-flight/queued `Deploy to Production` run from the Actions tab (or
    `gh run cancel <id>`) to immediately free the `production-deploy`
    concurrency group, and a note that with the new `timeout-minutes` a hung
    run now self-clears after 20 min. Keep it brief; do not alter existing
    rollback instructions.

Out of scope: any change to `src/`, `test/`, the CI workflow (`ci.yml`), or the
deploy SSH logic. No app behavior changes.

## Acceptance / DoD

- `.github/workflows/deploy.yml` is valid YAML and unchanged except for the
  added `timeout-minutes` on the job and the two named steps.
- `grep -n timeout-minutes .github/workflows/deploy.yml` shows the job-level and
  two step-level timeouts; `concurrency`, `environment`, SSH options, retry
  loops, and the health-check step are untouched.
- `docs/ROLLBACK.md` gains an "Unlocking a stuck deploy" subsection; all
  pre-existing content is preserved.
- Build stays green: `npm ci`, `npm run lint`, and `npm test` all pass locally
  (no source/test changes, so this is a regression guard, not new coverage).
- Contract followed: no files outside the two listed are modified.

## Coder kickoff prompt

```
You are a coder agent on California-Cadet-Corps/cacc-start.

Read the workstream contract first: docs/workstreams/WS-CG-unlock-deploy-pipeline.md
(it is authoritative — file paths and line numbers are in it).

Work on branch `ws/unlock-deploy-pipeline` in worktree `cacc-ws-unlock-deploy-pipeline`.

Scope, for self-verification: the production deploy pipeline can lock because
`.github/workflows/deploy.yml` serializes deploys (concurrency group
`production-deploy`, `cancel-in-progress: false`) with no `timeout-minutes`, so
one hung deploy holds the lock for up to GitHub's 6-hour default and blocks every
later merge's deploy. Add `timeout-minutes: 20` to the `deploy` job and a tighter
per-step timeout (~12 min) to the two long SSH/rsync steps ("Upload release to
server", "Activate release & restart service") so a stuck deploy fails fast and
releases the lock; do NOT touch the concurrency/environment blocks, SSH options,
retry helpers, or the health-check step. Then append a brief "Unlocking a stuck
deploy" subsection to docs/ROLLBACK.md (how to cancel the in-flight run to free the
concurrency group), preserving all existing content. No changes under src/ or test/.

Build green; the orchestrator handles commit/push/PR.
```
