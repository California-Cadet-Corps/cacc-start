# Deployment

Production is a **Linode** server running the Node app behind **Nginx**, served
at **https://start.cacadets.org**. Deployment is fully automated by
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## When it runs

The deploy workflow triggers **only on push to `main`** — i.e. when a reviewed
PR is merged. It never runs from a PR or feature branch. A `concurrency` group
ensures two deploys never overlap.

## What it does

```
push to main
   │
   ├─ checkout
   ├─ setup Node (version from .nvmrc) + npm cache
   ├─ npm ci
   ├─ npm run build --if-present
   ├─ npm test                      ← a failing build/test aborts before touching prod
   ├─ configure SSH (deploy key + known_hosts)
   ├─ rsync code → $BASE/releases/<commit-sha>/   (a NEW dir; prod still untouched)
   ├─ on server: link shared/.env, npm ci --omit=dev
   ├─ flip $BASE/current symlink → new release     ← atomic switch
   ├─ sudo systemctl restart cacc-start
   ├─ prune to the 5 newest releases
   └─ health check GET /healthz                    ← fails the job if unhealthy
```

### Release layout on the server

```
$LINODE_DEPLOY_PATH/                 (e.g. /var/www/cacc-start)
├── current -> releases/<sha>        # symlink to the live release
├── releases/
│   ├── <sha-newest>/                # what `current` points at
│   ├── <sha-previous>/              # instant rollback target
│   └── ...                          # up to 5 kept
└── shared/
    └── .env                         # server secrets, never in git
```

Because each deploy lands in a **fresh** `releases/<sha>` directory and only the
`current` symlink flip makes it live, a build or upload failure leaves the
running release completely untouched.

## "Fail cleanly"

- Build/test failures stop the job **before** any server change.
- The symlink flip is atomic — there is no half-deployed state.
- If the post-restart **health check** fails, the workflow exits non-zero and is
  marked failed. The previous release is still on disk → roll back in seconds
  (see [ROLLBACK.md](./ROLLBACK.md)).

## Manual / re-deploy

- **Re-run** the last deploy: Actions → *Deploy to Production* → failed run →
  **Re-run jobs**.
- **Force a deploy** without new code: push an empty commit to `main`
  (`git commit --allow-empty -m "chore: redeploy" && git push`).

## Prerequisites

- Server provisioned per [SERVER_SETUP.md](./SERVER_SETUP.md).
- GitHub Secrets configured per [SECRETS.md](./SECRETS.md).
- DNS: `start.cacadets.org` A/AAAA record → the Linode's IP.
