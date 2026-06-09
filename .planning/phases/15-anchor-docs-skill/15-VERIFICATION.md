---
phase: 15-anchor-docs-skill
verified: 2026-06-09T20:00:00Z
status: passed
score: 3/3 success criteria verified
re_verification: false
---

# Phase 15: anchor-docs Skill Verification Report

**Phase Goal:** A user can run `anchor-docs` to anchor implementation to current external documentation and know which anchors have gone stale — a core-tier thin orchestrator that wraps the Phase 14 engine anchor command (delegates, never reimplements).
**Verified:** 2026-06-09
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | A user invoking `anchor-docs` ingests external docs by delegating to engine `anchor add` (URL-by-default, content opt-in gated behind a copyright warning citing ADR-004); storage NOT reimplemented | VERIFIED | SKILL.md delegates to `anchor add|list|check` via literal engine path; ADR-004 present in repo ADR format and cited at the decision point; no direct `external-docs/*.md` writes in skill body |
| SC2 | Skill orients with a single `init anchor-docs` call; core-tier shape: `## Why this matters`, recommendation-first, navigation footer; >=70 lines; literal engine path; no v1 frontmatter | VERIFIED | `init anchor-docs` one-call present with `@file:*` spill guard; all required sections present; 84 lines; `.claude/sovereign-engine/sovereign-tools.cjs` used everywhere; no `triggers`/`works-best-with`/`min-model`/`tokens`/bare `phase:` fields |
| SC3 | `disable-model-invocation: true` set; `doctor` holds auto-trigger budget at 5; `validate skills` passes | VERIFIED | `disable-model-invocation: true` exact (line 4); `doctor` → `total_skills: 17, auto_count: 5, disabled_count: 12`; `validate skills` → `{"valid": true, "checked": 1, "violations": []}` |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/skills/anchor-docs/SKILL.md` | Core-tier thin-orchestrator skill wrapping Phase 14 `anchor` command | VERIFIED | 84 lines; all sections present; `disable-model-invocation: true`; literal engine path |
| `docs/adr/ADR-004-anchor-content-copyright.md` | URL-by-default / content-opt-in / copyright-warning policy in repo ADR format | VERIFIED | `# ADR-004:` title; `**Status:** Accepted`; `## Context`, `## Decision`, `## Consequences` present; URL-by-default, opt-in, content-agnostic engine, copyright warning all documented |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `engine/skills/anchor-docs/SKILL.md` | engine `anchor` command | `.claude/sovereign-engine/sovereign-tools.cjs` | WIRED | Literal path used in every engine call (orient, anchor check, anchor add, anchor list, state save) — no `$ENGINE` or relative path |
| `engine/skills/anchor-docs/SKILL.md` | `docs/adr/ADR-004-anchor-content-copyright.md` | `ADR-004` citation at content-opt-in decision point | WIRED | "See **ADR-004** for the URL-by-default / content-opt-in policy" appears at Step 4, exactly where the copyright call is made |

---

### Structural Gate Results (G1–G15)

| Gate | Check | Result |
|------|-------|--------|
| G1 | `engine/skills/anchor-docs/SKILL.md` exists | PASS |
| G2 | `disable-model-invocation: true` (exact line match) | PASS |
| G3 | `## Why this matters` present | PASS |
| G4 (VALIDATION numbering) / G3b | `## Navigation` + `▶ NEXT` present | PASS |
| G5 (VALIDATION) / G4 (PLAN) | `wc -l` >= 70 (actual: 84) | PASS |
| G6 (VALIDATION) / G5 (PLAN) | No v1 frontmatter fields (`triggers`/`works-best-with`/`min-model`/`tokens`/bare `phase:`) | PASS |
| G7 (VALIDATION) / G7 (PLAN) | Literal `.claude/sovereign-engine/sovereign-tools.cjs` present; no `$ENGINE` | PASS |
| G8 (VALIDATION) / G8 (PLAN) | Delegates to `anchor add|list|check`; no direct `external-docs/*.md` write | PASS |
| G9 (VALIDATION) / G9 (PLAN) | `init anchor-docs` orient call present; `@file:*` spill guard present | PASS |
| G10 (VALIDATION) / G10 (PLAN) | Copyright warning present; URL-by-default documented | PASS |
| G11 (ADR) | `docs/adr/ADR-004-anchor-content-copyright.md` exists in repo ADR format with `# ADR-004:`, `## Context/Decision/Consequences`, `**Status:** Accepted` | PASS |
| G12 (VALIDATION) / G12 (PLAN) | `ADR-004` cited in SKILL.md | PASS |
| G13 (PLAN) / G11 (VALIDATION) | `doctor` → `auto_count: 5` (exact) | PASS (`auto_count: 5`, `total_skills: 17`, `disabled_count: 12`) |
| G14 (PLAN) / G12 (VALIDATION) | `validate skills skills/anchor-docs/SKILL.md` → `valid: true` | PASS (`{"valid": true, "checked": 1, "violations": []}`) |
| G15 (PLAN) / G13 (VALIDATION) | Engine regression: `node --test "test/**/*.test.cjs"` → 164 green | PASS (164 pass, 0 fail) |

