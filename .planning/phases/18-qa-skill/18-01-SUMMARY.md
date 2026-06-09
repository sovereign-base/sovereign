---
phase: 18
plan: "18-01"
status: complete
requirements: [QA-01, M5-CC]
completed: 2026-06-09
---

# Phase 18 / Plan 18-01 — Summary

**Objective:** Hand-author the `qa` skill — a stack-agnostic, repo-wide correctness sweep over the project's own toolchain, reporting ✅/❌/⚠️ with `file:line`, composing with `diagnose`/`sentinel`. (User-supplied spec, adapted.)

## What shipped

- **`engine/skills/qa/SKILL.md`** (70 lines) — core-tier thin orchestrator mirroring `diagnose`:
  - One-call `init qa` orient (+ `@file:` guard); literal `.claude/sovereign-engine/sovereign-tools.cjs` path (no `$ENGINE`).
  - **Runs the project's own `qa` command when present, else per-module equivalents** — stack-agnostic (no hardcoded npm/pytest/jest/etc.).
  - **All 5 check categories** per module: static correctness (type-check/schema/lint), tests, dependency & wiring integrity (registration, import resolution, version alignment, example-config↔code), navigation/routing, cross-workspace consistency (single shared-runtime version, contract types, schema↔types, API contract vs `.sovereign/docs/api/API_SPEC.md`).
  - **Report skeleton embedded:** grouped module→category, `✅`/`❌` (exact error + `file:line`)/`⚠️`, one-line **verdict** (pass / fail with N blocking).
  - **Composition:** each `❌` → `/diagnose` (root cause, not patch); complements `/sentinel` (mechanical correctness vs standards). Named in flow + footer.
  - `disable-model-invocation: true`; `## Why this matters` + `## When to use this` (+ Don't) + `## The flow` + `▶ NEXT` footer.

## Verification (gates, run from `engine/`)

- Structural G1–G7 + coverage G8–G14: all pass (exists; 70 ≥ 70 lines; `disable-model-invocation: true`; sections + footer; no v1 fields; literal engine path; one-call `init qa`; 5 categories named; import/version/config; `API_SPEC.md`; ✅/❌/⚠️ + `file:line` + verdict; project's-own + per-module; no hardcoded runner; diagnose + sentinel).
- `validate skills skills/qa/SKILL.md` → `{ valid: true }`.
- `doctor` → `total_skills: 20, auto_count: 5, disabled_count: 15` — **auto-budget held at 5** (M5-CC).
- Regression: `node --test "test/**/*.test.cjs"` → 164/164 (no engine change — `init qa` uses the default case).

## Scope discipline

One file. No engine change (confirmed `init qa` works via the default case), no new ADR/reference, no change to diagnose/sentinel/tdd.

## Deviations from plan

None. (Plan-checker passed with no blockers/warnings; the robust presence-grep verify chain passed on first authoring.)

## Commits

- (this commit) — feat(18-01): qa skill.
