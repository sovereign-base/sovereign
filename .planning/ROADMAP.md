# Roadmap: SOVEREIGN v2 (Milestone M1 — Foundation)

## Overview

M1 builds SOVEREIGN's foundation in the one order the research is willing to defend: the engine before everything else. We ship a zero-dependency Node `.cjs` engine that returns all context as one JSON blob per command, the committed `.sovereign/` state model it manages, the bootstrap that scaffolds it into a project, the subagents and Council that prove the architecture end-to-end, the five Fast Lane skills that ride on top, and finally the conventions and docs distilled from building all of it. The hard chain is `state spec + engine skeleton → core engine commands → init <workflow> JSON contract`; no skill is allowed to be "thin" before `init` returns its blob, because thinness *is* delegation to `init`. Council is placed as the integration proof so a contract gap surfaces against one orchestrator, not five. This is R-002 in concrete form: v1 failed by writing skills with no engine underneath them.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Engine Foundation** - Zero-dep `.cjs` engine + `.sovereign/` state model; a skill can call `init <workflow>` and get one JSON blob (completed 2026-06-08)
- [x] **Phase 2: Bootstrap + Subagent Definitions** - `npx sovereign init` scaffolds `.sovereign/`; advisor + reasoning subagents defined; listing-budget held (completed 2026-06-08)
- [x] **Phase 3: Council `--standard` (Integration Proof)** - 5 parallel advisors + anonymous peer review + chairman verdict exercise every engine primitive end-to-end (completed 2026-06-08)
- [x] **Phase 4: Fast Lane Skills** - `ubiquitous-language`, `grill-with-docs`, `handoff`, `sentinel`, `tdd` — thin orchestrators over the engine (completed 2026-06-08)
- [x] **Phase 5: Conventions + Per-Skill Docs** - SKILL_FORMAT / ADR-FORMAT / commenting standards + one doc page per M1 skill, distilled from what was built (completed 2026-06-09)

## Phase Details

### Phase 1: Engine Foundation
**Goal**: A skill can orient itself with a single CLI call — `sovereign-tools init <workflow>` returns resolved models, config, phase status, and file paths+existence as one JSON blob — backed by a committed `.sovereign/` state model the engine reads and regenerates.
**Depends on**: Nothing (first phase)
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, STATE-01, STATE-02, STATE-03
**Success Criteria** (what must be TRUE):
  1. Running `sovereign-tools init <workflow>` returns one JSON blob with resolved models, config flags, phase status, and file paths+existence; payloads over ~50KB spill to a `@file:` tmpfile.
  2. An agent can `state load` and `state save` with field-level patching (no whole-file rewrites), and `gate open`/`gate pass <phase>` append to `SOVEREIGN.md`; `commit` respects `commit_docs` + gitignore, and `model <agent>` resolves per the configured profile.
  3. A fresh project has a `.sovereign/` tree (MANIFEST.md, SOVEREIGN.md, CONTEXT.md, STATE.md, config.json, docs/); MANIFEST.md is regenerated on every `state save` and stays within ~500 tokens (engine-derived, never hand-edited).
  4. The engine runs as zero-dependency `.cjs` with no build step: `node --test` passes and an `npm pack` clean-install smoke test in a fresh dir succeeds (shebang, bin path, CJS, `engines.node >= 20`).
  5. `sovereign-tools validate skills` lints SKILL.md frontmatter (name ≤64 chars, lowercase-hyphen, no "claude"/"anthropic"; description within cap) and exits non-zero on violations.
**Plans**: 5 plans
Plans:
- [x] 01-01-PLAN.md — ADRs (before code) + engine/ CJS scaffold + .sovereign/ templates
- [x] 01-02-PLAN.md — Engine layer A: router, arg helpers, output() @file: spill, loadConfig, model-profiles
- [x] 01-03-PLAN.md — Engine layer B (state): state load/save field-patch, derived MANIFEST regen, gate open/pass
- [x] 01-04-PLAN.md — Engine layer B (commands): commit (gated+sanitized), model/resolve-model, validate skills
- [x] 01-05-PLAN.md — Engine layer C: init <workflow> nested JSON contract + npm pack clean-install smoke test
**ADRs locked in this phase (before code)**: (a) engine = zero-dep `.cjs`, no compiled TS/`tsx`/`bun`; (b) CJS packaging, `"type"` not `"module"`, `engines.node >= 20`; (c) every command authored as a skill directory (skill wins over bare command file on name clash); (d) drop v1 non-standard frontmatter (`triggers`, `works-best-with`, `min-model`, bare `phase`) for the real Agent Skills spec; (e) MANIFEST is engine-derived on every `state save`. The subagent return-JSON schema contract is also fixed here.

