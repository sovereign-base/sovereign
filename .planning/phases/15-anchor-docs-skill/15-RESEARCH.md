# Phase 15: `anchor-docs` skill - Research

**Researched:** 2026-06-09
**Domain:** Hand-authored thin-orchestrator SKILL.md (in-repo patterns; no web survey)
**Confidence:** HIGH (every pattern read directly from shipped repo artifacts; gates run live)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (NON-NEGOTIABLE)
- **Delegates, never reimplements.** Ingest = call engine `anchor add` (Phase 14). The skill owns judgment (which docs to anchor, re-verify cadence recommendation, copyright-warning UX); the engine owns storage/staleness math. Mirror how `bridge` delegates to `bridge.cjs`.
- **URL-by-default, content opt-in behind a copyright warning (ADR-004).** Default path stores only the URL + metadata. Storing full content (`anchor add --content @file|-`) happens ONLY after the skill surfaces the copyright/licensing warning and the user opts in. The warning is the *skill's* job; the engine just stores what it's handed.
- **One-call orient.** First action is a single `node ".claude/sovereign-engine/sovereign-tools.cjs" init anchor-docs` (with `@file:` spill guard), then read only what that blob points to. No ten-file orientation.
- **Core-tier thin-orchestrator shape (M4-CC):** real frontmatter only (`name`, `description`, `disable-model-invocation: true`, optional `argument-hint`); `## Why this matters`; `## When to use this` (+ a "Don't use it for…"); `## The flow` (numbered, recommendation-first); a navigation footer. `wc -l` ≥ 70. No v1 frontmatter fields.
- **`disable-model-invocation: true`** so `doctor` keeps the auto-trigger budget at the 5 Fast Lane skills; `validate skills` passes.

### Claude's Discretion (judgment choices — recommendations below in this doc)
- Metadata the skill gathers per anchor before `anchor add`: `--id` (slug from source), `--source` (URL, required), `--version` (doc version/date label if discernible, else omit → engine default `unknown`), `--re-verify-by` (recommend a cadence by doc-type; else engine default +90d).
- Flow order (mirror `bridge`): orient → optional `anchor check` to show current staleness first → gather doc(s) → recommend URL-vs-content + surface copyright warning on the content path → `anchor add` → confirm + show `anchor list`/stale summary → navigation footer.
- `anchor check` surfacing: on invocation, surface already-stale anchors (past `re-verify-by`).
- ADR-004 content (URL-default / content-opt-in / copyright warning; engine content-agnostic; Status Accepted).
- `description` frontmatter: lead with use case, within listing cap, neutral name.

