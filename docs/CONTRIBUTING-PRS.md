# How to create a Pull Request

This project protects `main` with a ruleset: **no direct pushes**, PRs only,
1 approval, passing CI, resolved conversations. Here is the full path from idea
to merged change.

## 1. Get the code

**Org members** can branch directly in the repo:

```bash
git clone https://github.com/California-Cadet-Corps/cacc-start.git
cd cacc-start
git switch -c feat/my-change
```

**External contributors** fork first:

```bash
# Click "Fork" on GitHub, then:
git clone https://github.com/<you>/cacc-start.git
cd cacc-start
git remote add upstream https://github.com/California-Cadet-Corps/cacc-start.git
git switch -c feat/my-change
```

## 2. Develop and self-check

```bash
npm ci
cp .env.example .env
npm run dev          # http://localhost:3000

# Before pushing, run exactly what CI runs:
npm run lint
npm test
npm run build
```

## 3. Push and open the PR

```bash
git push -u origin feat/my-change
```

GitHub prints a link to open the PR, or use the CLI:

```bash
gh pr create --base main --fill
```

- Target branch **must** be `main`.
- Fill out the PR template (summary, linked issues, checklist).

## 4. CI runs automatically

The **CI** workflow installs deps, lints, builds, and tests. It must be green
before the PR is mergeable. Watch it under the PR's **Checks** tab or:

```bash
gh pr checks --watch
```

If CI fails, push fixes to the same branch — the PR and CI update automatically.

## 5. Review

- A maintainer (auto-requested via CODEOWNERS) reviews your PR.
- **At least one approval** is required.
- **All review conversations must be resolved** before merging.
- New commits **dismiss previous approvals** (re-review required) — so push all
  changes before asking for final approval.
- Keep your branch **up to date with `main`** (the ruleset requires it):

```bash
git fetch upstream
git rebase upstream/main      # or: git merge upstream/main
git push --force-with-lease    # only on your own feature branch
```

## 6. Merge & deploy

Once approved and green, a maintainer merges. **Merging to `main` automatically
triggers the production deploy** — see [DEPLOYMENT.md](./DEPLOYMENT.md). You do
not run any deploy commands yourself.

## Tips

- Keep PRs small and focused; large PRs are slower to review.
- Draft PRs (`gh pr create --draft`) are great for early feedback.
- Discussions are for open questions; Issues are for tracked bugs/features.
