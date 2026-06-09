---
phase: 16
plan: "16-01"
status: complete
requirements: [VERIFY-01, VERIFY-02, ANCHOR-02, M4-CC]
completed: 2026-06-09
---

# Phase 16 / Plan 16-01 — Summary

**Objective:** Hand-author the `verify-self` capstone skill — hard-stop → retroactive audit → forced 3-way resolution — closing the anchor→verify→sentinel loop.

## What shipped

- **`engine/skills/verify-self/SKILL.md`** (80 lines) — core-tier thin orchestrator mirroring `anchor-docs`/`bridge`:
  - **Hard stop first** (step 1): stop writing new code before auditing.
  - **One-call orient** (`init verify-self` + `@file:` guard); parses `paths.unverified_marker_spec` + `external_docs_dir`. Literal `.claude/sovereign-engine/sovereign-tools.cjs` path (no `$ENGINE`).
  - **Boundary** (the flagged design question, resolved): most-recent `date_retrieved` from `anchor list` + git (`status`/`diff`/`log --since`/`diff <since>..HEAD`); no-anchors case = audit all un-anchored branch work.
  - **Retroactive audit** surfaces each unverified claim as `file:line` + what's uncertain, mapped to the 3 marker-spec signal classes. **Never silently continues.**
  - **Three choices (VERIFY-02):** (A) hand off to `/anchor-docs`; (B) write a `SOVEREIGN:UNVERIFIED` marker in the **exact** spec form (`<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>`, with a worked JS example) that `/sentinel` scans; (C) discard (conservative `git restore`/`stash`) + re-implement against an anchored doc.
  - **Loop closed** (ANCHOR-02): footer ties anchor-docs (ground truth) → verify-self (catch drift) → sentinel (scan markers); names anchor-docs' stale-anchor surfacing.
  - `disable-model-invocation: true`; the agent recognizes the 3 low-confidence signals and runs the flow (reconciles VERIFY-01 "agent can trigger" with user-invoked listing).

## Verification (gates, run from `engine/`)

- Structural/behavior G1–G14: all pass (exists; 80 ≥ 70 lines; `disable-model-invocation: true`; required sections + `▶ NEXT` footer; no v1 fields; literal engine path, no `$ENGINE`; one-call orient; hard stop; `file:line` audit; A/B/C choices; anchor-docs handoff; exact `SOVEREIGN:UNVERIFIED — ` marker; never-silently-continue; sentinel).
- `validate skills skills/verify-self/SKILL.md` → `{ valid: true, violations: [] }`.
- `doctor` → `total_skills: 18, auto_count: 5, disabled_count: 13, ok: true` — **auto-trigger budget held at 5** (M4-CC).
- Regression: `node --test "test/**/*.test.cjs"` → 164/164 (engine untouched).

## Scope discipline

One file. No engine change (`init verify-self` shipped Phase 14); no new ADR (marker spec + ADR-004 exist); no change to anchor-docs / sentinel / the marker form; no deploy-gate blocking; never auto-resolves.

## Commits

- `538e099` — feat(16-01): verify-self skill.

## Deviations

None.
