---
name: grill-with-docs
phase: 2
description: Challenges your plan against the domain model. Updates CONTEXT.md and ADRs inline.
triggers:
  - "grill with docs"
  - "challenge my plan"
  - "validate against domain"
  - "grill this"
  - "review my approach"
works-best-with: claude
compatible-with: [codex, cursor, gemini-cli, copilot, opencode]
min-model: sonnet-class
tokens: medium
---

## Why This Matters

The most expensive mistake in software is building the wrong thing correctly.
You can write perfect code that solves the wrong problem, uses the wrong terms,
or misunderstands how the domain actually works.

This skill interrogates your plan — one hard question at a time — before a
single line of code is written. It checks your thinking against your own
domain model (the glossary in CONTEXT.md), flags inconsistencies, surfaces
assumptions, and updates your shared knowledge base as decisions crystallise.

Engineers who skip this step discover the misalignment in production.
Engineers who run it discover it in five minutes.

---

## When to Use This Skill

Use this when:

- You're about to start building a new feature or module
- You have a plan and want to stress-test it before committing
- You want to check if your approach aligns with the established domain model
- You're resuming a project and want to re-ground before continuing

Don't use this for:

- Micro-level implementation decisions (naming a variable, choosing a loop)
- Debugging an existing issue — use `/diagnose` instead
- Pure exploratory prototyping — use `/prototype` instead

---

## Quick Reference

1. Load MANIFEST.md and CONTEXT.md
2. Ask about what you're planning to build
3. Ask one grilling question at a time — give recommendation first
4. Flag any terminology that conflicts with CONTEXT.md
5. Flag any assumption that isn't documented
6. Update CONTEXT.md with new terms as they emerge
7. Log any architectural decisions to `docs/adr/`
8. Output navigation footer

---

## Full Protocol

### Step 1 — Load Context

Before asking anything, the agent reads:

- `.sovereign/MANIFEST.md` — current phase, active tracks, key decisions
- `.sovereign/CONTEXT.md` — full ubiquitous language glossary
- `.sovereign/SOVEREIGN.md` — phase gate status, active tracks
- Any relevant ADRs referenced in MANIFEST.md

The agent does not announce this. It simply arrives informed.

### Step 2 — Opening Frame

The agent asks:

```
What are you planning to build or change?

Describe it in your own words — don't worry about being precise yet.
The more context you give, the sharper the questions will be.
```

After the user responds, the agent reads the description carefully
against CONTEXT.md before asking a single question.

### Step 3 — The Grilling (one question at a time)

The agent works through the following interrogation dimensions.
It does NOT ask all questions — it asks only the ones that surface
real tension or risk in the specific plan described.

**Terminology alignment:**
Is the user using terms consistently with CONTEXT.md?
If not, the agent flags it immediately:

```
⚡ TERMINOLOGY FLAG

You used "[user's term]" — in this project we've defined that concept
as "[CONTEXT.md term]".

Are these the same thing, or is "[user's term]" something new
that needs its own glossary entry?

My recommendation: [agent's interpretation]
```

**Assumption surfacing:**
What is the user assuming that isn't documented?

```
You're assuming [X]. That assumption isn't documented anywhere in
the project's decisions.

Is [X] a deliberate design choice, or something you haven't
explicitly decided yet?

My recommendation: [agent's view on whether this is safe to assume]
```

**Domain model consistency:**
Does this plan fit the established domain model?

```
The way you've described [Y] would mean [entity] needs to know about
[other entity]. Currently [entity] sits in the [context] bounded
context and has no dependency on [other context].

Are you proposing to add that dependency, or is there a way to
achieve this without crossing that boundary?

My recommendation: [concrete suggestion]
```

**Hidden complexity:**
What will be harder than it looks?

```
[Feature X] sounds straightforward, but it implies [edge case].

For example: what happens when [specific scenario]?

Have you accounted for this? My recommendation: [approach]
```

**Acceptance criteria:**
Does the plan have a clear definition of done?

```
How will you know when this is complete?

What's the observable behaviour that proves this works correctly?

My recommendation: [suggested acceptance criteria]
```

### Step 4 — Inline Updates

As decisions crystallise during the grilling, the agent:

**Adds new terms to CONTEXT.md:**

