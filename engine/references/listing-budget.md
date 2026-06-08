# Skill-Listing Budget & the `disable-model-invocation` Convention

Claude Code injects every **auto-triggerable** skill's `name` + `description`
into the model's context on *every* turn. That listing competes for a finite
slice of the window — roughly **1% (~2000 tokens)** of a 200k window is the
working target. Too many auto-triggerable skills, or descriptions that run long,
crowd the listing and degrade triggering accuracy.

## The convention

**Orchestrator-only and side-effecting skills MUST set
`disable-model-invocation: true`.** Such skills are run deliberately by the user
(`/name`) or by another skill — they should never auto-trigger. Setting this
flag removes them from the listing budget entirely.

Only **genuinely auto-triggerable** skills (those the model should reach for on
its own from a user's natural-language request) stay invocable and count toward
the budget.

```yaml
# An orchestrator / side-effecting skill — kept OUT of the listing budget:
---
name: council
description: Run the multi-advisor decision council.
disable-model-invocation: true
---
```

## Enforced by the engine

`sovereign-tools doctor` enumerates installed skills, counts the
auto-triggerable ones (without `disable-model-invocation: true`), and warns
when:

- the auto-triggerable count exceeds **~7** (`AUTO_MAX`), or
- the estimated listing cost exceeds **~2000 tokens** (`TOKEN_BUDGET`,
  estimated as `chars / 4` over name+description).

With zero skills installed it reports clean. Run it after adding skills (notably
after Phases 3 and 4) to confirm the system stays within budget.

> Feeds CONV-01 (Phase 5): the listing-budget convention as a documented
> SOVEREIGN standard.
