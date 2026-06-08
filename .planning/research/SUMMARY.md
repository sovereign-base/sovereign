# Project Research Summary

**Project:** SOVEREIGN v2 — Universal Agent-Skills Engineering System
**Domain:** Deterministic Node CLI engine + thin orchestrator skills + subagents, npx-distributed
**Researched:** 2026-06-08
**Confidence:** HIGH (all four agents grounded in direct source reads: GSD engine source, official Claude Code docs, v1 archive, Matt Pocock skills repo, gstack repo)

---

## Executive Summary

SOVEREIGN v2 is a universal, project-agnostic engineering system delivered as Claude Code agent skills: gated phases, living committed state, and guardrails that guide any software project from first thought to production. The architecture has three layers — a zero-dependency Node `.cjs` engine (`sovereign-tools`) that returns all context as one JSON blob per command, thin `SKILL.md` orchestrators that call the engine first and delegate heavy reasoning to subagents, and a committed `.sovereign/` state directory that survives context resets. This is not a design choice — it is the pattern v1 proved necessary by failing without it. v1 had prose skills and no engine; skills with nothing deterministic underneath them fail exactly because of it. The engine is the one thing that must work.

All four research agents converged on the same build order: state spec and engine skeleton first (router + `output()` helper + `loadConfig` + `@file:` spill) → core engine commands (`state load/save`, `gate open/pass`, `commit`, `model` resolution) → `init <workflow>` JSON contract (the Core Value milestone) → `sovereign-init` bootstrap skill → subagent definitions → Council `--standard` (the integration proof) → Fast Lane skills (internally: `ubiquitous-language` → `grill-with-docs` → `handoff` → `sentinel` → `tdd`). The engine A→B→C chain is a hard dependency: no skill can be thin before `init` returns its JSON, because thinness IS delegation to `init`. Building any skill before the `init` contract ships is the v1 mistake.

The critical risks cluster in Phase 1 and must be locked as ADRs before any code is written: (a) engine as zero-dep `.cjs` mirroring GSD vs compiled TS; (b) ESM vs CJS packaging; (c) every command authored as a skill directory, not a bare command file; (d) dropping v1's non-standard frontmatter (`triggers`, `works-best-with`, `min-model`, bare `phase`) for the real Agent Skills spec; (e) MANIFEST as engine-derived view, not hand-maintained. Scope discipline is the recurring meta-risk — v1 built 43 skills before one engine existed, triggering listing-budget overflow and starving engine work. M1 must hold to ~7 auto-triggerable skills and use `disable-model-invocation: true` on orchestrator-only skills.

---

## Key Findings

### Recommended Stack

The engine must be plain Node CommonJS (`.cjs`), zero runtime dependencies, native `process.argv` arg parsing via a `switch(command)` router — this is precisely how the installed GSD engine works and is locked by ADR-002. No compiled TypeScript, no `tsx`, no `bun`, no `commander`/`yargs`. The shipped artifact is the source; `npx` works instantly with no build gap. JSDoc `// @ts-check` + `tsc --noEmit` (dev-only) gives type safety without a build step. The engine's `output()` helper must include GSD's `@file:/tmp/...` spill above ~50KB to survive Claude Code's Bash buffer limit — this is not optional polish.

Skills follow the Agent Skills open standard (`agentskills.io`, implemented by Claude Code): a directory `<name>/SKILL.md` with YAML frontmatter. The standard is adopted by 30+ tools; the Claude Code extensions (`disable-model-invocation`, `context: fork`, dynamic `!cmd` injection, subagent preloading) are graceful additions on top, not the base. Subagents are separate `.md` files in `agents/` with `name`/`description`/`tools`/`model` frontmatter. Extensions are wrapped via `npx skills` (vercel-labs/skills@1.5.10, ~70 agents) — never reinvented (R-003).

**Core technologies:**
- **Node.js >= 20 LTS, plain `.cjs`** — engine runtime; zero deps; instant `npx`; source-is-artifact
- **Native `process.argv` arg parsing** — machine-called CLI; GSD's `parseNamedArgs`/`parseMultiwordArg` pattern; ~40 lines, zero deps
- **JSON-on-stdout contract + `@file:` spill** — engine-skill interface; `init <workflow>` → one blob; spill above 50KB to survive Bash buffer
- **`node:test` + `node:assert`** — built-in test runner; preserves zero-dep property; pure FS+git functions are ideal targets
- **SKILL.md (Agent Skills open standard)** — skill format; `description`+`when_to_use` combined max 1,536 chars; `disable-model-invocation` for orchestrator-only skills
- **`npx skills` (vercel-labs/skills@1.5.10)** — extension discovery/install; wrap + vet, never reinvent (R-003); M3

