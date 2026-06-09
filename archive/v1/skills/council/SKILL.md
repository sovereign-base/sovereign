---
name: council
phase: 1
description: Five advisor personas argue your decision. Anonymous peer review. Chairman verdict. Never trust the first answer.
triggers:
  - "council this"
  - "run the council"
  - "pressure-test this"
  - "stress-test this"
  - "war room this"
  - "debate this"
  - "convene the council"
  - "/council"
works-best-with: claude
compatible-with: [codex, cursor, gemini-cli, copilot, opencode]
min-model: opus-class
tokens: high
---

## Why This Matters

AI is agreeable. Ask it "should I build this?" and it finds reasons you should.
Ask "is this a bad idea?" and it finds reasons it is. Same idea. Different framing.
Opposite answers.

That's fine for writing emails. It's dangerous for product decisions, architectural
choices, and anything irreversible.

The Council fixes this by forcing structured disagreement. Five different thinking
styles attack the same question from fundamentally different angles. Their answers
are anonymised and peer-reviewed — each advisor critiques the others without knowing
who wrote what. A chairman synthesises where they agree, where they genuinely clash,
what all of them missed, and what to do.

You get the verdict you can actually trust, not the answer that sounded good in
the moment.

Run before any decision that is expensive to undo.

---

## When to Use This Skill

Use this when:

- Deciding whether a product idea deserves to be built
- Choosing between two or more architectural approaches
- Making a significant technology choice
- Evaluating a proposed pivot or major change
- Any decision that, if wrong, costs weeks or months to recover from

Don't use this for:

- Implementation details with a clear right answer
- Questions you've already decided — this is not for validation-seeking
- Simple debugging — use `/diagnose`
- Quick factual questions

---

## Quick Reference — Three Modes

| Mode     | Flag         | When                               | Token cost |
| -------- | ------------ | ---------------------------------- | ---------- |
| Express  | `--express`  | Small features, quick checks       | Low        |
| Standard | `--standard` | Default. All significant decisions | High       |
| Deep     | `--deep`     | Irreversible, high-stakes choices  | Very high  |

```
/council --express  "Should we add dark mode in v1?"
/council            "Should this be a monolith or microservices?"
/council --deep     "Should we rebuild on a new stack?"
```

---

## The Five Advisors

Each advisor has a distinct thinking style — not a persona, a lens.
They are designed to create natural tension with each other.

| Advisor             | Thinking Style      | Their Job                                           |
| ------------------- | ------------------- | --------------------------------------------------- |
| 🔴 The Skeptic      | Risk Hunter         | Assumes the idea has a fatal flaw. Finds it.        |
| 🔵 The Architect    | Systems Thinker     | Probes technical feasibility and hidden complexity. |
| 🟡 The Builder      | Action-First        | Only cares what gets built Monday morning.          |
| ⚪ The Outsider     | Fresh Eyes          | Zero context. Catches the curse of knowledge.       |
| 🟣 The Risk Officer | Compliance & Safety | Legal, regulatory, ethical, operational risk.       |

**Natural tensions:**

- Skeptic vs Builder (stop vs go)
- Architect vs Builder (rethink vs just do it)
- Outsider vs everyone (your assumptions vs reality)

---

## Full Protocol

### --express Mode

Single synthesized voice. The agent internally runs all five thinking
styles and produces one consolidated response with the key tensions surfaced.
Fastest. Good for features, not foundations.

```
COUNCIL EXPRESS — [question]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key tensions:
  → [Skeptic concern] vs [Builder pushback]
  → [Architect concern]

Blind spots:
  → [What all perspectives missed]

Recommendation: [Clear direct answer]
One thing to do first: [Specific action]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### --standard Mode (Default)

**Step 1 — Load project context**

Before the Council convenes, the agent reads:

- `.sovereign/MANIFEST.md` — phase, stack, key decisions
- `.sovereign/CONTEXT.md` — domain glossary
- Relevant ADRs if the question touches existing decisions

This context is injected into every advisor's framing so their
answers are grounded in this specific project, not generic advice.

**Step 2 — Frame the question**

The agent neutralises the question — removes loaded language,
removes implied answers, adds relevant context from SOVEREIGN files:

```
COUNCIL CONVENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question (as framed): [neutral version]

Project context injected:
  Phase: [current phase]
  Stack: [if decided]
  Relevant decisions: [ADR refs]
  Domain terms: [relevant CONTEXT.md terms]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Advisors deliberating...
