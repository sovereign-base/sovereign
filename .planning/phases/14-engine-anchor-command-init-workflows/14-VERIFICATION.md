---
phase: 14-engine-anchor-command-init-workflows
verified: 2026-06-09T00:00:00Z
status: passed
score: 4/4 success criteria verified
re_verification: false
---

# Phase 14: Engine Anchor Command + Init Workflows — Verification Report

**Phase Goal:** A zero-dependency engine surface backs anchoring — store, list, and staleness-check external-doc metadata under `.sovereign/external-docs/`, plus orient workflows (`init anchor-docs`, `init verify-self`) for the two M4 skills.
**Verified:** 2026-06-09
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| SC1 | `anchor add` writes `.sovereign/external-docs/<slug>.md` with `source`, `version`, `date-retrieved`, `re-verify-by`, `content-stored` headers; URL-by-default; content only on `--content` opt-in; `re-verify-by` defaults to `date-retrieved + 90d`; slug sanitized; re-add overwrites | VERIFIED | `anchor.cjs` lines 105–223: `buildHeader()`, `cmdAnchorAdd()`, `slugify()`; T1–T5 + slug + required-arg tests all green |
| SC2 | `anchor list` returns header-parsed array; `anchor check` returns `{anchors, stale_count}` flagging `re-verify-by < today` (lexicographic, deterministic); both greenfield-safe | VERIFIED | `cmdAnchorList()` / `cmdAnchorCheck()` lines 235–256; `isStale()` lexicographic compare; T6–T9 all green; greenfield path via `readdir-in-try` |
| SC3 | `init anchor-docs` and `init verify-self` each return one orient JSON blob via `output()` (with `@file:` spill inherited); `verify-self` surfaces `references/unverified-marker.md` | VERIFIED | `init.cjs` `case 'anchor-docs'` (line 372) and `case 'verify-self'` (line 391); `unverified_marker_spec: 'references/unverified-marker.md'` at line 405; T10/T11 + greenfield safety tests green |
| SC4 | `node --test` covers add/list/check (stale, opt-in, greenfield, slug) + both init blobs and PASSES; engine `dependencies` stays `{}` | VERIFIED | 164/164 tests pass; `engine/package.json`: `"dependencies": {}`, `"devDependencies": {}`; T12 guard in anchor.test.cjs |

**Score: 4/4 success criteria verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `engine/bin/lib/anchor.cjs` | anchor add/list/check module mirroring bridge.cjs | VERIFIED | 271 lines; `function cmdAnchorAdd`, `cmdAnchorList`, `cmdAnchorCheck` + pure helpers (`slugify`, `todayISO`, `addDays`, `isStale`, `buildHeader`, `parseAnchor`, `listAnchors`) all exported |
| `engine/test/anchor.test.cjs` | TDD suite for add/list/check/stale/opt-in/greenfield/slug + deps-{} guard | VERIFIED | 421 lines; T1–T9, T12, slug traversal, required-arg, 6 BIN-integration cases; uses `node:assert/strict` |
| `engine/bin/sovereign-tools.cjs` | router case 'anchor' dispatching add/list/check | VERIFIED | `require('./lib/anchor.cjs')` at line 40; `case 'anchor':` at line 411; usage string updated to include `anchor (add|list|check)` |
| `engine/bin/lib/init.cjs` | init anchor-docs + verify-self workflow arms | VERIFIED | `case 'anchor-docs':` at line 372; `case 'verify-self':` at line 391; `unverified_marker_spec: 'references/unverified-marker.md'` |
| `engine/test/init.test.cjs` | buildInit anchor-docs + verify-self blob assertions | VERIFIED | T10 (external_docs_dir, models, project_root, sovereign_version, agents_installed) and T11 (unverified_marker_spec path) plus greenfield safety loop |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `engine/bin/lib/anchor.cjs` | `engine/bin/lib/core.cjs` | `require('./core.cjs')` — `output`/`error`/`safeReadFile` | WIRED | Line 32: `const { output, error, safeReadFile } = require('./core.cjs');` |
| `engine/bin/lib/anchor.cjs` | `engine/bin/lib/state.cjs` | `require('./state.cjs')` — `readField` for header parse | WIRED | Line 33: `const { readField } = require('./state.cjs');`; used in `parseAnchor()` |
| `engine/bin/sovereign-tools.cjs` | `engine/bin/lib/anchor.cjs` | `require + case 'anchor':` dispatch on `args[1]` | WIRED | Line 40 require; lines 411–429 dispatch to `cmdAnchorAdd`/`cmdAnchorList`/`cmdAnchorCheck`; all six named flags passed via `parseNamedArgs` |
| `engine/bin/lib/init.cjs` | init anchor-docs / verify-self blobs | `switch(workflow)` case arms returning blob via `withProjectContext` | WIRED | `case 'anchor-docs':` line 372 and `case 'verify-self':` line 391; no change to `REQUIRED_AGENTS` (correct — neither workflow needs a subagent) |

