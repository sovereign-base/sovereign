# ADR-010: Every command is authored as a skill directory, never a bare command file

**Status:** Accepted
**Date:** 2026-06-08

## Context

Claude Code supports two ways to define an invocable command: a legacy bare
`.claude/commands/*.md` file, or a skill *directory* `skills/<name>/SKILL.md` with a
supporting-files folder. The skill-directory form auto-loads, carries supporting
files (references, templates, scripts), and — on a name clash with a bare command
file — the skill wins in current Claude Code. SOVEREIGN's architecture (SOVEREIGN.md
§3) makes skills thin orchestrators that need supporting references and on-demand
docs, which the bare-file form cannot host cleanly.

This decision is most relevant in Phase 2+ (when skills are actually written), but it
is locked now so later phases cannot silently relitigate it.

## Decision

Every SOVEREIGN command is authored as a **skill directory**:
`skills/<name>/SKILL.md` (plus any `references/`, `templates/`, `rules/` it needs).

- We do NOT author commands as bare `.claude/commands/*.md` files.
- Skill `name` values follow the Agent Skills spec (lowercase + hyphen, ≤ 64 chars,
  no `claude`/`anthropic`); enforced by `validate skills` (see ADR-011).
- On any name collision with a legacy command file, the skill directory is canonical.

## Consequences

- **Positive:** Supporting-file directory, progressive disclosure, and auto-load come
  for free; skill bodies stay thin while heavy material lives in on-demand references.
- **Positive:** Portable across `SKILL.md`-capable agents (Codex, Cursor, Gemini),
  which read the skill directory form.
- **Negative / accepted cost:** Slightly more structure per command (a directory, not
  a single file). Acceptable given the supporting-file and portability gains.
- **Scope note:** This ADR governs authoring convention only; the actual skills are
  built in Phase 2 and beyond.
