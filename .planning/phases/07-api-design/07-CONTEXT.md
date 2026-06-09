# Phase 7: API Design - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 7, `/SOVEREIGN.md` §6, the M1 references + the Phase-6 skills. `api-design` was described (not built) in v1 — author from the references + the `entity-design`/`grill-with-docs` pattern.

<domain>
## Phase Boundary

Phase 7 builds **`api-design`** — a single conversational, contract-first API design skill that turns the domain model into a living, protocol-agnostic `API_SPEC.md`. Thin orchestrator over the M1 engine; builds on Phase 6 (exposes the entities; routes ADR-worthy choices to `adr-log`).

**In scope:** `engine/skills/api-design/SKILL.md`.

**Out of scope:** `stack-select`/`scale-design` (phase 8); `security-design`/`deploy-design` (phase 9); engine changes; new subagents; generating actual API code (this designs the *contract*, construction implements it).
</domain>

<decisions>
## Implementation Decisions

### Shape (ARCH-08, same as the other M2 skills)
`disable-model-invocation: true`; one `sovereign-tools init api-design` call (+ `@file:` guard); `## Why this matters`; recommendation-first, one decision at a time; navigation footer; state/commit delegated to `sovereign-tools`; `--full` install (NOT FAST_LANE); passes `validate skills`; doctor stays at 5 auto-triggerable. ≥70 lines.

### `api-design` (ARCH-03)
Contract-first, protocol-agnostic.
- **Flow:** `init api-design` → read the Phase-6 domain model (`.sovereign/docs/ENTITY_MODEL.md` if present) and the glossary so the contract speaks the project's nouns → walk the contract decisions one at a time, recommendation-first:
  - **Protocol** (recommend per use case: REST for external CRUD, GraphQL for flexible reads, gRPC for internal service-to-service, events/MQTT for async/streaming — can be more than one);
  - **Consumers** (frontend / mobile / third-party / another service);
  - **Resources/messages** mapped to the entities;
  - **Auth** per endpoint/message;
  - **Versioning** strategy; **error** convention (a single shape); **pagination**; **rate limiting**; webhook/event contracts where relevant.
- **Output:** write/update **`.sovereign/docs/api/API_SPEC.md`** — a living contract: protocol(s), auth, a per-endpoint/per-message section (purpose, request/response shape, errors, rate limit), event/webhook contracts, versioning policy, and the standard error format. **Update in place on re-run** (don't duplicate sections).
- **Compose:** protocol + contract decisions that pass the three-condition gate are **offered to `/adr-log`** (don't write ADRs here).
- Stays at the contract level — no server/handler code (that's construction).

### Claude's Discretion
- Exact `API_SPEC.md` layout (a header block + per-endpoint/message blocks + an "Event contracts" + "Versioning" + "Error format" section is the intent).
- How it detects "update in place" (match on endpoint/section headings).
- Navigation footer wording.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `engine/references/skill-format.md` — the thin-orchestrator standard.
- `engine/skills/entity-design/SKILL.md` — the sibling M2 skill to mirror (glossary read, one-at-a-time, offers adr-log, writes a docs file, the `## <ARTIFACT>.md format` block pattern).
- `engine/skills/grill-with-docs/SKILL.md` — recommendation-first conversational pattern.
- `engine/references/adr-format.md` — the gate api-design offers decisions against.
- `engine/bin/lib/init.cjs` — the `init <skill>` default blob (`context_injection.glossary_path`, `manifest_path`; the skill reads `ENTITY_MODEL.md` itself by path).
- `/SOVEREIGN.md` §6 (api-spec = contract-first, protocol-agnostic, living `API_SPEC.md`).
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dir: `engine/skills/api-design/` (NOT FAST_LANE).
- Writes `.sovereign/docs/api/API_SPEC.md` (the `docs/api/` dir ships in the scaffolded `.sovereign/` tree).
- Reads `.sovereign/docs/ENTITY_MODEL.md` (Phase 6 output) when present — degrade gracefully (suggest `/entity-design`) if absent.
- After this phase, `doctor` on a `--full` install: 5 auto-triggerable, council + adr-log + entity-design + api-design disabled.
</specifics>

<deferred>
## Deferred Ideas
- `stack-select`, `scale-design` — phase 8. `security-design`, `deploy-design` — phase 9.
- Inter-service contracts / event-catalog (microservices) — M4+.
- Auto-generating API code or OpenAPI/proto files — construction-phase / later.
</deferred>

---

*Phase: 07-api-design*
*Context gathered: 2026-06-09 — authored from M1 references + the Phase-6 sibling pattern*
