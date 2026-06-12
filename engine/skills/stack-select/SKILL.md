---
name: stack-select
description: Choose the technology stack from your project's real constraints — type, scale, budget, team, regulation — not from what's trending. Recommendation-first, one layer at a time, recorded with rationale. Use once the domain and API are shaped and before construction.
disable-model-invocation: true
argument-hint: "[the system or service to choose a stack for]"
---

## Why this matters

The stack you pick on day one is the stack you live with for years — and the worst way to pick it is by what's loud on the timeline. A trendy framework with no one on the team who knows it, a database chosen for a scale you'll never hit, a managed service that blows the budget at month three: these are decided in a moment and paid for indefinitely.

`stack-select` makes the choice from *your* constraints instead of the trend: what you're building, how far it must scale, what you can spend, who's on the team, what's non-negotiable. It recommends the best tool **for those facts**, says what it's *not* picking and why, and records the rationale so the next person doesn't relitigate it.

## When to use this

After the domain and (if relevant) the API are shaped, before construction. Also when adding a major component (a queue, a cache, a search index) and you want the choice made on merits.

**Don't** use it to chase novelty, or to pick libraries (only the choices that carry real lock-in — language/runtime, framework, datastore, infra primitives). Easily-swapped picks don't need this.

## The flow

A **thin orchestrator** over the engine — recommendation-first, like its sibling architecture skills. Delegates persistence to `sovereign-tools`; offers `/adr-log`.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init stack-select)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.state` + glossary path and `mcp.available`; draw the project's `phase`/`active_tracks` from the blob rather than re-reading files. Read `ENTITY_MODEL.md`/`API_SPEC.md` by path if present — they inform the choice.

**2 — Gather the deciding inputs, one at a time, recommending as you go:**
- **Project type / track** (web, mobile, backend, data, IoT…).
- **Scale target** — at launch and at a 1–2yr horizon.
- **Budget** — ask explicitly (infra spend + team capacity). It changes the answer.
- **Team / skill context** — what can they actually operate?
- **Hard constraints** — regulatory, region/data-residency, existing systems, agent-friendliness.

**3 — Recommend per layer.** For language/runtime, framework, datastore, and infra primitives: give the **best fit for these constraints** with reasoning, plus **what you're NOT picking and why** (the explicit no is as valuable as the yes). Be opinionated; this is a strong read, not a menu.

**4 — Be honest about currency.** When a recommendation hinges on fast-moving facts (current versions, pricing, a new managed option), say so. **MCP-aware:** if `mcp.available` lists a docs/pricing server, prefer its `mcp__<id>__*` tools to check those facts live before committing the recommendation; otherwise flag that the user may want to verify against current docs (`/anchor-docs`) and don't assert stale specifics with false confidence. Attach a server with `/mcp-attach`.

**5 — Record + offer ADRs.** Write/update `.sovereign/docs/STACK.md` (the chosen stack + rationale + rejected alternatives). Lock-in choices that pass the three-condition gate (datastore, framework, cloud) → **offer `/adr-log`** (don't write ADRs here). Then `state save` and `commit` via `sovereign-tools`.

## STACK.md format

```markdown
# Stack
Decided against: launch ~5k users / $X mo budget / solo builder / EU data residency.

## Language & runtime
Node 20 (TS) — team knows it, npx-native tooling. Not Go (no team depth).

## Framework
<choice> — <why for these constraints>. Not <alt> — <why not>.

## Datastore
Postgres (managed, EU region) — relational fit + residency. Not DynamoDB — lock-in, no relational needs.

## Infra primitives
<queue / cache / object store as needed, each with a one-line rationale>
```

## Navigation

```
▶ NEXT
  Stack recorded → .sovereign/docs/STACK.md
  /scale-design — pressure-test the stack against your growth curve
  /adr-log      — record any lock-in choice (datastore, framework, cloud)
```
