---
phase: 04-fast-lane
plan: 04
subsystem: skills
tags: [handoff, session-continuity, fast-lane, hand-authored]
requirements: [SKL-03, SKL-06]
key-files: { created: [engine/skills/handoff/SKILL.md] }
---
# Plan 04-04 Summary — handoff (SKL-03)
Thin orchestrator: one `init handoff` call, compresses the session into a resumable `.sovereign/HANDOFF.md` (decisions/state/next-action/open-questions/watch-outs) with a format block + resume protocol, state save delegated. SKL-06 shape. validate skills PASS.
