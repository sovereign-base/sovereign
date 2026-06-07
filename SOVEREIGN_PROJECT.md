# SOVEREIGN

### The Engineering System for Agents and the Humans Who Work With Them

**Repository:** `github.com/sovereign-base/sovereign`  
**CLI:** `npx sovereign init`  
**License:** MIT  
**Status:** v1.0.0 — Active Development

---

## What Is SOVEREIGN?

SOVEREIGN is a universal, project-agnostic engineering system — a collection of
agent skills, structured phases, living documents, and guardrails that guide any
software project from the first thought to live production and beyond.

It is not a framework. It is not a boilerplate. It is not tied to any language,
stack, or domain.

It is the system that answers the question: _"How do we build this properly?"_

Inspired by Matt Pocock's skills, GitHub's Spec Kit, Eric Evans' Domain-Driven
Design, and the hard lessons of thousands of software projects that derailed
because nobody wrote down why the decisions were made.

---

## The Problem SOVEREIGN Solves

Software projects fail in predictable ways:

- **Misalignment** — the agent (or developer) builds the wrong thing because
  nobody interrogated the idea hard enough before writing code.
- **Vocabulary drift** — the team uses twelve words for the same concept and
  nobody notices until the codebase is incoherent.
- **Missing decisions** — architectural choices get made in Slack threads and
  forgotten. Six months later, nobody knows why the system is shaped the way it is.
- **Invisible scale cliffs** — the system works at 1,000 users and falls over
  at 50,000 because scaling was never designed, only hoped for.
- **Security as an afterthought** — auth gets bolted on, secrets get hardcoded,
  threat models never get written.
- **Lost context** — every new session, every new team member, every new agent
  starts from zero.

SOVEREIGN fixes all of these. Not by adding bureaucracy — by encoding good
engineering practice as agent skills that are fast to run and impossible to skip.

---

## Core Philosophy

**Universal.** No language lock-in. No stack opinion. No domain constraint.
Works for web apps, mobile apps, IoT systems, data platforms, AI products,
microservices, and anything else engineers build.

**Sequential and gated.** Phases cannot be skipped. Gates cannot be faked.
The system enforces the discipline that separates shipped products from
perpetual side projects.

**Recommendation-first.** At every decision point, the agent gives its
recommendation with reasoning before waiting for your choice. You always
know what to do next.

**Context-persistent.** Nothing is ever lost. Every decision, every session,
every handoff is documented. Any agent — any engineer — can pick up any
project at any point and know exactly where it stands.

**Token-conscious.** SOVEREIGN is designed to work efficiently. Progressive
disclosure means skills only load what's needed. The manifest loads first,
full documents load on demand. The system works on any capable model, and
works best on Claude.

**Enterprise-ready by default.** Not MVP-first. Not "we'll add security later."
SOVEREIGN assumes you're building something that matters and treats it that way
from day one.

---

## The Six Phases

```
PHASE 0 ── SETUP
           Initialise the workspace. Bootstrap all SOVEREIGN documents.

PHASE 1 ── IDEATION
           Does this deserve to exist? What exactly is it?
           The Council convenes here.

PHASE 2 ── SPECIFICATION
           What exactly are we building?
           No tech. No stack. Pure intent.

PHASE 3 ── ARCHITECTURE
           How are we building it?
           Every major decision recorded.

PHASE 4 ── CONSTRUCTION
           Build it right, one slice at a time.

PHASE 5 ── DEPLOYMENT
           Ship it safely. Know how to undo it.

PHASE 6 ── OPERATIONS (continuous)
           The product's living operating manual.
           Runs indefinitely after first deployment.
```

Each phase has a **gate** — a set of conditions that must be met before
the next phase begins. Gates cannot be bypassed. They can be documented
and acknowledged, but never silently skipped.

---

## The Fast Lane

Not every project needs the full system immediately. The fast lane gives
engineers immediate value in under two minutes.

```bash
npx sovereign init --quick
```

Five skills. Zero ceremony. Immediately useful:

| Skill                  | What it fixes                   |
| ---------------------- | ------------------------------- |
| `/grill-with-docs`     | Misalignment before building    |
| `/ubiquitous-language` | Vocabulary drift                |
| `/tdd`                 | Untested code                   |
| `/sentinel`            | Problems compounding undetected |
| `/handoff`             | Lost context between sessions   |

The full system is always one command away:

```bash
npx sovereign init --full
```

---

## The Council

The most important skill in SOVEREIGN. Runs at Phase 1 before a single
spec is written. Forces the agent to argue with itself across five
distinct thinking styles, with anonymous peer review between advisors.

