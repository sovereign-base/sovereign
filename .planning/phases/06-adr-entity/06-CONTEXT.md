# Phase 6: ADR Log + Entity Design - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 6, `/SOVEREIGN.md` §6, the M1 references (`adr-format.md`, `skill-format.md`), and the `grill-with-docs` pattern. First M2 phase. These skills are NEW (not in `archive/v1/`) — author from the references + the established thin-orchestrator shape.

<domain>
## Phase Boundary

Phase 6 builds the two artifacts every later M2 skill references: **`adr-log`** (records architectural decisions) and **`entity-design`** (models the domain). Both are conversational, recommendation-first design skills — thin orchestrators over the M1 engine, like `grill-with-docs`.

**In scope:** `engine/skills/adr-log/SKILL.md`, `engine/skills/entity-design/SKILL.md`.

**Out of scope:** the other M2 skills (api/stack/scale/security/deploy — phases 7-9); any engine change; new subagents. Hand-authored (R-004).
</domain>

<decisions>
## Implementation Decisions

### Shared shape (ARCH-08)
Both skills: real Agent Skills frontmatter; **`disable-model-invocation: true`** (phase-gated, user-invoked → off the auto-trigger budget, which stays at the 5 Fast Lane skills); orient via ONE `sovereign-tools init <skill>` call (+ `@file:` spill guard); `## Why this matters`; recommendation-first, one-question-at-a-time where conversational; navigation footer; all state/commit delegated to `sovereign-tools`. Must pass `validate skills`; `doctor` stays at 5 auto-triggerable. Author at `engine/skills/<name>/` (shipped; `--full` install).

### `adr-log` (ARCH-01)
The canonical way to record an architectural decision — implements `engine/references/adr-format.md`.
- **Flow:** `init adr-log` → determine the next number by scanning `.sovereign/docs/adr/` (highest `NNNN` + 1) → **apply the three-condition gate** (hard-to-reverse + surprising-without-context + a real trade-off); if the decision fails the gate, *decline* and advise recording it in `CONTEXT.md`/the plan instead (don't pad the ADR log) → write `.sovereign/docs/adr/NNNN-slug.md` in the **minimal form** (1-3 sentences: context + decision + why; optional Status/Options/Consequences only when they add value) → `state save` → `commit` → nav footer.
- It is also the skill other skills (entity-design, grill-with-docs, the later M2 skills) point users to for ADR-worthy choices — so it owns the numbering + gate logic in one place.

### `entity-design` (ARCH-02)
Models the domain — entities, relationships, bounded contexts — DDD-aligned, one piece at a time.
- **Flow:** `init entity-design` → read the `CONTEXT.md` glossary (terms are the entity vocabulary; flag if a needed term is undefined → suggest `/ubiquitous-language`) → walk the model **one entity/relationship at a time**, recommendation-first (propose the entity, its key attributes, its relationships/cardinality, its bounded context; the user confirms/corrects) → record the domain model to **`.sovereign/docs/ENTITY_MODEL.md`** (entities with attributes, relationships, bounded-context grouping) → for hard-to-reverse modeling choices (aggregate boundaries, event-sourced vs CRUD, shared vs owned data), **offer `adr-log`** rather than writing ADRs itself (the two compose) → `state save` → commit → nav footer.
- Stays at the model level — no schema/migration/code (that's construction).

### Compose, don't duplicate
`entity-design` must **offer ADR-worthy choices to `adr-log`** (point the user to `/adr-log`, or describe the decision for it) rather than re-implementing ADR numbering/writing. `adr-log` is the single owner of ADR recording.

### Claude's Discretion
- Exact `ENTITY_MODEL.md` layout (a per-entity block + a relationships section + bounded-context grouping is the intent).
- adr-log slug derivation; how it presents the gate decision.
- Navigation footer wording.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `engine/references/adr-format.md` — the ADR location/numbering/minimal-form/three-condition gate `adr-log` implements verbatim.
- `engine/references/skill-format.md` — the thin-orchestrator authoring standard (frontmatter, single-init-load, required sections, listing-budget) both skills follow.
- `engine/skills/grill-with-docs/SKILL.md` — the closest pattern (conversational, recommendation-first, reads CONTEXT.md + ADRs, offers ADRs sparingly, delegates state). Mirror its shape.
- `engine/skills/council/SKILL.md` — the `disable-model-invocation` + init + nav-footer pattern.
- `engine/bin/lib/init.cjs` — the `init <skill>` default blob (manifest + context paths, incl. `context_injection.glossary_path` and `relevant_adrs`) these skills consume.
- `/SOVEREIGN.md` §6 (entity-design = domain model/relationships/bounded contexts, DDD).
- `archive/v1/skills/fast-lane/ubiquitous-language/SKILL.md` — the CONTEXT.md glossary entity-design reads from.
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dirs: `engine/skills/adr-log/`, `engine/skills/entity-design/` (NOT in `install.cjs` FAST_LANE — they're `--full` only).
- adr-log writes `.sovereign/docs/adr/NNNN-slug.md`; entity-design writes `.sovereign/docs/ENTITY_MODEL.md`. Both dirs exist in the scaffolded `.sovereign/` tree (`docs/adr/` ships; `docs/` root is present).
- After this phase, `doctor` on a `--full` install should show 5 auto-triggerable (fast-lane) + N disabled (council + adr-log + entity-design).
</specifics>

<deferred>
## Deferred Ideas
- `api-design`, `stack-select`, `scale-design`, `security-design`, `deploy-design` — phases 7-9.
- Auto-detecting ADR-worthy decisions across a session (proactive adr-log) — later.
</deferred>

---

*Phase: 06-adr-entity*
*Context gathered: 2026-06-09 — first M2 phase, authored from M1 references + the grill-with-docs pattern*
