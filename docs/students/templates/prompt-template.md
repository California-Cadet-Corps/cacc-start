# 🤖 Prompt Template (for Claude)

> Fill in the blanks to build a strong prompt using the **C.L.E.A.R.** recipe.
> The more specific you are, the better Claude's answer will be.

---

## Fill-in-the-blanks prompt

```
Context: I'm a beginner working on ________________________________.

Language/tools: Please use ______________________ (and don't use ______________).

Exactly what I want: ____________________________________________________.

Anything to avoid: Keep it simple — I'm a beginner. Don't ________________.

Result format: Show me ______________ and explain each part in one sentence.
```

---

## Ready-to-use prompts (copy, paste, fill the [brackets])

**🐛 Fix an error**
```
I got this error: [paste the WHOLE error here].
I was trying to [what you were doing].
Explain what it means in simple words and show me how to fix it.
```

**📖 Understand code**
```
Explain what this code does, line by line, like I'm 12:
[paste the code here]
```

**💡 Brainstorm**
```
I want to add a feature where users can [your idea].
Give me 3 simple ways to do it and tell me which is easiest for a beginner.
```

**✅ Check my work**
```
Here's my code: [paste it].
Is anything wrong, or is there a simpler way? Don't rewrite everything —
just point out the important things.
```

**🧪 Write a test**
```
Write a simple test using Node's built-in test runner (node --test) that checks
[my feature does X]. Here's the code it should test: [paste it]. Explain each line.
```

---

## ⚠️ Never put these in a prompt
- Passwords or secret keys 🔑
- Your home address, phone number, or other private info
- Anything you wouldn't want a stranger to read

## Remember
- Always **test** code from AI — it can make mistakes.
- Ask follow-ups: *"Can you explain step 3 more simply?"*
- *You* are the boss. Claude is your helper. 🧠
