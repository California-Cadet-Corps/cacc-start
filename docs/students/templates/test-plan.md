# ✅ Test Plan Template

> List everything you'll check *before* opening your Pull Request. Fill in the table,
> then actually do each test and mark ✅ or ❌. Fix every ❌ before you push!

---

## What I'm testing
(e.g. "The new Join button on the homepage")

## My test cases

| # | What I'm testing | Steps to do it | What SHOULD happen | What ACTUALLY happened | ✅/❌ |
|---|------------------|----------------|--------------------|------------------------|------|
| 1 |                  |                |                    |                        |      |
| 2 |                  |                |                    |                        |      |
| 3 |                  |                |                    |                        |      |
| 4 |                  |                |                    |                        |      |

---

## Don't forget the "try to break it" tests 😈

| # | Mean test | What SHOULD happen | ✅/❌ |
|---|-----------|--------------------|------|
| 1 | Click the button super fast many times | Nothing breaks |      |
| 2 | Leave a text box empty and submit | Shows a friendly message, doesn't crash |      |
| 3 | Type weird text (emojis 😀, very long text) | Handles it gracefully |      |
| 4 | Open it on a phone-size screen | Looks good, everything tappable |      |

---

## Automated checks (run these in the terminal)

- [ ] `npm run lint` → passed
- [ ] `npm test` → passed

---

## Final sign-off

- [ ] Every acceptance criterion from my Feature Spec is met.
- [ ] I tested it myself in the browser.
- [ ] All ❌ above are fixed.

✅ **All done? You're ready to open your Pull Request!**