### Phase 2: Bootstrap + Subagent Definitions
**Goal**: A user can install SOVEREIGN and scaffold `.sovereign/` in one command, and every subagent the later phases dispatch is defined with a fixed return schema — while the skill-listing token budget stays within Claude Code's limit.
**Depends on**: Phase 1
**Requirements**: INIT-01, INIT-02, INIT-03, SKL-07
**Success Criteria** (what must be TRUE):
  1. `npx sovereign init` installs SOVEREIGN skills and scaffolds `.sovereign/` from templates in the user's project.
  2. `init --quick` installs only the Fast Lane 5; `init --full` installs the full M1 skill set; re-running either is idempotent and version-aware (safe, updates cleanly).
  3. The M1-dispatched subagents (`sovereign-advisor` parameterized shell, `sovereign-chairman`, `sovereign-peer-reviewer`, `sovereign-sentinel`) are defined, each returning validated JSON (never prose), with an `agents_installed`/`missing_agents` hard-error path (no silent general-purpose fallback). NOTE (scope decision, 02-CONTEXT): `planner`/`researcher` are DEFERRED — M1 has no skill that dispatches them; defining callerless agents is the over-scope trap. The 5 Council lens personas (Skeptic/Architect/Builder/Outsider/Risk Officer) are CONTENT injected by the Phase-3 Council orchestrator into the single advisor shell.
  4. Orchestrator-only skills set `disable-model-invocation: true`; the set of auto-triggerable M1 skills stays within the skill-listing budget (~7 max), verified by a `/doctor`-style check.
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — `npx sovereign init` installer: copy skills+agents to .claude/, scaffold .sovereign/, --quick/--full, idempotent + version-aware (INIT-01/02/03)
- [x] 02-02-PLAN.md — 4 M1-dispatched subagent definitions (advisor/chairman/peer-reviewer/sentinel) with fixed JSON return schemas + agents added to package files allowlist (INIT-01)
- [x] 02-03-PLAN.md — real agents_installed/missing_agents check (replaces stub) + `doctor` listing-budget command + disable-model-invocation convention (SKL-07, INIT-01)

### Phase 3: Council `--standard` (Integration Proof)
**Goal**: `/council --standard "<decision>"` runs end-to-end and in doing so exercises every engine primitive in combination (init, state save, gate pass, commit, model resolution) plus the full parallel fan-out / fan-in — validating the architecture before any Fast Lane skill is written.
**Depends on**: Phase 2
**Requirements**: CNL-01, CNL-02, CNL-03, CNL-04
**Success Criteria** (what must be TRUE):
  1. A user runs `/council --standard "<decision>"` and receives five distinct advisor perspectives (Skeptic, Architect, Builder, Outsider, Risk Officer) produced by parallel subagents.
  2. Council injects project context (CONTEXT.md glossary, current phase, relevant ADRs) into every advisor using paths from the `init council` JSON, then runs an anonymous peer-review round (responses anonymized A–E and cross-reviewed) before synthesis.
  3. Council produces a chairman synthesis and a binding verdict (PASS / CONDITIONAL PASS / BLOCKED), written by the orchestrator only to a timestamped transcript in `.sovereign/council/`, and referenced in the gate log via `gate pass`.
  4. The full side-effecting cycle completes: `state save` regenerates MANIFEST, `commit` lands with a sanitized message, and a navigation footer prints the next action + copy-paste command; all advisors and the Council skill itself use `disable-model-invocation: true`.
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md — Author lenses.md: the 5 locked advisor lenses + the 3 subagent JSON return contracts (CNL-01)
- [x] 03-02-PLAN.md — Author the thin council SKILL.md: --standard 7-dispatch flow (init → 5 parallel advisors → anonymized A–E peer review → chairman verdict → orchestrator-only transcript → state save/gate pass/commit → nav footer) (CNL-01..04)
**Research flag**: Design spike before implementation — the anonymized peer-review round (shuffle A–E, dispatch reviewer, chairman resolves minority positions) has no direct GSD analog; pin the anonymization mechanism and chairman prompt shape.

