---
phase: 08-stack-scale
plan: 02
subsystem: skills
tags: [scale-design, architecture, m2, hand-authored, disable-model-invocation]
requirements: [ARCH-05, ARCH-08]
key-files: { created: [engine/skills/scale-design/SKILL.md] }
---
# Plan 08-02 Summary — scale-design (ARCH-05)
Hand-authored thin orchestrator: one `init scale-design` call, walks load/read-write-ratio/caching/queues/data-layer/scaling-triggers one topic at a time recommendation-first tied to real numbers, writes `.sovereign/docs/SCALE_STRATEGY.md` + format block, offers /adr-log for hard-to-reverse choices. Strategy-level only (no provisioning). disable-model-invocation. 71 lines; validate PASS. doctor on --full: 11 skills, 5 auto / 6 disabled (budget held). 77 tests.
