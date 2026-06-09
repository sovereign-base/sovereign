---
phase: 12-extension-skill
plan: 02
subsystem: skills
tags: [import-skill, extension-protocol, vetting, m3, hand-authored, disable-model-invocation]
requirements: [EXT-01, EXT-02, M3-CC]
key-files: { created: [engine/skills/import-skill/SKILL.md] }
---
# Plan 12-02 Summary — import-skill (EXT-01/02)
Hand-authored thin orchestrator: one `init extension` call, discover via `extension list` + `npx skills find`, FIVE vetting gates BEFORE install (necessity / conflict vs list+ADRs / security audit via `extension audit` over real `skills use` content / recommendation-first INSTALL|DON'T|CAVEATS / logged decision to `.sovereign/extensions/<date>-<skill>.md`), `extension install` only on a go (never on block verdict), state save + commit. Wraps npx skills (R-003, never reinvents); audit drives on engine scanSkillContent. disable-model-invocation. 76 lines; validate PASS; doctor 15 skills, 5 auto / 10 disabled (budget held). 129 tests.