### Phase 4: Fast Lane Skills
**Goal**: The five Fast Lane skills exist as thin orchestrators over the engine — mutually independent, each orienting via a single `init` call — establishing the Fast Lane category SOVEREIGN promises.
**Depends on**: Phase 3
**Requirements**: SKL-01, SKL-02, SKL-03, SKL-04, SKL-05, SKL-06, CONV-03
**Success Criteria** (what must be TRUE):
  1. `ubiquitous-language` establishes/updates the CONTEXT.md glossary one term at a time, detecting conflicts with existing terms; `grill-with-docs` interrogates a plan against CONTEXT.md + ADRs one question at a time, recommendation-first, updating docs inline.
  2. `handoff` compresses the current session into a resumable handoff document read back via the engine; `tdd` drives a red-green-refactor loop.
  3. The `SOVEREIGN:UNVERIFIED` marker specification is defined (mini-ADR), and `sentinel` scans for it plus checks commenting-standard, spec alignment, and ADR consistency, emitting a structured verdict.
  4. Every Fast Lane skill is a thin orchestrator: orients via a single `init` call, ends with a navigation footer (recommended next + alternatives), and includes a plain-language "Why this matters" section.
  5. After this phase, a `/doctor`-style budget check confirms all ~7 auto-triggerable skills remain within the 1% listing budget with no description collisions.
**Plans**: 6 plans
Plans:
- [x] 04-01-PLAN.md — Author the SOVEREIGN:UNVERIFIED marker spec (engine/references/unverified-marker.md) (CONV-03)
- [x] 04-02-PLAN.md — Author ubiquitous-language skill: glossary one term at a time, conflict detection (SKL-01, SKL-06)
- [x] 04-03-PLAN.md — Author grill-with-docs skill: interrogate a plan vs CONTEXT.md + ADRs, recommendation-first, inline updates (SKL-02, SKL-06)
- [x] 04-04-PLAN.md — Author handoff skill: compress session into resumable HANDOFF.md, STATE via engine (SKL-03, SKL-06)
- [x] 04-05-PLAN.md — Author tdd skill: red-green-refactor, behavior-at-interface, stack-agnostic (SKL-05, SKL-06)
- [x] 04-06-PLAN.md — Author sentinel skill: native-tier reviewer, UNVERIFIED scan + commenting + spec + ADR → structured verdict (SKL-04, SKL-06)
**Research flag**: Define the `SOVEREIGN:UNVERIFIED` marker spec (format, valid contexts, scan rules, gate-blocking threshold) as a mini-ADR before implementing `sentinel` (plan 04-01, satisfied first in wave 1).

### Phase 5: Conventions + Per-Skill Docs
**Goal**: The authoring standards and documentation that codify what Phases 1–4 demonstrated — so extensions and future-milestone skills have a concrete spec to follow rather than theory written before practice.
**Depends on**: Phase 4
**Requirements**: CONV-01, CONV-02, CONV-04
**Success Criteria** (what must be TRUE):
  1. A SKILL_FORMAT reference defines SOVEREIGN's standard frontmatter and the thin-body / single-`init`-load rule, explicitly dropping v1's non-standard fields (`triggers`, `works-best-with`, `min-model`, `tokens`).
  2. ADR-FORMAT and COMMENTING standard references exist and are referenced by the relevant skills.
  3. Recommendation-first, navigation-footer, and "Why this matters" conventions are formalized in the skill-format reference and verifiably present across all M1 skills.
  4. Each M1 skill has one documentation page (what it does, when to use, an example, navigation, and token cost).
**Plans**: TBD

---

# Milestone v1.1 — M2 (Architecture)

## Overview

M2 adds SOVEREIGN's Phase-3 (Architecture) design skills: the conversational, recommendation-first skills that turn a grilled idea into a *recorded* architecture. This is **pure skill authoring** — every skill is a hand-authored thin orchestrator over the M1 engine, with no engine changes and no new subagents. Each skill orients via one `sovereign-tools init <skill>` call, asks recommendation-first one question at a time, and writes durable docs under `.sovereign/docs/{,/adr,/api,/security,/infra}`. Build order is dictated by content dependency: `adr-log` lands first because every later skill *offers* ADRs through it (the `adr-format.md` 3-condition gate); `entity-design` precedes `api-design` because the API exposes the entities; `stack-select`, `scale-design`, `security-design`, and `deploy-design` are mutually independent after that and are grouped by affinity at standard granularity. ARCH-08 (the thin-orchestrator shape: `disable-model-invocation`, "Why this matters", nav footer, `validate skills` clean, doctor budget held at the 5 Fast Lane skills) is **cross-cutting** — it is a success criterion of every M2 phase, not a phase of its own.

