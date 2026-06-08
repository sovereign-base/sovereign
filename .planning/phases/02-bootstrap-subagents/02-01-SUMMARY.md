---
phase: 02-bootstrap-subagents
plan: 01
subsystem: installer
tags: [npx, install, cjs, idempotent, version-aware, scaffold, copy-not-symlink, node-test, zero-dep]

# Dependency graph
requires:
  - "01-02: core.cjs (safeReadFile, output @file: spill, error)"
  - "01-05: engine/templates/sovereign/ seed tree + VERSION (2.0.0)"
provides:
  - "engine/bin/lib/install.cjs — runInstall(opts) + cmdInstall + FAST_LANE: copy skills/agents into .claude/, scaffold .sovereign/, version-aware idempotent re-run"
  - "engine/bin/sovereign.cjs — real `npx sovereign init [--quick|--full|--global]` launcher (replaces Phase-1 stub)"
  - "engine/test/install.test.cjs — idempotency + --quick/--full + version-aware + launcher-integration assertions"
  - "engine/package.json files[] now packs agents/ + skills/ so installer copy sources ship in the tarball"
affects: [02-02-agents, 02-03-doctor, all-fast-lane-skills, council]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Installer = copy not symlink into project .claude/ (default) or ~/.claude/ (--global), so the system travels with the repo (ADR-003, mirrors npx skills)"
    - ".sovereign/ scaffolded from templates/sovereign/ ONLY when absent — re-runs never clobber user-modified state (non-destructive)"
    - "Idempotency + version-awareness via a .sovereign/.sovereign-version stamp diffed against the packaged VERSION: first run=installed, equal=up_to_date (no copy), differ=updated (re-copy + rewrite stamp)"
    - "--quick filters skills to FAST_LANE 5; --full (and bare init) copies all present skill dirs — correct from day one, grows as Phases 3-4 land skill dirs"
    - "Installer copies whatever is present: 0 skills + 0 agents today (those ship in 02-02/Phases 3-4) → empty arrays, no throw — order-independent"

key-files:
  created:
    - engine/bin/lib/install.cjs
    - engine/test/install.test.cjs
  modified:
    - engine/bin/sovereign.cjs
    - engine/package.json

decisions:
  - "Version stamp lives at .sovereign/.sovereign-version (inside committed state) so version-awareness travels with the repo, not the install target"
  - "Bare `init` defaults to --full (full M1 set per INIT-02), not --quick"
  - "Added agents+skills to package.json files[] (per 02-CONTEXT) — without them the published tarball would have nothing to copy once skill/agent dirs exist"

metrics:
  duration_min: 3
  completed: 2026-06-08
  tasks: 2
  files: 4

requirements: [INIT-01, INIT-02, INIT-03]
---

# Phase 2 Plan 1: `npx sovereign init` Installer Summary

The user front door now works: `npx sovereign init` copies SOVEREIGN's packaged skills + agents into a project's `.claude/` and scaffolds a committed `.sovereign/` state tree from the shipped templates — idempotently, version-aware, and zero-dependency.

## What shipped

- **`install.cjs`** — `runInstall({cwd, target, mode, packageRoot})`: resolves the install root (`<cwd>/.claude` for `project`, `~/.claude` for `global`), recursively copies packaged skill dirs (filtered to the Fast Lane 5 under `--quick`) and agent `*.md` files via `fs.cpSync`/`copyFileSync`, scaffolds `.sovereign/` from `templates/sovereign/` only when absent, and reads/writes a `.sovereign/.sovereign-version` stamp to decide `installed` | `up_to_date` | `updated`. Returns a structured result blob. `cmdInstall(cwd, {quick,full,global}, raw)` resolves flags (default full / project), computes `packageRoot = engine/`, and emits via `output()` (inherits the `@file:` >50KB spill). Exports `FAST_LANE`.
- **`sovereign.cjs`** — replaced the Phase-1 stub: `main()` routes `init [--quick|--full|--global]` → `cmdInstall`, prints `sovereign v<VERSION>` for `--version`/`version`/no-arg, and hard-errors (non-zero exit) on unknown commands via `core.error`. Kept shebang + `module.exports = { main }`.
- **`install.test.cjs`** — 9 cases over tmpdir fixtures: fresh install, non-destructive idempotent re-run (sentinel file survives), `--quick` Fast-Lane filtering, stale-stamp → `updated`, FAST_LANE contents, plus three `spawnSync` launcher-integration cases (`init --full` scaffold, `--version`, unknown-command exit).
- **`package.json`** — `files[]` now includes `agents` + `skills` alongside `bin`/`templates`/`VERSION`.

## Verification

- `node --test "test/install.test.cjs"` → **9/9 pass**.
- Full engine suite `node --test "test/**/*.test.cjs"` → **61 tests pass, 0 fail** (was 52; +9 install).
- Live e2e in a tmpdir: `init` → `status:installed` + full `.sovereign/` tree + stamp `2.0.0`; re-run → `status:up_to_date`, `sovereign_scaffolded:false`, user content preserved.
- `engine/package.json` `dependencies` remains `{}` (zero-dep invariant held).
- `node bin/sovereign.cjs --version` → `sovereign v2.0.0`.

## Deviations from Plan

### Auto-added missing critical functionality

**1. [Rule 2 - Missing critical functionality] Added `agents` + `skills` to `package.json` files[]**
- **Found during:** post-Task-2 packaging review.
- **Issue:** The installer copies from `<packageRoot>/{agents,skills}`, but the npm `files` allowlist only packed `bin`/`templates`/`VERSION`. Once Phases 3-4 / plan 02-02 populate those dirs, the *published tarball* would omit them and `npx sovereign init` would copy nothing — silently breaking the front door. 02-CONTEXT explicitly calls for `agents` in the allowlist.
- **Fix:** Added `agents` and `skills` to `files[]`. No behavior change today (dirs absent → not packed), but the copy sources will ship the moment they exist.
- **Files modified:** engine/package.json
- **Commit:** ae130db

## Requirements satisfied

- **INIT-01:** `npx sovereign init` installs skills/agents into `.claude/` and scaffolds `.sovereign/`.
- **INIT-02:** `--quick` filters to the Fast Lane 5; `--full` (and bare `init`) installs the full set.
- **INIT-03:** re-run is idempotent + version-aware (`up_to_date` | `updated`); user `.sovereign/` content preserved.

## Known Stubs

- `skills_copied` / `agents_copied` are empty today because no skill dirs (Phases 3-4) or agent files (plan 02-02) ship yet. This is intentional and documented in the plan: the selection/copy logic is correct now and grows as those dirs land. Not a blocking stub — the installer's behavior (scaffold + version stamp + copy-what-is-present) is fully exercised.

## For the next plans (02-02 agents, 02-03 doctor)

- Plan 02-02 should write agent files into `engine/agents/*.md`; the installer will pick them up automatically (copied into `.claude/agents/`) and the now-packed allowlist will ship them.
- The real `agents_installed`/`missing_agents` check (02-CONTEXT) replaces `init.cjs`'s hardcoded `true` by verifying `<name>.md` exists in the install location — the installer's copy target (`.claude/agents/`) is the location to probe.

## Self-Check: PASSED

All created/modified files exist on disk; all four task commits (10b1f20, bc42b56, 8044bb3, ae130db) are present in git history.