### Expected Features

**Must have — table stakes (M1):**
- `sovereign-tools` engine — `init <workflow>` → one JSON blob; everything else is layered on this
- `.sovereign/` committed state — MANIFEST.md (<500 tokens, loads first), SOVEREIGN.md constitution, CONTEXT.md glossary, STATE.md (field-patchable), config.json, docs/ tree, council/ transcripts
- MANIFEST-first load rule — engine enforces via `init` returning `manifest_path` + optional `manifest_raw`; never left to skill discipline
- `sovereign-init` skill — `npx sovereign init --quick/--full`; bootstrap entry point
- `ubiquitous-language` skill — produces CONTEXT.md; dependency of grill + Council context injection
- `grill-with-docs` skill — first proof the engine works end-to-end; Pocock ancestor to port
- `handoff` skill — context-reset survival; baseline category promise; cheap port
- `sentinel` skill (native tier) — spec/ADR consistency + `SOVEREIGN:UNVERIFIED` marker scan; anti-hallucination beachhead
- `tdd` skill — test-discipline credibility; standalone (no M1 dependents); Pocock port
- Council `--standard` — 5 parallel advisor subagents + anonymous peer review + chairman synthesis + project-context injection + verdict/gate logging; SOVEREIGN's signature differentiator
- 5 advisor subagent definitions (Skeptic, Architect, Builder, Outsider, Risk Officer) + guard for `agents_installed`/`missing_agents`
- Recommendation-first + navigation footer + "Why this matters" conventions enforced across all skills
- Per-skill docs + skill-format / ADR-format / commenting standards

**Should have — differentiators (core M1, variants M2+):**
- Council `--express` mode — defer; add once `--standard` validated (M2)
- Anti-hallucination skills `anchor-docs` + `verify-self` — defer; sentinel's UNVERIFIED scan is the M1 beachhead (M2)
- Full decimal-phase gate machinery — concept defined in SOVEREIGN.md now; full engine machinery M2+
- Proactive Council suggestion — defer until Phase-3 skills exist (M2)
- Sentinel Tier 2 (CodeRabbit opt-in) — defer (M2)

**Defer to M3/M4+:**
- `sovereign-adopt` + adopt-mode Council — M3
- `bridge` + cross-project staleness detection — M3
- Extension protocol over `npx skills` + vetting/audit — M3
- Council `--deep` + multi-model advisors — M4+
- Phase 2-6 domain skills (entity-design, api-design, stack-select, etc.) — M2 and beyond

### Architecture Approach

The five-layer architecture (Extensions → Skills → Subagents → Engine → State) maps cleanly onto GSD's real topology. The load-bearing insight: the orchestrator never reasons about bookkeeping and the engine never reasons about anything. The engine computes paths, reads config, resolves models, and returns one JSON blob. All judgment lives in isolated subagent contexts; all flow-control lives in thin skills. `state save` regenerates MANIFEST (derived view, never hand-edited). Field-level regex patching against `**Field:**` lines keeps diffs small and merge conflicts rare. The Council flow (5 parallel advisors → anonymized peer review → chairman synthesis → gate/state/commit) is structurally identical to GSD's 4-researcher fan-out → synthesizer fan-in, proving the pattern scales to N=5.

**Major components:**
1. **`sovereign-tools.cjs` engine router** — CLI entry, arg parsing, `--raw`/`--pick`/`--cwd`/`@file:` spill, project-root resolution, command dispatch
2. **Engine: `init <workflow>`** — compound bootstrap returning one JSON blob: `{models, config, phase, context_injection, paths, exists, agents_installed, missing_agents}`; the Core Value milestone
3. **Engine: `state load/save`** — field-level `STATE.md` patching + MANIFEST regeneration on every save; `gate open/pass` as append-only writes to `SOVEREIGN.md`
4. **Engine: `commit`** — `commit_docs`+gitignore+branch-aware atomic commit; message sanitization against prompt injection
5. **Engine: `model` resolution** — `(agent, profile) → model alias`; quality/balanced/budget profiles; Council advisors = Opus under quality
6. **`.sovereign/` state store** — MANIFEST.md (derived, <500 tokens), SOVEREIGN.md (constitution + append-only gates), CONTEXT.md, STATE.md, config.json, council/ transcripts, docs/{adr,api,specs,security,infra}
7. **Skill layer (`SKILL.md` orchestrators)** — parse args, call `init`, branch on JSON flags, dispatch subagents via `Task()`, call `state save`+`commit`, print navigation footer; zero domain logic
8. **Subagent layer (`agents/*.md`)** — heavy reasoning in isolated context; read files from paths passed by skill; write artifacts to disk; return structured JSON (never prose); only orchestrator writes to `.sovereign/council/`
9. **Extension layer** — `npx skills` wrapped + vetted; `extensions/` vetting log; M3

