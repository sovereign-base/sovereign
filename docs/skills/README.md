# SOVEREIGN Skills (M1)

The skills SOVEREIGN ships in the Foundation milestone. Each runs as a thin orchestrator over the `sovereign-tools` engine and reads/writes the committed `.sovereign/` state.

`npx sovereign-cli init --quick` installs the **Fast Lane** (the five daily-use skills); `npx sovereign-cli init --full` adds **Council**.

## Council

| Skill | What it does |
|-------|--------------|
| [`/council`](./council.md) | Five advisors argue a decision in parallel, blind peer review, chairman returns a binding verdict. Run before anything expensive to undo. (`--full`) |

## Fast Lane

| Skill | What it does |
|-------|--------------|
| [`/ubiquitous-language`](./ubiquitous-language.md) | Lock the project's vocabulary in `CONTEXT.md`, one term at a time, with conflict detection. |
| [`/grill-with-docs`](./grill-with-docs.md) | Interrogate a plan against the glossary + ADRs, one question at a time, recommendation-first. |
| [`/handoff`](./handoff.md) | Capture the session into a resumable `HANDOFF.md` so the next agent picks up cleanly. |
| [`/sentinel`](./sentinel.md) | Native-tier review: UNVERIFIED scan + commenting + spec alignment + ADR consistency → verdict. |
| [`/tdd`](./tdd.md) | Red-green-refactor loop, behavior at the interface, using the project's own test runner. |

Authoring standards live in the engine's [`references/`](../../engine/references/): [`skill-format.md`](../../engine/references/skill-format.md), [`adr-format.md`](../../engine/references/adr-format.md), [`commenting.md`](../../engine/references/commenting.md), [`unverified-marker.md`](../../engine/references/unverified-marker.md), [`listing-budget.md`](../../engine/references/listing-budget.md).
