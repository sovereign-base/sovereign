---
phase: 14-engine-anchor-command-init-workflows
plan: 01
subsystem: infra
tags: [engine, cjs, node-test, anchoring, external-docs, staleness, init, zero-dep]

# Dependency graph
requires:
  - phase: 10-m3-engine (bridge/adopt/extension)
    provides: the cmd*-module + router + init-arm skeleton this plan mirrors (bridge.cjs, sovereign-tools.cjs case 'bridge', init.cjs case 'bridge'/'adopt')
  - phase: 01-engine-foundation
    provides: core.cjs output()/error()/safeReadFile, state.cjs readField, sovereign-tools.cjs parseNamedArgs
provides:
  - "anchor add|list|check engine substrate over .sovereign/external-docs/ (anchor.cjs)"
  - "router case 'anchor' dispatching add|list|check with required-source + unknown-sub error gates"
  - "init anchor-docs orient blob (paths.external_docs_dir)"
  - "init verify-self orient blob (external_docs_dir + unverified_marker_spec: references/unverified-marker.md)"
  - "deterministic staleness math (re-verify-by < today, lexicographic ISO) computed from stored dates"
affects: [15-anchor-docs-skill, 16-verify-self-skill]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "anchor.cjs is a near-line-for-line analog of bridge.cjs (pure helpers → cmd*(cwd,...,raw) → module.exports)"
    - "first engine module that WRITES under .sovereign/ via fs.mkdirSync({recursive}) + fs.writeFileSync (bridge/adopt are read-only)"
    - "slug sanitization ([a-z0-9-] only) makes path.join(dir, slug+'.md') traversal-proof"
    - "shipped-package-relative asset path convention: references/unverified-marker.md (no engine/ prefix, forward slashes)"

key-files:
  created:
    - engine/bin/lib/anchor.cjs
    - engine/test/anchor.test.cjs
  modified:
    - engine/bin/sovereign-tools.cjs
    - engine/bin/lib/init.cjs
    - engine/test/init.test.cjs

key-decisions:
  - "Staleness = lexicographic ISO compare (re-verify-by < today, strict past; equal-to-today NOT stale) — deterministic, timezone-free"
  - "verify-self marker-spec path is the shipped-package-relative string references/unverified-marker.md (package.json ships references/ at root), establishing the shipped-asset-path convention for init blobs"
  - "--content presence IS the content opt-in (URL-by-default); supports @file / - (stdin) / literal; --store-content kept as a harmless boolean flag"
  - "anchor list returns an array (extractField supports arr[i] for --pick); anchor check returns {anchors, stale_count} object with summary count"

patterns-established:
  - "Engine write-module: mirror bridge.cjs read-module shape but add fs.mkdirSync(recursive)+writeFileSync; reuse readField for header parse, never a new parser"
  - "Greenfield-safe listing via readdir-in-try → [] (mirrors init.cjs relevantAdrs)"

requirements-completed: [ENG-09]

# Metrics
duration: 4min
completed: 2026-06-09
---

# Phase 14 Plan 01: Engine `anchor` command + init workflows Summary

**Zero-dependency `anchor add|list|check` substrate over `.sovereign/external-docs/` (URL-by-default storage, opt-in content, lexicographic staleness) plus `init anchor-docs`/`verify-self` orient blobs — a line-for-line mirror of the bridge.cjs skeleton.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-09T17:14:34Z
- **Completed:** 2026-06-09T17:18:22Z
- **Tasks:** 5
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `engine/bin/lib/anchor.cjs`: `anchor add` writes `<slug>.md` with `source`/`version`/`date-retrieved`/`re-verify-by`/`content-stored` bold-markdown headers; URL-by-default; content stored only on `--content` opt-in (`@file`/`-`/literal); `re-verify-by` defaults to `date-retrieved + 90d`; slug sanitized so it cannot escape the dir; re-add overwrites idempotently.
- `anchor list` returns the header-parsed array (reusing `readField`); `anchor check` returns `{anchors, stale_count}` flagging `re-verify-by < today` deterministically. Both greenfield-safe (no `external-docs/` → clean empty result).
- Router `case 'anchor'` wired (`parseNamedArgs` for `add`; required-source + unknown-subcommand exit non-zero via `error()`); usage string updated.
- `init anchor-docs` and `init verify-self` orient blobs added to `buildInit` (no `REQUIRED_AGENTS` change); `verify-self` surfaces `references/unverified-marker.md`.
- Full engine suite green: 164 tests pass (143 baseline + 21 new); `dependencies`/`devDependencies` both `{}`.

