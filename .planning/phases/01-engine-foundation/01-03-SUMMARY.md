---
phase: 01-engine-foundation
plan: 03
subsystem: engine
tags: [cjs, state-patch, manifest-derivation, token-budget, gate, append-only, node-test, tdd]

# Dependency graph
requires:
  - "01-02: engine/bin/lib/core.cjs (output/@file: spill, loadConfig, safeReadFile, findProjectRoot), sovereign-tools.cjs router with // TODO(plan 03) switch markers"
provides:
  - "engine/bin/lib/state.cjs — stateReplaceField (bold→plain→null), loadState() one-blob {config,state_raw,manifest_raw,*_exists}, patchState() field-level patch + MANIFEST regen trigger, readField() helper, cmdStateLoad/cmdStatePatch"
  - "engine/bin/lib/manifest.cjs — regenerateManifest(cwd): sole writer of .sovereign/MANIFEST.md, derives Phase/Status/Blockers/Next-Action from STATE.md + Key Decisions from docs/adr/, enforces ~500-token budget via chars/4 truncate-then-warn"
  - "engine/bin/lib/gate.cjs — gateOpen/gatePass append-only OPENED/PASSED records to SOVEREIGN.md; cmdGate* error on missing phase"
  - "engine/bin/sovereign-tools.cjs — wired `state load|save|patch` and `gate open|pass <n>` switch cases + parseFieldValuePairs helper"
affects: [01-04, 01-05, sovereign-init, council]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "STATE.md is field-patchable authoritative source; MANIFEST.md is engine-DERIVED, regenerated on every state save (ADR-012) — the one place SOVEREIGN extends GSD"
    - "Field patching lifts GSD's stateReplaceField verbatim: try **Field:** bold pattern first, then plain Field:, return null if absent (caller leaves file unchanged)"
    - "MANIFEST ~500-token budget enforced in code via chars/4 heuristic: truncate Key Decisions table (drop oldest) to a top-3 floor, then append a WARN HTML comment if still over"
    - "Phase gates are append-only (fs.appendFileSync) to SOVEREIGN.md — net-new vs GSD, an audit trail that never overwrites prior records"
    - "state.cjs requires manifest.cjs LAZILY inside patchState() (not at module load) to avoid a require cycle — manifest reads STATE.md, not state.cjs"
    - "Repeatable --field NAME --value V pairs parsed in argument order by parseFieldValuePairs (parseNamedArgs only captures first occurrence)"

key-files:
  created:
    - engine/bin/lib/state.cjs
    - engine/bin/lib/manifest.cjs
    - engine/bin/lib/gate.cjs
    - engine/test/state.test.cjs
    - engine/test/gate.test.cjs
  modified:
    - engine/bin/sovereign-tools.cjs

key-decisions:
  - "Exposed pure functions (loadState/patchState/gateOpen/gatePass) alongside the cmd* CLI wrappers so node:test can assert return values directly without intercepting stdout or process.exit"
  - "patchState always calls regenerateManifest even when zero fields matched, so MANIFEST.md stays in sync with disk on every save regardless of patch hit-rate"
  - "MANIFEST derivation drops the hardcoded [project-name]/[github-url] placeholders from the template (no authoritative source for them yet); Stack quick-ref table omitted until a stack source exists (deferred, not stubbed into MANIFEST)"

requirements-completed: [ENG-02, ENG-03, STATE-02]

# Metrics
duration: 9min
completed: 2026-06-08
---

# Phase 1 Plan 03: Engine Layer B — State Patch, Derived MANIFEST, Append-Only Gates Summary

**The context-reset survival layer: field-level `**Field:**` STATE.md patching (no whole-file rewrites), a derived MANIFEST.md regenerated on every save under a code-enforced ~500-token budget (the one place SOVEREIGN extends GSD), and append-only phase gates in SOVEREIGN.md — all lifted from GSD's shapes, retargeted to `.sovereign/`, and covered by a 21-test passing `node:test` suite (two TDD cycles).**

## Performance

- **Duration:** ~9 min
- **Tasks:** 3 (2 TDD)
- **Files:** 5 created, 1 modified

## Accomplishments

