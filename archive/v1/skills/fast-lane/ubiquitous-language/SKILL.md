---
name: ubiquitous-language
phase: 1
description: Establishes the project glossary. Every core noun and verb locked before specs are written.
triggers:
  - "ubiquitous language"
  - "define our terms"
  - "project glossary"
  - "shared vocabulary"
  - "define terms"
works-best-with: claude
compatible-with: [codex, cursor, gemini-cli, copilot, opencode]
min-model: sonnet-class
tokens: low
---

## Why This Matters

Every failed project has a language problem nobody noticed until it was too late.

The backend calls it a "User". The frontend calls it an "Account". The product
spec calls it a "Member". The database table is called "customers". They all
mean slightly different things — or exactly the same thing — and nobody is sure
which.

This ambiguity compounds. It enters variable names, API fields, database columns,
error messages, and team conversations. By the time someone notices, the codebase
has twelve words for the same concept and fixing it means touching everything.

This skill stops that from happening. Before specs are written, before code is
touched, every core noun and verb gets a precise definition. Written down.
Agreed on. Stored in CONTEXT.md where every agent and every engineer finds it
at the start of every session.

Five well-defined terms saves more engineering hours than almost anything else.

---

## When to Use This Skill

Use this when:

- Starting a new project (Phase 1, before anything else)
- A new domain concept keeps being discussed without a clear definition
- Two team members use the same word to mean different things
- You're bridging to a new project that needs to share your vocabulary

Don't use this for:

- Technical terms that are industry-standard (e.g. "middleware", "migration")
- Implementation details — this is about the domain, not the code

---

## Quick Reference

1. Load existing CONTEXT.md (or create it if empty)
2. Ask user to describe the core concepts in their domain
3. For each concept: clarify, define precisely, check for conflicts
4. Give recommendation on each definition before confirming
5. Write all terms to CONTEXT.md in the standard format
6. Identify bounded contexts if 2+ domains emerge
7. Output navigation footer

---

## Full Protocol

### Step 1 — Load Context

Read `.sovereign/CONTEXT.md` and `.sovereign/MANIFEST.md`.
Note any terms already defined to avoid duplication.

### Step 2 — Opening Question

```
Let's build your project's shared vocabulary.

Start by telling me: what are the 3–5 most important "things"
in your system? These are the nouns that will appear everywhere
— in your database, your API, your UI, and your team conversations.

Don't worry about precision yet. Just name them.
```

### Step 3 — Term Definition Loop

For each concept the user names, the agent works through:

**Clarification:**

```
You mentioned "[term]". Let's define it precisely.

In one sentence — what is a [term]? Not what it does,
but what it IS.

My interpretation: [agent's best read of the term from context]
Is that right, or is it something different?
```

**Boundary check:**

```
Is a [term] ever the same thing as [similar term they mentioned]?
Or are they always distinct?

My recommendation: treat them as [same/distinct] because [reason].
```

**Lifecycle question:**

```
Can a [term] be [state A] and then become [state B]?
Or does it only ever exist in one state?

My recommendation: [agent's view]
```

**Naming check:**

```
What do you call [term] in:
- The database?
- The API?
- The UI?
- Team conversations?

If the answers are different, we need to pick one and use it
everywhere. My recommendation: use "[term]" because [reason].
```

### Step 4 — Conflict Detection

After each term is defined, the agent checks against existing
CONTEXT.md entries:

```
⚡ CONFLICT DETECTED

"[New term]" as you've defined it overlaps with "[Existing term]"
which is already in CONTEXT.md.

Existing definition: [definition]
Your new definition: [definition]

Are these the same concept under different names, or genuinely different?

My recommendation: [merge them as X | keep them separate because Y]
```

### Step 5 — Bounded Context Detection

If the session reveals concepts that don't naturally belong together,
the agent flags it:

```
📌 BOUNDED CONTEXT DETECTED

The concepts you've described seem to fall into two distinct domains:

Domain A: [Payments] — Wallet, Transaction, Settlement, Refund
Domain B: [Identity] — User, Account, Session, Permission

In DDD terms, these are separate bounded contexts — each with their
own language. "Account" means something different in Payments
(a bank account) vs Identity (a user profile).

My recommendation: define these as two bounded contexts in CONTEXT.md
so the terms are scoped correctly. Otherwise "Account" will cause
confusion across your entire codebase.

Shall we define the bounded context boundaries now?
```

### Step 6 — Writing to CONTEXT.md

After each confirmed term, the agent writes it immediately:

```
📝 CONTEXT.md UPDATED

### Wallet
**Definition:** A financial entity belonging to an Account that
holds a spendable balance in NGN. Created automatically when an
Account is verified. Cannot be deleted — only deactivated.
**Used in:** Payments context, Transaction service, UI balance display
**Not to be confused with:** Account (authentication/profile),
Transaction (a single payment event)
**Example:** "The user's Wallet balance was insufficient to complete
the Transaction, so it fell back to card payment."
```

### Step 7 — Completion Report

```
UBIQUITOUS LANGUAGE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terms defined:          [N]
Conflicts resolved:     [N]
Bounded contexts:       [N]
CONTEXT.md updated:     ✅

Your project now speaks one language.
Every agent, every engineer, every session
starts from the same vocabulary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETED: Ubiquitous Language
   [N] terms defined | CONTEXT.md updated

▶  NEXT: Grill Idea
   Now that you have a shared language, stress-test the idea itself.
   Run: /grill-idea

◎  ALSO AVAILABLE:
   /council          — convene before going further
   /grill-with-docs  — challenge a specific plan
   /handoff          — save session state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Output

| File                     | Action  | Description                            |
| ------------------------ | ------- | -------------------------------------- |
| `.sovereign/CONTEXT.md`  | Updated | All new terms added in standard format |
| `.sovereign/MANIFEST.md` | Updated | Term count updated                     |

---

## Navigation

Before this: `/sovereign-init`, `/council`  
After this: `/grill-idea`, `/grill-with-docs`, `/write-spec`

---

## Example Session

```
Agent: What are the 3–5 most important "things" in your system?

User: Schools, students, teachers, and exam results.

Agent: Good. Let's start with "School" since everything else
       probably belongs to it.

       In one sentence — what is a School? Not what it does,
       but what it IS.

       My interpretation: A registered educational institution
       that has enrolled students and assigned teachers, and
       is the primary tenant in the system.

       Is that right?

User: Yes, exactly. Schools are our paying customers too.

Agent: Important distinction. So a School is both a domain entity
       (the institution) AND a billing customer.

       My recommendation: we keep "School" as the domain term and
       avoid calling it "Customer" in the codebase — that conflates
       two concerns. The billing relationship can be modelled as
       a "Subscription" that belongs to a School.

       Shall I add "School" and "Subscription" as separate terms?

User: Yes.

Agent: 📝 CONTEXT.md UPDATED — Added "School": A registered secondary
       educational institution that is the primary organisational
       unit and billing entity in the system. Contains Students,
       Teachers, and Classes. Maps to a single Subscription.

       Next — "Student". Is a Student always attached to a School,
       or can a Student exist independently?

User: Always attached. Can't have a student without a school.

Agent: Good — that's an important constraint.
       📝 CONTEXT.md UPDATED — Added "Student": A learner enrolled
       at a School. Cannot exist without a School. ...
```

---

## Token Cost

Conservative mode: ~400–800 tokens per session  
Balanced mode: ~800–1,500 tokens per session  
Rich mode: ~1,500–2,500 tokens per session

---

_sovereign-base/sovereign v1.0.0_
