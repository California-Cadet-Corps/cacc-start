# Onboarding maintainers

This guide brings a new maintainer up to speed on operating cacc-start. A
*maintainer* can review/approve PRs, merge to `main`, and operate production.

## 1. Access checklist

Grant the new maintainer:

- [ ] **Org membership** in `California-Cadet-Corps` (or repo collaborator with
      **Maintain**/**Admin** role) — *Repo → Settings → Collaborators and teams*.
- [ ] Add them to **CODEOWNERS** (`.github/CODEOWNERS`) so they're auto-requested
      for review. Prefer a team handle (e.g. `@California-Cadet-Corps/maintainers`)
      once a team exists, instead of individual usernames.
- [ ] **SSH access** to the Linode `deploy` user (add their public key to
      `~deploy/.ssh/authorized_keys`) — only if they'll operate the server.
- [ ] Access to the account/vault holding **production secrets** and the Linode
      login.
- [ ] Access to **DNS** for `cacadets.org` (for cert/host changes).

## 2. What a maintainer should understand

| Topic | Doc |
| ----- | --- |
| Branch protections & PR flow | [CONTRIBUTING-PRS.md](./CONTRIBUTING-PRS.md) |
| How deploys work | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Rolling back | [ROLLBACK.md](./ROLLBACK.md) |
| Secrets & rotation | [SECRETS.md](./SECRETS.md) |
| Server provisioning | [SERVER_SETUP.md](./SERVER_SETUP.md) |

## 3. The protections you are responsible for upholding

`main` is governed by a **ruleset** (*Repo → Settings → Rules → Rulesets →
"main-protection"*). It enforces:

- No direct pushes to `main`; changes via PR only.
- ≥ 1 approving review; stale approvals dismissed on new commits.
- All conversations resolved.
- Required **CI** status check passes; branch up to date.
- No force pushes; no branch deletion.

Do **not** weaken these to "get something merged." Use a proper PR, or for a true
emergency, an org admin can temporarily add a scoped bypass actor to the ruleset
and **must** remove it immediately after.

## 4. Day-to-day maintainer tasks

- **Review PRs:** check CI is green, code is sound, conversations resolved, then
  approve and **Squash and merge** (keeps `main` history clean).
- **Watch the deploy:** merging triggers *Deploy to Production*. Confirm it goes
  green and https://start.cacadets.org / `/healthz` are up.
- **If a deploy fails:** follow [ROLLBACK.md](./ROLLBACK.md), then open an issue
  and fix forward via PR.
- **Triage** issues and Discussions; label and respond.

## 5. Quarterly / periodic

- [ ] Rotate the deploy SSH key ([SECRETS.md](./SECRETS.md#rotating-a-secret)).
- [ ] Confirm `certbot renew --dry-run` succeeds on the server.
- [ ] Bump the Node version in `.nvmrc` + workflows when a new LTS lands.
- [ ] Review `npm audit` / Dependabot alerts.

## 6. Offboarding

When a maintainer leaves: remove org/repo access, remove their SSH key from the
server, remove them from CODEOWNERS, and **rotate** any shared secret they could
have known.
