---
phase: 01-engine-foundation
plan: 02
subsystem: engine
tags: [cjs, router, output-spill, loadConfig, model-profiles, extractField, node-test]

# Dependency graph
requires:
  - "01-01: engine/ package shell, VERSION (2.0.0), bin stubs, node:test harness"
provides:
  - "engine/bin/lib/core.cjs — output() @file: 50KB spill, error(), safeReadFile(), findProjectRoot(.sovereign/), loadConfig() 3-layer deep merge, deepMerge()"
  - "engine/bin/lib/model-profiles.cjs — MODEL_PROFILES table (reasoning agents = opus under quality), VALID_PROFILES, getAgentToModelMapForProfile()"
  - "engine/bin/sovereign-tools.cjs — real main()/runCommand router with --cwd/--raw/--pick, parseNamedArgs, parseMultiwordArg, extractField (dot+bracket+negative-index), marked TODO insertion points for plans 03/04"
  - "engine/test/core.test.cjs — extractField, loadConfig defaults+override+bad-json, output() inline/@file: spill"
affects: [01-03, 01-04, 01-05, sovereign-init, council]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "output() spills JSON payloads >50KB to os.tmpdir()/sovereign-<ts>.json, emitting @file:<path> (survives Claude Code ~50KB Bash buffer)"
    - "loadConfig deep-merges defaults <- ~/.sovereign/defaults.json <- .sovereign/config.json; unparseable/missing layers are silently skipped (never throws)"
    - "--pick monkeypatches fs.writeSync(1) to capture stdout, reads @file: spill back, then extractField + raw scalar emit"
    - "extractField dot + bracket + negative-index path resolution (lifted verbatim from GSD)"
    - "MODEL_PROFILES is the single source of truth; VALID_PROFILES derived from it so they cannot drift"
    - "Router leaves marked // TODO(plan 03)/(plan 04) switch insertion points for downstream plans"

key-files:
  created:
    - engine/bin/lib/core.cjs
    - engine/bin/lib/model-profiles.cjs
    - engine/test/core.test.cjs
  modified:
    - engine/bin/sovereign-tools.cjs

key-decisions:
  - "Test runner uses the glob form (node --test \"test/**/*.test.cjs\" via npm test), not the plan's bare `node --test test/` — bare-directory args throw MODULE_NOT_FOUND on Node 23 (continuation of the 01-01 deviation, not a new one)"
  - "output() with raw scalar (e.g. version) means `version --pick version` falls through the interceptor's JSON.parse to emit the captured raw '2.0.0' — correct result, no special-casing needed"
  - "deepMerge treats arrays as scalars (b's array wins wholesale), matching the documented loadConfig contract"

requirements-completed: [ENG-06]

# Metrics
duration: 4min
completed: 2026-06-08
---

# Phase 1 Plan 02: Engine Layer A — Router, output() spill, loadConfig, model-profiles Summary

**The deterministic substrate every command plugs into: a zero-dependency `main()`/`runCommand` switch router with `--cwd`/`--raw`/`--pick` (dot+bracket `extractField`), the mandatory `output()` 50KB `@file:` tmpfile spill, a 3-layer deep-merge `loadConfig`, and the SOVEREIGN `model-profiles` table (reasoning agents = opus under quality) — all lifted from GSD's proven shapes and covered by a passing `node:test` suite.**

## Performance

- **Duration:** ~4 min
- **Tasks:** 4
- **Files:** 3 created, 1 modified

## Accomplishments

