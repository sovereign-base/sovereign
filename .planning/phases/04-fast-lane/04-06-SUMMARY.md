---
phase: 04-fast-lane
plan: 06
subsystem: skills
tags: [sentinel, native-review, unverified-scan, fast-lane, hand-authored]
requirements: [SKL-04, SKL-06]
key-files: { created: [engine/skills/sentinel/SKILL.md] }
---
# Plan 04-06 Summary — sentinel (SKL-04)
Thin orchestrator: one `init sentinel` call, agents_installed hard-error guard, dispatches sovereign-sentinel, four native checks (SOVEREIGN:UNVERIFIED scan per unverified-marker.md, commenting standard, spec alignment, ADR consistency) → structured verdict PASS/CONDITIONAL PASS/BLOCKED. Native tier only. SKL-06 shape. validate skills PASS.
