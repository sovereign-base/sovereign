---
phase: 14
slug: engine-anchor-command-init-workflows
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-09
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from the "## Validation Architecture" section of `14-RESEARCH.md` and the Phase 14 success criteria (ENG-09).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert/strict` (built-in; zero-dep — matches CLAUDE.md) |
| **Config file** | none — built into Node ≥ 20 |
| **Quick run command** | `cd engine && node --test test/anchor.test.cjs` |
| **Full suite command** | `cd engine && node --test "test/**/*.test.cjs"` |
| **Estimated runtime** | ~9 seconds (full suite; quick file < 1s) |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the file touched (`node --test test/anchor.test.cjs` or `test/init.test.cjs`)
- **After every plan wave:** Run the full suite
- **Before completion/verify:** Full suite must be green (currently 138 baseline + new)
- **Max feedback latency:** ~9 seconds

---

## Per-Requirement Verification Map

ENG-09 is the sole phase requirement. Each test case below maps to a Phase 14 success criterion (SC1–SC4). Plan task IDs are wired by the planner; test files are created in Wave 0 of this phase (TDD).

| # | Behavior under test | SC | Test Type | Automated Command | File |
|---|---------------------|----|-----------|-------------------|------|
| T1 | `anchor add` writes `<slug>.md` with all 4 headers (`source`, `version`, `date-retrieved`, `re-verify-by`) | SC1 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T2 | URL-only by default; content body absent without opt-in | SC1 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T3 | Content stored only on opt-in (`--content @file` / `-`); `content-stored` header reflects it | SC1 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T4 | Re-adding same `--id` overwrites (idempotent update) | SC1 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T5 | `re-verify-by` defaults to `date-retrieved + 90d` when omitted; explicit `--re-verify-by` honored | SC1 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T6 | `anchor list` returns anchored docs parsed from headers (header-only, never body) | SC2 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T7 | `anchor list` greenfield-safe → empty array when no `external-docs/` | SC2 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T8 | `anchor check` flags `re-verify-by < today` as stale; `>= today` NOT stale (deterministic w/ fixed dates) | SC2 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T9 | `anchor check` greenfield-safe → clean empty result, no crash | SC2 | unit | `node --test test/anchor.test.cjs` | anchor.test.cjs |
| T10 | `init anchor-docs` returns a valid JSON blob with expected fields (paths/config/exists) via `output()` | SC3 | unit | `node --test test/init.test.cjs` | init.test.cjs |
| T11 | `init verify-self` returns a valid JSON blob incl. the `unverified-marker.md` spec path + external-docs path | SC3 | unit | `node --test test/init.test.cjs` | init.test.cjs |
| T12 | Engine `dependencies` stays `{}` (regression guard) | SC4 | unit | `node --test test/*.test.cjs` | (existing deps guard or anchor.test.cjs) |

---

## Wave 0 Requirements

- [ ] `engine/test/anchor.test.cjs` — new test file covering T1–T9, T12 (tmpdir fixture style mirroring `adopt.test.cjs`/`bridge.test.cjs`)
- [ ] Extend `engine/test/init.test.cjs` — add T10/T11 for the two new init workflows
- [ ] No framework install — `node:test` is built in

*All Phase 14 behavior is pure FS + arg-parsing over a tmpdir; fully automatable.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none) | — | — | All phase behaviors have automated verification. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (anchor.test.cjs, init.test.cjs extension)
- [ ] No watch-mode flags (`node --test` runs once, exits)
- [ ] Feedback latency < 9s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
