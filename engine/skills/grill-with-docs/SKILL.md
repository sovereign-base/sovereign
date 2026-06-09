---
name: grill-with-docs
description: Stress-test a plan against the project's own domain model and decisions before you build. Interrogates one question at a time, recommendation-first, and writes resolutions into CONTEXT.md and ADRs as they crystallize. Use before implementing anything non-trivial.
---

## Why this matters

The most expensive bugs are decided before any code is written — in the gap between what you meant and what you said. An agent that starts building from a fuzzy plan builds the wrong thing confidently.

Grilling closes that gap. The skill interrogates your plan against the vocabulary in `CONTEXT.md` and the decisions in your ADRs — one sharp question at a time — until the design is unambiguous. It catches the contradiction between what you just said and what the code already does, sharpens overloaded words, and records the decisions that were previously only in your head. You leave with a plan you can hand to an executor without a second guessing.

## When to use this

- Before implementing any non-trivial feature or change.
- When a plan "feels" right but hasn't been pressure-tested.
- When you suspect your plan conflicts with an existing decision or the domain model.

Don't use it for trivial, clearly-specified changes, or as a substitute for the Council on an irreversible decision (use `/council` for those).

## The flow

A **thin orchestrator** — orient once, then interrogate; delegate writes to `sovereign-tools`.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init grill-with-docs)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `context_injection.glossary_path` (`.sovereign/CONTEXT.md`), `context_injection.relevant_adrs`, and `paths.state`. Read the glossary + relevant ADRs (only now) so the grilling is grounded in *this* project.

**2 — Interrogate, one question at a time.** Walk the design tree, resolving dependencies between decisions one by one. For each question:
- **Recommendation-first.** State your recommended answer with reasoning *before* waiting. The user confirms or redirects.
- **Explore instead of asking** when the codebase already answers it — read the code, don't make the user repeat it.
- **Challenge against the glossary.** If a term clashes with `CONTEXT.md`, surface it: *"Your glossary defines `cancellation` as X, but you mean Y — which is it?"*
- **Cross-reference the code.** If the plan contradicts what the code does ("you said partial cancellation, but the code cancels whole orders"), say so.
- Ask **one** question, wait, then continue. Never batch.

**3 — Write resolutions inline.** As each decision crystallizes, update `CONTEXT.md` (a new/sharpened term) right then — don't batch.

**4 — Offer ADRs sparingly.** Only propose an ADR when **all three** hold: (a) hard to reverse, (b) surprising without context, (c) the result of a real trade-off. If any is missing, skip it — capture the decision in `CONTEXT.md` or the plan instead. ADRs live in `.sovereign/docs/adr/`, sequentially numbered, one paragraph is enough (what was decided + why).

**5 — Persist.** `node "$ENGINE/bin/sovereign-tools.cjs" state save`, then commit via `sovereign-tools commit` if docs changed.

## Example

A recommendation-first question reads like:

> *"Should an Order be cancellable after fulfillment? **My recommendation: no** — once `ShipmentDispatched` fires, a 'cancel' is really a Return (refund + restock), a different flow. Treating them as one will tangle the state machine. Confirm, or tell me post-fulfillment cancels are genuinely in scope and we'll model them explicitly."*

Notice the shape: **one** question, the recommended answer **first** with its reasoning, grounded in the glossary (`ShipmentDispatched`, `Return`), and it flags a decision that may deserve an ADR. The user just says "agree" or redirects — cheap for them, unambiguous for you.

Keep walking the tree this way until nothing ambiguous remains. A plan that survives the grill is one an executor can build without guessing — which is the whole point.

## Navigation

```
▶ NEXT
  Plan sharpened. CONTEXT.md / ADRs updated as decisions crystallized.
  /tdd       — build it test-first against the now-unambiguous plan
  /council   — if a remaining decision is irreversible, convene the Council first
```
