# Phase 8: Stack & Scale Design - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 8, `/SOVEREIGN.md` §6, the M1 references + the Phase-6/7 M2 skills (the proven pattern). Both skills are NEW — author from references + sibling pattern.

<domain>
## Phase Boundary

Phase 8 builds two conversational architecture skills: **`stack-select`** (guided, recommendation-first technology choice) and **`scale-design`** (the scaling-strategy conversation). Thin orchestrators over the M1 engine; mutually independent; both compose with `adr-log`.

**In scope:** `engine/skills/stack-select/SKILL.md`, `engine/skills/scale-design/SKILL.md`.

**Out of scope:** `security-design`/`deploy-design` (phase 9); engine changes; new subagents; actually provisioning anything.
</domain>

<decisions>
## Implementation Decisions

### Shape (ARCH-08, same as siblings)
Both: `disable-model-invocation: true`; one `sovereign-tools init <skill>` call (+ `@file:` guard); `## Why this matters`; recommendation-first, one decision at a time; navigation footer; state/commit delegated; `--full` install (NOT FAST_LANE); passes `validate skills`; doctor stays at 5 auto-triggerable. ≥70 lines each. Both **offer `/adr-log`** for gate-passing choices (compose, don't re-implement). Mirror `entity-design`/`api-design`.

### `stack-select` (ARCH-04)
Guided, **recommendation-first**, decision-driven — explicitly **not trend-following**.
- **Flow:** `init stack-select` → gather the inputs that actually determine the choice, one at a time, recommending as you go: **project type/track** (web/mobile/backend/data/etc.), **scale target** (launch + horizon), **budget** (ask explicitly — infra + team), **team/skill context**, hard **constraints** (regulatory, region, existing systems, agent-friendliness). → For each layer (language/runtime, framework, datastore, infra primitives) recommend the **best tool for *these* constraints** with reasoning + what you're NOT picking and why. → Record the chosen stack + rationale to `.sovereign/docs/STACK.md`. → Lock-in choices (datastore, framework, cloud) that pass the three-condition gate → **offer `/adr-log`**.
- **Honesty about currency:** when a recommendation depends on fast-moving facts (current versions, pricing, new managed options), say so and flag that the user may want to verify against current docs (the future `anchor-docs`, M3) — don't assert stale specifics with false confidence.

### `scale-design` (ARCH-05)
A real scaling conversation, not a checklist.
- **Flow:** `init scale-design` → walk, one at a time, recommendation-first: **expected load** (users at launch / 6mo / 2yr / worst-case spike), **read/write ratio + data volume + latency targets**, **stateless vs stateful** services, **caching** strategy + CDN, **queues / async** workloads, **database** bottlenecks (connection pooling, indexing, sharding/partitioning triggers), **horizontal vs vertical** scaling triggers. → Give concrete recommendations at each step ("at 100k users your current pool size bottlenecks — here's the fix"). → Record the strategy to `.sovereign/docs/SCALE_STRATEGY.md`. → Consequential choices (sharding strategy, queue architecture, datastore-for-scale) → **offer `/adr-log`**.
- Stays at the strategy level — no infra provisioning (that's `deploy-design` / construction).

### Claude's Discretion
- Exact `STACK.md` / `SCALE_STRATEGY.md` layouts (a per-layer/per-topic block + rationale is the intent).
- Whether to read prior context (ENTITY_MODEL.md, API_SPEC.md) when present to inform recommendations — fine to, by path, degrade gracefully.
- Navigation footer wording.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `engine/references/skill-format.md` — the thin-orchestrator standard.
- `engine/skills/api-design/SKILL.md` + `engine/skills/entity-design/SKILL.md` — the sibling M2 skills to mirror (init orient, recommendation-first one-at-a-time, offers adr-log, writes a docs file + a `## <ARTIFACT>.md format` block, disable-model-invocation).
- `engine/references/adr-format.md` — the gate both skills offer decisions against.
- `engine/bin/lib/init.cjs` — the `init <skill>` default blob (project context the skills draw from; glossary path).
- `/SOVEREIGN.md` §6 (scale-design + the deploy/budget conversation), and the v1 `scale-design`/`stack-select` descriptions in `archive/v1/SOVEREIGN_PROJECT.md`.
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dirs: `engine/skills/stack-select/`, `engine/skills/scale-design/` (NOT FAST_LANE).
- stack-select → `.sovereign/docs/STACK.md`; scale-design → `.sovereign/docs/SCALE_STRATEGY.md` (both under the scaffolded `.sovereign/docs/`).
- After this phase, `doctor` on a `--full` install: 5 auto-triggerable, 6 disabled (council + adr-log + entity-design + api-design + stack-select + scale-design).
- The two are independent — order doesn't matter; can be authored in either order.
</specifics>

<deferred>
## Deferred Ideas
- `security-design`, `deploy-design` — phase 9.
- `anchor-docs`/`verify-self` (current-docs verification the skills flag the need for) — M3.
- `scale-review` (living, outside-phases scaling re-check) — later.
</deferred>

---

*Phase: 08-stack-scale*
*Context gathered: 2026-06-09 — authored from M1 references + the Phase-6/7 sibling pattern*
