# Phase 18: `qa` skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Hand-authored from locked M5 scope (ROADMAP Phase 18 success criteria + REQUIREMENTS QA-01 + M5-CC) **and the user-provided source spec preserved verbatim at `.planning/research/qa-skill-source-spec.md`** (with SOVEREIGN-adaptation notes). Established dogfooding loop; no interactive discuss-phase.

<domain>
## Phase Boundary

**Deliver the hand-authored `qa` SKILL.md** — a relentless, stack-agnostic, repo-wide correctness sweep that catches errors, type mismatches, broken imports/wiring, missing deps/config, routing dead-ends, and cross-workspace/contract drift **before they hit a running build**. A core-tier thin orchestrator over the project's OWN toolchain.

In scope:
1. **`engine/skills/qa/SKILL.md`** — the skill. Thin orchestrator mirroring the shipped `sentinel`/`diagnose`/`tdd` shape (real Agent-Skills frontmatter only; `disable-model-invocation: true`; `## Why this matters`; navigation footer; orients with ONE `init qa` call; invokes the engine via the literal `.claude/sovereign-engine/sovereign-tools.cjs` path).
2. **Verification gates pass:** `sovereign-tools doctor` still reports auto-trigger budget at **5** (qa is user-invoked → disabled tier, now 20 skills / 15 disabled); `sovereign-tools validate skills` passes for qa; engine suite stays 164 green.

Explicitly OUT of scope (deferred):
- `security-design` enrichment (Phase 19).
- Any built-in test runner / type checker / linter — `qa` drives the **project's own** toolchain; the engine never bundles language tooling.
- Auto-fixing what `qa` finds — it reports ✅/❌/⚠️ and hands failures to `/diagnose`; the user/diagnose acts.
- A pre-flight deploy-gate that BLOCKS on a failing `qa` (post-M5; M5 surfaces only).
- An engine change UNLESS `init qa` needs a dedicated orient case (the generic `init` default case serves unknown workflow names — confirmed for `diagnose` in Phase 17; research re-confirms for `qa`; prefer NO engine change).
</domain>

<decisions>
## Implementation Decisions

### Locked by success criteria + the source spec (NON-NEGOTIABLE)
- **The five check categories**, per workspace/module, **using whatever toolchain that module uses** (stack-agnostic — never a hardcoded runner):
  1. **Static correctness** — compile / type-check in no-output/check mode; validate schema definitions (DB, serialization, config) against their tooling; run the configured linter (surface errors).
  2. **Tests** — run the module's unit + integration/component suites.
  3. **Dependency & wiring integrity** — DI/service/provider wiring registered+imported+exported where the framework requires; every import resolves to a real installed module (no "module not found"); matched-version requirements agree exactly; example/template config (`.env.example`, sample config) cross-checked against what the code actually reads at runtime.
  4. **Navigation / routing** — every route/link/navigation target referenced in code maps to a real, registered destination.
  5. **Cross-workspace consistency** — a shared runtime resolves to exactly ONE version across modules; shared/contract types match what producers return and consumers expect; data-model fields (DB/API) match their type/interface definitions; endpoint request/response shapes match the documented API contract (in a SOVEREIGN project: **`.sovereign/docs/api/API_SPEC.md`**, not `docs/api-contract.md`).
- **Run the project's own `qa` command when present** (e.g. `make qa` / a configured script / a task runner — detect, don't assume) from the repo root for a full sweep; **else run the per-module equivalents** above. Stack-agnostic throughout.
- **Report format:** group by workspace/module, then by check category. `✅` pass, `❌` failure with the **exact error + `file:line`**, `⚠️` warning (non-blocking). End with a **one-line overall verdict** (pass / fail with N blocking issues).
- **One-call orient** — first action is a single `node ".claude/sovereign-engine/sovereign-tools.cjs" init qa` (with `@file:` guard); then read only what it points to (e.g. `API_SPEC.md`, glossary).
- **Composition** — failures hand off to `/diagnose` (debug the root cause); `qa` is the **mechanical correctness** complement to `/sentinel` (standards/judgment review) and `/tdd` (test-first). Footer makes this legible.
- **Core-tier shape + `disable-model-invocation: true`** (M5-CC): real frontmatter only; `## Why this matters`; `## When to use this` (+ a "Don't"); `## The flow` (the sweep, recommendation-first); navigation footer; `wc -l` ≥ 70; no v1 frontmatter fields.

