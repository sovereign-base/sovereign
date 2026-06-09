---
phase: 01-engine-foundation
plan: 04
subsystem: engine
tags: [cjs, commit, gitignore-gate, prompt-injection, model-resolution, profiles, validate-skills, frontmatter-linter, node-test, tdd]

# Dependency graph
requires:
  - "01-02: core.cjs (output/@file: spill, loadConfig, safeReadFile, findProjectRoot), router with // TODO(plan 04) marker; model-profiles.cjs (MODEL_PROFILES)"
  - "01-03: state/gate switch cases already wired ahead of the plan-04 marker"
provides:
  - "engine/bin/lib/security.cjs — sanitizeForPrompt (strips zero-width/invisible Unicode + neutralizes <system>/[SYSTEM]/<<SYS>> markers)"
  - "engine/bin/lib/commit.cjs — cmdCommit: commit_docs + gitignore gated, sanitized message, stages files (default .sovereign/), returns {committed,hash,reason}"
  - "engine/bin/lib/core.cjs — added execGit (spawnSync, never throws) + isGitIgnored (git check-ignore --no-index)"
  - "engine/bin/lib/model.cjs — resolveModelInternal (override->omit->profile->sonnet) + cmdResolveModel (outputs {agent,model}, raw=bare string)"
  - "engine/bin/lib/validate.cjs — validateSkills + cmdValidateSkills: SKILL.md frontmatter linter (name<=64/lowercase-hyphen/no claude|anthropic; desc<=1024), exit(1) on violation"
  - "engine/bin/sovereign-tools.cjs — wired commit | model | resolve-model | validate skills switch cases + parseListArg (--files a b c collector)"
affects: [01-05, sovereign-init, council]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "commit is gated twice (commit_docs:false then .sovereign/ gitignored) and NEVER errors on a skip — it returns {committed:false, reason} so callers branch on outcome (ADR-003: .sovereign/ committed by default, skip when the team opts out)"
    - "commit messages are sanitizeForPrompt'd before they land because git history is read back into agent context (indirect prompt-injection vector)"
    - "isGitIgnored uses git check-ignore --no-index so it reports ignored even for already-tracked paths (the .sovereign/-committed-then-gitignored case)"
    - "model resolution order is verbatim GSD: per-agent override -> resolve_model_ids:'omit'('') -> MODEL_PROFILES[agent][profile] ('inherit' passthrough) -> 'sonnet'"
    - "validate.cjs parses frontmatter line-by-line (key: value, quote-stripped) — no YAML dependency, sufficient for the scalar name/description fields"
    - "cmdValidateSkills writes the JSON report FIRST, then process.exit(1) — output-before-exit so callers always see violations (matches the writeSync-then-exit discipline)"
    - "pure functions (validateSkills, resolveModelInternal) exposed beside the cmd* CLI wrappers so node:test asserts return values directly; CLI exit-code paths covered by spawnSync integration tests"

key-files:
  created:
    - engine/bin/lib/security.cjs
    - engine/bin/lib/commit.cjs
    - engine/bin/lib/model.cjs
    - engine/bin/lib/validate.cjs
    - engine/test/commit.test.cjs
    - engine/test/model.test.cjs
    - engine/test/validate.test.cjs
  modified:
    - engine/bin/lib/core.cjs
    - engine/bin/sovereign-tools.cjs

key-decisions:
  - "security.cjs is a minimal retarget of GSD's — only sanitizeForPrompt (the surface commit needs), not the full path/JSON/shell validation suite; the rest is added when a command actually needs it"
  - "added parseListArg (returns string[]) for commit --files rather than reusing parseMultiwordArg (which joins to one space-delimited string) — file lists must stay arrays for git add"
  - "validate skills auto-discovers skills/** and .claude/skills/** when no explicit paths are given; the fs walk skips node_modules and dot-dirs except .claude"

requirements-completed: [ENG-04, ENG-05, ENG-07, STATE-03]

# Metrics
duration: 6min
completed: 2026-06-08
---

# Phase 1 Plan 04: Engine Layer B — Commit, Model Resolution, Validate Skills Summary

**The side-effecting + resolution command surface: a doubly-gated (commit_docs + gitignore) prompt-injection-sanitized `commit` that returns the short hash, GSD-verbatim `model`/`resolve-model` resolution (override -> omit -> profile -> sonnet), and a `validate skills` SKILL.md frontmatter linter that exits non-zero on any name/description violation — all lifted from GSD's shapes, retargeted to `.sovereign/`, wired into the router, and covered by a 38-test passing `node:test` suite across three TDD cycles.**

## Performance

- **Duration:** ~6 min
- **Tasks:** 3 (all TDD)
- **Files:** 7 created, 2 modified

## Accomplishments

