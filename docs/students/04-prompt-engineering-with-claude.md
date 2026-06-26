# 4. 🤖 Prompt Engineering with Claude

**Claude** is an AI assistant that can help you write code, fix errors, explain
things, and brainstorm ideas. But here's the secret:

> **The quality of Claude's answer depends on the quality of your question.**

"Prompt engineering" is just a fancy phrase for **asking really good questions.**
A *prompt* is the message you send to the AI. Let's learn to write great ones! ✨

---

## The #1 rule: be specific

Compare these:

| 😕 Weak prompt | 😎 Strong prompt |
|---------------|------------------|
| "Make a button" | "Create a blue button that says 'Sign Up' and gets darker when you hover over it." |
| "It's broken, help" | "When I run `npm test`, I get this error: [paste error]. What does it mean and how do I fix it?" |
| "Write code for the homepage" | "Write the HTML for a homepage with a title 'Welcome Cadets', a short paragraph, and a button linking to /join." |

The AI can't read your mind. The more detail you give, the better the result. 🎯

---

## The C.L.E.A.R. recipe for prompts

Use this checklist to build a strong prompt:

- **C — Context:** What are you working on? ("I'm building the homepage for a cadet website.")
- **L — Language/tools:** What should it use? ("Use plain HTML and CSS, no extra libraries.")
- **E — Exactly what you want:** The specific task. ("Add a navigation bar with 3 links: Home, About, Join.")
- **A — Anything to avoid:** Limits or rules. ("Keep it simple — I'm a beginner. Don't use JavaScript yet.")
- **R — Result format:** How you want the answer. ("Show me the full file and explain each part in one sentence.")

---

## ✍️ A great prompt, built with C.L.E.A.R.

> **Context:** I'm a beginner building the California Cadet Corps homepage.
> **Language:** Use plain HTML and CSS only.
> **Exactly:** Add a navigation bar at the top with links to Home, About, and Join.
> **Avoid:** Don't use any JavaScript or outside libraries — keep it beginner-friendly.
> **Result:** Show the full HTML, then explain each part in one short sentence.

See how much better that is than "make a navbar"? 🙌

---

## Super useful prompts to keep handy

**🐛 When you have an error:**
> "I got this error: [paste the whole error]. I was trying to [what you were doing].
> Explain what it means in simple words and show me how to fix it."

**📖 When you don't understand code:**
> "Explain what this code does, line by line, like I'm 12: [paste the code]"

**💡 When you're stuck on an idea:**
> "I want to add a feature where users can [your idea]. What are 3 simple ways to do
> it, and which is easiest for a beginner?"

**✅ When you want to check your work:**
> "Here's my code: [paste it]. Is there anything wrong or any way to make it simpler?
> Don't rewrite everything — just point out the important things."

**🧪 When you need a test:**
> "Write a simple test that checks my [feature] works. I'm using Node's built-in test
> runner (`node --test`). Here's the code being tested: [paste it]"

---

## 🚦 Smart habits

✅ **DO:**
- Give Claude the *actual* error message and the *actual* code (copy-paste it).
- Ask follow-up questions if the answer is confusing: "Can you explain step 3 more simply?"
- Ask it to explain, not just to do — that's how you *learn*.
- Tell it your skill level ("I'm a beginner") so it explains things.

❌ **DON'T:**
- Just copy-paste code you don't understand. Ask "what does this do?" first.
- Share private info (passwords, secret keys, your home address). Never put a real
  password or secret in a prompt!
- Believe everything blindly — AI sometimes makes mistakes. **Always test the code.**
- Forget *you're* the boss. The AI is a helper; you make the decisions.

---

## 🧠 The most important idea

AI won't do your thinking for you — and you wouldn't want it to! The fun part *is*
the thinking: deciding what to build, solving the puzzle, making it yours. Use Claude
like a super-smart helper sitting next to you, not like a vending machine.

The students who get the best results are the ones who **ask great questions** and
**understand the answers.** That's you now. 💪

📝 Grab the [Prompt Template](./templates/prompt-template.md) to make your own great prompts.

➡️ **Next:** [Product Management 101](./05-product-management.md)
