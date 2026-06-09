---
phase: 19
plan: "19-01"
status: complete
requirements: [SEC-01, DOCS-01, M5-CC]
completed: 2026-06-09
---

# Phase 19 / Plan 19-01 — Summary (M5 finale)

**Objective:** Give `security-design` concrete control coverage (via a new agnostic reference) and document per-agent skill invocation — closing M5 + the M5-CC cross-cutting gate.

## What shipped (4 deliverables)

- **`engine/references/security-controls.md`** (NEW) — agnostic control-classes reference: input validation · injection (SQL/NoSQL, XSS, command/shell, SSRF, template, deserialization, path/header) · authN/authZ/IDOR · secrets handling · rate-limiting/abuse. Each = *what it is / why it bites / what to verify*, class-level (NO library names). Ships via the `files: [references]` allowlist.
- **`engine/skills/security-design/SKILL.md`** (enriched, 72 lines) — new **step 2b** consults `references/security-controls.md`, runs the 5 classes as a recommendation-first coverage checklist, folds gaps into `SECURITY_MODEL.md`, and surfaces uncovered classes on re-run. Frontmatter unchanged (`disable-model-invocation: true`), literal engine path + shape preserved.
- **`README.md`** — a per-agent invocation note: `/skill-name` autocomplete is Claude Code's affordance; other SKILL.md agents (Gemini CLI, …) open the `SKILL.md` and invoke by name.
- **`engine/bin/sovereign.cjs`** `renderHuman` — additive lines in the install output saying the same (in Claude Code type `/skill-name`; elsewhere open the SKILL.md and invoke by name).

## Verification (gates, run from `engine/`)

- G1–G8 content/structural: reference exists + 5 classes + agnostic (no lib names); skill cites `security-controls.md`; skill keeps `disable-model-invocation: true` + `## Why this matters` + footer + ≥70 lines + literal engine path; README + installer document per-agent invocation (`Gemini` + `by name`).
- `validate skills skills/security-design/SKILL.md` → `{ valid: true }`.
- `doctor` → `total_skills: 20, auto_count: 5, disabled_count: 15` — **no new skill; auto-budget held at 5** (M5-CC).
- Regression: `node --test "test/**/*.test.cjs"` → 164/164 (launcher UX tests green after the additive `renderHuman` edit; no engine contract change).

## Scope discipline

Exactly 4 deliverables. No engine (`sovereign-tools`) / init change, no new skill, no other-skill change, no new ADR, no separate `security-review` skill (deferred to M6+).

## Deviations from plan

None. (Plan-checker's one blocker — a vacuous README grep — was fixed pre-execution: the gate now requires `by name` in README, which is non-vacuous.)

## Commits

- (this commit) — feat(19-01): security-controls reference + security-design enrichment + per-agent invocation docs.
