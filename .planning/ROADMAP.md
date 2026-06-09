# Roadmap: SOVEREIGN v2

Completed milestones are archived (full phase detail + final progress) under `.planning/milestones/`. The active milestone's phases live here.

## Shipped milestones

| Milestone | Scope | Phases | Status | Archive |
|-----------|-------|--------|--------|---------|
| **v1.0 — M1 Foundation** | engine · installer · Council · Fast Lane 5 · conventions | 1–5 (19 plans) | ✅ Complete (28/28 reqs, verified) | [v1.0-ROADMAP](./milestones/v1.0-ROADMAP.md) · [reqs](./milestones/v1.0-REQUIREMENTS.md) |
| **v1.1 — M2 Architecture** | adr-log · entity/api/scale/security/deploy-design · stack-select | 6–9 (7 plans) | ✅ Complete (8/8 reqs, verified) | [v1.1-ROADMAP](./milestones/v1.1-ROADMAP.md) · [reqs](./milestones/v1.1-REQUIREMENTS.md) |
| **v1.2 — M3 Adoption/Bridging/Extensions** | bridge.cjs/extension.cjs/adopt.cjs engine · bridge · import-skill · sovereign-adopt | 10–13 (9 plans) | ✅ Complete (8/8 reqs, verified) | [v1.2-ROADMAP](./milestones/v1.2-ROADMAP.md) · [reqs](./milestones/v1.2-REQUIREMENTS.md) |
| **v1.3 — M4 Ground Truth (Anti-Hallucination)** | engine `anchor` command · `anchor-docs` · `verify-self` · ADR-004 | 14–16 (3 plans) | ✅ Complete (6/6 reqs, verified) | [v1.3-ROADMAP](./milestones/v1.3-ROADMAP.md) · [reqs](./milestones/v1.3-REQUIREMENTS.md) |

**Shipped:** a zero-dependency engine + `npx sovereign-cli init` installer + **18 skills** (5 Fast Lane auto-triggerable, 13 phase-gated) + 4 subagents + 5 references + 16 engine lib modules. **164 engine tests; listing budget held at 5 auto-triggerable across all four milestones.** The anti-hallucination loop is closed: `anchor-docs` (ground truth) → `verify-self` (catch drift) → `sentinel` (scan `SOVEREIGN:UNVERIFIED` markers). Engine is installed into projects at `.claude/sovereign-engine/` (v2.2.0 install fix).

## Milestone v1.4 — M5 (Construction-phase skills: debugging · QA · security depth)

**Goal:** Give the build phase three quality skills flagged in live M4 dogfooding — a stack-agnostic debugging loop (`diagnose`), a relentless repo-wide correctness sweep (`qa`), and concrete security-control coverage (`security-design` enrichment) — keeping the thin-orchestrator discipline and the 5-skill auto-budget. Hand-authored skill phases (the M4 pattern); no/minimal engine work.

**Build order:** `diagnose` (Phase 17) → `qa` (Phase 18) → `security-design` controls enrichment + per-agent invocation docs (Phase 19). M5-CC (thin-orchestrator shape · `disable-model-invocation` on new skills · doctor auto-budget held at 5 · `validate skills` clean) is cross-cutting across all three.

### Phases

- [x] **Phase 17: `diagnose` skill** - Stack-agnostic debugging loop (reproduce → isolate → hypothesis → fix → verify) over the engine + `.sovereign/` state; composes with `tdd`/`verify-self`/`sentinel` (DIAG-01, M5-CC) ✅ 2026-06-09
- [x] **Phase 18: `qa` skill** - Relentless repo-wide correctness sweep (static correctness · tests · dep/wiring/import integrity · routing · cross-workspace consistency · API contract) over the project's own toolchain; ✅/❌/⚠️ report with `file:line` (QA-01, M5-CC) ✅ 2026-06-09
- [ ] **Phase 19: `security-design` controls enrichment + docs** - Agnostic `security-controls.md` reference (input validation · injection · authz/IDOR · secrets · rate-limiting) the skill consults + per-agent skill-invocation docs note (SEC-01, DOCS-01, M5-CC)

