# ADR-011: Drop v1's non-standard SKILL.md frontmatter in favour of the Agent Skills spec

**Status:** Accepted
**Date:** 2026-06-08

## Context

v1's `SKILL.md` files used custom frontmatter fields — `triggers`, `works-best-with`,
`min-model`, `tokens`, and a bare `phase` — that are not part of the Agent Skills
standard. Other tools ignore them, Claude Code does not act on them, and they pollute
the spec'd surface, harming portability. The real Agent Skills spec drives behaviour
through `description` (+ `when_to_use`), with phase logic belonging in the engine, not
in frontmatter. SOVEREIGN's model-agnostic strategy requires skill bodies to stay on
the lowest-common-denominator spec so they run unmodified across ~32 adopters.

## Decision

SOVEREIGN drops v1's non-standard frontmatter and authors all skills against the
**real Agent Skills spec**:

- Removed fields: `triggers`, `works-best-with`, `min-model`, `tokens`, and bare
  `phase`.
- Trigger behaviour is expressed via `description` + `when_to_use` (key use case
  first). Phase logic lives in the **engine** (`sovereign-tools`), not in frontmatter.
- Any portability hints that must persist go under a namespaced `metadata:` block, not
  as bare top-level keys.
- The `validate skills` engine command enforces the spec: `name` ≤ 64 chars,
  lowercase-hyphen, must NOT contain `claude`/`anthropic`; `description` within the
  platform cap. It exits non-zero on any violation.

## Consequences

- **Positive:** Skills are portable across all `SKILL.md`-capable agents; the surface
  is spec-clean; no dead frontmatter for tools to misread.
- **Positive:** Phase/state intelligence is centralized in the engine (one source of
  truth), not scattered across skill headers.
- **Negative / accepted cost:** v1 skill content must be migrated/rewritten rather
  than copied verbatim. Acceptable — v1 is reference content, not a build base.
- **Enforcement:** `validate skills` is the guardrail; CI runs it as a lint so
  non-standard frontmatter cannot re-enter.
