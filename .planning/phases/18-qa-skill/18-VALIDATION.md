---
phase: 18
slug: qa-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 18 — Validation Strategy

> SKILL phase: gates are structural/lint/command + prose-coverage checks. From `18-RESEARCH.md` "Validation Architecture" + Phase 18 success criteria (QA-01, M5-CC). `init qa` needs NO engine change (verified live) — engine suite must stay 164 green.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell assertions (grep / `wc` / `sovereign-tools` CLI) — deliverable is a hand-authored SKILL.md |
| **Quick run command** | `cd engine && node bin/sovereign-tools.cjs validate skills skills/qa/SKILL.md` |
| **Full gate command** | `cd engine && node bin/sovereign-tools.cjs doctor` (assert auto_count==5) + `node --test "test/**/*.test.cjs"` (164 green) |
| **Estimated runtime** | < 10 seconds |

> CRITICAL: run gates from `engine/` (gates walk `<cwd>/skills`, not `engine/skills/`) or they pass vacuously. `doctor` exits 0 regardless of `auto_count` — ASSERT the value.

---

## Sampling Rate

- **After authoring SKILL.md:** quick `validate skills` + structural/coverage greps.
- **Before completion:** `doctor` auto_count==5; engine `node --test` 164 green.
- **Max feedback latency:** < 10 seconds.

---

## Per-Requirement Verification Map

| # | Gate (grep/command-checkable) | SC | Req |
|---|------------------------------|----|-----|
| G1 | `engine/skills/qa/SKILL.md` exists | SC1 | QA-01 |
| G2 | frontmatter `disable-model-invocation: true` | SC3 | M5-CC |
| G3 | body has `## Why this matters` AND nav footer (`▶ NEXT` / `## Navigation`) | SC3 | M5-CC |
| G4 | `wc -l` ≥ 70 | SC3 | M5-CC |
| G5 | no v1 frontmatter fields (`triggers:`/`works-best-with:`/`min-model:`/`tokens:`/bare `phase:`) | SC3 | M5-CC |
| G6 | engine calls use `.claude/sovereign-engine/sovereign-tools.cjs` (NOT `$ENGINE`) | SC2 | M5-CC |
| G7 | one-call orient: contains `init qa` + `@file:` guard | SC2 | M5-CC |
| G8 | all 5 categories named: `grep -iq` each of static correctness, tests, dependency/wiring, routing (`grep -iq 'rout'`), cross-workspace | SC1 | QA-01 |
| G9 | dependency-integrity specifics: import resolution + version alignment + example/template config (`grep -iq 'import'` + `'version'` + `'config'`) | SC1 | QA-01 |
| G10 | API-contract source named: `grep -q 'API_SPEC.md'` (the `.sovereign/docs/api/` contract) | SC1 | QA-01 |
| G11 | report format: contains ✅ AND ❌ AND ⚠️ AND `file:line` AND a `verdict` | SC1 | QA-01 |
| G12 | project's-own-command + fallback: `grep -iq "project.s own"` + `grep -iq 'per-module'` | SC1 | QA-01 |
| G13 | stack-agnostic: NO hardcoded default runner (`! grep -Eqi '\b(npm test\|pytest\|jest\|go test\|cargo test\|vitest\|mvn\|gradle)\b'`) | SC1 | QA-01 |
| G14 | composition: references `diagnose` AND `sentinel` by name | SC2 | QA-01 |
| G15 | `cd engine && validate skills skills/qa/SKILL.md` → `valid: true` | SC3 | M5-CC |
| G16 | `cd engine && doctor` → auto_count == 5 (total 20, disabled 15) | SC3 | M5-CC |
| G17 | `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (no engine change) | — | regression |

---

## Wave 0 Requirements

- [ ] `engine/skills/qa/SKILL.md` — the skill (hand-authored, mirrors `diagnose`/`sentinel`; content from `.planning/research/qa-skill-source-spec.md`)
- No engine change, no test framework, no new ADR.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The sweep reads as genuinely relentless + agnostic (every category actionable per the project's own tools) and the report skeleton is concrete | QA-01 | Coverage/quality is judgment | Read SKILL.md; confirm the 5 categories are concrete + agnostic, the report template is copyable, and the diagnose/sentinel hand-offs are real |

---

## Validation Sign-Off

- [ ] SKILL.md present, mirrors sibling shape, passes G1–G14 greps
- [ ] `validate skills` passes (G15); `doctor` auto_count == 5 (G16)
- [ ] Engine suite still 164 green (G17)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