Based on the LLM Council methodology. Adapted for engineering decisions
with full project context from `.sovereign/`.

**Three modes:**

| Mode         | Description                       | Use when                            |
| ------------ | --------------------------------- | ----------------------------------- |
| `--express`  | Single synthesized voice          | Small features, quick validation    |
| `--standard` | 5 parallel advisors + peer review | Default. All significant decisions. |
| `--deep`     | Multi-model if configured         | Irreversible high-stakes choices    |

**Five advisor roles:**

- **The Skeptic** — assumes the idea has a fatal flaw and finds it
- **The Architect** — probes technical feasibility and hidden complexity
- **The Builder** — only cares about what gets built Monday morning
- **The Outsider** — fresh eyes, zero context, catches the curse of knowledge
- **The Risk Officer** — legal, regulatory, security, ethical, operational risk

Every Council session is saved to `.sovereign/council/` and referenced
in the phase gate log.

---

## The Context System

SOVEREIGN's memory. Lives in `.sovereign/` — committed to git, never
gitignored. Every teammate, every agent, every session has access to
the full engineering history of the project.

```
.sovereign/
├── MANIFEST.md          ← ALWAYS loaded first. Low token cost.
│                          Full project orientation in < 500 tokens.
├── SOVEREIGN.md         ← Project constitution. Phase gates. Track status.
├── CONTEXT.md           ← Ubiquitous language glossary. Living document.
├── BRIDGE.md            ← Generated when bridging to another project.
├── HANDOFF.md           ← Current session state for agent continuity.
├── council/             ← All council session transcripts + verdicts.
├── extensions/          ← Imported third-party skills.
├── external-docs/       ← Anchor doc URLs + versions. Never full content
│                          unless opt-in. Copyright-safe by default.
└── docs/
    ├── adr/             ← Every architectural decision. Timestamped.
    ├── api/             ← API_SPEC.md — living API contract.
    ├── specs/           ← Feature specifications.
    ├── security/        ← SECURITY_MODEL.md
    ├── infra/           ← DEPLOY_MODEL.md
    └── intersections/   ← Track intersection documents.
```

**MANIFEST.md is the entry point.** Every skill loads it first. It contains:

- Current phase and gate status
- Active tracks
- File map with one-line explanations
- Key decisions (quick reference)
- Current blockers
- Next recommended action

---

## Anti-Hallucination Protocol

SOVEREIGN treats agent uncertainty as a first-class engineering concern.

**Three mechanisms:**

`/anchor-docs` — When implementing integrations with third-party APIs,
SDKs, or any rapidly-changing technology, the agent requests verified
documentation before writing a single line. Stores URLs by default
(copyright-safe). Full content opt-in with explicit warning.

`/verify-self` — When the agent detects low-confidence signals in its
own output, it triggers a hard stop, runs a retroactive audit of all
code written since the last verified anchor, and presents the engineer
with three options: provide docs, mark as unverified, or discard and restart.

`SOVEREIGN:UNVERIFIED` markers — Code written under uncertainty is
marked inline. These markers are scanned by `/sentinel` and `/pre-flight`.
Unresolved markers block deployment by default.

---

## The Bridge System

When a project has multiple layers — backend, frontend, mobile, IoT — each
layer is its own SOVEREIGN project. The Bridge System connects them.

`/bridge` generates a structured `BRIDGE.md` document containing everything
the consuming project needs to know: API contracts, auth flows, domain
glossary, track intersection points, decisions already made.

**Staleness detection:** When source files change, SOVEREIGN automatically
opens a GitHub issue in consuming repos flagging the specific changes.
Stale bridges block `/pre-flight` by default. Override with
`/bridge --acknowledge-stale` — logged with timestamp.

---

## Sentinel

The quality gate. Runs automatically after every construction phase segment.
Two-tier engine — always works, gets better with optional tools.

**Tier 1 — Native (always available):**

- Commenting standard compliance
- Spec alignment check (acceptance criteria vs implementation)
- `SOVEREIGN:UNVERIFIED` marker scan
- ADR consistency check
- Code pattern adherence

**Tier 2 — CodeRabbit Enhanced (opt-in):**

- Bug detection
- Security vulnerability scanning
- Performance analysis

Sentinel produces a structured report with a clear verdict:
`PASS`, `CONDITIONAL PASS`, or `BLOCKED`.

---

## Adoption — Existing Projects

SOVEREIGN works on projects already in flight. The `/sovereign-adopt`
command runs a three-layer archaeology of the existing codebase:

**Layer 1 — Config files** (near zero tokens)
Package manifests, Dockerfiles, env examples. Reveals 80% of stack
decisions in under 20 files.

