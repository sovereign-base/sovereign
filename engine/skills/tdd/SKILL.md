---
name: tdd
description: Build features and fix bugs test-first with a strict red-green-refactor loop, testing observable behavior at the interface rather than implementation. Stack-agnostic — uses the project's own test runner. Use when implementing logic, fixing a bug, or asked for test-first development.
---

## Why this matters

Code without a feedback loop is code you're hoping works. Writing the test first forces you to state what "working" means *before* you're attached to an implementation — so the test describes behavior the caller cares about, not the shape of the code you happened to write. Tests written after the fact tend to lock in the implementation's accidents and pass for the wrong reasons.

Red-green-refactor gives you a tight loop: prove the test can fail, make it pass with the least code, then clean up under a green bar. You always know exactly where you stand, and the tests survive refactors because they test behavior, not internals.

## When to use this

- Implementing any non-trivial logic.
- Fixing a bug — write the failing test that reproduces it first.
- Anytime you want a regression-proof feedback loop.

Skip it for throwaway spikes and pure config/scaffolding with no behavior to assert.

## The loop

A **thin orchestrator** — orient once, then run the cycle using the **project's own** test runner (SOVEREIGN is stack-agnostic; it does not impose a framework or run the app itself).

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init tdd)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `context_injection.glossary_path` so test + code names use the project's vocabulary. Detect the project's existing test command (don't introduce a new framework).

**2 — RED.** Write one failing test that asserts the next slice of **observable behavior** through the module's public interface. Run it; confirm it fails *for the right reason* (the behavior is missing — not a typo or import error). A test that's never been red proves nothing.

**3 — GREEN.** Write the **minimal** code to make it pass. No gold-plating, no unrequested features. Run the suite; confirm green.

**4 — REFACTOR.** With the bar green, improve the code: remove duplication, clarify names (using the glossary), deepen shallow modules. Re-run after each change; stay green. Refactor the tests too if they've gotten coupled to internals.

Repeat one behavior at a time.

## What makes a good test

- **Test behavior at the interface**, not implementation details. Assert observable outcomes a caller would see, not internal calls or private state.
- **Mock only at system boundaries** — external APIs, the clock, randomness, third-party services. **Do not mock your own modules or internal collaborators**; tests that mock internals break on every refactor and verify nothing real.
- Prefer dependency injection so the boundary is easy to substitute.
- One logical assertion per test; the name says *what*, not *how*.

A test that has to change when you refactor without changing behavior is testing past the interface — pull it back to the seam.

## Refactor candidates (under a green bar)

When you reach REFACTOR, look for these and fix them while the tests protect you:

- **Duplication** → extract a function.
- **Long method** → break into well-named private helpers (keep tests on the public interface).
- **Shallow module** (interface as complex as its implementation) → deepen or merge it.
- **Primitive obsession** (passing raw strings/ints with rules) → introduce a value object.
- **Feature envy** (a function reaching into another object's data) → move the logic to where the data lives.

Refactor in small steps, re-running the suite after each — never refactor on a red bar.

## Navigation

```
▶ NEXT
  Slice green. Behavior covered at the interface.
  /sentinel — review the change against standards + spec before moving on
  /handoff  — capture session state if you're pausing
```