## Phases

- [x] **Phase 6: ADR Log + Entity Design** - Record decisions to `.sovereign/docs/adr/` (the 3-condition gate) and model the domain one entity at a time — the foundation every later architecture skill builds on (completed 2026-06-09)
- [x] **Phase 7: API Design** - Contract-first, protocol-agnostic API design producing a living `API_SPEC.md` over the Phase-6 entities (completed 2026-06-09)
- [x] **Phase 8: Stack & Scale Design** - Recommendation-first stack selection and a scaling-strategy conversation, each recording ADR-worthy decisions (completed 2026-06-09)
- [ ] **Phase 9: Security & Deploy Design** - Layered `SECURITY_MODEL.md` and budget-aware `DEPLOY_MODEL.md` — closing out the Architecture phase

## Phase Details

### Phase 6: ADR Log + Entity Design
**Goal**: A user can record architectural decisions through a gated `adr-log` skill and model their domain through `entity-design` — establishing the two artifacts (ADRs + entities) that every subsequent M2 skill references.
**Depends on**: Phase 5 (M1 complete: engine, `validate skills`, doctor, `skill-format.md`/`adr-format.md` conventions)
**Requirements**: ARCH-01, ARCH-02, ARCH-08
**Success Criteria** (what must be TRUE):
  1. Running `adr-log` records a decision to `.sovereign/docs/adr/NNNN-slug.md` — sequentially numbered, in the minimal `adr-format.md` form — and the skill applies the three-condition gate (hard-to-reverse + surprising + a real trade-off), declining to log decisions that fail it.
  2. Running `entity-design` walks the user through entities, relationships, and bounded contexts one piece at a time, drawing terms from the `CONTEXT.md` glossary and recording the domain model to `.sovereign/docs/`.
  3. `entity-design` offers ADR-worthy modeling choices to `adr-log` rather than re-implementing decision recording (the two skills compose).
  4. Both skills are thin orchestrators: each orients via a single `sovereign-tools init <skill>` call, opens with a plain-language "Why this matters" section, asks recommendation-first one question at a time, and ends with a navigation footer; both set `disable-model-invocation: true`.
  5. `sovereign-tools validate skills` passes for both skills and `sovereign-tools doctor` still reports the auto-trigger listing budget at the 5 Fast Lane skills (neither M2 skill is auto-triggerable).
**Plans**: 2 plans
Plans:
- [x] 06-01-PLAN.md — Author adr-log skill: 3-condition gate + NNNN numbering + minimal-form write to .sovereign/docs/adr/ (ARCH-01, ARCH-08)
- [x] 06-02-PLAN.md — Author entity-design skill: glossary-driven, one-piece-at-a-time, ENTITY_MODEL.md, offers adr-log (ARCH-02, ARCH-08)
**UI hint**: no

### Phase 7: API Design
**Goal**: A user can design a contract-first API over their domain model and walk away with a living `API_SPEC.md` that downstream construction can implement against.
**Depends on**: Phase 6 (the API exposes the entities from `entity-design`; ADR-worthy choices route through `adr-log`)
**Requirements**: ARCH-03, ARCH-08
**Success Criteria** (what must be TRUE):
  1. Running `api-design` guides the user through a protocol-agnostic contract (REST / GraphQL / gRPC / events), recommendation-first, one decision at a time, referencing the Phase-6 entities.
  2. The skill produces a living `.sovereign/docs/api/API_SPEC.md` covering endpoints/messages, auth, versioning, errors, and pagination, and updates it in place on re-run rather than duplicating.
  3. Protocol and contract decisions that meet the three-condition gate are offered to `adr-log`.
  4. The skill is a thin orchestrator: single `init` orient call, "Why this matters" section, recommendation-first questioning, navigation footer, and `disable-model-invocation: true`; `validate skills` passes and the doctor budget stays at the 5 Fast Lane skills.