### Critical Pitfalls

1. **Skill-listing token budget overflow (the 43-skill trap)** — Claude Code loads every skill's `description`+`when_to_use` at session start with a hard budget of 1% of the context window; combined descriptions truncated at 1,536 chars per skill; overflow silently drops skills from auto-trigger. Prevention: cap M1 to ~7 auto-triggerable skills; set orchestrator-only skills to `disable-model-invocation: true` (removes description from budget entirely); run `/doctor` as a build-time check before every milestone release.

2. **Fat `SKILL.md` bodies — orchestrator-context blowup** — an invoked skill's entire body enters context and stays there for the session; after compaction only the first 5,000 tokens re-attach under a shared 25,000-token budget. Prevention: enforce the one-call orientation rule (`init` → JSON, then content reads only on need); keep skill bodies under ~300 lines; push protocols/examples/templates to supporting `references/` files loaded on demand.

3. **Context-reset / session-continuity failure** — state held only in the conversation is lost on `/clear`, compaction, or handoff. Prevention: every skill calls `init`/`state load` first, re-orienting from disk; gates are append-only on disk; STATE.md always contains current phase + blockers + next action; navigation footer ends every skill with copy-paste next command + `/clear` note pulled from state.

4. **Race conditions on shared files from parallel subagents** — Council's 5 parallel advisors writing to the same path corrupt each other. Prevention: advisors return structured JSON to the orchestrator; only the orchestrator writes to `.sovereign/council/`; define subagent return schemas before building Council.

5. **npx packaging foot-guns** — missing shebang, wrong `bin` path, `files` omission, ESM/CJS mismatch, stale `~/.npm/_npx/` cache. Prevention: `#!/usr/bin/env node` on bin; `npm pack` → clean tarball install in a fresh dir in CI; declare `engines.node >= 20`; commit to CJS (`.cjs`) per ADR-002; never gate release on `npm link` alone.

---

## Implications for Roadmap

Based on combined research, the four agents converged on a single build order with five groupings. This is not a suggestion — it is the dependency graph.

### Phase 1: Engine Foundation

**Rationale:** Nothing is thin before `init` exists. The A→B→C chain (skeleton → core commands → `init` contract) must not be split across milestones or interrupted by skill work. This phase ends when a skill can call `sovereign-tools init council` and receive the full JSON blob. R-002 in concrete form.

**Delivers:**
- `.sovereign/` directory layout + templates (MANIFEST, SOVEREIGN.md, STATE.md, CONTEXT.md, config.json)
- `sovereign-tools.cjs` router: `main()`, `runCommand()` switch, `--raw`/`--pick`/`--cwd` flags, `@file:` spill (copy GSD patterns verbatim)
- `loadConfig()` (defaults ← global ← project deep-merge) + `MODEL_PROFILES` table
- `output()` helper with 50KB tmpfile spill
- `state load` / `state patch` / `state save` (field-level regex) + MANIFEST regeneration on save
- `gate open` / `gate pass` (append-only to `SOVEREIGN.md`)
- `commit` (commit_docs + gitignore + branch + message sanitization)
- `model` resolution (`(agent, profile) → alias`)
- `init <workflow>` contracts for: `sovereign-init`, `council`, and each Fast Lane skill
- Clean `npm pack` / tarball smoke test in CI (shebang, bin, CJS, Node engine)

**ADRs to lock in this phase (before any code):**
- (a) Engine = zero-dep `.cjs`, no compiled TS, no `tsx`, no `bun`
- (b) CJS packaging; `"type"` not set to `"module"`; `engines.node >= 20`
- (c) Every command as a skill directory (`skills/<name>/SKILL.md`), not a bare `commands/*.md` file (skill wins on name clash)
- (d) No v1 frontmatter (`triggers`, `works-best-with`, `min-model`, bare `phase`); use `description`+`when_to_use`; namespaced `metadata:` for portability hints only
- (e) MANIFEST is engine-derived on every `state save`; never hand-edited

