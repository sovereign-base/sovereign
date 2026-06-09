---
phase: 17-diagnose-skill
verified: 2026-06-09T22:45:00Z
status: passed
score: 3/3 success criteria verified
re_verification: false
gaps: []
human_verification:
  - test: "Read the 5-step loop as a debugging practitioner"
    expected: "The flow reads as genuine debugging discipline — reproduce-before-fix is enforced as a hard stop, the hypothesis step demands ONE root cause with a stated why (not a list), the verify step is concrete (re-run the repro case + the full suite), and the tdd/verify-self/sentinel references are actionable hooks not decorative."
    why_human: "Prose quality and disciplinary weight are judgment calls; the greps confirm presence but not persuasiveness."
---

# Phase 17: `diagnose` Skill — Verification Report

**Phase Goal:** A user can run `diagnose` to debug a failure through a disciplined, recommendation-first loop (reproduce → isolate → hypothesis → fix → verify) instead of guessing — stack-agnostic, over the engine + `.sovereign/` state, composing with tdd/verify-self/sentinel.
**Verified:** 2026-06-09T22:45:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running diagnose walks reproduce → isolate → hypothesis → fix → verify in order, recommendation-first, using the project's OWN test/run tooling (no hardcoded toolchain). | VERIFIED | Label-anchored order check: step lines 36 (Reproduce) < 42 (Isolate) < 48 (Hypothesis) < 54 (Fix) < 56 (Verify). All behavior greps pass: `recommend`, `root cause`, `symptom`, `project's own`, `regression`, `suite`. No hardcoded runner literal found (`npm test`, `pytest`, `jest`, `go test`, `cargo test`, `vitest`, `mvn`, `gradle` — all absent). |
| 2 | diagnose orients with a single `init diagnose` call and composes with tdd (failing test + fix), verify-self (unconfirmed root cause → SOVEREIGN:UNVERIFIED), and sentinel (standards pass) — by name, not duplicated. | VERIFIED | `init diagnose` present with `@file:` guard at step 1. `/tdd` referenced at steps 2 (Reproduce) and 5 (Fix). `/verify-self` referenced at step 6 (Verify) with `SOVEREIGN:UNVERIFIED` marker path named explicitly. `/sentinel` referenced at step 6 (Verify) and footer. Literal `.claude/sovereign-engine/sovereign-tools.cjs` path (no `$ENGINE`). |
| 3 | Core-tier thin-orchestrator shape: disable-model-invocation: true (doctor auto-budget held at 5), validate skills passes, engine suite stays 164 green. | VERIFIED | `validate skills skills/diagnose/SKILL.md` → `{ "valid": true }`. `doctor` → `total_skills: 19, auto_count: 5, disabled_count: 14`. Engine suite → `ℹ pass 164, ℹ fail 0`. File is 82 lines (≥70). Sections `## Why this matters`, `## When to use this`, `## The flow`, `## Navigation` with `▶ NEXT` footer all present. No v1 frontmatter fields. |

**Score:** 3/3 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/skills/diagnose/SKILL.md` | Hand-authored thin-orchestrator debugging-loop skill | VERIFIED | Exists, 82 lines, substantive (all required keywords and structure present), wired into engine skill discovery (doctor confirms total_skills: 19, one above the pre-phase baseline of 18). |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `engine/skills/diagnose/SKILL.md` | tdd / verify-self / sentinel | By-name composition in flow + footer | VERIFIED | `/tdd` appears at steps 2 and 5; `verify-self` appears at step 6 with `SOVEREIGN:UNVERIFIED` marker; `sentinel` appears at step 6 and footer. Pattern `/tdd|/verify-self|/sentinel` matched. |
| `engine/skills/diagnose/SKILL.md` | `sovereign-tools init diagnose` | One-call orient with `@file:` guard | VERIFIED | Line 31: `INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init diagnose)` followed immediately by the `@file:` guard on line 32. |
| `engine/skills/diagnose/SKILL.md` | `sovereign-tools state save` | Diagnosis-trail persistence | VERIFIED | Line 64: `node ".claude/sovereign-engine/sovereign-tools.cjs" state save` in the Record step (step 7). `commit_docs` conditional commit also referenced. |

---

## Gate-by-Gate Scorecard (G1–G15)

| Gate | Check | Result |
|------|-------|--------|
| G1 | `engine/skills/diagnose/SKILL.md` exists | PASS |
| G2 | `disable-model-invocation: true` in frontmatter | PASS |
| G3 | `## Why this matters` AND `▶ NEXT` footer present | PASS |
| G4 | `wc -l` ≥ 70 (actual: 82) | PASS |
| G5 | No v1 frontmatter fields (`triggers:` / `works-best-with:` / `min-model:` / `tokens:` / bare `phase:`) | PASS |
| G6 | Engine calls use `.claude/sovereign-engine/sovereign-tools.cjs` (NOT `$ENGINE`) | PASS |
| G7 | One-call orient: `init diagnose` + `@file:` guard both present | PASS |
| G8 | 5 steps ordered — Reproduce (36) < Isolate (42) < Hypothesis (48) < Fix (54) < Verify (56) | PASS |
| G9 | Recommendation-first: `recommend` + `root cause` + `symptom` all present (case-insensitive) | PASS |
| G10 | Stack-agnostic: `project's own` present; no hardcoded runner literal | PASS |
| G11 | Verify includes no-regression: `regression` AND `suite` both present | PASS |
| G12 | Composition: `tdd`, `verify-self`, `sentinel`, `SOVEREIGN:UNVERIFIED`, `init diagnose` all present | PASS |
| G13 | `validate skills skills/diagnose/SKILL.md` → `{ "valid": true }` | PASS |
| G14 | `doctor` → `auto_count: 5`, `total_skills: 19`, `disabled_count: 14` | PASS |
| G15 | Engine suite → `ℹ pass 164, ℹ fail 0` (no engine change, no regression) | PASS |

