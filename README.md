# cacc-start

> Production application for **[start.cacadets.org](https://start.cacadets.org)** — the California Cadet Corps start/landing portal.

[![CI](https://github.com/California-Cadet-Corps/cacc-start/actions/workflows/ci.yml/badge.svg)](https://github.com/California-Cadet-Corps/cacc-start/actions/workflows/ci.yml)
[![Deploy](https://github.com/California-Cadet-Corps/cacc-start/actions/workflows/deploy.yml/badge.svg)](https://github.com/California-Cadet-Corps/cacc-start/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A Node.js application maintained by the California Cadet Corps. This repository follows a **controlled contribution workflow**: all changes land on `main` exclusively through reviewed, CI-validated Pull Requests, and merges to `main` deploy automatically to production.

---

## Table of contents

- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Contribution workflow](#contribution-workflow)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

---

## Quick start

Requires **Node.js 20+** (see [`.nvmrc`](./.nvmrc)).

```bash
# 1. Clone
git clone https://github.com/California-Cadet-Corps/cacc-start.git
cd cacc-start

# 2. Install dependencies
npm ci

# 3. Copy environment template and edit as needed
cp .env.example .env

# 4. Run locally
npm start
# → http://localhost:3000
```

| Script          | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `npm start`     | Start the production server                          |
| `npm run dev`   | Start with auto-reload (Node `--watch`)              |
| `npm run build` | Build step (no-op placeholder until a bundler added) |
| `npm test`      | Run the test suite                                   |
| `npm run lint`  | Lint sources                                         |

## Project structure

```
cacc-start/
├── src/                 # Application source
│   ├── server.js        # HTTP server entry point
│   └── public/          # Static assets served by the app
├── deploy/              # Server provisioning artifacts (not deployed by CI)
│   ├── apache/          # Apache reverse-proxy vhost
│   ├── systemd/         # systemd service unit
│   └── scripts/         # server-setup.sh, rollback.sh
├── docs/                # Contributor & operator documentation
├── .github/
│   ├── workflows/       # ci.yml (PR checks), deploy.yml (production deploy)
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
└── package.json
```

## Contribution workflow

```
fork / feature branch  →  open PR  →  CI validates  →  maintainer approves  →  merge  →  auto-deploy
```

1. Create a feature branch (or fork) — **direct pushes to `main` are blocked**.
2. Open a Pull Request against `main`.
3. CI (`.github/workflows/ci.yml`) runs automatically and must pass.
4. A maintainer reviews and approves (1 approval required, all conversations resolved).
5. The PR is merged.
6. Merging to `main` triggers production deployment automatically.

Full details: **[docs/CONTRIBUTING-PRS.md](./docs/CONTRIBUTING-PRS.md)** and **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## Deployment

Production runs on a **Linode** server behind **Apache** (reverse-proxying to the Node app on `127.0.0.1:3002`), served at **https://start.cacadets.org**. Deployment is automated: a push to `main` runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), which builds the app and ships it over SSH using an atomic, symlinked-release strategy that supports instant rollback.

- How it works → **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**
- Rolling back → **[docs/ROLLBACK.md](./docs/ROLLBACK.md)**
- One-time server provisioning → **[docs/SERVER_SETUP.md](./docs/SERVER_SETUP.md)**
- Required GitHub Secrets → **[docs/SECRETS.md](./docs/SECRETS.md)**

> **Production note:** the app listens on port **3002** (port 3000 was already taken on the shared Linode host). The port lives in the server's `shared/.env` and the deploy health check reads it from there.

## Documentation

| Document | What it covers |
| -------- | -------------- |
| [docs/CONTRIBUTING-PRS.md](./docs/CONTRIBUTING-PRS.md) | How contributors create Pull Requests |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | How the deployment pipeline works end to end |
| [docs/ROLLBACK.md](./docs/ROLLBACK.md) | How to roll back a failed deployment |
| [docs/SECRETS.md](./docs/SECRETS.md) | How to configure the GitHub Secrets |
| [docs/SERVER_SETUP.md](./docs/SERVER_SETUP.md) | One-time Linode/Nginx/SSL provisioning |
| [docs/ONBOARDING.md](./docs/ONBOARDING.md) | How to onboard future maintainers |

## License

[MIT](./LICENSE) © California Cadet Corps