**Layer 2 — Structure scan** (low tokens)
Folder structure and file names only. The shape of the codebase
reveals the architecture.

**Layer 3 — Targeted deep reads** (medium tokens)
5-10 surgical file reads: main router, auth middleware, base model,
primary config. Not exhaustive — precise.

Output: a prioritised gap analysis and custom adoption roadmap that
respects what's already been built.

---

## The Extension Protocol

Third-party skills can be added to SOVEREIGN without breaking it.

```bash
npx sovereign import <github-url-or-registry-name>
```

The agent automatically:

1. Reads the skill fully
2. Checks necessity against active tracks and phase
3. Checks for conflicts with existing skills and ADRs
4. Runs a security audit (OWASP Agentic Skills Top 10 aligned)
5. Gives its recommendation — install or not, with reasoning
6. Logs the decision in `SOVEREIGN_EXTENSIONS.md`

---

## Model Compatibility

SOVEREIGN is agent-agnostic. Skills are standard `SKILL.md` format,
compatible with Claude Code, Cursor, Codex CLI, Gemini CLI, GitHub
Copilot, and 30+ other agents.

```yaml
works-best-with: claude
compatible-with: [codex, cursor, gemini-cli, copilot, opencode]
min-model: sonnet-class
```

Skills that require deep reasoning (Council, grill-with-docs) work
best on frontier models. Utility skills (compact, sentinel native,
code-patterns) work on any capable model.

---

## Skill Inventory

### Fast Lane (v1.0)

| Skill                  | Phase  | Status     |
| ---------------------- | ------ | ---------- |
| `/grill-with-docs`     | 2      | 📋 Planned |
| `/ubiquitous-language` | 1      | 📋 Planned |
| `/tdd`                 | 4      | 📋 Planned |
| `/sentinel`            | 4      | 📋 Planned |
| `/handoff`             | System | 📋 Planned |

### Phase 0 — Setup

| Skill             | Status     |
| ----------------- | ---------- |
| `/sovereign-init` | 📋 Planned |

### Phase 1 — Ideation

| Skill                  | Status     |
| ---------------------- | ---------- |
| `/council`             | 📋 Planned |
| `/grill-idea`          | 📋 Planned |
| `/revenue-model`       | 📋 Planned |
| `/ubiquitous-language` | 📋 Planned |

### Phase 2 — Specification

| Skill              | Status     |
| ------------------ | ---------- |
| `/grill-with-docs` | 📋 Planned |
| `/write-spec`      | 📋 Planned |
| `/api-spec`        | 📋 Planned |
| `/spec-review`     | 📋 Planned |
| `/to-prd`          | 📋 Planned |

### Phase 3 — Architecture

| Skill               | Status     |
| ------------------- | ---------- |
| `/entity-design`    | 📋 Planned |
| `/api-design`       | 📋 Planned |
| `/scale-design`     | 📋 Planned |
| `/security-design`  | 📋 Planned |
| `/deploy-design`    | 📋 Planned |
| `/stack-select`     | 📋 Planned |
| `/adr-log`          | 📋 Planned |
| `/service-design`   | 📋 Planned |
| `/service-contract` | 📋 Planned |
| `/event-catalog`    | 📋 Planned |
| `/dependency-map`   | 📋 Planned |

### Phase 4 — Construction

| Skill                   | Status     |
| ----------------------- | ---------- |
| `/vertical-slice`       | 📋 Planned |
| `/tdd`                  | 📋 Planned |
| `/to-issues`            | 📋 Planned |
| `/code-patterns`        | 📋 Planned |
| `/zoom-out`             | 📋 Planned |
| `/improve-architecture` | 📋 Planned |
| `/diagnose`             | 📋 Planned |
| `/prototype`            | 📋 Planned |
| `/security-review`      | 📋 Planned |
| `/anchor-docs`          | 📋 Planned |
| `/verify-self`          | 📋 Planned |
| `/sentinel`             | 📋 Planned |

### Phase 5 — Deployment

| Skill                  | Status     |
| ---------------------- | ---------- |
| `/pre-flight`          | 📋 Planned |
| `/db-migration-plan`   | 📋 Planned |
| `/observability-setup` | 📋 Planned |
| `/postmortem-template` | 📋 Planned |
| `/scale-test`          | 📋 Planned |

### Phase 6 — Operations (v1.1)

| Skill           | Status  |
| --------------- | ------- |
| `/onboard`      | 📋 v1.1 |
| `/feature`      | 📋 v1.1 |
| `/incident`     | 📋 v1.1 |
| `/health-check` | 📋 v1.1 |
| `/deprecate`    | 📋 v1.1 |

