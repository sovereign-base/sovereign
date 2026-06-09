# Contributing to SOVEREIGN

Thank you for contributing. SOVEREIGN is only as good as the skills
inside it — and skills are only as good as the engineers who write them.

---

## Two Ways to Contribute

### 1. Core Skills

Skills that ship with SOVEREIGN and run in the main phases.

These go through **strict review**. Every PR is reviewed by maintainers
before merge. Core skills must meet the full documentation standard,
pass the skill format spec, and include a real example session.

### 2. Extensions

Skills that engineers import via `/import-skill` or `npx sovereign import`.

These go through the **open registry**. You publish, the community rates
and flags. Engineers who import your skill get an automatic vetting report
before it installs.

---

## Writing a Core Skill

Every core skill is a folder containing a single `SKILL.md` file.

```
skills/phase-N/your-skill-name/
└── SKILL.md
```

### Required SKILL.md Structure

```markdown
---
name: your-skill-name
phase: N
description: [15 words max — loaded every session, keep it tight]
triggers: ["exact phrase 1", "exact phrase 2"]
works-best-with: claude
compatible-with: [codex, cursor, gemini-cli, copilot, opencode]
min-model: sonnet-class
tokens: minimal | low | medium | high
---

## Why This Matters

[One paragraph. Plain language. Written for an engineer on their first
serious project. Explains what goes wrong when you skip this step.
Profile B and C engineers will skip this section — that's fine.]

## When to Use This Skill

- Use this when: ...
- Don't use this for: ...

## Quick Reference

[The 20% of content used 80% of the time. Loaded first.
Short. Scannable. Actionable.]

## Full Protocol

[Complete step-by-step. What the agent asks. What the agent produces.
One question at a time. Agent gives recommendation before waiting
for user input.]

## Output

[What files get written. Where they go. What format.]

## Navigation

Before this: [skill-name], [skill-name]
After this: [skill-name], [skill-name]
Run: /next-skill-name

## Example Session

[Real dialogue. Shows agent questions + recommendations + user responses.
Not idealised. Show a user who pushes back on a recommendation.]

## Token Cost

Conservative mode: ~N tokens
Balanced mode: ~N tokens  
Rich mode: ~N tokens

## References

[External docs, ADRs, related skills — loaded only on demand]
```

### The Golden Rules for Skills

**One question at a time.** The agent asks one question, gives its
recommendation, waits. Never fires five questions in a paragraph.

**Recommendation before input.** At every decision point, the agent
states what it would choose and why before asking for your decision.

**Write for Profile A.** The `## Why This Matters` section must be
understandable by an engineer building their first real product.
If it uses jargon, rewrite it.

**No verbosity.** Skills must be concise. If a skill feels long,
it probably needs to be split into two skills.

**Context-aware.** Every skill must read `MANIFEST.md` before running.
Every skill must update `MANIFEST.md` after completing.

**Navigation footer.** Every skill must output a navigation footer when
it completes — what was done, what comes next, what alternatives exist.

---

## Writing an Extension

Extensions follow the same `SKILL.md` format with one additional
header field:

```markdown
---
extension: true
author: your-github-username
track: frontend | backend | mobile | iot | data-platform | ai-ml | devops | any
conflicts-with: []
requires: []
---
```

Publish to the SOVEREIGN extension registry:

```bash
npx sovereign publish
```

Your skill will be available via:

```bash
npx sovereign import your-github-username/your-skill-name
```

---

## PR Checklist (Core Skills)

Before submitting a PR for a core skill:

- [ ] SKILL.md follows the required structure exactly
- [ ] `## Why This Matters` is written for a first-time engineer
- [ ] Example session shows real dialogue including pushback
- [ ] Navigation footer is defined
- [ ] Token cost is estimated for all three modes
- [ ] Skill reads MANIFEST.md before running
- [ ] Skill updates MANIFEST.md after completing
- [ ] No external dependencies unless documented in `requires:`
- [ ] Tested with Claude Code (primary) and at least one other agent
- [ ] Docs page written in `docs/skills/your-skill-name.md`

---

## Code of Conduct

SOVEREIGN is a professional engineering project. Contributions are
evaluated on technical merit. Be direct. Be kind. Disagree constructively.

---

## Questions

Open an issue. Label it `question`. We'll answer.

---

_sovereign-base/sovereign — MIT License_
