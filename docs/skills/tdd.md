# /tdd

*Code without a feedback loop is code you're hoping works — write the test first.*

## What it does

Drives a strict red-green-refactor loop: write a failing test for the next slice of observable behavior (RED, confirmed failing for the right reason), write the minimal code to pass (GREEN), then clean up under a green bar (REFACTOR). Tests assert behavior at the interface, not implementation details, so they survive refactors. Stack-agnostic — it uses the **project's own** test runner and never imposes a framework.

## When to use it

When implementing any non-trivial logic; when fixing a bug (write the failing test that reproduces it first); anytime you want a regression-proof feedback loop. **Skip** it for throwaway spikes and pure config/scaffolding with no behavior to assert.

## How it works

A thin orchestrator: one `sovereign-tools init tdd` call hands it the glossary path (so test + code names use the project's vocabulary); it detects the project's existing test command and runs the loop. Discipline: mock **only** at system boundaries (external APIs, clock, randomness) — never your own modules; one logical assertion per test; the name says *what*, not *how*. A `refactor-candidates` list guides the cleanup step.

## Outputs

- None in `.sovereign/` — `tdd` drives the project's own tests and source; it writes no SOVEREIGN state.

## Navigation

- **Before:** `/grill-with-docs` (build against an unambiguous plan).
- **After:** `/sentinel` to review the change against standards + spec; `/handoff` if pausing.

Part of the Fast Lane — installed by `npx sovereign-cli init --quick`.
