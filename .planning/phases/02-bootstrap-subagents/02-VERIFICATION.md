---
phase: 02-bootstrap-subagents
verified: 2026-06-08T18:12:07Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 2: Bootstrap + Subagent Definitions Verification Report

**Phase Goal:** A user can install SOVEREIGN and scaffold `.sovereign/` in one command (`npx sovereign init`, --quick/--full, idempotent + version-aware), and the M1-dispatched reasoning subagents are defined with fixed JSON return schemas; the engine's agents_installed/missing_agents check is real (no stub, no silent fallback); a listing-budget mechanism (`doctor`) + disable-model-invocation convention are in place.
**Verified:** 2026-06-08T18:12:07Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npx sovereign init` installs skills+agents into `.claude/` and scaffolds `.sovereign/` from templates | VERIFIED | `sovereign.cjs` routes `init` → `cmdInstall`; live run in tmpdir shows `status:installed`, 4 agents in `.claude/agents/`, full `.sovereign/` tree from templates |
| 2 | `--quick` filters to Fast Lane 5; `--full`/bare `init` installs all; re-run is idempotent and version-aware | VERIFIED | `mode:quick` confirmed in live output; `up_to_date` returned on same-version re-run; user-written file preserved; `status:updated` on old stamp (1.0.0→2.0.0) |
| 3 | The 4 M1-dispatched subagents (advisor/chairman/peer-reviewer/sentinel) are defined with fixed JSON schemas + `ok:boolean`; `planner`/`researcher` correctly ABSENT | VERIFIED | All four `.md` files present in `engine/agents/`; each has frontmatter (name/description/tools/model/color), `ok:` marker, "output JSON only, no prose"; no planner/researcher files exist |
| 4 | `agents_installed`/`missing_agents` is a real filesystem check (no hardcoded true, no TODO); `sovereign-tools doctor` exists and exits 0 on zero skills; `references/listing-budget.md` documents the `disable-model-invocation` convention | VERIFIED | `init council` on empty dir returns `agents_installed:false` with all 3 missing names; `doctor` exits 0 on clean project; router wires `case 'doctor'`; `references/listing-budget.md` present with convention documented |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/bin/sovereign.cjs` | Real installer routing `init` to `cmdInstall` | VERIFIED | 58 lines; routes `init [--quick\|--full\|--global]` → `cmdInstall(process.cwd(), flags, false)`; `--version` prints banner; unknown command → `error()` non-zero exit |
| `engine/bin/lib/install.cjs` | `runInstall()` + `cmdInstall()` + `FAST_LANE` exports | VERIFIED | 239 lines; copy-not-symlink via `fs.cpSync`; scaffolds `.sovereign/` only when absent; version stamp at `.sovereign/.sovereign-version`; `FAST_LANE = ['ubiquitous-language','grill-with-docs','handoff','sentinel','tdd']` |
| `engine/agents/sovereign-advisor.md` | Parameterized shell with fixed JSON schema | VERIFIED | Real Agent Skills frontmatter; name=`sovereign-advisor` (17 chars, lowercase-hyphen, no reserved words); `ok: boolean` field; "output JSON only, no prose"; no v1 fields |
| `engine/agents/sovereign-chairman.md` | Synthesis-to-verdict agent with fixed JSON schema | VERIFIED | `ok`, `verdict`, `synthesis`, `conditions`, `dissents_addressed`, `confidence`; JSON-only instruction present |
| `engine/agents/sovereign-peer-reviewer.md` | Anonymous A-E cross-review agent | VERIFIED | `ok`, `reviews[]`, `cross_cutting_concerns`; anonymity preserved discipline documented |
| `engine/agents/sovereign-sentinel.md` | Native-tier post-phase reviewer | VERIFIED | `ok`, `verdict`, `unverified_markers[]`, `findings[]`; SOVEREIGN:UNVERIFIED forward reference noted as intentional |
| `engine/bin/lib/init.cjs` | Real `checkAgents()` + `requiredAgentsFor()` (no hardcoded stub) | VERIFIED | `REQUIRED_AGENTS` map (council→3 agents, sentinel→1, sovereign-init→[]); `checkAgents()` probes `.claude/agents/<name>.md` then `~/.claude/agents/<name>.md`; no hardcoded true; no TODO(Phase 2) |
| `engine/bin/lib/doctor.cjs` | `checkBudget()` + `cmdDoctor()` with AUTO_MAX=7, TOKEN_BUDGET=2000 | VERIFIED | Full implementation; counts auto-triggerable vs disabled-count; estimates listing tokens (chars/4); exits 1 on breach; exits 0 on clean |
| `engine/references/listing-budget.md` | `disable-model-invocation` convention documented | VERIFIED | Documents ~1%/~2000-token budget, the convention for orchestrator-only skills, and `sovereign-tools doctor` enforcement |
| `engine/package.json` | `files[]` includes agents, skills, references | VERIFIED | `"files": ["bin","templates","agents","skills","references","VERSION"]`; `npm pack --dry-run` confirms all four agents + references/listing-budget.md ship |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sovereign.cjs` | `install.cjs:cmdInstall` | `require('./lib/install.cjs')` | WIRED | Line 27 requires, line 42 calls `cmdInstall(process.cwd(), flags, false)` |
| `sovereign-tools.cjs` | `doctor.cjs:cmdDoctor` | `require('./lib/doctor.cjs')` | WIRED | Line 31 requires, line 344 calls `cmdDoctor(cwd, raw)` in `case 'doctor'` |
| `init.cjs:withProjectContext` | `checkAgents()` | `Object.assign(blob, checkAgents(cwd, workflow))` | WIRED | Line 218 merges real check result into every init blob |
| `doctor.cjs` | `validate.cjs:walkSkillFiles,parseFrontmatter` | `require('./validate.cjs')` | WIRED | Line 33 requires; `checkBudget()` calls both to enumerate skills |
| `install.cjs` | `engine/agents/*.md` | `fs.copyFileSync` of each `<name>.md` | WIRED | `listAgentNames(pkgAgentsDir)` finds the 4 agents; loop copies each to `<installRoot>/agents/<name>.md` |

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers a CLI tool and agent definition files, not components that render dynamic data. The data flows are: (a) installer copies files from package to project directory (verified by live run), (b) `checkAgents()` reads the filesystem and returns a real boolean (verified by `init council` on empty dir returning `false` + missing names), (c) `checkBudget()` walks SKILL.md files and computes real counts (verified by `doctor` returning `total_skills:0` on empty project).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Fresh install scaffolds .sovereign + copies agents | `cd tmpdir && node sovereign.cjs init` | `status:installed`, 4 agents in `.claude/agents/`, `.sovereign/` with CONTEXT.md/MANIFEST.md/STATE.md/config.json/etc., stamp=2.0.0 | PASS |
| Idempotent re-run preserves user content | Re-run with existing stamp (same version) | `status:up_to_date`, `sovereign_scaffolded:false`, user-written file survives | PASS |
| Version-aware update (stale stamp) | Re-run with `.sovereign/.sovereign-version`=1.0.0 | `status:updated`, stamp rewritten to 2.0.0 | PASS |
| `--quick` selects Fast Lane mode | `sovereign.cjs init --quick` | `mode:quick` in result; no non-Fast-Lane skills (none yet) | PASS |
| `init council` on project with no agents returns false + missing list | `sovereign-tools init council` in empty tmpdir | `agents_installed:false`, `missing_agents:['sovereign-advisor','sovereign-chairman','sovereign-peer-reviewer']` | PASS |
| `init council` with agents installed returns true | Copy agents to `.claude/agents/`, run `init council` | `agents_installed:true`, `missing_agents:[]` | PASS |
| `doctor` exits 0 on zero skills | `sovereign-tools doctor` in empty dir | `ok:true`, `total_skills:0`, `warnings:[]`, exit 0 | PASS |
| `doctor` exits 1 when AUTO_MAX (7) exceeded | 8 auto-triggerable skills (test suite) | `ok:false`, breach warning, exit 1 | PASS (covered by test suite, 76/76 pass) |
| Full test suite passes | `cd engine && npm test` | 76/76 tests pass, 0 fail | PASS |
| `npm pack --dry-run` ships agents + references | `npm pack --dry-run` | All 4 agent .md files + references/listing-budget.md present in tarball manifest | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INIT-01 | 02-01, 02-02 | `npx sovereign init` installs skills/agents + scaffolds `.sovereign/` | SATISFIED | `sovereign.cjs` routes to `cmdInstall`; live install confirmed |
| INIT-02 | 02-01 | `--quick` = Fast Lane 5; `--full`/bare = full M1 set | SATISFIED | `FAST_LANE` const in `install.cjs`; mode routing in `cmdInstall`; test suite 9/9 |
| INIT-03 | 02-01 | Re-run is idempotent and version-aware | SATISFIED | `up_to_date`/`updated` paths tested; user content preserved |
| SKL-07 | 02-03 | Orchestrator-only skills set `disable-model-invocation`; `/doctor`-style check enforces budget | SATISFIED | `doctor.cjs` + router wiring + `references/listing-budget.md` all present and tested |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | — |

No anti-patterns found. No TODOs, hardcoded stubs, empty implementations, or placeholder content in any Phase 2 artifact. The only stub present (`skills_copied: []`) is documented-intentional: no skill dirs ship until Phases 3-4.

### Human Verification Required

None. All Phase 2 deliverables are CLI tools + agent definition files with deterministic, programmatically-verifiable behavior. No UI, real-time behavior, or external service integration introduced in this phase.

### Gaps Summary

No gaps. All four success criteria from ROADMAP.md are satisfied by code that exists, is substantive, is wired, and produces correct runtime behavior as confirmed by live spot-checks and the 76-test suite.

**Key confirmations:**
- `sovereign.cjs` is a real installer, not a stub — it was a Phase 1 stub that was replaced in plan 02-01.
- `agents_installed` in `init.cjs` is a real filesystem probe — the `// TODO(Phase 2)` and hardcoded `true` were removed and replaced with `checkAgents()`.
- `planner`/`researcher` are correctly absent — deliberate scope tightening per 02-CONTEXT.
- `package.json` ships `agents`, `skills`, and `references` in `files[]` — confirmed by `npm pack --dry-run`.

---

_Verified: 2026-06-08T18:12:07Z_
_Verifier: Claude (gsd-verifier)_
