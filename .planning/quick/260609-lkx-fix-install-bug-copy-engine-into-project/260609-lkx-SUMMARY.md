---
phase: quick-260609-lkx
plan: 01
subsystem: installer + skills
tags: [install, engine, skills, version-bump, bugfix]
requires:
  - "engine/bin/lib/install.cjs runInstall (skills/agents copy + .sovereign scaffold)"
  - "engine/bin/lib/init.cjs readVersion (sovereign_version source)"
provides:
  - "Engine copied into .claude/sovereign-engine/ on every install/update (engine_copied + engine_path)"
  - "Installed engine self-reports sovereign_version (VERSION shipped alongside flattened bin/)"
  - "All 16 skills + skill-format.md invoke the engine via the literal .claude/sovereign-engine/sovereign-tools.cjs path"
  - "Regression tripwire test guarding the $ENGINE seam"
affects:
  - "Every installed skill's engine invocation (now reachable from a fresh install)"
tech_stack_added: []
patterns:
  - "Engine self-location: readVersion resolves both source-tree (../../VERSION) and installed (../VERSION) layouts"
  - "Literal cwd-stable invocation path instead of an unset/non-persisting shell var"
key_files_created:
  - engine/test/installed-engine.test.cjs
key_files_modified:
  - engine/bin/lib/install.cjs
  - engine/bin/lib/init.cjs
  - engine/VERSION
  - engine/package.json
  - engine/skills/*/SKILL.md (16 files)
  - engine/references/skill-format.md
decisions:
  - "Copy engine/bin CONTENTS into .claude/sovereign-engine/ (flatten) so dest/sovereign-tools.cjs + dest/lib/ result"
  - "Engine copy runs on EVERY install/update and overwrites — NOT version-gated, NOT subject to the non-destructive .sovereign/ rule"
  - "Ship VERSION alongside the flattened bin/ + make readVersion resolve the installed layout, so the installed engine self-reports its version (Rule 3 fix surfaced by the reachability test)"
metrics:
  duration_min: 3
  completed: 2026-06-09
  tasks: 3
  files: 21
---

# Quick Task 260609-lkx: Fix Install Bug — Copy Engine Into Project Summary

Fixed the critical install bug where `npx sovereign-cli init` copied skills + agents into `.claude/` but never copied the engine itself: `runInstall` now copies `engine/bin` contents into `.claude/sovereign-engine/` (with `VERSION`) on every install/update, all 16 skills + the skill-format reference invoke the engine via the literal cwd-stable path `.claude/sovereign-engine/sovereign-tools.cjs` (replacing the unset, never-persisting `$ENGINE` var), and a new end-to-end test proves reachability and guards the seam. Engine bumped 2.1.0 → 2.2.0.

## What Was Built

**Task 1 — Engine-copy step + reachability test (TDD, RED→GREEN)** — commit `447b529`
- New `engine/test/installed-engine.test.cjs` with four behaviors over tmpdir fixtures:
  - Test A: `runInstall` lands `.claude/sovereign-engine/sovereign-tools.cjs` + `lib/`, returns `engine_copied: true` and `engine_path: '.claude/sovereign-engine'`, still scaffolds `.sovereign/`.
  - Test B: spawning `node .claude/sovereign-engine/sovereign-tools.cjs init council` from the project cwd exits 0 and returns a blob whose `sovereign_version` equals the packaged VERSION (handles the `@file:` >50KB spill prefix like pack-smoke).
  - Test C: `state load` via the installed path exits 0 (proves `require('./lib/...')` resolves there).
  - Test D: regression tripwire — no shipped `SKILL.md` contains the literal `$ENGINE`.
- `runInstall` gained an engine-copy step (runs every install/update, overwrites, guarded if the source bin dir is absent) plus `engine_copied` + `engine_path` on `InstallResult` (typedef updated).

**Task 2 — Replace `$ENGINE` with the literal installed path** — commit `e106762`
- Scripted bulk substitution (perl one-liner) of the exact substring `$ENGINE/bin/sovereign-tools.cjs` → `.claude/sovereign-engine/sovereign-tools.cjs` across 16 `SKILL.md` files + `references/skill-format.md` (29 occurrences; 29 ins / 29 del, surrounding quotes/backticks/prose preserved verbatim). `grep -rn '\$ENGINE' skills/ references/` is empty; Test D tripwire is green.

**Task 3 — Version bump + full-suite gate** — commit `ecebd73`
- `engine/VERSION` and `engine/package.json` → `2.2.0`. No test hardcodes `2.1.0` (install + pack-smoke read the packaged VERSION dynamically). Full `node --test "test/**/*.test.cjs"` suite green: 137 tests, 0 fail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed engine could not read its own VERSION**
- **Found during:** Task 1 (Test B failed: blob reported `sovereign_version: 2.0.0` instead of the packaged `2.1.0`).
- **Issue:** `init.cjs readVersion()` resolved `__dirname/../../VERSION`, which is `engine/VERSION` in the source tree but `.claude/VERSION` in the installed (flattened-bin) layout — so the installed engine hit the defensive `2.0.0` fallback. The plan's engine-copy step (copying only `engine/bin` contents) does not include the source-tree VERSION, which sits *above* `bin/`.
- **Fix:** (a) `install.cjs` now also copies the source `VERSION` into `.claude/sovereign-engine/VERSION` alongside the flattened bin contents; (b) `readVersion()` now resolves the source-tree path (`../../VERSION`) first, then the installed path (`../VERSION`), then the pinned fallback. Both layouts self-report correctly.
- **Files modified:** `engine/bin/lib/install.cjs`, `engine/bin/lib/init.cjs`
- **Commit:** `447b529` (folded into Task 1, since it was required for Test B to go GREEN)
- **Impact:** Init JSON contract untouched (the `sovereign_version` field and `output()`/`@file:` spill are unchanged); zero new runtime dependencies. Pre-existing install + init tests (36) and the full suite (137) remain green.

