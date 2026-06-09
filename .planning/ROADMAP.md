# Roadmap: SOVEREIGN v2

Completed milestones are archived (full phase detail + final progress) under `.planning/milestones/`. The active milestone's phases live here.

## Shipped milestones

| Milestone | Scope | Phases | Status | Archive |
|-----------|-------|--------|--------|---------|
| **v1.0 — M1 Foundation** | engine · installer · Council · Fast Lane 5 · conventions | 1–5 (19 plans) | ✅ Complete (28/28 reqs, verified) | [v1.0-ROADMAP](./milestones/v1.0-ROADMAP.md) · [reqs](./milestones/v1.0-REQUIREMENTS.md) |
| **v1.1 — M2 Architecture** | adr-log · entity/api/scale/security/deploy-design · stack-select | 6–9 (7 plans) | ✅ Complete (8/8 reqs, verified) | [v1.1-ROADMAP](./milestones/v1.1-ROADMAP.md) · [reqs](./milestones/v1.1-REQUIREMENTS.md) |
| **v1.2 — M3 Adoption/Bridging/Extensions** | bridge.cjs/extension.cjs/adopt.cjs engine · bridge · import-skill · sovereign-adopt | 10–13 (9 plans) | ✅ Complete (8/8 reqs, verified) | [v1.2-ROADMAP](./milestones/v1.2-ROADMAP.md) · [reqs](./milestones/v1.2-REQUIREMENTS.md) |

**Shipped:** a zero-dependency engine + `npx sovereign-cli init` installer + **16 skills** (5 Fast Lane auto-triggerable, 11 phase-gated) + 4 subagents + 5 references + 15 engine lib modules. **129 engine tests; listing budget held at 5 auto-triggerable across all three milestones.**

## Milestone v1.3 — M4 (Ground Truth / Anti-Hallucination)

**Goal:** Close the anti-hallucination loop the architecture/construction skills already flag — anchor implementation to *current* external documentation and catch the agent's own uncertainty before it ships wrong code. Engine-first (R-002): a modest zero-dep `anchor` command lands before the two hand-authored thin-orchestrator skills that wrap it.

**Build order:** engine `anchor` command + `init` orient workflows (Phase 14) → `anchor-docs` skill that wraps it (Phase 15) → `verify-self` skill that composes with `anchor-docs` + emits `SOVEREIGN:UNVERIFIED` markers (Phase 16). M4-CC (thin-orchestrator shape · `disable-model-invocation` · doctor auto-trigger budget held at 5 · `validate skills` clean) is cross-cutting across the two skill phases.

### Phases

- [x] **Phase 14: Engine `anchor` command + init workflows** - Zero-dep `anchor add|list|check` over `.sovereign/external-docs/` + `init anchor-docs`/`init verify-self` orient blobs, fully `node --test`'d (ENG-09) ✅ 2026-06-09
- [ ] **Phase 15: `anchor-docs` skill** - Thin orchestrator that wraps the engine `anchor` command to ingest external docs (URL-by-default, content opt-in) and surface stale anchors (ANCHOR-01/02, M4-CC)
- [ ] **Phase 16: `verify-self` skill** - Thin orchestrator: hard-stop + retroactive audit + 3 user choices, composes with `anchor-docs`, emits `SOVEREIGN:UNVERIFIED` markers `sentinel` scans (VERIFY-01/02, M4-CC)

### Phase Details

### Phase 14: Engine `anchor` command + init workflows
**Goal**: A zero-dependency engine surface backs anchoring — store, list, and staleness-check external-doc metadata under `.sovereign/external-docs/`, plus orient workflows for the two M4 skills.
**Depends on**: Nothing (continues the shipped M3 engine; mirrors the bridge.cjs/adopt.cjs shape)
**Requirements**: ENG-09
**Success Criteria** (what must be TRUE):
  1. `sovereign-tools anchor add` stores a `<slug>.md` under `.sovereign/external-docs/` carrying `source`, `version`, `date-retrieved`, `re-verify-by` metadata headers — URL-by-default, with full content stored only when opt-in is passed.
  2. `sovereign-tools anchor list` returns the anchored docs and `sovereign-tools anchor check` flags every anchor past its `re-verify-by` as stale (staleness computed deterministically from the stored dates), and both are greenfield-safe when no `external-docs/` exists yet.
  3. `sovereign-tools init anchor-docs` and `sovereign-tools init verify-self` each return one orient JSON blob (paths + config + flags) via `output()` with `@file:` spill, using array-arg parsing.
  4. `node --test` covers add/list/check (including stale detection, opt-in content, greenfield) and passes; the engine `dependencies` stay `{}`.
**Plans**: 1 (14-01) — ✅ Complete 2026-06-09 (verified 4/4; 164 engine tests green, deps `{}`)

### Phase 15: `anchor-docs` skill
**Goal**: A user can run `anchor-docs` to anchor implementation to current external documentation and know which anchors have gone stale.
**Depends on**: Phase 14 (wraps the engine `anchor` command)
**Requirements**: ANCHOR-01, M4-CC
**Success Criteria** (what must be TRUE):
  1. A user invoking `anchor-docs` ingests external documentation (payment gateways, SDKs, regional/gov APIs) — storing the URL by default, with full content opt-in gated behind a copyright warning (ADR-004) — by delegating to the engine `anchor add` command rather than reimplementing storage.
  2. The skill orients with a single `sovereign-tools init anchor-docs` call (no ten-file reads) and follows the core-tier thin-orchestrator shape: "Why this matters", recommendation-first, navigation footer.
  3. The skill sets `disable-model-invocation: true`, so `sovereign-tools doctor` still reports the auto-trigger budget at the 5 Fast Lane skills (budget held at 5), and `sovereign-tools validate skills` passes for it.
**Plans**: 1 (15-01)

### Phase 16: `verify-self` skill
**Goal**: When the agent (or user) hits a low-confidence signal, `verify-self` hard-stops, audits recent unverified work, and forces a deliberate resolution before more wrong code ships.
**Depends on**: Phase 15 (composes with `anchor-docs`); Phase 14 (uses `init verify-self`)
**Requirements**: VERIFY-01, VERIFY-02, ANCHOR-02, M4-CC
**Success Criteria** (what must be TRUE):
  1. A user (or the agent) triggering `verify-self` on a low-confidence signal gets a hard stop and a retroactive audit of code written since the last verified anchor, surfacing each specific unverified claim as `file:line + what's uncertain`.
  2. The skill presents the three choices — (A) provide docs by handing off to `anchor-docs`, (B) mark `SOVEREIGN:UNVERIFIED` and continue, (C) discard the unverified code and restart with docs — and on choice B emits `SOVEREIGN:UNVERIFIED` markers per `engine/references/unverified-marker.md`, which `sentinel` already scans.
  3. `anchor-docs` surfaces stale anchors (past `re-verify-by`) so the user knows what needs re-checking before relying on it, and `verify-self` composes with it on choice A — completing the anchor→verify→sentinel loop (ANCHOR-02).
  4. The skill orients with a single `sovereign-tools init verify-self` call, follows the thin-orchestrator shape, sets `disable-model-invocation: true` (doctor budget held at 5), and `sovereign-tools validate skills` passes for it.
**Plans**: TBD

### M4 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 14. Engine `anchor` command + init workflows | 0/? | Not started | - |
| 15. `anchor-docs` skill | 0/? | Not started | - |
| 16. `verify-self` skill | 0/? | Not started | - |
