# Rolling back a deployment

Every deploy is kept as a timestamped release directory and activated via a
`current` symlink, so rolling back is just re-pointing the symlink and
restarting — no rebuild, a few seconds of work.

## Fastest path — the rollback script

SSH to the server as the **deploy** user and run the bundled script
(`deploy/scripts/rollback.sh`, also kept inside each release):

```bash
ssh deploy@<LINODE_HOST>
cd /var/www/cacc-start/current        # or wherever LINODE_DEPLOY_PATH points

# See what's available:
./deploy/scripts/rollback.sh --list

# Roll back to the previous release:
./deploy/scripts/rollback.sh

# Or roll back to a specific commit's release:
./deploy/scripts/rollback.sh <commit-sha>
```

The script flips `current` to the target release, restarts the service, and
verifies `/healthz`. It refuses to leave you on an unhealthy release.

## Manual rollback (if the script is unavailable)

```bash
ssh deploy@<LINODE_HOST>
BASE=/var/www/cacc-start

# 1. List releases, newest first:
ls -1dt "$BASE/releases/"*/

# 2. Point current at a known-good release:
ln -sfn "$BASE/releases/<good-sha>" "$BASE/current"

# 3. Restart and verify:
sudo systemctl restart cacc-start
curl -fsS http://127.0.0.1:3002/healthz && echo " OK"
```

## Roll back via Git (to make prod match a known-good commit permanently)

A symlink rollback is immediate but temporary — the next merge to `main` deploys
again. To make the rollback the new source of truth:

```bash
# On your machine — revert the bad change with a normal PR:
git switch -c fix/revert-bad-deploy main
git revert <bad-commit-sha>
git push -u origin fix/revert-bad-deploy
gh pr create --base main --fill
```

Merging that PR redeploys the reverted (good) state through the normal pipeline.

> Prefer `git revert` (a new commit) over force-pushing `main` — the ruleset
> blocks force pushes to `main` by design.

## After any rollback

1. Confirm https://start.cacadets.org loads and `/healthz` returns `ok`.
2. Open an issue describing what broke so the fix goes through CI + review.
3. Don't leave production pinned to an old symlink indefinitely — land a proper
   fix or revert via PR.
