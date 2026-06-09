---
name: entity-design
description: Model the domain before you build it — entities, their relationships, and bounded contexts — drawn from the project's own vocabulary and recorded as a living model. Use at the start of architecture, before designing APIs or schemas.
disable-model-invocation: true
argument-hint: "[area or feature to model]"
---

## Why this matters

Code mirrors the model in your head — and if that model is fuzzy, the code is fuzzy in exactly the same places. Most data-layer pain (the join nobody expected, the entity that turned out to be two things, the "status" field meaning five different states) traces back to a domain that was never modeled, just accreted.

`entity-design` makes the model explicit *before* it's expensive: what the things are, how they relate, and where the boundaries between them fall. It works from the shared glossary so the model speaks the project's language, and it records a living document every later decision — APIs, schemas, services — can build on. Get the nouns right and most of the architecture follows.

## When to use this

At the **start of architecture**, after the idea is grilled and the vocabulary is sharp — and before `api-design` or any schema work. Also when a feature introduces new domain concepts, or when you suspect an entity is secretly two (or two are secretly one).

**Don't** use it for schema/migration/code detail — this is the *model* level, not implementation. And don't model general programming concepts — only the project's domain.

## The flow

A **thin orchestrator** over the engine — conversational and recommendation-first, like `grill-with-docs`. It delegates persistence to `sovereign-tools` and **offers `adr-log`** for hard-to-reverse choices rather than recording ADRs itself.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init entity-design)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `context_injection.glossary_path` (the `.sovereign/CONTEXT.md` glossary) and `paths.state`. Read the glossary content — its terms are your entity vocabulary.

**2 — Ground in the glossary.** Use the glossary's canonical terms for entities and concepts. If a concept you need isn't defined (or is fuzzy), **flag it** and suggest running `/ubiquitous-language` first — modeling on undefined words just relocates the confusion.

**3 — Walk the model, one piece at a time, recommendation-first.** Don't dump a diagram. For each entity, propose and confirm before moving on:
- the **entity** and what it *is* (one line, glossary term);
- its **key attributes** (identity + the few that matter at the model level);
- its **relationships** and cardinality (`Order` has many `LineItems`; a `Customer` places `Orders`);
- which **bounded context** it belongs to (and the seam to other contexts — reference by ID across boundaries, don't reach in).
Ask one question, give your recommended answer first, wait, then continue.

**4 — Offer ADRs, don't write them.** When a modeling choice is hard to reverse (aggregate boundaries, event-sourced vs CRUD, shared vs owned data across a context seam), **offer `/adr-log`** — point the user to it or describe the decision for it. Do **not** number or write ADRs here; `adr-log` owns that (compose, don't duplicate).

**5 — Record the model.** Write/update `.sovereign/docs/ENTITY_MODEL.md`: a per-entity block (definition · attributes · relationships), grouped by bounded context, with a short relationships overview. Keep it model-level — no SQL, no migrations, no code.

**6 — Persist.** `node ".claude/sovereign-engine/sovereign-tools.cjs" state save`, then `node ".claude/sovereign-engine/sovereign-tools.cjs" commit "entity-design: <area>" --files .sovereign/docs/ENTITY_MODEL.md .sovereign/STATE.md .sovereign/MANIFEST.md`.

## ENTITY_MODEL.md format

Group entities by bounded context; one block each, plus a relationships overview:

```markdown
# Domain Model

## Bounded context: Ordering

### Order
What it is: a customer's request to purchase, from placement to fulfillment.
Attributes: id, customer_id, status, placed_at
Relationships: has many LineItem; belongs to Customer (by id)

### LineItem
What it is: one product + quantity within an Order.
Attributes: id, order_id, product_ref, quantity
Relationships: belongs to Order

## Relationships overview
- Customer (1) → (N) Order → (N) LineItem
- Ordering references Catalog's Product by id only (no cross-context reach-in)
```

Keep it at the model level — definitions, attributes, relationships, context seams. No SQL, no migrations, no code.

## Navigation

```
▶ NEXT
  Domain modeled → .sovereign/docs/ENTITY_MODEL.md
  /api-design  — design the contracts that expose these entities
  /adr-log     — record any hard-to-reverse modeling decision surfaced here
  /ubiquitous-language — if a term came up undefined, lock it first
```
