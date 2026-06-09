---
phase: 10-engine-additions
plan: 03
subsystem: engine
tags: [adopt, archaeology, scan, git-ls-files, manifest-detection, read-only, zero-dep]

# Dependency graph
requires:
  - phase: M1 (engine foundation)
    provides: core.cjs output()/@file: spill + execGit (array-arg git shell-out), node:test patterns, zero-dep .cjs discipline
provides:
  - "engine/bin/lib/adopt.cjs — cmdAdoptScan + pure scanProject helper (Layers 1+2)"
  - "M3-NOTES §3 JSON contract: manifests, detected (languages/managers/flags), structure (tree capped + truncated), deep_read_candidates"
  - "gitignore-aware structure tree via git ls-files (git repo) or a bounded SKIP_DIRS walk (non-git)"
  - "engine/test/adopt.test.cjs — 9-case node:test suite over git + non-git tmp fixtures"
affects: [13-adopt-skill, adopt, ADOPT-01, archaeology]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure deterministic helper (scanProject) separated from the cmdAdoptScan I/O wrapper"
    - "Gitignore-aware structure via git ls-files when in a repo, bounded walk (SKIP_DIRS) otherwise"
    - "Read-only scope guard: scanner reads + records only, asserted by a dir-snapshot test"
    - "Cap MAX_TREE (2000) + truncated flag; file_count is the full total; large trees ride core output() @file: spill"

key-files:
  created:
    - engine/bin/lib/adopt.cjs
    - engine/test/adopt.test.cjs
  modified: []

key-decisions:
  - "MAX_TREE = 2000 exported as a module constant so the test asserts truncation behavior against the real cap"
  - "deep_read_candidates emits each reason at most once (entrypoint/auth/base-model/config), capped at 10, most-useful-first for a token-bounded Layer 3"
  - "Layer 1 driven by a data table (filename → kind/languages/manager) so languages + package_managers are inferred from the same source as manifests"
  - "tsconfig.json detected as a typescript manifest (language inference) while package.json supplies the npm manager — both can coexist"

patterns-established:
  - "Engine does the cheap mechanical Layers 1+2 scan; Phase-13 adopt skill/agent owns Layer-3 deep reads + gap analysis (engine-first split)"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-06-09
---

# Phase 10 Plan 03: Adopt Archaeology Scanner (Layers 1+2) Summary

**Zero-dependency, READ-ONLY `adopt scan` engine substrate: `scanProject(cwd)` emits the M3-NOTES §3 JSON contract (manifests, detected languages/managers/flags, a gitignore-aware capped+truncated structure tree, and heuristic deep_read_candidates) — gitignore-aware via `git ls-files` with a bounded-walk fallback, greenfield-safe, the mechanical scan the Phase-13 adopt skill wraps.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-09T09:08:47Z
- **Completed:** 2026-06-09T09:11:09Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- `scanProject(cwd)` — Layer 1 manifest detection over a data table (package.json→npm, tsconfig→typescript, pyproject/requirements→pip, go.mod, Cargo.toml, pom/gradle, Gemfile, composer.json, Dockerfile, docker-compose, .env.example), inferring `detected.languages`/`package_managers` from the same table; flags `has_dockerfile`, `has_ci` (`.github/workflows/`), `has_tests` (test dir or `*.test.*`/`*.spec.*`), `monorepo` (`packages/`/`apps/` or package.json `workspaces`).
- Layer 2 structure: `git ls-files` when `git rev-parse --is-inside-work-tree` succeeds (so .gitignore'd / node_modules entries are absent for free), else a bounded recursive walk skipping `SKIP_DIRS` (node_modules/.git/dist/build/.next/vendor/coverage/.turbo/.cache). Tree capped at `MAX_TREE = 2000` with `structure.truncated`; `file_count` is the full total; `top_level_dirs` = unique first-segment dirs.
- `deep_read_candidates` — heuristic `{path, reason}` for entrypoint (`index`/`main`/`app`/`server.*`), auth (`auth*`/`middleware/auth`), base-model (`models/`, `schema.*`, `.prisma`), config (primary manifest), each reason once, capped at 10.
- `cmdAdoptScan(cwd, raw)` → `output(scanProject(cwd), raw)` — relies on core `output()`'s `@file:` >50KB spill for large trees; never reimplements spill. Reuses `core.cjs` `execGit` for all git interaction.
- `engine/test/adopt.test.cjs` — 9 `node:test` cases (manifest/language/flag detection, filenames-only structure, gitignore-aware ls-files [skips when git absent], non-git walk skipping node_modules/dist, cap/truncation against the real `MAX_TREE`, deep_read heuristics, greenfield safety + read-only dir-snapshot invariant, full-contract output shape, monorepo/has_tests). Full engine suite green at **110 tests**; `dependencies` still `{}`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement adopt.cjs Layers 1+2 scanner** - `3234b45` (feat) — TDD: the full test suite was authored first as RED (module-not-found confirmed), then adopt.cjs made all 9 tests GREEN.
2. **Task 2: Write adopt.test.cjs node:test suite** - `ef8a427` (test) — the suite committed (authored in the RED step; this commit lands the file).

**Plan metadata:** (this commit)

## Files Created/Modified
- `engine/bin/lib/adopt.cjs` - read-only Layers-1+2 archaeology scanner (`cmdAdoptScan`, pure `scanProject`, exported `MAX_TREE`); requires only `node:fs`/`node:path` + `./core.cjs` `output`/`execGit`.
- `engine/test/adopt.test.cjs` - 9-case `node:test` + `node:assert/strict` suite over real git + non-git tmp fixtures with fd-1 capture (resolving `@file:` spill) and a dir-snapshot read-only assertion.

## Decisions Made
- `MAX_TREE` exported so the cap/truncation test asserts against the real constant rather than a magic number (over-cap fixture proves `truncated === true` + tree sliced to the cap while `file_count` stays the full total).
- The non-git walk bounds itself at `MAX_TREE + 1` files so a pathological tree can't blow up the scan while still letting `truncated` flip true.
- `deep_read_candidates` normalizes paths to forward-slash + lowercase for stable cross-platform heuristic matching, and emits each reason at most once for a token-bounded Layer 3.

## Deviations from Plan

None - plan executed exactly as written. (Task 1 was `tdd="true"`: the comprehensive suite was authored first and confirmed RED via module-not-found, then `adopt.cjs` made it GREEN; Task 2 then committed that suite, matching the plan's two-task structure.)

## Known Stubs

None - the scanner is fully wired; Layer-3 deep reads + gap analysis are intentionally out of scope (Phase-13 skill/agent judgment, per CONTEXT/REQUIREMENTS), not stubs.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The git-path test skips cleanly when `git` is unavailable.

## Next Phase Readiness
- The ADOPT Layers-1+2 engine substrate is implemented and tested; ready to be wrapped by the Phase-13 adopt skill (thin orchestrator) which adds Layer-3 surgical deep reads + gap analysis.
- Still pending in Phase 10 (later plans): `extension.cjs` + `scanSkillContent()` integration, the router cases in `sovereign-tools.cjs`, and the `init bridge|adopt|extension` workflows. ENG-08 stays In Progress (phase-scoped — closes at plan 10-05).

## Self-Check: PASSED

- FOUND: engine/bin/lib/adopt.cjs
- FOUND: engine/test/adopt.test.cjs
- FOUND: .planning/phases/10-engine-additions/10-03-SUMMARY.md
- FOUND commit: 3234b45 (feat — Task 1)
- FOUND commit: ef8a427 (test — Task 2)

---
*Phase: 10-engine-additions*
*Completed: 2026-06-09*