**All 15 gates: PASS**

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DIAG-01 | 17-01 | Stack-agnostic debugging loop (reproduce → isolate → hypothesis → fix → verify), recommendation-first, composes with tdd/verify-self/sentinel, records the trail | SATISFIED | All 5 steps present and ordered; recommendation-first framing in Hypothesis step; no hardcoded toolchain; `/tdd`, `/verify-self` + `SOVEREIGN:UNVERIFIED`, `/sentinel` all referenced by name in flow and footer; `state save` + `sovereign-tools commit` for trail persistence. |
| M5-CC | 17-01 | Core-tier thin-orchestrator shape; `disable-model-invocation: true`; doctor auto-budget held at 5; `validate skills` clean | SATISFIED | `disable-model-invocation: true` confirmed. Doctor: `auto_count: 5` (budget held). `validate skills` → `valid: true`. Thin-orchestrator sections per `skill-format.md`. No engine code added. |

---

## Scope Discipline

Commit `4fb7a52` touched exactly 3 files:
- `.planning/phases/17-diagnose-skill/17-01-PLAN.md` — updated to harden the order-check grep (a plan revision, not a new artifact)
- `.planning/phases/17-diagnose-skill/17-01-SUMMARY.md` — phase summary
- `engine/skills/diagnose/SKILL.md` — the deliverable

No engine change. No new ADR or reference. No change to `tdd`, `verify-self`, or `sentinel`. Scope discipline: CLEAN.

---

## Description Deviation Note

The PLAN specified a verbatim description: *"Debug a failure methodically instead of guessing — run a recommendation-first loop (reproduce -> isolate -> hypothesis -> fix -> verify) that finds the root cause, not the symptom, using your project's own test/run tooling. Use when a test fails, something errors at runtime, behavior is flaky, or you notice you are guessing at a fix."*

The delivered description reads: *"Debug a failure methodically instead of guessing — reproduce it, isolate the boundary, form one root-cause hypothesis, fix the cause (not the symptom), and verify with no regressions. Use the moment a test fails, a runtime error appears, or you catch yourself about to change something on a hunch."*

The deviation encodes the same steps in flowing prose rather than arrow notation. `validate skills` passes. The intent is preserved; the description is within spec limits (312 chars, well under the 1,024-char cap). Not a gap.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No TODO/FIXME/placeholder comments. No stub returns. No hardcoded empty data. No v1 fields.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `validate skills` accepts the new skill | `cd engine && node bin/sovereign-tools.cjs validate skills skills/diagnose/SKILL.md` | `{ "valid": true, "checked": 1, "violations": [] }` | PASS |
| Doctor auto-budget held at 5 after adding a `disable-model-invocation: true` skill | `cd engine && node bin/sovereign-tools.cjs doctor` | `auto_count: 5, total_skills: 19, disabled_count: 14` | PASS |
| Engine test suite stays 164 green (no engine change) | `cd engine && node --test "test/**/*.test.cjs"` | `ℹ pass 164, ℹ fail 0` | PASS |

---

## Human Verification Required

### 1. Prose Discipline Quality

**Test:** Read `engine/skills/diagnose/SKILL.md` as a developer encountering a failing test. Walk the 5-step loop mentally — does each step actually constrain behavior (reproduce-before-fix as a hard stop, ONE hypothesis not a list, verify = re-run repro + full suite), and do the `/tdd`/`/verify-self`/`/sentinel` hand-off points feel actionable rather than decorative?
**Expected:** The loop reads as genuine debugging discipline that would change behavior; a developer reads "don't guess at code you can't confirm is even running" and stops; the Hypothesis step forces a single explanation with a stated why; the Verify step makes it concrete.
**Why human:** Prose quality and disciplinary force are judgment calls. The greps confirm keyword presence; they cannot confirm whether the overall flow persuades a developer to actually follow the loop.

---

## Summary

Phase 17 goal is achieved. `engine/skills/diagnose/SKILL.md` is a substantive, correctly wired thin-orchestrator skill that:

- Encodes the full `reproduce → isolate → hypothesis → fix → verify` loop in the required order (label-anchored check confirms ascending line numbers 36, 42, 48, 54, 56)
- Is recommendation-first, root-cause-not-symptom, stack-agnostic (no hardcoded toolchain), and includes a no-regression verify step — all confirmed by grep
- Orients with a single `init diagnose` call (literal engine path, `@file:` guard) and composes with `/tdd`, `/verify-self` + `SOVEREIGN:UNVERIFIED`, and `/sentinel` by name
- Sets `disable-model-invocation: true`; doctor confirms the auto-budget is held at 5 (`total_skills: 19, auto_count: 5, disabled_count: 14`)
- Passes `validate skills`, leaves the engine suite at 164/164 green, and introduces no engine change

All 15 gates pass. DIAG-01 and M5-CC are satisfied.

One item is routed to human verification: prose quality (whether the loop reads as genuine debugging discipline, not just keyword presence).

---

_Verified: 2026-06-09T22:45:00Z_
_Verifier: Claude (gsd-verifier)_
