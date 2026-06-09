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

## Milestone-shaped follow-ups

- **Tracks layer** (M-future): the backend/data/frontend/mobile/iot track system from the v1 vision — the home for all stack-specific depth above. Prereq for routing database-architect/optimizer cleanly.
- **Construction phase skills** (M-future): `data-structure-select`, plus `tdd` (shipped), `vertical-slice`, `zoom-out`, `diagnose`, `improve-architecture`, `security-review`, `code-patterns` (per `/SOVEREIGN.md` §6 / archive v1).
- **`branch-for-alternatives`**: explore-an-alternative workspaces via real git + engine state snapshots (the one GCC idea worth keeping).
