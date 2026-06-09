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

## Active milestone

_None — between milestones._ Start the next with `/gsd:new-milestone`. Candidate work is parked in [`BACKLOG.md`](./BACKLOG.md) (e.g. a `diagnose`/debugging skill, `security-design` enrichment, the tracks layer).
