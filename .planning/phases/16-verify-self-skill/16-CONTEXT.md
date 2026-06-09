# Phase 16: `verify-self` skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Hand-authored from locked M4 scope (ROADMAP Phase 16 success criteria + REQUIREMENTS VERIFY-01/02 + ANCHOR-02 + M4-CC). The M4 capstone — closes the anchor→verify→sentinel loop. Established dogfooding loop; design space locked by the success criteria + the shipped Phase 14 engine + Phase 15 `anchor-docs` skill + the M1 `unverified-marker.md` spec.

<domain>
## Phase Boundary

**Deliver the hand-authored `verify-self` SKILL.md** — a core-tier thin orchestrator that, when the agent or user hits a low-confidence signal, **hard-stops**, runs a **retroactive audit** of code written since the last verified anchor, and forces a deliberate **3-way resolution** before more wrong code ships. It composes with `anchor-docs` (Phase 15) and emits `SOVEREIGN:UNVERIFIED` markers (M1 spec) that `sentinel` already scans.

In scope:
1. **`engine/skills/verify-self/SKILL.md`** — the skill. Thin orchestrator mirroring the shipped `bridge`/`anchor-docs` shape (real frontmatter only; `disable-model-invocation: true`; `## Why this matters`; recommendation-first; navigation footer; orients with ONE `init verify-self` call; invokes the engine via the literal `.claude/sovereign-engine/sovereign-tools.cjs` path).
2. **Verification gates pass:** `sovereign-tools doctor` still reports auto-trigger budget at **5** (verify-self is user-invoked → lands in disabled_count, now 18 skills / 13 disabled); `sovereign-tools validate skills` passes for verify-self.

Explicitly OUT of scope (deferred):
- Any engine change — `init verify-self` shipped in Phase 14 (surfaces the marker-spec path); markers are written by the agent INTO code files (not an engine command); the audit uses git + `anchor list` + judgment. If a genuine engine gap is found, flag it; don't silently patch.
- A pre-flight deploy-gate that BLOCKS on unresolved markers / stale anchors (post-M4; M4 surfaces only).
- Changing the marker form or the `sentinel` scan (both shipped/locked — verify-self writes the existing form).
- Re-authoring `anchor-docs` (Phase 15) — verify-self only *composes with* it (choice A hands off to it).
</domain>

<decisions>
## Implementation Decisions

### Locked by success criteria (NON-NEGOTIABLE)
- **Hard stop, then retroactive audit (VERIFY-01).** On a low-confidence signal the skill's FIRST move is: stop writing new code. Then audit the code written since the last verified anchor and surface **each specific unverified claim as `file:line` + what's uncertain** (an unconfirmed API shape/endpoint/signature, an assumed behavior, or a stale-knowledge-risk library) — the same three valid-context classes the marker spec defines.
- **Three choices, always offered, never auto-resolved (VERIFY-02).** Present exactly:
  - **(A) Provide docs** → hand off to **`/anchor-docs`** to anchor the authoritative source, then re-check the flagged code against the now-current doc.
  - **(B) Mark `SOVEREIGN:UNVERIFIED` and continue** → write a marker at each unverified claim's `file:line` in the **exact** form from `engine/references/unverified-marker.md`: `<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>`. `sentinel` already scans the literal token.
  - **(C) Discard and restart with docs** → revert the unverified changes (git), then anchor the docs (anchor-docs) before re-implementing.
  - The skill NEVER silently continues — it always surfaces + offers the choices.
- **Closes the loop (ANCHOR-02 end-to-end).** verify-self → (choice A) anchor-docs → anchor-docs surfaces stale anchors (`anchor check`) → (choice B) markers → sentinel scans. Phase 16 is where this composition is demonstrated end-to-end (ANCHOR-02's formal verification point).
- **One-call orient + core-tier shape (M4-CC).** First action: single `node ".claude/sovereign-engine/sovereign-tools.cjs" init verify-self` (with `@file:` guard); parse the blob's `unverified_marker_spec` path (Phase 14 surfaces `references/unverified-marker.md`) + `external_docs_dir`. Real frontmatter only; `## Why this matters`; `## When to use this` (+ Don't); `## The flow` (numbered, recommendation-first); navigation footer; `wc -l` ≥ 70; no v1 fields.
- **`disable-model-invocation: true`** so doctor keeps auto-trigger budget at 5; validate passes.

### Claude's Discretion (judgment choices — confirm/refine in research)
- **"Last verified anchor" boundary (the flagged open question).** Derive it skill-side from data the engine already exposes — NO new engine command:
  - Primary: `anchor list` → the most-recent `date-retrieved` across anchors is the "last verified anchor" timestamp.
  - Combine with git to bound the code to audit: review changes since that point — e.g. uncommitted work (`git diff` / `git status`) plus commits since the anchor date (`git log --since=<date>` / `git diff <since>..HEAD`). If there are NO anchors yet, the boundary is "all un-anchored work in this session/branch" — treat everything touching external APIs as unverified.
  - This is judgment the skill applies over engine-provided dates + git; document it plainly in the flow.
