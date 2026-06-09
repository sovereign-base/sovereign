# Roadmap: SOVEREIGN v2

Completed milestones are archived (full phase detail + final progress) under `.planning/milestones/`. The active milestone's phases live here.

## Shipped milestones

| Milestone | Scope | Phases | Status | Archive |
|-----------|-------|--------|--------|---------|
| **v1.0 — M1 Foundation** | engine · installer · Council · Fast Lane 5 · conventions | 1–5 (19 plans) | ✅ Complete (28/28 reqs, verified) | [v1.0-ROADMAP](./milestones/v1.0-ROADMAP.md) · [reqs](./milestones/v1.0-REQUIREMENTS.md) |
| **v1.1 — M2 Architecture** | adr-log · entity/api/scale/security/deploy-design · stack-select | 6–9 (7 plans) | ✅ Complete (8/8 reqs, verified) | [v1.1-ROADMAP](./milestones/v1.1-ROADMAP.md) · [reqs](./milestones/v1.1-REQUIREMENTS.md) |

**Shipped:** a zero-dependency engine + `npx sovereign-cli init` installer + 13 skills (5 Fast Lane auto-triggerable, 8 phase-gated) + 4 subagents + 5 references. 77 engine tests; listing budget held at 5 auto-triggerable.

## Milestone v1.2 — M3 (Adoption, Bridging & Extensions)

### Overview

M3 extends SOVEREIGN beyond a single fresh project — retrofit it onto an existing codebase (`sovereign-adopt`), hand off context between projects (`bridge` + staleness), and safely pull in third-party skills (extension protocol over `npx skills`). **Unlike M2 (pure skill authoring), M3 has real engine work.** The engine-vs-skill split is the spine of the plan: the engine gains the *mechanical, deterministic, zero-dep* pieces (SHA-256 hashing + bridge registry, a `spawnSync` wrapper around `npx skills` that drives on exit codes, a Layers-1+2 adopt scan, and a `scanSkillContent()` pattern scanner), while the *judgment* (BRIDGE.md prose, necessity/conflict/recommendation, Layer-3 deep reads + gap analysis + retro-ADRs) stays in thin orchestrator skills + reasoning agents. Build order is dictated by R-002 (engine before skills): **Phase 10 lands all engine additions (ENG-08) first** — the helpers the three skills wrap — then the three capability skills layer thinly on top. `bridge.cjs` is the smallest and fully testable with no external process, so the bridge skill (Phase 11) comes first; the extension skill (Phase 12) needs a live `npx skills use/add` smoke-test; `sovereign-adopt` (Phase 13) is the largest, carrying the most reasoning. M3-CC (thin-orchestrator shape, `disable-model-invocation: true`, `validate skills` clean, doctor auto-trigger budget held at the 5 Fast Lane skills) is **cross-cutting** — a success criterion of each skill phase (11–13), not a phase of its own.

### Phases

- [x] **Phase 10: Engine Additions** - Zero-dep `bridge.cjs` (SHA-256 + registry diff), `extension.cjs` (exit-code-driven `npx skills` wrapper), `adopt.cjs` (Layers 1+2 scan), `scanSkillContent()` in `security.cjs`, and `init` bridge/adopt/extension workflows — all `node --test`'d (completed 2026-06-09)
- [x] **Phase 11: Bridge Skill** - A thin `bridge` skill that assembles `BRIDGE.md` from existing `.sovereign/` artifacts and detects staleness via the Phase-10 hash registry (completed 2026-06-09)
- [ ] **Phase 12: Extension Protocol Skill** - A thin extension skill that wraps `npx skills` find/use/add with the five-gate vetting layer (necessity, conflict, security audit, recommendation, logged decision)
- [ ] **Phase 13: sovereign-adopt Skill** - A thin `sovereign-adopt` skill that drives the Phase-10 scan through 3-layer archaeology → scaffolds `.sovereign/`, retro-ADRs (via adr-log), and a gap analysis + adoption roadmap

## Phase Details

