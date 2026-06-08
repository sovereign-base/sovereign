---
phase: 02-bootstrap-subagents
plan: 02
subsystem: agents
tags: [subagents, agent-skills, json-schema, council, sentinel, frontmatter]

# Dependency graph
requires:
  - phase: 01-engine-foundation
    provides: model-profiles table (advisor/chairman/peer_reviewer/sentinel → model aliases) consumed via `model: inherit`
  - phase: 02-bootstrap-subagents (02-01)
    provides: installer that copies packaged agents/ into .claude/agents/; "agents" already in package files[]
provides:
  - sovereign-advisor — parameterized lens-shell advisor with fixed JSON return schema
  - sovereign-chairman — synthesis-to-verdict agent with fixed JSON return schema
  - sovereign-peer-reviewer — anonymous A-E cross-review agent with fixed JSON return schema
  - sovereign-sentinel — native-tier post-phase reviewer with fixed JSON return schema
  - structural test (agents.test.cjs) enforcing frontmatter + schema + files-allowlist contract
affects: [03-council, 04-fast-lane-skills, agents_installed guard (02-03)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subagent shells parameterized by dispatch-injected <lens>/<context> (no persona content in the file)"
    - "Every reasoning subagent returns validated JSON against a pinned ok:boolean schema, 'JSON only, no prose'"
    - "Path-passing discipline: agents read only orchestrator-handed paths; never invent context; no AskUserQuestion"

key-files:
  created:
    - engine/agents/sovereign-advisor.md
    - engine/agents/sovereign-chairman.md
    - engine/agents/sovereign-peer-reviewer.md
    - engine/agents/sovereign-sentinel.md
    - engine/test/agents.test.cjs
  modified: []

key-decisions:
  - "planner/researcher DEFERRED (no M1 caller) — per 02-CONTEXT deliberate scope tightening"
  - "All four agents set model: inherit so the engine resolves the real model via model-profiles at dispatch"
  - "Schema 'ok' field documented as literal 'ok:' field-rule line so both the plan verify command and agents.test.cjs detect it"

patterns-established:
  - "Agent definition = real Agent Skills frontmatter (name/description/tools/model/color) + role + parameterization + discipline + return_schema (JSON example + field rules + 'JSON only, no prose')"

requirements-completed: [INIT-01]

# Metrics
duration: 6min
completed: 2026-06-08
---

# Phase 2 Plan 02: M1-Dispatched Subagent Definitions Summary

**The four reasoning subagents Council and Sentinel dispatch (advisor lens-shell, chairman, peer-reviewer, sentinel) defined as real Agent Skills files with pinned ok:boolean JSON return schemas, shipped via the package agents/ allowlist.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-08T17:54:37Z
- **Completed:** 2026-06-08T18:00:00Z
- **Tasks:** 2
- **Files modified:** 5 (4 created agents + 1 created test)

## Accomplishments
- Defined all four M1-dispatched subagents as definition files with real Agent Skills subagent frontmatter (no v1 fields, no reserved words in names).
- Each agent body pins a fixed JSON return schema containing an `ok: boolean` field plus the literal "output JSON only, no prose" instruction.
- sovereign-advisor authored as a parameterized SHELL: the lens persona and context paths are injected at dispatch (Phase 3 Council owns the 5 lenses) — no lens content baked in.
- Added engine/test/agents.test.cjs: validates frontmatter (name pattern, reserved-word ban, description present), schema marker, JSON-only marker, and that package files[] ships agents/. Full suite: 66 tests pass. `npm pack --dry-run` confirms all four agents ship.

## Task Commits

1. **Task 1: Author the 4 subagent definition files** - `5c688f7` (feat)
2. **Task 2: Structural test + verify files allowlist** - `bebfeb9` (test)

## Files Created/Modified
- `engine/agents/sovereign-advisor.md` - parameterized lens-shell advisor; schema: {ok, lens, position, confidence, key_points, risks, recommendation}
- `engine/agents/sovereign-chairman.md` - synthesis-to-verdict; schema: {ok, verdict, synthesis, conditions, dissents_addressed, confidence}
- `engine/agents/sovereign-peer-reviewer.md` - anonymous A-E cross-review; schema: {ok, reviews[], cross_cutting_concerns}
- `engine/agents/sovereign-sentinel.md` - native-tier post-phase reviewer; schema: {ok, verdict, unverified_markers[], findings[]}
- `engine/test/agents.test.cjs` - structural test enforcing the frontmatter + schema + allowlist contract

## Decisions Made
- model: inherit on all four — real model resolution happens at dispatch via the engine's model-profiles table (no hardcoded tier in the agent file).
- planner/researcher intentionally NOT created (no M1 caller; deferred per 02-CONTEXT). INIT/SKL requirements remain satisfied — all four M1-dispatched agents are defined.
- Least-privilege tools: advisor/chairman/peer-reviewer get Read/Grep/Glob; sentinel adds Bash for read-only scans of changed files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Schema `ok` field rendered as literal `ok:` marker**
- **Found during:** Task 1 (verification)
- **Issue:** The Task 1 `<automated>` verify (and the Task 2 agents.test.cjs spec) detect the schema via a literal `ok:` token. The JSON code-fence example uses `"ok": true`, and the initial field-rule prose used `` `ok` (boolean): `` — neither matches `ok:`, so verification failed.
- **Fix:** Changed each agent's field-rules line to `` - `ok: boolean` — … ``, producing the `ok:` token the verify command and test require, while keeping the JSON example intact.
- **Files modified:** all four engine/agents/*.md
- **Verification:** Task 1 automated check prints OK; agents.test.cjs `/ok:/` assertion passes for all four.
- **Committed in:** `5c688f7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Cosmetic schema-marker alignment to satisfy the documented verification contract. No scope change; schemas are exactly as specified in the plan.

## Issues Encountered
- engine/package.json already contained "agents" (and "skills") in files[] from plan 02-01. Per the objective's idempotency note, left as-is (no duplicate). Task 2 reduced to creating the structural test.

## Known Stubs
None. The sentinel agent references the `SOVEREIGN:UNVERIFIED` marker whose full SPEC is defined in Phase 4 (CONV-03); the agent declares the consumer shape now (documented intentional forward reference, not a stub).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The four M1-dispatched agents now exist with stable return contracts, so plan 02-03's `agents_installed`/`missing_agents` guard can check for them, and Phase 3 Council / Phase 4 Sentinel can dispatch against fixed schemas.
- Agents ship via the package files allowlist; the 02-01 installer copies them into `.claude/agents/`.

## Self-Check: PASSED

All 6 claimed files exist on disk; both task commits (5c688f7, bebfeb9) present in git history.

---
*Phase: 02-bootstrap-subagents*
*Completed: 2026-06-08*
