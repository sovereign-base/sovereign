# Phase 17: `diagnose` skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Hand-authored from locked M5 scope (ROADMAP Phase 17 success criteria + REQUIREMENTS DIAG-01 + M5-CC). `archive/v1/SOVEREIGN_PROJECT.md` §6 lists `/diagnose` as a planned construction skill but no detailed design — so this is designed from DIAG-01 + the shipped skill patterns. Established dogfooding loop; no interactive discuss-phase.

<domain>
## Phase Boundary

**Deliver the hand-authored `diagnose` SKILL.md** — a core-tier thin orchestrator that walks a disciplined, recommendation-first debugging loop (**reproduce → isolate → hypothesis → fix → verify**) instead of shotgun guessing, stack-agnostic, over the engine + committed `.sovereign/` state. Composes with the shipped `tdd` / `verify-self` / `sentinel`.

In scope:
1. **`engine/skills/diagnose/SKILL.md`** — the skill. Thin orchestrator mirroring the shipped `tdd`/`sentinel`/`anchor-docs` shape (real Agent-Skills frontmatter only; `disable-model-invocation: true`; `## Why this matters`; recommendation-first; navigation footer; orients with ONE `init diagnose` call; invokes the engine via the literal `.claude/sovereign-engine/sovereign-tools.cjs` path).
2. **Verification gates pass:** `sovereign-tools doctor` still reports auto-trigger budget at **5** (diagnose is user-invoked → disabled tier, now 19 skills / 14 disabled); `sovereign-tools validate skills` passes for diagnose; engine suite stays 164 green.

Explicitly OUT of scope (deferred):
- `qa` skill (Phase 18) and `security-design` enrichment (Phase 19).
- Any built-in debugger / test runner — `diagnose` drives the **project's own** test/run tooling; the engine never bundles language tooling.
- Auto-fixing without the user — diagnose recommends the minimal root-cause fix; the user applies/approves it (it may use `tdd` to drive the fix).
- A pre-flight gate that blocks on open diagnoses (post-M5).
- An engine change UNLESS `init diagnose` genuinely needs a dedicated orient case (the generic `init` default case may already serve it — research confirms; prefer no engine change).
</domain>

<decisions>
## Implementation Decisions

### Locked by success criteria (NON-NEGOTIABLE)
- **The five-step loop, recommendation-first (DIAG-01):**
  1. **Reproduce** — get a reliable, minimal repro FIRST (a failing test via `tdd`, or a single command). Don't debug what you can't reproduce; if it's not reproducible, say so and stop guessing.
  2. **Isolate** — narrow the surface: read the actual error + stack/`file:line`, binary-search the boundary where good→bad (e.g. `git bisect`, bisecting inputs/commits/config), shrink to the smallest failing case.
  3. **Hypothesis** — state ONE testable root-cause hypothesis, **recommendation-first** (the most-likely cause + why), not a shotgun list. Distinguish root cause from symptom.
  4. **Fix** — the minimal change that addresses the **root cause**, not the symptom. Drive it test-first via `tdd` where it fits.
  5. **Verify** — re-run the repro/failing test (now green) AND the suite (no regression). If the root cause was assumed but not confirmed against authoritative behavior → hand to `verify-self` (mark `SOVEREIGN:UNVERIFIED`).
