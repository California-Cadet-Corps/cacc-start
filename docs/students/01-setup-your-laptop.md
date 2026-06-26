# 1. 💻 Set Up Your Laptop

Time needed: about **30–45 minutes** (the downloads take a while — be patient!).

You'll install 4 things. Think of them like tools in a toolbox:

| Tool | What it is | Why you need it |
|------|-----------|-----------------|
| **Git** | Saves and shares your code | Like "Save" + "Track Changes" for code |
| **Node.js** | Runs the website on your laptop | The "engine" that powers our site |
| **VS Code** | Where you write code | Like Microsoft Word, but for code |
| **GitHub account** | Where the team's code lives online | Like Google Drive, but for code |

> 💡 **Windows or Mac?** Follow the section for your laptop. The commands are
> slightly different, so look for the right box.

---

## Step 1: Create a GitHub account

1. Go to **[github.com/signup](https://github.com/signup)**.
2. Use your school or a parent-approved email.
3. Pick a username you're okay with people seeing (it's public). Keep it school-appropriate!
4. Verify your email.

✅ **Done when:** you can log in to github.com.

---

## Step 2: Install VS Code (your code editor)

1. Go to **[code.visualstudio.com](https://code.visualstudio.com)**.
2. Click the big download button (it knows if you're on Windows or Mac).
3. Open the file and install it (keep clicking "Next" / "Agree").

✅ **Done when:** VS Code opens and you see a "Welcome" tab.

---

## Step 3: Install Git

### 🪟 On Windows

1. Go to **[git-scm.com/download/win](https://git-scm.com/download/win)** — it downloads automatically.
2. Open the installer. Click **Next** on every screen (the defaults are fine).
3. When it finishes, open **Git Bash** (search for it in the Start menu). This is a
   black window where you type commands. Don't worry, we'll go slow.

### 🍎 On Mac

1. Open the **Terminal** app (press `Cmd + Space`, type "Terminal", hit Enter).
2. Type this and press Enter:
   ```bash
   git --version
   ```
3. If Git isn't installed, a box pops up asking to install "Command Line Tools." Click **Install**.

✅ **Check it works** — type this in your terminal (Git Bash on Windows, Terminal on Mac):
```bash
git --version
```
You should see something like `git version 2.40.0`. The exact numbers don't matter.

---

## Step 4: Install Node.js

Node.js runs our website. We need **version 20** (the "LTS" version).

1. Go to **[nodejs.org](https://nodejs.org)**.
2. Download the version that says **"LTS"** (it's the safe, stable one).
3. Install it (click Next / Agree all the way through).

✅ **Check it works** — in your terminal, type:
```bash
node --version
```
You should see `v20.something` (or higher). Then check npm too:
```bash
npm --version
```
`npm` came free with Node — it's the tool that installs the building blocks our code needs.

---

## Step 5: Tell Git who you are

Git labels your work with your name. Type these two commands (use **your** name and
the email from your GitHub account):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Step 6: Get the code onto your laptop

There are two ways, depending on your role. **Ask your teacher which one you are:**

### Option A — You were added to the project ("collaborator")

You can copy the code directly:
```bash
git clone https://github.com/California-Cadet-Corps/cacc-start.git
cd cacc-start
```

### Option B — You're contributing from outside ("fork it!")

Most students do this. You make your **own copy** first:

1. Go to **[the repo](https://github.com/California-Cadet-Corps/cacc-start)**.
2. Click **Fork** (top right). This makes a copy under *your* account.
3. Now copy *your fork* to your laptop (replace `YOUR-USERNAME`):
   ```bash
   git clone https://github.com/YOUR-USERNAME/cacc-start.git
   cd cacc-start
   ```
4. Connect your copy back to the main project (so you can get updates later):
   ```bash
   git remote add upstream https://github.com/California-Cadet-Corps/cacc-start.git
   ```

> 🌳 **What's a "fork"?** It's your own copy of the project where you can experiment
> safely. When your work is ready, you'll send it back to the main project with a
> Pull Request (you'll learn that next!).

---

## Step 7: Install the building blocks & run the site!

Make sure your terminal is "inside" the project folder (you should see `cacc-start`
in the path). Then:

```bash
npm ci
```
This downloads the pieces our code needs. It might take a minute. ⏳

Now copy the settings file:
```bash
cp .env.example .env
```

And start the website on your laptop:
```bash
npm run dev
```

You'll see a message like `cacc-start listening on http://localhost:3000`.

🎉 **Open your web browser and go to [http://localhost:3000](http://localhost:3000)**

You should see the California Cadet Corps page! You're running the website on your
own computer. To stop it, click your terminal and press `Ctrl + C`.

---

## Step 8: Open the project in VS Code

```bash
code .
```
(That's the word `code`, then a space, then a dot.) VS Code opens with all the
project files on the left. This is your workshop! 🛠️

---

## 🆘 Common problems

| You see... | It means... | Fix |
|-----------|------------|-----|
| `command not found: git` (or node/npm) | The tool isn't installed or the terminal needs restarting | Close and reopen your terminal. Still broken? Reinstall that tool. |
| `npm ci` shows red `ERR!` lines | Sometimes the internet hiccuped | Run `npm ci` again. |
| `cp: command not found` (Windows) | You're not using Git Bash | Use **Git Bash**, not the Command Prompt. |
| Browser says "can't connect" | The site isn't running | Make sure `npm run dev` is still running in your terminal. |
| Port 3000 "already in use" | The site is already running somewhere | Press `Ctrl + C` in the other terminal, or restart your laptop. |

✅ **You're set up when:** you can see the website at `http://localhost:3000` and
open the project in VS Code.

➡️ **Next:** [How to Make a Pull Request](./02-how-to-make-a-pull-request.md)