```
📝 CONTEXT.md UPDATED

Added term: "Settlement Batch"
Definition: A group of transactions processed together by the
payment provider at end of day. Distinct from a "Transaction"
which is a single payment event.
```

**Logs architectural decisions to docs/adr/:**

```
📝 ADR LOGGED: ADR-[N].md

Decision: Settlement batches are processed asynchronously via
a nightly job, not in real-time per transaction.
Reason: Paystack settles T+1. Real-time processing would create
phantom balance states.
Alternatives considered: Real-time reconciliation (rejected —
not supported by gateway), manual processing (rejected — not scalable).
```

### Step 5 — Completion Report

When the grilling is complete:

```
GRILL-WITH-DOCS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Questions asked:     [N]
Terminology flags:   [N]
Assumptions surfaced:[N]
CONTEXT.md updates:  [N new terms]
ADRs logged:         [N]

Key decisions made:
  → [Decision 1]
  → [Decision 2]

Risks that remain open:
  → [Risk 1 — recommended action]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETED: Grill with Docs
   CONTEXT.md updated | [N] ADRs logged

▶  NEXT: Write Spec
   Turn this grilled plan into a formal specification.
   Run: /write-spec

◎  ALSO AVAILABLE:
   /api-spec     — design the API contract for this feature
   /adr-log      — log a decision manually
   /handoff      — save session state before ending

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Output

| File                             | Action  | Description                    |
| -------------------------------- | ------- | ------------------------------ |
| `.sovereign/CONTEXT.md`          | Updated | New terms added inline         |
| `.sovereign/MANIFEST.md`         | Updated | Term count, last updated       |
| `.sovereign/docs/adr/ADR-[N].md` | Created | One per architectural decision |
| `.sovereign/SOVEREIGN.md`        | Updated | Phase 2 gate progress          |

---

## Navigation

Before this: `/grill-idea`, `/ubiquitous-language`, `/council`  
After this: `/write-spec`, `/api-spec`, `/spec-review`

---

## Example Session

```
Agent: What are you planning to build or change?

User: I want to add a wallet feature so users can top up their balance
      and pay for things without entering card details every time.

Agent: Good. Before we go further — in CONTEXT.md we have "Account"
       defined as a user's profile and credentials. Is a "Wallet" a
       property of an Account, or a separate entity that belongs to
       an Account?

       My recommendation: Wallet should be a separate entity. Accounts
       already carry too much — mixing balance state into them will make
       both harder to maintain. A Wallet belongs to an Account (1:1)
       but has its own lifecycle.

       How do you see it?

User: Yeah separate entity makes sense.

Agent: 📝 CONTEXT.md UPDATED — Added "Wallet": A financial entity
       belonging to an Account that holds a spendable balance.
       Distinct from Account (authentication/profile) and
       Transaction (a single payment event).

       Next question: when a user tops up their wallet, what is the
       source of funds? Card payment only, or also bank transfer?

       My recommendation: support both from the start. Adding bank
       transfer later requires rearchitecting the top-up flow.
       Paystack supports both — same integration, different channel.

User: Both, yes. Good point.

Agent: What's the minimum top-up amount? And is there a maximum?

       My recommendation: minimum 100 NGN (matches Paystack's floor),
       maximum 500,000 NGN per transaction for regulatory reasons
       (CBN threshold for KYC requirements). Document this as a
       business rule in CONTEXT.md, not hardcoded in the app.

User: 500 NGN minimum, let's say 1M maximum.

Agent: 📝 ADR LOGGED: ADR-007.md — Wallet top-up limits.
       Min: 500 NGN. Max: 1,000,000 NGN.
       Reason: Business decision. Review if CBN KYC thresholds change.

       ...
```

---

## Token Cost

Conservative mode: ~800–1,500 tokens per session  
Balanced mode: ~1,500–3,000 tokens per session  
Rich mode: ~3,000–5,000 tokens per session

Token cost scales with complexity of the plan being grilled, not with
the length of the session. A complex multi-service feature costs more
to grill than a simple CRUD endpoint.

---

## References

- `.sovereign/CONTEXT.md` — loaded at start
- `.sovereign/MANIFEST.md` — loaded at start
- `docs/standards/ADR_FORMAT.md` — ADR structure
- Matt Pocock's grill-with-docs — original inspiration

---

_sovereign-base/sovereign v1.0.0_
