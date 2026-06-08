# Phase 5: Conventions + Per-Skill Docs - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** `/SOVEREIGN.md` §6/§7, ROADMAP Phase 5, the 6 skills built in Phases 3-4 (the source of truth to distill FROM), `archive/v1/COMMENTING.md` (mine), Matt Pocock ADR format (project chat history). The LAST M1 phase.

<domain>
## Phase Boundary

Phase 5 writes the authoring standards and documentation that **codify what Phases 1-4 already demonstrated** — so future-milestone skills and external contributors have a concrete spec to follow, distilled from practice rather than theorized before it. After this phase, M1 (Foundation) is complete.

**In scope:** `engine/references/skill-format.md` (CONV-01); `engine/references/adr-format.md` + `engine/references/commenting.md` (CONV-02); one documentation page per M1 skill + an index (CONV-04).

**Out of scope:** new skills/engine features; a docs *site* generator (just the markdown pages); Phase 6+ content.

## This is hand-authored content (R-004)
The orchestrator hand-authors these. Distill the SKILL_FORMAT from the 6 real skills (`engine/skills/*/SKILL.md` + `engine/agents/*.md`); mine `archive/v1/COMMENTING.md` for the commenting standard (retarget v1 refs to v2 — `/code-patterns`→`sentinel`). Planning + verification via GSD.
</domain>

<decisions>
## Implementation Decisions

### CONV-01 — `engine/references/skill-format.md` (the authoring standard)
Distilled from the 6 shipped skills. Must specify:
- **Frontmatter:** real Agent Skills fields only — `name` (≤64, lowercase-hyphen, no "claude"/"anthropic"), `description` (lead with the trigger use-case, within cap), optional `disable-model-invocation` (for user-only/side-effecting skills like council), `argument-hint`. **Explicitly drop v1 fields** (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`) — say why (non-standard; not in the spec).
- **The thin-body / single-`init`-load rule:** a skill orients with ONE `sovereign-tools init <skill>` call (+ `@file:` spill guard) and reads nothing else to orient; heavy detail goes in referenced files (progressive disclosure).
- **Required body sections:** `## Why this matters` (plain language, Profile-A), `## When to use this` (+ anti-uses), the flow (numbered, delegating state/commit to `sovereign-tools`), and a **navigation footer** (recommendation-first).
- **The listing-budget rule:** auto-triggerable skills count against the budget; orchestrator-only skills set `disable-model-invocation` (cross-ref `listing-budget.md`). Verified by `validate skills` + `doctor`.

### CONV-02 — ADR-FORMAT + COMMENTING references
- `engine/references/adr-format.md`: ADRs live in `.sovereign/docs/adr/`, sequentially numbered (`0001-slug.md`), **1-3 sentences is enough** (what was decided + why); optional Status/Considered-Options/Consequences only when they add value. **Offer an ADR only when all three hold:** hard to reverse + surprising without context + the result of a real trade-off. (Mine Matt Pocock's ADR discipline.)
- `engine/references/commenting.md`: the HexDoc-style standard — comment the **Why / Contract / Danger**, never the *what*; the golden rule (if removing it changes nothing, delete it); what always/never gets a comment; module headers; `SOVEREIGN:UNVERIFIED` is always commented. **Mine `archive/v1/COMMENTING.md` heavily** but retarget references to v2 (it's consumed by `sentinel`'s commenting check, not v1's `/code-patterns`).

### CONV-04 — per-skill docs at `docs/skills/`
One page per M1 skill (the 6: `council`, `ubiquitous-language`, `grill-with-docs`, `handoff`, `sentinel`, `tdd`) + a `docs/skills/README.md` index. Repo-root `docs/` per §7 (documentation, NOT shipped in the package — it's the project's own docs surface). Each page: **What it does** / **When to use (and not)** / **How it works** (the flow in brief) / **Example** / **Outputs** (what `.sovereign/` files it touches) / **Navigation** (what comes before/after). Keep each tight (~30-60 lines). Lead each with the "Why this matters" hook.

### Claude's Discretion
- Whether commenting.md is a near-copy of v1 or a trimmed rewrite (keep it tight, retarget refs).
- Exact per-skill doc length and whether to include a token-cost note.
- docs index format.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- The 6 shipped skills — the source of truth for CONV-01: `engine/skills/{council,ubiquitous-language,grill-with-docs,handoff,sentinel,tdd}/SKILL.md` + `engine/agents/*.md`.
- `archive/v1/COMMENTING.md` — mine for `commenting.md` (retarget refs).
- `engine/references/listing-budget.md` + `engine/references/unverified-marker.md` — the existing reference tone/shape to match (incl. the `> Feeds CONV-XX` footer convention).
- `/SOVEREIGN.md` §6 (skills), §7 (repo layout — `docs/` at root, `references/` shipped), §9 (ADRs).
- `archive/v1/skills/fast-lane/grill-with-docs/SKILL.md` (ADR + CONTEXT format blocks it embedded) — for `adr-format.md`.

**Reference implementation:** `~/.claude/get-shit-done/references/*.md` (the reference-doc shape) and Matt Pocock's `write-a-skill` / ADR discipline (project chat history).
</canonical_refs>

<specifics>
## Specific Ideas
- References ship in the package (`files` allowlist already includes `references`); docs do NOT ship (repo documentation only).
- These references close the loop: `sentinel` checks against `commenting.md`; `grill-with-docs` offers ADRs per `adr-format.md`; contributors author new skills per `skill-format.md`.
- After this phase: M1 is 28/28 — a natural point to write the public `README.md` and stand up the repo.
</specifics>

<deferred>
## Deferred Ideas
- A generated docs *site* (static-site build) — later.
- Contributor guide / CONTRIBUTING rewrite — when the repo goes public.
</deferred>

---

*Phase: 05-conventions-docs*
*Context gathered: 2026-06-08 — the final M1 phase, distilled from Phases 1-4*
