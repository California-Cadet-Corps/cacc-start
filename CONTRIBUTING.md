# Contributing to cacc-start

Thanks for helping improve the California Cadet Corps start portal! This project
uses a **controlled contribution workflow** — every change reaches `main` through
a reviewed, CI-validated Pull Request.

## TL;DR

```
fork / feature branch → open PR → CI passes → maintainer approves → merge → auto-deploy
```

You **cannot** push directly to `main` — it is protected by a branch ruleset.

## 1. Set up

```bash
git clone https://github.com/California-Cadet-Corps/cacc-start.git
cd cacc-start
npm ci
cp .env.example .env
npm run dev
```

## 2. Create a branch

```bash
git switch -c feat/short-description    # or fix/..., docs/..., chore/...
```

External contributors: **fork** the repo and branch in your fork.

## 3. Make your change

- Keep PRs focused and reasonably small.
- Match the existing code style (see `.editorconfig`).
- Add or update tests in `test/`.
- Run the checks CI will run:

```bash
npm run lint
npm test
npm run build
```

## 4. Open a Pull Request

- Target the `main` branch.
- Fill out the PR template.
- CI runs automatically and must pass.
- A maintainer reviews; address feedback by pushing more commits.
- **Resolve all conversations** and keep your branch **up to date with `main`**.

## 5. After approval

Once approved and green, a maintainer merges. Merging to `main` **automatically
deploys to production** (https://start.cacadets.org). No manual deploy step.

A detailed walk-through lives in [docs/CONTRIBUTING-PRS.md](./docs/CONTRIBUTING-PRS.md).

## Commit messages

Conventional, imperative style is appreciated:

```
feat: add cadet roster import
fix: correct timezone on event dates
docs: clarify rollback steps
```

## Reporting bugs / requesting features

Use the [issue templates](https://github.com/California-Cadet-Corps/cacc-start/issues/new/choose).
For open-ended questions, use [Discussions](https://github.com/California-Cadet-Corps/cacc-start/discussions).

## Security

Please do **not** open public issues for security problems. See [SECURITY.md](./SECURITY.md).