### Deviation 2 — bare `state save` was rejected by the router (second layered install bug)

**[Rule 1 - Bug] `state save` with no fields errored instead of regenerating MANIFEST**
- **Found during:** post-fix verification of this same quick task.
- **Issue:** Now that the engine is reachable (Deviation 1 / the main fix), the persist step still failed: every installed skill calls bare `state save` (no `--field`/`--value`) purely to regenerate MANIFEST, but the router's `state` case required at least one `--field`/`--value` pair for *both* `save` and `patch` and exited 1 on a bare `save`. `state.cjs#patchState` re-derives MANIFEST regardless of patch count (and only errors when STATE.md is absent), so the guard was wrong for `save`.
- **Fix:** In `sovereign-tools.cjs` the empty-pair guard now fires only for `sub === 'patch'`. Bare `state save` (zero patches) flows through to `cmdStatePatch` → `patchState`, which regenerates MANIFEST and exits 0. `state save --field X --value Y` still works (patches flow through); `state patch` with no pair still exits 1.
- **Tests:** `installed-engine.test.cjs` Test C rewritten to the real skill contract — bare `state save` via the installed path exits 0, reports `manifest_regenerated`, and regenerates a removed `.sovereign/MANIFEST.md`. New Test C2 locks the asymmetry: bare `state patch` still exits 1. The `$ENGINE` tripwire (Test D) is intact.
- **Files modified:** `engine/bin/sovereign-tools.cjs`, `engine/test/installed-engine.test.cjs`
- **Impact:** Init JSON contract, `output()`/`@file:` spill, and `parseFieldValuePairs` untouched; zero new runtime deps. Full suite: 138 tests, 0 fail.

## Verification

- `cd engine && node --test "test/**/*.test.cjs"` → 137 tests, 137 pass, 0 fail.
- `cd engine && grep -rn '\$ENGINE' skills/ references/` → no matches.
- Manual sanity: `node bin/sovereign.cjs init --full --cwd /tmp/sov-check` then `node /tmp/sov-check/.claude/sovereign-engine/sovereign-tools.cjs init council --cwd /tmp/sov-check` → blob with `sovereign_version: 2.2.0`.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: engine/test/installed-engine.test.cjs
- FOUND: engine/bin/lib/install.cjs contains `sovereign-engine`
- FOUND: engine/VERSION == 2.2.0
- FOUND commit: 447b529 (Task 1)
- FOUND commit: e106762 (Task 2)
- FOUND commit: ecebd73 (Task 3)
