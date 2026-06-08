# Phase 4: Fast Lane Skills - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** `/SOVEREIGN.md` §6, ROADMAP Phase 4, `archive/v1/skills/fast-lane/*` (locked content to mine), `archive/v1/COMMENTING.md`, Matt Pocock `tdd`/`grill-with-docs` (project chat history), `.planning/research/FEATURES.md` (build order). Builds on the verified Phase 1 engine + Phase 2 subagents/installer + Phase 3 Council.

<domain>
## Phase Boundary

Phase 4 authors the **Fast Lane 5** — the daily-use skills `npx sovereign init --quick` ships — each a **thin orchestrator over the engine**, plus the `SOVEREIGN:UNVERIFIED` marker spec that `sentinel` consumes. Build order (from research): **ubiquitous-language → grill-with-docs → handoff → sentinel → tdd** (ubiquitous-language first because its CONTEXT.md feeds grill-with-docs + Council; the marker spec precedes sentinel).

**In scope:** `engine/skills/{ubiquitous-language,grill-with-docs,handoff,sentinel,tdd}/SKILL.md` (+ supporting reference files as needed); the `SOVEREIGN:UNVERIFIED` marker spec (CONV-03) as `engine/references/unverified-marker.md`.

**Out of scope:** Phase 5 conventions/per-skill docs; `anchor-docs`/`verify-self` (the marker-*generating* skills — M2); CodeRabbit Tier-2 sentinel (sentinel ships native-tier only).

## This is hand-authored content (R-004)
The orchestrator hand-authors these skills (not executors). Mine `archive/v1/` heavily for voice/content; rebuild on the engine. Planning + verification still go through GSD.
</domain>

<decisions>
## Implementation Decisions

### Shared skill shape (SKL-06, applies to all five)
Each skill is a **thin orchestrator**: real Agent Skills frontmatter (`name`, `description`; NO v1 fields); orients with ONE `sovereign-tools init <skill-name>` call (+ `@file:` spill guard); ends with a recommendation-first **navigation footer**; includes a plain-language **"## Why this matters"** section. Bookkeeping (state save, commit) delegated to `sovereign-tools`. Bodies stay thin (progressive disclosure — heavy detail in referenced files, loaded on demand).

### Auto-invocation + listing budget (SKL-07 compliance)
The five Fast Lane skills are the **auto-triggerable core** — they do NOT set `disable-model-invocation` (unlike Council). Keep descriptions tight (lead with the trigger use-case) so all five stay within the listing budget. After the phase, `sovereign-tools doctor` must still report clean (≤7 auto-triggerable). That's 5 fast-lane (auto) + council (disabled) = 5 auto-triggerable. ✓

### The five skills
1. **ubiquitous-language (SKL-01)** — establishes/updates the `.sovereign/CONTEXT.md` glossary **one term at a time**, detecting conflicts with existing terms (call out "your glossary defines X as Y, but you mean Z"). Opinionated canonical term + `_Avoid_` synonyms. CONTEXT.md is a glossary ONLY (no implementation detail). Mine `archive/v1/skills/fast-lane/ubiquitous-language/SKILL.md` + the v1 CONTEXT-FORMAT. Build FIRST.
2. **grill-with-docs (SKL-02)** — interrogates a plan against `CONTEXT.md` + ADRs **one question at a time**, **recommendation-first** (give the recommended answer before waiting), explores the codebase to answer where possible, updates CONTEXT.md/ADRs **inline** as decisions crystallize. Offers ADRs sparingly (hard-to-reverse + surprising + real trade-off). Mine `archive/v1/skills/fast-lane/grill-with-docs/SKILL.md` + Matt Pocock's grill-with-docs.
3. **handoff (SKL-03)** — compresses the current session into a resumable handoff doc at `.sovereign/HANDOFF.md` (decisions made, current phase, next action, unresolved items) so another agent resumes with full context; updates STATE via the engine. Mine `archive/v1/skills/fast-lane/handoff/SKILL.md`.
4. **sentinel (SKL-04)** — native-tier post-work reviewer. Dispatches the `sovereign-sentinel` agent (Phase 2) and/or runs the checks inline: (a) **scan for `SOVEREIGN:UNVERIFIED` markers** (per the spec below), (b) commenting-standard compliance (per `archive/v1/COMMENTING.md`), (c) spec alignment (acceptance criteria vs implementation), (d) ADR consistency. Emits a **structured verdict** (PASS / CONDITIONAL PASS / BLOCKED) listing findings by severity. Native tier only (CodeRabbit Tier-2 deferred).
5. **tdd (SKL-05)** — red-green-refactor loop: write a failing test (RED) → minimal code to pass (GREEN) → refactor. Test observable behavior at the interface, not implementation; mock only at system boundaries. Mine Matt Pocock `tdd` + `~/.claude/get-shit-done/references/tdd.md`. Stack-agnostic (uses the project's own test runner; no runtime QA — that's an anti-feature).

