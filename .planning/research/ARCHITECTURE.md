# Architecture Research

**Domain:** Agent engineering system (deterministic CLI engine + thin orchestrator skills + reasoning subagents + committed state)
**Researched:** 2026-06-08
**Confidence:** HIGH — grounded in direct reading of GSD's shipped engine (`~/.claude/get-shit-done/bin/lib/*.cjs`), workflows, agents, and the v1 SOVEREIGN design in `archive/v1/`.

> **Mode:** This is a pressure-test of SOVEREIGN.md §3-§5 against how GSD actually implements the five-layer pattern, plus concrete contracts and a build order. Where SOVEREIGN.md and GSD's real implementation diverge, the divergence is called out explicitly.

---

## Standard Architecture

### System Overview

The five layers from SOVEREIGN.md §3 map cleanly onto GSD's real topology. The load-bearing insight from reading the GSD source: **the orchestrator never reasons about bookkeeping and the engine never reasons about anything.** The engine is pure deterministic Node — it computes paths, reads config, resolves models, and returns one JSON blob. All judgment lives in the subagent layer (isolated context), all flow-control lives in the skill layer (cheap context).

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 5 · EXTENSIONS    (npx skills find/add + vetting)     │
├─────────────────────────────────────────────────────────────┤
│  Layer 4 · SKILLS  (thin orchestrators, one per command)    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │sovereign-│  │ council  │  │   tdd    │  │ sentinel │    │
│  │  init    │  │          │  │          │  │          │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │ 1. init     │ dispatch    │             │           │
│       ▼             ▼ Task()      ▼             ▼           │
├───────┼─────────────┼─────────────┼─────────────┼───────────┤
│  Layer 3 · SUBAGENTS (reasoning, isolated context)          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐              │
│  │ advisor  │  │  planner     │  │ verifier │  ...         │
│  │ (×5)     │  │              │  │          │              │
│  └──────────┘  └──────────────┘  └──────────┘              │
│       │ all subagents + skills call ▼ the SAME engine        │
├───────┼─────────────────────────────────────────────────────┤
│  Layer 2 · ENGINE  (sovereign-tools — deterministic Node)   │
│   init <workflow> → ONE JSON blob {paths, config, models,   │
│   flags, phase status}  ·  state load/save  ·  gate open/    │
│   pass  ·  commit (gitignore+commit_docs aware)  ·  model    │
│   resolve  ·  manifest sync                                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 · STATE  (.sovereign/, committed to git)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │MANIFEST  │  │SOVEREIGN │  │ STATE.md │  │config.json│   │
│  │.md (<500)│  │.md       │  │          │  │           │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│      docs/{adr,api,specs,security,infra}  council/  ...     │
└─────────────────────────────────────────────────────────────┘

Data flow per command:
  user → skill → [engine: init] → skill reads JSON → skill dispatches
       subagent(s) via Task(model=resolved) → subagents write artifacts +
       call [engine: commit] → skill calls [engine: state save] (syncs
       MANIFEST) → skill prints navigation footer
