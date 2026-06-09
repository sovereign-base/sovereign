---
phase: 01-engine-foundation
plan: 01
subsystem: infra
tags: [cjs, nodejs, npx, adr, templates, zero-dependency, node-test]

# Dependency graph
requires: []
provides:
  - Six locked Phase-1 ADRs under docs/adr/ (ADR-002, 009, 010, 011, 012, 013)
  - engine/ zero-dependency CJS package shell (package.json, bin stubs, VERSION, smoke test)
  - templates/sovereign/ full .sovereign/ seed tree (5 files + docs/council/external-docs/extensions dirs)
affects: [01-02, 01-03, 01-04, 01-05, sovereign-init, council]

# Tech tracking
tech-stack:
  added: [node:test, node:assert/strict]
  patterns:
    - "Zero-dependency CommonJS .cjs engine; source is the artifact (no build step)"
    - "Shebang'd bin entries with require.main===module guard + module.exports for testability"
    - "**Field:** value lines in STATE.md for field-level regex patching"
    - "MANIFEST is a derived view (regenerated on state save), never hand-edited"
    - ".gitkeep placeholders to track otherwise-empty seed directories in git"

key-files:
  created:
    - docs/adr/ADR-002-zero-dep-cjs-engine.md
    - docs/adr/ADR-009-cjs-packaging.md
    - docs/adr/ADR-010-commands-as-skill-directories.md
    - docs/adr/ADR-011-drop-v1-frontmatter.md
    - docs/adr/ADR-012-manifest-engine-derived.md
    - docs/adr/ADR-013-subagent-return-json-schema.md
    - engine/package.json
    - engine/bin/sovereign-tools.cjs
    - engine/bin/sovereign.cjs
    - engine/VERSION
    - engine/test/smoke.test.cjs
    - templates/sovereign/MANIFEST.md
    - templates/sovereign/SOVEREIGN.md
    - templates/sovereign/CONTEXT.md
    - templates/sovereign/STATE.md
    - templates/sovereign/config.json
  modified: []

key-decisions:
  - "engine/ package.json test script uses glob 'test/**/*.test.cjs' instead of bare 'test/' (Node 23 no longer resolves a bare directory as a test root)"
  - "ADR-013 minimal subagent return schema pinned: { agent, verdict?, findings[], confidence? }"
  - "config.json template seeds the six loadConfig keys (model_profile=balanced, commit_docs, parallelization, council_mode_default, resolve_model_ids, context_window)"

patterns-established:
  - "ADR file shape: header line + **Status:**/**Date:** + ## Context / ## Decision / ## Consequences"
  - "Engine bins: 'use strict', node: built-ins only, require.main guard, module.exports = { main }"

requirements-completed: [STATE-01, ENG-06]

# Metrics
duration: 4min
completed: 2026-06-08
---

# Phase 1 Plan 01: ADRs-Before-Code + Engine Scaffold + .sovereign/ Templates Summary

**Six locked architecture ADRs recorded as durable files, a zero-dependency CommonJS `engine/` package shell that loads and passes its node:test smoke test, and the complete `.sovereign/` seed template tree (five field-patchable files plus the docs/council/external-docs/extensions directory tree).**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-08T06:58:57Z
- **Completed:** 2026-06-08T07:02:51Z
- **Tasks:** 3
- **Files modified:** 20 (all created)

## Accomplishments

