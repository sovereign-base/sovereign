<div align="center">

# SOVEREIGN

### The engineering system for agents and the humans who work with them

Gated phases, living documents, and guardrails that guide **any** software project from the first thought to live production — and refuse to let the answer to *"how do we build this?"* be **vibes**.

`npx sovereign-cli init` · MIT · works best with Claude Code, compatible with any `SKILL.md` agent

**Status:** v2 · M1–M3 shipped & verified · live on npm

</div>

---

## What it is

SOVEREIGN is a small **engine** with **skills** layered on top.

- The **engine** (`sovereign-tools`, zero-dependency Node) keeps your project's engineering memory in a committed **`.sovereign/`** directory and hands every skill its full context in *one call*.
- The **skills** are the things you actually run — `/council`, `/tdd`, `/sentinel`, … — thin orchestrators that reason, while the engine remembers.

The skills run **inside your AI agent** (Claude Code, or any SKILL.md-compatible tool). `npx sovereign-cli init` just installs them into your project; you invoke them by typing `/skill-name` in your agent.

> **Invoking skills per agent:** typing `/skill-name` with autocomplete is **Claude Code's** affordance. Other SKILL.md agents (Gemini CLI, Cursor, Codex, …) don't surface a `/`-menu — open the skill's `SKILL.md` (under `.claude/skills/<name>/`) and **invoke it by name** / follow its steps. The skills themselves are portable; only the way you *trigger* them differs by agent.

No language lock-in. No stack opinion. No domain constraint — web, mobile, IoT, data, AI, anything.

---

## Install

```bash
npx sovereign-cli init
```

It asks how you want to start:

| Choice | Installs | Use when |
|--------|----------|----------|
| **Quick** | the 5 daily-use *Fast Lane* skills | you just want the everyday workflow tools |
| **Full** *(recommended)* | everything — Council, architecture, adoption | a real project you'll take seriously |
| **Adopt** | Full, geared to existing code | you already have a codebase to bring under SOVEREIGN |

Non-interactive? `npx sovereign-cli init --quick|--full|--adopt` (and `--global` for `~/.claude`, `--json` for scripts). It's **idempotent** — re-run any time to update; your `.sovereign/` content is never clobbered.

What you get: SOVEREIGN's skills + subagents copied into `.claude/`, and a scaffolded **`.sovereign/`** folder — your project's committed engineering memory. **Commit `.sovereign/`**; it travels with the repo so every teammate and every future session shares the same context.

---

## How you actually use it — the walkthrough

