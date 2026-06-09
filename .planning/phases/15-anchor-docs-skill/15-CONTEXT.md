# Phase 15: `anchor-docs` skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Hand-authored from locked M4 scope (ROADMAP Phase 15 success criteria + REQUIREMENTS ANCHOR-01 + M4-CC + ADR-014 taxonomy). Established dogfooding loop — no interactive discuss-phase; the design space is locked by the success criteria + the now-shipped Phase 14 engine surface.

<domain>
## Phase Boundary

**Deliver the hand-authored `anchor-docs` SKILL.md** — a core-tier thin orchestrator that wraps the Phase 14 engine `anchor` command so a user can anchor implementation to *current* external documentation and see which anchors have gone stale. Plus the small supporting artifacts a skill phase needs (ADR-004; doctor/validate clean).

In scope:
1. **`engine/skills/anchor-docs/SKILL.md`** — the skill. Thin orchestrator, mirrors the shipped `bridge`/`import-skill` shape EXACTLY (real Agent-Skills frontmatter only; `disable-model-invocation: true`; `## Why this matters`; recommendation-first; navigation footer; orients with ONE `init anchor-docs` call; invokes the engine via the literal `.claude/sovereign-engine/sovereign-tools.cjs` path).
2. **`docs/adr/ADR-004-anchor-content-copyright.md`** — record the URL-by-default / content-opt-in / copyright-warning policy that ANCHOR-01 references (currently a dangling reference). Short, in the existing ADR format. The skill cites it.
3. **Verification gates pass:** `sovereign-tools doctor` still reports the auto-trigger budget at the **5 Fast Lane skills** (anchor-docs is user-invoked, so it must NOT increase the auto count); `sovereign-tools validate skills` passes for anchor-docs.

Explicitly OUT of scope (deferred):
- `verify-self` skill — Phase 16.
- Any engine change — the `anchor` command shipped in Phase 14; this phase only WRAPS it. If a genuine engine gap is found, flag it, don't silently patch here.
- Auto-fetching URL content — the agent fetches with its own tools; the skill hands user-supplied/agent-fetched content to `anchor add --content` only on opt-in.
- The full stale→verify→sentinel loop end-to-end (ANCHOR-02 is formally verified in Phase 16, where `verify-self` composes with `anchor-docs`). anchor-docs DOES expose `anchor check` staleness surfacing here; ANCHOR-02's end-to-end exercise lands in 16.
</domain>

<decisions>
## Implementation Decisions

### Locked by success criteria (NON-NEGOTIABLE)
- **Delegates, never reimplements.** Ingest = call the engine `anchor add` (Phase 14). The skill owns judgment (which docs to anchor, the re-verify cadence recommendation, the copyright-warning UX); the engine owns storage/staleness math. Mirror how `bridge` delegates to `bridge.cjs`.
- **URL-by-default, content opt-in behind a copyright warning (ADR-004).** Default path stores only the URL + metadata. Storing full content (`anchor add --content @file|-`) happens ONLY after the skill surfaces the copyright/licensing warning and the user opts in. The warning is the *skill's* job (judgment); the engine just stores what it's handed (confirmed Phase 14).
- **One-call orient.** The skill's first action is a single `node ".claude/sovereign-engine/sovereign-tools.cjs" init anchor-docs` (with the `@file:` spill guard), then it reads only what that blob points to. No ten-file orientation.
- **Core-tier thin-orchestrator shape (M4-CC):** real frontmatter only (`name`, `description`, `disable-model-invocation: true`, optional `argument-hint`); `## Why this matters`; `## When to use this` (+ a "Don't use it for…"); `## The flow` (numbered, recommendation-first); a navigation footer. `wc -l` ≥ 70. No v1 frontmatter fields.
- **`disable-model-invocation: true`** so `doctor` keeps the auto-trigger budget at the 5 Fast Lane skills; `validate skills` passes.