- Recorded the six "ADRs before code" (ADR-002, 009, 010, 011, 012, 013) as durable files under `docs/adr/`, each with Status/Context/Decision/Consequences, locking the zero-dep-CJS, CJS-packaging, skill-directory, drop-v1-frontmatter, MANIFEST-derived, and subagent-JSON decisions before any engine code was written.
- Stood up the `engine/` zero-dependency CJS package: CommonJS `package.json` (no `type:module`, `engines.node>=20`, bin map, files allowlist, test script), two shebang'd bin stubs (`sovereign-tools.cjs`, `sovereign.cjs`), `VERSION=2.0.0`, and a passing `node:test` smoke test that loads the bin via `execFileSync` and asserts the version output.
- Seeded `templates/sovereign/` with the full `.sovereign/` tree STATE-01 mandates: MANIFEST (derived header), SOVEREIGN (append-only gate log), CONTEXT (glossary), STATE (`**Field:**` lines), config.json (loadConfig keys), plus `docs/{adr,api,specs,security,infra,intersections}/`, `council/`, `external-docs/`, `extensions/` — each tracked via `.gitkeep`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the six locked ADRs under docs/adr/** - `9c1ca70` (docs)
2. **Task 2: Scaffold engine/ package** - `0202dc0` (feat)
3. **Task 3: Seed templates/sovereign/ full .sovereign/ tree** - `662688f` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified

- `docs/adr/ADR-002-zero-dep-cjs-engine.md` - Locks zero-dependency `.cjs` engine, source-is-artifact
- `docs/adr/ADR-009-cjs-packaging.md` - Locks CJS packaging (no `type:module`, `engines.node>=20`, shebang)
- `docs/adr/ADR-010-commands-as-skill-directories.md` - Locks command-as-skill-directory authoring convention
- `docs/adr/ADR-011-drop-v1-frontmatter.md` - Locks dropping v1 non-standard frontmatter for the Agent Skills spec
- `docs/adr/ADR-012-manifest-engine-derived.md` - Locks MANIFEST as engine-derived, regenerated on `state save`
- `docs/adr/ADR-013-subagent-return-json-schema.md` - Locks subagent JSON return schema (no prose)
- `engine/package.json` - CJS manifest: bin map, engines, files allowlist, test script
- `engine/bin/sovereign-tools.cjs` - Engine entry stub (version + not-implemented); real router in plans 02-04
- `engine/bin/sovereign.cjs` - User-facing launcher stub; real installer in Phase 2
- `engine/VERSION` - `2.0.0`
- `engine/test/smoke.test.cjs` - node:test smoke test proving shebang/CJS/bin load
- `engine/.gitignore` - ignores `node_modules/`
- `templates/sovereign/MANIFEST.md` - Derived-view header, status/decisions/stack quick-ref tables, v2.0.0
- `templates/sovereign/SOVEREIGN.md` - Constitution with append-only Phase Gate Log
- `templates/sovereign/CONTEXT.md` - Glossary template, Term Count 0
- `templates/sovereign/STATE.md` - Field-patchable `**Field:**` lines
- `templates/sovereign/config.json` - loadConfig keys (balanced profile)
- `templates/sovereign/{docs/{adr,api,specs,security,infra,intersections},council,external-docs,extensions}/.gitkeep` - directory placeholders

## Decisions Made

- **Test script glob.** `engine/package.json` `test` uses `node --test "test/**/*.test.cjs"` instead of the plan-suggested `node --test test/`. On Node 23 (this environment), a bare `test/` directory argument is resolved as a module path and throws `MODULE_NOT_FOUND`; the glob form discovers test files across Node 20-23. Documented as a Rule 3 blocking fix (see Deviations).
- **ADR-013 schema shape.** Pinned the minimal subagent return schema `{ agent, verdict?, findings[], confidence? }` with `agent` + `findings` required, matching the consumer needs of Phase 2/3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Engine test script could not resolve `test/` on Node 23**
- **Found during:** Task 2 (engine scaffold verification)
- **Issue:** The plan specified `"test": "node --test test/"` and verified with `cd engine && node --test test/`. On Node v23.11 (the engine's runtime here, >=20 per ADR-009), passing a bare directory `test/` to `node --test` is interpreted as a module specifier and throws `Error: Cannot find module .../engine/test` (`MODULE_NOT_FOUND`), so the smoke test never ran. This blocked the task's done-criterion ("placeholder smoke test passes").
- **Fix:** Changed the test script to `node --test "test/**/*.test.cjs"` (glob form), which discovers test files explicitly and runs across Node 20-23.
- **Files modified:** engine/package.json
- **Verification:** `npm test` exits 0 with `pass 1 / fail 0`; the plan's intent (smoke test passes) is satisfied.
- **Committed in:** 0202dc0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix preserves the plan's intent (a passing node:test smoke test proving shebang/CJS/bin load) while making the test runner work on the current Node baseline. No scope creep.

## Issues Encountered

- Two unrelated, pre-existing working-tree changes are present and were intentionally NOT touched (scope boundary): `.planning/config.json` (`_auto_chain_active` flipped to `false` by the orchestrator lifecycle) and a root `SOVEREIGN.md` showing in `git status`. Neither belongs to plan 01-01's file set.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 01-02..01-04 can now fill `engine/bin/sovereign-tools.cjs` with the real `switch` router (init, state load/save, gate open/pass, commit, model/resolve-model, validate skills) and add `bin/lib/*.cjs` helpers; the package shell, VERSION, and test harness are in place.
- The `.sovereign/` template tree is complete, so Phase 2's `sovereign-init` skill has a full seed tree to copy.
- No blockers.

## Known Stubs

These stubs are intentional and scoped to later plans/phases (documented in the plan itself):

- `engine/bin/sovereign-tools.cjs` - stub `main()` (version + `{"error":"not implemented"}`); the real router is delivered by plans 01-02..01-04.
- `engine/bin/sovereign.cjs` - stub launcher printing "installer is Phase 2"; the real `npx sovereign init` bootstrap is the `sovereign-init` SKILL in Phase 2.

## Self-Check: PASSED

All 17 created files verified present on disk; all 3 task commits (9c1ca70, 0202dc0, 662688f) verified in git history.

---
*Phase: 01-engine-foundation*
*Completed: 2026-06-08*