```

### Component Responsibilities

Mapped 1:1 against GSD's real modules so each SOVEREIGN component has a proven reference implementation.

| Component | Responsibility | GSD reference implementation |
|-----------|----------------|------------------------------|
| **Skill (`SKILL.md`)** | Parse args, call engine `init`, branch on returned flags, dispatch subagents, print footer. Holds NO domain logic. | `workflows/*.md` (e.g. `new-project.md` — the orchestrator) |
| **Subagent (`agents/*.md`)** | Heavy reasoning in isolated context. Reads only the files the skill points it at; writes artifacts; commits its own output. | `~/.claude/agents/gsd-*.md` (planner, researcher, verifier, roadmapper) |
| **Engine router** | CLI entry; arg parsing; `--raw`/`--pick`/`--cwd` handling; project-root resolution; dispatch to command modules. | `bin/gsd-tools.cjs` (the `main()` + `runCommand()` switch) |
| **Engine: init** | Compound bootstrap — assemble ALL context a workflow needs into one JSON blob (models + config + paths + phase status + file existence). | `bin/lib/init.cjs` (`cmdInit*` family) |
| **Engine: state** | Read/patch `STATE.md` (field-level, regex-based); load config + state; snapshot. | `bin/lib/state.cjs` |
| **Engine: config** | Materialize/read/write `config.json`; merge defaults ← global ← project; model-profile setter. | `bin/lib/config.cjs` + `loadConfig()` in `core.cjs` |
| **Engine: commit** | `commit_docs`-aware, gitignore-aware, branch-aware atomic commit of state docs. | `commands.cjs::cmdCommit` |
| **Engine: model resolution** | Map `(agent, profile) → model alias`. Pure table lookup + overrides. | `core.cjs::resolveModelInternal` + `model-profiles.cjs` |
| **State store (`.sovereign/`)** | Committed engineering memory. MANIFEST loads first. | GSD's `.planning/` (templates in `templates/`) |

**Critical boundary rule (verified in GSD):** the engine `output()` helper writes JSON to stdout, and when the blob exceeds ~50KB it spills to a tmpfile and emits `@file:/tmp/...` instead. Every skill must handle the `@file:` indirection (`if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi`). SOVEREIGN must replicate this — it is not optional polish, it is what keeps large `init` payloads from blowing the Bash tool buffer.

---

## The Engine Contract — `sovereign-tools init <workflow>`

This is SOVEREIGN's Core Value (PROJECT.md: "the one thing that must work"). GSD's `init` family proves the exact shape. Below is the **proposed concrete contract**, derived directly from `cmdInitNewProject`/`cmdInitPlanPhase`/`cmdInitManager`.

### What GSD's `init` actually returns (verified)

Every GSD `init` command builds a flat-ish JSON object with five consistent families of keys, then passes it through `withProjectRoot()` which injects `project_root`, `agents_installed`, and `missing_agents` (so the orchestrator can detect missing subagents before dispatch — a real footgun GSD patched in #1371). The families:

1. **Models** — pre-resolved per agent (`researcher_model`, `planner_model`, …) so the skill never reasons about profiles.
2. **Config flags** — `commit_docs`, `parallelization`, workflow toggles, search-provider availability.
3. **Phase/work status** — `phase_found`, `phase_dir`, `phase_number`, plan/summary inventory, `disk_status`.
4. **File existence + paths** — `state_exists` + `state_path` (relative, posix-normalized) pairs for every doc.
5. **Recommendations** (richer inits like `manager`) — computed next-actions with the literal command to run.

### Proposed `sovereign-tools init <workflow>` output

A representative blob for `init council` (the flagship reasoning workflow):

```json
{
  "project_root": "/abs/path/to/project",
  "sovereign_version": "2.0.0",

  "models": {
    "advisor": "opus",
    "chairman": "opus",
    "peer_reviewer": "opus"
  },

  "config": {
    "model_profile": "quality",
    "commit_docs": true,
    "council_mode_default": "standard",
    "parallelization": true
  },

  "phase": {
    "current": 1,
    "name": "Ideation",
    "gate_status": "in_progress",
    "active_tracks": ["backend"]
  },

  "context_injection": {
    "manifest_path": ".sovereign/MANIFEST.md",
    "constitution_path": ".sovereign/SOVEREIGN.md",
    "glossary_path": ".sovereign/CONTEXT.md",
    "relevant_adrs": [".sovereign/docs/adr/ADR-001.md"]
  },

  "paths": {
    "council_dir": ".sovereign/council",
    "transcript": ".sovereign/council/council-20260608-001.md",
    "state": ".sovereign/STATE.md",
    "manifest": ".sovereign/MANIFEST.md"
  },

  "exists": {
    "sovereign_dir": true,
    "manifest": true,
    "constitution": true,
    "glossary": true
  },

  "agents_installed": true,
  "missing_agents": []
}
```

**Why nested where GSD is flat:** GSD's blobs are mostly flat (`state_path`, `roadmap_path`) because they grew organically. SOVEREIGN is greenfield — group into `models`/`config`/`phase`/`paths`/`exists` namespaces for readability, but keep `--pick` dot-notation support (`--pick models.advisor`) which GSD's `extractField()` already implements with dot + bracket syntax. This is a free win: copy `extractField` verbatim.

### The load rule, made concrete

SOVEREIGN.md §3: "a skill orients via ONE CLI call, not many file reads." The mechanism, proven in `new-project.md` Step 1:

```bash
INIT=$(node "$HOME/.../sovereign-tools.cjs" init council)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# skill now has models + config + paths + phase — zero file reads so far.
# It reads MANIFEST/CONTEXT only when it actually needs their CONTENT (to inject into advisors).
```

The skill does NOT read `config.json`, resolve models, or stat files itself. The engine did all of it in one process spawn. The skill's only file reads are content reads it genuinely needs (MANIFEST/CONTEXT to inject into advisors), and even those are paths handed to it by `init`.

### State load/save, gate, commit, model — verified mechanics

| Operation | GSD mechanism (verified) | SOVEREIGN recommendation |
|-----------|--------------------------|--------------------------|
| **state load** | `cmdStateLoad` returns `{config, state_raw, *_exists}`. Config comes from `loadConfig()` which deep-merges defaults ← `~/.gsd/defaults.json` ← project config, with flat+nested key fallback. | Same. Add a `manifest_raw` field so a single `state load` also returns the <500-token MANIFEST. |
| **state save** | No monolithic "save". GSD does **field-level regex patching** (`cmdStatePatch`/`cmdStateUpdate`) against `**Field:**`/`Field:` patterns. Avoids rewriting whole files → smaller diffs, fewer merge conflicts. | Adopt field-level patching. Critically: **`state save` must also re-derive and rewrite MANIFEST** (phase, blockers, next-action, decision/stack quick-refs) so MANIFEST is always current. This is the one place SOVEREIGN extends GSD — GSD has no MANIFEST equivalent. |
| **gate open/pass** | GSD has no "gate" primitive; closest is `phase complete` (marks done, updates STATE + ROADMAP). | Build `gate open/pass <n>` as **append-only** writes to `SOVEREIGN.md` (the constitution). Append-only avoids the "rewrite whole file" trap and gives an audit trail of gate decisions. |
| **commit** | `cmdCommit`: bails if `!commit_docs` (returns `{committed:false, reason:'skipped_commit_docs_false'}`), bails if `.planning` gitignored, auto-creates branch if branching strategy set, stages files (or whole dir), commits, returns short hash. Sanitizes message against prompt injection. | Replicate exactly, retargeted to `.sovereign/`. Keep the injection sanitization — commit messages get read back into agent context. |
| **model resolve** | `resolveModelInternal`: per-agent override → `resolve_model_ids:'omit'` → profile table lookup (`MODEL_PROFILES[agent][profile]`) → fallback `sonnet`. Profiles: quality/balanced/budget, plus `inherit`. | Replicate. For SOVEREIGN's locked "Quality (Opus) for planning agents" decision, ship a profile table where council advisors + planner = opus under `quality`. |

---

## The Orchestrator ↔ Subagent Split

This is SOVEREIGN.md §3 Layer 4↔3, and GSD implements it through the **`Task()` tool with three load-bearing parameters**.

### How GSD dispatches (verified in `new-project.md`)

The orchestrator (a `.md` workflow) spawns subagents like this:

```
Task(
  prompt="<research_type>...</research_type>
          <files_to_read> - {project_path} </files_to_read>
          <output> Write to: .planning/research/STACK.md </output>",
  subagent_type="gsd-project-researcher",   # exact agent name, NOT general-purpose
  model="{researcher_model}",                # resolved by init, injected by orchestrator
  description="Stack research"
)
```

Three observed disciplines that SOVEREIGN must copy:

1. **Parallel fan-out, single fan-in.** `new-project.md` spawns 4 researchers *in parallel* (one `Task` per dimension), then spawns ONE `gsd-research-synthesizer` to fold them into a SUMMARY. This is structurally identical to the Council: N advisors in parallel → 1 chairman synthesis. GSD proves the pattern works at N=4; Council needs N=5.
2. **Path-passing, not content-passing.** The orchestrator passes `<files_to_read>` paths, never file contents. The subagent reads its own files in its own context. This keeps the orchestrator's context cheap (the whole point of Layer 4 being "thin").
3. **Write-then-return.** Subagents write artifacts to disk *before* returning a structured summary ("Write files first, then return. This ensures artifacts persist even if context is lost."). The orchestrator reads the written file, not the return value, for the source of truth.

### `available_agent_types` guard

GSD workflows declare `<available_agent_types>` listing exact subagent names with the instruction "do not fall back to 'general-purpose'", and `init` returns `agents_installed`/`missing_agents` so the orchestrator can hard-error before dispatching into a void. SOVEREIGN must ship the same guard — a Council that silently degrades all five advisors to `general-purpose` is worse than one that errors.

### Mapping to SOVEREIGN's reasoning agents

| SOVEREIGN subagent | GSD analogue | Dispatch shape |
|--------------------|--------------|----------------|
| Council advisor (×5: Skeptic, Architect, Builder, Outsider, Risk Officer) | 4× parallel `gsd-project-researcher` | 5 parallel `Task(subagent_type="sovereign-advisor", model=advisor_model)`, each with a different `<lens>` in its prompt + injected MANIFEST/CONTEXT |
| Chairman (synthesis) | `gsd-research-synthesizer` | 1 `Task` after advisors return, fed the (anonymized) transcripts |
| Peer reviewer | (none — Council-specific) | Anonymize advisor outputs A–E, dispatch review pass |
| Planner | `gsd-planner` | 1 `Task`, writes plan, commits |
| Sentinel reviewer | `gsd-verifier` | 1 `Task` post-phase |
| Verifier (`verify-self`) | `gsd-verifier` | 1 `Task` |

**Design note on Council advisor diversity:** v1's `--deep` mode aspired to assign each advisor a *different model provider* for genuine (not simulated) diversity. For M1 `--standard`, all five advisors are the same model with different lens prompts — exactly how GSD's 4 researchers are the same model with different dimension prompts. The pattern is proven; multi-model is an M4 enhancement (correctly scoped Out of Scope in PROJECT.md).

---

## The `.sovereign/` State Model + MANIFEST-Loads-First

### Keeping MANIFEST <500 tokens and always-current

The v1 MANIFEST template (`archive/v1/templates/MANIFEST.md`) is already well-shaped: status, next-action, blockers, key-decisions quick-ref, stack quick-ref, file map, UNVERIFIED count, bridge registry. The problem v1 never solved: **who keeps it current?** Prose skills can't be trusted to. The answer from GSD: the engine does.

**Mechanism (the core architectural recommendation):**

1. **MANIFEST is a derived view, not a source of truth.** Every field in MANIFEST is computed from authoritative state: phase from `SOVEREIGN.md` gates, decisions from `docs/adr/`, stack from a stack doc, blockers from `STATE.md`, UNVERIFIED count from a code scan. The engine regenerates MANIFEST whenever `state save` runs — the same way GSD's `cmdInitManager` derives `disk_status` from the filesystem rather than trusting a stored field.
2. **Token budget enforced in code.** `state save` (which writes MANIFEST) should count tokens and either truncate quick-ref tables to top-N rows or emit a warning. GSD has no equivalent because it has no MANIFEST, so this is net-new — but it is exactly the kind of "bookkeeping in code, not tokens" the engine exists for.
3. **MANIFEST loads first via the init contract, not via skill discipline.** Don't tell skills "remember to read MANIFEST first." Instead, `init <workflow>` returns `context_injection.manifest_path` AND (optionally) `manifest_raw` inline, so the orientation is part of the one CLI call. The "load rule" becomes mechanically enforced rather than convention.

### State directory layout (from SOVEREIGN.md §4, validated)

The layout in §4 is sound. One adjustment from studying GSD: GSD keeps `STATE.md` field-patchable (bold `**Field:**` lines) so the engine can update single fields cheaply. SOVEREIGN's `STATE.md` and MANIFEST quick-ref tables should use the same `**Field:** value` convention so the field-level patch engine (`stateReplaceField`) works unchanged.

```
.sovereign/
├── MANIFEST.md       # DERIVED, regenerated on every state save, <500 tokens, loads first
├── SOVEREIGN.md      # Constitution + append-only phase gates (source of truth for phase)
├── CONTEXT.md        # Glossary (Matt Pocock format)
├── STATE.md          # Field-patchable: current phase, blockers, next action
├── config.json       # model_profile, granularity, git strategy, toggles (loadConfig merges defaults)
├── council/          # Timestamped transcripts (council-YYYYMMDD-NNN.md)
├── docs/{adr,api,specs,security,infra,intersections}/
├── external-docs/    # Anchor URLs + versions
└── extensions/       # Vetted third-party skills + vetting log
```

---

## Architectural Patterns

### Pattern 1: One-Call Orientation (the load rule)

**What:** A skill's first action is a single `init <workflow>` call returning all paths, config, and resolved models as one JSON blob. Content reads happen only on a need-to-read basis, using paths the engine handed back.
**When to use:** The opening of every skill, without exception.
**Trade-offs:** (+) Token-cheap orchestrators, deterministic orientation, survives context resets. (−) The engine must know every workflow's needs up front — `init` accretes per-workflow commands (GSD has 17). Acceptable: it's code, not tokens.

```bash
INIT=$(node "$TOOLS" init <workflow>)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

### Pattern 2: Parallel Fan-Out → Single Fan-In

**What:** Dispatch N reasoning subagents in parallel (each isolated, each writing to disk), then one synthesizer folds their outputs.
**When to use:** Council (5 advisors → chairman), research (N dimensions → SUMMARY).
**Trade-offs:** (+) Genuine perspective diversity, parallel wall-clock. (−) Token cost scales with N; synthesizer must handle a missing/blocked agent.

### Pattern 3: Derived MANIFEST (state as a view)

**What:** MANIFEST is regenerated by the engine from authoritative state on every `state save`; never hand-edited.
**When to use:** Any always-current orientation document under a token budget.
**Trade-offs:** (+) Cannot go stale, enforced budget. (−) Every state mutation must route through `state save`; an out-of-band file edit won't refresh MANIFEST until the next save.

### Pattern 4: Field-Level State Patching

**What:** Update `STATE.md` via regex against `**Field:**` lines rather than rewriting the file.
**When to use:** All STATE mutations.
**Trade-offs:** (+) Tiny diffs, fewer conflicts, idempotent. (−) Requires disciplined `**Field:**` formatting; arbitrary prose sections aren't patchable (acceptable — those are append-only).

---

## Data Flow

### Command Flow (canonical)

```
user invokes /council "question"
        ↓
SKILL: node sovereign-tools init council        ← ONE engine call
        ↓ (JSON: models, config, paths, manifest_path, agents_installed)
SKILL: reads MANIFEST.md + CONTEXT.md (paths from init) for injection
        ↓
SKILL: Task(advisor, model=opus) ×5  IN PARALLEL  ← fan-out
        ↓ each advisor: reads injected context, reasons, returns
SKILL: anonymize A–E → Task(peer_reviewer)
        ↓
SKILL: Task(chairman) → writes .sovereign/council/council-*.md   ← fan-in
        ↓
SKILL: node sovereign-tools gate pass 1     (append to SOVEREIGN.md)
SKILL: node sovereign-tools state save      (regenerates MANIFEST)
SKILL: node sovereign-tools commit "council: <verdict>" --files .sovereign/...
        ↓
SKILL: print navigation footer
```

### State Mutation Flow

```
[any skill] → engine state patch/save → STATE.md (field-patched)
                                       → MANIFEST.md (fully regenerated, derived)
                                       → engine commit (if commit_docs)
```

### Key Data Flows

1. **Orientation:** `init` → JSON → skill (no file reads for config/models).
2. **Reasoning:** skill → `Task(paths)` → subagent reads files itself → writes artifact → returns summary.
3. **Persistence:** subagent/skill → `commit` (gitignore + commit_docs gated) → git.

---

## Scaling Considerations

| Scale | Architecture adjustments |
|-------|--------------------------|
| Single project, 1 dev | Flat `.sovereign/`, sequential skills. Engine is overkill-proof — same as GSD at small scale. |
| Single project, team | `.sovereign/` committed to git is the collaboration layer (ADR-007). Field-level patching minimizes merge conflicts. MANIFEST quick-refs give fast onboarding. |
| Many projects (bridges) | Cross-project handoff via `bridge` (M3). Engine stays per-project; bridge registry in MANIFEST links them. Staleness detection blocks pre-flight (ADR-008). |

### Scaling Priorities

1. **First bottleneck: orchestrator context bloat.** Mitigation already designed in: thin skills + one-call orientation. The risk is skills creeping toward doing engine work. Enforce via review: any file-stat or config-parse in a `SKILL.md` is a bug.
2. **Second bottleneck: MANIFEST drift / token creep.** Mitigation: derived MANIFEST with code-enforced token budget.

---

## Anti-Patterns

### Anti-Pattern 1: Prose skills with no engine (the v1 failure)

**What people do:** Write `SKILL.md` files that read ten state files inline and embed bookkeeping logic in prose.
**Why it's wrong:** Token-expensive, non-deterministic, doesn't survive context resets — this is *exactly* why v1 failed (PROJECT.md Core Value, R-002).
**Do this instead:** Engine first (R-002 is locked). Every skill orients via one `init` call; all bookkeeping is Node.

### Anti-Pattern 2: Hand-maintained MANIFEST

**What people do:** Tell each skill "remember to update MANIFEST."
**Why it's wrong:** Skills forget; MANIFEST goes stale; the always-current promise breaks.
**Do this instead:** Derive MANIFEST in the engine on every `state save`.

### Anti-Pattern 3: Passing file contents into `Task()` prompts

**What people do:** Read big files in the orchestrator and paste contents into subagent prompts.
**Why it's wrong:** Bloats orchestrator context, the thing Layer 4 exists to keep thin.
**Do this instead:** Pass `<files_to_read>` paths; the subagent reads in its own isolated context (GSD's verified discipline).

### Anti-Pattern 4: Silent fallback to general-purpose agents

**What people do:** Dispatch `Task()` without verifying the named subagent exists.
**Why it's wrong:** Council advisors silently become a generic agent — diversity collapses, quality drops, no error.
**Do this instead:** `init` returns `agents_installed`/`missing_agents`; skill hard-errors if missing (GSD #1371 guard).

---

## Integration Points

### External Services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| `npx skills` (find-skills) | Engine shells out to it for discovery/install; SOVEREIGN adds a vetting log to `extensions/` | M3. Do NOT reinvent the registry (R-003). |
| git | Engine wraps via `execGit`; commit is `commit_docs`+gitignore gated | Git is the collaboration layer (ADR-007). |
| Anchor docs | URLs + versions stored in `external-docs/`, content opt-in | ADR-004. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Skill ↔ Engine | `node sovereign-tools <cmd>` → JSON on stdout (handle `@file:` spill) | The ONLY way skills touch state. |
| Skill ↔ Subagent | `Task(prompt, subagent_type, model, description)` | Paths in, structured summary out; artifacts on disk are source of truth. |
| Engine ↔ State | Direct fs reads/writes; field-level patches; derived MANIFEST | Engine is the ONLY writer of MANIFEST. |
| Subagent ↔ Engine | Subagents call `commit` (and may call `state`) directly | Same CLI, `--cwd` flag for sandboxed subagents. |

---

## Recommended Build Order (with dependencies)

This is the load-bearing output for the roadmap. Derived from R-002 (engine before skills) and the dependency reality that every skill is a thin wrapper over the engine.

```
Phase A: STATE SPEC + ENGINE SKELETON   (no deps)
  ├─ .sovereign/ layout + templates (MANIFEST, SOVEREIGN.md, STATE.md, CONTEXT.md, config.json)
  ├─ sovereign-tools.cjs router (copy GSD's main()/runCommand + --raw/--pick/--cwd/@file:)
  ├─ loadConfig (defaults ← global ← project merge)  + model-profiles table
  └─ output() helper with 50KB tmpfile spill
        ↓  EVERYTHING depends on this
Phase B: CORE ENGINE COMMANDS           (deps: A)
  ├─ state load / state patch / state save (field-level)  ← incl. MANIFEST regeneration
  ├─ resolve-model
  ├─ commit (commit_docs + gitignore + sanitize)
  └─ gate open / gate pass (append-only to SOVEREIGN.md)
        ↓
Phase C: init <workflow> CONTRACT       (deps: B)  ← THE Core Value milestone
  ├─ init sovereign-init  (bootstrap detection: existing .sovereign?, git?, --quick/--full)
  ├─ init council  (models, context_injection paths, mode default)
  └─ init <fast-lane skill>  (one per Fast Lane skill)
        ↓  skills cannot be thin without this
Phase D: sovereign-init SKILL           (deps: C)
  └─ bootstrap .sovereign/ via engine; --quick / --full
        ↓  produces the state every other skill reads
Phase E: SUBAGENT DEFINITIONS           (deps: C — needs model resolution + Task contract)
  ├─ sovereign-advisor (×1 def, parameterized by lens)
  ├─ chairman / synthesizer
  ├─ planner, verifier/sentinel, researcher
  └─ available_agent_types + agents_installed guard
        ↓
Phase F: COUNCIL SKILL (--standard)     (deps: D + E)
  └─ fan-out 5 advisors → peer review → chairman → gate/state/commit
        ↓
Phase G: FAST LANE SKILLS               (deps: D + E; G can parallelize internally)
  ├─ grill-with-docs        (orchestrator over engine; mine v1 SKILL for content)
  ├─ ubiquitous-language    (writes CONTEXT.md)
  ├─ tdd
  ├─ sentinel               (native tier review)
  └─ handoff
        ↓
Phase H: CONVENTIONS + DOCS             (deps: F + G complete)
  └─ recommendation-first, nav footer, "Why this matters", per-skill docs, ADR/skill-format refs
```

**Dependency rationale:**
- **A→B→C is a hard chain.** The `init` contract (C) cannot exist until `loadConfig`, model resolution, and state primitives (A, B) exist. This is the literal meaning of R-002.
- **C gates everything skill-shaped.** No skill can be "thin" before `init` returns its JSON, because thinness IS delegation to `init`. Building any skill before C forces bookkeeping into prose — the v1 mistake.
- **E (subagents) depends on C, not D.** Subagent definitions need the model-resolution contract and the `Task()` dispatch shape, both settled by C. They do not need `sovereign-init` to exist.
- **F (Council) is the integration test.** It exercises fan-out/fan-in, context injection, gate, state-save-with-MANIFEST-regen, and commit in one flow. If Council works end-to-end, the architecture is validated. Recommend treating Council as the milestone-proving skill rather than a Fast Lane skill.
- **G can run after D+E** and its five skills are mutually independent (parallelizable across plans).
- **H is pure convention/polish** and depends only on having real skills to apply conventions to.

**Suggested phase grouping for the roadmap:** A+B+C = "Engine" phase(s) (the Core Value — do not split the A→C chain across a milestone boundary). D+E = "Bootstrap + Agents". F = "Council" (the proof). G = "Fast Lane". H = "Conventions". This mirrors M1 scope in SOVEREIGN.md §8 exactly.

---

## Sources

- `~/.claude/get-shit-done/bin/gsd-tools.cjs` — router, arg parsing, `init` dispatch, `@file:`/`--pick`/`--cwd` (HIGH)
- `~/.claude/get-shit-done/bin/lib/init.cjs` — `cmdInit*` family: exact JSON blob shapes, `withProjectRoot`, `agents_installed` guard (HIGH)
- `~/.claude/get-shit-done/bin/lib/core.cjs` — `loadConfig` (defaults merge), `resolveModelInternal`, `output()` 50KB spill, `findProjectRoot` (HIGH)
- `~/.claude/get-shit-done/bin/lib/state.cjs` — field-level patching (`cmdStatePatch`/`stateReplaceField`), `cmdStateLoad` (HIGH)
- `~/.claude/get-shit-done/bin/lib/config.cjs` — `buildNewProjectConfig` defaults, model-profile setter (HIGH)
- `~/.claude/get-shit-done/bin/lib/commands.cjs::cmdCommit` — commit_docs/gitignore/branch/sanitize gating (HIGH)
- `~/.claude/get-shit-done/bin/lib/model-profiles.cjs` — `MODEL_PROFILES` table, quality/balanced/budget (HIGH)
- `~/.claude/get-shit-done/workflows/new-project.md` — orchestrator pattern: `init` first, parallel `Task()` fan-out, synthesizer fan-in, `available_agent_types`, path-passing, write-then-return (HIGH)
- `archive/v1/skills/council/SKILL.md` — Council protocol: 5 advisors, anonymous peer review, chairman, modes, context injection from `.sovereign/` (HIGH — design intent)
- `archive/v1/templates/MANIFEST.md` — MANIFEST field structure + <500-token mandate (HIGH — design intent)
- `SOVEREIGN.md` §3-§5 + `.planning/PROJECT.md` — the architecture being pressure-tested (HIGH)

---
*Architecture research for: SOVEREIGN v2 — agent engineering system*
*Researched: 2026-06-08*
