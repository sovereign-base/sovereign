---
phase: 07-api-design
plan: 01
subsystem: skills
tags: [api-design, contract-first, api-spec, m2, hand-authored, disable-model-invocation]
requirements: [ARCH-03, ARCH-08]
key-files: { created: [engine/skills/api-design/SKILL.md] }
---
# Plan 07-01 Summary — api-design (ARCH-03)
Hand-authored thin orchestrator: one `init api-design` call, reads ENTITY_MODEL.md (Phase 6) + glossary, walks protocol/consumers/resources/auth/versioning/errors/pagination/events one decision at a time recommendation-first, writes a living `.sovereign/docs/api/API_SPEC.md` (in-place on re-run, with a format block), OFFERS /adr-log for gate-passing decisions. Protocol-agnostic (REST/GraphQL/gRPC/events). disable-model-invocation: true. 77 lines; validate skills PASS; doctor on --full: 9 skills, 5 auto / 4 disabled (budget held). 77 tests pass.
