---
phase: 13-sovereign-adopt
plan: 01
subsystem: skills
tags: [sovereign-adopt, archaeology, retrofit, m3, hand-authored, disable-model-invocation, capstone]
requirements: [ADOPT-01, ADOPT-02, M3-CC]
key-files: { created: [engine/skills/sovereign-adopt/SKILL.md] }
---
# Plan 13-01 Summary — sovereign-adopt (ADOPT-01/02) — M3 capstone
Hand-authored thin orchestrator: one `init adopt` call, drives engine `adopt scan` (Layers 1+2, consumes the JSON contract — no re-walk), Layer 3 = bounded deep reads from `deep_read_candidates`, scaffolds `.sovereign/`, offers `/adr-log` for reverse-engineered decisions (composes, no re-implementation), writes risk-prioritized gap analysis + adoption roadmap to `.sovereign/docs/ADOPTION.md`. READ-ONLY on source (never modifies); greenfield+Type-2 scope (Type-3 deferred with narrower-approach recommendation). disable-model-invocation. 73 lines; validate PASS.
**M3-CC CLOSED:** doctor on --full install = 16 skills, 5 auto / 11 disabled, no warnings — listing budget held across the ENTIRE M3 milestone (and the whole project). 129 tests.