**Avoids:** Pitfall 2 (fat SKILL bodies — load rule), Pitfall 4 (context-reset amnesia), Pitfall 7 (npx distribution), Pitfall 8 (subagent file races — schema contract defined here)

**Research flag:** Standard patterns. GSD engine source read directly — HIGH confidence. No additional research needed.

---

### Phase 2: Bootstrap + Subagent Definitions

**Rationale:** `sovereign-init` is the front door — it must exist before any skill can create a `.sovereign/` directory. Subagent definitions depend on model resolution (Phase 1) but not on `sovereign-init`, so they can be built in parallel. Both must exist before Council or any Fast Lane skill is authored.

**Delivers:**
- `sovereign-init` skill (`--quick`/`--full`) — calls `init sovereign-init`, bootstraps `.sovereign/` from templates, idempotent
- 5 advisor subagent definitions (Skeptic, Architect, Builder, Outsider, Risk Officer) — parameterized by lens; all same model with different prompts
- Chairman / synthesizer, sentinel reviewer, planner, researcher subagent definitions
- `available_agent_types` guard; `agents_installed`/`missing_agents` hard-error path in every skill
- Structured return JSON schema per subagent (defined before any subagent is used)
- Invocation model locked: ~7 auto-triggerable skills; `disable-model-invocation: true` on all orchestrator-only skills; `/doctor` budget check passes

**Avoids:** Pitfall 1 (listing-budget overflow), Pitfall 8 (silent general-purpose fallback when named agent missing)

**Research flag:** Standard patterns. GSD agent definitions read directly — HIGH confidence. No additional research needed.

---

### Phase 3: Council `--standard` (Integration Proof)

**Rationale:** Council exercises every engine primitive (init, state save, gate pass, commit, model resolution) plus the full fan-out/fan-in pattern. Completing Council end-to-end proves the entire architecture before any Fast Lane skill is written. If Council works, the architecture is validated; if it breaks, we find out before writing 5 more skills against wrong contracts.

**Delivers:**
- `council` skill (`--standard` only — `--express`/`--deep` deferred)
- 5-advisor parallel fan-out (all using `sovereign-advisor` subagent, each with a different `<lens>` prompt)
- Project-context injection from `.sovereign/` (MANIFEST + CONTEXT.md + relevant ADRs, paths from `init council` JSON)
- Anonymized peer review round (advisors A-E, not identified)
- Chairman synthesis → timestamped transcript to `.sovereign/council/council-YYYYMMDD-NNN.md`
- Verdict → PASS/CONDITIONAL/BLOCKED logged via `gate pass` (append-only)
- `state save` (regenerates MANIFEST) + `commit` with sanitized message
- Navigation footer with next-action + copy-paste command

**Hard guardrails locked here:**
- Only the orchestrator writes to `.sovereign/council/`; advisors return JSON to the skill
- All 5 advisor subagents use `disable-model-invocation: true`
- Council itself uses `disable-model-invocation: true` (side-effecting; deliberate invocation only)

**Avoids:** Pitfall 8 (file races, prose returns), Pitfall 4 (context-reset — gate on disk), Pitfall 1 (Council is orchestrator-only, costs zero listing budget)

**Research flag:** Council protocol well-documented in v1 archive + GSD fan-out pattern verified. The anonymized peer-review round (shuffle A-E, dispatch reviewer, chairman resolves minority positions) has no direct GSD analog — a brief design spike on the anonymization mechanism and chairman prompt shape is recommended before implementation.

---

### Phase 4: Fast Lane Skills

**Rationale:** All five Fast Lane skills depend on the engine, bootstrap, and state model — all of which exist by Phase 3. They are mutually independent and can be built in parallel across plans. Recommended internal order: `ubiquitous-language` first (produces CONTEXT.md consumed by grill and Council) → `grill-with-docs` → `handoff` → `sentinel` → `tdd` (standalone, safest to build last).

**Delivers:**
- `ubiquitous-language` — writes `.sovereign/CONTEXT.md` glossary; DDD bounded-context detection; thin Pocock-style orchestrator
- `grill-with-docs` — thin orchestrator proof over the engine; consumes CONTEXT.md; ports Pocock content from v1 archive
- `handoff` — reads MANIFEST+STATE via engine; writes handoff doc; high value-to-effort
- `sentinel` (native tier) — spec/ADR consistency check + `SOVEREIGN:UNVERIFIED` marker scan; anti-hallucination convention established; CodeRabbit Tier 2 deferred
- `tdd` — red-green-refactor discipline; standalone; ports Pocock `tdd`

