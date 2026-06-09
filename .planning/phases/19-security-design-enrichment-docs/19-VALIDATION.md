---
phase: 19
slug: security-design-enrichment-docs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 19 — Validation Strategy

> Reference + skill-enrichment + docs phase. Gates are structural/lint/command + content-presence checks (full rationale in `19-RESEARCH.md` "Validation Architecture"). No engine contract change → engine suite must stay 164 green. RUN command gates FROM `engine/`; ASSERT doctor's `auto_count` (doctor exits 0 regardless).

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell assertions (grep / `wc` / `sovereign-tools` CLI) + `node --test` for the launcher-edit regression |
| **Quick run** | `cd engine && node bin/sovereign-tools.cjs validate skills skills/security-design/SKILL.md` |
| **Full gate** | `cd engine && node bin/sovereign-tools.cjs doctor` (assert auto_count==5, total==20) + `node --test "test/**/*.test.cjs"` (164 green) |
| **Runtime** | < 10 seconds |

## Per-Requirement Verification Map

| # | Gate | SC | Req |
|---|------|----|-----|
| G1 | `engine/references/security-controls.md` exists | SC1 | SEC-01 |
| G2 | reference names all 5 control classes (input validation, injection, authz/IDOR, secrets, rate-limit) | SC1 | SEC-01 |
| G3 | reference agnostic — no framework/library names (class-level only) | SC1 | SEC-01 |
| G4 | `security-design/SKILL.md` references `security-controls.md` + offers the coverage checklist | SC1 | SEC-01 |
| G5 | skill keeps `disable-model-invocation: true` + `## Why this matters` + nav footer + ≥70 lines + no v1 fields | SC3 | M5-CC |
| G6 | skill keeps literal `.claude/sovereign-engine/sovereign-tools.cjs` (no `$ENGINE`) | SC3 | M5-CC |
| G7 | README documents per-agent invocation (Claude `/`-autocomplete vs read SKILL.md / invoke by name) | SC2 | DOCS-01 |
| G8 | installer (`sovereign.cjs renderHuman`) output documents per-agent invocation | SC2 | DOCS-01 |
| G9 | `cd engine && validate skills skills/security-design/SKILL.md` → `valid: true` | SC3 | M5-CC |
| G10 | `cd engine && doctor` → auto_count == 5, total_skills == 20 | SC3 | M5-CC |
| G11 | `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (launcher UX tests included) | — | regression |

## Wave 0 Requirements

- [ ] `engine/references/security-controls.md` (NEW)
- [ ] `engine/skills/security-design/SKILL.md` (enriched)
- [ ] `README.md` + `engine/bin/sovereign.cjs renderHuman` (per-agent invocation note)
- No engine contract change; no new skill (doctor stays 20/5/15).

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| The controls reference is genuinely actionable + agnostic; the enriched skill consults it recommendation-first without bloating | SEC-01 | Content quality is judgment | Read the reference + the new skill step; confirm class-level (no library names) + checklist offered + uncovered-classes-on-re-run |

## Validation Sign-Off

- [ ] G1–G8 content/structural gates pass
- [ ] `validate skills` passes (G9); `doctor` auto==5/total==20 (G10)
- [ ] Engine suite still 164 green (G11)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
