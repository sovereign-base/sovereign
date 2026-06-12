# SOVEREIGN MANIFEST

<!--
  DERIVED — regenerated on every state save, do not hand-edit (ADR-012).
  Sole writer: sovereign-tools (manifest.cjs). Loaded FIRST by every skill.
  Token budget: ~500 tokens, enforced in code (chars/4 heuristic).
  To change anything here, edit the authoritative source (STATE.md, docs/adr/).
-->

**Sovereign Version:** 2.0.0
**Last Updated:** 2026-06-11T22:18:49.876Z

---

## Current Status

**Phase:** 0
**Gate Status:** Not started

---

## Next Recommended Action

```
—
```

---

## Current Blockers

<!-- Mirrors STATE.md Blockers. -->

- None

---

## Key Decisions (Quick Reference)

<!-- Derived from docs/adr/. One line per decision. -->

| Decision | Choice | ADR |
| -------- | ------ | --- |
| ADR-002: The engine is a zero-dependency Node `.cjs` program — the source is the artifact | see ADR | ADR-002-zero-dep-cjs-engine.md |
| ADR-004: External-doc anchors store the URL by default; full content is opt-in behind a copyright warning | see ADR | ADR-004-anchor-content-copyright.md |
| ADR-009: CommonJS packaging — no `"type":"module"`, `engines.node >= 20`, shebang on bins | see ADR | ADR-009-cjs-packaging.md |
| ADR-010: Every command is authored as a skill directory, never a bare command file | see ADR | ADR-010-commands-as-skill-directories.md |
| ADR-011: Drop v1's non-standard SKILL.md frontmatter in favour of the Agent Skills spec | see ADR | ADR-011-drop-v1-frontmatter.md |
| ADR-012: MANIFEST.md is an engine-derived view, regenerated on every `state save` | see ADR | ADR-012-manifest-engine-derived.md |
| ADR-013: Reasoning subagents return validated JSON, never prose | see ADR | ADR-013-subagent-return-json-schema.md |
| ADR-014: Core / Track / Extension skill taxonomy | see ADR | ADR-014-core-track-extension-taxonomy.md |

---

<!-- sovereign-base/sovereign v2.0.0 -->
