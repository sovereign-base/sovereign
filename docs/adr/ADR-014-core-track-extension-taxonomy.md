# ADR-014: Core / Track / Extension skill taxonomy

**Status:** Accepted (2026-06-09)

## Context

SOVEREIGN must stay **language-, framework-, and stack-agnostic** (its founding promise) while engineers keep wanting to add genuinely useful but stack-specific knowledge (e.g. a PostgreSQL schema reference, an ORM-specific migration guide, a data-structures selection skill, a competing agent-memory system). Without a rule for *what is allowed into the core*, SOVEREIGN drifts toward the v1 failure mode: a 43-skill kitchen sink that blows Claude Code's skill-listing token budget and dilutes the agnostic promise.

The forcing function was a batch of candidate skills (a Data-Structures selection skill, four database skills incl. Postgres- and ORM-specific ones, a `commit-smart` helper, and GCC — a `.GCC/` markdown VCS for agent memory). They span the full spectrum from "perfectly agnostic" to "Node/Postgres-specific" to "duplicates SOVEREIGN's own state model."

## Decision

Every skill is classified into exactly one of three tiers, with a hard admission test for the core:

1. **CORE** — admitted **only if** it is (a) language/framework/stack-agnostic AND (b) principle- or selection-based (it *decides/recommends*, it does not *implement* in a specific stack). Core skills are phase-mapped, recommendation-first, and count against the auto-trigger listing budget (held at ~5; phase-gated skills set `disable-model-invocation`).
2. **TRACK** — stack/domain-specific knowledge (backend, data, frontend, mobile, iot, …) that loads **only when its track is active**, so stack depth stays out of the agnostic core and off the listing budget. (Tracks are a future milestone.)
3. **EXTENSION** — third-party skills, imported and vetted via the extension protocol (M3, over `npx skills`). Opt-in, never in the shipped core.

**A skill that fails the core test is not rejected — it is routed to a track or the extension layer.** Duplicating an existing core capability is also grounds for exclusion.

### Dispositions of the forcing-function batch
- **Data-Structures selection** → CORE candidate (Construction phase; agnostic, selection-first) — the lone clear core add.
- **database-architect** → its agnostic design content already lives in `entity-design`/`stack-select`/`scale-design`/`deploy-design`; any extra depth belongs in a **data track**, not a new core skill.
- **postgres-schema-design**, **database-migration** → fail agnosticism (Postgres-/ORM-specific) → **track reference packs / extensions**.
- **database-optimizer** → operations/construction tuning → track skill.
- **GCC** → declined: duplicates `.sovereign/` + engine + `handoff`, and reinvents git-in-markdown, contradicting ADR-007 ("git is the collaboration layer"). One transferable idea (branch-for-alternatives) would use real git, not a parallel VCS.
- **commit-smart** → skip: the engine already commits (sanitized/conventional); a standalone commit skill is listing-budget sprawl.

## Consequences

- (+) The agnostic promise is now enforceable, not aspirational — there's a test, and a home for everything that fails it.
- (+) The listing budget is protected: stack-specific skills load via tracks (only when active) or extensions (opt-in), never as always-listed core.
- (+) Most "should we add X?" questions resolve mechanically: agnostic+selection → core; stack-specific → track; third-party → extension.
- (−) Requires building the **tracks layer** (a future milestone) for the data/backend/frontend depth to have a real home; until then, stack-specific knowledge lives only as extensions.
- (−) Contributors must learn the taxonomy; the extension/track distinction adds a classification step to every new skill (mitigated by `skill-format.md` guidance).