```

**Step 3 — Five advisor responses (parallel)**

All five advisors respond to the neutrally-framed question with
their project context. Each leans fully into their assigned lens.
No hedging. No balance. The synthesis comes later.

Output format per advisor:

```
🔴 THE SKEPTIC
────────────────
[Response — leans fully into risk hunting]
[Assumes there is a fatal flaw and tries to find it]
[Does not balance. Does not hedge.]
```

**Step 4 — Anonymous peer review**

All five responses are randomised to Response A through E.
The agent then runs a peer review pass — each advisor reviews
all five anonymised responses and answers:

1. Which response is strongest and why?
2. Which has the biggest blind spot?
3. What did ALL responses miss?

This is the step that makes the Council more than "ask five times."
Blind review catches what the initial answers assumed away.

```
PEER REVIEW (anonymous)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strongest response: Response [X] — [reason]
Biggest blind spot: Response [Y] — [what it missed]
Missed by everyone: [insight that emerged only through review]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Step 5 — Chairman synthesis**

One final pass with all advisor responses (de-anonymised) and
the peer review results. The chairman produces the verdict:

```
CHAIRMAN SYNTHESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Where the council agrees:
  [High-confidence signals — what all or most advisors aligned on]

Where the council clashes:
  [Genuine disagreements — both sides explained, not dismissed]

Blind spots caught:
  [Things that only emerged through the peer review round]

Recommendation:
  [Clear, direct answer. Not "it depends." If it depends, say on what
   and give the recommendation for the most likely scenario.]

One thing to do first:
  [Single concrete next step]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Step 6 — Verdict and gate**

```
COUNCIL VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASS              — proceed as recommended
CONDITIONAL PASS  — proceed with stated conditions
BLOCKED           — do not proceed until issues resolved
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session saved to: .sovereign/council/council-[timestamp].md
Phase gate updated: SOVEREIGN.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### --deep Mode

Everything in --standard, plus:

- Each advisor can ask a follow-up question if their initial
  response was insufficient or the question is genuinely complex
- The peer review runs two rounds (initial + rebuttal)
- The chairman explicitly addresses minority positions — if one
  advisor's reasoning is strongest even though the majority disagrees,
  the chairman sides with the dissenter and explains why
- If external model providers are configured (Gemini, GPT, Grok),
  each advisor is assigned to a different model for genuine perspective
  diversity rather than simulated diversity

Use `--deep` only for decisions that are genuinely irreversible or
where the cost of being wrong is very high.

---

## Council in Adopt Mode

When running `/council` on an existing project (after `/sovereign-adopt`),
the Council shifts focus. Half the decisions are already locked in — the
Council doesn't redo them. Instead it focuses on:

- Which existing decisions are the highest risk?
- What should be changed vs accepted?
- What is the most critical gap to fill first?

The agent announces this shift at the start:

```
COUNCIL — ADOPT MODE
Existing project detected. Focusing on gap analysis and
risk prioritisation rather than fresh ideation.
```

---

## Proactive Council Suggestion

During Phase 3 architecture skills, if the agent detects an irreversible
decision is about to be made without Council consultation, it interjects:

```
⚡ COUNCIL RECOMMENDED

You're about to commit to [decision].
This decision is difficult to reverse once construction begins.
The Council has not been consulted on this yet.

Run: /council "Should we [decision] given [context]?"

Or: /council --skip to proceed without consultation.
    This will be flagged in the ADR.
```

---

## Output

| File                                        | Action  | Description                          |
| ------------------------------------------- | ------- | ------------------------------------ |
| `.sovereign/council/council-[timestamp].md` | Created | Full transcript + verdict            |
| `.sovereign/SOVEREIGN.md`                   | Updated | Council session logged, gate updated |
| `.sovereign/MANIFEST.md`                    | Updated | Phase status, key decisions          |

---

## Navigation

Before this: `/sovereign-init`, `/grill-idea`  
After this: `/ubiquitous-language`, `/grill-with-docs`, `/write-spec`

The Council runs in Phase 1 by default. It can also be called at any
point during Phase 3 architecture for high-stakes decisions.

---

## Example Session (--standard)