### Claude's Discretion (judgment choices — confirm/refine in research)
- **Metadata the skill gathers per anchor before calling `anchor add`:** `--id` (a sane slug from the source), `--source` (URL, required), `--version` (the doc's version/date label if discernible, else omit → engine default), `--re-verify-by` (recommend a cadence by doc-type — e.g. fast-moving payment/SDK APIs shorter; stable gov specs longer — but let the engine default to +90d when the user has no preference).
- **The flow order** (mirror `bridge`): orient → (optional) `anchor check` to show current staleness first → gather the doc(s) to anchor → recommend URL-vs-content + surface the copyright warning on the content path → `anchor add` → confirm + show `anchor list`/stale summary → navigation footer pointing at next steps (e.g. proceed to build, or `verify-self` when uncertain).
- **`anchor check` surfacing:** the skill should, on invocation, surface any already-stale anchors (past `re-verify-by`) so the user re-checks before relying on them — the "know which anchors have gone stale" half of the phase goal.
- **ADR-004 content:** decision = "External-doc anchors store the URL + metadata by default; full content is stored only on explicit opt-in, and only after a copyright/licensing warning, because pasting third-party docs wholesale into a committed repo can infringe. The engine is content-agnostic (stores what it's given); the warning lives at the skill layer." Status Accepted; consequences + the URL-default rationale.
- **`description` frontmatter:** lead with the use case (what + when), ≤ the listing cap, neutral name (no tool/model names), so it reads well in the `/` menu and stays within the listing budget.

### Navigation / composition
- Footer should point forward to `verify-self` (Phase 16) as the natural companion ("unsure about an API detail? `verify-self`") and note that `sentinel` scans the markers verify-self emits — but anchor-docs itself does NOT emit `SOVEREIGN:UNVERIFIED` markers (that's verify-self).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or authoring.**

### The pattern to mirror (read these — the shape is already shipped)
- `engine/skills/bridge/SKILL.md` — the closest analog: a thin orchestrator that wraps an engine command (`bridge.cjs`), with the exact section shape, `disable-model-invocation: true`, one-call orient, and the literal `.claude/sovereign-engine/sovereign-tools.cjs` invocation. Diff anchor-docs against this.
- `engine/skills/import-skill/SKILL.md` — second example of a gated, user-invoked core skill that wraps engine/subprocess work with a vetting/warning step (parallel to the copyright warning).
- `engine/references/skill-format.md` — the authoring contract (sections, frontmatter rules, line gate, recommendation-first, navigation footer). Author to this.
- `engine/references/listing-budget.md` + ADR-014 — why `disable-model-invocation: true` is mandatory (auto-trigger budget held at 5).

### The engine surface this skill wraps (shipped Phase 14)
- `engine/bin/lib/anchor.cjs` — `anchor add|list|check` (the exact flags/headers/JSON shapes the skill drives): `--id`, `--source`, `--version`, `--re-verify-by`, `--content @file|-`; `add` writes `<slug>.md`; `list`→array; `check`→`{anchors, stale_count}`.
- `engine/bin/lib/init.cjs` `case 'anchor-docs':` — the orient blob the skill parses (paths.external_docs_dir, config, exists flags).
- `engine/bin/sovereign-tools.cjs` `case 'anchor':` — the CLI entry.

### Spec / requirement sources
- `.planning/ROADMAP.md` → Phase 15 Success Criteria (the 3 TRUE-conditions — the verification target).
- `.planning/REQUIREMENTS.md` → **ANCHOR-01** + **M4-CC** (this phase's requirements) + the M4 non-goals (no fetch client; surfaces-only).
- `docs/adr/ADR-014-core-track-extension-taxonomy.md` + the existing `docs/adr/ADR-0XX-*.md` files (format to mirror for the new ADR-004).
- `CLAUDE.md` → skill frontmatter spec (no `anthropic`/`claude` in name; description ≤ caps), model-agnostic skill-body guidance (the non-Claude path = "read SKILL.md, run init, follow steps").

### Verification tooling (the phase gates)
- `sovereign-tools doctor` — must still show 5 auto-triggerable skills.
- `sovereign-tools validate skills` — must pass for anchor-docs.
</canonical_refs>

<specifics>
## Specific Ideas

- Treat `bridge` as the literal template: same sections, same one-call-orient, same literal engine path, same `disable-model-invocation: true` — different domain (anchoring external docs vs cross-project handoff). A reviewer should see the same skeleton.
- The copyright warning is the one piece of judgment unique to this skill — make it concrete (warn that committing third-party doc content may infringe; URL-by-default is the safe path; content opt-in is the user's deliberate choice).
- Keep the body model-agnostic: the steps are "run `init anchor-docs`, then the engine commands" — works for any SKILL.md agent, best on Claude.
</specifics>

<deferred>
## Deferred Ideas

- `verify-self` skill (Phase 16) — composes with anchor-docs (choice A = hand off to anchor-docs); emits `SOVEREIGN:UNVERIFIED` markers.
- Pre-flight deploy-gate BLOCKING on stale anchors (post-M4; M4 surfaces only).
- Auto-fetch/refresh of anchor content from URLs (never in-engine; agent's job).
</deferred>

---

*Phase: 15-anchor-docs-skill*
*Context gathered: 2026-06-09 (hand-authored from locked M4 scope)*
