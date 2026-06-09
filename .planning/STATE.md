---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: M3 — Adoption, Bridging & Extensions
status: active
stopped_at: M3 roadmap created (phases 10–13 appended; REQUIREMENTS traceability filled)
last_updated: "2026-06-09T12:00:00.000Z"
last_activity: 2026-06-09
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (Current Milestone: v1.2 — M3 Adoption, Bridging & Extensions)

**Core value:** The engine — a skill orients itself with one CLI call (`sovereign-tools init <workflow>` → one JSON blob), not ten file reads. If the token-efficient engine + committed `.sovereign/` state works, everything else layers on cheaply.
**Current focus:** Phase 10 — Engine Additions (first M3 phase)

## Current Position

Phase: 10 of 13 (Engine Additions) — M3 phase 1 of 4
Plan: none yet (phase not planned)
Status: M3 roadmap created — ready to plan Phase 10
Last activity: 2026-06-09

Progress: [░░░░] M3 phase 0/4 complete

## Performance Metrics

**Velocity:**

- Total plans completed (M3): 0
- Average duration: — min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: none yet for M3
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
M3-relevant standing decisions:

- **M3 has REAL engine work, not just skill authoring** (unlike M2). Engine-vs-skill split is the spine: engine = mechanical/deterministic/zero-dep; skills = judgment.
- **Build order is engine-first (R-002):** Phase 10 lands all ENG-08 engine additions (the helpers the skills wrap) before any skill phase. Then bridge (smallest, fully testable, no external process) → extension (needs live `npx skills` smoke-test) → adopt (largest, most reasoning).
- **Engine additions (Phase 10):** `bridge.cjs` (SHA-256 per-file + combined hash via `node:crypto`, registry diff in `.sovereign/bridges/registry.json`); `extension.cjs` (`spawnSync('npx', ['skills', ...])` array args, drives on EXIT CODE — there is NO `--json`; use `skills use` to fetch content for audit BEFORE `add`); `adopt.cjs` (`adopt scan` → Layers-1+2 JSON contract via `git ls-files`/walk); `scanSkillContent()` extending `security.cjs` (reuse `sanitizeForPrompt` regex toolkit). `init` gains `bridge`/`adopt`/`extension` workflows. Zero deps; emit via `output()`/`@file:` spill (never reimplement spill).
- **M3-CC is cross-cutting** across the three skill phases (11–13): each skill is a thin orchestrator (single `init` orient, "Why this matters", recommendation-first, nav footer), `disable-model-invocation: true`, so the doctor auto-trigger budget stays at the 5 Fast Lane skills; `validate skills` passes for all.
- **Scope guards (from REQUIREMENTS):** `sovereign-adopt` reads + records only, never refactors source; Type-3 legacy deferred. Bridge ships LOCAL hash staleness only (no deploy-gate/GitHub-issue). Extensions never auto-installed without vetting + logged decision. Wrap `npx skills`, never reinvent the registry (R-003).

### Pending Todos

None yet.

### Blockers/Concerns

- **`npx skills` output instability (MEDIUM).** `find`/`add` stdout is undocumented and could shift between versions. Wrapper MUST drive on exit codes + use `skills use` for content; only loosely regex `owner/repo@skill` from `find`. `find-skills/SKILL.md` is stale (documents a dropped `check` subcommand — use the README set: `add/use/list/find/remove/update`).
- **`skills use` behavior to verify in Phase 12 (MEDIUM):** smoke-test that `npx skills use <source> --agent claude-code` reliably yields the raw `SKILL.md` body for the security scan (vs only a transformed prompt). Fall back to a shallow git/HTTP fetch of the source `SKILL.md` if insufficient.
- **Recurring meta-risk: skill-listing token budget.** All three M3 skills MUST set `disable-model-invocation: true` so the auto-trigger count stays at the 5 Fast Lane skills — re-verify via `sovereign-tools doctor` at the end of every skill phase (especially Phase 13, after all three M3 skills installed).
- **OWASP Agentic Top-10 mapping (MEDIUM):** re-verify the current OWASP list when authoring `scanSkillContent`'s pattern set rather than hard-coding from memory.
- **Extensions log location (LOW):** v2 uses per-decision files `.sovereign/extensions/<date>-<skill>.md` (not v1's single `SOVEREIGN_EXTENSIONS.md`) — confirm against manifest naming during planning.

## Session Continuity

Last session: 2026-06-09
Stopped at: M3 roadmap created (phases 10–13 appended; REQUIREMENTS traceability filled; STATE reset to Phase 10)
Resume file: None
Next: `/gsd:plan-phase 10`