### Phase 10: Engine Additions
**Goal**: The deterministic, zero-dependency engine surface M3 needs exists and is tested — the mechanical helpers (hashing + registry, the `npx skills` shell-out, the adopt scan, the skill-content scanner) that the three M3 skills will wrap, so each later skill stays a thin orchestrator.
**Depends on**: Phase 9 (M1 engine + M2 conventions: `core.cjs` `output()`/`@file:` spill, `execGit`, `parseNamedArgs`/`--files`, `security.cjs` `sanitizeForPrompt`, `validate`/`doctor`, `node --test` harness)
**Requirements**: ENG-08
**Success Criteria** (what must be TRUE):
  1. `sovereign-tools bridge hash --files a b c` returns per-file SHA-256 plus a combined hash (via `node:crypto`), and `bridge check` reads `.sovereign/bridges/registry.json`, diffs against it, and reports which source paths changed (or "fresh" when the combined hash matches).
  2. `sovereign-tools extension preview|install|list|audit <source>` shells out to `npx skills` with array args (never a shell string), drives success/failure on the process exit code (not stdout parsing), and emits a JSON blob `{ ok, exitCode, stdout, stderr, source }`; `audit` runs `scanSkillContent` over materialized skill content and returns structured `{ findings, verdict }` covering exfiltration, overbroad-permission, and prompt-injection/zero-width patterns.
  3. `sovereign-tools adopt scan` emits the Layers-1+2 JSON contract (manifests, detected languages/managers/flags, gitignore-filtered structure tree capped with a `truncated` flag, and heuristic `deep_read_candidates`), reusing `execGit`/`git ls-files` and returning safe values on a missing `.sovereign/` or non-git dir.
  4. `sovereign-tools init bridge`, `init adopt`, and `init extension` each return a greenfield-safe orientation JSON blob (paths + config + relevant artifacts) so the M3 skills orient with one call.
  5. `node --test` passes for the new `bridge.cjs`, `extension.cjs`, `adopt.cjs`, and extended `security.cjs` modules, and the engine still has **zero runtime dependencies** (`node:` built-ins only) with all output flowing through the existing `output()`/`@file:` spill (never reimplemented).
**Plans**: 5 plans
  - [x] 10-01-PLAN.md — bridge.cjs: SHA-256 per-file + combined hash (node:crypto) + registry diff (BRIDGE-02 substrate)
  - [x] 10-02-PLAN.md — scanSkillContent() in security.cjs: exfiltration/overbroad-perm/prompt-injection scan → {findings,verdict} (EXT-02 substrate)
  - [x] 10-03-PLAN.md — adopt.cjs: Layers-1+2 scan (manifests/detected/structure/deep_read_candidates), gitignore-aware via git ls-files (ADOPT substrate)
  - [x] 10-04-PLAN.md — extension.cjs: exit-code-driven npx skills wrapper (array args) + audit via scanSkillContent (EXT substrate)
  - [x] 10-05-PLAN.md — wire bridge/extension/adopt router cases + init bridge|adopt|extension workflows + integration tests
**UI hint**: no

### Phase 11: Bridge Skill
**Goal**: A user can run `bridge` in a source project to generate a `BRIDGE.md` a consuming project imports, and re-running detects staleness against the source files it was built from — local hash-based staleness only (deploy-gate blocking + GitHub-issue notification stay deferred).
**Depends on**: Phase 10 (wraps `bridge hash`/`bridge check` + the `init bridge` orient blob)
**Requirements**: BRIDGE-01, BRIDGE-02, M3-CC
**Success Criteria** (what must be TRUE):
  1. Running `bridge` assembles a `BRIDGE.md` from existing `.sovereign/` artifacts — API contracts (from `API_SPEC.md`), an auth/security summary (from `SECURITY_MODEL.md`), the shared domain glossary (from `CONTEXT.md`), and decisions-already-made (from the relevant ADRs the `init` blob lists) — with frontmatter carrying `source_repo`, `source_commit`, `generated`, `combined_hash`, and per-source `sources_hashed`.
  2. The skill writes/updates `.sovereign/bridges/registry.json` via the engine, and re-running `bridge` reports the bridge fresh (combined hash matches) or names the specific changed source paths and regenerates — the local staleness detection BRIDGE-02 scopes.
  3. The skill assembles BRIDGE.md *prose* itself but delegates all hashing and registry I/O to the Phase-10 engine commands (it does not reimplement crypto or registry diffing).
  4. `bridge` is a thin orchestrator: single `sovereign-tools init bridge` orient call, a plain-language "Why this matters" section, recommendation-first output, and a navigation footer; it sets `disable-model-invocation: true`.
  5. `sovereign-tools validate skills` passes for `bridge` and `sovereign-tools doctor` still reports the auto-trigger listing budget at the 5 Fast Lane skills.
**Plans**: 1 plan
  - [x] 11-01-PLAN.md — hand-authored `bridge` thin-orchestrator skill: assembles BRIDGE.md from .sovereign/ artifacts, wraps `bridge check`/`bridge hash`, writes the registry, delegates state/commit (BRIDGE-01/02 + M3-CC)
