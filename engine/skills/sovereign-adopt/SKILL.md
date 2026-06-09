---
name: sovereign-adopt
description: Retrofit SOVEREIGN onto an existing codebase — reverse-engineer the decisions already baked into the code via 3-layer archaeology, scaffold .sovereign/, record retroactive ADRs, and produce a risk-prioritized adoption roadmap. Reads and records only — never refactors your source. Use to bring SOVEREIGN to a project that already has code.
disable-model-invocation: true
argument-hint: "[path to the existing project]"
---

## Why this matters

Most projects don't start with SOVEREIGN — they have code first and reach for structure later. By then the important decisions (the stack, the auth model, the data shape) are already made, but they're undocumented: they live in the code and in people's heads, not in any ADR. Adopting a system like SOVEREIGN onto that usually means a daunting "go document everything" that never happens.

`sovereign-adopt` makes adoption a single, bounded pass. It reads the codebase the cheap way — config first, structure next, a few high-signal files last — reverse-engineers the decisions already there into retroactive ADRs, scaffolds the `.sovereign/` memory, and hands you a risk-ordered roadmap of what's missing. You go from "no structure" to "structure that reflects reality" without rewriting a line.

## When to use this

On an existing project you want to bring under SOVEREIGN — greenfield-with-code or a **Type-2 mid-flight** codebase (actively developed, partially structured). Run it once at adoption; re-run when the architecture shifts materially.

**Don't** use it on a **Type-3** legacy codebase (years old, undocumented, huge) — it will over-promise; recommend a narrower manual approach instead. And it is **not** a refactor tool — it never changes your source.

## The flow — 3-layer archaeology

A **thin orchestrator**: the engine does the mechanical scan (Layers 1+2); this skill does the judgment (Layer 3 + the ADRs + the roadmap). It **reads and records only — it never modifies the user's source code.**

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init adopt)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse project_root, `detected.in_git`, and the `.sovereign/` paths.

**2 — Layers 1+2 (engine, near-zero→low tokens).**
```bash
node "$ENGINE/bin/sovereign-tools.cjs" adopt scan
```
Consume the JSON contract — `manifests`, `detected` (languages/package_managers/dockerfile/ci/tests/monorepo), `structure` (top_level_dirs/file_count/tree/truncated), and `deep_read_candidates`. **Do not re-walk the tree yourself** — the engine already did it gitignore-aware.

**3 — Layer 3 (targeted deep reads).** Read **only a handful** of files from the scan's `deep_read_candidates` (entrypoint/router, auth middleware, base model, primary config) — the highest-signal files for reverse-engineering decisions. If the project is large, read the top few, not all of them. **Type-3 guard:** if the scan looks legacy (very large `file_count`, no tests, no manifests), say so and recommend a narrower manual adoption rather than scanning everything.

**4 — Scaffold `.sovereign/`.** If absent, scaffold it from the engine templates, seeding `CONTEXT.md` glossary stubs and the MANIFEST from what Layers 1-3 revealed.

**5 — Retroactive ADRs (via `adr-log`).** For each consequential decision already baked into the code (the stack/framework, the auth model, the data-layer pattern, a notable deviation), **offer `/adr-log`** to record it retroactively. Do **not** re-implement ADR numbering/writing — compose with `adr-log`.

**6 — Gap analysis + adoption roadmap.** Write `.sovereign/docs/ADOPTION.md`: what SOVEREIGN coverage is missing (no security model? no API spec? no tests?), **ordered by risk**, each with the recommended skill to close it (`/security-design`, `/entity-design`, …).

**7 — Persist.** `state save` + `commit` via `sovereign-tools`. Navigation footer pointing at the top-priority gap.

## ADOPTION.md format

```markdown
# Adoption Report — <project>
Type: greenfield-with-code | mid-flight (Type-2)
Detected: <languages> · <package managers> · tests:<y/n> · ci:<y/n>

## Decisions reverse-engineered (→ retroactive ADRs)
- Stack: <e.g. Node/Express + Postgres> → logged ADR-0001
- Auth: <e.g. session cookies> → logged ADR-0002

## Gaps (risk-ordered)
| Risk | Gap | Close with |
|------|-----|-----------|
| HIGH | No security model | /security-design |
| MED  | No API contract | /api-design |
| LOW  | Sparse domain glossary | /ubiquitous-language |
```

## Navigation

```
▶ NEXT
  Adoption recorded → .sovereign/ scaffolded + .sovereign/docs/ADOPTION.md
  Start with the HIGHEST-risk gap (e.g. /security-design), then work down the roadmap.
  /adr-log — record any decision the archaeology surfaced that isn't logged yet.
```