- **Trigger entry points (reconcile with `disable-model-invocation: true`).** The skill is user-invoked (`/verify-self`) for the listing budget. The "agent itself triggers" path (VERIFY-01) = the agent RECOGNIZES a low-confidence signal (about to assert a version/endpoint/config; implementing an integration with no anchor; a post-cutoff API) and **surfaces it / runs the verify-self flow** — it doesn't need auto-invocation to do that. The skill body should name the recognizable signals so the agent knows when to reach for it.
- **Audit method:** judgment review (not a mechanical scan) of the bounded code against what's anchored — flag claims about external behavior not backed by an anchor. May use `grep` for obvious risk patterns as an aid, but the core is the agent reading the diff and naming uncertainties as `file:line`.
- **Choice C revert mechanic:** recommend the safe git operation (e.g. `git restore`/`git checkout` of the specific unverified hunks, or stash) — be concrete but conservative; never destructive beyond the unverified changes.
- **`description` frontmatter:** lead with the use case (catch your own uncertainty before it ships), neutral name, within the listing cap.

### Navigation / composition
- Footer points to `/anchor-docs` (choice A companion) and notes `/sentinel` scans the `SOVEREIGN:UNVERIFIED` markers choice B writes — closing the loop. This is the capstone skill; the footer should make the loop legible.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or authoring.**

### The pattern to mirror (shipped)
- `engine/skills/anchor-docs/SKILL.md` (Phase 15) — the freshest sibling + the composition target (choice A). Mirror its shape; reference it in the footer/flow.
- `engine/skills/bridge/SKILL.md` — the canonical thin-orchestrator template (one-call orient, literal engine path, footer).
- `engine/skills/import-skill/SKILL.md` — gated/user-invoked example with a decision step (parallel to the 3-way choice).
- `engine/skills/sentinel/SKILL.md` — what scans the markers verify-self writes; align the loop language + confirm sentinel reads the literal token (it does).
- `engine/references/skill-format.md` — authoring contract (sections, frontmatter, line gate, recommendation-first, footer).
- `engine/references/listing-budget.md` + ADR-014 — why `disable-model-invocation: true` is mandatory (budget held at 5).

### The marker contract (verify-self WRITES this; do NOT invent a new shape)
- `engine/references/unverified-marker.md` — the EXACT form `<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>`, the 3 valid-context classes, and that `sentinel` reads (never writes) it. Choice B emits exactly this.

### The engine surface this skill drives (shipped Phase 14/15)
- `engine/bin/lib/init.cjs` `case 'verify-self':` — the orient blob (surfaces `unverified_marker_spec: references/unverified-marker.md` + `external_docs_dir` + config). Read the exact fields.
- `engine/bin/lib/anchor.cjs` — `anchor list` (most-recent `date-retrieved` = the boundary) and `anchor check` (stale surfacing, used via the anchor-docs handoff).

### Spec / requirement sources
- `.planning/ROADMAP.md` → Phase 16 Success Criteria (the 4 TRUE-conditions = verification target).
- `.planning/REQUIREMENTS.md` → **VERIFY-01, VERIFY-02, ANCHOR-02, M4-CC** + M4 non-goals (surfaces-only; never silently continue).
- `CLAUDE.md` → skill frontmatter spec; model-agnostic body guidance.

### Verification tooling (phase gates) — RUN FROM `engine/`
- `cd engine && node bin/sovereign-tools.cjs doctor` → auto_count must stay **5** (total_skills 18, disabled 13).
- `cd engine && node bin/sovereign-tools.cjs validate skills skills/verify-self/SKILL.md` → passes.
- `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (engine untouched).
- (CRITICAL caveat from Phase 15: `doctor`/`validate skills` walk `.claude/skills`+`<cwd>/skills`, NOT `engine/skills/` — gates MUST run from `engine/` or pass vacuously.)
</canonical_refs>

<specifics>
## Specific Ideas

- This is the capstone — its job is to make the whole anti-hallucination loop *fire at the right moment*. The unique value is the hard-stop discipline + the 3-way forcing function; the audit and marker-writing reuse shipped contracts.
- Keep choice B's marker form EXACT (copy from `unverified-marker.md`) so `sentinel` finds them — show a worked example in the skill.
- Keep the body model-agnostic: "run `init verify-self`, audit, choose A/B/C." Works for any SKILL.md agent.
- Make the "last verified anchor" derivation concrete (anchor list date + git diff since) so it's not hand-wavy.
</specifics>

<deferred>
## Deferred Ideas

- Pre-flight deploy-gate BLOCKING on unresolved markers / stale anchors (post-M4).
- Any engine command for the audit boundary (use `anchor list` + git; no new engine surface).
- Auto-resolving low confidence without the user (never — always surface + offer choices).
</deferred>

---

*Phase: 16-verify-self-skill*
*Context gathered: 2026-06-09 (hand-authored from locked M4 scope — capstone)*