### Phase Details

### Phase 17: `diagnose` skill
**Goal**: A user can run `diagnose` to debug a failure through a disciplined, recommendation-first loop instead of guessing.
**Depends on**: Nothing new (reuses the shipped engine + skills; composes with `tdd`/`verify-self`/`sentinel`)
**Requirements**: DIAG-01, M5-CC
**Success Criteria** (what must be TRUE):
  1. Running `diagnose` walks reproduce → isolate → hypothesis → fix → verify, recommendation-first, using the project's OWN test/run tooling (stack-agnostic — no hardcoded toolchain).
  2. It orients with a single `sovereign-tools init diagnose` (or generic init) call and composes with the shipped skills (failing test via `tdd`; unconfirmed root cause → `verify-self` marker; standards pass → `sentinel`).
  3. Core-tier thin-orchestrator shape; `disable-model-invocation: true` (doctor auto-budget held at 5); `validate skills` passes.
**Plans**: 1 (17-01) — ✅ Complete 2026-06-09 (verified 3/3; doctor 19/5/14, validate passes, 164 engine tests green)

### Phase 18: `qa` skill
**Goal**: A user can run `qa` to catch errors, type mismatches, broken imports/wiring, and contract drift across the whole repo before they hit a running build.
**Depends on**: Phase 17 (`qa` failures hand off to `diagnose`); composes with `sentinel`
**Requirements**: QA-01, M5-CC
**Success Criteria** (what must be TRUE):
  1. `qa` sweeps each workspace/module using its OWN toolchain across: static correctness (typecheck/compile-check, schema, lint), tests, dependency & wiring integrity (DI/wiring, import resolution, version alignment, example-config↔code), navigation/routing, and cross-workspace consistency (single shared-runtime version, shared/contract types, schema↔types, API contract vs `.sovereign/docs/api/API_SPEC.md`).
  2. It reports ✅/❌/⚠️ grouped by module then category, ❌ with exact error + `file:line`, ending in a one-line verdict (pass / fail with N blocking); delegates to the project's own `qa` command when present, else per-module equivalents — stack-agnostic.
  3. Core-tier thin-orchestrator shape; `disable-model-invocation: true` (doctor auto-budget held at 5); `validate skills` passes; composes with `diagnose` (failures → debug) and complements `sentinel`.
**Plans**: 1 (18-01) — ✅ Complete 2026-06-09 (verified 3/3; doctor 20/5/15, validate passes, 164 engine tests green)

### Phase 19: `security-design` controls enrichment + docs
**Goal**: `security-design` drives concrete security-control coverage, and non-Claude users know how to invoke SOVEREIGN's skills.
**Depends on**: Nothing new (enriches the shipped `security-design` skill)
**Requirements**: SEC-01, DOCS-01, M5-CC
**Success Criteria** (what must be TRUE):
  1. A new agnostic `engine/references/security-controls.md` enumerates control *classes* (input validation, injection SQLi/XSS/command, authz/IDOR, secrets, rate-limiting) + what-to-verify per class — NOT framework APIs; `security-design` consults it and offers the checklist, surfacing uncovered classes on re-run.
  2. Per-agent skill-invocation differences (Claude `/`-autocomplete vs other agents read SKILL.md / invoke by name) are documented in the README + `npx sovereign-cli init` output.
  3. `security-design` keeps the thin-orchestrator shape + `disable-model-invocation: true`; `validate skills` passes; doctor auto-budget held at 5.
**Plans**: 1 (19-01)

### M5 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 17. `diagnose` skill | 1/1 | ✅ Complete | 2026-06-09 |
| 18. `qa` skill | 1/1 | ✅ Complete | 2026-06-09 |
| 19. `security-design` enrichment + docs | 0/? | Not started | - |
