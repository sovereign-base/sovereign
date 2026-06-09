---
phase: 19-security-design-enrichment-docs
verified: 2026-06-09T00:00:00Z
status: passed
score: 3/3 success criteria verified
re_verification:
  previous_status: gaps_found
  previous_score: 2.5/3 (SC1 full, SC3 full, SC2 partial)
  gaps_closed:
    - "Per-agent skill invocation note ('by name' + Gemini) is now inside renderHuman() at lines 110-111 (commit 2609ec6)"
  gaps_remaining: []
  regressions: []
---

# Phase 19: `security-design` Controls Enrichment + Docs — Verification Report

**Phase Goal:** `security-design` drives concrete security-control coverage (via a new agnostic `security-controls.md` reference), AND non-Claude users know how to invoke SOVEREIGN's skills (README + installer output).
**Verified:** 2026-06-09
**Status:** passed
**Re-verification:** Yes — after SC2 gap closure (commit 2609ec6)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `engine/references/security-controls.md` exists, names all 5 control classes, is agnostic (no library names) | ✓ VERIFIED | File exists (59 lines); all 5 classes confirmed; no library names found |
| 2 | `security-design/SKILL.md` consults `security-controls.md` by literal path, offers control-coverage checklist, surfaces uncovered classes on re-run | ✓ VERIFIED | Line 39 cites `references/security-controls.md`; checklist + uncovered-on-re-run behavior described |
| 3 | Per-agent invocation documented in BOTH README and installer (`renderHuman`) output | ✓ VERIFIED | README line 26 blockquote: Gemini + "by name". `renderHuman()` lines 110-111: per-agent note confirmed present. Live `init` output grep confirms "by name" appears in install-time output. |
| 4 | `security-design` keeps thin-orchestrator shape; doctor budget 20/5; suite 164 green | ✓ VERIFIED | All gates pass (see below) |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/references/security-controls.md` | Agnostic control-class reference (5 classes, what-to-verify) | ✓ VERIFIED | 59 lines; 5 numbered sections; no library names |
| `engine/skills/security-design/SKILL.md` | Enriched skill consulting security-controls.md + offering checklist | ✓ VERIFIED | 72 lines; step 2b at line 39 cites reference by literal path; re-run behavior described |
| `README.md` | Per-agent invocation note (Claude / vs Gemini-by-name) | ✓ VERIFIED | Line 26 blockquote: "Gemini CLI" + "invoke it by name" |
| `engine/bin/sovereign.cjs` | `renderHuman()` per-agent invocation say() line | ✓ VERIFIED | Lines 110-111 inside `renderHuman()` (function spans 69-114): two-line say() emitting "Invoking: in Claude Code type /skill-name; in other SKILL.md agents (Gemini CLI, …)" + "invoke it by name." Live init output confirmed: `init --full` output contains "by name". |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `engine/skills/security-design/SKILL.md` | `engine/references/security-controls.md` | literal package-relative path reference | ✓ WIRED | Line 39: `Read \`references/security-controls.md\`` — pattern `references/security-controls\.md` confirmed |
| `engine/bin/sovereign.cjs` `renderHuman()` | install-time stdout | `say()` calls at lines 110-111 | ✓ WIRED | Live `node sovereign.cjs init --full` output grep returns the "by name" line; not gated behind `--help` |

---

### Command Gate Results (G1–G11)

| Gate | Command / Check | Expected | Result | Status |
|------|-----------------|----------|--------|--------|
| G1 | `test -f references/security-controls.md` | file exists | exists | ✓ PASS |
| G2 | grep for all 5 class names | all 5 found | all 5 found | ✓ PASS |
| G3 | negative grep: no library names | none found | none found | ✓ PASS |
| G4 | `grep -qF 'security-controls.md' skills/security-design/SKILL.md` | found | found | ✓ PASS |
| G5a | `disable-model-invocation: true` in SKILL.md | present | present | ✓ PASS |
| G5b | `## Why this matters` in SKILL.md | present | present | ✓ PASS |
| G5c | Navigation footer in SKILL.md | present | present | ✓ PASS |
| G5d | SKILL.md line count >= 70 | >= 70 | 72 lines | ✓ PASS |
| G5e | No v1 fields in SKILL.md frontmatter | none | none | ✓ PASS |
| G6 | Literal `.claude/sovereign-engine/sovereign-tools.cjs` in SKILL.md | present | present | ✓ PASS |
| G7 | README has "Gemini" + "by name" | both present | both present at line 26 | ✓ PASS |
| G8 | `renderHuman()` contains "by name" (scoped check) | found inside renderHuman() | found at lines 110-111, inside renderHuman() (lines 69-114) | ✓ PASS |
| G8-live | `node sovereign.cjs init --full --cwd $TMP 2>&1 \| grep -i 'by name'` | line printed | "open the skill's SKILL.md under .claude/skills/ and invoke it by name." | ✓ PASS |
| G9 | `validate skills skills/security-design/SKILL.md` → `"valid": true` | true | `{"valid": true, "checked": 1, "violations": []}` | ✓ PASS |
| G10 | `doctor` → `auto_count: 5`, `total_skills: 20` | 5 / 20 | `auto_count: 5`, `total_skills: 20`, `disabled_count: 15` | ✓ PASS |
| G11 | `node --test "test/**/*.test.cjs"` → `pass 164` | 164 | `ℹ pass 164, ℹ fail 0` | ✓ PASS |