---

### Data-Flow Trace (Level 4)

Not applicable. Phase 14 delivers a pure Node.js CLI engine module with no browser-side rendering or dynamic UI. All data flows are covered by the deterministic unit and integration tests.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite green | `node --test "test/**/*.test.cjs"` | 164 pass, 0 fail | PASS |
| `anchor add` exits 0 and writes file (via BIN) | CLI integration test in suite | exit 0, file exists | PASS |
| `anchor list` returns array (via BIN) | CLI integration test in suite | exit 0, JSON array | PASS |
| `anchor check` returns `{anchors, stale_count}` (via BIN) | CLI integration test in suite | exit 0, correct shape | PASS |
| Missing `--source` exits non-zero | CLI required-arg test in suite | exit non-zero | PASS |
| Unknown subcommand exits non-zero | CLI unknown-sub test in suite | exit non-zero | PASS |
| `--content @file` round-trips body | CLI content test in suite | body stored verbatim | PASS |
| `dependencies: {}` guard | T12 in anchor.test.cjs | deepEqual `{}` | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ENG-09 | 14-01-PLAN.md | Zero-dependency anchor command (store/list/check-stale external-doc metadata) + init anchor-docs / init verify-self workflows; tested; deps stay `{}` | SATISFIED | `anchor.cjs` + `init.cjs` arms + 164/164 tests pass; `dependencies: {}`; marked `[x] ENG-09` in REQUIREMENTS.md traceability table |

---

### Scope Guards Verified (NOT Violated)

| Guard | Check | Status |
|-------|-------|--------|
| No HTTP/fetch client added to engine | `anchor.cjs` requires only `node:fs`, `node:path`, `./core.cjs`, `./state.cjs` — comments mention "NEVER fetches a URL" (L25) | RESPECTED |
| No copyright-warning logic in engine | No copyright enforcement code in `anchor.cjs` production paths — correctly deferred to skill layer | RESPECTED |
| No skill files added in this phase | Phase commits (c8793b9, 91a2f5c, a841073, bd34c94) touch exactly the 5 engine files declared in the plan | RESPECTED |
| VERSION / package.json version unchanged | `engine/VERSION` = `2.2.0` (unchanged); no commit in phase commits touches VERSION or package.json | RESPECTED |

---

### Anti-Patterns Found

None. `anchor.cjs` has no TODOs, no stubs, no empty return values, no hardcoded empty arrays in production paths. Greenfield empty-return paths (`listAnchors` returning `[]` on a missing dir) are intentional and tested as correct behavior, not stubs.

---

### Human Verification Required

None. All phase behaviors are deterministic FS operations over tmpdir fixtures and are fully covered by automated tests.

---

## Gaps Summary

No gaps. All four success criteria are satisfied:

- SC1: `anchor add` writes the correct `.md` header file with all five headers, URL-only by default, content on opt-in, slug sanitized, overwrite idempotent, `re-verify-by` defaults to +90d.
- SC2: `anchor list` and `anchor check` parse headers correctly, staleness is lexicographic ISO compare, both commands are greenfield-safe.
- SC3: Both init workflows return correct orient blobs; `verify-self` surfaces `references/unverified-marker.md`.
- SC4: 164/164 tests pass; `dependencies: {}` and `devDependencies: {}`.

Phase 14 goal is achieved. The engine substrate is ready for Phase 15 (`anchor-docs` skill) and Phase 16 (`verify-self` skill).

---

_Verified: 2026-06-09_
_Verifier: Claude (gsd-verifier)_
