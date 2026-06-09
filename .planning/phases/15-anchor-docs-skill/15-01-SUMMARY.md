---
phase: 15
plan: "15-01"
status: complete
requirements: [ANCHOR-01, M4-CC]
completed: 2026-06-09
---

# Phase 15 / Plan 15-01 — Summary

**Objective:** Hand-author the `anchor-docs` thin-orchestrator skill (wrapping the Phase 14 engine `anchor` command) + the policy ADR it cites, and pass the skill-phase gates.

## What shipped

- **`engine/skills/anchor-docs/SKILL.md`** (84 lines) — a core-tier thin orchestrator mirroring `bridge`:
  - One-call orient (`init anchor-docs` + `@file:` guard); every engine call uses the literal `.claude/sovereign-engine/sovereign-tools.cjs` path (no `$ENGINE`).
  - Delegates all storage/staleness to the engine: `anchor check` (surface stale first) → `anchor add` (URL-by-default; `--content` only past the copyright warning) → `anchor list` (confirm) → `state save` + commit.
  - Surfaces the **copyright/licensing warning** at the URL-vs-content decision and documents URL-by-default; cites **ADR-004**.
  - `disable-model-invocation: true`; `## Why this matters` + `## When to use this` (+ Don't) + `## The flow` + `## Navigation` `▶ NEXT` footer pointing to `verify-self`.
  - Does NOT emit `SOVEREIGN:UNVERIFIED` markers (that's `verify-self`, Phase 16) and does NOT reimplement storage.
- **`docs/adr/ADR-004-anchor-content-copyright.md`** — repo ADR format (`# ADR-004:` / Status Accepted / Context·Decision·Consequences). Records: URL-by-default, content opt-in behind a copyright warning, engine stays content-agnostic. Resolves the previously-dangling ANCHOR-01 reference.

## Verification (gates, run from `engine/`)

- Structural G1–G12: all pass (exists; `disable-model-invocation: true`; required sections + footer; 84 ≥ 70 lines; no v1 frontmatter; literal engine path, no `$ENGINE`; delegates to `anchor add|list|check` with no direct file write; one-call orient; copyright + URL documented; ADR-004 present + cited).
- `validate skills skills/anchor-docs/SKILL.md` → `{ valid: true, violations: [] }`.
- `doctor` → `total_skills: 17, auto_count: 5, disabled_count: 12, ok: true` — **auto-trigger budget held at 5** (M4-CC).
- Regression: `node --test "test/**/*.test.cjs"` → 164/164 (engine untouched).

## Scope discipline

No engine changes; no `verify-self`; no fetch client; no other skill. ANCHOR-02 is only *surfaced* here (`anchor check` in the flow) — its end-to-end verification stays in Phase 16.

## Commits

- `6839970` — feat(15-01): anchor-docs skill + ADR-004.

## Deviations

None.
