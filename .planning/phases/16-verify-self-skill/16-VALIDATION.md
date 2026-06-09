---
phase: 16
slug: verify-self-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 16 — Validation Strategy

> A SKILL phase (the M4 capstone): verification gates are structural/lint/command + prose-behavior checks, not unit tests. Derived from `16-RESEARCH.md` "Validation Architecture" + Phase 16 success criteria (VERIFY-01, VERIFY-02, ANCHOR-02, M4-CC).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell assertions (grep / `wc` / `sovereign-tools` CLI) — deliverable is a hand-authored SKILL.md |
| **Quick run command** | `cd engine && node bin/sovereign-tools.cjs validate skills skills/verify-self/SKILL.md` |
| **Full gate command** | `cd engine && node bin/sovereign-tools.cjs doctor` (auto_count must be 5) + `node --test "test/**/*.test.cjs"` (regression: engine untouched, 164 green) |
| **Estimated runtime** | < 10 seconds |

> CRITICAL: `doctor` / `validate skills` walk `.claude/skills` + `<cwd>/skills`, NOT `engine/skills/`. Gates MUST run from `engine/` (or target the explicit path) or they pass vacuously on 0 skills.

---

## Sampling Rate

- **After authoring SKILL.md:** quick `validate skills` + structural/behavior greps.
- **Before completion:** `doctor` shows 5 auto-triggerable; engine `node --test` still 164 green.
- **Max feedback latency:** < 10 seconds.

---

## Per-Requirement Verification Map

| # | Gate (grep/command-checkable) | SC | Req |
|---|------------------------------|----|-----|
| G1 | `engine/skills/verify-self/SKILL.md` exists | SC1 | VERIFY-01 |
| G2 | frontmatter contains `disable-model-invocation: true` | SC4 | M4-CC |
| G3 | body has `## Why this matters` AND a navigation footer (`▶ NEXT` / `## Navigation`) | SC4 | M4-CC |
| G4 | `wc -l engine/skills/verify-self/SKILL.md` ≥ 70 | SC4 | M4-CC |
| G5 | no v1 frontmatter fields (`triggers:`/`works-best-with:`/`min-model:`/`tokens:`/bare `phase:`) | SC4 | M4-CC |
| G6 | every engine call uses `.claude/sovereign-engine/sovereign-tools.cjs` (NOT `$ENGINE`) | SC4 | M4-CC |
| G7 | one-call orient: contains `init verify-self` + the `@file:` guard | SC4 | M4-CC |
| G8 | flow states a HARD STOP first (e.g. `grep -iq 'hard stop\|stop writing'`) | SC1 | VERIFY-01 |
| G9 | flow describes a retroactive audit surfacing `file:line` uncertainties (e.g. `grep -iq 'file:line'` + `grep -iq 'audit'`) | SC1 | VERIFY-01 |
| G10 | presents THREE choices A/B/C (`grep -Eq 'A\)' ; 'B\)' ; 'C\)'` or equivalent labels) | SC2 | VERIFY-02 |
| G11 | choice A hands off to anchor-docs (`grep -q 'anchor-docs'`) | SC2/SC3 | VERIFY-02/ANCHOR-02 |
| G12 | choice B writes the exact marker token `SOVEREIGN:UNVERIFIED` in the spec form (`grep -q 'SOVEREIGN:UNVERIFIED'`) | SC2 | VERIFY-02 |
| G13 | references the marker spec / never-silently-continue (`grep -q 'unverified-marker'` or the form; `grep -iq 'never'` continue) | SC2 | VERIFY-02 |
| G14 | mentions `sentinel` scans the markers (loop closed) | SC3 | ANCHOR-02 |
| G15 | `cd engine && validate skills skills/verify-self/SKILL.md` → `valid: true` | SC4 | M4-CC |
| G16 | `cd engine && doctor` → auto_count = 5 (total 18, disabled 13) | SC4 | M4-CC |
| G17 | `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (no engine regression) | — | regression |

---

## Wave 0 Requirements

- [ ] `engine/skills/verify-self/SKILL.md` — the skill (hand-authored, mirrors `anchor-docs`/`bridge`)
- No test framework, no engine change, no new ADR (the marker spec + ADR-004 already exist).

*All gates are automatable via grep + `sovereign-tools` CLI run from `engine/`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The hard-stop + 3-choice flow reads clearly and the marker example is exactly the spec form | VERIFY-01/02 | Prose quality + loop legibility is judgment | Read SKILL.md; confirm the hard stop is first, the audit names file:line uncertainties, A/B/C are concrete, and choice B's marker matches `unverified-marker.md` verbatim |

---

## Validation Sign-Off

- [ ] SKILL.md present, mirrors the sibling shape, passes G1–G14 greps
- [ ] `validate skills` passes (G15); `doctor` auto_count = 5 (G16)
- [ ] Engine suite still 164 green (G17)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
