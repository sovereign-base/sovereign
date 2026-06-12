---
phase: quick-260612-k4h
plan: 01
subsystem: sovereign-cli launcher / installer
tags: [upgrade, installer, launcher, cli, tdd]
requires:
  - "runInstall(opts) — non-destructive, version-aware install core (install.cjs)"
provides:
  - "runUpgrade(opts) — stamp-guarded upgrade wrapper over runInstall (install.cjs)"
  - "upgrade/update launcher command + renderUpgrade() human output (sovereign.cjs)"
affects:
  - engine/bin/lib/install.cjs
  - engine/bin/sovereign.cjs
  - engine/test/upgrade.test.cjs
  - README.md
tech-stack:
  added: []
  patterns:
    - "Zero-dependency CommonJS .cjs; node:test + node:assert/strict; tmpdir + spawnSync fixtures"
    - "Delegation: runUpgrade guards then reuses runInstall — no install logic reinvented"
key-files:
  created:
    - engine/test/upgrade.test.cjs
  modified:
    - engine/bin/lib/install.cjs
    - engine/bin/sovereign.cjs
    - README.md
decisions:
  - "not_installed is a friendly non-zero exit (process.exitCode = 1 + say), not error() — avoids throwing/exit(1) on a non-fatal state"
  - "upgrade always uses mode 'full'; the @latest hint prints on both up_to_date and updated branches per spec"
metrics:
  duration: ~9m
  completed: 2026-06-12
  tasks: 3
  files: 4
  commits: 4
requirements: [UPGRADE-01]
---

# Phase quick-260612-k4h Plan 01: Add `upgrade` command to sovereign-cli launcher Summary

Added a first-class `upgrade` (alias `update`) command to the `sovereign-cli` launcher that moves an existing SOVEREIGN install to the packaged version by reusing the non-destructive `runInstall` core, while refusing to fresh-install where nothing is set up.

## What was built

- **`runUpgrade(opts)`** in `engine/bin/lib/install.cjs` (exported): reads the `.sovereign/.sovereign-version` stamp. Empty/absent → returns a minimal `{ ok:false, status:'not_installed', target, installed_version }` object with **no side effects** (no scaffold, no skills copy). Stamp present → delegates wholesale to `runInstall(opts)` (`up_to_date` when on the packaged VERSION, else `updated`), preserving the user's `.sovereign/` content.
- **`upgrade`/`update` command + `renderUpgrade()`** in `engine/bin/sovereign.cjs`: init-style flag/cwd parsing, mode always `'full'`, placed before the `--version`/help fallthrough. `renderUpgrade` prints the `not_installed` (exit 1, steers to `init`) / `up_to_date` / `updated` messages with the `@latest` hint; `--json` emits the raw result. A `usage()` line lists the command.
- **`engine/test/upgrade.test.cjs`**: unit tests (a) not_installed + no side effects, (b) older stamp → updated + sentinel preserved, (c) up_to_date; launcher tests (d) installed dir exits 0 + reports status, (e) empty dir exits non-zero + mentions `init`.
- **README.md**: an "Upgrading?" note in the Install section.

## Key links

- `sovereign.cjs` upgrade command → `runUpgrade({ cwd, target, mode:'full', packageRoot: PKG_ROOT })` from `./lib/install.cjs`.
- `runUpgrade` → `return runInstall(opts)` when a stamp is present (no install logic duplicated).

## Verification

- `cd engine && node --test "test/**/*.test.cjs"` → **195 pass, 0 fail** (190 baseline + 5 new upgrade tests). Baseline `install.test.cjs` launcher UX tests remain green.
- `engine/VERSION` untouched (`git diff --stat engine/VERSION` empty) — rides the unpublished 2.5.0; no `package.json` bump.
- Engine contract (`sovereign-tools`) untouched; changes confined to the launcher + install.cjs helper.

## Deviations from Plan

None — plan executed exactly as written. The single test file `upgrade.test.cjs` holds all five tests (a–e); during Task 1 the unit tests (a/b/c) were run in isolation via `--test-name-pattern` to confirm GREEN before the launcher command existed (the file as a whole goes fully green after Task 2). No auto-fixes, no auth gates, no architectural decisions.

## Known Stubs

None.

## Self-Check: PASSED
- FOUND: engine/test/upgrade.test.cjs
- FOUND: function runUpgrade in engine/bin/lib/install.cjs (exported)
- FOUND: function renderUpgrade + upgrade command in engine/bin/sovereign.cjs
- FOUND: "Upgrading?" note in README.md
- FOUND commits: c32bf24 (Task 1), def8d59 (Task 2), d09b66e (Task 3)
