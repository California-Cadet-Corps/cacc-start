# GitHub Secrets

> **Legacy (retired 2026-07-04):** production now deploys via **Vercel**'s Git
> integration (see [DEPLOYMENT.md](./DEPLOYMENT.md)), which needs no GitHub
> Secrets — Vercel manages its own project credentials outside this repo. The
> `LINODE_*` secrets and the retired GitHub Actions workflow described below
> were used by the old Linode SSH deploy and are kept here only for rollback
> reference until the Linode is decommissioned.

The (retired) production deploy workflow authenticated to the Linode server over
SSH using secrets stored in GitHub. They were configured at:

**Repo → Settings → Secrets and variables → Actions → New repository secret**

or with the CLI:

```bash
gh secret set LINODE_HOST            --repo California-Cadet-Corps/cacc-start
gh secret set LINODE_USER            --repo California-Cadet-Corps/cacc-start
gh secret set LINODE_SSH_PRIVATE_KEY --repo California-Cadet-Corps/cacc-start < deploy_key
gh secret set LINODE_DEPLOY_PATH     --repo California-Cadet-Corps/cacc-start
gh secret set LINODE_PORT            --repo California-Cadet-Corps/cacc-start   # optional
```

## Legacy secrets (Linode deploy, retired)

| Secret | Required | Example | Purpose |
| ------ | -------- | ------- | ------- |
| `LINODE_HOST` | ✅ | `203.0.113.10` or `start.cacadets.org` | Server hostname/IP the workflow SSHed into. |
| `LINODE_USER` | ✅ | `deploy` | SSH user that owns the deploy path and may restart the service. |
| `LINODE_SSH_PRIVATE_KEY` | ✅ | *(full PEM)* | Private half of the deploy key. Its **public** half is in the server's `~deploy/.ssh/authorized_keys`. |
| `LINODE_DEPLOY_PATH` | ✅ | `/var/www/cacc-start` | Base dir containing `releases/`, `current`, `shared/`. |
| `LINODE_PORT` | ⬜ optional | `22` | SSH port. Defaulted to `22` in the workflow if omitted. |

> These secrets are no longer used by any active workflow. Keep them (or clean
> them up) only for as long as the Linode server itself is kept around for
> rollback.

## Why no other secrets are required

- **No registry/build secrets** — the app builds from public source; nothing is
  pulled from a private package registry.
- **Vercel needs no GitHub Secrets** — the Vercel Git integration authenticates
  and deploys independently of this repo's GitHub Actions/Secrets.
- **Application secrets are NOT GitHub Secrets** — runtime config (DB URLs, API
  keys, etc.), if any, does not live in GitHub Secrets.

## Optional hardening secret (legacy)

| Secret | Purpose |
| ------ | ------- |
| `LINODE_KNOWN_HOSTS` | Pinned the server's SSH host key instead of trusting `ssh-keyscan` at deploy time, for the retired Linode deploy workflow. No longer applicable since that workflow was removed. |

Get the value with: `ssh-keyscan -p <port> <host>`.

## Generating the deploy SSH key (legacy)

On any machine (do this once):

```bash
ssh-keygen -t ed25519 -f deploy_key -N "" -C "cacc-start-deploy"

# Public half → server (append to the deploy user's authorized_keys):
ssh-copy-id -i deploy_key.pub deploy@<LINODE_HOST>
#   (or paste deploy_key.pub into /home/deploy/.ssh/authorized_keys)

# Private half → GitHub secret:
gh secret set LINODE_SSH_PRIVATE_KEY --repo California-Cadet-Corps/cacc-start < deploy_key

# Then delete the local private key:
rm deploy_key deploy_key.pub
```

Use a **dedicated** key for deploys (not a personal key), and restrict it to the
deploy user, which can only restart this one service via a scoped sudoers rule.

## Rotating a secret

1. Generate a new key/value.
2. Update the server side (e.g. swap the public key in `authorized_keys`).
3. `gh secret set <NAME> ...` to overwrite in GitHub.
4. Trigger a deploy (empty commit) to confirm it still works.
