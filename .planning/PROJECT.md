# SOVEREIGN (v2 rebuild)

## What This Is

SOVEREIGN is a universal, project-agnostic engineering system delivered as agent skills: gated phases, living documents, and guardrails that guide any software project from first thought to live production and beyond. This project is the **v2 rebuild** — keeping v1's content and philosophy but replacing its architecture with GSD-class foundations (a deterministic engine + thin orchestrator skills + specialized subagents). It ships as `github.com/sovereign-base/sovereign`, installed via `npx sovereign`, MIT-licensed.

It is for engineers and agents who want to build properly — and refuse to let the answer to "how do we build this?" be *vibes*.

## Core Value

**The engine.** A skill orients itself with one CLI call (`sovereign-tools init <workflow>` → one JSON blob), not ten file reads. If that token-efficient engine + committed `.sovereign/` state works, everything else (skills, council, phases) is layered cheaply on top. v1 failed precisely because it had no engine — skills were prose with nothing underneath. The engine is the one thing that must work.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

**M1 — Foundation (v1.0), shipped & verified 28/28:**

- ✓ `.sovereign/` state model + `sovereign-tools` zero-dep engine (`init <workflow>`→one JSON blob, state/gate/commit/model/validate/doctor) — M1
- ✓ `npx sovereign-cli init` installer (`--quick`/`--full`/`--global`, idempotent, version-aware) — M1
- ✓ Fast Lane 5: `ubiquitous-language`, `grill-with-docs`, `handoff`, `sentinel`, `tdd` — M1
- ✓ `council --standard` (5 parallel advisors + anonymous peer review + chairman verdict) + 4 subagents — M1
- ✓ Conventions (skill-format, adr-format, commenting, unverified-marker, listing-budget) + per-skill docs — M1

**Shipped:** **v1.0 (M1 — Foundation)** + **v1.1 (M2 — Architecture)**, both complete, verified, tagged. SOVEREIGN ships a zero-dependency engine + `npx sovereign-cli init` installer + **13 skills** (5 Fast Lane auto-triggerable; Council + 7 architecture skills phase-gated) + 4 subagents + 5 references. 77 engine tests; listing budget held at 5 auto-triggerable. The flagship `/council` is proven live end-to-end. Milestone detail archived under `.planning/milestones/`.

## Current Milestone: v1.2 — M3 Adoption, Bridging & Extensions

**Goal:** Extend SOVEREIGN beyond a single fresh project — retrofit it onto existing codebases, hand off context between projects, and safely pull in third-party skills. **Unlike M2 (pure skill authoring), M3 may add modest engine surface** (a bridge-hash/registry command, an extension install+vet command, an adopt scan helper).

**Target capabilities:** `sovereign-adopt` · `bridge` (+ staleness) · extension protocol (wrap `npx skills` + vetting).

### Active

<!-- M3 — Adoption, Bridging & Extensions. -->

- [ ] `sovereign-adopt` — retrofit onto an existing codebase via 3-layer archaeology (config files → structure scan → targeted deep reads) → retroactive ADRs + gap analysis + adoption roadmap; greenfield + Type-2 mid-flight scope.
- [ ] `bridge` — generate a `BRIDGE.md` for a consuming project (API contracts, auth, glossary, decisions-already-made) + **staleness detection** (hash the source files; flag when the bridge is stale).
- [ ] extension protocol — wrap `npx skills` (find/add) with a SOVEREIGN vetting layer: necessity check, conflict check, security audit, recommendation, logged decision.
- [ ] Modest engine additions as needed (e.g. `bridge`/hash + registry, `extension` install+vet, `adopt` scan helper) — scoped during planning; keep zero-dependency.

### Deferred to a later milestone

- `anchor-docs` / `verify-self` (construction-phase anti-hallucination the architecture skills flag) — M4.
- Operations phase, multi-model Council, microservices overlay, IoT/embedded — M4+.

### Out of Scope

<!-- Explicit boundaries for this milestone. -->

- Operations-phase skills (`onboard`, `feature`, `incident`, `health-check`, `deprecate`) — later
- `sovereign-adopt`, `bridge`, extension protocol — M3
- `anchor-docs` / `verify-self` (M2 architecture skills flag when current docs are needed, but the anchor skills themselves are M3)
- Multi-model Council (`--deep`), microservices overlay (`service-design`/`event-catalog`), IoT/embedded tracks — M4+
- Engine changes — M2 is pure skill authoring; the `init` default case already serves arbitrary skill names
- Reimplementing what GSD/find-skills already solve (riding GSD's engine, building our own skill registry) — decided against in R-001/R-003
- Monetization — open source only (ADR-001)

## Context

- **The vision is locked and gated** in `/SOVEREIGN.md` (repo root) — the north star. This PROJECT.md is GSD's build plan *for* that vision; the two are distinct.
- **`.planning/` (this) vs `.sovereign/` (what we ship)** must never be confused. `.planning/` is GSD's meta-planning for building SOVEREIGN; `.sovereign/` is the state directory SOVEREIGN creates inside *end-user* projects.
- **Four inspiration sources, all read directly:** Matt Pocock's skills (skill craft), GSD (installed locally at `~/.claude/get-shit-done` — the engineering backbone), gstack (role-based review chains), find-skills (`npx skills` for extensions).
- **v1 reference content** lives in `archive/v1/` (4 skills, 3 templates, 4 docs) — mine it for content, do not build on it.
- This is a fresh-tree rebuild on git branch `wizz-e/seville`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Option C build mode (R-001) | Own identity + install; lift GSD's *patterns* not code/engine; avoid chaining to GSD governance | Locked |
| Engine before skills (R-002) | v1 failed by writing skills with no engine | Locked |
| Extensions wrap `npx skills` (R-003) | find-skills already solved discovery/install; add vetting only | Locked |
| Dogfood GSD for build planning (R-004) | Prove phased-build thesis on ourselves | Locked — in progress |
| CLI = Node/TypeScript (ADR-002) | `npx` works out of the box; matches GSD `.cjs` | Locked |
| `.sovereign/` committed to git (ADR-003) | Engineering memory belongs to the team | Locked |
| Model tier = Quality (Opus) for planning agents | Foundational system warrants deeper analysis | Locked (this build) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-08 after initialization*
