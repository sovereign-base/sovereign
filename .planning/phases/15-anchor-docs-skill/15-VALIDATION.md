---
phase: 15
slug: anchor-docs-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 15 — Validation Strategy

> A SKILL phase: verification gates are structural/lint/command checks, not unit tests. Derived from `15-RESEARCH.md` "Validation Architecture" + Phase 15 success criteria (ANCHOR-01, M4-CC).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell assertions (grep / `wc` / `sovereign-tools` CLI) — no unit-test runner; the deliverable is a hand-authored SKILL.md + an ADR |
| **Config file** | none |
| **Quick run command** | `cd engine && node bin/sovereign-tools.cjs validate skills skills/anchor-docs/SKILL.md` |
| **Full gate command** | `cd engine && node bin/sovereign-tools.cjs doctor` (auto_count must be 5) + `node --test "test/**/*.test.cjs"` (regression: engine untouched, stays 164 green) |
| **Estimated runtime** | < 10 seconds |

> CRITICAL (from research): `doctor` / `validate skills` walk `.claude/skills` + `<cwd>/skills` — NOT `engine/skills/`. Gates MUST run from `engine/` (`--cwd engine` or `cd engine`) or target the explicit `engine/skills/anchor-docs/SKILL.md` path, else they pass vacuously on 0 skills.

---

## Sampling Rate

- **After authoring SKILL.md:** run the quick `validate skills` command + the structural greps.
- **Before completion:** `doctor` shows 5 auto-triggerable; full engine `node --test` still green (no engine regression).
- **Max feedback latency:** < 10 seconds.

---

## Per-Requirement Verification Map

| # | Gate (grep/command-checkable) | SC | Req |
|---|------------------------------|----|-----|
| G1 | `engine/skills/anchor-docs/SKILL.md` exists | SC1 | ANCHOR-01 |
| G2 | frontmatter contains `disable-model-invocation: true` | SC3 | M4-CC |
| G3 | body contains `## Why this matters` AND a navigation footer (`▶ NEXT` / `## Navigation`) | SC2 | M4-CC |
| G4 | `wc -l engine/skills/anchor-docs/SKILL.md` ≥ 70 | SC2 | M4-CC |
| G5 | no v1 frontmatter fields (`triggers:`/`works-best-with:`/`min-model:`/`tokens:`/bare `phase:`) | SC2 | M4-CC |
| G6 | every engine call uses `.claude/sovereign-engine/sovereign-tools.cjs` (NOT `$ENGINE`) | SC1/SC2 | ANCHOR-01 |
| G7 | flow orients via a single `init anchor-docs` call (one orient, with `@file:` guard) | SC2 | M4-CC |
| G8 | flow delegates to `anchor add` / `anchor list` / `anchor check` (does NOT reimplement storage) | SC1 | ANCHOR-01 |
| G9 | content path surfaces a copyright/licensing warning; URL-by-default documented as the default | SC1 | ANCHOR-01 |
| G10 | `docs/adr/ADR-004-anchor-content-copyright.md` exists in repo ADR format; SKILL.md references it | SC1 | ANCHOR-01 |
| G11 | `cd engine && node bin/sovereign-tools.cjs doctor` → auto-trigger count = 5 | SC3 | M4-CC |
| G12 | `cd engine && node bin/sovereign-tools.cjs validate skills skills/anchor-docs/SKILL.md` → passes | SC3 | M4-CC |
| G13 | `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (no engine regression) | — | regression |

---

## Wave 0 Requirements

- [ ] `engine/skills/anchor-docs/SKILL.md` — the skill (hand-authored, mirrors `bridge`)
- [ ] `docs/adr/ADR-004-anchor-content-copyright.md` — the policy ADR the skill cites
- No test framework needed (skill phase).

*All gates above are automatable via grep + `sovereign-tools` CLI run from `engine/`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skill reads well / copyright warning is clear & correctly placed | ANCHOR-01 | Prose quality is judgment | Read SKILL.md; confirm the warning appears at the URL-vs-content decision and the recommendation-first flow is followed |

---

## Validation Sign-Off

- [ ] SKILL.md present, mirrors the `bridge` shape, passes G1–G10 greps
- [ ] `doctor` auto-count = 5 (G11); `validate skills` passes (G12)
- [ ] Engine suite still 164 green (G13)
- [ ] ADR-004 present and referenced
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
