# 7. ✅ Testing Your Work

**Testing** means checking that your work actually does what it's supposed to do —
*before* you ask people to use it.

> 🚀 Real engineers test everything. NASA tests a rocket a thousand times before
> launch. You'll test your code so it doesn't "crash" on the live site!

There are two kinds of testing, and you'll use both:
1. **Manual testing** — *you* click around and check things with your own eyes.
2. **Automated testing** — *code* checks the code for you, automatically.

---

## Part 1: Manual testing (you, clicking around) 🖱️

This is the most important habit: **actually try your feature.** Don't just assume
it works!

### Make a test plan

Before testing, list what *should* happen. Remember the acceptance criteria from
[Product Management](./05-product-management.md)? That's your test list! 🎯

Use the [Test Plan template](./templates/test-plan.md). It looks like this:

| # | What I'm testing | Steps | What SHOULD happen | What ACTUALLY happened | ✅/❌ |
|---|------------------|-------|--------------------|------------------------|------|
| 1 | Join button works | Click "Join" | Goes to the join page | Went to join page | ✅ |
| 2 | Works on phone | Open on phone size | Button is tappable | Button too small | ❌ |

If something is ❌, you found a bug — fix it, then test again!

### Think like a troublemaker 😈

Don't just test the "happy path" (when everything goes right). Try to *break* it!

- What if I click the button **really fast** 10 times?
- What if I leave a box **empty**?
- What if I type **weird stuff** (emojis, super long text, numbers in a name)?
- What does it look like on a **tiny phone** *and* a **giant monitor**?

Finding bugs *before* users do is a superpower. 🦸

---

## Part 2: Automated testing (code checks code) 🤖

Our project has **automated tests** — little programs that check our website works.
The best part: they run **every time** you make a Pull Request, so mistakes get
caught automatically.

### Run the tests

In your terminal, inside the project:
```bash
npm test
```

- ✅ "pass" = everything works!
- ❌ "fail" = something's broken. Read which test failed — it tells you what's wrong.

> 💡 **Always run `npm test` before you push.** It's like spell-check before turning
> in an essay.

### What a test looks like

Open `test/server.test.js` to see real examples. A test has 3 parts — think
**"Arrange, Act, Check"**:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('the health check says ok', async () => {
  // 1. ARRANGE: start the server
  // 2. ACT: ask the server a question
  const response = await fetch('http://localhost:PORT/healthz');
  const data = await response.json();

  // 3. CHECK: is the answer what we expected?
  assert.equal(data.status, 'ok');   // "I expect status to equal 'ok'"
});
```

The key word is **`assert`** — it means *"I'm claiming this is true."* If it's NOT
true, the test fails and tells you. It's like saying "I bet you the answer is 'ok'" —
and the computer checks if you were right.

### Write your own test

When you add a feature, add a test for it! Use the pattern above:
1. Copy an existing test in `test/server.test.js`.
2. Change it to check *your* feature.
3. Run `npm test` to make sure it passes.

**Prompt to ask Claude for help:**
> "Write a simple test using Node's built-in test runner (`node --test`) that checks
> [my feature does X]. Here's the code it should test: [paste your code]. Explain
> each line."

---

## The testing checklist (do this before EVERY Pull Request) 📋

```
[ ] I ran  npm run lint   and it passed
[ ] I ran  npm test       and it passed
[ ] I opened the site (npm run dev) and clicked through my feature myself
[ ] I tried to break it (empty inputs, fast clicks, weird text)
[ ] I checked it on a phone-size screen
[ ] Every acceptance criterion from my plan is met
```

If all boxes are checked, you're ready to open your PR with confidence! 💪

---

## 🧠 Why testing matters

Without tests, you're *hoping* your code works. With tests, you *know* it does. Tests
also protect the next person — if someone later changes the code and breaks your
feature, the test catches it instantly. You're being a good teammate to your future
self and others. 🤝

🎉 **You've finished all the guides!** Head back to the
[Student Guide hub](./README.md) any time you need a refresher. Now go build
something awesome.
