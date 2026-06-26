# 2. 📤 How to Make a Pull Request

A **Pull Request** (we call it a "PR") is how you say:

> "Hey team, I made a change. Will you check it and add it to the real website?"

You can't change the live website directly — and that's a *good* thing! It means
you can never accidentally break it. Every change gets checked first. 🛡️

> 🧠 **The idea in one sentence:** make your change on a *branch*, push it to GitHub,
> open a PR, and a mentor reviews and approves it before it goes live.

---

## The whole thing in one picture

```
1. Make a branch      →  git switch -c feat/my-cool-thing
2. Edit code in VS Code
3. Save your work     →  git add  +  git commit
4. Send to GitHub     →  git push
5. Open the PR        →  on the website (or `gh pr create`)
6. Robots test it     →  CI runs automatically ✅
7. A mentor reviews   →  they approve, or ask for changes
8. Merge!             →  it goes LIVE 🚀
```

---

## Step 1: Get the latest code first

Before starting anything new, grab the newest version so you're up to date.

**If you cloned the project directly:**
```bash
git switch main
git pull
```

**If you forked:**
```bash
git switch main
git pull upstream main
```

---

## Step 2: Make a branch 🌿

A **branch** is your own safe workspace. Think of the project like a tree: `main`
is the trunk (the real website), and your branch is a little branch you can
experiment on without hurting the tree.

Name it after what you're doing. Use `feat/` for a new feature, `fix/` for a bug fix:

```bash
git switch -c feat/add-welcome-message
```

> ✏️ Good branch names: `feat/contact-form`, `fix/broken-link`, `docs/update-readme`
> Use dashes, no spaces, all lowercase.

---

## Step 3: Make your change

Edit files in VS Code. Save often (`Ctrl + S` on Windows, `Cmd + S` on Mac).

Want to see your change? Run the site:
```bash
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000). Press `Ctrl + C` to stop.

---

## Step 4: Check your work before sharing

Run the same checks the robots will run. **Do this before every PR:**

```bash
npm run lint    # checks your code for mistakes
npm test        # checks the site still works
```

If you see green ✅ / "pass" — great! If you see red ❌, read the message and fix it.
(Stuck? Paste the error to Claude and ask what it means.)

---

## Step 5: Save your work with Git

Two commands. First, "stage" your changes (pick what to save):
```bash
git add .
```
(The `.` means "everything I changed.")

Then "commit" them (save with a short message describing what you did):
```bash
git commit -m "Add a friendly welcome message to the homepage"
```

> 💬 **Good commit messages** say *what* you did, like a tiny headline:
> - ✅ `Fix typo in the about section`
> - ✅ `Add a button that scrolls to the top`
> - ❌ `stuff` (too vague!)
> - ❌ `asdfasdf` (please no 😅)

---

## Step 6: Push to GitHub ☁️

Send your branch up to GitHub:
```bash
git push -u origin feat/add-welcome-message
```
(Use *your* branch name.) After the first push, you can just type `git push` next time.

---

## Step 7: Open the Pull Request

### The easy way (website)
After you push, GitHub prints a link in your terminal — click it! Or:
1. Go to the [repo on GitHub](https://github.com/California-Cadet-Corps/cacc-start).
2. You'll see a yellow banner: **"Compare & pull request."** Click it.
3. Fill in the boxes (a template appears to guide you).
4. Click **Create pull request**.

### The command-line way (optional)
If you installed the GitHub CLI:
```bash
gh pr create --base main --fill
```

---

## Step 8: The robots check your work (CI) 🤖

As soon as you open the PR, **CI** (Continuous Integration) automatically runs your
code through the same `lint`, `build`, and `test` checks. Watch the **Checks** tab
on your PR.

- ✅ **Green check** = robots are happy, you're good!
- ❌ **Red X** = something failed. Click "Details" to see what. Fix it, then:
  ```bash
  git add .
  git commit -m "Fix the thing CI complained about"
  git push
  ```
  The PR updates automatically and re-runs the checks. No need to open a new PR!

---

## Step 9: A mentor reviews your work 👀

A teacher or mentor will look at your PR. They might:
- ✅ **Approve it** — yes! Ready to go.
- 💬 **Leave comments** — they want a small change, or have a question.

If they ask for changes, don't take it personally — this happens to *every*
developer, even professionals. Just make the changes (Steps 3–6 again) and push.
Reply to their comments and click **"Resolve conversation"** when each one is handled.

> 📌 **Two rules to merge:** (1) at least one approval, and (2) every comment
> conversation marked "resolved." This keeps our website high-quality. 💪

---

## Step 10: Merge — and watch it go live! 🚀

Once approved and all green, your PR gets **merged** into `main`. The moment that
happens, the website **deploys automatically** to
[start.cacadets.org](https://start.cacadets.org). You didn't have to do anything —
the robots handle it!

Curious how that works? ➡️ [How Deployment Works](./03-how-deployment-works.md)

---

## 🆘 Common problems

| You see... | Fix |
|-----------|-----|
| `Updates were rejected` when pushing | Someone else changed `main`. Run `git pull origin main` (or `upstream main`), fix any conflicts, then push again. |
| "This branch is out-of-date with main" on your PR | Click **Update branch** on the PR page, or run the pull command above. |
| Red ❌ on CI | Click **Details**, read the error, fix it, commit, and push again. |
| You committed to `main` by accident | Tell a mentor — they'll help you move it to a branch. No harm done! |

✅ **You did it when:** your PR has a green check, an approval, and gets merged.
Go look at the live site — your work is on the internet! 🌍
