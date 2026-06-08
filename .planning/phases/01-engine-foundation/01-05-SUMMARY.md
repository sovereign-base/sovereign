---
phase: 01-engine-foundation
plan: 05
subsystem: engine
tags: [cjs, init-contract, one-blob-orientation, file-spill, npm-pack, smoke-test, distribution, node-test, core-value]

# Dependency graph
requires:
  - "01-02: core.cjs (output/@file: spill, loadConfig, findProjectRoot), router with // TODO(plan 05) marker; model-profiles.cjs"
  - "01-03: state.cjs/manifest.cjs (phase + paths sources)"
  - "01-04: model.cjs (resolveModelInternal for the models{} block)"
provides:
  - "engine/bin/lib/init.cjs — cmdInit: nested one-blob orientation contract (council, sovereign-init, fast-lane stubs)"
  - "engine/bin/sovereign-tools.cjs — wired 'init <workflow>' switch case"
  - "engine/templates/sovereign/ — full .sovereign/ seed tree shipped INSIDE the package (files allowlist)"
  - "engine/test/init.test.cjs — nested-contract assertions (RED committed pre-crash, GREEN here)"
  - "engine/test/pack-smoke.test.cjs — npm pack -> install tarball -> run installed init council"
  - "engine/README.md — command-surface contract reference"
affects: [02-bootstrap, council, all-fast-lane-skills]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "init returns ONE nested blob (project_root, sovereign_version, models{}, config{}, phase{}, context_injection{}, paths{}, exists{}, agents_installed/missing_agents) — the load rule: a skill orients with zero file reads, reading content only when it needs it"
    - "init output routes through output() so >50KB payloads spill to @file: identically to every other command; --pick applies over the full nested shape via the router's stdout interceptor"
    - "templates ship at engine/templates/ (not repo-root templates/) so package.json files:[bin,templates,VERSION] packs them — proven by pack-smoke installing the tarball and finding templates/sovereign/STATE.md"
    - "the distribution DoD is a REAL npm pack + tarball install (never npm link), run against the INSTALLED bin so shebang/bin-path/CJS/engines regressions are caught (PITFALLS.md #7)"

key-files:
  created:
    - engine/bin/lib/init.cjs
    - engine/test/init.test.cjs
    - engine/test/pack-smoke.test.cjs
    - engine/README.md
    - engine/templates/sovereign/ (full tree, shipped)
  modified:
    - engine/bin/sovereign-tools.cjs (init switch case)

requirements: [ENG-01, ENG-06]
---

# Plan 01-05 Summary — Engine layer C: the `init` contract + distribution DoD

**Outcome:** SOVEREIGN's Core Value works. `sovereign-tools init council` returns the full nested orientation blob in one call, and the engine packs + installs from a tarball and runs end-to-end. The A→B→C engine chain is complete; the engine is shippable.

## What shipped
- **`init.cjs`** — `cmdInit(cwd, workflow, raw)` builds the nested blob for `council` (flagship), `sovereign-init` (bootstrap detection), and fast-lane stubs. Composes the already-built pieces: `loadConfig` → `config`/`models` (via `model-profiles`), state/manifest paths → `phase`/`paths`/`exists`, context-injection paths. Emitted through `output()` (inherits `@file:` >50KB spill).
- **Router wiring** — the `init` switch case calls `cmdInit`; `--pick`/`--raw`/`--cwd` work over the nested shape.
- **Shipped templates** — `templates/sovereign/` copied into `engine/` so the `files` allowlist packs the full seed tree.
- **`pack-smoke.test.cjs`** — `npm pack` → `mkdtemp` → `npm install <tarball>` → run the **installed** `init council` → assert nested blob + shipped shebang (`#!/usr/bin/env node`) + shipped `templates/sovereign/STATE.md`. Cleans up. Skips gracefully if npm absent.
- **`engine/README.md`** — thin command-surface reference (the engine contract).

## Verification
- Full suite: **52 tests pass, 0 fail** (`node --test "test/**/*.test.cjs"`), including `init.test.cjs` and `pack-smoke.test.cjs`.
- Live: `init council --cwd <scaffolded project>` returns the exact nested contract, exit 0.
- ENG-01 and ENG-06 satisfied.

## Deviation / recovery note
The original Wave 5 executor crashed mid-run (API socket error) after committing the RED test and writing `init.cjs` + router wiring + `engine/templates/` **uncommitted**. The orchestrator completed the plan directly: verified the uncommitted GREEN passed the suite, then authored the missing Task 2 (`pack-smoke.test.cjs`) and Task 3 (`README.md`), committed all three tasks atomically, and wrote this SUMMARY. No scope change.

## For the next phase (02 — Bootstrap + Subagents)
- `init sovereign-init` already returns bootstrap-detection fields; the Phase 2 `sovereign-init` skill consumes them.
- `init council` is ready for the Phase 3 Council orchestrator to consume (context_injection paths + resolved advisor models).
- The engine is the stable contract everything skill-shaped now wraps.