- **core.cjs** — `output(result, raw, rawValue)` writes JSON via `fs.writeSync(1, ...)` and spills any payload >50000 chars to `os.tmpdir()/sovereign-<ts>.json`, emitting `@file:<path>` instead (the non-optional Bash-buffer guard). Also `error()` (stderr + exit 1), `safeReadFile()`, `findProjectRoot()` (walk up to nearest `.sovereign/`), and `loadConfig()` deep-merging hardcoded defaults <- optional `~/.sovereign/defaults.json` <- project `.sovereign/config.json`, skipping unparseable/missing layers without throwing.
- **model-profiles.cjs** — `MODEL_PROFILES` keyed by SOVEREIGN agent names (`advisor`/`chairman`/`peer_reviewer`/`planner`/`researcher`/`synthesizer`/`sentinel`/`verifier`), with advisor/chairman/peer_reviewer/planner = `opus` under `quality` per the CONTEXT.md model decision. `VALID_PROFILES` is derived from the table (`['quality','balanced','budget']`) and `getAgentToModelMapForProfile()` returns the `{agent: model}` map plan 03's resolve-model will consume.
- **sovereign-tools.cjs router** — replaced the stub with a real `async main()`/`runCommand` switch: parses `--cwd` (validates it is a directory or `error()`s), `--raw`, and `--pick` (intercepts stdout, reads `@file:` spill back, applies `extractField`, emits raw scalar); resolves project root via `findProjectRoot`; ports `parseNamedArgs`, `parseMultiwordArg`, and `extractField` (dot + bracket + negative index) verbatim from GSD. Only `version` is implemented; all other commands return `{command, status: 'not_implemented'}`. Marked `// TODO(plan 03)` and `// TODO(plan 04)` switch insertion points are in place.
- **core.test.cjs** — 6 tests covering `extractField` (dot/bracket/negative/missing), `loadConfig` (defaults-only, project override with defaults preserved, bad-json skip), and `output()` (inline JSON <50KB, `>50KB` `@file:` spill that round-trips a 60KB blob through the tmpfile). Full suite (smoke + core) = 7 passing, exit 0.

## Task Commits

1. **Task 1: core.cjs** — `24d47cb` (feat)
2. **Task 2: model-profiles.cjs** — `d44509d` (feat)
3. **Task 3: sovereign-tools.cjs router** — `a71a5b7` (feat)
4. **Task 4: core.test.cjs** — `0eb3e0f` (test)

## Files Created/Modified

- `engine/bin/lib/core.cjs` — output() @file: spill, error(), safeReadFile(), findProjectRoot(), loadConfig() deep-merge, deepMerge()
- `engine/bin/lib/model-profiles.cjs` — MODEL_PROFILES + VALID_PROFILES + getAgentToModelMapForProfile()
- `engine/bin/sovereign-tools.cjs` — real router (was stub): main()/runCommand, arg helpers, extractField, --cwd/--raw/--pick
- `engine/test/core.test.cjs` — unit suite for the layer-A primitives

## Decisions Made

- **Test runner glob form.** Used `node --test "test/**/*.test.cjs"` (the `npm test` script established in 01-01) rather than the plan's `node --test test/`. A bare `test/` directory arg is interpreted as a module specifier on Node 23 and throws `MODULE_NOT_FOUND`. This is a continuation of the 01-01 deviation, not a new one — `npm test` exits 0 and the plan's intent (suite passes) is satisfied.
- **`version --pick version` correctness.** The `version` case calls `output({version}, true, version)`, writing the raw scalar `2.0.0`. The `--pick` interceptor's `JSON.parse` fails on that raw string and falls through to emitting the captured value — which is already `2.0.0`. No special-casing was needed; the acceptance criterion (`== 2.0.0`) passes.

## Deviations from Plan

None affecting scope or behavior. The only mechanical adjustment is the test-runner invocation form, which is an inherited 01-01 decision (documented above), not a fresh deviation.

## Issues Encountered

- Pre-existing, out-of-scope working-tree changes remain untouched (scope boundary, same as 01-01): `.planning/config.json` (orchestrator-lifecycle `_auto_chain_active` flag) and an untracked root `SOVEREIGN.md`. Neither belongs to plan 01-02's file set.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 03 can add the real command cases (`state`, `gate`, `commit`, `resolve-model`, `model`, `validate`) at the marked `// TODO(plan 03)` switch insertion point; `loadConfig`, `MODEL_PROFILES`/`getAgentToModelMapForProfile`, `output()`, and `findProjectRoot` are all in place for them to call.
- Plan 04 can add `init <workflow>` at the `// TODO(plan 04)` point; the `@file:` spill is verified, so large `init` payloads are already safe.
- No blockers.

## Known Stubs

Intentional and scoped to later plans (documented in the plan itself):

- `engine/bin/sovereign-tools.cjs` `runCommand` default case returns `{command, status: 'not_implemented'}` for every command except `version`. The real `state`/`gate`/`commit`/`resolve-model`/`model`/`validate`/`init` cases are delivered by plans 01-03 and 01-04 at the marked insertion points. This is the planned A→B→C build order, not an unresolved gap.

## Self-Check: PASSED

All created/modified files verified present; all 4 task commits verified in git history (see below).