### Deferred Ideas (OUT OF SCOPE)
- `verify-self` skill (Phase 16) — composes with anchor-docs; emits `SOVEREIGN:UNVERIFIED` markers.
- Pre-flight deploy-gate BLOCKING on stale anchors (post-M4; M4 surfaces only).
- Auto-fetch/refresh of anchor content from URLs (never in-engine; agent's job).
- Any engine change — `anchor` shipped in Phase 14; this phase only WRAPS it. If a genuine engine gap is found, flag it; don't silently patch here.
- ANCHOR-02 end-to-end loop (formally verified Phase 16). anchor-docs DOES expose `anchor check` staleness surfacing here.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANCHOR-01 | User can run `anchor-docs` to ingest external docs; stores URL by default, full content opt-in with copyright warning (ADR-004), under `.sovereign/external-docs/<slug>.md` with metadata headers `source`, `version`, `date-retrieved`, `re-verify-by`. | The engine `anchor add` (anchor.cjs) already writes exactly these headers + `content-stored`. The skill drives it; the copyright warning is authored skill-side. ADR-004 authored to repo ADR format. |
| M4-CC | Core-tier thin orchestrator per `skill-format.md`/ADR-014 — one `init <skill>` orient, "Why this matters", recommendation-first, navigation footer, user-invoked (`disable-model-invocation: true`), so `doctor` holds auto-trigger budget at 5; `validate skills` passes. | bridge/import-skill are the exact templates. Live gate confirmed: `doctor --cwd engine` reports `auto_count: 5` today; adding a `disable-model-invocation: true` skill keeps it at 5. `validate skills` passes on this frontmatter shape. |
</phase_requirements>

## Summary

This is a pure authoring phase: write **one** hand-authored `engine/skills/anchor-docs/SKILL.md` that mirrors the already-shipped `bridge` skill skeleton, plus a short **`docs/adr/ADR-004-anchor-content-copyright.md`** in the repo's ADR format, then pass two engine gates (`doctor`, `validate skills`). Zero engine changes; the Phase-14 `anchor add|list|check` substrate already does all storage and staleness math. The skill's only unique judgment is the **copyright warning** on the content-opt-in path.

The "how" is entirely in-repo and now pinned exactly: the section shape (`## Why this matters` → `## When to use this` → `## The flow` → optional format block → `## Navigation` footer), the literal one-call orient with the `@file:` spill guard, the literal engine path `.claude/sovereign-engine/sovereign-tools.cjs`, the exact `anchor` CLI flags, and the gate commands with known pass conditions.

**Primary recommendation:** Copy `engine/skills/bridge/SKILL.md` structurally; swap the domain (anchoring external docs ↔ cross-project handoff); orient via `init anchor-docs`; drive `anchor check` (surface stale) → `anchor add` (URL-by-default, content only behind the copyright warning) → `anchor list` (confirm); cite ADR-004 at the content decision point. Verify with `doctor --cwd engine` (expect `auto_count: 5`) and `validate skills engine/skills/anchor-docs/SKILL.md` (expect `valid: true`).

## Standard Stack

No libraries. This is markdown authoring against in-repo conventions. The "stack" is:

| Artifact | Path | Role |
|----------|------|------|
| Template to mirror | `engine/skills/bridge/SKILL.md` (83 lines) | The literal skeleton anchor-docs diffs against |
| Second gated example | `engine/skills/import-skill/SKILL.md` (77 lines) | Parallel for the warning/vetting-step pattern |
| Authoring contract | `engine/references/skill-format.md` | Required sections, frontmatter rules, one-call rule, checklist |
| Budget rationale | `engine/references/listing-budget.md` | Why `disable-model-invocation: true` is mandatory |
| ADR contract | `engine/references/adr-format.md` + `docs/adr/ADR-0*.md` | Repo ADR format for ADR-004 |
| Engine substrate (DO NOT modify) | `engine/bin/lib/anchor.cjs`, `init.cjs` case, `sovereign-tools.cjs` case | The CLI the skill drives |
| Gate tooling | `engine/bin/lib/doctor.cjs`, `engine/bin/lib/validate.cjs` | The two phase gates |

## Architecture Patterns

### The bridge skeleton (exact section order to mirror)

From `engine/skills/bridge/SKILL.md`, the shape every M4 skill reproduces:

```
---
name: <skill>
description: <use-case first, one line, within listing cap>
disable-model-invocation: true
argument-hint: "[...]"        # optional
---

## Why this matters          # plain-language, "what goes wrong if you skip this"
## When to use this           # genuine use-cases + a **Don't** anti-use line
## The flow                   # opens "A **thin orchestrator** — ..." then numbered steps
   **1 — Orient (one call).** ```bash INIT=... ``` + @file: guard
   **2 — ...** (each step delegates side effects to sovereign-tools)
## <Domain> format            # optional fenced block (bridge has "## BRIDGE.md format")
## Navigation                 # fenced ▶ NEXT block, recommendation-first
```

**Pattern 1: One-call orient (HARD RULE from skill-format.md).** Literal block, verbatim from bridge/import-skill, only the workflow name changes:
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init anchor-docs)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
**When to use:** first action of the flow, always. No other orientation reads.