**Token budget check gate after this phase:** run `/doctor`; verify all ~7 auto-triggerable skills remain within 1% budget; verify no description collisions between any two skills.

**Avoids:** Pitfall 3 (vague/over-broad descriptions — skill-format reference enforced), Pitfall 5 (sprawl — only these 5, no additions)

**Research flag:** `grill-with-docs` and `tdd` have direct Pocock ancestors — well-documented, HIGH confidence. `sentinel`'s `SOVEREIGN:UNVERIFIED` marker convention is net-new; define marker format, scan rules, and gate-blocking threshold as a mini-ADR before implementing sentinel.

---

### Phase 5: Conventions + Per-Skill Docs

**Rationale:** Conventions cannot be enforced until real skills exist to apply them to. This phase codifies what Phases 2-4 demonstrate and creates the authoring standards that extensions and future phase skills must follow.

**Delivers:**
- Recommendation-first, navigation footer, "Why this matters" conventions formalized as a skill-format reference
- Per-skill documentation (one page per M1 skill)
- ADR-format reference
- Commenting standard
- SKILL_FORMAT authoring guide (description template, trigger specification, progressive disclosure, thin-body checklist)

**Research flag:** Standard patterns. Matt Pocock's `write-a-skill` + GSD's `references/` are direct models. No additional research needed.

---

### Phase Ordering Rationale

- **Hard chain Phases 1-2 cannot be reordered.** `init` contract depends on `loadConfig` + model resolution + state primitives. No skill can be thin before `init` returns its JSON — this is R-002 in concrete form.
- **Council before Fast Lane (Phase 3 before 4)** because Council exercises every engine primitive in combination — it is the integration test. Finding a contract gap during Council is far cheaper than finding it after 5 Fast Lane skills are built against wrong assumptions.
- **`ubiquitous-language` first within Fast Lane** because two other M1 components (grill-with-docs and Council context injection) consume CONTEXT.md. Building it last would block or require rework.
- **`tdd` last within Fast Lane** because it has no M1 dependents and is the most standalone; it can be parallelized or shifted without blocking anyone.
- **Conventions last (Phase 5)** because conventions are distilled from the experience of building real skills; writing them first produces theory that doesn't match practice.

### Research Flags

Phases needing a design spike or deeper research during planning:
- **Phase 3 (Council):** The anonymized peer-review round (shuffle advisor outputs A-E, dispatch review pass, handle minority positions) has no direct GSD analog. A brief design spike on the anonymization mechanism and the chairman prompt shape is recommended before implementation.
- **Phase 4 (`sentinel`):** The `SOVEREIGN:UNVERIFIED` marker convention (marker format, scan rules, gate-blocking threshold) is net-new to any comparable system. Define the marker spec and scan algorithm as a mini-ADR before implementing the skill.

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Engine):** GSD engine source read directly at HIGH confidence. Router, `output()`, `loadConfig`, `@file:` spill, field-level patching, `cmdCommit`, `resolveModelInternal` — all have proven GSD reference implementations.
- **Phase 2 (Bootstrap + Subagents):** GSD agent frontmatter read directly. `sovereign-init` bootstrap mirrors GSD's `templates/` seeding pattern exactly.
- **Phase 4 (`grill-with-docs`, `tdd`, `handoff`):** Direct Pocock ancestors verified. Port content from v1 archive + Pocock; adapt to engine.
- **Phase 5 (Conventions):** Pocock's `write-a-skill` + GSD's `references/` are direct models.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | GSD engine source read directly; official Claude Code docs fetched 2026-06-08; npm versions verified live. The `.cjs`/zero-dep/switch-router decision is verified against a working system, not inferred. |
| Features | HIGH | All four comparison systems (GSD, gstack, Pocock, find-skills) read directly. Feature table grounded in direct code reads. M1 scope matches PROJECT.md exactly. |
| Architecture | HIGH | GSD `bin/lib/*.cjs` source read directly for every engine component. Proposed contracts derived from `cmdInit*`, `cmdStatePatch`, `resolveModelInternal`, `cmdCommit` implementations. One net-new component: MANIFEST regeneration (GSD has no MANIFEST equivalent — mechanism is sound but untested in practice). |
| Pitfalls | HIGH | Skill-listing budget mechanics verified in official Claude Code docs (1%, 1,536 chars, `disable-model-invocation` removes from budget). GSD ground truth for context-reset survival. v1 archive for the 43-skill failure mode. |

**Overall confidence:** HIGH

