---
name: diagnose
description: Debug a failure methodically instead of guessing — reproduce it, isolate the boundary, form one root-cause hypothesis, fix the cause (not the symptom), and verify with no regressions. Use the moment a test fails, a runtime error appears, or you catch yourself about to change something on a hunch.
disable-model-invocation: true
argument-hint: "[what's failing]"
---

## Why this matters

The most expensive bug is the one you "solved" by guessing — you change something plausible, it seems to go away, and the real cause is still there, now hidden under a patch. Guessing also tends to chase the *symptom* (the visible error) while the *root cause* keeps producing new symptoms somewhere else.

`diagnose` replaces guessing with a disciplined loop: confirm the failure, narrow it to its true source, commit to one explanation, change the root cause, and prove it's gone without breaking anything else. Every step is **recommendation-first** and uses your project's own tooling. It is a thin orchestrator — it leans on the shipped construction skills rather than reinventing them, and it records what it found so the next session doesn't re-derive it.

## When to use this

When something is broken and you need the cause, not a patch:

- a failing test, a runtime error, or a stack trace you don't yet understand;
- flaky / intermittent behavior;
- a regression that appeared after a change;
- any moment you catch yourself thinking "I bet this change fixes it" without knowing *why* it broke.

**Don't** use it to write new behavior (that's `/tdd`), to review finished work against your standards (that's `/sentinel`), or to rubber-stamp a guess — the whole point is to find the cause before changing code.

## The flow

A **thin orchestrator** — the discipline is the value; the engine + sibling skills do the work. Walk the steps in order; resist jumping to a change.

**1 — Orient.** One call, then read only what it points to:
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init diagnose)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Use the glossary/state it surfaces so the diagnosis speaks the project's language.

**2 — Reproduce.** Get a reliable, minimal **reproduce** case FIRST:

- use the project's own test/run tooling (never a hardcoded runner — whatever this project already uses);
- capture it as a failing test via `/tdd` so the bug is pinned and the eventual change is provable;
- if you can't reproduce it, say so and stop — don't guess at code you can't confirm is even running.

**3 — Isolate.** Narrow the surface to the true source:

- read the actual error and stack to the first frame in *your own* code (`file:line`);
- binary-search the boundary where good→bad — bisect commits (e.g. `git bisect`), bisect the input or config, or drop a temporary assertion at the suspected boundary and remove it after;
- shrink to the smallest failing case before theorizing.

**4 — Hypothesis.** State ONE testable **hypothesis** about the root cause, **recommendation-first**:

- the single most-likely explanation and *why* — not a shotgun list of maybes;
- name it explicitly as the root cause, distinct from the symptom you observed;
- if it leans on external behavior you haven't confirmed against current docs (an API shape, a default, a version), run `/verify-self` instead of assuming.

**5 — Fix.** Make the minimal change that addresses the **root cause**, not the symptom. Drive it test-first through `/tdd` where it fits, so the failing case from step 2 turns green for the right reason — not because you masked the error.

**6 — Verify.** Prove it:

- re-run the reproduce case (now passing) AND the whole test suite to confirm no **regression** elsewhere;
- if the root cause was assumed rather than proven, hand to `/verify-self` to mark `SOVEREIGN:UNVERIFIED` at the relevant `file:line`;
- run `/sentinel` for the standards pass on the change.

**7 — Record.** Persist a short trail — symptom, root cause, the change, how it was confirmed — so it isn't re-derived next time:
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" state save
```
Commit via `sovereign-tools commit` if `commit_docs` is on, so the diagnosis travels with the repo.

## Navigation

```
▶ NEXT
  Cause found and addressed — not patched. Continue only on a change that's
  confirmed green with no regression.

  • Leaned on a guess about external behavior? → /verify-self (mark it; /sentinel
    scans the SOVEREIGN:UNVERIFIED markers it leaves).
  • Change in place? → /sentinel for the standards pass before you move on.
  • Reproduce captured as a test via /tdd? → keep it; it guards the bug's return.

  diagnose orchestrates: /tdd (reproduce + the change) · /verify-self (unconfirmed
  cause) · /sentinel (standards). It finds the cause; the siblings do their part.
```
