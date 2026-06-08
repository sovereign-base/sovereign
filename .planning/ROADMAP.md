# Roadmap: SOVEREIGN v2 (Milestone M1 — Foundation)

## Overview

M1 builds SOVEREIGN's foundation in the one order the research is willing to defend: the engine before everything else. We ship a zero-dependency Node `.cjs` engine that returns all context as one JSON blob per command, the committed `.sovereign/` state model it manages, the bootstrap that scaffolds it into a project, the subagents and Council that prove the architecture end-to-end, the five Fast Lane skills that ride on top, and finally the conventions and docs distilled from building all of it. The hard chain is `state spec + engine skeleton → core engine commands → init <workflow> JSON contract`; no skill is allowed to be "thin" before `init` returns its blob, because thinness *is* delegation to `init`. Council is placed as the integration proof so a contract gap surfaces against one orchestrator, not five. This is R-002 in concrete form: v1 failed by writing skills with no engine underneath them.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Engine Foundation** - Zero-dep `.cjs` engine + `.sovereign/` state model; a skill can call `init <workflow>` and get one JSON blob
- [ ] **Phase 2: Bootstrap + Subagent Definitions** - `npx sovereign init` scaffolds `.sovereign/`; advisor + reasoning subagents defined; listing-budget held
- [ ] **Phase 3: Council `--standard` (Integration Proof)** - 5 parallel advisors + anonymous peer review + chairman verdict exercise every engine primitive end-to-end
- [ ] **Phase 4: Fast Lane Skills** - `ubiquitous-language`, `grill-with-docs`, `handoff`, `sentinel`, `tdd` — thin orchestrators over the engine
- [ ] **Phase 5: Conventions + Per-Skill Docs** - SKILL_FORMAT / ADR-FORMAT / commenting standards + one doc page per M1 skill, distilled from what was built

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
- [ ] 01-04-PLAN.md — Engine layer B (commands): commit (gated+sanitized), model/resolve-model, validate skills
- [ ] 01-05-PLAN.md — Engine layer C: init <workflow> nested JSON contract + npm pack clean-install smoke test
**ADRs locked in this phase (before code)**: (a) engine = zero-dep `.cjs`, no compiled TS/`tsx`/`bun`; (b) CJS packaging, `"type"` not `"module"`, `engines.node >= 20`; (c) every command authored as a skill directory (skill wins over bare command file on name clash); (d) drop v1 non-standard frontmatter (`triggers`, `works-best-with`, `min-model`, bare `phase`) for the real Agent Skills spec; (e) MANIFEST is engine-derived on every `state save`. The subagent return-JSON schema contract is also fixed here.

### Phase 2: Bootstrap + Subagent Definitions
**Goal**: A user can install SOVEREIGN and scaffold `.sovereign/` in one command, and every subagent the later phases dispatch is defined with a fixed return schema — while the skill-listing token budget stays within Claude Code's limit.
**Depends on**: Phase 1
**Requirements**: INIT-01, INIT-02, INIT-03, SKL-07
**Success Criteria** (what must be TRUE):
  1. `npx sovereign init` installs SOVEREIGN skills and scaffolds `.sovereign/` from templates in the user's project.
  2. `init --quick` installs only the Fast Lane 5; `init --full` installs the full M1 skill set; re-running either is idempotent and version-aware (safe, updates cleanly).
  3. Advisor subagents (Skeptic, Architect, Builder, Outsider, Risk Officer) plus chairman/synthesizer, sentinel-reviewer, planner, and researcher are defined, each returning validated JSON (never prose), with an `agents_installed`/`missing_agents` hard-error path (no silent general-purpose fallback).
  4. Orchestrator-only skills set `disable-model-invocation: true`; the set of auto-triggerable M1 skills stays within the skill-listing budget (~7 max), verified by a `/doctor`-style check.
**Plans**: TBD

### Phase 3: Council `--standard` (Integration Proof)
**Goal**: `/council --standard "<decision>"` runs end-to-end and in doing so exercises every engine primitive in combination (init, state save, gate pass, commit, model resolution) plus the full parallel fan-out / fan-in — validating the architecture before any Fast Lane skill is written.
**Depends on**: Phase 2
**Requirements**: CNL-01, CNL-02, CNL-03, CNL-04
**Success Criteria** (what must be TRUE):
  1. A user runs `/council --standard "<decision>"` and receives five distinct advisor perspectives (Skeptic, Architect, Builder, Outsider, Risk Officer) produced by parallel subagents.
  2. Council injects project context (CONTEXT.md glossary, current phase, relevant ADRs) into every advisor using paths from the `init council` JSON, then runs an anonymous peer-review round (responses anonymized A–E and cross-reviewed) before synthesis.
  3. Council produces a chairman synthesis and a binding verdict (PASS / CONDITIONAL PASS / BLOCKED), written by the orchestrator only to a timestamped transcript in `.sovereign/council/`, and referenced in the gate log via `gate pass`.
  4. The full side-effecting cycle completes: `state save` regenerates MANIFEST, `commit` lands with a sanitized message, and a navigation footer prints the next action + copy-paste command; all advisors and the Council skill itself use `disable-model-invocation: true`.
**Plans**: TBD
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
**Plans**: TBD
**Research flag**: Define the `SOVEREIGN:UNVERIFIED` marker spec (format, valid contexts, scan rules, gate-blocking threshold) as a mini-ADR before implementing `sentinel`.

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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Engine Foundation | 0/5 | Not started | - |
| 2. Bootstrap + Subagent Definitions | 0/TBD | Not started | - |
| 3. Council `--standard` | 0/TBD | Not started | - |
| 4. Fast Lane Skills | 0/TBD | Not started | - |
| 5. Conventions + Per-Skill Docs | 0/TBD | Not started | - |
