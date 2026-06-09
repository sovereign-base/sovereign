---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: M3 — Adoption, Bridging & Extensions
status: between_milestones
stopped_at: v1.2 (M3) complete & archived — 8/8 reqs, phases 10-13 verified
last_updated: "2026-06-09T13:00:00.000Z"
last_activity: 2026-06-09
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 9
  completed_plans: 9
---

# Project State

## Project Reference

See: .planning/PROJECT.md (Current Milestone: v1.2 — M3 Adoption, Bridging & Extensions)

**Core value:** The engine — a skill orients itself with one CLI call (`sovereign-tools init <workflow>` → one JSON blob), not ten file reads. If the token-efficient engine + committed `.sovereign/` state works, everything else layers on cheaply.
**Current focus:** Phase 12 — Extension Protocol Skill (M3 phase 3 of 4)

## Current Position

Phase: 12 of 13 (Extension Protocol Skill) — M3 phase 3 of 4
Plan: 1 of 2 complete (12-01 done; extension.cjs corrected to verified `npx skills` surface)
Status: In progress — 12-02 (import-skill skill) remaining
Last activity: 2026-06-09

Progress: [█████████░] 88% — M3: Phase 10 ✓, Phase 11 ✓, Phase 12 1/2

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
| Phase 10 P01 | 3 | 2 tasks | 2 files |
| Phase 10 P02 | 4 | 2 tasks | 2 files |
| Phase 10 P03 | 2 | 2 tasks | 2 files |
| Phase 10 P04 | 2 | 2 tasks | 2 files |
| Phase 10 P05 | 3 | 3 tasks | 4 files |
| Phase 12 P01 | 3 | 3 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
M3-relevant standing decisions:

- **M3 has REAL engine work, not just skill authoring** (unlike M2). Engine-vs-skill split is the spine: engine = mechanical/deterministic/zero-dep; skills = judgment.
- **Build order is engine-first (R-002):** Phase 10 lands all ENG-08 engine additions (the helpers the skills wrap) before any skill phase. Then bridge (smallest, fully testable, no external process) → extension (needs live `npx skills` smoke-test) → adopt (largest, most reasoning).
- **Engine additions (Phase 10):** `bridge.cjs` (SHA-256 per-file + combined hash via `node:crypto`, registry diff in `.sovereign/bridges/registry.json`); `extension.cjs` (`spawnSync('npx', ['skills', ...])` array args, drives on EXIT CODE — there is NO `--json`; use `skills use` to fetch content for audit BEFORE `add`); `adopt.cjs` (`adopt scan` → Layers-1+2 JSON contract via `git ls-files`/walk); `scanSkillContent()` extending `security.cjs` (reuse `sanitizeForPrompt` regex toolkit). `init` gains `bridge`/`adopt`/`extension` workflows. Zero deps; emit via `output()`/`@file:` spill (never reimplement spill).
- **M3-CC is cross-cutting** across the three skill phases (11–13): each skill is a thin orchestrator (single `init` orient, "Why this matters", recommendation-first, nav footer), `disable-model-invocation: true`, so the doctor auto-trigger budget stays at the 5 Fast Lane skills; `validate skills` passes for all.
- **Scope guards (from REQUIREMENTS):** `sovereign-adopt` reads + records only, never refactors source; Type-3 legacy deferred. Bridge ships LOCAL hash staleness only (no deploy-gate/GitHub-issue). Extensions never auto-installed without vetting + logged decision. Wrap `npx skills`, never reinvent the registry (R-003).
- [Phase 10]: bridge.cjs combined hash = sha256 of sorted path:sha256 lines (order-independent, fast equality); cmdBridgeCheck greenfield-safe (no_registry) and flags byte-changed + now-missing recorded sources
- [Phase 10]: [Phase 10] scanSkillContent: data-driven SKILL_SCAN_PATTERNS table; verdict escalation high->block, medium->review, none->clean; low findings reported but stay clean; reuses sanitizeForPrompt markers; zero deps
- [Phase 10]: [Phase 10] OWASP pages offline at authoring; grounded scanSkillContent categories against LLM01/02/06 + Agentic taxonomy, documented fallback in JSDoc, re-verify+extend later
- [Phase 10]: adopt.cjs scanProject = pure read-only Layers-1+2 scan emitting M3-NOTES §3 contract; gitignore-aware via git ls-files (repo) / bounded SKIP_DIRS walk (non-git); MAX_TREE=2000 cap+truncated; deep_read_candidates heuristic (entrypoint/auth/base-model/config, ≤10); read-only invariant test-asserted via dir snapshot
- [Phase 10]: extension.cjs: exit-code-driven npx skills wrapper; preview=skills use (materialize-for-audit BEFORE add), install=skills add --copy -y, list; source as single discrete argv element (no shell injection); audit runs scanSkillContent → {findings,verdict}, ok=verdict!=='block', no_content greenfield-safe; runSkills injectable for network-free tests; zero deps
- [Phase 10]: 10-05: bridge/extension/adopt wired into the public router via existing array-arg helpers (no commander); init bridge|adopt|extension orient blobs added (adopt carries detected.in_git probe); full suite 130 green, deps still {}. ENG-08 COMPLETE.
- [Phase 12]: 12-01: corrected extension.cjs to verified npx skills surface — preview = bare 'skills use <source>' (no -a/--copy); audit re-runs preview and scans the prompt-wrapped STDOUT via scanSkillContent (no file-path); readMaterializedContent + node:fs/path removed; install/list unchanged; 129 tests green, deps still {}

### Pending Todos

None yet.

### Blockers/Concerns

- **`npx skills` output instability (MEDIUM).** `find`/`add` stdout is undocumented and could shift between versions. Wrapper MUST drive on exit codes + use `skills use` for content; only loosely regex `owner/repo@skill` from `find`. `find-skills/SKILL.md` is stale (documents a dropped `check` subcommand — use the README set: `add/use/list/find/remove/update`).
- **`skills use` behavior to verify in Phase 12 (MEDIUM):** smoke-test that `npx skills use <source> --agent claude-code` reliably yields the raw `SKILL.md` body for the security scan (vs only a transformed prompt). Fall back to a shallow git/HTTP fetch of the source `SKILL.md` if insufficient.
- **Recurring meta-risk: skill-listing token budget.** All three M3 skills MUST set `disable-model-invocation: true` so the auto-trigger count stays at the 5 Fast Lane skills — re-verify via `sovereign-tools doctor` at the end of every skill phase (especially Phase 13, after all three M3 skills installed).
- **OWASP Agentic Top-10 mapping (MEDIUM):** re-verify the current OWASP list when authoring `scanSkillContent`'s pattern set rather than hard-coding from memory.
- **Extensions log location (LOW):** v2 uses per-decision files `.sovereign/extensions/<date>-<skill>.md` (not v1's single `SOVEREIGN_EXTENSIONS.md`) — confirm against manifest naming during planning.

## Session Continuity

Last session: 2026-06-09T12:27:57.750Z
Stopped at: Completed 12-01-PLAN.md
Resume file: None
Next: `/gsd:plan-phase 10`
