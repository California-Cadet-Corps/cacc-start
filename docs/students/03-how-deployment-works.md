# 3. 🚀 How Deployment Works

"**Deploy**" is a fancy word for: *"put the code onto the real website so the whole
world can see it."*

The amazing part? **You don't do it manually.** When your PR is merged, robots take
your code and publish it to [start.cacadets.org](https://start.cacadets.org) all by
themselves. Let's see how. 🤖

---

## The journey of your code

```
You merge your PR into `main`
        │
        ▼
🤖 GitHub Actions wakes up ("Oh! main changed!")
        │
        ├─ 1. Grabs the newest code
        ├─ 2. Installs the building blocks   (npm ci)
        ├─ 3. Builds the project             (npm run build)
        ├─ 4. Runs all the tests             (npm test)   ← if these fail, it STOPS. Live site untouched!
        ├─ 5. Sends the code to our server   (over a secure connection called SSH)
        ├─ 6. Switches the website to the new version  (instantly!)
        └─ 7. Checks the site is healthy     (visits /healthz)
        │
        ▼
🌍 start.cacadets.org now shows your change!
```

This whole thing usually takes **1–3 minutes**.

---

## Where does the website actually live?

On a computer in a data center called a **server**. Ours is rented from a company
called **Linode**. It runs 24/7 so the website is always on. A program called
**Nginx** answers visitors and passes them to our Node.js app.

You don't need to touch the server — that's a job for the grown-up maintainers. But
now you know it's a real computer somewhere, running your code! 🖥️

---

## What if a deploy goes wrong?

We built in safety nets:

- **Tests run first.** If your code fails the tests, the deploy stops *before*
  touching the live site. The old, working version keeps running.
- **Instant undo.** Every version is saved. If a bad version sneaks through, a
  maintainer can switch back to the previous one in seconds. (This is called a
  "rollback.")
- **Health check.** After deploying, the robot visits a special `/healthz` page to
  make sure the site is alive. If not, it raises the alarm.

So even if something breaks, **the website doesn't stay broken.** 😌

---

## How can I tell if my change is live?

1. Go to the [**Actions** tab](https://github.com/California-Cadet-Corps/cacc-start/actions)
   on GitHub.
2. Find the run named **"Deploy to Production"** for your merge.
3. 🟡 Yellow dot = still working. ✅ Green = live! ❌ Red = something failed (tell a mentor).
4. Once it's green, visit [start.cacadets.org](https://start.cacadets.org) and find
   your change. 🎉

---

## Words to know

| Word | Kid-friendly meaning |
|------|---------------------|
| **Deploy** | Publish the code to the real website |
| **CI/CD** | The robots that test (CI) and publish (CD) your code automatically |
| **Server** | A computer that runs the website 24/7 |
| **Production** | The real, live website that visitors use |
| **Rollback** | Undo a deploy — switch back to the last good version |
| **SSH** | A secure, locked tunnel used to talk to the server |

---

## 🧠 Why automate all this?

Imagine if a person had to copy files to the server by hand every time. They'd make
mistakes, forget steps, and it'd take forever. Robots do the *exact same steps*
every single time, perfectly. That's the magic of automation — humans plan and
create, robots do the boring repetitive parts. 🤝

➡️ **Next:** [Prompt Engineering with Claude](./04-prompt-engineering-with-claude.md)
