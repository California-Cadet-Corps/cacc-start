# 5. 📋 Product Management 101

Before you write a single line of code, you need to answer one question:

> **What are we building, and who is it for?**

That's **product management** (PM for short). A product manager is like the
*director of a movie* — they don't act, film, or edit, but they make sure everyone
knows the plan and the final movie is great. On our team, **everyone** does a little
PM before building. It saves you from building the wrong thing! 🎯

---

## Why bother planning?

Imagine building a treehouse with no plan. You'd grab random wood, start nailing,
and end up with... a mess. Planning first means you build the *right* thing, *once*.

> 🛑 **The rule:** Spend a little time planning so you don't waste a lot of time
> building the wrong thing.

---

## Step 1: Define the user 👤

A **user** is the person who will use what you build. Get specific!

- ❌ "People" (too vague)
- ✅ "A new cadet who wants to find out when the next meeting is."
- ✅ "A parent checking if their kid's uniform order is ready."

Ask yourself: **Who is this for? What do they need? What's annoying for them right now?**

---

## Step 2: Write user stories 📖

A **user story** is one sentence that captures what someone needs. It uses this
magic formula:

> **As a** [type of user], **I want** [to do something], **so that** [I get some benefit].

Examples:
- *As a* **cadet**, *I want* **to see the calendar of events**, *so that* **I don't miss a meeting.**
- *As a* **visitor**, *I want* **a "Join" button**, *so that* **I can sign up easily.**
- *As a* **parent**, *I want* **to find the contact email**, *so that* **I can ask questions.**

Why this formula? It keeps you focused on the **person** and the **benefit**, not
just the buttons. 🧠

📝 Use the [User Story template](./templates/user-story.md).

---

## Step 3: Define "done" with acceptance criteria ✅

**Acceptance criteria** are a checklist that says *exactly* when a feature is
finished. No guessing!

**User story:** *As a cadet, I want a calendar so I can see upcoming events.*

**Acceptance criteria:**
- [ ] There's a calendar on the page.
- [ ] It shows the event name, date, and time.
- [ ] Past events don't show up.
- [ ] It looks good on a phone *and* a computer.

When every box is checked, you're done. 🎉 This is also your testing checklist later!

---

## Step 4: Keep it small (MVP) 🍰

**MVP** = **Minimum Viable Product**. It's the *smallest* version that's still useful.

Don't try to build everything at once! Build the simplest useful version first, then
add more later.

> 🍰 **Cake analogy:** Don't try to bake a giant 5-layer wedding cake on day one.
> Make a tasty cupcake first. If people love it, *then* make it bigger.

**Example — "Events" feature:**
- 🟢 **MVP:** A simple list of upcoming events with dates. *(Build this first!)*
- 🟡 **Later:** Make it a pretty calendar grid.
- 🔴 **Someday:** Let people RSVP and get reminders.

---

## Step 5: Write it all down (the spec) 📄

A **spec** (short for "specification") is a one-page document that describes what
you're building. Anyone should be able to read it and understand the plan.

Fill out the [Feature Spec template](./templates/feature-spec.md) — it asks:
1. **What is it?** (one sentence)
2. **Who is it for?** (the user)
3. **Why does it matter?** (the benefit)
4. **What does it do?** (user stories)
5. **How do we know it's done?** (acceptance criteria)
6. **What are we NOT doing right now?** (keep it small!)

Put your spec in your Pull Request so reviewers know what you were trying to do. 🙌

---

## 🧠 The PM mindset

- **Start with the person, not the code.** Who needs this and why?
- **Smallest useful version first.** You can always add more.
- **Write it down.** A plan in your head is easy to forget; a plan on paper guides you.
- **It's okay to change the plan** when you learn something new. Good PMs adapt!

➡️ **Next:** [UI/UX Design 101](./06-ui-ux-101.md)
