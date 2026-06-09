---
phase: 11-bridge-skill
plan: 01
subsystem: skills
tags: [bridge, cross-project, staleness, m3, hand-authored, disable-model-invocation]
requirements: [BRIDGE-01, BRIDGE-02, M3-CC]
key-files: { created: [engine/skills/bridge/SKILL.md] }
---
# Plan 11-01 Summary — bridge (BRIDGE-01/02)
Hand-authored thin orchestrator: one `init bridge` call, runs `bridge check` first (fresh→stop, stale→name changed paths+regen), assembles 4-section BRIDGE.md (exposes API/auth/glossary; decisions-already-made; what consumer decides), consumes `bridge hash` output for `combined_hash`/`sources_hashed` frontmatter (never computes crypto itself), writes `.sovereign/BRIDGE.md` + `registry.json` (the exact schema bridge check reads: keyed by id, {combined_hash, sources_hashed}), delegates state/commit. disable-model-invocation. 83 lines; validate PASS; doctor 14 skills, 5 auto / 9 disabled (budget held). 130 tests.
