# Phase 13: sovereign-adopt Skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 13, M3-NOTES §3, the Phase-10 `adopt.cjs` scan contract (verified live), the M3 thin-orchestrator pattern. The M3 capstone — closes the milestone + the M3-CC cross-cutting check.

<domain>
## Phase Boundary

Phase 13 ships **`sovereign-adopt`** — retrofit SOVEREIGN onto an existing codebase via 3-layer archaeology, then scaffold `.sovereign/`, record retroactive ADRs, and produce a risk-prioritized gap analysis + adoption roadmap. Reads and records only; never refactors source. Thin orchestrator driving the Phase-10 `adopt scan` + the Phase-6 `adr-log`.

**In scope:** `engine/skills/sovereign-adopt/SKILL.md`.

**Out of scope:** engine changes (Phase 10 shipped `adopt.cjs`); Type-3 legacy (years-old/undocumented) — deferred; any modification of the user's source.
</domain>

<decisions>
## Implementation Decisions

### Shape (M3-CC)
`disable-model-invocation: true`; one `sovereign-tools init adopt` orient call (+ `@file:` guard); `## Why this matters`; recommendation-first; navigation footer; `--full` install (NOT FAST_LANE); passes `validate skills`; doctor stays at 5 auto (this is the 3rd M3 skill — confirm 5 auto / 11 disabled after). ≥70 lines (`wc -l`). Mirror `bridge`/`api-design`.

### `sovereign-adopt` flow (ADOPT-01 + ADOPT-02) — 3-layer archaeology
1. **Orient.** `init adopt` → project_root, `detected.in_git`, extensions/sovereign paths. Zero other orientation reads.
2. **Layers 1+2 (engine, mechanical, near-zero→low tokens).** Run `sovereign-tools adopt scan` → the JSON contract: `manifests`, `detected` (languages/package_managers/has_dockerfile/has_ci/has_tests/monorepo), `structure` (top_level_dirs/file_count/tree/truncated), `deep_read_candidates`. The skill consumes this — it does NOT re-walk the tree itself.
3. **Layer 3 (skill judgment, targeted).** Read **only** a handful of files from the scan's `deep_read_candidates` (entrypoint/router, auth middleware, base model, primary config) — the highest-signal files for reverse-engineering decisions. Bounded (the scan caps candidates ≤10); don't read the whole codebase.
4. **Scaffold `.sovereign/`.** If absent, scaffold it (the engine templates) so the project has the state dir. Seed `CONTEXT.md` glossary stubs + `MANIFEST` from what was learned.
5. **Retroactive ADRs via `adr-log`.** For each consequential decision already baked into the code (the stack choice, the auth model, the data-layer pattern, a notable deviation), **offer `/adr-log`** to record it retroactively — do NOT re-implement ADR numbering/writing (compose, as the M2 skills do).
6. **Gap analysis + adoption roadmap.** Produce a risk-prioritized list: what SOVEREIGN coverage is missing (no security model? no API spec? no tests?), ordered by risk, with the recommended next skills to run (e.g. `/security-design`, `/entity-design`). Write it to `.sovereign/docs/ADOPTION.md`.
7. **Persist.** `state save` + `commit`. Navigation footer (point at the top-priority gap's skill).

### Read-only + scope guards (ADOPT-03 intent, baked in)
- **Never modify the user's source** — the skill reads + records into `.sovereign/` only. State this explicitly in the body.
- **Scope: greenfield-with-code + Type-2 mid-flight.** If the codebase looks Type-3 (large, legacy, undocumented — heuristic: very large file_count + no tests + no manifests), say so and recommend a narrower manual approach rather than over-promising.

### Claude's Discretion
- Exact `ADOPTION.md` layout (gap table + roadmap is the intent).
- How many Layer-3 files to actually read (a few, not all candidates if the project is large).
- Navigation footer wording.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `engine/bin/lib/adopt.cjs` — the `adopt scan` JSON contract the skill consumes (manifests/detected/structure/deep_read_candidates).
- `.planning/research/M3-NOTES.md` §3 — the 3-layer scan rationale + the engine-vs-skill split (engine does 1+2, skill does Layer 3 + judgment).
- `engine/bin/lib/init.cjs` — the `init adopt` orient blob (project_root, in_git).
- `engine/skills/adr-log/SKILL.md` — the skill `sovereign-adopt` offers decisions to (compose, don't re-implement).
- `engine/skills/bridge/SKILL.md` + `engine/skills/api-design/SKILL.md` — the sibling thin-orchestrator pattern to mirror.
- `engine/references/skill-format.md`.
- `archive/v1/SOVEREIGN_PROJECT.md` — the `sovereign-adopt` / 3-layer-archaeology / Type-1/2/3 design (~lines 272-290) to mine.
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dir: `engine/skills/sovereign-adopt/` (NOT FAST_LANE; `--full`).
- Writes `.sovereign/` scaffold + `.sovereign/docs/ADOPTION.md`; retro-ADRs via `adr-log` → `.sovereign/docs/adr/`.
- **M3-CC closes here:** after this phase, `doctor` on a `--full` install must show **5 auto-triggerable + 11 disabled** (council + 7 arch + bridge + import-skill + sovereign-adopt), no warnings — the budget held across all of M3.
- This is the last M3 phase → after it, M3 (v1.2) is complete; `/gsd:complete-milestone` candidate.
</specifics>

<deferred>
## Deferred Ideas
- Type-3 legacy adoption (years-old, undocumented) — later.
- Auto-running the recommended gap-closing skills (the roadmap recommends; it doesn't auto-execute).
- A `sovereign-adopt --bridge` path (adopt from a BRIDGE.md) — later.
</deferred>

---

*Phase: 13-sovereign-adopt*
*Context gathered: 2026-06-09 — the M3 capstone, thin orchestrator over adopt scan + adr-log*
