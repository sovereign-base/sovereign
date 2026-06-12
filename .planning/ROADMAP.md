# Roadmap: SOVEREIGN v2

Completed milestones are archived (full phase detail + final progress) under `.planning/milestones/`. The active milestone's phases live here.

## Shipped milestones

| Milestone | Scope | Phases | Status | Archive |
|-----------|-------|--------|--------|---------|
| **v1.0 — M1 Foundation** | engine · installer · Council · Fast Lane 5 · conventions | 1–5 (19 plans) | ✅ Complete (28/28 reqs, verified) | [v1.0-ROADMAP](./milestones/v1.0-ROADMAP.md) · [reqs](./milestones/v1.0-REQUIREMENTS.md) |
| **v1.1 — M2 Architecture** | adr-log · entity/api/scale/security/deploy-design · stack-select | 6–9 (7 plans) | ✅ Complete (8/8 reqs, verified) | [v1.1-ROADMAP](./milestones/v1.1-ROADMAP.md) · [reqs](./milestones/v1.1-REQUIREMENTS.md) |
| **v1.2 — M3 Adoption/Bridging/Extensions** | bridge.cjs/extension.cjs/adopt.cjs engine · bridge · import-skill · sovereign-adopt | 10–13 (9 plans) | ✅ Complete (8/8 reqs, verified) | [v1.2-ROADMAP](./milestones/v1.2-ROADMAP.md) · [reqs](./milestones/v1.2-REQUIREMENTS.md) |
| **v1.3 — M4 Ground Truth (Anti-Hallucination)** | engine `anchor` command · `anchor-docs` · `verify-self` · ADR-004 | 14–16 (3 plans) | ✅ Complete (6/6 reqs, verified) | [v1.3-ROADMAP](./milestones/v1.3-ROADMAP.md) · [reqs](./milestones/v1.3-REQUIREMENTS.md) |
| **v1.4 — M5 Construction-phase skills** | `diagnose` · `qa` · `security-controls` reference + `security-design` enrichment · per-agent invocation docs | 17–19 (3 plans) | ✅ Complete (5/5 reqs, verified) | [v1.4-ROADMAP](./milestones/v1.4-ROADMAP.md) · [reqs](./milestones/v1.4-REQUIREMENTS.md) |

**Shipped:** a zero-dependency engine + `npx sovereign-cli init` installer + **21 skills** (5 Fast Lane auto-triggerable, 16 phase-gated) + 4 subagents + 7 references + 17 engine lib modules. **190 engine tests; listing budget held at 5 auto-triggerable across all five milestones.** The full arc is covered: ideate (`council`) → align (`ubiquitous-language`, `grill-with-docs`) → architect (entity/api/stack/scale/security/deploy-design + `adr-log`) → build (`tdd`, `diagnose`, `qa`) → review (`sentinel`) → ground-truth (`anchor-docs`, `verify-self`) → adopt/bridge/extend → connect (`mcp-attach` — vetted MCP-server attachment). Engine installs into projects at `.claude/sovereign-engine/`.

> **Out-of-band contribution (post-M5):** an **MCP feature** was added on `main` by a contributor (PR #6) — `engine/bin/lib/mcp.cjs` (`mcp audit|add|list|remove`), `security.scanMcpServer` static spec-audit, the `mcp-attach` skill (5-gate vetting, `disable-model-invocation: true`), `references/mcp-servers.md`, MCP-aware `init` (`mcp.available`) for consuming skills, and 26 tests. Vetted 2026-06-12 (zero-dep, no exec/net in-engine, budget held at 5, 190 tests green); ships as **2.5.0**.

## Active milestone

_None — between milestones._ Start the next with `/gsd:new-milestone`. Candidate work is parked in [`BACKLOG.md`](./BACKLOG.md) (e.g. a `security-review` skill, more v1 §6 construction skills, the tracks layer, an operations phase, multi-model Council).