**Plans**: 1 plan
Plans:
- [x] 07-01-PLAN.md — Author api-design skill: contract-first protocol-agnostic, reads ENTITY_MODEL.md, walks decisions one at a time, living API_SPEC.md (in-place update), offers adr-log (ARCH-03, ARCH-08)
**UI hint**: no

### Phase 8: Stack & Scale Design
**Goal**: A user gets a guided, recommendation-first technology-stack selection and a scaling-strategy conversation — each grounded in their project's real constraints and each recording its consequential choices as ADRs.
**Depends on**: Phase 6 (decisions route through `adr-log`; independent of Phase 7)
**Requirements**: ARCH-04, ARCH-05, ARCH-08
**Success Criteria** (what must be TRUE):
  1. Running `stack-select` produces a recommendation-first stack choice driven by project type, scale, budget, and constraints (explicitly not trend-following), with its rationale recorded and ADR-worthy choices offered to `adr-log`.
  2. Running `scale-design` walks the user through expected load, read/write ratio, caching, queues, and data-layer bottlenecks, producing a recorded scaling strategy plus ADRs.
  3. Both skills compose with `adr-log` (offer decisions, do not re-implement recording) and draw project context from the `init` JSON rather than re-reading files.
  4. Both skills are thin orchestrators: single `init` orient call, "Why this matters" section, recommendation-first questioning, navigation footer, and `disable-model-invocation: true`; `validate skills` passes for both and the doctor budget stays at the 5 Fast Lane skills.
**Plans**: 2 plans
Plans:
- [x] 08-01-PLAN.md — Author stack-select skill: recommendation-first (NOT trend-following) stack choice by project type/scale/budget/constraints, per-layer recommendations, STACK.md, currency-honesty flag, offers adr-log (ARCH-04, ARCH-08)
- [x] 08-02-PLAN.md — Author scale-design skill: real scaling conversation (load, read/write ratio, caching, queues, DB bottlenecks, scaling triggers), concrete recommendations, SCALE_STRATEGY.md, offers adr-log (ARCH-05, ARCH-08)
**UI hint**: no

### Phase 9: Security & Deploy Design
**Goal**: A user designs a layered security model and a budget-aware deployment plan, recording each as a durable doc — closing out SOVEREIGN's Architecture phase so a project enters Construction with its architecture fully captured.
**Depends on**: Phase 6 (decisions route through `adr-log`; independent of Phases 7 and 8)
**Requirements**: ARCH-06, ARCH-07, ARCH-08
**Success Criteria** (what must be TRUE):
  1. Running `security-design` walks the user through a layered model (auth/authz, data classification, app/OWASP, infra, agent/prompt-injection) and records it to `.sovereign/docs/security/SECURITY_MODEL.md`.
  2. Running `deploy-design` produces a budget-aware plan (self-hosted vs managed, container strategy, IaC, CI/CD, environments, DR) recorded to `.sovereign/docs/infra/DEPLOY_MODEL.md`.
  3. Both skills offer their consequential choices to `adr-log` and update their respective docs in place on re-run.
  4. Both skills are thin orchestrators: single `init` orient call, "Why this matters" section, recommendation-first questioning, navigation footer, and `disable-model-invocation: true`; `validate skills` passes for both and `doctor` confirms the auto-trigger budget remains at the 5 Fast Lane skills after all 7 M2 skills are installed.
**Plans**: TBD
**UI hint**: no

## Progress

**Execution Order:**
M1 phases (complete) executed in numeric order: 1 → 2 → 3 → 4 → 5
M2 phases execute in numeric order: 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Engine Foundation | 5/5 | Complete   | 2026-06-08 |
| 2. Bootstrap + Subagent Definitions | 3/3 | Complete   | 2026-06-08 |
| 3. Council `--standard` | 2/2 | Complete   | 2026-06-08 |
| 4. Fast Lane Skills | 6/6 | Complete   | 2026-06-08 |
| 5. Conventions + Per-Skill Docs | 3/3 | Complete   | 2026-06-09 |
| 6. ADR Log + Entity Design | 2/2 | Complete   | 2026-06-09 |
| 7. API Design | 1/1 | Complete   | 2026-06-09 |
| 8. Stack & Scale Design | 2/2 | Complete   | 2026-06-09 |
| 9. Security & Deploy Design | 0/? | Not started | - |
