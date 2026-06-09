<div align="center">

# SOVEREIGN

### The engineering system for agents and the humans who work with them

A universal, project-agnostic system that guides any software project from the first thought to live production — gated phases, living documents, and guardrails that refuse to let the answer to *"how do we build this?"* be **vibes**.

`npx sovereign-cli init` · MIT · works best with Claude, compatible with any `SKILL.md` agent

**Status:** v2 · Milestone 1 (Foundation) complete & verified · [the north star →](./SOVEREIGN.md)

</div>

---

## What it is

SOVEREIGN is a small **engine** with **skills** layered on top. The engine (`sovereign-tools`, zero-dependency Node) keeps the project's engineering memory in a committed `.sovereign/` directory and hands every skill its full context in **one call**. The skills are thin orchestrators — they reason, the engine remembers.

No language lock-in. No stack opinion. No domain constraint. It works for web, mobile, IoT, data, AI — anything engineers build.

## The problem it solves

Software fails in predictable ways: misalignment before a line is written, twelve words for one concept, decisions made in chat threads and forgotten, scale cliffs nobody designed for, security bolted on last, context lost every new session. SOVEREIGN encodes the practices that prevent each — as skills that are fast to run and hard to skip.

## Quick start

```bash
npx sovereign-cli init --quick     # the Fast Lane: 5 daily-use skills + .sovereign/ state
npx sovereign-cli init --full      # everything in Milestone 1, including the Council
```

Then, in your agent:

```
/ubiquitous-language   lock the project's vocabulary
/grill-with-docs       stress-test a plan before building
/council               make five advisors argue a decision, then get a verdict
/tdd                   red-green-refactor, behavior at the interface
/sentinel              review work against your own standards
/handoff               never lose context between sessions
```

## What's in Milestone 1

| | |
|---|---|
| **Engine** | `sovereign-tools` — `init <workflow>` → one JSON blob; committed `.sovereign/` state with an always-current MANIFEST; append-only phase gates; gitignore-aware commits; model profiles; skill-format + budget linting |
| **Council** | Five advisors (Skeptic, Architect, Builder, Outsider, Risk Officer) argue in parallel, an anonymous peer-review round catches what each missed, a chairman returns a binding verdict — saved to `.sovereign/council/` |
| **Fast Lane** | `ubiquitous-language`, `grill-with-docs`, `handoff`, `sentinel`, `tdd` |
| **Guardrails** | recommendation-first, a navigation footer on every skill, a plain-language *"why this matters"*, and the `SOVEREIGN:UNVERIFIED` anti-hallucination marker |

Per-skill docs: [`docs/skills/`](./docs/skills/). Authoring standards: [`engine/references/`](./engine/references/).

## Architecture

Five layers — a deterministic engine at the bottom, thin orchestrators on top:

```
Extensions   →  wrap `npx skills` + vet           (later milestone)
Skills       →  thin orchestrators, one per command
Subagents    →  the reasoning (Council advisors, sentinel, chairman)
Engine       →  sovereign-tools: init <workflow> → ONE json blob
State        →  .sovereign/, committed to git, MANIFEST loads first
```

A skill never reads ten files to orient — it makes one CLI call. Bookkeeping lives in code, not tokens. Full design in [`SOVEREIGN.md`](./SOVEREIGN.md).

## How it's built

SOVEREIGN is **dogfooded**: it was built using a phased, spec-driven loop (research → plan → verify → execute → verify), one gated phase at a time, with atomic test-driven commits. The build plan lives in [`.planning/`](./.planning/). The engine is zero-dependency `.cjs` — the shipped artifact *is* the source, instantly `npx`-runnable, no build step. **77 tests, zero runtime dependencies.**

Inspired by Matt Pocock's skills, GSD, gstack, and the open agent-skills ecosystem — see [`SOVEREIGN.md`](./SOVEREIGN.md) §2.

## Status & roadmap

- **M1 — Foundation** ✅ engine · installer · Council · Fast Lane · conventions *(complete, verified)*
- **M2 — Architecture** entity / api / scale / security / deploy design · ADR log
- **M3 — Adopt & Bridge** retrofit existing codebases · cross-project handoff · extension protocol
- **M4+** operations phase · multi-model Council · microservices · IoT/embedded tracks

## License

MIT.

> Not vibe coded. **Sovereign built.**
