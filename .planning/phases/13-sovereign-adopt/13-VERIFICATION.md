---
phase: 13-sovereign-adopt
verified: 2026-06-09T12:53:47Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 13: sovereign-adopt Skill — Verification Report

**Phase Goal:** A user can run `sovereign-adopt` on an existing codebase and walk away with a scaffolded `.sovereign/`, retroactive ADRs for decisions already baked into the code, and a risk-prioritized gap analysis + adoption roadmap — reading and recording only, never refactoring source. Thin orchestrator driving Phase-10 `adopt scan` + Phase-6 `adr-log`.

**Verified:** 2026-06-09T12:53:47Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 3-layer archaeology: Layers 1+2 from engine `adopt scan` (JSON contract consumed — no re-walk); Layer 3 bounded deep reads from `deep_read_candidates` | ✓ VERIFIED | SKILL.md step 2 calls `sovereign-tools adopt scan`; explicit "Do not re-walk the tree yourself"; step 3 reads "only a handful" from `deep_read_candidates`; `adopt scan` CLI returns `{manifests, detected, structure, deep_read_candidates}` confirmed live |
| 2 | Scaffolds `.sovereign/`, retro-ADRs via `/adr-log` (not re-implemented), writes risk-prioritized gap analysis to `.sovereign/docs/ADOPTION.md` | ✓ VERIFIED | Steps 4–6 explicit; step 5 "offer `/adr-log`" + "Do not re-implement ADR numbering/writing"; step 6 "Write `.sovereign/docs/ADOPTION.md`" with risk-ordered gap table; `## ADOPTION.md format` block present (lines 47–64) |
| 3 | Read-only on source; greenfield+Type-2 scope; Type-3 deferred with narrower-approach recommendation | ✓ VERIFIED | "reads and records only — it never modifies the user's source code" stated explicitly (line 22); Type-3 guard in step 3; "Don't use it on a Type-3 legacy codebase" in When-to-use section |
| 4 | Thin orchestrator: single `init adopt` orient call + `@file:` guard, "Why this matters", recommendation-first, nav footer, `disable-model-invocation: true` | ✓ VERIFIED | `disable-model-invocation: true` at line 4; `init adopt` call at step 1 with `@file:` guard (lines 26–27); `## Why this matters` at line 8; `## Navigation` footer at line 66; 73 lines (>= 70) |
| 5 | `validate skills` passes for sovereign-adopt (16 skills, 0 violations); `doctor` reports 5 auto / 11 disabled, no warnings; `sovereign-adopt` absent from FAST_LANE | ✓ VERIFIED | `validate skills engine/skills/*/SKILL.md` → `{valid:true, checked:16, violations:[]}`; `sovereign.cjs init --full --cwd $TMPDIR` + `doctor` → `{total_skills:16, auto_count:5, disabled_count:11, warnings:[]}`; FAST_LANE constant = `['ubiquitous-language','grill-with-docs','handoff','sentinel','tdd']` — sovereign-adopt absent |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/skills/sovereign-adopt/SKILL.md` | Thin orchestrator, 73+ lines, disable-model-invocation, ADOPTION.md format block | ✓ VERIFIED | 73 lines; `disable-model-invocation: true`; all 7 flow steps present; `## ADOPTION.md format` block with gap table; nav footer; no v1 frontmatter |
| `engine/bin/lib/adopt.cjs` | Layers-1+2 scan contract: manifests/detected/structure/deep_read_candidates; greenfield-safe; zero-dep | ✓ VERIFIED | 277 lines; exports `cmdAdoptScan`, `scanProject`, `MAX_TREE`; requires only `node:fs`, `node:path`, `./core.cjs`; `deep_read_candidates` heuristic capped at 10; live `adopt scan` returns correct 5-key contract |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sovereign-adopt/SKILL.md` step 1 | `init adopt` orient blob | `sovereign-tools init adopt` | ✓ WIRED | Router `case 'init'`: `cmdInit(cwd, workflow='adopt', raw)`; live call returns 11-key blob including `project_root`, `detected`, `paths`, `exists` |
| `sovereign-adopt/SKILL.md` step 2 | `adopt scan` JSON contract | `sovereign-tools adopt scan` | ✓ WIRED | Router `case 'adopt'`, sub `'scan'`: `cmdAdoptScan(cwd, raw)`; live call returns `{manifests, detected, structure, deep_read_candidates}` — exact contract the skill consumes |
| `adopt.cjs` Layer-2 structure scan | gitignore-aware `git ls-files` | `execGit(cwd, ['ls-files'])` imported from `./core.cjs` | ✓ WIRED | `isGitRepo()` → `execGit` at line 93; `listFiles()` calls `execGit(cwd, ['ls-files'])` at line 105; non-git fallback bounded walk with SKIP_DIRS |
| `sovereign-adopt/SKILL.md` step 5 | `adr-log` retro-ADR recording | "offer `/adr-log`" — compose, no re-implementation | ✓ WIRED | Step 5 explicitly "offer `/adr-log`" + "Do NOT re-implement ADR numbering/writing"; no ADR logic in SKILL.md |
| `cmdAdoptScan` | `output()` + `@file:` spill | `output(scanProject(cwd), raw)` via `core.cjs` | ✓ WIRED | `adopt.cjs` line 269; no reimplemented spill; inherits core `@file:` >50KB contract |

---

### Data-Flow Trace (Level 4)

`sovereign-adopt/SKILL.md` is a prose orchestrator skill (instructions to the agent), not a UI component rendering dynamic data. `adopt.cjs` is a pure-function engine module. Level 4 data-flow trace is not applicable.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `adopt scan` returns 5-key JSON contract with `deep_read_candidates` | `node sovereign-tools.cjs adopt scan` | `{project_root, manifests, detected, structure, deep_read_candidates}` — 2 candidates returned | ✓ PASS |
| `init adopt` returns orient blob | `node sovereign-tools.cjs init adopt` | 11 top-level keys incl. `project_root`, `detected`, `paths`, `exists` | ✓ PASS |
| `validate skills` passes for all 16 skills | `node sovereign-tools.cjs validate skills engine/skills/*/SKILL.md` | `{valid:true, checked:16, violations:[]}` | ✓ PASS |
| `doctor` after `--full` install: 16 skills, 5 auto / 11 disabled, no warnings | `sovereign.cjs init --full --cwd $TMPDIR` + `sovereign-tools.cjs doctor --cwd $TMPDIR/.claude` | `{total_skills:16, auto_count:5, disabled_count:11, warnings:[]}` | ✓ PASS |
| Full engine suite still green | `cd engine && npm test` | 129/129 pass, 0 fail | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ADOPT-01 | 13-01 | 3-layer archaeology (Layer 1 config/manifest, Layer 2 structure scan, Layer 3 targeted deep reads) | ✓ SATISFIED | SKILL.md steps 1–3 implement all three layers; engine handles Layers 1+2 via `adopt scan`; Layer 3 bounded by `deep_read_candidates`; Type-3 guard present |
| ADOPT-02 | 13-01 | Scaffold `.sovereign/`, retro-ADRs via `adr-log`, gap analysis + roadmap prioritized by risk | ✓ SATISFIED | Steps 4–6 cover all three deliverables; `adr-log` composed (not reimplemented); `ADOPTION.md` format documented with risk-ordered gap table |
| M3-CC | 13-01 | Thin orchestrator, `disable-model-invocation: true`, `validate skills` clean, doctor auto budget at 5 | ✓ SATISFIED | `disable-model-invocation: true`; single `init adopt` orient call + `@file:` guard; "Why this matters" + nav footer; validate 16/16 clean; doctor 5 auto / 11 disabled; `sovereign-adopt` absent from FAST_LANE; 129 tests pass |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

Scanned `engine/skills/sovereign-adopt/SKILL.md` and `engine/bin/lib/adopt.cjs` for TODO/FIXME/placeholder/return null/empty handler patterns. None found. The `deep_read_candidates` returning an empty array on a project with no matching heuristics is an intentional safe-empty (no hit matches), not a stub.

---

### Human Verification Required

None. All five success criteria are fully verifiable programmatically. The `sovereign-adopt` skill is a prose orchestrator — its runtime behavior (the actual Layer-3 deep reads, ADR generation, and ADOPTION.md writing on a real foreign codebase) is inherently a judgment pass and out of scope for static phase verification, but the structural guarantees (thin orchestrator shape, engine delegation, read-only contract, ADOPTION.md format block) are fully confirmed by static analysis and live CLI invocations.

---

### Gaps Summary

No gaps. All five Phase 13 success criteria verified against the actual codebase.

1. **3-layer archaeology is correctly split**: the engine handles Layers 1+2 (manifest detection + gitignore-aware structure scan + `deep_read_candidates` heuristic), the skill consumes the JSON contract and does Layer-3 targeted deep reads — no tree re-walk in the skill.

2. **Outputs are specified and delegated correctly**: `.sovereign/` scaffold at step 4; retro-ADRs offered via `/adr-log` with an explicit "do not re-implement" guard; gap analysis written to `.sovereign/docs/ADOPTION.md` with a documented format block including a risk-ordered gap table and recommended closing skills.

3. **Read-only + scope guards are explicit**: "reads and records only — it never modifies the user's source code" in the skill body; Type-3 legacy detection in step 3 with narrower-approach recommendation; greenfield+Type-2 scope stated in "When to use this".

4. **Thin-orchestrator shape is correct**: `disable-model-invocation: true`, single `init adopt` orient call with `@file:` guard, "Why this matters" section, navigation footer, 73 lines — no v1 frontmatter.

5. **M3 milestone budget held across all three skills**: `validate skills` 16/16 clean (zero violations); `doctor` on `--full` install → `{total_skills:16, auto_count:5, disabled_count:11, warnings:[]}` — the listing budget is intact with all three M3 skills (bridge, import-skill, sovereign-adopt) installed and counted as disabled; 129 engine tests pass.

---

_Verified: 2026-06-09T12:53:47Z_
_Verifier: Claude (gsd-verifier)_