---

### Command Gate Outputs (verbatim)

**`validate skills`** (run from `engine/`):
```json
{
  "valid": true,
  "checked": 1,
  "violations": []
}
```

**`doctor`** (run from `engine/`):
```json
{
  "ok": true,
  "total_skills": 17,
  "auto_count": 5,
  "disabled_count": 12,
  "desc_chars": 1362,
  "listing_token_estimate": 341,
  "auto_max": 7,
  "token_budget": 2000,
  "warnings": []
}
```

**Engine regression** (`node --test "test/**/*.test.cjs"`):
```
ℹ tests 164
ℹ pass 164
ℹ fail 0
```

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ANCHOR-01 | 15-01 | Ingest external docs (URL-by-default, content opt-in with copyright warning per ADR-004) under `.sovereign/external-docs/<slug>.md` | SATISFIED | Skill delegates to `anchor add`; URL-by-default documented and recommended; copyright warning at Step 4; ADR-004 cited; storage not reimplemented in skill |
| M4-CC (Phase 15 half) | 15-01 | Core-tier thin orchestrator shape; `disable-model-invocation: true`; doctor auto-trigger budget at 5; `validate skills` clean | SATISFIED | All shape requirements verified; command gates confirm budget held and validate passes |

**Note:** ANCHOR-02 (end-to-end stale surfacing via `verify-self` composition) is assigned to Phase 16 per REQUIREMENTS.md traceability table. The Phase 15 skill does include `anchor check` in its flow (Step 2 surfaces staleness), but the full ANCHOR-02 loop closes in Phase 16. This is correct scope.

---

### Scope Discipline

| Check | Status | Evidence |
|-------|--------|----------|
| No engine source changes | PASS | Commit `6839970` touched only `docs/adr/ADR-004-anchor-content-copyright.md` and `engine/skills/anchor-docs/SKILL.md`; no `engine/bin/` or `engine/test/` files modified |
| No verify-self authored | PASS | Only `anchor-docs` skill created |
| No fetch client introduced | PASS | No HTTP/fetch code in either deliverable |
| No SOVEREIGN:UNVERIFIED emission | PASS | The string appears once in SKILL.md line 82 as "does NOT emit SOVEREIGN:UNVERIFIED markers" — a documentation statement, not an emission |
| ANCHOR-02 end-to-end not claimed | PASS | SKILL.md invokes `anchor check` to surface staleness but explicitly defers the full anchor→verify→sentinel loop to Phase 16; no claim to close ANCHOR-02 |

---

### Anti-Patterns Found

None. The skill body uses concrete engine commands, real bash snippets with the literal engine path, and recommendation-first prose. No TODO/FIXME/placeholder patterns found. No return-null stubs (it is a hand-authored markdown skill, not a code component).

---

### Behavioral Spot-Checks

This is a hand-authored skill phase (markdown + ADR). No runnable entry point for the skill itself. Command-line gates for the engine tooling (validate skills, doctor, node --test) serve as the behavioral checks for this phase type — all three ran and passed. Step 7b is not applicable beyond those gates.

---

### Human Verification Required

| Test | What to do | Expected | Why human |
|------|-----------|----------|-----------|
| Copyright warning placement | Read SKILL.md Step 4 | Warning appears before the `--content` example, after the URL-only recommendation; tone is clear and non-alarming | Prose quality and UX clarity are judgment calls |
| Recommendation-first flow | Read SKILL.md Steps 3-5 | URL-only path is the natural default; `--content` path is clearly secondary and gated | Flow ordering is a reading/UX judgment |

These are quality checks only — they do not block the automated gate result. All automatable criteria pass.

---

## Summary

Phase 15 achieved its goal. Both deliverables exist, are substantive, and are correctly wired:

- `engine/skills/anchor-docs/SKILL.md` (84 lines) is a genuine thin orchestrator mirroring the `bridge` shape. It delegates entirely to the engine's `anchor add|list|check` commands via the literal installed engine path, surfaces staleness at Step 2, surfaces the copyright decision at Step 4 with a clear URL-by-default recommendation, cites ADR-004, and sets `disable-model-invocation: true`.

- `docs/adr/ADR-004-anchor-content-copyright.md` is in proper repo ADR format (matching ADR-011/ADR-014 structure), resolves the previously-dangling ANCHOR-01 reference, and records the URL-by-default / content-opt-in / content-agnostic-engine policy.

All 15 structural gates (G1-G15) pass. All three command gates pass with exact expected values. The engine regression suite is 164/164. No engine changes occurred in this phase.

---

_Verified: 2026-06-09_
_Verifier: Claude (gsd-verifier)_
