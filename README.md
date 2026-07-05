# cacc-start

> Production application for **[start.cacadets.org](https://start.cacadets.org)** — the California Cadet Corps start/landing portal.

[![CI](https://github.com/California-Cadet-Corps/cacc-start/actions/workflows/ci.yml/badge.svg)](https://github.com/California-Cadet-Corps/cacc-start/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A Node.js application maintained by the California Cadet Corps. This repository follows a **controlled contribution workflow**: all changes land on `main` exclusively through reviewed, CI-validated Pull Requests, and merges to `main` deploy automatically to production.

---

## 🎒 New student developer? Start here!

Never coded before? No problem. The **[Student Developer Guide](./docs/students/README.md)**
walks you through everything from zero — with every exact command:

1. [Set up your laptop](./docs/students/01-setup-your-laptop.md) (Git, Node, VS Code, GitHub)
2. [Make a Pull Request](./docs/students/02-how-to-make-a-pull-request.md)
3. [How deployment works](./docs/students/03-how-deployment-works.md)
4. [Prompt engineering with Claude](./docs/students/04-prompt-engineering-with-claude.md)
5. [Product management 101](./docs/students/05-product-management.md)
6. [UI/UX design 101](./docs/students/06-ui-ux-101.md)
7. [Testing your work](./docs/students/07-testing-your-work.md)

Plus copy-and-paste **[templates](./docs/students/templates)** for specs, user stories, prompts, design checklists, test plans, and bug reports.

> **Teachers/mentors:** just give students the link to this repo and point them at the guide above.

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
│   ├── workflows/       # ci.yml (PR checks)
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

Production runs on **Vercel** (team `california-cadet-corps`, project `cacc-start`), served at **https://start.cacadets.org**. The site is deployed as static files from [`src/public/`](./src/public) (see [`vercel.json`](./vercel.json)) — merging to `main` triggers a production deploy automatically via Vercel's Git integration; PRs get preview deployments.

The local Node server (`npm start`) is for development only — it serves the same `src/public/` files.

> **Legacy Linode deployment (retired 2026-07-04):** production previously ran on the shared Linode behind Apache (Node app on `127.0.0.1:3002`, deployed over SSH by a GitHub Actions workflow). The old provisioning artifacts are kept in [`deploy/`](./deploy) and [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) / [`docs/ROLLBACK.md`](./docs/ROLLBACK.md) / [`docs/SERVER_SETUP.md`](./docs/SERVER_SETUP.md) / [`docs/SECRETS.md`](./docs/SECRETS.md) for rollback reference until the Linode is decommissioned.

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
