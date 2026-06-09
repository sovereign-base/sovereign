# /council

*Never trust the first answer — make five of them argue, then synthesize.*

## What it does

Convenes five advisor personas (Skeptic, Architect, Builder, Outsider, Risk Officer) who attack the **same neutralized question** in parallel, runs an anonymous peer-review round so each critiques the others blind, and a chairman returns a binding verdict — **PASS / CONDITIONAL PASS / BLOCKED** — with the reasoning. The full transcript is saved to `.sovereign/council/`.

In M1 only `--standard` runs; `--express` and `--deep` (multi-model) are deferred.

## When to use it

Use it before any decision that's expensive to undo: build-or-not, an architecture choice, a significant tech/stack pick, a pivot. **Don't** use it to validate a decision you've already made, for trivial details, or for quick facts.

## How it works

A thin orchestrator: it orients with one `sovereign-tools init council` call (models, context paths, transcript path, agents guard), injects your project context (glossary, phase, relevant ADRs) into each advisor, dispatches the 5 advisors in parallel, shuffles their answers to anonymized A–E for one peer-review pass, then the chairman synthesizes a verdict. The orchestrator alone writes the transcript, then runs `state save`, a gate pass (if at a phase gate), and `commit`.

## Outputs

- `.sovereign/council/council-<timestamp>.md` — the full transcript + verdict.
- Updates `.sovereign/MANIFEST.md` / `STATE.md` via the engine; references the verdict in the gate log.

## Navigation

- **Before:** `/ubiquitous-language` (so advisors share your vocabulary).
- **After a PASS:** `/grill-with-docs` to sharpen the decision into a spec.
- **After CONDITIONAL PASS / BLOCKED:** resolve the listed conditions/concerns first.

Installed by `npx sovereign-cli init --full` (it's a `--full` skill, user-invoked only).
