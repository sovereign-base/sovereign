---
phase: 17
slug: diagnose-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 17 — Validation Strategy

> SKILL phase: gates are structural/lint/command + prose-behavior checks, not unit tests. From `17-RESEARCH.md` "Validation Architecture" + Phase 17 success criteria (DIAG-01, M5-CC). `init diagnose` needs NO engine change (verified) — so no new engine test; the engine suite must stay 164 green.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell assertions (grep / `wc` / `sovereign-tools` CLI) — deliverable is a hand-authored SKILL.md |
| **Quick run command** | `cd engine && node bin/sovereign-tools.cjs validate skills skills/diagnose/SKILL.md` |
| **Full gate command** | `cd engine && node bin/sovereign-tools.cjs doctor` (assert auto_count==5) + `node --test "test/**/*.test.cjs"` (164 green) |
| **Estimated runtime** | < 10 seconds |

> CRITICAL: run gates from `engine/` (`doctor`/`validate`/`test` walk `<cwd>/skills`, not `engine/skills/`) or they pass vacuously. Doctor exits 0 regardless of `auto_count` — ASSERT the value, don't trust exit code.

---

## Sampling Rate

- **After authoring SKILL.md:** quick `validate skills` + structural/behavior greps.
- **Before completion:** `doctor` auto_count==5; engine `node --test` 164 green.
- **Max feedback latency:** < 10 seconds.

---

## Per-Requirement Verification Map

| # | Gate (grep/command-checkable) | SC | Req |
|---|------------------------------|----|-----|
| G1 | `engine/skills/diagnose/SKILL.md` exists | SC1 | DIAG-01 |
| G2 | frontmatter `disable-model-invocation: true` | SC3 | M5-CC |
| G3 | body has `## Why this matters` AND nav footer (`▶ NEXT` / `## Navigation`) | SC3 | M5-CC |
| G4 | `wc -l` ≥ 70 | SC3 | M5-CC |
| G5 | no v1 frontmatter fields (`triggers:`/`works-best-with:`/`min-model:`/`tokens:`/bare `phase:`) | SC3 | M5-CC |
| G6 | engine calls use `.claude/sovereign-engine/sovereign-tools.cjs` (NOT `$ENGINE`) | SC2 | M5-CC |
| G7 | one-call orient: contains `init diagnose` + `@file:` guard | SC2 | M5-CC |
| G8 | loop encodes all 5 steps, ordered: reproduce → isolate → hypothesis → fix → verify (`grep -iq` each) | SC1 | DIAG-01 |
| G9 | recommendation-first + root-cause-not-symptom (`grep -iq 'recommend'` + `grep -iq 'root cause'`) | SC1 | DIAG-01 |
| G10 | stack-agnostic: uses the project's own tooling; no hardcoded runner (`grep -iq "project's own\|your project"`; `! grep -Eqi '\b(npm test\|pytest\|jest\|go test\|cargo test)\b'` as a literal default) | SC1 | DIAG-01 |
| G11 | verify step includes no-regression (`grep -iq 'regression\|whole suite\|full suite'`) | SC1 | DIAG-01 |
| G12 | composition: references `tdd` AND `verify-self` AND `sentinel` by name | SC2 | DIAG-01 |
| G13 | `cd engine && validate skills skills/diagnose/SKILL.md` → `valid: true` | SC3 | M5-CC |
| G14 | `cd engine && doctor` → auto_count == 5 (total 19, disabled 14) | SC3 | M5-CC |
| G15 | `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (no engine change) | — | regression |

---

## Wave 0 Requirements

- [ ] `engine/skills/diagnose/SKILL.md` — the skill (hand-authored, mirrors `verify-self`/`tdd`)
- No engine change, no test framework, no new ADR.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The loop reads as genuine debugging discipline (reproduce-before-fix, one hypothesis, root cause) and composition is real not decorative | DIAG-01 | Prose quality is judgment | Read SKILL.md; confirm the 5 steps are concrete + recommendation-first and the tdd/verify-self/sentinel hooks are actionable |

---

## Validation Sign-Off

- [ ] SKILL.md present, mirrors sibling shape, passes G1–G12 greps
- [ ] `validate skills` passes (G13); `doctor` auto_count == 5 (G14)
- [ ] Engine suite still 164 green (G15)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
