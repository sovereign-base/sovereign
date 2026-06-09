---
phase: 12-extension-skill
plan: 01
subsystem: engine
tags: [extension, npx-skills, security-scan, ext-substrate]
requires:
  - "engine/bin/lib/security.cjs scanSkillContent (unchanged scanner)"
  - "engine/bin/lib/core.cjs output()/@file: spill"
  - "engine/bin/lib/extension.cjs runSkills (injectable runner)"
provides:
  - "extension preview = bare `skills use <source>` (verified surface)"
  - "extension audit <source> = scanSkillContent over `skills use` STDOUT"
affects:
  - "12-02 import-skill skill (drives its security gate on extension audit)"
tech-stack:
  added: []
  patterns:
    - "audit-over-stdout: re-run the bare preview shell-out, scan its prompt-wrapped SKILL.md stdout (no temp-dir/file-path assumption)"
key-files:
  created: []
  modified:
    - "engine/bin/lib/extension.cjs (preview args + cmdExtensionAudit rewrite; readMaterializedContent + node:fs/node:path removed)"
    - "engine/test/extension.test.cjs (preview-args, audit-over-stdout block/clean/no_content, gated live `skills use` test)"
decisions:
  - "preview is the BARE `skills use <source>` — `use` rejects `--copy` and `-a` starts an agent interactively (live smoke-test 2026-06-09)"
  - "audit scans the `skills use` STDOUT (prompt-wrapped SKILL.md), never a materialized file path; empty stdout / missing source → no_content clean (no throw)"
metrics:
  duration_min: 3
  completed: 2026-06-09
  tasks: 3
  files: 2
---

# Phase 12 Plan 01: Extension Engine Correction Summary

Corrected `extension.cjs` to the live-verified `npx skills` surface — preview is now the bare `skills use <source>`, and audit scans that command's prompt-wrapped STDOUT via `scanSkillContent` instead of a (non-existent) materialized file path.

## What Was Built

A Phase-10 bug, surfaced by a live `npx skills` smoke-test, had `extension preview` passing `-a <agent> --copy` to `skills use` (which `use` rejects / misinterprets as "start agent interactively") and `extension audit` reading a temp-dir file path that `skills use` never creates. This plan corrected both against the verified surface:

- **`buildSkillsArgs('preview', source)`** now returns the bare `['skills', 'use', source]` — no `-a`, no `--copy`. The non-empty-source guard and the `install`/`list` cases are unchanged (`skills add <source> -a claude-code --copy -y` was already valid).
- **`cmdExtensionAudit(_cwd, source, raw, runner?)`** now takes a SOURCE, re-runs `runSkills(buildSkillsArgs('preview', source), runner)` to fetch the prompt-wrapped raw SKILL.md to stdout, then runs `scanSkillContent(run.stdout)` → `{ ok: verdict !== 'block', source, findings, verdict }`. Missing source or empty stdout (not-found / network down) returns `{ ok:true, findings:[], verdict:'clean', reason:'no_content' }` with no throw.
- **`readMaterializedContent` and the `node:fs` / `node:path` requires** were deleted (the file-path assumption is gone). The module now requires only `node:child_process`, `core.cjs`, and `security.cjs`.
- **Header/JSDoc** updated to describe the fetch-to-stdout-for-inspection model.

The router (`sovereign-tools.cjs case 'extension'`) already routed the source positional `arg` into `cmdExtensionAudit(cwd, arg, raw)`; the new signature is additive-compatible (`runner` is an optional 4th param), so no router change was needed.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Correct preview args + rewire cmdExtensionAudit to scan `skills use` stdout | a7dd5aa | engine/bin/lib/extension.cjs |
| 2 | Update extension.test.cjs (bare-use args, audit-over-stdout, gated live test) | 64e7329 | engine/test/extension.test.cjs |
| 3 | Full-suite regression (no code change needed) | (no commit) | — |

## Verification

- `grep "return ['skills', 'use', source]" extension.cjs` matches (bare preview).
- `grep "scanSkillContent(run.stdout)" extension.cjs` matches (audit scans use-stdout).
- `! grep "readMaterializedContent" extension.cjs` (file-path assumption removed).
- `extension.cjs` requires only `node:child_process` + `core.cjs` + `security.cjs`; `package.json` dependencies stays `{}`.
- `node --test test/extension.test.cjs` → 10/10 pass (incl. the live `skills use` smoke test which ran here in ~5.2s).
- `node --test` (full engine suite) → 129/129 pass, 0 fail.

## Deviations from Plan

None — plan executed exactly as written. Task 3 required no code change: the router was already wired to pass the source positional, and the audit signature change was additive-compatible, so the full suite was green with no downstream test edits.

## Notes

- EXT-01 / EXT-02 are phase-scoped and close at the final Phase-12 plan (12-02, the `import-skill` skill). They are intentionally NOT marked complete here.
- The live test ran (npm available in this environment) rather than skipping; it asserts the `{ exitCode, stdout, stderr }` contract shape only, not `exitCode === 0`.

## Self-Check: PASSED
