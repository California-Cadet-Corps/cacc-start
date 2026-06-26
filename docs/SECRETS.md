# GitHub Secrets

The production deploy workflow authenticates to the Linode server over SSH using
secrets stored in GitHub. Configure them at:

**Repo → Settings → Secrets and variables → Actions → New repository secret**

or with the CLI:

```bash
gh secret set LINODE_HOST            --repo California-Cadet-Corps/cacc-start
gh secret set LINODE_USER            --repo California-Cadet-Corps/cacc-start
gh secret set LINODE_SSH_PRIVATE_KEY --repo California-Cadet-Corps/cacc-start < deploy_key
gh secret set LINODE_DEPLOY_PATH     --repo California-Cadet-Corps/cacc-start
gh secret set LINODE_PORT            --repo California-Cadet-Corps/cacc-start   # optional
```

## Required secrets

| Secret | Required | Example | Purpose |
| ------ | -------- | ------- | ------- |
| `LINODE_HOST` | ✅ | `203.0.113.10` or `start.cacadets.org` | Server hostname/IP the workflow SSHes into. |
| `LINODE_USER` | ✅ | `deploy` | SSH user that owns the deploy path and may restart the service. |
| `LINODE_SSH_PRIVATE_KEY` | ✅ | *(full PEM)* | Private half of the deploy key. Its **public** half is in the server's `~deploy/.ssh/authorized_keys`. |
| `LINODE_DEPLOY_PATH` | ✅ | `/var/www/cacc-start` | Base dir containing `releases/`, `current`, `shared/`. |
| `LINODE_PORT` | ⬜ optional | `22` | SSH port. Defaults to `22` in the workflow if omitted. |

> The workflow references `LINODE_PORT` as `${{ secrets.LINODE_PORT || '22' }}`,
> so you only need to set it if your server uses a non-standard SSH port.

## Why no other secrets are required

- **No registry/build secrets** — the app builds from public source on the CI
  runner; nothing is pulled from a private package registry.
- **No cloud-provider secrets** — we deploy over plain SSH to Linode. We do **not**
  use Cloudflare Pages/API tokens, AWS, S3, or CloudFront.
- **Application secrets are NOT GitHub Secrets** — runtime config (DB URLs, API
  keys, etc.) lives in the server file `"$LINODE_DEPLOY_PATH/shared/.env"`
  (chmod 600, owned by the deploy user) and is symlinked into each release. Keep
  them off GitHub so a repo compromise can't leak production credentials.

## Optional hardening secret

| Secret | Purpose |
| ------ | ------- |
| `LINODE_KNOWN_HOSTS` | Pin the server's SSH host key instead of trusting `ssh-keyscan` at deploy time. If you set it, replace the `ssh-keyscan` step in `deploy.yml` with `printf '%s\n' "${{ secrets.LINODE_KNOWN_HOSTS }}" > ~/.ssh/known_hosts`. Prevents a man-in-the-middle on first connection. |

Get the value with: `ssh-keyscan -p <port> <host>`.

## Generating the deploy SSH key

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