```
User: Council this — should I build this as a monolith or microservices?
      We're a 2-person team, targeting Nigerian schools, expecting
      10,000 users in year one.

Agent: COUNCIL CONVENING
       Question (neutralised): For a 2-person team building a
       B2B SaaS for Nigerian schools, targeting 10k users in year one,
       is a monolithic or microservices architecture more appropriate?

       Project context: Elixir/Phoenix considered, PostgreSQL,
       early stage, no existing codebase.

       Advisors deliberating...

🔴 THE SKEPTIC
────────────────
Microservices for a 2-person team is a trap. You will spend 40% of
your engineering time on infrastructure, service mesh, distributed
tracing, and inter-service communication — before you've validated
that anyone wants the product. The operational complexity is designed
for teams with dedicated platform engineers. You don't have that.
The fatal flaw: if this fails, it won't fail because your monolith
couldn't scale. It will fail because you ran out of runway before
you shipped.

🔵 THE ARCHITECT
────────────────
Elixir/Phoenix changes this calculus. The BEAM VM gives you
process-level isolation, hot code reloading, and fault tolerance
inside a single deployable. You get the reliability benefits of
microservices without the operational overhead. A well-structured
Phoenix monolith with DDD-aligned bounded contexts can be extracted
into services later if scale demands it — and the extraction is
dramatically easier than starting from scratch.

🟡 THE BUILDER
────────────────
What does your first paying school need? A login, a student roster,
a grade entry form, and a report. None of that requires microservices.
The architecture that ships in 6 weeks beats the architecture that's
still being designed in 6 months. Build the simplest thing that could
possibly work. Evolve it when you have real scale problems, not
imaginary ones.

⚪ THE OUTSIDER
────────────────
I don't know what Elixir is. I don't know what DDD means. What I
know is: 2 people, 10,000 users, Nigerian schools. If your internet
infrastructure is unreliable (it often is), your architecture needs
to handle degraded connectivity gracefully. Has anyone asked which
architecture makes offline support easier? That might matter more
than monolith vs microservices.

🟣 THE RISK OFFICER
────────────────────
Microservices increase your attack surface. More services = more
network hops = more places to misconfigure TLS, leak credentials,
or expose internal APIs. For a 2-person team handling student data,
the compliance risk of a misconfigured service boundary is real.
A monolith with proper auth boundaries is easier to audit and
easier to secure.

PEER REVIEW (anonymous)
━━━━━━━━━━━━━━━━━━━━━━━
Strongest: Response B (Architect) — most technically grounded
           for the specific stack being considered
Biggest blind spot: Response C (Builder) — ignores the offline
           connectivity point raised by Response D
Missed by everyone: None asked about team growth plans. If the
           team doubles in 6 months, the monolith decision changes.

CHAIRMAN SYNTHESIS
━━━━━━━━━━━━━━━━━━━━━━━
Where the council agrees:
  Microservices is wrong for this team at this stage.
  All five advisors either said it directly or implied it.

Where the council clashes:
  Why: The Skeptic says runway risk. The Architect says BEAM
  makes it unnecessary. The Builder says just ship. All correct.

Blind spots caught:
  Offline/degraded connectivity — critical for Nigerian school
  context. The Outsider caught what experts assumed away.

Recommendation:
  Elixir/Phoenix monolith with DDD-aligned bounded contexts.
  Design the contexts as if they could become services — but
  don't make them services yet. The BEAM makes this the right
  call even beyond team size.

  Address the offline question before architecture is final —
  this may affect your data sync strategy significantly.

One thing to do first:
  Run /scale-design to define when and how you would extract
  services if you hit 100k users. Document that as ADR-001 so
  the monolith decision is explicitly time-boxed.

COUNCIL VERDICT: PASS (with condition)
Condition: Offline/degraded connectivity strategy must be
addressed in /write-spec before architecture is locked.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saved to: .sovereign/council/council-20260607-001.md
```

---

## Token Cost

Express mode: ~1,000–2,000 tokens  
Standard mode: ~5,000–10,000 tokens  
Deep mode: ~12,000–25,000 tokens

The Council is the most token-intensive skill in SOVEREIGN.
Use `--express` for anything where the decision is not genuinely
high-stakes. Use `--standard` as the default. Reserve `--deep`
for irreversible architectural choices.

---

## References

- Andrej Karpathy's LLM Council methodology — original concept
- hex/claude-council — implementation inspiration
- tenfoldmarc/llm-council-skill — advisor structure inspiration
- `.sovereign/CONTEXT.md` — loaded before every session
- `.sovereign/MANIFEST.md` — loaded before every session

---

_sovereign-base/sovereign v1.0.0_
