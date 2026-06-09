---
phase: 06-adr-entity
plan: 02
subsystem: skills
tags: [entity-design, domain-model, m2, hand-authored, disable-model-invocation, compose]
requirements: [ARCH-02, ARCH-08]
key-files: { created: [engine/skills/entity-design/SKILL.md] }
---
# Plan 06-02 Summary — entity-design (ARCH-02)
Hand-authored thin orchestrator: one `init entity-design` call, reads the CONTEXT.md glossary (flags undefined terms → /ubiquitous-language), walks entities/relationships/bounded-contexts one piece at a time recommendation-first, writes `.sovereign/docs/ENTITY_MODEL.md` (with a format block), and OFFERS /adr-log for hard-to-reverse choices (composes, never re-implements ADR recording). disable-model-invocation: true. 80 lines; validate skills PASS. doctor on --full install: 8 skills, 5 auto / 3 disabled — budget held.
