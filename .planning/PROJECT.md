# SOVEREIGN (v2 rebuild)

## What This Is

SOVEREIGN is a universal, project-agnostic engineering system delivered as agent skills: gated phases, living documents, and guardrails that guide any software project from first thought to live production and beyond. This project is the **v2 rebuild** — keeping v1's content and philosophy but replacing its architecture with GSD-class foundations (a deterministic engine + thin orchestrator skills + specialized subagents). It ships as `github.com/sovereign-base/sovereign`, installed via `npx sovereign`, MIT-licensed.

It is for engineers and agents who want to build properly — and refuse to let the answer to "how do we build this?" be *vibes*.

## Core Value

**The engine.** A skill orients itself with one CLI call (`sovereign-tools init <workflow>` → one JSON blob), not ten file reads. If that token-efficient engine + committed `.sovereign/` state works, everything else (skills, council, phases) is layered cheaply on top. v1 failed precisely because it had no engine — skills were prose with nothing underneath. The engine is the one thing that must work.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate. The v1 content design exists in `archive/v1/` as reference, not as working software.)

### Active

<!-- M1 — Foundation milestone. Building toward these. -->

- [ ] `.sovereign/` state model — MANIFEST.md (loads first, <500 tokens), SOVEREIGN.md constitution, CONTEXT.md glossary, STATE.md, config.json, docs/ tree
- [ ] `sovereign-tools` engine (Node/TS) — `init <workflow>`, `state load|save`, `gate open|pass`, `commit`, `model` resolution; returns paths+config as one JSON blob
- [ ] `sovereign-init` skill — bootstrap a project's `.sovereign/` (`--quick` / `--full`)
- [ ] Fast Lane skill: `grill-with-docs` (thin orchestrator over the engine)
- [ ] Fast Lane skill: `ubiquitous-language`
- [ ] Fast Lane skill: `tdd`
- [ ] Fast Lane skill: `sentinel` (native tier: commenting/spec-alignment/UNVERIFIED scan/ADR consistency)
- [ ] Fast Lane skill: `handoff`
- [ ] `council` skill (`--standard`) — 5 parallel advisor subagents + anonymous peer review + chairman synthesis, with project-context injection from `.sovereign/`
- [ ] Subagent definitions for council advisors + any reasoning agents
- [ ] Per-skill docs (one page each), commenting standard, skill-format + ADR-format references
- [ ] Recommendation-first, navigation footer, and "Why this matters" section conventions enforced across skills

### Out of Scope

<!-- Explicit boundaries for this milestone. -->

- Phase 2-6 skills (entity/api/scale/security/deploy-design, operations) — M2+, not M1
- `sovereign-adopt`, `bridge`, extension protocol — M3
- Multi-model Council (`--deep`), microservices overlay, IoT/embedded tracks — M4+
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
