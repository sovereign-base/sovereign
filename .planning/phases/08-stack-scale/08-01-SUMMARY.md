---
phase: 08-stack-scale
plan: 01
subsystem: skills
tags: [stack-select, architecture, m2, hand-authored, disable-model-invocation]
requirements: [ARCH-04, ARCH-08]
key-files: { created: [engine/skills/stack-select/SKILL.md] }
---
# Plan 08-01 Summary — stack-select (ARCH-04)
Hand-authored thin orchestrator: one `init stack-select` call, gathers project type/scale/budget/team/constraints one at a time recommendation-first (NOT trend-following), recommends per layer with rejected alternatives, currency-honesty flag (defers to future anchor-docs), writes `.sovereign/docs/STACK.md` + format block, offers /adr-log for lock-in choices. disable-model-invocation. 70 lines; validate PASS.
