# SOVEREIGN — Backlog (parking lot)

Ideas captured but not in an active milestone. Disposition per [ADR-014 (core/track/extension taxonomy)](../docs/adr/ADR-014-core-track-extension-taxonomy.md). Promote into a milestone via `/gsd:new-milestone` (or pull a single item into scope) when ready.

## Captured 2026-06-09 — DSA + database + memory skill batch

| Idea | Tier (ADR-014) | Disposition |
|------|----------------|-------------|
| **Data-Structures selection** (hash/trees/heaps/probabilistic/Union-Find; access-pattern-first) | **CORE** | A `data-structure-select` (or broader `algorithm-design`) Construction-phase skill: agnostic, recommendation-first, selection matrices in body + language-specific impl in a reference. The construction counterpart to `entity-design`. **Strongest core candidate.** |
| **database-architect** (data-layer tech selection + modeling) | TRACK (data) | Agnostic design depth — but overlaps shipped `entity-design`/`stack-select`/`scale-design`/`deploy-design`. Belongs in a **data track** (`data-layer-design`) that enriches those when active, not a duplicate core skill. |
| **database-optimizer** (tuning existing DBs) | TRACK (data) | Operations/Construction-phase tuning skill within the data track. |
| **postgres-schema-design** (Postgres-specific reference) | EXTENSION / TRACK ref-pack | Fails agnosticism. A reference pack a Postgres-track project imports + the skills consult. Never core. |
| **database-migration** (Sequelize/TypeORM/Prisma code) | EXTENSION / TRACK ref-pack | Node/ORM-specific. The agnostic version of "migration strategy" already belongs to `deploy-design` / a future `db-migration-plan`; this concrete one is a track/extension pack. |
| **commit-smart** (semantic conventional commits) | SKIP | Engine already commits (sanitized/conventional). Standalone commit skill = listing-budget sprawl. Revisit only if a real gap appears. |
| **GCC** (Git Context Controller — `.GCC/` markdown VCS) | DECLINE | Duplicates `.sovereign/` + engine + `handoff`; reinvents git-in-markdown vs ADR-007 ("git is the collaboration layer"). Transferable idea only: **branch-for-alternatives** (isolated exploration via real git + engine). |

## Captured 2026-06-09 — live cross-agent dogfooding (Claude `skoolith` + Gemini `OmniMark`)

Signals from running `/council` end-to-end on real projects under the 2.2.0 engine fix:

| Idea | Tier (ADR-014) | Disposition |
|------|----------------|-------------|
| **Debugging skill** (`diagnose`) | **CORE** | Already noted below as a Construction-phase skill — live use confirms demand. A thin-orchestrator, recommendation-first debugging loop (reproduce → isolate → hypothesis → fix → verify) over the engine + `.sovereign/` state; agnostic to stack. `disable-model-invocation` per the listing budget. Promote candidate for the next post-M4 milestone. |
| **Enrich `security-design`** (input validation, injection classes, authz checks, secrets handling) | CORE (shipped skill) | The shipped `security-design` skill scopes the layered model; user wants it to also drive concrete control coverage — input validation, injection (SQLi/XSS/command), authz/IDOR, secrets, rate-limiting. Add a controls checklist/reference the skill consults; keep it agnostic (control *classes*, not framework APIs). Pairs with a future `security-review` construction skill (audit existing code) — distinct from `sentinel`'s standards review. |
| **Gemini CLI has no `/skill` autocomplete** | PORTABILITY / DOCS | Not a SOVEREIGN bug — Gemini CLI doesn't surface SKILL.md names in a `/` menu the way Claude Code does (our skills are standard `SKILL.md`). `/council` still ran correctly when invoked. Action: document the per-agent invocation difference in README/install output (Claude = `/name` autocomplete; other agents = read SKILL.md / invoke by name), and let `npx skills` own per-agent paths. Track for the model-agnostic docs pass. |

## Milestone-shaped follow-ups

- **Tracks layer** (M-future): the backend/data/frontend/mobile/iot track system from the v1 vision — the home for all stack-specific depth above. Prereq for routing database-architect/optimizer cleanly.
- **Construction phase skills** (M-future): `data-structure-select`, plus `tdd` (shipped), `vertical-slice`, `zoom-out`, `diagnose`, `improve-architecture`, `security-review`, `code-patterns` (per `/SOVEREIGN.md` §6 / archive v1).
- **`branch-for-alternatives`**: explore-an-alternative workspaces via real git + engine state snapshots (the one GCC idea worth keeping).