### Gaps to Address

- **MANIFEST regeneration algorithm** — GSD has no MANIFEST equivalent; the token-counting + field-derivation logic inside `state save` is net-new. The approach (derive from authoritative state files) is correct in principle; exact implementation (which fields, how truncated, how serialized) needs to be designed during Phase 1. Treat as a Phase 1 design task, not a research gap.

- **Anonymized peer-review mechanism** — The Council's peer-review round (shuffle A-E, dispatch reviewer, synthesize minority positions) is not present in any comparison system. Intent is clear from v1's Council design; the implementation (reviewer prompt shape, how chairman resolves minority views, whether second-round rebuttal is in `--standard` or only `--deep`) needs a design spike in Phase 3.

- **`SOVEREIGN:UNVERIFIED` marker spec** — The convention (place a marker when the agent is uncertain, scan in sentinel, count in MANIFEST) is correct; exact marker syntax, valid contexts, and scan rules are undefined. Define as a mini-ADR in Phase 4 before sentinel is implemented.

- **Per-agent `npx skills` install paths** — Exact paths for non-Claude agents shift as the ecosystem evolves. MEDIUM confidence on this layer; delegate to `npx skills` for path resolution rather than hardcoding in `sovereign-init`.

- **Multi-agent compatibility** — SOVEREIGN's engine integration (subagents, `disable-model-invocation`, `context: fork`, `!cmd` injection) is Claude Code-specific. The SKILL.md format is portable; the mechanics are not. Do not claim cross-agent compatibility until validated on another agent. Per-skill `model:`/`effort:` frontmatter for model requirements; no global `min-model` floor.

---

## Sources

### Primary (HIGH confidence)

- `~/.claude/get-shit-done/bin/gsd-tools.cjs` + `bin/lib/*.cjs` (VERSION 1.30.0) — router, `init` family, `loadConfig`, `output()`/`error()`, `@file:` spill, `state` module, field-level patching, `cmdCommit`, `resolveModelInternal`, `MODEL_PROFILES`
- `~/.claude/agents/gsd-planner.md` + other `gsd-*.md` agents — subagent frontmatter shape
- `~/.claude/get-shit-done/workflows/new-project.md` — orchestrator pattern: `init` first, parallel `Task()` fan-out, synthesizer fan-in, `available_agent_types`, path-passing, write-then-return
- `code.claude.com/docs/en/skills` (fetched 2026-06-08) — frontmatter reference, `skillListingBudgetFraction` (1%), `maxSkillDescriptionChars` (1,536), discovery locations, `disable-model-invocation`, compaction re-attach budgets (5k/25k)
- `platform.claude.com/docs/en/agents-and-tools/agent-skills/overview` (fetched 2026-06-08) — `name` constraints (64 chars, lowercase-hyphen, no `anthropic`/`claude`), `description` requirements
- `code.claude.com/docs/en/sub-agents` (fetched 2026-06-08) — subagent fields, `skills:` preload, `mcpServers`
- `archive/v1/skills/council/SKILL.md`, `archive/v1/skills/fast-lane/*/SKILL.md` — Council protocol design, v1 content to mine
- `archive/v1/SOVEREIGN_PROJECT.md` — 43-skill inventory, the over-scope failure mode
- `archive/v1/templates/MANIFEST.md` — MANIFEST field structure + <500-token mandate
- `github.com/mattpocock/skills` — `grill-with-docs`, `tdd`, `handoff`, `write-a-skill`; thin SKILL.md craft, progressive disclosure, recommendation-first
- `github.com/garrytan/gstack` — 23 role-based skills, role-chain pattern, atomic commit per fix, GBrain
- `~/.claude/skills/find-skills/SKILL.md` + `npm view skills` (1.5.10) — `npx skills` commands, R-003
- `.planning/PROJECT.md` + `/SOVEREIGN.md` — north star, milestones, ADRs, locked decisions

### Secondary (MEDIUM confidence)

- `agentskills.io` / WebSearch cross-sources — open standard adoption by 30+ tools (Codex, Cursor, Gemini CLI, Copilot); cross-tool portability claims (agentskills.io itself timed out; secondary sources agree)
- WebSearch (npm docs, DEV) — npx shebang / bin / ESM-CJS / stale cache mechanics
- WebSearch (Tembo, claudefa.st, Anthropic blog, CloudZero) — subagent linear token cost, file race conditions, structured-output schemas, vague-prompt failures

---
*Research completed: 2026-06-08*
*Ready for roadmap: yes*