- **Stack-agnostic** — uses the project's OWN test/run tooling (from STATE/config or the project's conventions); never a hardcoded toolchain.
- **One-call orient** — first action is a single `node ".claude/sovereign-engine/sovereign-tools.cjs" init diagnose` (with `@file:` guard), then read only what it points to.
- **Composition** — `tdd` (capture the bug as a failing test + drive the fix), `verify-self` (unconfirmed root cause → marker), `sentinel` (standards pass on the fix). Footer makes these legible.
- **Records the trail** — persist a short diagnosis record (hypothesis, root cause, fix, verification) via `state save` / commit so it survives the session (don't re-derive next time).
- **Core-tier shape + `disable-model-invocation: true`** (M5-CC): real frontmatter only; `## Why this matters`; `## When to use this` (+ a "Don't"); `## The flow` (numbered, recommendation-first); navigation footer; `wc -l` ≥ 70; no v1 frontmatter fields.

### Claude's Discretion (judgment choices — confirm/refine in research)
- **`init diagnose` orientation:** prefer the generic `init` default case (returns config/paths/state/manifest) if it serves an unknown workflow name cleanly; only add a dedicated `case 'diagnose':` to `init.cjs` if a specific blob (e.g. surfacing the test command, STATE, recent ADRs) materially helps. CONFIRM the default-case behavior in research; default to NO engine change.
- **Isolation tactics to name:** `git bisect` for "worked before, broken now"; binary-search the input/config; add a temporary assertion/log at the suspected boundary then remove it; read the stack to the first frame in the user's own code. Keep them as recommended tactics, agnostic.
- **Where the diagnosis record lives:** a short note (e.g. appended to a `.sovereign/` debug log or STATE field) — keep it lightweight; reuse engine `state save`/`commit`, don't invent storage.
- **Trigger entry points:** user-invoked `/diagnose` (a test fails, a runtime error, flaky behavior). The agent recognizes "I'm guessing at a fix" and runs the loop. Name the recognizable signals.
- **`description` frontmatter:** lead with the use case (debug a failure methodically instead of guessing), neutral name, within the listing cap.

### Boundaries vs siblings (keep distinct)
- `tdd` = write tests / red-green-refactor for NEW behavior. `diagnose` = find the root cause of a FAILURE (and may use `tdd` to lock the fix). `sentinel` = review the change against standards after. `verify-self` = catch uncertainty about external behavior. diagnose orchestrates among them; it does not duplicate them.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before authoring.**

### The pattern to mirror (shipped)
- `engine/skills/tdd/SKILL.md` — closest construction-phase sibling (drives the project's own test runner, stack-agnostic, red-green loop); diagnose composes with it.
- `engine/skills/sentinel/SKILL.md` — the standards review diagnose hands to; align the loop language.
- `engine/skills/verify-self/SKILL.md` (Phase 16) — the uncertainty path diagnose uses; mirror its recent thin-orchestrator shape + footer.
- `engine/skills/anchor-docs/SKILL.md` / `engine/skills/bridge/SKILL.md` — the canonical one-call-orient + literal engine path + footer shape.
- `engine/references/skill-format.md` — authoring contract (sections, frontmatter, line gate, recommendation-first, footer).
- `engine/references/listing-budget.md` + ADR-014 — why `disable-model-invocation: true` is mandatory (budget held at 5).
- (Inspiration only, NOT to copy) GSD's `gsd-debugger` agent uses the scientific-method debugging shape — the reproduce/isolate/hypothesis/verify discipline is the same; diagnose is a thin SKILL, not a GSD agent.

### Engine surface
- `engine/bin/lib/init.cjs` — the `switch (workflow)` + its DEFAULT case (confirm `init diagnose` returns a usable blob without a dedicated case).
- `engine/bin/lib/core.cjs` (`output`/`loadConfig`), `engine/bin/lib/state.cjs` (`state save` for the diagnosis record).

### Spec / requirement sources
- `.planning/ROADMAP.md` → Phase 17 Success Criteria (the 3 TRUE-conditions = verification target).
- `.planning/REQUIREMENTS.md` → **DIAG-01** + **M5-CC** + M5 non-goals (no bundled test runner; surfaces/recommends, doesn't auto-fix).
- `CLAUDE.md` → skill frontmatter spec; model-agnostic body guidance.

### Verification tooling (phase gates) — RUN FROM `engine/`
- `cd engine && node bin/sovereign-tools.cjs doctor` → auto_count must stay **5** (total 19, disabled 14).
- `cd engine && node bin/sovereign-tools.cjs validate skills skills/diagnose/SKILL.md` → passes.
- `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (unless a dedicated `init diagnose` case is added — then add a test for it; deps stay `{}`).
- (CRITICAL caveat: `doctor`/`validate skills` walk `.claude/skills`+`<cwd>/skills`, NOT `engine/skills/` — gates MUST run from `engine/` or pass vacuously.)
</canonical_refs>

<specifics>
## Specific Ideas

- The skill's whole value is the DISCIPLINE: reproduce before fixing, one hypothesis at a time, root cause over symptom, verify + no-regression. Make each step recommendation-first and concrete.
- Lean on composition rather than reimplementing: `tdd` for the failing test + fix, `verify-self` for unconfirmed external behavior, `sentinel` for the standards pass. A reviewer should see diagnose ORCHESTRATE, not duplicate.
- Keep the body model-agnostic: "run `init diagnose`, then the loop using your project's own tooling."
</specifics>

<deferred>
## Deferred Ideas

- `qa` skill (Phase 18) — repo-wide correctness sweep; `qa` failures hand off to `diagnose`.
- `security-design` enrichment (Phase 19).
- A pre-flight gate blocking on open/unresolved diagnoses (post-M5).
- Auto-fix / auto-bisect automation in the engine (never — agent + project tooling do the work).
</deferred>

---

*Phase: 17-diagnose-skill*
*Context gathered: 2026-06-09 (hand-authored from locked M5 scope)*
