---
phase: 17
plan: "17-01"
status: complete
requirements: [DIAG-01, M5-CC]
completed: 2026-06-09
---

# Phase 17 / Plan 17-01 — Summary

**Objective:** Hand-author the `diagnose` construction skill — a stack-agnostic, recommendation-first debugging loop that composes with the shipped skills.

## What shipped

- **`engine/skills/diagnose/SKILL.md`** (82 lines) — core-tier thin orchestrator mirroring `verify-self`/`tdd`:
  - One-call `init diagnose` orient (+ `@file:` guard); literal `.claude/sovereign-engine/sovereign-tools.cjs` path (no `$ENGINE`).
  - The five-step loop, ordered + recommendation-first: **reproduce → isolate → hypothesis → fix → verify** (+ orient first, record last). Root-cause-not-symptom throughout; verify includes a no-regression full-suite run.
  - **Stack-agnostic** — uses the project's own test/run tooling; no hardcoded runner (npm/pytest/jest/etc. deliberately absent).
  - **Composition (orchestrates, doesn't duplicate):** `/tdd` (capture the reproduce case + drive the change), `/verify-self` (unconfirmed root cause → `SOVEREIGN:UNVERIFIED` marker), `/sentinel` (standards pass). Named in flow + footer.
  - Records a diagnosis trail via `state save` (+ commit) so it isn't re-derived.
  - `disable-model-invocation: true`; `## Why this matters` + `## When to use this` (+ Don't) + `## The flow` + `▶ NEXT` footer.

## Verification (gates, run from `engine/`)

- Structural G1–G7: pass (exists; 82 ≥ 70 lines; `disable-model-invocation: true`; sections + footer; no v1 fields; literal engine path, no `$ENGINE`; one-call `init diagnose`).
- Behavior G8–G12: the 5 step labels appear in order (lines 36<42<48<54<56 via label-anchored check); recommendation-first / root-cause / symptom / project's-own / regression / suite present; no hardcoded runner; composes with tdd + verify-self + sentinel + `SOVEREIGN:UNVERIFIED`.
- `validate skills skills/diagnose/SKILL.md` → `{ valid: true }`.
- `doctor` → `total_skills: 19, auto_count: 5, disabled_count: 14` — **auto-budget held at 5** (M5-CC).
- Regression: `node --test "test/**/*.test.cjs"` → 164/164 (no engine change — `init diagnose` uses the default case).

## Scope discipline

One file. No engine change (confirmed `init diagnose` works via the default case), no new ADR/reference, no change to tdd/verify-self/sentinel.

## Deviations from plan

- The plan's `<verify>` order-check was hardened during execution: the bare-word/body-tail approach false-failed on correct prose (loop words recur across steps; "verify" appears via `verify-self`). Replaced with a **label-anchored** check (`^\*\*N — <Step>`) that matches only the numbered step headings. Plan updated to match.
- Skill restructured to bulleted sub-steps (debugging-checklist readability + clears the ≥70-line gate; dense single-line paragraphs were 61 lines).

## Commits

- (this commit) — feat(17-01): diagnose skill.