### Claude's Discretion (judgment choices — confirm/refine in research)
- **`init qa` orientation:** prefer the generic `init` default case (confirmed working for unknown workflow names in Phase 17). Only add a dedicated `case 'qa':` to `init.cjs` if surfacing a specific path (e.g. `paths` for API_SPEC) materially helps — default to NO engine change; flag if warranted.
- **Workspace/module discovery:** detect the repo's structure (a monorepo's packages/workspaces vs a single module) from the project's own manifests/config; keep it agnostic (don't assume npm workspaces).
- **"The project's own qa command":** how to detect it — check the common task runners' manifests generically; if none, fall back to per-module equivalents. Name the idea, not a specific tool.
- **Report skeleton:** give a concrete, copyable report template (module → category → ✅/❌/⚠️ lines + verdict) in the skill so output is consistent.
- **Trigger entry points:** user-invoked `/qa` before a commit/PR/build, after a big change, or when wiring feels shaky. Name the signals.
- **`description` frontmatter:** lead with the use case (catch errors before a running build), neutral name, within the listing cap.

### Boundaries vs siblings (keep distinct)
- `qa` = mechanical, repo-wide CORRECTNESS sweep (does it compile, resolve, wire, route, match contracts, pass tests). `sentinel` = STANDARDS/judgment review (comment quality, spec alignment, ADR consistency, `SOVEREIGN:UNVERIFIED` scan). `diagnose` = root-cause a specific FAILURE. `tdd` = write tests for new behavior. `qa` finds breakage broadly → `diagnose` fixes a specific one → `sentinel` judges the result.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before authoring.**

### The source material
- **`.planning/research/qa-skill-source-spec.md`** — the user's verbatim `qa` spec + SOVEREIGN-adaptation notes. The authoritative content source; the skill adapts it to the thin-orchestrator shape.

### The pattern to mirror (shipped)
- `engine/skills/sentinel/SKILL.md` — the closest sibling (a quality gate that produces a structured verdict); align the complement framing + verdict style. (Note: sentinel is a Fast Lane skill with NO `disable-model-invocation`; `qa` is NOT Fast Lane → MUST set `disable-model-invocation: true`.)
- `engine/skills/diagnose/SKILL.md` (Phase 17) — freshest sibling; the composition target for qa failures; mirror its bulleted-step shape + one-call orient + footer.
- `engine/skills/tdd/SKILL.md` — how a skill drives the project's OWN test runner agnostically.
- `engine/skills/anchor-docs/SKILL.md` / `engine/skills/bridge/SKILL.md` — canonical one-call-orient + literal engine path + `▶ NEXT` footer.
- `engine/references/skill-format.md` — authoring contract (sections, frontmatter, line gate, recommendation-first, footer).
- `engine/references/listing-budget.md` + ADR-014 — why `disable-model-invocation: true` is mandatory (budget held at 5).

### Engine surface
- `engine/bin/lib/init.cjs` — the `switch (workflow)` DEFAULT case (confirm `init qa` returns a usable blob without a dedicated case — as `init diagnose` did).
- `.sovereign/docs/api/API_SPEC.md` — the API-contract source the cross-workspace check compares against (from `api-design`).

### Spec / requirement sources
- `.planning/ROADMAP.md` → Phase 18 Success Criteria (the 3 TRUE-conditions = verification target).
- `.planning/REQUIREMENTS.md` → **QA-01** + **M5-CC** + M5 non-goals (no bundled tooling; reports/recommends, doesn't auto-fix).
- `CLAUDE.md` → skill frontmatter spec; model-agnostic body guidance.

### Verification tooling (phase gates) — RUN FROM `engine/`
- `cd engine && node bin/sovereign-tools.cjs doctor` → auto_count stays **5** (total 20, disabled 15).
- `cd engine && node bin/sovereign-tools.cjs validate skills skills/qa/SKILL.md` → passes.
- `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (unless a dedicated `init qa` case is added — then add a test; deps stay `{}`).
- (CRITICAL caveat: `doctor`/`validate` walk `<cwd>/skills`, not `engine/skills/` — gates MUST run from `engine/` or pass vacuously; `doctor` exits 0 regardless — ASSERT auto_count.)
</canonical_refs>

<specifics>
## Specific Ideas

- The skill's value is COVERAGE + DISCIPLINE: every category, every module, the project's own tools, a consistent ✅/❌/⚠️ report with `file:line` and a blunt verdict. Don't let it become a vague "check the code."
- Keep it ruthlessly agnostic: describe each check as a *class* ("run the language's type checker in check mode"), never a specific tool. Drive the project's own `qa` command first; per-module equivalents are the fallback.
- Lean on composition: `qa` reports; `/diagnose` debugs a specific ❌; `/sentinel` judges standards. A reviewer should see qa ORCHESTRATE the project's tooling + hand off, not reimplement a linter/test runner.
- Give a concrete report template so output is consistent across runs and agents.
</specifics>

<deferred>
## Deferred Ideas

- `security-design` enrichment (Phase 19).
- A pre-flight gate that BLOCKS on a failing `qa` / a `qa --fix` auto-repair (post-M5).
- An engine-side `qa` runner or results store (never — the project's own tooling + the agent's inspection do the work).
</deferred>

---

*Phase: 18-qa-skill*
*Context gathered: 2026-06-09 (hand-authored from locked M5 scope + user source spec)*
