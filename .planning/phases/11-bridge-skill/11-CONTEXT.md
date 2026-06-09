# Phase 11: Bridge Skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 11, `.planning/research/M3-NOTES.md` §2, the Phase-10 `bridge.cjs` engine surface, the M2/M3 thin-orchestrator pattern. HAND-AUTHORED skill (like the M2 skills) — the engine does the hashing; the skill owns the BRIDGE.md prose.

<domain>
## Phase Boundary

Phase 11 builds the **`bridge`** skill — a thin orchestrator that assembles a `BRIDGE.md` (what a *consuming* project needs to start informed) from the source project's existing `.sovereign/` artifacts, and detects staleness via the Phase-10 hash registry. Wraps `sovereign-tools bridge hash`/`bridge check`; delegates ALL hashing/registry I/O to the engine.

**In scope:** `engine/skills/bridge/SKILL.md`.

**Out of scope:** engine changes (Phase 10 shipped `bridge.cjs`); the consuming-side import flow (that's `sovereign-init --bridge`, later); deploy-gate blocking + GitHub-issue notification (deferred to M4 — but BRIDGE.md frontmatter already carries the fields that make them possible later); extension/adopt skills (Phases 12-13).
</domain>

<decisions>
## Implementation Decisions

### Shape (M3-CC, same as the M2/Council skills)
`disable-model-invocation: true` (user-invoked, phase-gated → off the auto-trigger budget, held at 5 Fast Lane); one `sovereign-tools init bridge` call (+ `@file:` guard); `## Why this matters`; recommendation-first; navigation footer; state/commit delegated to `sovereign-tools`; `--full` install (NOT FAST_LANE); passes `validate skills`; doctor stays at 5 auto. ≥70 lines. Mirror `api-design`/`stack-select`.

### `bridge` flow (BRIDGE-01 + BRIDGE-02)
1. `init bridge` → the blob lists the bridgeable source docs that exist (API_SPEC.md, SECURITY_MODEL.md, CONTEXT.md, relevant ADRs — at their real `.sovereign/docs/...` paths), the registry path (`.sovereign/bridges/registry.json`), and git info. The skill orients from this one call.
2. **Staleness check first.** Run `sovereign-tools bridge check [--id <name>]`. If a prior bridge exists and is **fresh** (combined hash matches), tell the user it's up to date and stop (no needless regen). If **stale**, name the changed source paths and continue to regenerate.
3. **Assemble BRIDGE.md prose** (the skill's judgment) from the source docs the `init` blob listed:
   - **What this project exposes** — API contracts (from API_SPEC.md), auth/security summary (from SECURITY_MODEL.md), shared domain glossary (from CONTEXT.md).
   - **Decisions already made (don't re-make these)** — the relevant ADRs.
   - **What the consuming project still needs to decide** — gaps the source doesn't cover.
4. **Hash + frontmatter.** Run `sovereign-tools bridge hash --files <the source docs>` to get per-file + combined hashes. Write `BRIDGE.md` (default `.sovereign/BRIDGE.md`) with the M3-NOTES §2 frontmatter: `bridge_version`, `source_repo`, `source_commit`, `generated`, `combined_hash`, `sources_hashed[]`. The skill does NOT compute crypto itself — it consumes the engine's hash output.
5. **Persist.** Update the registry via the engine, `state save`, `commit`. Navigation footer.

### Compose, don't reimplement
The skill **must not** reimplement SHA-256 or registry diffing — those are `bridge.cjs` (Phase 10). The skill owns only: which docs to include, the BRIDGE.md prose, and the staleness UX (fresh → stop; stale → name changes + regen).

### Claude's Discretion
- Exact BRIDGE.md body layout (the four sections above are the intent).
- Whether to support a `--id`/target name for multiple bridges (the engine + registry already key by id).
- Navigation footer wording (point toward the consuming project importing it).
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `engine/bin/lib/bridge.cjs` — the exact `bridge hash`/`bridge check` surface + return shapes the skill wraps.
- `.planning/research/M3-NOTES.md` §2 — the BRIDGE.md frontmatter + registry shape (verbatim) + the v1 design notes (deferred GitHub/pre-flight).
- `engine/bin/lib/init.cjs` — the `init bridge` case (what the orient blob provides: bridgeable doc paths, registry path, git info).
- `engine/references/skill-format.md` — the thin-orchestrator standard.
- `engine/skills/api-design/SKILL.md` + `engine/skills/stack-select/SKILL.md` — sibling pattern to mirror (init orient, recommendation-first, writes a doc + a `## <ARTIFACT> format` block, disable-model-invocation, delegates to engine).
- `engine/skills/council/SKILL.md` — the orchestrator-only-write + side-effects pattern.
- `archive/v1/SOVEREIGN_PROJECT.md` (bridge design: lines ~184, 232-244, 482) — content to mine.
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dir: `engine/skills/bridge/` (NOT FAST_LANE; `--full`).
- Writes `.sovereign/BRIDGE.md`; registry at `.sovereign/bridges/registry.json` (engine-owned).
- After this phase, `doctor` on a `--full` install: 5 auto-triggerable, council + 7 architecture + bridge = 9 disabled.
</specifics>

<deferred>
## Deferred Ideas
- Consuming-side `sovereign-init --bridge <BRIDGE.md>` import flow — later.
- Deploy-gate blocking + GitHub-issue auto-notification on stale bridges — M4 (frontmatter already supports it).
- Extension protocol skill (Phase 12), sovereign-adopt skill (Phase 13).
</deferred>

---

*Phase: 11-bridge-skill*
*Context gathered: 2026-06-09 — thin orchestrator over the Phase-10 bridge engine, per M3-NOTES §2*
