---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: M4 — Ground Truth (Anti-Hallucination)
status: active
stopped_at: Phase 14 complete (engine anchor command + init workflows, ENG-09) — awaiting plan-phase 15
last_updated: "2026-06-09T17:23:21.876Z"
last_activity: 2026-06-09 -- Phase 14 complete (ENG-09, verified 4/4)
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (Current Milestone: v1.3 — M4 Ground Truth / Anti-Hallucination)

**Core value:** The engine — a skill orients itself with one CLI call (`sovereign-tools init <workflow>` → one JSON blob), not ten file reads. If the token-efficient engine + committed `.sovereign/` state works, everything else layers on cheaply.
**Current focus:** Phase 15 — `anchor-docs` skill (Phase 14 engine substrate ✅ complete)

## Current Position

Phase: 14 (engine-anchor-command-init-workflows) — ✅ COMPLETE (verified 4/4)
Plan: 1 of 1 complete (14-01)
Status: Phase 14 complete — next: `/gsd:plan-phase 15` (anchor-docs skill)
Last activity: 2026-06-09 -- Phase 14 complete (ENG-09)

Progress: [███░░░░░░░] 33% — M4: Phase 14 ✓, Phase 15 ○, Phase 16 ○

## Performance Metrics

**Velocity:**

- Total plans completed (M4): 0
- Average duration: — min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: none yet for M4
- Trend: —

*Updated after each plan completion*
| Phase 14 P01 | 4 | 5 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
M4-relevant standing decisions:

- **M4 has BOTH engine work AND skills** (like M3, unlike M2). Engine-vs-skill split holds: engine = mechanical/deterministic/zero-dep storage + staleness math; skills = judgment (what to anchor, when to hard-stop, which user choice).
- **Build order is engine-first (R-002):** Phase 14 lands all ENG-09 engine additions (the `anchor` command + `init anchor-docs`/`init verify-self` orient workflows the skills wrap) before any skill phase. Then `anchor-docs` (wraps `anchor`) → `verify-self` (composes with `anchor-docs` + emits markers).
- **Engine additions (Phase 14):** an `anchor` command mirroring the bridge.cjs/adopt.cjs/extension.cjs shape — `anchor add` (store URL-by-default + `source`/`version`/`date-retrieved`/`re-verify-by` metadata under `.sovereign/external-docs/<slug>.md`; full content opt-in per ADR-004), `anchor list`, `anchor check` (flag stale = past `re-verify-by`, computed deterministically from stored dates). `init` gains `anchor-docs`/`verify-self` orient blobs. Array-arg parsing; emit via `output()`/`@file:` spill (never reimplement spill); greenfield-safe (no `external-docs/` yet); deps stay `{}`; `node --test`.
- **M4-CC is cross-cutting** across the two skill phases (15–16): each skill is a core-tier thin orchestrator (single `init` orient, "Why this matters", recommendation-first, nav footer), `disable-model-invocation: true`, so the doctor auto-trigger budget stays at the 5 Fast Lane skills; `validate skills` passes for both. They compose (`verify-self` → `anchor-docs`; markers → `sentinel`).
- **Scope guards (from REQUIREMENTS):** no engine HTTP/fetch client — anchoring stores URLs + metadata + opt-in user-pasted content; the agent fetches with its own tools. URLs by default, content opt-in with a copyright warning (ADR-004). `verify-self` never silently continues — it always surfaces + offers the three choices. Pre-flight deploy-gate BLOCKING on stale anchors / unresolved markers is deferred to M5+ (M4 surfaces only).
- [Phase 14]: ENG-09: anchor add|list|check substrate (anchor.cjs) lands URL-by-default external-doc storage + lexicographic staleness; init anchor-docs/verify-self orient blobs added; verify-self surfaces references/unverified-marker.md; deps stay {}

### Pending Todos

None yet.

### Blockers/Concerns

- **Recurring meta-risk: skill-listing token budget.** Both M4 skills MUST set `disable-model-invocation: true` so the auto-trigger count stays at the 5 Fast Lane skills — re-verify via `sovereign-tools doctor` at the end of every skill phase (15 and 16).
- **`SOVEREIGN:UNVERIFIED` marker contract is fixed** by `engine/references/unverified-marker.md` (CONV-03) — `verify-self` (choice B) writes markers in that exact `<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>` form so `sentinel`'s existing literal-token scan finds them. Do not invent a new marker shape.
- **"Last verified anchor" boundary (MEDIUM):** `verify-self`'s retroactive audit needs a notion of "since the last verified anchor." Decide during Phase 16 planning how that boundary is derived (e.g. from `anchor` metadata dates / git history) — the engine stores the dates; the skill applies the judgment.
- **ADR-004 copyright warning placement (LOW):** confirm the opt-in full-content path surfaces the copyright warning at the skill layer (judgment) while the engine just stores what it's given.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260609-lkx | Fix install bug: copy engine into project so installed skills can reach sovereign-tools (+ bare `state save` regenerates MANIFEST) | 2026-06-09 | 78ec6cc | [260609-lkx-fix-install-bug-copy-engine-into-project](./quick/260609-lkx-fix-install-bug-copy-engine-into-project/) |
| fast | Installer seeds `includeCoAuthoredBy:false` + `attribution` default into project `.claude/settings.json` (kills Claude commit attribution team-wide) | 2026-06-09 | f34c9eb | — (`/gsd:fast`) |

## Session Continuity

Last session: 2026-06-09T17:19:23.568Z
Stopped at: Completed 14-01-PLAN.md
Resume file: None
Next: `/gsd:plan-phase 14`