- **security.cjs** — `sanitizeForPrompt(text)` strips zero-width/invisible Unicode (`​-‏`, line/para separators, BOM, soft hyphen) and neutralizes XML/HTML system-boundary tags (`<system>`/`<assistant>`/`<human>` → full-width `＜system-text＞`), `[SYSTEM]`/`[INST]` brackets, and `<<SYS>>` markers. A minimal retarget of GSD's security.cjs — only the message-sanitization surface `commit` requires.
- **core.cjs (extended)** — added `execGit(cwd, args)` (spawnSync array-args, never throws, returns `{exitCode, stdout, stderr}`) and `isGitIgnored(cwd, target)` (`git check-ignore -q --no-index --` so it reports ignored even for tracked paths). Required `node:child_process` at the top; both exported.
- **commit.cjs** — `cmdCommit(cwd, message, files, raw)`: requires a message, `sanitizeForPrompt`s it, `loadConfig`s, bails on `!commit_docs` (`reason: skipped_commit_docs_false`) then on `isGitIgnored(cwd,'.sovereign')` (`reason: skipped_gitignored`), stages `files` (default `['.sovereign/']`, staging deletions for missing paths via `git rm --cached --ignore-unmatch`), `git commit -m`, handles `nothing to commit`, then `git rev-parse --short HEAD` → `{committed:true, hash}`.
- **model.cjs** — `resolveModelInternal(cwd, agent)` mirrors GSD verbatim: `config.model_overrides[agent]` wins → `resolve_model_ids==='omit'` returns `''` → `MODEL_PROFILES[agent][profile.toLowerCase()]` (`'inherit'` passthrough; unknown agent → `'sonnet'`) → row/sonnet fallback. `cmdResolveModel` outputs `{agent, model}` with the bare model string as the raw value.
- **validate.cjs** — `validateSkills(cwd, paths)` lints SKILL.md frontmatter: name ≤64 chars, `^[a-z0-9-]+$`, no `claude`/`anthropic` (case-insensitive), description ≤1024; auto-discovers `skills/**` + `.claude/skills/**` when no paths given (zero-dep fs walk). Returns `{valid, checked, violations[]}`. `cmdValidateSkills` outputs the report then `process.exit(1)` on any violation.
- **sovereign-tools.cjs** — replaced the `// TODO(plan 04)` marker with `case 'commit'` (message via `--message`/positional, files via new `parseListArg('--files')`), `case 'model'`/`case 'resolve-model'` (agent = args[1]), and `case 'validate'` (`skills` sub → `cmdValidateSkills`). Left a fresh `// TODO(plan 05): init` marker. Full suite = 38 passing, exit 0.

## Task Commits

1. **Task 1 (TDD): security.cjs + commit.cjs — gated, sanitized commit returning hash**
   - RED `8705497` (test) → GREEN `0fb6e65` (feat, incl. core.cjs execGit/isGitIgnored)
2. **Task 2 (TDD): model.cjs — profile resolution**
   - RED `0796ee2` (test) → GREEN `6c6d72f` (feat)
3. **Task 3 (TDD): validate.cjs linter + wire switch cases**
   - RED `4f42adc` (test) → GREEN `d37823d` (feat)

## Files Created/Modified

- `engine/bin/lib/security.cjs` — created: sanitizeForPrompt
- `engine/bin/lib/commit.cjs` — created: cmdCommit (gated + sanitized + hash)
- `engine/bin/lib/model.cjs` — created: resolveModelInternal + cmdResolveModel
- `engine/bin/lib/validate.cjs` — created: validateSkills + cmdValidateSkills
- `engine/bin/lib/core.cjs` — modified: added execGit + isGitIgnored
- `engine/bin/sovereign-tools.cjs` — modified: wired commit/model/resolve-model/validate cases + parseListArg
- `engine/test/commit.test.cjs` — created: gating + sanitize + happy-path suite (real tmp git repo)
- `engine/test/model.test.cjs` — created: 5-branch resolution suite (config fixtures)
- `engine/test/validate.test.cjs` — created: valid + 4 violation cases + 2 CLI exit-code cases

## Decisions Made

- **Minimal security.cjs.** Ported only `sanitizeForPrompt` from GSD's larger security module — the single function `commit` needs. The path/JSON/shell/phase validators are added when a future command actually requires them, keeping the engine surface lean.
- **`parseListArg` for `--files`.** The existing `parseMultiwordArg` joins tokens into one space-delimited string (right for commit messages, wrong for file lists). Added a sibling `parseListArg` that returns a `string[]` so `commit --files a b c` stages three distinct paths.
- **Pure functions beside CLI wrappers.** `validateSkills`/`resolveModelInternal` return values for direct `node:test` assertions; `cmd*` wrappers add `output()`/`process.exit`. CLI exit-code behavior (0 clean / non-zero violation) is covered separately via `spawnSync` integration tests.

## Deviations from Plan

None affecting scope or behavior. The plan's interface flow was followed exactly. The only mechanical adjustment was authoring `security.cjs`'s zero-width-Unicode regex with explicit `\uXXXX` escapes (literal invisible characters in source corrupted the regex literal across lines) — a syntactic detail, not a scope change.

## Issues Encountered

- The zero-width/invisible-Unicode character class in `sanitizeForPrompt` had to be written with `\uXXXX` escape sequences rather than literal characters: the literal forms include line/paragraph separators (U+2028/U+2029) that break a single-line regex literal across lines. Resolved by writing the file with explicit escapes; verified the function strips ZWSP and neutralizes `[SYSTEM]`/`<system>`/`<<SYS>>`.
- Pre-existing, out-of-scope working-tree changes left untouched (same scope boundary as 01-01/02/03): `.planning/config.json` (orchestrator `_auto_chain_active` flag) and the untracked root `SOVEREIGN.md`. Neither belongs to plan 01-04's file set.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The full non-init engine surface is complete: `state`, `gate`, `commit`, `model`/`resolve-model`, `validate skills`. Plan 05 adds `init <workflow>` at the fresh `// TODO(plan 05): init` marker — it can compose `loadConfig`, `loadState`, `resolveModelInternal`, and the path/exists probes into the single orientation JSON blob the Core Value promises.
- `resolveModelInternal` is ready for `init` to build the `models{}` namespace; `cmdCommit` is ready for skills to commit `.sovereign/` artifacts.
- No blockers.

## Known Stubs

None. The router's only remaining `// TODO(plan 05): init` marker is the planned A→B→C build order (init is layer C), not an unresolved gap — every command this plan owns is fully implemented and tested.

## Self-Check: PASSED
