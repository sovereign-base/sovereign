---
phase: 04-fast-lane
plan: 05
subsystem: skills
tags: [tdd, red-green-refactor, fast-lane, hand-authored]
requirements: [SKL-05, SKL-06]
key-files: { created: [engine/skills/tdd/SKILL.md] }
---
# Plan 04-05 Summary — tdd (SKL-05)
Thin orchestrator: one `init tdd` call, red-green-refactor loop using the project's OWN test runner (stack-agnostic, no runtime QA), test behavior at the interface, mock only at system boundaries, refactor-candidates list. SKL-06 shape. validate skills PASS.
