---
phase: 10-engine-additions
plan: 05
subsystem: engine
tags: [router, init, bridge, extension, adopt, integration, zero-dep, ENG-08]
requires:
  - "bridge.cjs cmdBridgeHash/cmdBridgeCheck (10-01)"
  - "extension.cjs cmdExtension* (10-04)"
  - "adopt.cjs cmdAdoptScan (10-03)"
  - "security.cjs scanSkillContent (10-02)"
  - "core.cjs execGit/output/loadConfig"
provides:
  - "public sovereign-tools commands: bridge (hash|check), extension (preview|install|list|audit), adopt (scan)"
  - "init bridge|adopt|extension orientation blobs (Core Value: one-call orient for the M3 skills)"
affects:
  - "Phase 11 (bridge skill), Phase 12 (extension skill), Phase 13 (adopt skill) — they wrap these commands"
tech-stack:
  added: []
  patterns:
    - "subcommand dispatch mirrors existing gate/validate switch arms; reuses parseListArg + positional args (no new arg helpers, no commander/yargs)"
    - "buildInit cases follow the shared { models, config, phase, context_injection, paths, exists } shape wrapped by withProjectContext"
    - "integration tests spawn the SOURCE bin with @file: spill-aware JSON parse; npx-dependent cases gated by hasNpm()"
key-files:
  created:
    - "engine/test/router-m3.test.cjs"
  modified:
    - "engine/bin/sovereign-tools.cjs"
    - "engine/bin/lib/init.cjs"
    - "engine/test/init.test.cjs"
decisions:
  - "init adopt blob carries detected.in_git (execGit rev-parse probe) so the Phase-13 skill knows the scanner's ls-files-vs-walk path before reading anything"
  - "router extension/bridge/adopt cases reuse the EXISTING array-arg helpers; never a shell string — preserves the no-injection invariant from the modules"
metrics:
  duration_min: 2.5
  tasks: 3
  files: 4
  completed: 2026-06-09
---

# Phase 10 Plan 05: M3 Router + Init Wiring Summary

Wired the three Phase-10 engine modules (bridge/extension/adopt) into the public `sovereign-tools` router and added `init bridge|adopt|extension` orientation workflows, proving the surface end-to-end through the real source bin. This is the final Phase-10 plan and the integration capstone for ENG-08: the engine substrate built in 10-01..04 is now reachable as public CLI commands the M3 skills (Phases 11-13) will wrap.

## What Was Built

- **Router (`engine/bin/sovereign-tools.cjs`)** — `require` of `bridge.cjs`/`extension.cjs`/`adopt.cjs` plus three new switch arms:
  - `bridge`: `hash` (`--files` via `parseListArg`) → `cmdBridgeHash`; `check` (optional positional id) → `cmdBridgeCheck`.
  - `extension`: `preview|install|audit` (positional source/path) + `list` → the four `cmdExtension*`.
  - `adopt`: `scan` → `cmdAdoptScan`.
  - Each unknown subcommand calls `error(...)` (non-zero exit). Usage Commands string updated.
- **Init (`engine/bin/lib/init.cjs`)** — imported `execGit`; added `case 'bridge' | 'adopt' | 'extension'` before `default`, each returning the standard nested blob wrapped by `withProjectContext`:
  - bridge: `bridge_dir`/`registry`/`bridge_doc`/`api_spec`/`security_model`/`glossary`/`state` paths (+ ADRs via `context_injection`).
  - adopt: record-only `state`/`manifest`/`sovereign_dir` paths + `detected.in_git` (the `execGit rev-parse --is-inside-work-tree` probe).
  - extension: `extensions_dir: .sovereign/extensions` + `state`/`manifest`.
  - All greenfield-safe (no throw on a bare/non-git dir).
- **Tests** — new `engine/test/router-m3.test.cjs` (spawns the source bin: bridge hash 2-file + 64-hex combined; bridge check greenfield `no_registry`; adopt scan contract; extension list shape gated by `hasNpm()`; `bridge bogus` non-zero exit) and four new `init.test.cjs` cases (bridge/adopt/extension blobs + greenfield safety).

## How to Verify

```
cd engine && node --test                              # 130 pass / 0 fail
node bin/sovereign-tools.cjs init bridge --cwd . --pick paths.registry   # .sovereign/bridges/registry.json
node bin/sovereign-tools.cjs adopt scan --cwd . --pick project_root      # <abs path>
node -e "const d=require('./package.json').dependencies||{}; if(Object.keys(d).length)throw 0; console.log('zero-dep ok')"
```

## Deviations from Plan

None — plan executed exactly as written. No bugs, missing functionality, or blocking issues encountered; the four upstream modules exposed exactly the documented `cmd*` signatures.

## Notes

- The live `extension list` test invokes real `npx skills` when npm is present (ran ~2.6s here) and `t.skip`s offline — it is correctly gated, matching pack-smoke's pattern. Exit-code branching itself is unit-covered in `extension.test.cjs` (10-04).
- `npm pack --dry-run` ships all three new lib files (adopt 10.0kB, bridge 5.2kB, extension 8.3kB); `test/` is correctly excluded by the `files` allowlist.
- Zero-dependency invariant holds: `dependencies == {}` and no third-party `require` anywhere under `engine/bin` (only `node:*` + local `./`).

## ENG-08 Status

**COMPLETE.** All Phase-10 ROADMAP success criteria #1-#5 are now reachable through the public CLI: `bridge hash|check`, `extension preview|install|list|audit`, `adopt scan`, and `init bridge|adopt|extension` all dispatch correctly and return greenfield-safe blobs; full `node --test` is green; engine deps stay `{}`; all output flows through the existing `output()`/`@file:` spill.

## Self-Check: PASSED

All claimed files exist on disk (4 modified/created code+test files + this SUMMARY) and both per-task commit hashes (db88976, abb3a7f) are present in git history.
