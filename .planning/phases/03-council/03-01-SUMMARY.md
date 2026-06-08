---
phase: 03-council
plan: 01
subsystem: skills
tags: [council, lenses, content, progressive-disclosure, return-contracts, hand-authored]
requirements: [CNL-01]
key-files:
  created:
    - engine/skills/council/lenses.md
---

# Plan 03-01 Summary — Council lenses + return contracts

**Outcome:** `engine/skills/council/lenses.md` authored (hand-authored per R-004) — the runtime-loaded content file holding the five locked advisor lenses (verbatim) and the three subagent JSON return contracts. CNL-01 content basis in place.

## What shipped
- The 5 locked lenses, verbatim, each as its own section: 🔴 Skeptic, 🔵 Architect, 🟡 Builder, ⚪ Outsider, 🟣 Risk Officer.
- "Natural tensions" note (Skeptic vs Builder; Architect vs Builder; Outsider vs everyone) — advisors must NOT converge.
- "Subagent return contracts" — three `json` blocks (advisor / peer-reviewer / chairman) whose field names mirror the Phase-2 agent shells **exactly** (no invented fields). Verdict enum note: engine form `CONDITIONAL_PASS`, rendered "CONDITIONAL PASS".
- Progressive disclosure: lives outside `SKILL.md` frontmatter, loaded only when Council runs.

## Verification
grep gate green: all 5 advisors named + "Natural tensions" + "Subagent return contracts" + `CONDITIONAL_PASS` + `cross_cutting_concerns` + `dissents_addressed`.
