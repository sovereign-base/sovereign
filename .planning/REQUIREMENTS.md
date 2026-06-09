# SOVEREIGN — Requirements (Milestone M3: Adoption, Bridging & Extensions · v1.2)

Derived from `/SOVEREIGN.md` §6 + the locked v1 designs in `archive/v1/`. Builds on the verified M1 engine + M2 architecture skills.
"User" = an engineer or agent using SOVEREIGN inside their own project.

> **M1 (v1.0, 28/28) + M2 (v1.1, 8/8) shipped & verified.** This document scopes **M3**.

---

## M3 Requirements

### sovereign-adopt — retrofit onto an existing codebase

- [ ] **ADOPT-01**: A user can run `sovereign-adopt` on an existing project and the skill performs **3-layer archaeology** — Layer 1 config/manifest files (near-zero tokens), Layer 2 structure scan (folders + filenames, no contents), Layer 3 a handful of targeted deep reads (router/auth/base-model/config) — to reverse-engineer the decisions already baked into the code.
- [ ] **ADOPT-02**: From that archaeology, `sovereign-adopt` scaffolds `.sovereign/`, generates **retroactive ADRs** (via `adr-log`) for discovered decisions, and produces a **gap analysis + adoption roadmap** (what's missing, prioritized by risk). Scope: greenfield-with-code + Type-2 mid-flight (Type-3 legacy deferred).

### bridge — cross-project handoff

- [x] **BRIDGE-01**: A user can run `bridge` in a source project to generate a `BRIDGE.md` containing what a consuming project needs — API contracts (from `API_SPEC.md`), auth/security summary, shared domain glossary (from `CONTEXT.md`), and decisions-already-made (from ADRs) — that the consuming project imports on init.
- [x] **BRIDGE-02**: `bridge` records a content **hash** of the source files it was built from (in a bridge registry) so **staleness** can be detected — re-running flags when the source has changed since the bridge was generated. (Blocking-at-deploy + GitHub-issue notification are deferred; M3 ships local hash-based stale detection.)

### extension protocol — wrap `npx skills` + vetting

- [ ] **EXT-01**: A user can discover and install third-party skills through SOVEREIGN by wrapping `npx skills find` / `npx skills add` (find-skills ecosystem) — SOVEREIGN does not reinvent the registry (R-003).
- [ ] **EXT-02**: Before a skill is adopted, SOVEREIGN runs a **vetting layer**: necessity check (vs active tracks/phase), conflict check (vs existing skills/ADRs), a security audit (data-exfiltration / overbroad-permission / prompt-injection patterns), a clear recommendation, and a **logged decision** (in `.sovereign/extensions/`).

### Engine & cross-cutting

- [x] **ENG-08**: The modest engine additions M3 needs are implemented **zero-dependency** in `sovereign-tools` and tested (`node --test`) — candidates: a `bridge` hash/registry helper, an `extension` install+vet wrapper around `npx skills`, and an `adopt` scan helper. (Exact command surface scoped during planning; `init` gains `bridge`/`adopt`/`extension` workflows.)
- [ ] **M3-CC**: Every M3 skill is a thin orchestrator per `skill-format.md` — one `sovereign-tools init <skill>` orient call, "Why this matters", recommendation-first, navigation footer — and is **user-invoked** (`disable-model-invocation: true`, like Council/architecture skills), so `sovereign-tools doctor` still reports the auto-trigger budget at the 5 Fast Lane skills. `validate skills` passes for all.

---

## Deferred (M4+)

- `anchor-docs` / `verify-self` — construction-phase anti-hallucination (the architecture skills flag the need; the skills themselves are M4).
- Bridge: deploy-gate blocking + GitHub-issue auto-notification (M3 ships local hash staleness only).
- `sovereign-adopt` Type-3 legacy (years-old, undocumented) — deferred; M3 covers greenfield-with-code + Type-2.
- Microservices overlay (`service-design`/`event-catalog`/`dependency-map`), operations phase, multi-model Council, IoT/embedded tracks.

---

## Out of Scope

- Reinventing skill discovery/registry — wrap `npx skills` (R-003).
- Auto-installing extensions without the vetting + logged decision.
- Modifying the user's source code during adoption — `sovereign-adopt` reads + records; it does not refactor.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-08 | Phase 10 — Engine Additions | In Progress (bridge.cjs in 10-01; scanSkillContent in 10-02) |
| BRIDGE-01 | Phase 11 — Bridge Skill | Complete |
| BRIDGE-02 | Phase 11 — Bridge Skill | Complete |
| EXT-01 | Phase 12 — Extension Protocol Skill | Pending |
| EXT-02 | Phase 12 — Extension Protocol Skill | Pending |
| ADOPT-01 | Phase 13 — sovereign-adopt Skill | Pending |
| ADOPT-02 | Phase 13 — sovereign-adopt Skill | Pending |
| M3-CC | Phases 11, 12, 13 (cross-cutting) | Pending |

**Coverage:** 8/8 M3 requirements mapped. No orphans. M3-CC is cross-cutting (a success criterion of each skill phase 11–13); all others map to exactly one phase.
