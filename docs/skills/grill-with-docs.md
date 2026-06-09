# /grill-with-docs

*Close the gap between what you meant and what you said — before any code is written.*

## What it does

Interrogates a plan against the project's own domain model (`CONTEXT.md`) and recorded decisions (ADRs) — one sharp question at a time, **recommendation-first** (it gives its recommended answer with reasoning before you respond). It explores the codebase to answer questions instead of making you repeat yourself, surfaces contradictions between the plan and the code, and writes resolutions into `CONTEXT.md` / ADRs inline as they crystallize.

## When to use it

Before implementing anything non-trivial; when a plan "feels right" but hasn't been pressure-tested; when you suspect a plan conflicts with the domain model or an existing decision. **Don't** use it for trivial, clearly-specified changes, or instead of `/council` on an irreversible decision.

## How it works

A thin orchestrator: one `sovereign-tools init grill-with-docs` call hands it the glossary + relevant ADR paths; it reads them, then walks the design tree one question at a time, challenging terms against the glossary and cross-referencing the code. It offers an ADR **only** when a decision is hard-to-reverse + surprising + a real trade-off (see `adr-format.md`). State save is delegated to the engine.

## Outputs

- Updates `.sovereign/CONTEXT.md` (sharpened terms) and `.sovereign/docs/adr/` (when an ADR is warranted).

## Navigation

- **Before:** `/ubiquitous-language` (sharpen the vocabulary first).
- **After:** `/tdd` to build the now-unambiguous plan test-first; or `/council` if a remaining decision is irreversible.

Part of the Fast Lane — installed by `npx sovereign init --quick`.
