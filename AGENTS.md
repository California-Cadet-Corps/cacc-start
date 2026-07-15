# Agent guide — cacc-start

The California Cadet Corps start/landing portal (start.cacadets.org). Part of the CACC system — read the shared context below.

<!-- BEGIN:cacc-system-context -->
## CACC system context (source of truth)

This repo is one app in the **California Cadet Corps (CACC)** multi-app system. It is
not standalone — it shares identity, data, and infrastructure conventions with the
other CACC apps. Before making cross-cutting changes (auth, hosting, data model,
DNS/subdomains, new integrations, or **provisioning storage/buckets, a database, or an
Entra app**), read the org-wide source of truth:

- **Master architecture + repo registry:** `California-Cadet-Corps/.github` → `ARCHITECTURE.md`
  - Fetch: `gh api repos/California-Cadet-Corps/.github/contents/ARCHITECTURE.md --jq .content | base64 -d`
  - Browse: https://github.com/California-Cadet-Corps/.github/blob/main/ARCHITECTURE.md

**⛔ Hard rules (always apply, no exceptions without recording a decision in `ARCHITECTURE.md`):**
- **Object storage = Supabase Storage** in the shared project. **Never create a new Linode Object
  Storage / S3 bucket** or add new `@aws-sdk/client-s3` paths — use a private Supabase bucket with
  signed URLs (`cacc-tools-2.0` is the reference). Migration: `.github/docs/object-storage-migration.md`.
- **One shared Supabase project + one shared Entra sign-in app** — don't stand up a new Supabase
  project or per-app sign-in registration for target-stack work.
- **Push to `main` freely when the app has a staging environment.** On any repo using the
  manual-promotion pattern (`autoAssignCustomDomains=OFF` — a `main` push only *stages* the build
  and does **not** touch the production domain), an agent is **always allowed to push to `main`
  directly without asking.** Promoting the staged build to **production** is a separate, gated
  step — **ask before promoting to prod.** (Repos with no staging environment, where push-to-`main`
  *is* the production deploy, do not get this blanket allowance. Multi-agent contract repos keep
  their worktree/PR flow — that discipline avoids parallel-coder collisions, not prod risk.)
  **⚠ Concurrency exception:** if you detect **another agent working the same codebase at the same
  time**, do **not** push to `main` directly — push to a **feature branch**, open a **PR to `main`**,
  then **go review that PR to decouple your changes** from theirs. This keeps the two agents from
  crossing so **none of your changes get lost or have to be redone.** (Direct-to-`main` is only for
  the solo case.)
- **Deploys run in GitHub Actions — never add a committer to the Vercel team.** Vercel Pro bills
  **$20/month per deploying seat** and refuses to deploy a commit whose author lacks one — a check
  it enforces **even for token-authenticated CLI deploys** (a seat-less author yields
  `state=BLOCKED`). So every CACC Vercel repo ships `.github/workflows/vercel.yml`, which deploys
  with the team token and **re-authors HEAD inside the runner**, plus
  `"git": {"deploymentEnabled": false}` in `vercel.json` so Vercel's own Git integration can't
  double-deploy or block. Consequences:
  - **Commit as yourself.** The old rule that every CACC commit must be *authored* as `aroach98`
    (and the `author-guard` workflow that enforced it) existed **only** to satisfy this check and is
    **retired** — real authorship now survives in git history. Author-by-world still applies to
    *who* commits (see the operator's own rules), but a non-`aroach98` author no longer breaks deploys.
  - **Only ONE paid seat exists** (the Pro platform fee includes one deploying seat and cannot be
    dropped). Everyone else is a free **Viewer**. A `BLOCKED` deployment means something bypassed
    the workflow — **fix the workflow, don't buy a seat.**
  - The runner's amend changes the SHA, so the real commit is recorded as `--meta gitSha`.
    `githubCommitSha` on an Actions deploy is a **phantom** — don't trust it to match git.
  - ⚠ This deliberately defeats a Vercel **security control** (it exists to stop unauthorized
    authors auto-deploying). Anyone with push access can therefore ship, and the workflow holds a
    prod-capable `VERCEL_TOKEN`. Accepted trade-off — decided 2026-07-15.
- **Migrations: run them without asking.** If the change requires a database/schema migration (or
  any migration step), the agent should **perform it as part of the work — do not stop to ask
  permission.** Follow the migration conventions: schema migrations live in
  `cacc-identity/supabase/migrations/`, applied via `q.mjs` (Node + `pg`) or the Supabase
  Management API; new tables ship with RLS; PII is safety-critical. It's one shared Supabase
  project, so a migration lands for every app — get it right, but don't wait for a go-ahead.

`ARCHITECTURE.md` is authoritative for: every repo and what it does, the shared identity
backbone (one Supabase project + Microsoft/Entra SSO), where each app is hosted (Vercel
vs. the two Linode servers), the DNS/subdomain map, the Linode→Vercel migration state,
and cross-app conventions. **If a change here alters this repo's hosting, auth, data
model, or public surface in a way other apps depend on, update `ARCHITECTURE.md` in the
same change** (open a PR against `California-Cadet-Corps/.github`).

This block is centrally managed. Edit the canonical copy at
`California-Cadet-Corps/.github` → `agent-context/cacc-system-context.md`, not this file —
local edits here are overwritten on the next org-wide sync.
<!-- END:cacc-system-context -->
