---
phase: 01-engine-foundation
verified: 2026-06-08T17:25:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 1: Engine Foundation Verification Report

**Phase Goal:** A skill can orient itself with a single CLI call — `sovereign-tools init <workflow>` returns resolved models, config, phase status, and file paths+existence as one JSON blob — backed by a committed `.sovereign/` state model the engine reads and regenerates. Zero-dependency `.cjs`, no build step.
**Verified:** 2026-06-08T17:25:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                        | Status     | Evidence                                                                                                                                                                              |
|----|----------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | `init <workflow>` returns one nested JSON blob with models/config/phase/context_injection/paths/exists/agents_installed/missing_agents | ✓ VERIFIED | `init council` live run returns all 10 top-level fields; all 6 namespace keys confirmed present. `--pick models.advisor` with quality profile returns `opus`. |
| 2  | Payloads >50KB spill to `@file:` tmpfile                                                     | ✓ VERIFIED | `core.test.cjs` test "output() spills >50KB results to a tmpfile and emits @file:<path>" passes. `core.cjs` threshold at 50000 chars confirmed in source.                            |
| 3  | `state load` returns one blob; `state patch` does field-level `**Field:**` editing + regenerates MANIFEST | ✓ VERIFIED | Live run: `state load` returns `state_raw`, `manifest_raw`, `*_exists` booleans. `state patch --field Phase --value 2` returns `{patched:1, manifest_regenerated:true}`.              |
| 4  | MANIFEST.md stays within ~500 tokens, regenerated on every state save                       | ✓ VERIFIED | Live MANIFEST measured at 207 estimated tokens (829 chars / 4). `manifest.cjs` enforces budget with truncation + `<!-- WARN -->` comment if still over.                              |
| 5  | `gate open`/`gate pass <phase>` append-only to SOVEREIGN.md                                 | ✓ VERIFIED | Live run: `gate open 1` then `gate pass 1` both return `{appended:true}`. SOVEREIGN.md shows both `OPENED` and `PASSED` records without overwriting prior content.                   |
| 6  | `commit` is gated on `commit_docs` + gitignore, sanitizes message, returns short hash        | ✓ VERIFIED | `commit.cjs` sources confirm double-gating. Tests pass for `commit_docs:false` skip, gitignored skip, and happy-path hash return. `sanitizeForPrompt` called before git commit.      |
| 7  | `model <agent>` resolves per profile: quality→advisor=opus; fallback=sonnet                  | ✓ VERIFIED | Live: `model advisor --cwd <quality-project>` returns `{"agent":"advisor","model":"opus"}`. `--pick models.advisor` from `init council` also returns `opus` under quality.           |
| 8  | `validate skills` exits non-zero on bad SKILL.md (uppercase, underscore, or 'claude' in name) | ✓ VERIFIED | Two live runs: uppercase/underscore name flagged `format` violation, exit 1. `claude-helper` name flagged `reserved` violation, exit 1. Clean skill returns exit 0.                 |
| 9  | Zero-dependency `.cjs`, no build step; `node --test` passes; `npm pack` clean-install smoke test passes | ✓ VERIFIED | `npm test` output: 52 tests, 0 failures, 0 skipped. `package.json` `dependencies: {}` and `devDependencies: {}`. `pack-smoke.test.cjs` runs `npm pack` → tarball install → installed `init council` → verifies shebang, templates/sovereign/STATE.md present. |
| 10 | `.sovereign/` template tree complete (MANIFEST, SOVEREIGN, CONTEXT, STATE, config.json, docs/, council/, external-docs/, extensions/) | ✓ VERIFIED | Both `engine/templates/sovereign/` (shipped with package) and `templates/sovereign/` (repo root) contain full directory tree: 5 files + docs/{adr,api,specs,security,infra,intersections}/, council/, external-docs/, extensions/. |

**Score:** 10/10 truths verified

---

### Required Artifacts