---

### Success Criteria Scorecard

| SC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| SC1 | SEC-01: agnostic security-controls.md + skill consults it + checklist + re-run surfacing | ✓ VERIFIED | G1–G4 all pass; reference is substantive (59 lines, 5 sections); skill step 2b names the reference by literal path and describes re-run behavior |
| SC2 | DOCS-01: per-agent invocation in README + installer output | ✓ VERIFIED | README (G7) passes. Installer (G8/G8-live) now passes — per-agent note is at `renderHuman()` lines 110-111; live init confirms it appears in install-time output. SC2 gap closed in commit 2609ec6. |
| SC3 | M5-CC: thin-orchestrator shape + validate passes + doctor 20/5 + suite 164 | ✓ VERIFIED | G5/G6/G9/G10/G11 all pass |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 19-01 | Agnostic security-controls.md + skill consults + checklist + re-run | ✓ SATISFIED | Reference exists, 5 classes, no library names, skill cites it at step 2b |
| DOCS-01 | 19-01 | Per-agent invocation in README + installer output | ✓ SATISFIED | README line 26 blockquote (Gemini + by-name). renderHuman() lines 110-111 confirmed present. Live init output grep confirms install-time visibility. |
| M5-CC | 19-01 | Thin-orchestrator shape; disable-model-invocation; doctor 20/5; validate passes | ✓ SATISFIED | All G5/G6/G9/G10/G11 gates pass |

---

### Anti-Patterns Found

None. The SC2 blocker (per-agent note misplaced in `usage()` only) was resolved in commit 2609ec6. The note now appears in both `renderHuman()` (install-time output, lines 110-111) and `usage()` (--help output, lines 131-132).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Install output includes per-agent note | `node sovereign.cjs init --full --cwd $TMP 2>&1 \| grep -i 'by name'` | "open the skill's SKILL.md under .claude/skills/ and invoke it by name." | ✓ PASS |
| validate skills → valid:true | `cd engine && node bin/sovereign-tools.cjs validate skills skills/security-design/SKILL.md` | `{"valid": true, "checked": 1, "violations": []}` | ✓ PASS |
| doctor budget unchanged | `cd engine && node bin/sovereign-tools.cjs doctor` | `total_skills: 20, auto_count: 5, disabled_count: 15` | ✓ PASS |
| engine suite 164 green | `cd engine && node --test "test/**/*.test.cjs"` | `ℹ pass 164, ℹ fail 0` | ✓ PASS |

---

### Human Verification Required

None. All items verified programmatically. The previously-flagged human check (live install output content) was resolved by the live spot-check above — the `init --full` output grep directly confirms "by name" appears in install-time output.

---

### Re-verification Summary

**Gap closed (commit 2609ec6):** The single blocking gap from the initial verification was that the per-agent invocation note existed only in `usage()` (the `--help` path, line 130) and was absent from `renderHuman()` (the install-completion output path). Commit 2609ec6 added a two-line `say()` block at `renderHuman()` lines 110-111:

```
say('  Invoking: in Claude Code type /skill-name; in other SKILL.md agents (Gemini CLI, …),')
say('  open the skill\'s SKILL.md under .claude/skills/ and invoke it by name.')
```

Live verification confirms: `node sovereign.cjs init --full` now prints the per-agent note at install time.

**No regressions:** SC1 (security-controls.md), SC3 (thin-orchestrator shape, doctor 20/5, suite 164) are unchanged from initial verification.

**Phase goal achieved in full.**

---

_Verified: 2026-06-09_
_Verifier: Claude (gsd-verifier)_
_Re-verification after: commit 2609ec6 (SC2 gap closure)_