**UI hint**: no

### Phase 12: Extension Protocol Skill
**Goal**: A user can discover and install third-party skills through SOVEREIGN — wrapping the `npx skills` ecosystem (R-003, never reinventing the registry) — only after a five-gate vetting layer runs and the decision is logged, so no skill is adopted blind.
**Depends on**: Phase 10 (wraps `extension preview`/`install`/`list`/`audit` + `init extension`); independent of Phase 11
**Requirements**: EXT-01, EXT-02, M3-CC
**Success Criteria** (what must be TRUE):
  1. The skill surfaces discovery results from `npx skills find` (raw `owner/repo@skill` targets + `skills.sh` URLs, parsed leniently) and installs via the engine's `extension install` (which calls `skills add --copy -a claude-code -y`) — SOVEREIGN wraps, never reimplements, the registry.
  2. Before any adoption, the skill runs all five vetting gates — necessity (vs active tracks/current phase), conflict (vs installed skills via `extension list` and vs existing ADRs), security audit (via `extension audit` over content materialized by `skills use`, **before** `add`), a clear INSTALL / DON'T-INSTALL / INSTALL-WITH-CAVEATS recommendation, and a logged decision — and surfaces the recommendation first.
  3. The decision record (timestamp, source, hashes, audit findings, verdict, rationale) is written to `.sovereign/extensions/<date>-<skill>.md` and committed via the engine `commit` path; the security audit drives on the engine's `scanSkillContent` findings rather than ad-hoc skill-side scanning.
  4. The skill is a thin orchestrator: single `sovereign-tools init extension` orient call, "Why this matters" section, recommendation-first output, navigation footer, and `disable-model-invocation: true`.
  5. `sovereign-tools validate skills` passes for the extension skill and `sovereign-tools doctor` still reports the auto-trigger listing budget at the 5 Fast Lane skills.
**Plans**: 2 plans
  - [x] 12-01-PLAN.md — extension.cjs correction: preview → bare `skills use`, audit scans `skills use` stdout via scanSkillContent (+ updated tests) (EXT-01/02 substrate)
  - [ ] 12-02-PLAN.md — hand-authored `import-skill` thin-orchestrator skill: five-gate vetting (necessity/conflict/audit/recommendation/logged decision) wrapping `extension list|audit|install` (EXT-01/02 + M3-CC)
**UI hint**: no

### Phase 13: sovereign-adopt Skill
**Goal**: A user can run `sovereign-adopt` on an existing codebase (greenfield-with-code or Type-2 mid-flight) and walk away with a scaffolded `.sovereign/`, retroactive ADRs for the decisions already baked into the code, and a risk-prioritized gap analysis + adoption roadmap — reading and recording only, never refactoring the source.
**Depends on**: Phase 10 (drives `adopt scan` + the `init adopt` orient blob) and Phase 6 (retro-ADRs route through the existing `adr-log` path); independent of Phases 11 and 12
**Requirements**: ADOPT-01, ADOPT-02, M3-CC
**Success Criteria** (what must be TRUE):
  1. Running `sovereign-adopt` performs 3-layer archaeology — Layers 1+2 from the engine `adopt scan` (config/manifest detection + gitignore-filtered structure, near-zero to low tokens), then Layer 3 a handful of targeted deep reads chosen from the scan's `deep_read_candidates` (router/auth/base-model/config) — to reverse-engineer the decisions baked into the code.
  2. From that archaeology the skill scaffolds `.sovereign/`, generates retroactive ADRs through `adr-log` (not a re-implemented recorder) for discovered decisions, and produces a gap-analysis + adoption roadmap prioritized by risk (what's missing, in what order).
  3. The skill reads and records only — it never modifies the user's source code — and scopes to greenfield-with-code + Type-2 mid-flight (Type-3 legacy stays deferred).
  4. The skill is a thin orchestrator: single `sovereign-tools init adopt` orient call, "Why this matters" section, recommendation-first output, navigation footer, and `disable-model-invocation: true`.
  5. `sovereign-tools validate skills` passes for `sovereign-adopt` and `sovereign-tools doctor` confirms the auto-trigger listing budget remains at the 5 Fast Lane skills after all three M3 skills are installed.
**Plans**: TBD
**UI hint**: no

## Progress (M3)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Engine Additions | 5/5 | Complete   | 2026-06-09 |
| 11. Bridge Skill | 1/1 | Complete   | 2026-06-09 |
| 12. Extension Protocol Skill | 1/2 | In Progress|  |
| 13. sovereign-adopt Skill | 0/TBD | Not started | - |