The `init anchor-docs` blob (from `init.cjs` case, lines 372-389) returns:
```json
{ "models": {}, "config": {...}, "phase": {...}, "context_injection": {...},
  "paths": { "external_docs_dir": ".sovereign/external-docs",
             "state": ".sovereign/STATE.md", "manifest": ".sovereign/MANIFEST.md" },
  "exists": {...} }
```
The skill parses `paths.external_docs_dir` (where anchors live) — that's the only path it needs.

**Pattern 2: Literal engine path.** Every engine call uses `.claude/sovereign-engine/sovereign-tools.cjs` (the installed location), NOT `$ENGINE`, NOT `engine/bin/...`. This is what `npx sovereign-cli init` copies the engine to; bridge and import-skill both use this literal string in every bash block.

**Pattern 3: Recommendation-first navigation footer.** A fenced `▶ NEXT` block (see bridge lines 76-83). States the recommended next action + where things landed, plus alternatives. anchor-docs footer should point forward to `verify-self` (Phase 16) as the companion and note `sentinel` scans the markers verify-self emits — but anchor-docs itself does NOT emit `SOVEREIGN:UNVERIFIED` markers.

### Recommended flow (numbered, mirroring bridge)

```
1 — Orient (one call).            init anchor-docs + @file: guard
2 — Surface staleness FIRST.      anchor check → if stale_count > 0, name the stale ids,
                                   tell the user to re-check before relying on them.
3 — Gather the doc(s) to anchor.  the judgment: which docs, the slug, the version label,
                                   the re-verify cadence recommendation.
4 — URL-by-default vs content.    Recommend URL-only (safe default). Surface the COPYRIGHT
                                   WARNING (ADR-004) before any --content opt-in. Content is
                                   the user's deliberate choice only.
5 — anchor add.                   delegate storage to the engine (URL-only, or --content on opt-in)
6 — Confirm.                      anchor list → show the new anchor + stale summary
7 — Persist + navigate.           state save, commit via sovereign-tools; navigation footer.
```
This is the bridge order (orient → check staleness first → assemble judgment → write via engine → record → footer) re-skinned for anchoring.

