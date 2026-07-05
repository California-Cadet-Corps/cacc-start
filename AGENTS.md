# Agent guide — cacc-start

The California Cadet Corps start/landing portal (start.cacadets.org). Part of the CACC system — read the shared context below.

<!-- BEGIN:cacc-system-context -->
## CACC system context (source of truth)

This repo is one app in the **California Cadet Corps (CACC)** multi-app system. It is
not standalone — it shares identity, data, and infrastructure conventions with the
other CACC apps. Before making cross-cutting changes (auth, hosting, data model,
DNS/subdomains, new integrations), read the org-wide source of truth:

- **Master architecture + repo registry:** `California-Cadet-Corps/.github` → `ARCHITECTURE.md`
  - Fetch: `gh api repos/California-Cadet-Corps/.github/contents/ARCHITECTURE.md --jq .content | base64 -d`
  - Browse: https://github.com/California-Cadet-Corps/.github/blob/main/ARCHITECTURE.md

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
