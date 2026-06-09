# /ubiquitous-language

*Lock the project's vocabulary before the code drifts into twelve words for one thing.*

## What it does

Builds and maintains the project glossary in `.sovereign/CONTEXT.md` — one term at a time. It proposes a canonical term with a tight definition, flags conflicts with existing entries ("your glossary defines `cancellation` as X, but you mean Y"), and records the synonyms to avoid. The result is a shared language the agent and every future session speak consistently.

## When to use it

Use it when starting a domain, naming a concept you'll reference repeatedly, or when you notice two words being used for one idea (or one word for two). Also run it before `/grill-with-docs` or `/council` — a sharp glossary makes both far better. **Don't** add general programming terms (timeout, cache) — only concepts specific to *this* domain.

## How it works

A thin orchestrator: one `sovereign-tools init ubiquitous-language` call hands it the glossary path; it reads the current glossary, then works term-by-term — recommendation-first, conflict-checking against existing entries — writing each resolution into `CONTEXT.md` inline (never batched). State save is delegated to the engine.

## Outputs

- `.sovereign/CONTEXT.md` — the living glossary (a glossary only, never implementation notes).

## Navigation

- **After:** `/grill-with-docs` to interrogate a plan against the sharpened vocabulary, or `/council` with the language injected.

Part of the Fast Lane — installed by `npx sovereign-cli init --quick`.
