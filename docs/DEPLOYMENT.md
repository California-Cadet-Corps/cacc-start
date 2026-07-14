# Deployment

Production runs on **Vercel** (team `california-cadet-corps`, project
`cacc-start`), served at **https://start.cacadets.org**. The site is deployed
as static files from [`src/public/`](../src/public) per [`vercel.json`](../vercel.json)
— there is no build step (`buildCommand: null`, `outputDirectory: src/public`).

## When it runs

Vercel's Git integration deploys automatically:

- **Push to `main`** (i.e. a merged PR) → **production deploy** at
  https://start.cacadets.org.
- **Any pull request** → a unique **preview deployment**, linked as a check on
  the PR.

There is no GitHub Actions deploy job — `.github/workflows/` only runs `ci.yml`
(lint/build/test) as a required PR check. Vercel deploys independently of CI.

## What it does

```
push to main
   │
   ├─ Vercel detects the new commit via its GitHub integration
   ├─ serves src/public/ as static output (no build command)
   └─ promotes it to production at start.cacadets.org
```

Because the output is static files with no build step, a deploy is just a
file-serving swap — Vercel keeps prior deployments, so a bad deploy can be
undone by promoting a previous one from the Vercel dashboard
(**Project → Deployments → ⋯ → Promote to Production**).

## Manual / re-deploy

- **Redeploy the current commit:** Vercel dashboard → **Deployments** → find
  the deployment → **⋯ → Redeploy**.
- **Force a deploy** without new code: push an empty commit to `main`
  (`git commit --allow-empty -m "chore: redeploy" && git push`).

## Prerequisites

- The `cacc-start` project is linked in Vercel to this GitHub repo (team
  `california-cadet-corps`) with the Git integration enabled.
- DNS: `start.cacadets.org` resolves to Vercel per Vercel's project domain
  settings.

## Legacy Linode (retired 2026-07-04)

Production previously ran on the shared Linode server behind Apache, deployed
over SSH by a now-removed GitHub Actions workflow. Those provisioning artifacts
are kept only for rollback reference:

- [`deploy/`](../deploy) — Apache vhost, systemd unit, `server-setup.sh` /
  `rollback.sh`.
- [ROLLBACK.md](./ROLLBACK.md) — the old symlink-based rollback procedure.
- [SERVER_SETUP.md](./SERVER_SETUP.md) — one-time Linode provisioning steps.
- [SECRETS.md](./SECRETS.md) — the retired `LINODE_*` GitHub Secrets.

These are not part of the live pipeline; do not re-add the retired workflow.