### Anti-Patterns to Avoid
- **Reimplementing storage.** Never write to `.sovereign/external-docs/` directly; always `anchor add`. (bridge never hashes itself — it calls `bridge hash`.)
- **`$ENGINE` or repo-relative engine paths.** Use the literal `.claude/sovereign-engine/sovereign-tools.cjs`.
- **Multiple orientation reads.** One `init anchor-docs`; read only what it points to.
- **v1 frontmatter** (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`) — forbidden by ADR-011 / skill-format.md.
- **Hand-writing state/commit logic** — delegate to `sovereign-tools state save` / `commit`.
- **Emitting `SOVEREIGN:UNVERIFIED` markers** — that's Phase 16's `verify-self`, not anchor-docs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Storing an anchor | Write a `<slug>.md` directly | `anchor add` | Engine owns slug sanitization, header format, default dates |
| Computing staleness | Compare dates in the skill | `anchor check` | Engine does deterministic ISO-lexicographic compare |
| Listing anchors | `ls .sovereign/external-docs/` | `anchor list` | Engine parses headers + adds `stale` flag |
| Default re-verify date | Compute +90d | omit `--re-verify-by` | Engine defaults to date-retrieved + 90 days |
| Slug from a URL | Hand-sanitize | pass any `--id`; engine `slugify`s it | `slugify` guarantees no path escape |

**Key insight:** the engine is content-agnostic and owns all determinism. The skill's entire value-add is judgment: *which* docs, *what cadence*, and the *copyright warning*.

## The exact engine CLI the skill drives (anchor.cjs + sovereign-tools.cjs case)

**`anchor add`** — value flags parsed (sovereign-tools.cjs line 415-419):
`['id', 'source', 'version', 'date-retrieved', 're-verify-by', 'content']`; boolean flag `['store-content']` (parsed but unused — `--content` presence IS the opt-in).

Behavior (anchor.cjs `cmdAnchorAdd`):
- `--source` **required** (else `error: anchor add: --source is required`).
- `--id` **required** → `slugify`'d (lowercase, `[^a-z0-9-]`→`-`, collapse, trim). Empty slug errors.
- `--version` → defaults to literal `"unknown"` if omitted.
- `--date-retrieved` → defaults to today (UTC `YYYY-MM-DD`).
- `--re-verify-by` → defaults to `date-retrieved + 90 days`.
- `--content` opt-in: accepts `@<file>` (read relative to cwd or absolute), `-` (stdin fd 0), or a literal string. Absent → URL-only, `content-stored: false`.
- Writes `.sovereign/external-docs/<slug>.md` with header:
  ```
  **source:** <url>
  **version:** <version>
  **date-retrieved:** <date>
  **re-verify-by:** <date>
  **content-stored:** <true|false>
  ```
  followed by the body only if `--content` was given. Re-adding the same id overwrites (idempotent).
- Emits JSON: `{ id, source, version, date_retrieved, re_verify_by, content_stored, path }`.

**`anchor list`** — no flags. Greenfield-safe → `[]`. Emits an **array**, each: `{ id, source, version, date_retrieved, re_verify_by, content_stored, stale }`.

**`anchor check`** — no flags. Greenfield-safe → `{ anchors: [], stale_count: 0 }`. Emits `{ anchors: [...], stale_count: N }`; `stale` is true when `re_verify_by < today` (strict; equal-to-today is NOT stale).

### Exact bash snippets for the skill (correct flag names)

Orient:
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init anchor-docs)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Surface staleness first:
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor check
# → { "anchors": [...], "stale_count": N }; if N>0, name the stale ids and recommend re-checking.
```

Add (URL-by-default — the safe path):
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor add \
  --id stripe-payment-intents \
  --source "https://docs.stripe.com/api/payment_intents" \
  --version "2024-06-20" \
  --re-verify-by 2026-09-07
# omit --version → "unknown"; omit --re-verify-by → date-retrieved + 90d
```

Add WITH content (only after the copyright warning + explicit opt-in):
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor add \
  --id stripe-payment-intents \
  --source "https://docs.stripe.com/api/payment_intents" \
  --content @./fetched-doc.md      # or: --content -   (stdin)
```

Confirm:
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor list
```

## The copyright warning (the skill's unique judgment — placement + text)

**Placement:** Step 4 of the flow, BEFORE any `--content` opt-in — at the URL-vs-content decision point. Mirror the structure of import-skill's vetting gate (recommendation stated first), but it's a single warning, not five gates.

**Recommended wording (concrete):**
> **Recommendation: store the URL only (the default).** SOVEREIGN anchors store the source URL + metadata so you can re-fetch the *current* doc on demand — that's the safe, non-infringing path.
>
> **Copyright warning — only if you choose `--content`:** Pasting a third-party doc's full text into this repo commits someone else's copyrighted content into your version control. Many docs (payment gateways, SDKs, gov/regional APIs) are licensed in ways that prohibit redistribution. Store full content **only** when you've confirmed the license permits it (or it's your own/public-domain material), and treat it as a deliberate, informed choice. When in doubt, keep the URL and re-fetch.

Cite **ADR-004** at this point ("see ADR-004 for the URL-by-default / content-opt-in policy").

## ADR-004 — exact filename, format, and content

**Filename:** `docs/adr/ADR-004-anchor-content-copyright.md` (matches the repo convention: `docs/adr/ADR-NNN-slug.md`).

**Format (mirror ADR-011/ADR-014, the repo files — NOT the `.sovereign/` runtime `adr-format.md` minimal form):** `# ADR-NNN: Title`, then `**Status:** Accepted` + `**Date:**`, then `## Context` / `## Decision` / `## Consequences`. Existing repo ADRs: ADR-002, 009, 010, 011, 012, 013, 014. (Note: numbering in `docs/adr/` is non-contiguous — ADR-001..008 are not all present; ADR-004 fills a gap, which is fine and intended per CONTEXT — it's currently a dangling reference from ANCHOR-01.)

**Recommended content:**
```markdown
# ADR-004: External-doc anchors store the URL by default; full content is opt-in behind a copyright warning

**Status:** Accepted
**Date:** 2026-06-09

## Context

`anchor-docs` anchors implementation to current external documentation (payment
gateways, SDKs, regional/gov APIs) the agent's training may be stale on. The
tempting move is to store the full doc text in the repo so it's always available.
But third-party documentation is copyrighted, and many sources are licensed in
ways that prohibit redistribution — committing their full text into a user's
version control can infringe. The engine (`anchor.cjs`) is deliberately
content-agnostic: it stores whatever it's handed and never fetches a URL itself.
So the copyright judgment has to live somewhere — and it can't be in the engine.

## Decision

External-doc anchors store the **source URL + metadata by default**
(`source`, `version`, `date-retrieved`, `re-verify-by`). Full document content is
stored **only on explicit opt-in** (`anchor add --content @file|-`), and the
`anchor-docs` skill MUST surface a **copyright/licensing warning** before that
opt-in. The engine stays content-agnostic — it stores what it's given; the
warning and the URL-by-default recommendation live at the **skill layer**.

## Consequences

- (+) The safe path is the default: URLs are non-infringing and let the agent
  re-fetch the *current* doc, which is the whole anti-staleness point.
- (+) The engine stays zero-dep, offline-deterministic, and free of any
  copyright/fetch logic.
- (+) Storing full content remains possible for the user's own or
  permissively-licensed material — it's just a deliberate, warned choice.
- (−) Default anchors depend on the URL still resolving at re-fetch time
  (mitigated by `version` + `date-retrieved` metadata and the `re-verify-by`
  staleness check).
```

## Recommended frontmatter (literal block to use)

```yaml
---
name: anchor-docs
description: Anchor your implementation to current external documentation — capture the URL (and metadata) of the payment-gateway, SDK, or regional/gov-API docs you're building against, and see which anchors have gone stale so you re-check before trusting stale knowledge. Use when integrating against docs your training may be behind on.
disable-model-invocation: true
argument-hint: "[doc URL or anchor id]"
---
```
- `name: anchor-docs` — lowercase-hyphen, 11 chars, no `claude`/`anthropic` → passes `validate skills`.
- `description` leads with the use-case, ~330 chars (well under the 1024 cap; bridge's is ~290). Keep it this tight to protect the listing budget (though it doesn't count once `disable-model-invocation` is set — but the convention is tight descriptions regardless).
- `disable-model-invocation: true` — mandatory (M4-CC; user-invoked side-effecting orchestrator).
- `argument-hint` — optional but matches bridge/import-skill convention.

## Validation Architecture

> SKILL phase: there are no unit tests. The verification gates below replace them. Each maps to a Phase 15 Success Criterion (SC1/SC2/SC3 from ROADMAP) and is a grep- or command-checkable assertion. Run from repo root.

### Gates → Success-Criteria map

| # | Gate (assertion) | Command / check | Pass condition | SC |
|---|------------------|-----------------|----------------|----|
| G1 | SKILL.md exists | `test -f engine/skills/anchor-docs/SKILL.md` | exit 0 | SC1/SC2 |
| G2 | `disable-model-invocation: true` present | `grep -qx 'disable-model-invocation: true' engine/skills/anchor-docs/SKILL.md` | match | SC3 |
| G3 | Has `## Why this matters` | `grep -q '^## Why this matters' engine/skills/anchor-docs/SKILL.md` | match | SC2 |
| G4 | Has a navigation footer | `grep -q '^## Navigation' engine/skills/anchor-docs/SKILL.md` and `grep -q '▶ NEXT' engine/skills/anchor-docs/SKILL.md` | both match | SC2 |
| G5 | Body line gate | `[ "$(wc -l < engine/skills/anchor-docs/SKILL.md)" -ge 70 ]` | ≥ 70 | SC2 |
| G6 | No v1 frontmatter fields | `! grep -Eq '^(triggers\|works-best-with\|min-model\|tokens\|phase):' engine/skills/anchor-docs/SKILL.md` | no match | SC2 |
| G7 | Invokes engine via literal installed path | `grep -q '.claude/sovereign-engine/sovereign-tools.cjs' engine/skills/anchor-docs/SKILL.md` and `! grep -q '\$ENGINE' engine/skills/anchor-docs/SKILL.md` | literal present, no `$ENGINE` | SC1/SC2 |
| G8 | Delegates to engine (no reimplemented storage) | `grep -Eq 'anchor (add\|list\|check)' engine/skills/anchor-docs/SKILL.md` and `! grep -q 'external-docs/.*\.md' engine/skills/anchor-docs/SKILL.md` (no direct file write) | match anchor cmds; no direct write | SC1 |
| G9 | One-call orient | `grep -q 'init anchor-docs' engine/skills/anchor-docs/SKILL.md` and `grep -q '@file:\*' engine/skills/anchor-docs/SKILL.md` | both match | SC2 |
| G10 | Copyright warning surfaced on content path | `grep -iq 'copyright' engine/skills/anchor-docs/SKILL.md` and `grep -iq 'url' engine/skills/anchor-docs/SKILL.md` (URL-by-default documented) | both match | SC1 |
| G11 | ADR-004 exists in repo ADR format | `test -f docs/adr/ADR-004-anchor-content-copyright.md` and `grep -q '^# ADR-004:' docs/adr/ADR-004-anchor-content-copyright.md` and `grep -q '^## Decision' …` | all match | SC1 |
| G12 | Skill references ADR-004 | `grep -q 'ADR-004' engine/skills/anchor-docs/SKILL.md` | match | SC1 |
| G13 | Auto-trigger budget held at 5 | `node engine/bin/sovereign-tools.cjs doctor --cwd engine --pick auto_count` | `5` | SC3 |
| G14 | `validate skills` passes for anchor-docs | `node engine/bin/sovereign-tools.cjs validate skills engine/skills/anchor-docs/SKILL.md` | `{"valid": true, ...}` exit 0 | SC3 |
| G15 | doctor totals consistent | `doctor --cwd engine` → `total_skills: 17, auto_count: 5, disabled_count: 12` (16/5/11 today + this disabled skill) | exact | SC3 |

### Live baseline (verified this research run)
- `node engine/bin/sovereign-tools.cjs doctor --cwd engine` → `{ ok: true, total_skills: 16, auto_count: 5, disabled_count: 11, warnings: [] }`. The 5 auto-triggerable (no `disable-model-invocation`) are: **grill-with-docs, handoff, sentinel, tdd, ubiquitous-language** (the Fast Lane 5). Adding `anchor-docs` with `disable-model-invocation: true` → `disabled_count: 12`, **`auto_count` stays 5** ✓.
- `node engine/bin/sovereign-tools.cjs validate skills engine/skills/bridge/SKILL.md` → `{ valid: true, checked: 1, violations: [] }` — confirms this frontmatter shape passes.
- **CRITICAL gate detail:** from repo root, plain `doctor`/`validate skills` (no args) walk `.claude/skills` + `<cwd>/skills` and find **0 skills** (the repo ships skills under `engine/skills/`). The gate MUST use **`--cwd engine`** (doctor) or an **explicit path** (`validate skills engine/skills/anchor-docs/SKILL.md`). The plan's gate commands must include this or they pass vacuously.

### Sampling rate (for a SKILL phase)
- **Per task commit:** G1-G12 (grep gates — instant) + G14 (`validate skills <path>`).
- **Phase gate / before `/gsd:verify-work`:** G13 + G15 (`doctor --cwd engine`) green, plus all G1-G12, G14.
- **No `node --test` for this phase** — the engine substrate was already fully tested in Phase 14 (164 engine tests green). Do not add engine tests here.

### Wave 0 gaps
- None for test infrastructure — engine is already tested; gates are grep/CLI assertions over the authored files. The only "fixtures" are the two artifacts being authored (SKILL.md + ADR-004).

## Common Pitfalls

### Pitfall 1: Gate runs vacuously from repo root
**What goes wrong:** `doctor` / `validate skills` with no path argument from repo root reports `total_skills: 0` (skills live under `engine/skills/`, but the walkers look at `.claude/skills` and `cwd/skills`). A "passing" gate proves nothing.
**How to avoid:** Use `doctor --cwd engine` and `validate skills engine/skills/anchor-docs/SKILL.md` (explicit path). Confirmed live.
**Warning sign:** `total_skills: 0` in doctor output.

### Pitfall 2: Using `$ENGINE` or repo-relative engine paths in the skill body
**What goes wrong:** The installed skill runs from `.claude/skills/anchor-docs/` and the engine is at `.claude/sovereign-engine/sovereign-tools.cjs`. A `$ENGINE` var or `engine/bin/...` path breaks at runtime.
**How to avoid:** Use the literal `.claude/sovereign-engine/sovereign-tools.cjs` in every bash block (bridge/import-skill both do).

### Pitfall 3: Treating `--content` as a flag-without-value
**What goes wrong:** `--store-content` boolean exists in the parser but is unused; the opt-in is the **presence of `--content` with a value** (`@file`, `-`, or literal). A bare `--content` with no following value parses to `null` (no opt-in).
**How to avoid:** Always pass `--content @file` or `--content -`; never bare `--content`.

### Pitfall 4: ADR format drift
**What goes wrong:** Copying the `.sovereign/` runtime "minimal one-to-three-sentence" form from `adr-format.md` instead of the repo's structured `## Context/Decision/Consequences` form used by ADR-002..014.
**How to avoid:** Mirror `docs/adr/ADR-011-*.md` / `ADR-014-*.md` exactly (see ADR-004 block above).

### Pitfall 5: Accidentally bumping the auto-trigger budget
**What goes wrong:** Forgetting `disable-model-invocation: true` → `auto_count` goes to 6, doctor still `ok` (cap is 7) but M4-CC SC3 ("budget held at 5") FAILS even though doctor doesn't warn.
**How to avoid:** Gate on `auto_count == 5` exactly (G13), not just `doctor ok`.

## Runtime State Inventory

Not applicable — greenfield authoring of two new files (a new SKILL.md and a new ADR). No rename/refactor/migration; no stored data, live-service config, OS-registered state, secrets, or build artifacts carry a renamed string. The only "installed artifact" consideration: when end-users run `npx sovereign-cli init`, the new skill is copied from `engine/skills/` to `.claude/skills/` and references resolve from the package root (`references/...`) — but that is install-time behavior, not something this phase migrates.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | running the gate commands (`doctor`, `validate`) | ✓ (project baseline) | >= 20 LTS | — |
| `engine/bin/sovereign-tools.cjs` + lib | the gates + the CLI the skill drives | ✓ shipped Phase 14 | repo | — |

No external/network dependencies — engine is zero-dep, gates are local CLI calls. (No web research was required for this phase.)

## State of the Art

Not applicable — in-repo convention, no external ecosystem to track. The conventions (ADR-011 drop-v1-frontmatter, ADR-014 taxonomy, skill-format.md, listing-budget.md) are the locked, shipped state.

## Open Questions — resolved

All five open questions from the prompt are resolved above with concrete recommendations:

1. **Frontmatter** → literal block given (`name: anchor-docs`, use-case-first description ~330 chars, `disable-model-invocation: true`, `argument-hint`).
2. **Bash snippets** → exact orient (`init anchor-docs` + `@file:` guard) + `anchor check|add|list` with real flag names from anchor.cjs given above.
3. **Copyright warning** → Step 4 of the flow, before any `--content` opt-in; recommendation-first wording given; cites ADR-004.
4. **ADR-004** → filename `docs/adr/ADR-004-anchor-content-copyright.md`, repo ADR format (`# ADR-NNN:` / `**Status:**` / `## Context/Decision/Consequences`), full content drafted.
5. **doctor / validate** → confirmed live: `auto_count` stays **5** with `disable-model-invocation: true` (baseline 5; this skill lands in `disabled_count`). `validate skills` passes given lowercase-hyphen name (no reserved words) + description under 1024 chars. Gate MUST use `--cwd engine` / explicit path.

**One thing to flag (not a blocker):** ROADMAP Phase 15 SC1 references ANCHOR-01 and CONTEXT scopes ANCHOR-02's staleness *surfacing* into this phase via `anchor check` (the "know which anchors have gone stale" half), while REQUIREMENTS formally assigns ANCHOR-02 verification to Phase 16. The plan should have anchor-docs *surface* stale anchors (Step 2 of the flow) but not claim to *verify* ANCHOR-02 here. This is consistent with both docs.

## Sources

### Primary (HIGH confidence — read directly this run)
- `engine/skills/bridge/SKILL.md` (83 lines) — the template skeleton, frontmatter, one-call orient, literal engine path, footer.
- `engine/skills/import-skill/SKILL.md` (77 lines) — gated/warned user-invoked example.
- `engine/references/skill-format.md` — authoring contract, required sections, one-call rule, ≥70 expectation, checklist.
- `engine/references/listing-budget.md` — `disable-model-invocation` rationale, doctor thresholds (AUTO_MAX 7, TOKEN_BUDGET 2000).
- `engine/references/adr-format.md` — ADR contract (note: repo `docs/adr/` uses the structured form, not this minimal form).
- `engine/bin/lib/anchor.cjs` — exact `anchor add|list|check` behavior, flags, header format, JSON shapes, defaults.
- `engine/bin/lib/init.cjs` lines 372-389 (`case 'anchor-docs'`) — orient blob fields.
- `engine/bin/sovereign-tools.cjs` lines 411-429 (`case 'anchor'`) + 58-71 (`parseNamedArgs`) + 178-194 (`--cwd`) — CLI entry, value/boolean flag lists, cwd resolution.
- `engine/bin/lib/doctor.cjs` — budget check logic, `auto_count`/`disabled_count`, exit semantics.
- `engine/bin/lib/validate.cjs` — frontmatter lint rules (name ≤64, lowercase-hyphen, no claude/anthropic; description ≤1024).
- `docs/adr/ADR-011-*.md`, `ADR-014-*.md` + glob of `docs/adr/ADR-0*.md` — repo ADR format + existing numbering.
- **Live gate runs:** `doctor --cwd engine` → auto_count 5 / total 16; `validate skills bridge` → valid; per-skill `disable-model-invocation` grep (Fast Lane 5 identified).
- `.planning/ROADMAP.md` (Phase 15 SC), `.planning/REQUIREMENTS.md` (ANCHOR-01, M4-CC), `.planning/phases/15-anchor-docs-skill/15-CONTEXT.md`, `CLAUDE.md`.

### Secondary / Tertiary
- None — no web research required for this phase.

## Metadata

**Confidence breakdown:**
- Skill skeleton / frontmatter / flow: HIGH — copied from two shipped skills + the authoring contract, read directly.
- Engine CLI surface: HIGH — read anchor.cjs + the CLI case directly; flag names exact.
- Gates (doctor/validate): HIGH — logic read directly AND run live; the `--cwd engine` requirement empirically confirmed.
- ADR-004 format: HIGH — mirrors repo ADRs read directly.

**Research date:** 2026-06-09
**Valid until:** stable until the engine `anchor`/`doctor`/`validate` surface or the skill-format conventions change (in-repo, no external drift).
