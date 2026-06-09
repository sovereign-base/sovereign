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

**Shipped:** **v1.0 (M1)** + **v1.1 (M2)** + **v1.2 (M3)** + **v1.3 (M4)** + **v1.4 (M5)**, all complete and verified. M1–M3 published as `sovereign-cli@2.0.0`; the **2.2.0 install fix** is live; **M4 + M5 ship as 2.4.0** (M4 = anti-hallucination loop; M5 = construction/quality skills). **20 skills** + 4 subagents + 6 references + 16 engine lib modules; **164 engine tests; listing budget held at 5 auto-triggerable across all five milestones.** `/council`, the `npx skills` extension protocol, and the published `npx sovereign-cli init` are proven live (Claude Code + Gemini CLI). Milestone detail archived under `.planning/milestones/`.

## Current State: between milestones (M5 shipped)

**v1.4 — M5 Construction-phase skills is complete & verified (2026-06-09).** SOVEREIGN now covers the full arc — ideate → align → architect → build → review → ground-truth → adopt/bridge/extend. Validated this milestone:

- ✓ `diagnose` — stack-agnostic debugging loop (reproduce → isolate → hypothesis → fix → verify) composing with `tdd`/`verify-self`/`sentinel`. — **v1.4** (DIAG-01)
- ✓ `qa` — relentless repo-wide correctness sweep (5 categories) over the project's own toolchain; ✅/❌/⚠️ report with `file:line`. — **v1.4** (QA-01)
- ✓ `security-design` enrichment + agnostic `security-controls.md` reference (control-class coverage). — **v1.4** (SEC-01)
- ✓ Per-agent skill-invocation docs (Claude `/`-autocomplete vs read-SKILL.md). — **v1.4** (DOCS-01)

### Next milestone candidates (parked in BACKLOG.md)

- A `security-review` skill (audit existing code against `security-controls.md`); more v1 §6 construction skills (`vertical-slice`, `zoom-out`, `improve-architecture`, `code-patterns`); the tracks layer (ADR-014); an operations phase; multi-model Council (`--deep`) — start with `/gsd:new-milestone`.

**Shipped previously (validated):**

- ✓ M4 (v1.3) `anchor-docs` + `verify-self` + engine `anchor` command + ADR-004 — anti-hallucination loop closed (ANCHOR-01/02, VERIFY-01/02, ENG-09, M4-CC).
- ✓ M1–M3 (v1.0–v1.2) — engine, installer, Council, Fast Lane, architecture skills, adoption/bridging/extensions.

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
*Last updated: 2026-06-09 after v1.4 (M5 — Construction-phase skills) milestone*
