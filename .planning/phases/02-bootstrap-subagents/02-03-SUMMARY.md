---
phase: 02-bootstrap-subagents
plan: 03
subsystem: engine
tags: [init, agents-guard, doctor, listing-budget, skl-07, anti-pattern-4, frontmatter]

# Dependency graph
requires:
  - phase: 02-bootstrap-subagents (02-02)
    provides: the four agent definition files (sovereign-advisor/chairman/peer-reviewer/sentinel) the agents_installed guard probes for
  - phase: 01-engine-foundation (01-05)
    provides: init <workflow> nested blob (withProjectContext wrapper) + validate.cjs walkSkillFiles/parseFrontmatter reused by doctor
provides:
  - real agents_installed/missing_agents filesystem check (no silent general-purpose fallback) — INIT guard half
  - sovereign-tools doctor — skill-listing budget check (SKL-07) enforcing AUTO_MAX≈7 + ~2000-token listing budget
  - references/listing-budget.md — the disable-model-invocation convention (feeds CONV-01, Phase 5)
affects: [03-council (hard-errors on missing advisors), 04-fast-lane-skills (sentinel guard + must stay within listing budget), 05 CONV-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-workflow required-agents map → fs.existsSync probe in .claude/agents/ then ~/.claude/agents/ (the two locations Claude Code loads subagents from; NOT --add-dir)"
    - "No silent fallback: agents_installed false + missing_agents populated so orchestrators hard-error before dispatching into a void (ARCHITECTURE anti-pattern #4)"
    - "Budget check counts ONLY auto-triggerable skills; disable-model-invocation:true skills cost nothing in the listing"
    - "doctor reuses validate.cjs walkSkillFiles + parseFrontmatter (exported, not duplicated) — zero-dep held"

key-files:
  created:
    - engine/bin/lib/doctor.cjs
    - engine/test/doctor.test.cjs
    - engine/references/listing-budget.md
  modified:
    - engine/bin/lib/init.cjs
    - engine/bin/sovereign-tools.cjs
    - engine/bin/lib/validate.cjs
    - engine/test/init.test.cjs
    - engine/package.json

key-decisions:
  - "agents probed in EITHER project .claude/agents/ OR user ~/.claude/agents/ (found in either = present); --add-dir excluded per STACK.md"
  - "doctor thresholds: AUTO_MAX=7, TOKEN_BUDGET=2000 (~1% of 200k), listing estimate = ceil((name+desc chars)/4) — CONTEXT discretion defaults"
  - "convention reference placed at engine/references/listing-budget.md (not repo root) + added 'references' to package files[] so it ships and matches SOVEREIGN.md §7 layout"

patterns-established:
  - "Engine commands that gate (validate, doctor) write the JSON report FIRST then exit(1) on failure — callers always see the report"

requirements-completed: [SKL-07]

# Metrics
duration: 5min
completed: 2026-06-08
---

# Phase 2 Plan 03: Real Agents Guard + Listing-Budget Doctor Summary

**Replaced the Phase-1 hardcoded `agents_installed: true` stub with a real per-workflow filesystem check (no silent general-purpose fallback), and added `sovereign-tools doctor` enforcing the ~7-auto-triggerable / ~1%-token skill-listing budget with the `disable-model-invocation` convention documented for Phases 3-4 to satisfy.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-08T17:59:15Z
- **Completed:** 2026-06-08T18:03:55Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 9 (3 created + 6 modified)

## Accomplishments

- **Real agents_installed check (init.cjs):** added `requiredAgentsFor(workflow)` (council → advisor/chairman/peer-reviewer; sentinel → sentinel; else []) and `checkAgents(cwd, workflow)` which probes `<name>.md` in project `.claude/agents/` then `~/.claude/agents/`. `withProjectContext` now threads the workflow and merges the real result, replacing the hardcoded `{true, []}` stub and its `// TODO(Phase 2)`. No silent fallback — `agents_installed` is false and `missing_agents` lists the absent names so an orchestrator can hard-error (ARCHITECTURE anti-pattern #4 prevented).
- **doctor budget check (doctor.cjs):** `checkBudget(cwd)` enumerates SKILL.md files under `.claude/skills/` + `skills/`, counts the auto-triggerable ones (those without `disable-model-invocation: true`), sums name+description chars, estimates listing tokens (chars/4), and warns past AUTO_MAX=7 or TOKEN_BUDGET=2000. Zero skills → clean (`ok:true`, exit 0). Wired `case 'doctor'` into the router + usage string; `cmdDoctor` exits 1 only on a budget breach so CI/install can gate.
- **Convention reference:** `engine/references/listing-budget.md` documents the `disable-model-invocation: true` rule for orchestrator-only/side-effecting skills (feeds CONV-01). Added `references` to package `files[]` so it ships.
- Full engine suite: **76 tests pass** (was 66; +5 doctor, +5 init agents tests). Zero dependencies held. `npm pack --dry-run` confirms `references/listing-budget.md` ships.

## Task Commits

1. **Task 1 RED: failing tests for real agents check** - `6b5757a` (test)
2. **Task 1 GREEN: real agents_installed check in init.cjs** - `dd6b821` (feat)
3. **Task 2 RED: failing tests for doctor budget check** - `77d6c3a` (test)
4. **Task 2 GREEN: doctor command + router wiring + convention reference** - `e0bd72a` (feat)

## Files Created/Modified

- `engine/bin/lib/init.cjs` - requiredAgentsFor + checkAgents; withProjectContext(cwd, workflow, blob) merges real check; stub + TODO removed; exports extended
- `engine/bin/lib/doctor.cjs` (created) - checkBudget + cmdDoctor + AUTO_MAX/TOKEN_BUDGET consts
- `engine/bin/sovereign-tools.cjs` - require cmdDoctor, `case 'doctor'`, usage string updated
- `engine/bin/lib/validate.cjs` - export walkSkillFiles + parseFrontmatter for reuse by doctor
- `engine/test/init.test.cjs` - Tests A/B/C + requiredAgentsFor/checkAgents unit tests + seedAgents helper; seeded council fixture so the existing one-blob test still asserts agents_installed true
- `engine/test/doctor.test.cjs` (created) - Tests 1-3 + CLI exit-0/exit-1 integration
- `engine/references/listing-budget.md` (created) - the disable-model-invocation convention
- `engine/package.json` - added `references` to files[]

## Decisions Made

- Agents counted present if found in EITHER project `.claude/agents/` OR user `~/.claude/agents/`; `--add-dir` excluded (Claude Code does not load subagents from it, per STACK.md).
- doctor heuristic defaults (CONTEXT left to Claude's discretion): AUTO_MAX=7, TOKEN_BUDGET=2000 (~1% of a 200k window), listing estimate = ceil(chars/4) over auto-triggerable name+description.
- Convention reference shipped from `engine/references/` (matching SOVEREIGN.md §7 layout) rather than repo root, so it travels in the npm package.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Convention reference location moved to engine/references/ + package files[]**
- **Found during:** Task 2 (action step 4)
- **Issue:** The plan suggested `references/listing-budget.md` at repo root. The package ships from `engine/` (its `files[]` allowlist), so a repo-root file would NOT travel with `npx sovereign` and the convention would be lost to end users. SOVEREIGN.md §7 also specifies a `references/` directory alongside `agents/`/`templates/`.
- **Fix:** Created the reference at `engine/references/listing-budget.md` and added `references` to `engine/package.json` files[]. Verified via `npm pack --dry-run`.
- **Files modified:** engine/references/listing-budget.md, engine/package.json
- **Committed in:** `e0bd72a` (Task 2 commit)

**2. [Rule 3 - Blocking] Existing one-blob init test seeded with council agents**
- **Found during:** Task 1 (the real check makes council on a no-agents fixture report false)
- **Issue:** The pre-existing `init council returns the nested one-blob contract` test asserted `agents_installed === true` against `mkSeededProject` (which has no `.claude/agents/`). Once the check became real, that assertion would fail.
- **Fix:** Added a `seedAgents` helper and seeded the three council agents into that test's fixture so it still legitimately asserts true. The two CLI integration tests assert only models/version/exists (not agents), so they were left untouched.
- **Files modified:** engine/test/init.test.cjs
- **Committed in:** `6b5757a` (Task 1 RED commit)

---

**Total deviations:** 2 auto-fixed (both blocking)
**Impact on plan:** Both are correctness-preserving adjustments; no scope change. The agents check and doctor behavior are exactly as specified.

## Issues Encountered

- None beyond the two deviations above. validate.cjs already had the exact walk + frontmatter helpers needed — exporting them avoided duplicating ~50 lines and kept the zero-dep property intact.

## Known Stubs

None. The `disabled_count`/`desc_chars`/`listing_token_estimate` fields are fully computed, not placeholders. The doctor reports clean on the current zero-skill repo by design (the mechanism exists for Phases 3-4 to satisfy, per CONTEXT) — that is intended, not a stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 Council can now branch on `init council`'s real `agents_installed`/`missing_agents` and hard-error before dispatching advisors — the anti-pattern-4 guard is live.
- Phase 4 fast-lane `sentinel` skill gets the same guard for `sovereign-sentinel`.
- Phases 3-4 must run `sovereign-tools doctor` after adding skills to stay within the listing budget; orchestrator-only skills set `disable-model-invocation: true` per references/listing-budget.md.
- The blocker note in STATE.md ("re-check via /doctor after Phases 2 and 4") is now actionable — the doctor command exists.

## Self-Check: PASSED

All 3 created files exist on disk (doctor.cjs, doctor.test.cjs, references/listing-budget.md); all 4 task commits (6b5757a, dd6b821, 77d6c3a, e0bd72a) present in git history; full suite 76/76 green; doctor exits 0 on zero skills; TODO(Phase 2) removed from init.cjs.

---
*Phase: 02-bootstrap-subagents*
*Completed: 2026-06-08*
