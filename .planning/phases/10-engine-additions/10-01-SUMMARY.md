---
phase: 10-engine-additions
plan: 01
subsystem: engine
tags: [bridge, sha256, node-crypto, hashing, registry, staleness, zero-dep]

# Dependency graph
requires:
  - phase: M1 (engine foundation)
    provides: core.cjs output()/@file: spill + safeReadFile, node:test patterns, zero-dep .cjs discipline
provides:
  - "engine/bin/lib/bridge.cjs — cmdBridgeHash, cmdBridgeCheck, pure hashSources + hashFile helpers"
  - "SHA-256 per-file + combined hashing (node:crypto) over a sorted source set"
  - "registry diff against .sovereign/bridges/registry.json → { fresh, changed } (greenfield-safe)"
  - "engine/test/bridge.test.cjs — 10-case node:test suite"
affects: [11-bridge-skill, bridge, BRIDGE-02, staleness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure deterministic helper (hashSources) separated from cmd* I/O wrappers"
    - "Greenfield-safe probe: missing/unparseable registry → safe value, never throws"
    - "Hash file BYTES not utf-8 for encoding-stable digests; sort by rel path for order-independence"

key-files:
  created:
    - engine/bin/lib/bridge.cjs
    - engine/test/bridge.test.cjs
  modified: []

key-decisions:
  - "Combined hash = sha256 of sorted `path:sha256` lines joined by \\n (fast single-value equality, order-independent)"
  - "cmdBridgeCheck flags both byte-changed AND now-missing recorded sources as changed[]"
  - "bridge check with no id defaults to the single/first registry entry; returns the resolved id in output"

patterns-established:
  - "Engine owns deterministic hashing/diff; Phase-11 skill owns BRIDGE.md prose (engine-first split)"

requirements-completed: [ENG-08]

# Metrics
duration: 3min
completed: 2026-06-09
---

# Phase 10 Plan 01: Bridge Hashing Substrate Summary

**Zero-dependency SHA-256 per-file + combined hashing (`node:crypto`) and a greenfield-safe `.sovereign/bridges/registry.json` diff (`fresh` / `changed[]`) — the BRIDGE-02 staleness substrate the Phase-11 bridge skill wraps.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-09T08:56:21Z
- **Completed:** 2026-06-09T08:58:47Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- `hashSources(cwd, relPaths)` — filters to existing files, sorts by rel path, hashes bytes via `crypto.createHash('sha256')`, returns `{ entries:[{path,sha256}], combined }`. Order-independent combined hash; empty/missing list → stable `sha256('')`, never throws.
- `cmdBridgeHash` — emits `{ files:[{path,sha256}], combined }` per the CONTEXT decision.
- `cmdBridgeCheck` — reads the registry via `safeReadFile`+`JSON.parse` in try/catch; missing/unparseable → `{ fresh:true, changed:[], reason:'no_registry' }`; matching combined → `{ fresh:true, changed:[] }`; otherwise a per-file diff naming changed/now-missing paths.
- `engine/test/bridge.test.cjs` — 10 `node:test` cases (order-stability, byte-change detection, output shape, greenfield no_registry incl. unparseable JSON, match, mutation, missing-source, default-id). Full engine suite stays green at 87 tests; `dependencies` still `{}`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement bridge.cjs hashing + registry diff** - `a0925df` (feat) — TDD: a RED anchor test was authored first (module-not-found failure confirmed), then bridge.cjs made it GREEN.
2. **Task 2: Write bridge.test.cjs node:test suite** - `812f1ad` (test) — replaced the RED anchor with the full six+ case suite.

**Plan metadata:** (this commit)

## Files Created/Modified
- `engine/bin/lib/bridge.cjs` - SHA-256 hashing + registry-diff substrate (`cmdBridgeHash`, `cmdBridgeCheck`, pure `hashSources`/`hashFile`); requires only `node:crypto`/`node:fs`/`node:path` + `./core.cjs` `output`/`safeReadFile`.
- `engine/test/bridge.test.cjs` - 10-case `node:test` + `node:assert/strict` suite over real tmp dirs with fd-1 capture.

## Decisions Made
- Combined hash derived from the sorted `path:sha256` lines (not raw concatenation of digests) — keeps it human-traceable and order-independent.
- `cmdBridgeCheck` treats a recorded source that no longer exists as `changed` (it can't be re-hashed to match), matching v1's "name the specific changes" intent.
- Default to the single/first registry entry when no `--id` is passed, and echo the resolved `id` in the output for the skill's logging.

## Deviations from Plan

None - plan executed exactly as written. (Task 1 was `tdd="true"`: RED anchor test → GREEN implementation; the anchor was then superseded by Task 2's full suite, as the plan structured it.)

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The BRIDGE-02 engine substrate is implemented and tested; ready to be wrapped by the Phase-11 bridge skill (thin orchestrator).
- Still pending in Phase 10 (later plans): `extension.cjs`, `adopt.cjs`, `scanSkillContent()` in `security.cjs`, the router cases in `sovereign-tools.cjs`, and the `init bridge|adopt|extension` workflows.

## Self-Check: PASSED

- FOUND: engine/bin/lib/bridge.cjs
- FOUND: engine/test/bridge.test.cjs
- FOUND: .planning/phases/10-engine-additions/10-01-SUMMARY.md
- FOUND commit: a0925df (feat — Task 1)
- FOUND commit: 812f1ad (test — Task 2)

---
*Phase: 10-engine-additions*
*Completed: 2026-06-09*