### The `SOVEREIGN:UNVERIFIED` marker spec (CONV-03) → `engine/references/unverified-marker.md`
- **Token:** the literal string `SOVEREIGN:UNVERIFIED` inside a code comment (language-agnostic — any comment syntax; the token is the anchor).
- **Form:** `<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>` (reason required; ref/date optional).
- **Meaning:** marks code written under genuine uncertainty (unverified third-party API shape, assumed behavior, stale-knowledge risk) — set by a human or by the future `anchor-docs`/`verify-self` skills (M2).
- **Scan rule:** `sentinel` greps changed files (or the tree) for the token and reports each `file:line — reason`.
- **Gate threshold:** unresolved markers are **findings** in sentinel's report (surfaced, not yet blocking). Hard **blocking** at a deployment/pre-flight gate is deferred to M2 (`pre-flight`). Define + scan now; block later.

### Claude's Discretion
- Whether a skill needs a supporting reference file (e.g. ubiquitous-language's CONTEXT format) vs inlining — keep bodies thin.
- Exact sentinel finding/severity format and whether it dispatches `sovereign-sentinel` vs runs checks inline (either is acceptable; prefer dispatch for the heavier spec-alignment read).
- Navigation footer wording per skill.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `/SOVEREIGN.md` §6 (Fast Lane, Sentinel, anti-hallucination), §3 (load rule).
- `archive/v1/skills/fast-lane/ubiquitous-language/SKILL.md`, `.../grill-with-docs/SKILL.md`, `.../handoff/SKILL.md` — locked v1 content to mine (drop the non-standard frontmatter).
- `archive/v1/COMMENTING.md` — the commenting standard `sentinel` checks against (HexDoc-style: why/contract/danger, not what).
- `engine/bin/lib/init.cjs` — the `init <fast-lane skill>` default blob (manifest+context paths, config subset) each skill consumes.
- `engine/agents/sovereign-sentinel.md` — the reviewer agent `sentinel` dispatches.
- `engine/skills/council/SKILL.md` — the Phase-3 thin-orchestrator pattern to follow (frontmatter, init call, Why-this-matters, nav footer).
- `engine/references/listing-budget.md` — the disable-model-invocation convention (fast-lane skills are auto-triggerable, so they do NOT set it).
- `.planning/research/FEATURES.md` — Fast Lane build order + coupling (ubiquitous-language is the internal bottleneck; tdd is standalone).

**Reference implementation:** `~/.claude/get-shit-done/references/tdd.md` (red-green-refactor discipline); Matt Pocock `tdd`/`grill-with-docs` (in the project chat history) for voice.
</canonical_refs>

<specifics>
## Specific Ideas
- Skills live at `engine/skills/<name>/` (shipped via the package `files` allowlist; installer copies to `.claude/skills/`).
- Fast Lane = `--quick` install set; the installer's `FAST_LANE` const (Phase 2) lists exactly these five names — confirm the authored dir names match it.
- ubiquitous-language writes `.sovereign/CONTEXT.md`; grill-with-docs updates CONTEXT.md + `.sovereign/docs/adr/`; handoff writes `.sovereign/HANDOFF.md`; sentinel writes a report (to stdout + optionally `.sovereign/`); tdd writes no SOVEREIGN state (drives the project's own tests).
- Recommendation-first + navigation footer + "Why this matters" are required on all five (SKL-06) and will be formalized as conventions in Phase 5.
</specifics>

<deferred>
## Deferred Ideas
- `anchor-docs` / `verify-self` (the UNVERIFIED-*generating* skills) — M2.
- Sentinel CodeRabbit Tier-2 enhancement — M2+.
- Pre-flight gate that BLOCKS on unresolved UNVERIFIED markers — M2.
- Per-skill documentation pages — Phase 5.
</deferred>

---

*Phase: 04-fast-lane*
*Context gathered: 2026-06-08 — synthesized from gated vision + locked v1 content + Phase 1/2/3 outcomes*
