# SOVEREIGN

### The Engineering System for Agents and the Humans Who Work With Them

**Repo:** `github.com/sovereign-base/sovereign` · **CLI:** `npx sovereign` · **License:** MIT
**Status:** v2 rebuild — architecture locked, engine not yet built
**This document is the north star.** Any agent or contributor starts here. It supersedes `archive/v1/SOVEREIGN_PROJECT.md`.

---

## 1. What SOVEREIGN Is

A universal, project-agnostic engineering system: a set of agent skills, gated phases, living documents, and guardrails that guide any software project from the first thought to live production and beyond. No language lock-in. No stack opinion. No domain constraint. Works best with Claude; compatible with any `SKILL.md` agent.

It answers one question for any project: **"How do we build this properly?"** — and refuses to let the answer be *vibes*.

---

## 2. What the v2 Rebuild Changes

v1 was a pile of prose `SKILL.md` files with **no engine underneath** — no state tooling, no orchestrator/subagent split, no context-reset survival, no CLI. The *content design* was strong; the *architecture* was missing.

> **v2 thesis: keep SOVEREIGN's content and philosophy; rebuild its architecture on GSD-class foundations.**

We lift proven *patterns* (not code) from four sources:

| Source | What we take |
| --- | --- |
| **Matt Pocock — skills** | Skill craft: thin `SKILL.md`, progressive disclosure, recommendation-first, one-question-at-a-time, codebase-aware. |
| **GSD — get-shit-done** | The engineering backbone: thin orchestrator + specialized subagents, a deterministic CLI (`init <workflow> → JSON`), `.planning/`-style committed state, model profiles, checkpoints, decimal phases, autonomous mode. |
| **gstack** | Role-based review *chains* that pass output downstream, atomic commits per fix, verification that actually runs the product, persistent project memory. |
| **find-skills** | The extension protocol is just `npx skills find/add`. SOVEREIGN wraps and vets it — it does **not** reinvent a registry. |

---

## 3. Architecture — Five Layers

SOVEREIGN is not "a folder of skills." It is a small engine with skills layered on top.

```
┌─ Layer 5 · EXTENSIONS ──────────────────────────────────────────┐
│  Third-party skills, vetted via `npx skills` + SOVEREIGN audit.  │
├─ Layer 4 · SKILLS (thin orchestrators) ─────────────────────────┤
│  One per command. Parse args → call engine init → dispatch       │
│  subagents → write artifacts → print navigation footer.          │
│  Kept deliberately small so orchestrator context stays cheap.    │
├─ Layer 3 · SUBAGENTS (the reasoning) ───────────────────────────┤
│  Council advisors, planner, sentinel reviewer, verifier,         │
│  researcher. Heavy thinking happens here, in isolated context.   │
├─ Layer 2 · ENGINE (deterministic CLI: `sovereign-tools`) ───────┤
│  `init <workflow>` returns all paths + config as ONE json blob.  │
│  state load/save, gate open/pass, git commit, gitignore checks,  │
│  model-profile resolution. Bookkeeping lives in code, not tokens.│
├─ Layer 1 · STATE (`.sovereign/`, committed to git) ─────────────┤
│  MANIFEST.md (loads first, <500 tokens) + constitution, glossary,│
│  ADRs, specs, council transcripts, phase gates.                  │
└──────────────────────────────────────────────────────────────────┘
```