> **New project?** Follow the flow below top to bottom. **Existing code?** Jump to [Adopting an existing project](#adopting-an-existing-project) first, then rejoin wherever the gaps are.

You don't run all 20 skills every time — you reach for the right one at the right moment. Here's the natural arc of a project:

### 1. Decide if it should exist — `/council`
Before building anything expensive-to-undo (a product bet, a big architecture call, a stack choice), run:
```
/council "Should we build X as a native app or a PWA?"
```
Five advisor personas argue it from different angles, an **anonymous peer-review** round catches what each missed, and a chairman returns a **binding verdict** (PASS / CONDITIONAL PASS / BLOCKED) with the reasoning — saved to `.sovereign/council/`. It exists because AI is agreeable: ask it "should I?" and "is this a bad idea?" and you get opposite answers. Council removes the framing.

### 2. Lock the vocabulary — `/ubiquitous-language`
```
/ubiquitous-language
```
Names the domain concepts *once*, in `.sovereign/CONTEXT.md`, so "user" vs "account" vs "customer" never drifts. One term at a time, conflict-checked. Do this early — every later skill (and every future session) speaks this language.

### 3. Sharpen the plan — `/grill-with-docs`
```
/grill-with-docs
```
Interrogates your plan against the glossary and your recorded decisions, **one question at a time, recommendation-first**, and writes resolutions inline. Closes the gap between what you meant and what you said — *before* code locks it in.

### 4. Design the architecture
Record the shape of the system, each skill writing a durable doc you (and construction) build against:

| Run | Designs → writes |
|-----|------------------|
| `/entity-design` | the domain model (entities, relationships, bounded contexts) → `ENTITY_MODEL.md` |
| `/api-design` | a contract-first, protocol-agnostic API → `docs/api/API_SPEC.md` |
| `/stack-select` | the tech stack from *your* constraints (not the trend) → `STACK.md` |
| `/scale-design` | the scaling strategy (load, caching, queues, bottlenecks) → `SCALE_STRATEGY.md` |
| `/security-design` | a layered security model → `docs/security/SECURITY_MODEL.md` |
| `/deploy-design` | a budget-aware deploy/infra plan → `docs/infra/DEPLOY_MODEL.md` |

Each one is recommendation-first and **offers `/adr-log`** for the hard-to-reverse choices:

```
/adr-log "We use Postgres, not Mongo, because …"
```
`/adr-log` records an Architecture Decision Record — but only if it passes a three-condition gate (hard to reverse + surprising + a real trade-off), so the log stays signal, not noise.

### 5. Build it — `/tdd` then `/sentinel`
```
/tdd        # red → green → refactor, testing behavior at the interface
/sentinel   # review the change against YOUR standards before it compounds
```
`/tdd` drives a test-first loop using *your* project's own test runner (stack-agnostic). `/sentinel` then reviews the work — scanning for `SOVEREIGN:UNVERIFIED` markers, comment quality, spec alignment, and ADR consistency — and returns a verdict.

### Anytime — keep context and extend
- `/handoff` — compress a long session into a resumable `HANDOFF.md` before you `/clear` or hand off to a teammate. Beats context decay.
- `/import-skill owner/repo@skill` — pull a third-party skill from the `npx skills` ecosystem **through a five-gate vetting pass** (necessity → conflict → security audit → recommendation → logged decision). Nothing is installed blind.
- `/bridge` — generate a `BRIDGE.md` so a *consuming* project (your mobile app, another service) starts informed: your API contracts, auth, glossary, and decisions-already-made — with hash-based staleness detection.

---

## Adopting an existing project

Already have code? Start here instead of step 1:

```
npx sovereign-cli init --adopt
# then, in your agent:
/sovereign-adopt
```

`/sovereign-adopt` runs **3-layer archaeology** — config/manifests, then the file structure, then a few high-signal files (router, auth, base model) — to reverse-engineer the decisions already baked into your code. It scaffolds `.sovereign/`, records **retroactive ADRs** for what it finds, and writes a **risk-prioritized gap analysis + adoption roadmap** to `.sovereign/docs/ADOPTION.md`. It **reads and records only — it never refactors your source.** Then you work down the roadmap (e.g. `/security-design` for the highest-risk gap).

SOVEREIGN is best on **new projects** (you get the full ideation→architecture→build arc), but `/sovereign-adopt` makes it real for existing ones too.

---

## The skills at a glance

| Skill | What it's for | Install |
|-------|---------------|---------|
| `/council` | Pressure-test an expensive-to-undo decision | Full |
| `/ubiquitous-language` | Lock the domain vocabulary (`CONTEXT.md`) | Quick |
| `/grill-with-docs` | Interrogate a plan before building | Quick |
| `/tdd` | Red-green-refactor, behavior at the interface | Quick |
| `/sentinel` | Review work against your own standards | Quick |
| `/handoff` | Resumable session capture | Quick |
| `/entity-design` `/api-design` `/stack-select` `/scale-design` `/security-design` `/deploy-design` | The architecture-phase design skills | Full |
| `/adr-log` | Record an architectural decision (gated) | Full |
| `/bridge` | Cross-project handoff + staleness | Full |
| `/import-skill` | Vet + install third-party skills | Full |
| `/sovereign-adopt` | Retrofit onto an existing codebase | Full |

Deeper per-skill docs live in [`docs/skills/`](./docs/skills/).

---

## How it works (under the hood)

```
Skills      →  thin orchestrators you invoke (/council, /tdd, …)
Subagents   →  the reasoning (Council advisors, sentinel, chairman)
Engine      →  sovereign-tools: init <workflow> → ONE json blob
State       →  .sovereign/, committed to git, MANIFEST loads first
```

**The load rule:** a skill never reads ten files to orient — it makes one `sovereign-tools init` call that returns paths, config, and phase status as a single JSON blob, then reads only what it needs. Bookkeeping lives in code, not tokens. The engine is zero-dependency `.cjs` — the shipped artifact *is* the source, instantly `npx`-runnable, no build step.

A deliberate discipline keeps it lean: only a handful of skills are *auto-suggestable* to the model; the rest are **user-invoked** (you type `/name`). That's how SOVEREIGN stays a sharp toolkit instead of an overwhelming menu. Full design in [`SOVEREIGN.md`](./SOVEREIGN.md).

---

## Status & roadmap

- **M1 — Foundation** ✅ engine · installer · Council · Fast Lane · conventions
- **M2 — Architecture** ✅ entity / api / scale / security / deploy design · ADR log · stack-select
- **M3 — Adoption, Bridging & Extensions** ✅ `bridge` · `import-skill` · `sovereign-adopt`
- **M4 — Ground Truth** 🔜 `anchor-docs` (anchor to current external docs) · `verify-self` (catch the agent's own uncertainty)
- **Later** operations phase · multi-model Council · domain *tracks* · IoT/embedded

## Contributing & extending

It's MIT and open. Author new skills against [`engine/references/skill-format.md`](./engine/references/skill-format.md); add third-party ones safely with `/import-skill`. The build itself is dogfooded — the full plan lives in [`.planning/`](./.planning/).

## License

MIT.

> Not vibe coded. **Sovereign built.**