- **state.cjs** — `stateReplaceField(content, field, value)` lifted verbatim from GSD (bold `**Field:**` pattern first, then plain `Field:`, returns `null` if absent so the caller leaves the file unchanged), plus a local `escapeRegex`. `loadState(cwd)` reads STATE.md/MANIFEST.md/SOVEREIGN.md via `safeReadFile` + `loadConfig` and returns one blob `{config, state_raw, manifest_raw, state_exists, manifest_exists, sovereign_exists}` (missing files → empty string + `false`, never throws). `patchState(cwd, patches)` applies each `{field,value}`, collects a warning for absent fields, writes back only if something changed, then triggers `regenerateManifest`. `readField` (capture-group-2 reader) is exported for manifest.cjs. `cmdStateLoad`/`cmdStatePatch` are thin `output()` wrappers.
- **manifest.cjs** — `regenerateManifest(cwd)` is the SOLE writer of `.sovereign/MANIFEST.md` (ADR-012). It derives Phase / Gate Status / Blockers / Next Recommended Action from STATE.md and a Key Decisions quick-ref (top-8 ADR titles) from `docs/adr/` (falling back to `.sovereign/docs/adr/`). The ~500-token budget is enforced in code: `estimateTokens = Math.ceil(str.length / 4)`; if over, the Key Decisions table is truncated oldest-first down to a top-3 floor, then a `<!-- WARN: MANIFEST over 500-token budget -->` comment is appended if still over. Returns `{written, est_tokens, truncated, over_budget}`.
- **gate.cjs** — `gateOpen`/`gatePass` `fs.appendFileSync` a `### Gate: Phase <n> — OPENED|PASSED <ISO-ts>` block to SOVEREIGN.md (append-only; prior content untouched). `cmdGateOpen`/`cmdGatePass` `error()` (exit 1) when no phase is given.
- **sovereign-tools.cjs** — replaced the `// TODO(plan 03)` marker with real `case 'state':` (sub-dispatch `load` → `cmdStateLoad`; `save`/`patch` → `parseFieldValuePairs` → `cmdStatePatch`) and `case 'gate':` (`open`/`pass <n>` → `cmdGate*`). Added `parseFieldValuePairs` (repeatable `--field`/`--value` pairs in order) and left a fresh `// TODO(plan 04)` marker for commit/model/validate/init.
- **Tests** — `state.test.cjs` (8 tests: bold/plain/absent field patch, load-blob shape, `*_exists` false-when-absent, byte-stable multi-field patch, absent-field warning, MANIFEST-reflects-patch) and `gate.test.cjs` (7 tests: append-only open, open-then-pass ordering, CLI both-records integration, no-phase exit non-zero, CLI `state load` returns state_raw/manifest_raw, CLI `state patch` + MANIFEST regen). Full suite = 21 passing (smoke 1 + core 6 + state 8 + gate 6... [gate file holds 7, core 6, state 8, smoke 0 visible]), exit 0.

## Task Commits

1. **Task 1 (TDD): state.cjs — load + field-level patch**
   - RED `a087419` (test) → GREEN `09cda55` (feat)
2. **Task 2: manifest.cjs — derived MANIFEST under ~500-token budget** — `32bbc11` (feat)
3. **Task 3 (TDD): gate.cjs append-only + wire switch cases**
   - RED `8d7a3e3` (test) → GREEN `b2d5c54` (feat)

## Files Created/Modified

- `engine/bin/lib/state.cjs` — created: load blob + field patch + MANIFEST trigger
- `engine/bin/lib/manifest.cjs` — created: derived MANIFEST regen under token budget
- `engine/bin/lib/gate.cjs` — created: append-only gate open/pass
- `engine/bin/sovereign-tools.cjs` — modified: wired state/gate switch cases + parseFieldValuePairs
- `engine/test/state.test.cjs` — created: state load/patch/MANIFEST-regen suite
- `engine/test/gate.test.cjs` — created: gate append + CLI integration suite

## Decisions Made

- **Pure functions beside CLI wrappers.** `loadState`/`patchState`/`gateOpen`/`gatePass` return values; `cmdStateLoad`/`cmdStatePatch`/`cmdGate*` add `output()`/`error()`/exit. This lets `node:test` assert return shapes directly (no stdout interception, no child process for unit-level checks) while the CLI path stays a thin shell. CLI behavior is still covered by `execFileSync`/`spawnSync` integration tests.
- **MANIFEST always regenerated on save.** `patchState` calls `regenerateManifest` even when zero fields matched, guaranteeing MANIFEST.md tracks disk on every `state save` rather than only on successful patches.
- **Lazy require to dodge a cycle.** state.cjs requires manifest.cjs inside `patchState` (runtime), not at module top, because manifest.cjs requires state.cjs (`readField`). A top-level cycle would leave one export half-initialized.
- **No stubbed placeholders carried into derived MANIFEST.** The template's `[project-name]`/`[github-url]` and the Stack quick-ref table have no authoritative source yet, so the regenerated MANIFEST omits them rather than emitting placeholder text (avoids a stub flowing into the orientation doc). They return when sovereign-init / a stack source exists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1's `node --test test/state.test.cjs` cannot pass without manifest.cjs**
- **Found during:** Task 1
- **Issue:** Task 1's acceptance includes `require('./manifest.cjs')` and a test asserting MANIFEST regeneration after a patch, but manifest.cjs is Task 2's artifact. Running Task 1's suite in isolation before Task 2 fails the patch-flow tests with MODULE_NOT_FOUND.
- **Fix:** Implemented manifest.cjs (Task 2) immediately after state.cjs so the patch→regen path resolves; the three patch tests then pass. Tasks remained committed separately (state.cjs in Task 1's commit, manifest.cjs in Task 2's) — the plan's own `key_links` declare state save → regenerateManifest, so this is the intended ordering, not a scope change.
- **Files modified:** none beyond planned artifacts.
- **Commit:** `09cda55` (state) + `32bbc11` (manifest)

## Issues Encountered

- Pre-existing, out-of-scope working-tree changes left untouched (same scope boundary as 01-01/01-02): `.planning/config.json` (orchestrator `_auto_chain_active` flag) and the untracked root `SOVEREIGN.md`. Neither belongs to plan 01-03's file set.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 04 can add `commit`, `resolve-model`, `model`, `validate`, and `init <workflow>` at the fresh `// TODO(plan 04)` markers; `loadState`/`patchState` produce the `state_raw`/`manifest_raw` that plan 05's `init` contract surfaces.
- `regenerateManifest` is wired into every `state save`, so any future command that patches STATE.md gets a fresh MANIFEST for free.
- No blockers.

## Known Stubs

None. The Stack quick-ref and project-name/repository fields are intentionally absent from the derived MANIFEST (no authoritative source exists yet); this is documented as a decision above, not an unresolved stub — MANIFEST derives only what STATE.md and docs/adr/ authoritatively provide.

## Self-Check: PASSED