## Task Commits

1. **Task 1 (RED): failing anchor suite** - `c8793b9` (test)
2. **Task 2 (GREEN): anchor.cjs substrate** - `91a2f5c` (feat)
3. **Task 3: router case 'anchor' + BIN integration tests** - `a841073` (feat)
4. **Task 4: init anchor-docs + verify-self arms + tests** - `bd34c94` (feat)
5. **Task 5: full-suite green gate + deps-{} confirmation** - no code change (verification gate; T12 deps guard already in anchor.test.cjs from Task 1)

_TDD: Task 1 (RED) and Task 2 (GREEN) are separate commits per the tdd flow._

## Files Created/Modified
- `engine/bin/lib/anchor.cjs` - the anchor add|list|check module (pure helpers slugify/todayISO/addDays/isStale/buildHeader/parseAnchor/listAnchors + cmd*); requires only node:fs/node:path/./core.cjs/./state.cjs.
- `engine/test/anchor.test.cjs` - T1–T9 + T12 + slug/required-source unit tests + 6 BIN-integration cases.
- `engine/bin/sovereign-tools.cjs` - require anchor.cjs; `case 'anchor'` dispatch; usage string.
- `engine/bin/lib/init.cjs` - `case 'anchor-docs'` + `case 'verify-self'` arms in `buildInit`.
- `engine/test/init.test.cjs` - T10/T11 + greenfield safety for both new workflows.

## Decisions Made
- Lexicographic ISO compare for staleness (deterministic, no `Date` in the compare path; `addDays` uses `Date.UTC` only for the +90d arithmetic).
- `verify-self` marker-spec path is the shipped-package-relative `references/unverified-marker.md` (per RESEARCH Open Q4, locked) — sets the shipped-asset-path convention for init blobs.
- `--content` presence = opt-in; URL-only by default.
- `list` → array, `check` → `{anchors, stale_count}` object.

## Deviations from Plan

None - plan executed exactly as written.

The only nuance: the plan's Task 1 included a required-source spawnSync test routed through the BIN, which by definition cannot pass until the router is wired in Task 3 (at the Task 2 GREEN checkpoint the BIN returned `not_implemented` for `anchor`). This is inherent TDD ordering, not a deviation — all 11 pure-module tests were green at Task 2, and the 12th (the BIN route) plus the 6 added integration cases all passed once Task 3 wired the router. The final full suite is fully green.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ENG-09 engine surface is complete and tested. Phase 15 (`anchor-docs` skill) can wrap `init anchor-docs` + `anchor add|list`; Phase 16 (`verify-self` skill) can wrap `init verify-self` + `anchor check` and read the marker spec at `references/unverified-marker.md`.
- VERSION/package.json version intentionally unchanged (bumped at milestone completion, not per-phase).
- No blockers.

## Self-Check: PASSED

- FOUND: engine/bin/lib/anchor.cjs
- FOUND: engine/test/anchor.test.cjs
- FOUND commits: c8793b9 (RED test), 91a2f5c (anchor.cjs), a841073 (router), bd34c94 (init arms)
- Full suite green: 164/164, deps {} confirmed

---
*Phase: 14-engine-anchor-command-init-workflows*
*Completed: 2026-06-09*