### Cross-Project

| Skill              | Status     |
| ------------------ | ---------- |
| `/bridge`          | 📋 Planned |
| `/service-bridge`  | 📋 Planned |
| `/scale-review`    | 📋 Planned |
| `/sovereign-adopt` | 📋 Planned |

### System Utilities

| Skill           | Status     |
| --------------- | ---------- |
| `/compact`      | 📋 Planned |
| `/import-skill` | 📋 Planned |
| `/handoff`      | 📋 Planned |

---

## Repository Structure

```
sovereign-base/sovereign/
├── SOVEREIGN_PROJECT.md     ← THIS FILE. Start here.
├── README.md                ← Public-facing intro
├── CONTRIBUTING.md          ← How to contribute skills
├── CHANGELOG.md             ← Version history
├── LICENSE                  ← MIT
│
├── skills/                  ← All SKILL.md files
│   ├── fast-lane/           ← The 5 fast lane skills
│   ├── council/             ← Council skill
│   ├── phase-1/             ← Ideation skills
│   ├── phase-2/             ← Specification skills
│   ├── phase-3/             ← Architecture skills
│   ├── phase-4/             ← Construction skills
│   ├── phase-5/             ← Deployment skills
│   ├── phase-6/             ← Operations skills (v1.1)
│   ├── cross-project/       ← Bridge, adopt, scale-review
│   └── system/              ← Utilities
│
├── cli/                     ← npx sovereign CLI (Node/TypeScript)
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── docs/                    ← Documentation
│   ├── skills/              ← One .md per skill
│   ├── guides/
│   │   ├── quick-start.md
│   │   ├── full-guide.md
│   │   └── adopting-existing.md
│   └── standards/
│       ├── COMMENTING.md    ← Code commenting standard
│       ├── SKILL_FORMAT.md  ← How to write a skill
│       └── ADR_FORMAT.md    ← How to write an ADR
│
└── templates/               ← Starter templates
    ├── MANIFEST.md
    ├── SOVEREIGN.md
    ├── CONTEXT.md
    └── BRIDGE.md
```

---

## Versioning

SOVEREIGN follows semantic versioning.

| Version | Scope                                                                         |
| ------- | ----------------------------------------------------------------------------- |
| v1.0.0  | Fast lane, Council (standard), sovereign-adopt (Type 2), CLI, core docs       |
| v1.1.0  | Phase 6 operations, multi-model Council (--deep), bridge staleness automation |
| v1.2.0  | IoT + embedded tracks, Type 3 legacy adoption                                 |
| v2.0.0  | TBD based on community feedback                                               |

---

## Contributing

SOVEREIGN has a two-tier contribution model:

**Core skills** — strict review. Every PR reviewed by maintainers before
merge. Core skills must meet the full documentation standard, pass the
skill format spec, and include an example session.

**Extensions** — open registry. Anyone can publish. Community rates and
flags. Extensions go through `/import-skill` vetting before a project
adopts them.

See `CONTRIBUTING.md` for the full contribution guide.

---

## Key Decisions (Project ADRs)

**ADR-SOVEREIGN-001:** Open source. MIT licence. No monetisation in v1.
_Rationale: Build something great first. Community > revenue at this stage._

**ADR-SOVEREIGN-002:** Node/TypeScript for CLI.
_Rationale: npx works out of the box. No prerequisites beyond Node._

**ADR-SOVEREIGN-003:** .sovereign/ committed to git by default.
_Rationale: Engineering memory belongs to the team, not one machine._

**ADR-SOVEREIGN-004:** Anchor docs store URLs by default, not full content.
_Rationale: Copyright safety. Full content opt-in with explicit warning._

**ADR-SOVEREIGN-005:** Strict core skills, open extension registry.
_Rationale: Quality control on the foundation. Freedom on the extensions._

**ADR-SOVEREIGN-006:** MANIFEST.md loads first, every session, always.
_Rationale: Full project context in under 500 tokens. No cold starts._

**ADR-SOVEREIGN-007:** Git is the collaboration layer for .sovereign/.
_Rationale: Engineers already know it. No extra infrastructure needed._

**ADR-SOVEREIGN-008:** Stale bridges block pre-flight by default.
_Rationale: Silent staleness is more dangerous than explicit friction._

---

## The North Star

> Software engineering fundamentals matter more than ever.
> These skills are our best effort at condensing these fundamentals
> into repeatable practices to help engineers ship the best
> products of their careers.
>
> Not vibe coded. Sovereign built.

---

_Last updated: 2026-06-07_  
_Maintained by: sovereign-base_  
_Built with: SOVEREIGN v1.0.0_
