# 3. 🚀 How Deployment Works

"**Deploy**" is a fancy word for: *"put the code onto the real website so the whole
world can see it."*

The amazing part? **You don't do it manually.** When your PR is merged, a service
called **Vercel** takes your code and publishes it to
[start.cacadets.org](https://start.cacadets.org) all by itself. Let's see how. 🤖

---

## The journey of your code

```
You merge your PR into `main`
        │
        ▼
🤖 GitHub Actions runs CI first ("Oh! main changed!")
        │
        ├─ 1. Installs the building blocks   (npm ci)
        ├─ 2. Runs all the tests             (npm test)
        └─ 3. Lints the code                 (npm run lint)
        │
        ▼
▲ Vercel notices the new commit on `main` too
        │
        ├─ 1. Grabs the newest code
        ├─ 2. Serves it straight from src/public/  (no build needed!)
        └─ 3. Switches the website to the new version  (instantly!)
        │
        ▼
🌍 start.cacadets.org now shows your change!
```

This whole thing usually takes **1–2 minutes**.

---

## Where does the website actually live?

On **Vercel**, a hosting service that serves our static site straight from the
`src/public/` folder in this repo — no server to babysit. Every push to `main`
gets its own deployment, and Vercel keeps the previous ones around too.

You don't need to touch Vercel yourself — that's a job for the grown-up
maintainers. But now you know where the website actually lives! 🖥️

---

## What if a deploy goes wrong?

We built in safety nets:

- **Tests run first.** CI runs on every PR, *before* it can be merged. If your
  code fails the tests, it can't reach `main` in the first place.
- **Instant undo.** Vercel keeps every past deployment. If a bad version sneaks
  through, a maintainer can switch back to a previous one in seconds from the
  Vercel dashboard. (This is called a "rollback.")

So even if something breaks, **the website doesn't stay broken.** 😌

---

## How can I tell if my change is live?

1. Once your PR is merged, ask a maintainer to check the **Vercel dashboard**
   for the project — it shows the new deployment going from *Building* to
   *Ready*.
2. Once it's ready, visit [start.cacadets.org](https://start.cacadets.org) and
   find your change. 🎉

---

## Words to know

| Word | Kid-friendly meaning |
|------|---------------------|
| **Deploy** | Publish the code to the real website |
| **CI** | The robots that test your code automatically before it can merge |
| **Vercel** | The hosting service that publishes and serves the website |
| **Production** | The real, live website that visitors use |
| **Rollback** | Undo a deploy — switch back to the last good version |

---

## 🧠 Why automate all this?

Imagine if a person had to copy files to the server by hand every time. They'd make
mistakes, forget steps, and it'd take forever. Robots do the *exact same steps*
every single time, perfectly. That's the magic of automation — humans plan and
create, robots do the boring repetitive parts. 🤝

➡️ **Next:** [Prompt Engineering with Claude](./04-prompt-engineering-with-claude.md)
