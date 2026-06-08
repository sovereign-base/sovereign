---
name: ubiquitous-language
description: Lock the project's vocabulary before the code drifts. Defines and sharpens domain terms one at a time in CONTEXT.md, catching synonyms and conflicting meanings. Use when naming concepts, starting a domain, or when the team uses twelve words for one thing.
---

## Why this matters

A codebase with twelve words for the same concept is a codebase nobody can navigate. One engineer says "account," another says "user," a third says "customer" — and three months later no one knows if they're the same thing. The drift is invisible until it's expensive.

A shared, written vocabulary fixes this before it starts: the agent and the engineer name things the same way, variables and functions stay consistent, and every future session reads `CONTEXT.md` and instantly speaks the project's language. Fewer tokens, fewer bugs, less "wait, what does X mean here?"

`CONTEXT.md` is a **glossary, and nothing else** — definitions of domain terms, not a spec, not a scratchpad, not implementation notes.

## When to use this

- Starting a new domain or bounded context.
- Naming a concept you'll reference repeatedly.
- You notice two words being used for one idea (or one word for two ideas).
- Before `grill-with-docs` or the Council — a sharp glossary makes both far better.

Don't use it for general programming terms (timeout, cache, retry) — only concepts **specific to this project's domain**.

## The flow

The skill is a **thin orchestrator** — it orients with one engine call and delegates state writes to `sovereign-tools`.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init ubiquitous-language)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `context_injection.glossary_path` (the `.sovereign/CONTEXT.md` to read/write) and `paths.state`. Read the current glossary content (only now) so you know what's already defined. Perform no other orientation reads.

**2 — Work one term at a time.** For each term the user raises (or that you spot needs locking):
- **Propose a canonical term + tight definition.** One or two sentences: what it *is*, not what it does. Be opinionated.
- **Conflict check (the core value).** If the term clashes with an existing entry, call it out immediately: *"Your glossary defines `cancellation` as X, but you seem to mean Y — which is it?"* If the user is using a synonym for an existing term, say so and pick the canonical one.
- **Recommendation-first.** Give your recommended definition and `_Avoid_` synonyms before waiting; the user accepts or corrects.
- **Write it inline.** Update `CONTEXT.md` right then — don't batch. Lazily create the file if absent.

Resolve terms one at a time; do not dump a wall of definitions.

**3 — Persist.** After terms are written: `node "$ENGINE/bin/sovereign-tools.cjs" state save` (regenerates MANIFEST), then commit via `sovereign-tools commit` if appropriate. The skill never hand-writes state bookkeeping.

## CONTEXT.md format

```markdown
# [Context Name]
[One or two sentences: what this context is and why it exists.]

## Language

**Order**:
A customer's request to purchase, from placement to fulfillment.
_Avoid_: purchase, transaction

**Customer**:
A person or organization that places orders.
_Avoid_: client, buyer, account
```

Rules: be opinionated (pick the best word, list the rest under `_Avoid_`); keep definitions to 1–2 sentences (define what it IS); only project-specific domain terms; group under subheadings when natural clusters emerge. For multi-context repos, a `CONTEXT-MAP.md` lists each context and how they relate.

## Navigation

```
▶ NEXT
  Glossary updated: <N> term(s) in .sovereign/CONTEXT.md
  /grill-with-docs — interrogate your plan against the sharpened vocabulary
  /council          — pressure-test a decision with this language injected
```
