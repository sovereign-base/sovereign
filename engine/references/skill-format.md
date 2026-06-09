# SOVEREIGN skill format

How to author a SOVEREIGN skill. This standard is **distilled from the six skills shipped in M1** (`council` + the five Fast Lane skills) — it describes the shape they already share, so a new skill is reproducible without copying one by trial and error. A skill authored to this spec passes `sovereign-tools validate skills` and stays within the `doctor` listing budget.

## Frontmatter — real Agent Skills fields only

```yaml
---
name: my-skill                 # ≤64 chars, lowercase-hyphen, MUST NOT contain "claude"/"anthropic"
description: <one line>        # lead with the trigger use-case; stays within the platform cap
disable-model-invocation: true # OPTIONAL — only for user-only / side-effecting skills (see below)
argument-hint: "[--flag] \"<arg>\""  # OPTIONAL
---
```

- `name` and `description` are the whole public surface — `description` is what Claude Code reads to decide whether to surface the skill, so **lead with the use-case**, not the mechanism.
- `disable-model-invocation: true` makes a skill **user-only** (`/name`) and removes it from the auto-trigger listing budget. Set it for side-effecting orchestrators the model shouldn't fire on a hunch (e.g. `council`). Leave it OFF for the auto-triggerable core (the Fast Lane skills).

### Dropped v1 fields (do NOT use)

v1 used `triggers`, `works-best-with`, `min-model`, `tokens`, and a bare `phase` field. **None are in the Agent Skills standard** — other tools ignore them and they pollute the spec'd surface. Their replacements: triggers → fold into `description`; portability/model hints → a namespaced `metadata:` block if truly needed; phase logic → the engine, never frontmatter.

## The thin-body / single-`init`-load rule (hard rule)

A skill orients with **exactly one** call and reads nothing else to orient:

```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init <skill-name>)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

That one call returns resolved models, config, phase, and the paths the skill needs. The skill reads file *content* only when it genuinely needs it (and only from paths `init` handed it). Heavy detail lives in **referenced files loaded on demand** (progressive disclosure), never inline — a fat body re-enters context every turn and burns the budget the load rule exists to protect.

All bookkeeping (state save, gate, commit, model resolution) is **delegated to `sovereign-tools`** — a skill never hand-writes state or branches on `commit_docs` itself.

## Required body sections

Every skill body has, in order:

1. **`## Why this matters`** — plain language, written for someone building their first real product. What goes wrong if you skip this. One short section; skippable by experts.
2. **`## When to use this`** — the genuine use-cases and the anti-uses ("don't use it for…").
3. **The flow** — numbered orchestrator steps a Claude can execute without interpretation, delegating side effects to `sovereign-tools`.
4. **A navigation footer** — **recommendation-first**: the recommended next action + the command to run it, plus alternatives. The user always knows where they are and where to go next.

## The listing-budget rule

Auto-triggerable skills (no `disable-model-invocation`) count against Claude Code's skill-listing token budget (~1% of context). Keep the auto-triggerable set small (M1: the five Fast Lane skills) and descriptions tight. Verify with `sovereign-tools doctor`, which counts auto-triggerable skills (warns past ~7) and sums description tokens. See [`listing-budget.md`](./listing-budget.md) for the full convention.

## Where skills live

Author at `engine/skills/<name>/SKILL.md` (shipped via the package `files` allowlist; `npx sovereign-cli init` copies them to `.claude/skills/`). Author each command as a **skill directory**, never a bare command file — the skill wins on a name clash and gets a supporting-files dir for progressive disclosure.

## Authoring checklist

Before committing a new skill, confirm:

- [ ] `name` is lowercase-hyphen, ≤64 chars, no "claude"/"anthropic".
- [ ] `description` leads with the use-case and stays within the cap.
- [ ] No v1 fields (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`).
- [ ] The body orients with exactly one `init <skill>` call (+ `@file:` spill guard) and no other orientation reads.
- [ ] All state/gate/commit work is delegated to `sovereign-tools`, not hand-written.
- [ ] Has `## Why this matters`, `## When to use this`, a numbered flow, and a recommendation-first navigation footer.
- [ ] If side-effecting / user-only, sets `disable-model-invocation: true`.
- [ ] `sovereign-tools validate skills <path>` passes and `sovereign-tools doctor` stays within budget.

> Feeds CONV-01 (Phase 5). Pairs with [`adr-format.md`](./adr-format.md), [`commenting.md`](./commenting.md), and [`listing-budget.md`](./listing-budget.md).
