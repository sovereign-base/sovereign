# SOVEREIGN

**The engineering system for agents and the humans who work with them.**

```bash
npx sovereign init
```

---

SOVEREIGN is a collection of agent skills, structured phases, and living
documents that guide any software project from the first thought to live
production — without derailing, without skipping, without ambiguity.

Not a framework. Not a boilerplate. Not tied to any language, stack, or domain.

The system that answers: _"How do we build this properly?"_

---

## Quick Start

**Fast lane — immediate value, two minutes:**

```bash
npx sovereign init --quick
```

Installs five skills that fix the five most common agent failure modes:
misalignment, vocabulary drift, untested code, undetected problems, lost context.

**Full system — all six phases, all guardrails:**

```bash
npx sovereign init --full
```

---

## What You Get

```
PHASE 1 — IDEATION      Does this deserve to exist?
PHASE 2 — SPECIFICATION What exactly are we building?
PHASE 3 — ARCHITECTURE  How are we building it?
PHASE 4 — CONSTRUCTION  Build it right, one slice at a time.
PHASE 5 — DEPLOYMENT    Ship it safely.
PHASE 6 — OPERATIONS    The product's living manual. Runs forever.
```

Every phase has a gate. Every gate must pass. Every decision gets recorded.
No cold starts. No lost context. No silent failures.

---

## The Council

Before anything gets built, the Council convenes.

Five advisor personas argue your idea from different angles. Their responses
are anonymised and peer-reviewed — advisors critique each other without
knowing who wrote what. A chairman synthesises the verdict.

```
/council --express    Fast. Single synthesized voice.
/council --standard   Default. Five advisors. Peer review. Chairman verdict.
/council --deep       Multi-model. Maximum scrutiny. High-stakes decisions only.
```

---

## Works With Any Agent

SOVEREIGN skills are standard `SKILL.md` format. Compatible with Claude Code,
Cursor, Codex CLI, Gemini CLI, GitHub Copilot, and 30+ others.

Works best with Claude.

---

## Existing Projects

Already have a codebase? SOVEREIGN retrofits without breaking anything.

```bash
npx sovereign init --adopt
```

Three-layer archaeology reads your existing decisions from config files,
folder structure, and surgical file reads. Produces a prioritised gap
analysis and custom adoption roadmap.

---

## The Extension Protocol

Add any community skill to your SOVEREIGN setup:

```bash
npx sovereign import <skill>
```

The agent reads the skill, checks necessity, checks for conflicts, runs a
security audit, and gives you its recommendation before installing anything.

---

## Documentation

Full docs at [sovereign-base.github.io/sovereign](https://sovereign-base.github.io/sovereign)

- [Quick Start Guide](docs/guides/quick-start.md)
- [Full System Guide](docs/guides/full-guide.md)
- [Adopting an Existing Project](docs/guides/adopting-existing.md)
- [Writing a Skill](docs/standards/SKILL_FORMAT.md)
- [Contributing](CONTRIBUTING.md)

---

## Contributing

SOVEREIGN is open source (MIT). Contributions welcome.

- **Core skills** — strict review by maintainers
- **Extensions** — open registry, community rated

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

> Not vibe coded. Sovereign built.

---

_Built by [sovereign-base](https://github.com/sovereign-base)_  
_Inspired by Matt Pocock's skills, GitHub Spec Kit, and Domain-Driven Design_