**The load rule (from GSD's `init` pattern):** a skill never reads ten files to orient itself. It runs one CLI call that returns paths + flags as JSON, then reads only what it needs. This is how SOVEREIGN keeps its token budget honest — the Architect persona's demand from v1, finally answered.

---

## 4. The State Model — `.sovereign/`

Committed to git (ADR-003). The project's engineering memory.

```
.sovereign/
├── MANIFEST.md          # ALWAYS loaded first. <500 tokens. Full orientation.
├── SOVEREIGN.md         # Constitution: phase gates, active tracks, config.
├── CONTEXT.md           # Ubiquitous-language glossary (Matt Pocock format).
├── STATE.md             # Current phase, blockers, next action.
├── config.json          # Model profile, granularity, git strategy, toggles.
├── council/             # Council transcripts + verdicts, timestamped.
├── docs/
│   ├── adr/             # Architectural decisions.
│   ├── api/             # API_SPEC.md — living contract.
│   ├── specs/           # Feature specs.
│   ├── security/        # SECURITY_MODEL.md
│   ├── infra/           # DEPLOY_MODEL.md
│   └── intersections/   # Track-intersection docs.
├── external-docs/       # Anchor doc URLs + versions (content opt-in, ADR-004).
└── extensions/          # Imported third-party skills + vetting log.
```

---

## 5. The Engine — `sovereign-tools`

Node/TypeScript (ADR-002), invoked by every skill. Mirrors `gsd-tools.cjs`.

```
sovereign-tools init <workflow>     # → JSON: paths, config, flags, phase status
sovereign-tools state load|save     # read/update STATE.md + MANIFEST.md atomically
sovereign-tools gate open|pass <n>  # append-only phase-gate writes
sovereign-tools commit "<msg>" --files ...   # commit_docs + gitignore aware
sovereign-tools model <agent>       # resolve model profile for a subagent
```

`npx sovereign init [--quick|--full]` is the install/bootstrap entry point.

---

## 6. Content — Kept From v1 (now built on the engine)

The phases, gates, and signature skills survive the rebuild unchanged in intent:

- **6 phases**, gated: 0 Setup · 1 Ideation · 2 Specification · 3 Architecture · 4 Construction · 5 Deployment · 6 Operations (continuous).
- **The Council** — 5 parallel advisor subagents (Skeptic, Architect, Builder, Outsider, Risk Officer) + anonymous peer review + chairman synthesis. Modes: `--express` / `--standard` / `--deep`. (hex/claude-council inspired.)
- **Anti-hallucination** — `/anchor-docs`, `/verify-self`, `SOVEREIGN:UNVERIFIED` markers.
- **Bridge** — cross-project handoff with staleness detection.
- **Sentinel** — two-tier post-phase review (native always; CodeRabbit opt-in).
- **Recommendation-first, navigation footer, "Why this matters" plain-language section** on every skill.

Full v1 detail (all 43 skills, council roles, grills) lives in `archive/v1/` as the content reference.

---

## 7. Repo Structure (v2)

```
sovereign/
├── SOVEREIGN.md            # THIS FILE — north star
├── README.md               # public intro (rewritten for v2)
├── engine/                 # sovereign-tools CLI (Node/TS)
│   ├── src/
│   └── package.json
├── skills/                 # thin orchestrator SKILL.md files
│   ├── fast-lane/
│   ├── council/
│   └── phase-{0..6}/
├── agents/                 # subagent definitions
├── references/             # on-demand protocol docs (questioning, tdd, adr-format…)
├── templates/              # seeded into .sovereign/ on init
├── docs/                   # one page per skill + guides + standards
└── archive/v1/             # the original prose system, for reference
```

---

## 8. Milestones

| Milestone | Scope |
| --- | --- |
| **M1 — Foundation** | `.sovereign/` state spec · `sovereign-tools` engine · `sovereign-init` · Fast Lane 5 (`grill-with-docs`, `ubiquitous-language`, `tdd`, `sentinel`, `handoff`) · Council (`--standard`). |
| **M2 — Architecture phase** | `entity-design`, `api-design`/`api-spec`, `scale-design`, `security-design`, `deploy-design`, `stack-select`, `adr-log`. |
| **M3 — Adopt & Bridge** | `sovereign-adopt` (3-layer archaeology, Type 2) · `bridge` · extension protocol over `npx skills`. |
| **M4+** | Phase 6 operations · multi-model Council (`--deep`) · microservices overlay · IoT/embedded tracks. |

---

## 9. Key Decisions (ADRs)

Carried from v1: **001** open-source MIT · **002** Node/TS CLI · **003** `.sovereign/` committed · **004** anchor docs store URLs by default · **005** strict core / open extensions · **006** MANIFEST loads first · **007** git is the collaboration layer · **008** stale bridges block pre-flight.

New in v2:
- **R-001 — Option C build mode.** Standalone SOVEREIGN; lift GSD's architectural *patterns*, not its code or engine. *Rationale: own identity + install without rebuilding solved plumbing, and without chaining to GSD's roadmap/governance.*
- **R-002 — Engine before skills.** Build `sovereign-tools` + `.sovereign/` state first; skills are thin orchestrators over it. *Rationale: v1 failed by writing skills with no engine.*
- **R-003 — Extensions wrap `npx skills`.** *Rationale: find-skills already solved discovery/install; we add vetting only.*
- **R-004 — Dogfood GSD for our own build planning.** Use `/gsd:new-project` to roadmap building SOVEREIGN; hand-craft skill content. *Rationale: prove the phased-build thesis on ourselves; `.planning/` (our build) stays separate from `.sovereign/` (what we ship).*

---

> Software engineering fundamentals matter more than ever.
> Not vibe coded. **Sovereign built.**

_Last updated: 2026-06-08 · rebuild on branch `wizz-e/seville`_