| Artifact                             | Expected                                    | Status     | Details                                                 |
|--------------------------------------|---------------------------------------------|------------|---------------------------------------------------------|
| `engine/bin/sovereign-tools.cjs`     | Router with all 7 command cases             | ✓ VERIFIED | All switch cases present: version, state, gate, commit, model, resolve-model, validate, init. Shebang on line 1. |
| `engine/bin/lib/core.cjs`            | output() @file: spill, loadConfig, execGit, isGitIgnored | ✓ VERIFIED | All exported. 50KB threshold code confirmed. `execGit` + `isGitIgnored` added in plan 04. |
| `engine/bin/lib/model-profiles.cjs`  | MODEL_PROFILES with quality=opus for reasoning agents | ✓ VERIFIED | advisor/chairman/peer_reviewer/planner = opus under quality. VALID_PROFILES derived from table. |
| `engine/bin/lib/state.cjs`           | stateReplaceField, loadState, patchState (triggers MANIFEST regen) | ✓ VERIFIED | All exported. Lazy require of manifest.cjs inside patchState to avoid circular dep. |
| `engine/bin/lib/manifest.cjs`        | regenerateManifest, ~500-token budget enforced | ✓ VERIFIED | Sole writer of MANIFEST.md. Budget enforcement via chars/4 + truncation + WARN comment. |
| `engine/bin/lib/gate.cjs`            | gateOpen/gatePass append-only               | ✓ VERIFIED | Uses `fs.appendFileSync`. Errors (exit 1) when no phase given. |
| `engine/bin/lib/commit.cjs`          | Double-gated commit, sanitized message, returns hash | ✓ VERIFIED | commit_docs gate + isGitIgnored gate. sanitizeForPrompt called. Returns {committed, hash, reason}. |
| `engine/bin/lib/model.cjs`           | resolveModelInternal (override→omit→profile→sonnet) | ✓ VERIFIED | Verbatim GSD resolution order. cmdResolveModel outputs {agent, model}. |
| `engine/bin/lib/validate.cjs`        | SKILL.md linter (name ≤64, lowercase-hyphen, no claude/anthropic; desc ≤1024) | ✓ VERIFIED | All four rules implemented. Auto-discovers skills/** and .claude/skills/**. Outputs JSON then exit(1) on violation. |
| `engine/bin/lib/init.cjs`            | buildInit returns nested blob for council/sovereign-init/fast-lane | ✓ VERIFIED | All three workflow cases handled. withProjectContext wraps project_root, sovereign_version, agents_installed (hardcoded true for M1, documented TODO Phase 2), missing_agents. |
| `engine/bin/lib/security.cjs`        | sanitizeForPrompt strips zero-width Unicode + neutralizes injection markers | ✓ VERIFIED | Strips U+200B–U+200F, U+2028/U+2029, BOM, soft-hyphen. Neutralizes <system>, [SYSTEM], <<SYS>>. |
| `engine/templates/sovereign/`        | Full .sovereign/ seed tree (5 files + 10 subdirs) | ✓ VERIFIED | Both engine/templates/ and repo-root templates/ have complete tree. Package files allowlist includes `templates`. |
| `engine/test/pack-smoke.test.cjs`    | npm pack → tarball install → run installed init council | ✓ VERIFIED | Uses npm pack NOT npm link. Asserts blob shape, shebang on installed bin, templates/sovereign/STATE.md present. |
| `engine/README.md`                   | Command surface reference                   | ✓ VERIFIED | Present. Documents all 8 command surface entries, @file: convention, --pick/--raw/--cwd flags. |
| `docs/adr/ADR-002..ADR-013`          | Six locked Phase-1 ADRs                     | ✓ VERIFIED | All 6 files present: ADR-002, 009, 010, 011, 012, 013. |

---

### Key Link Verification

| From                    | To                           | Via                                        | Status     | Details                                                   |
|-------------------------|------------------------------|--------------------------------------------|------------|-----------------------------------------------------------|
| `sovereign-tools.cjs`   | `init.cjs`                   | `require('./lib/init.cjs')` + case 'init'  | ✓ WIRED    | Line 30 require, line 332 dispatch to cmdInit             |
| `init.cjs`              | `model.cjs`                  | `resolveModelInternal`                     | ✓ WIRED    | Imported line 34; called for advisor/chairman/peer_reviewer in council case |
| `init.cjs`              | `state.cjs`                  | `readField`                                | ✓ WIRED    | Imported line 35; called in readState() to parse STATE.md fields |
| `init.cjs`              | `core.cjs`                   | `output, error, loadConfig, safeReadFile`  | ✓ WIRED    | Imported line 32; all four used in buildInit/cmdInit      |
| `state.cjs`             | `manifest.cjs`               | lazy `require('./manifest.cjs')` inside patchState | ✓ WIRED | Lazy to avoid circular dep. Confirmed in source + test.  |
| `commit.cjs`            | `security.cjs`               | `sanitizeForPrompt`                        | ✓ WIRED    | Imported line 5 of commit.cjs; called before git commit  |
| `commit.cjs`            | `core.cjs`                   | `execGit, isGitIgnored`                    | ✓ WIRED    | Used for gitignore gate and git add/commit/rev-parse      |
| `model.cjs`             | `model-profiles.cjs`         | `MODEL_PROFILES`                           | ✓ WIRED    | Imported; used in resolveModelInternal profile lookup     |
| `output()` >50KB        | tmpfile `@file:` path        | `json.length > 50000` in core.cjs          | ✓ WIRED    | Threshold confirmed. Test verifies 60KB blob round-trips  |
| `--pick` router         | `extractField` over spill    | monkeypatched `fs.writeSync` + @file: read | ✓ WIRED    | Confirmed in sovereign-tools.cjs lines 218-247            |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers a CLI engine with no UI components rendering dynamic data. All outputs are JSON blobs written to stdout, verified by tests and live runs above.

---

### Behavioral Spot-Checks

| Behavior                                         | Command                                                        | Result                                                   | Status  |
|--------------------------------------------------|----------------------------------------------------------------|----------------------------------------------------------|---------|
| `init council` returns nested blob               | `node sovereign-tools.cjs init council --cwd /tmp/empty`       | All 10 top-level keys present, exit 0                    | ✓ PASS  |
| `--pick models.advisor` extracts from nested blob | `init council --pick models.advisor --cwd <quality-project>`   | Returns `opus` (bare string)                             | ✓ PASS  |
| `state load` returns one-blob                    | `node sovereign-tools.cjs state load --cwd <seeded-project>`   | state_raw, manifest_raw, all *_exists booleans confirmed | ✓ PASS  |
| `state patch` triggers MANIFEST regen            | `state patch --field Phase --value 2 --cwd <seeded>`           | `{patched:1, manifest_regenerated:true}`                 | ✓ PASS  |
| `gate open/pass` appends to SOVEREIGN.md         | `gate open 1` then `gate pass 1`                               | Both OPENED and PASSED records in SOVEREIGN.md           | ✓ PASS  |
| `model advisor` under quality profile            | `model advisor --cwd <quality-config-project>`                 | `{"agent":"advisor","model":"opus"}`                     | ✓ PASS  |
| `validate skills` exits non-zero on violation    | `validate skills` with uppercase/underscore name               | exit code 1, violation JSON printed first                | ✓ PASS  |
| `validate skills` exits non-zero on 'claude' name | `validate skills` with name `claude-helper`                   | exit code 1, reserved word violation                     | ✓ PASS  |
| Full test suite                                  | `cd engine && npm test`                                        | 52 tests, 0 failures, 0 skipped                          | ✓ PASS  |
| `npm pack` clean-install smoke test              | Included in `npm test` as `pack-smoke.test.cjs`                | Installs tarball, runs installed bin, asserts shebang + templates | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                    | Status     | Evidence                                                         |
|-------------|-------------|--------------------------------------------------------------------------------|------------|------------------------------------------------------------------|
| ENG-01      | 01-05       | `init <workflow>` returns single JSON blob with >50KB spill                    | ✓ SATISFIED | Live run + init.test.cjs 13 tests all pass                      |
| ENG-02      | 01-03       | `state load`/`save` with field-level patching (no whole-file rewrites)          | ✓ SATISFIED | stateReplaceField lifts GSD pattern; patchState confirmed        |
| ENG-03      | 01-03       | `gate open`/`pass` append-only to SOVEREIGN.md                                 | ✓ SATISFIED | fs.appendFileSync confirmed in gate.cjs; live run verified       |
| ENG-04      | 01-04       | `commit` respects commit_docs + gitignore, sanitizes message, returns hash      | ✓ SATISFIED | Double-gating in commit.cjs; sanitizeForPrompt called; tests pass |
| ENG-05      | 01-04       | `model <agent>` resolves per profile                                            | ✓ SATISFIED | Quality profile returns opus for advisor/chairman/peer_reviewer   |
| ENG-06      | 01-01/01-05 | Zero-dep `.cjs`, `node --test` passes, `npm pack` smoke test succeeds           | ✓ SATISFIED | dependencies:{}, devDependencies:{}; 52 tests pass; pack-smoke passes |
| ENG-07      | 01-04       | `validate skills` lints SKILL.md, exits non-zero on violations                 | ✓ SATISFIED | Four rules enforced; exit(1) on violation; output before exit    |
| STATE-01    | 01-01       | `.sovereign/` tree: MANIFEST, SOVEREIGN, CONTEXT, STATE, config.json, docs/    | ✓ SATISFIED | Full tree in engine/templates/sovereign/ and repo-root templates/ |
| STATE-02    | 01-03       | MANIFEST regenerated on every state save, ~500-token budget enforced            | ✓ SATISFIED | regenerateManifest called in patchState; live MANIFEST = 207 tokens |
| STATE-03    | 01-04       | `.sovereign/` committed to git by default; engine skips if gitignored           | ✓ SATISFIED | isGitIgnored gate in commit.cjs; skips silently (never errors)   |

All 10 Phase-1 requirements satisfied.

---

### Anti-Patterns Found

One intentional known stub, explicitly scoped and documented:

| File              | Line | Pattern                                  | Severity | Impact                                                                                    |
|-------------------|------|------------------------------------------|----------|-------------------------------------------------------------------------------------------|
| `init.cjs`        | 162  | `agents_installed: true // TODO(Phase 2)` | ℹ INFO   | Shape present per spec (CONTEXT.md §1371 "guard shape must exist now"); real check deferred to Phase 2 when subagent definitions ship. Not a blocker. |

No placeholder components, empty implementations, or unintentional stubs detected across the 10 library modules.

---

### Human Verification Required

None. All acceptance criteria for this phase are fully verifiable programmatically via the test suite and CLI spot-checks. Phase 2 (skill UI, `npx sovereign init` user flow) will require human verification.

---

## Gaps Summary

No gaps. All 10 Phase-1 requirements verified against the actual codebase:

- The test suite runs clean: 52 tests, 0 failures, including the `npm pack` clean-install smoke test that exercises the full packaging chain (never `npm link`).
- `init council` live run confirms the full nested blob contract with all specified namespaces.
- `--pick` field extraction verified end-to-end over the nested shape.
- `@file:` spill threshold verified in tests (60KB blob round-trips through tmpfile).
- `state patch` + MANIFEST regeneration verified live; MANIFEST budget at 207 tokens (well under 500).
- `gate open`/`gate pass` append-only writes confirmed in SOVEREIGN.md.
- `model advisor` quality-profile resolution returns `opus` as specified.
- `validate skills` exits non-zero on all four violation types (length, format, reserved word, description cap).
- Zero runtime dependencies confirmed in package.json.
- Complete `.sovereign/` template tree present in both `engine/templates/sovereign/` (the packaged copy) and `templates/sovereign/` (the repo copy seeded by plan 01-01).

The `agents_installed: true` hardcoded value in `init.cjs` is documented as `TODO(Phase 2)` in source and was explicitly scoped to M1 in CONTEXT.md: "the guard SHAPE must exist now so orchestrators can branch on missing subagents; the real filesystem check lands in Phase 2." This is a correctly deferred design decision, not an unresolved gap.

**Phase 1 goal is fully achieved.** An agent can call `sovereign-tools init council` and receive the complete orientation blob in one CLI call with zero file reads required.

---

_Verified: 2026-06-08T17:25:00Z_
_Verifier: Claude (gsd-verifier)_
