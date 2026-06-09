---
phase: 10-engine-additions
plan: 04
subsystem: engine
tags: [extension, npx-skills, security-audit, ext-substrate, zero-dep]
requires:
  - "engine/bin/lib/security.cjs scanSkillContent (Plan 10-02)"
  - "engine/bin/lib/core.cjs output() @file: spill"
provides:
  - "engine/bin/lib/extension.cjs: cmdExtensionPreview/Install/List/Audit + buildSkillsArgs + runSkills"
  - "EXT substrate the Phase-12 extension skill wraps thinly"
affects:
  - "Phase 12 (sovereign-extensions skill) — orchestrates these commands"
  - "Phase 10-05 (router wiring + init extension workflow) — will route these cmd*"
tech-stack:
  added: []
  patterns:
    - "exit-code-driven subprocess wrapper (never parse stdout for success)"
    - "pure arg builder + injectable runner split for network-free unit testing"
    - "array-arg spawnSync (no shell string, no shell:true) — injection-safe source"
key-files:
  created:
    - "engine/bin/lib/extension.cjs"
    - "engine/test/extension.test.cjs"
  modified: []
decisions:
  - "preview=skills use (materialize-for-audit BEFORE add); install=skills add --copy -y -a claude-code; both source as a single discrete argv element"
  - "audit reads a SKILL.md file OR a dir of *.md (SKILL.md-first), runs scanSkillContent; ok=verdict!=='block'; missing path → no_content clean"
  - "runSkills accepts an injected runner so tests assert arg construction + exit branching without the network"
metrics:
  duration_min: 2
  tasks: 2
  files: 2
  completed: 2026-06-09
---

# Phase 10 Plan 04: extension.cjs (EXT substrate) Summary

Exit-code-driven `npx skills` wrapper + content audit: `preview`/`install`/`list` shell out via injection-safe array args and branch on the process exit code (never stdout), while `audit` materializes skill content and runs `scanSkillContent` to a `{ findings, verdict }` blob — the mechanical substrate the Phase-12 extension skill wraps thinly (R-003).

## What Was Built

- **`engine/bin/lib/extension.cjs`** (230 lines, zero new deps — `node:` built-ins + `core.cjs` + `security.cjs`):
  - `buildSkillsArgs(action, source, opts)` — the testable pure core. Returns the EXACT argv: `preview → ['skills','use',source,'-a','claude-code','--copy']`, `install → ['skills','add',source,'-a','claude-code','--copy','-y']`, `list → ['skills','list']`. `source` is always a single discrete element (no shell-string interpolation), and empty/invalid sources for preview/install throw.
  - `runSkills(args, runner)` — injectable runner (defaults to `spawnSync('npx', args, …)`, mirroring `execGit`). Returns `{ exitCode: status ?? 1, stdout, stderr }`.
  - `cmdExtensionPreview/Install/List` — emit `{ ok, exitCode, stdout, stderr, source }` via `output()`, with `ok = exitCode === 0`. Success is driven ONLY by the exit code; stdout/stderr are captured for the decision log but never parsed for success.
  - `cmdExtensionAudit(cwd, contentPath, raw)` — reads a SKILL.md file or a directory of `*.md` (SKILL.md first), runs `scanSkillContent`, emits `{ ok, source, findings, verdict }` with `ok = verdict !== 'block'`. Greenfield-safe: a missing/unreadable path yields `{ ok:true, verdict:'clean', reason:'no_content' }`.
- **`engine/test/extension.test.cjs`** (232 lines, `node:test`, 11 tests, network-free by default):
  - Arg construction (exact argv, source as one element, no whitespace in any element, custom agent, empty-source guards).
  - Exit-code branching via injected runners returning identical stdout but different exit codes — proving `ok` tracks the exit code, not the text.
  - Audit over a tmp dir: malicious SKILL.md → `block` with findings across all three categories; benign → `clean`; single-file path; missing path → `no_content`.
  - ONE live `npx skills` preview smoke test gated by `hasNpm()` (mirrors `pack-smoke`); asserts the contract shape only, never `exitCode===0`.

## How It Connects

- `cmdExtensionAudit` → `security.cjs scanSkillContent` (the Plan 10-02 dependency that made this Wave 2).
- All four commands → `core.cjs output()` (inherits the `@file:` >50KB spill).
- `runSkills` → `spawnSync('npx', ['skills', …])` array args — the wrapped registry, never reinvented.
- Router wiring (`bridge`/`extension`/`adopt` switch cases) + the `init extension` workflow are Plan 10-05's scope, not this plan's.

## Verification

- `node --test test/extension.test.cjs` → 11/11 pass (live smoke ran, npm present).
- Full engine suite: `node --test test/*.test.cjs` → 121/121 pass.
- `grep "spawnSync('npx'"` → present (array-arg shell-out). `grep scanSkillContent` → present (audit wired). `grep "shell: true"` → only in a JSDoc warning comment, NOT in code.
- `engine/package.json` `dependencies` → `{}` (unchanged).

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. The live smoke test intentionally does not assert `exitCode===0` (network/registry variability, per M3-NOTES §5 #2); this is documented behavior, not a stub.

## Notes for Next Phase

- Plan 10-05 must add `case 'extension'` to `engine/bin/sovereign-tools.cjs` routing `preview <source>` / `install <source>` / `list` / `audit <path>` to these `cmd*`, and an `init extension` workflow returning the extensions dir + config (greenfield-safe).
- ENG-08 is phase-scoped and remains In Progress until the final Phase-10 plan (10-05) lands the router + init wiring.

## Self-Check: PASSED

- Files: extension.cjs, extension.test.cjs, 10-04-SUMMARY.md all FOUND.
- Commits: 0c2e925 (feat), d605bff (test) both FOUND.
