# Phase 17: `diagnose` skill - Research

**Researched:** 2026-06-09
**Domain:** Hand-authored thin-orchestrator SKILL.md (stack-agnostic debugging loop)
**Confidence:** HIGH (all findings read directly from repo + empirically verified by running the engine)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (NON-NEGOTIABLE)
- **The five-step loop, recommendation-first (DIAG-01):**
  1. **Reproduce** — get a reliable, minimal repro FIRST (a failing test via `tdd`, or a single command). Don't debug what you can't reproduce; if not reproducible, say so and stop guessing.
  2. **Isolate** — narrow the surface: read the actual error + stack/`file:line`, binary-search the boundary where good→bad (`git bisect`, bisecting inputs/commits/config), shrink to the smallest failing case.
  3. **Hypothesis** — ONE testable root-cause hypothesis, recommendation-first (most-likely cause + why), not a shotgun list. Distinguish root cause from symptom.
  4. **Fix** — the minimal change addressing the **root cause**, not the symptom. Drive it test-first via `tdd` where it fits.
  5. **Verify** — re-run the repro/failing test (now green) AND the suite (no regression). Unconfirmed root cause → hand to `verify-self` (`SOVEREIGN:UNVERIFIED`).
- **Stack-agnostic** — uses the project's OWN test/run tooling (from STATE/config or the project's conventions); never a hardcoded toolchain.
- **One-call orient** — first action is a single `node ".claude/sovereign-engine/sovereign-tools.cjs" init diagnose` (with `@file:` guard), then read only what it points to.
- **Composition** — `tdd` (capture bug as failing test + drive fix), `verify-self` (unconfirmed root cause → marker), `sentinel` (standards pass on the fix). Footer makes these legible.
- **Records the trail** — persist a short diagnosis record via `state save` / commit so it survives the session.
- **Core-tier shape + `disable-model-invocation: true`** (M5-CC): real frontmatter only; `## Why this matters`; `## When to use this` (+ a "Don't"); numbered recommendation-first flow; navigation footer; no v1 frontmatter fields.

### Claude's Discretion (resolved in this research)
- **`init diagnose` orientation:** prefer the generic default case if it serves cleanly. **RESOLVED → NO engine change (see below, verified empirically).**
- **Isolation tactics to name:** `git bisect` ("worked before, broken now"); binary-search input/config; temporary assertion/log at the suspected boundary then remove it; read the stack to the first frame in the user's own code. Keep agnostic.
- **Where the diagnosis record lives:** lightweight note via engine `state save`/`commit` — don't invent storage.
- **Trigger entry points:** user-invoked `/diagnose` (a test fails, runtime error, flaky behavior; "I'm guessing at a fix").
- **`description` frontmatter:** lead with the use case, neutral name, within the listing cap.

### Boundaries vs siblings (keep distinct)
- `tdd` = tests for NEW behavior. `diagnose` = root cause of a FAILURE (may use `tdd` to lock the fix). `sentinel` = standards review after. `verify-self` = uncertainty about external behavior. diagnose ORCHESTRATES among them; never duplicates.

### Deferred (OUT OF SCOPE)
- `qa` skill (Phase 18); `security-design` enrichment (Phase 19).
- Any bundled debugger / test runner (engine never bundles language tooling).
- Auto-fixing without the user.
- A pre-flight gate blocking on open diagnoses (post-M5).
- An engine change (unless `init diagnose` genuinely needs a dedicated case — it does NOT, see below).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **DIAG-01** | `diagnose` runs the reproduce→isolate→hypothesis→fix→verify loop, stack-agnostic, over engine + `.sovereign/` state; composes with `tdd`/`verify-self`/`sentinel`; records the trail. | `init diagnose` default-case blob verified usable (no engine change); composition hooks confirmed by reading all three sibling SKILL.md; `state save` confirmed as the trail-persistence call; stack-agnostic pattern copied verbatim from `tdd` ("detect the project's existing test command; don't introduce a new framework"). |
| **M5-CC** | Core-tier thin-orchestrator shape per `skill-format.md`; `disable-model-invocation: true`; one orient call; "Why this matters"; recommendation-first; nav footer; `validate skills` passes; `doctor` auto-budget held at 5; no/minimal engine work. | `skill-format.md` required sections quoted below; `disable-model-invocation: true` confirmed via `anchor-docs`/`verify-self`/`bridge`; doctor baseline measured (18→19, auto stays 5, disabled 13→14); validate passes (frontmatter-only lint). NO engine work needed. |
</phase_requirements>

## Summary

Phase 17 is a **pure authoring task: one file, `engine/skills/diagnose/SKILL.md`, and zero engine code.** Every "how" question resolves to a pattern already shipped and read directly from the repo.

The single highest-risk open question — *does `init diagnose` work without an engine change?* — is **answered YES, empirically.** `init.cjs`'s `switch (workflow)` has a `default:` case that treats any unknown workflow name as a fast-lane skill stub and returns a clean, greenfield-safe nested blob (`models:{}`, the 4-flag `config` subset, `phase`, a `context_injection` with `manifest_path`+`glossary_path`, `paths` with `state`+`manifest`, the `exists` probes, and the `project_root`/`sovereign_version`/`agents_installed` wrapper). I scaffolded `.sovereign/` from `templates/sovereign` into a tmpdir and ran `node bin/sovereign-tools.cjs init diagnose --cwd <tmp>` — it returned the full blob with no error. **Verdict: NO `case 'diagnose':` is needed; the skill uses the default-case blob exactly like `tdd`/`sentinel`/`handoff` do.** No new init test is required (the default case is already covered).

**Primary recommendation:** Author `engine/skills/diagnose/SKILL.md` by mirroring `verify-self` (the freshest thin-orchestrator: HARD-STOP discipline + one-call orient + numbered flow + recommendation-first three-choice resolution + a rich footer) and `tdd` (stack-agnostic "use the project's own test runner" language). Set `disable-model-invocation: true`. Orient with one `init diagnose`. Encode the five steps as a numbered flow, recommendation-first. Reference `tdd`/`verify-self`/`sentinel` by name in the flow and footer. Persist the trail with `state save`. Run the three gates **from `engine/`**.

## Standard Stack

Not applicable — no libraries, no install. This is a hand-authored Markdown skill over the existing zero-dependency engine. The only "stack" is the shipped engine surface:

| Engine surface | Call | Purpose in diagnose |
|----------------|------|---------------------|
| `init.cjs` default case | `init diagnose` | One-call orient (config/phase/paths/context_injection/exists) |
| `state.cjs` | `state save` (bare; alias of `state patch`, regenerates MANIFEST) | Persist the diagnosis trail so it survives the session |
| `core.cjs` `commit` | `commit` | Commit the trail when `commit_docs` is on |

**No version verification needed** (no packages). Engine self-reports `sovereign_version: 2.3.0` in the init blob.

## Architecture Patterns

### File location and shape
`engine/skills/diagnose/SKILL.md` — a skill DIRECTORY (per `skill-format.md`: "Author each command as a skill directory, never a bare command file"). Shipped via the package `files` allowlist; `npx sovereign-cli init` copies it to `.claude/skills/`.

### The authoring contract (quoted from `engine/references/skill-format.md`)

**Frontmatter — real Agent Skills fields ONLY:**
- `name` ≤64 chars, lowercase-hyphen, MUST NOT contain "claude"/"anthropic" (enforced by `validate.cjs`: `NAME_PATTERN = /^[a-z0-9-]+$/`, `RESERVED = ['claude','anthropic']`).
- `description` — "lead with the trigger use-case, not the mechanism"; ≤1024 chars (`DESC_MAX`).
- `disable-model-invocation: true` — "makes a skill user-only (`/name`) and removes it from the auto-trigger listing budget. Set it for side-effecting orchestrators the model shouldn't fire on a hunch."
- `argument-hint` — OPTIONAL.

**Dropped v1 fields (do NOT use):** `triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`. "None are in the Agent Skills standard."

**The thin-body / single-`init`-load rule (HARD RULE), quoted:**
> A skill orients with **exactly one** call and reads nothing else to orient:
> ```bash
> INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init <skill-name>)
> if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
> ```
> All bookkeeping (state save, gate, commit, model resolution) is delegated to `sovereign-tools` — a skill never hand-writes state or branches on `commit_docs` itself.

**Required body sections, in order (quoted):**
1. `## Why this matters` — plain language; what goes wrong if you skip this.
2. `## When to use this` — genuine use-cases AND the anti-uses ("don't use it for…").
3. The flow — numbered orchestrator steps, delegating side effects to `sovereign-tools`.
4. A navigation footer — **recommendation-first**: recommended next action + the command, plus alternatives.

### The literal engine path (canonical, copy verbatim)
Every shipped skill invokes the engine via the literal installed path `node ".claude/sovereign-engine/sovereign-tools.cjs" …` — **NOT** `$ENGINE` or a variable. Confirmed identical across `tdd`, `verify-self`, `sentinel`, `anchor-docs`, `bridge`.

### How `tdd` stays stack-agnostic (the pattern to mirror, quoted)
- Frontmatter: `"Stack-agnostic — uses the project's own test runner."`
- Body §1: `"Detect the project's existing test command (don't introduce a new framework)."`
- Body intro: `"run the cycle using the project's own test runner (SOVEREIGN is stack-agnostic; it does not impose a framework or run the app itself)."`

`diagnose` mirrors this exactly: it tells the agent to **detect and use the project's own test/run command** (from STATE/config or the project's conventions) for both the repro and the verify steps. It NEVER names npm/pytest/cargo/go/etc.

### Recommendation-first pattern (the freshest example: `verify-self` step 5)
`verify-self` presents three resolutions and **marks the recommended one inline**: "(A) Provide docs → … *(Recommended when the doc is reachable.)*". `diagnose` should do the same in step 3 (Hypothesis): state the single most-likely root cause first, with the *why*, then any alternates as lower-probability — never a flat shotgun list.

### Anti-patterns to avoid
- **Shotgun hypothesis list.** DIAG-01's whole value is ONE testable hypothesis, recommendation-first.
- **Fixing the symptom.** Step 4 must address the root cause; flag symptom-patches.
- **Hardcoding a toolchain.** No `npm test`/`pytest`/`cargo test` literals — detect the project's command.
- **Fat body / multiple orient reads.** One `init diagnose` call only; read content only from paths it hands back.
- **Hand-writing state or branching on `commit_docs`.** Delegate to `sovereign-tools state save` / `commit`.
- **v1 frontmatter fields.** None.
- **Debugging the un-reproduced.** Step 1 must stop-and-say-so if there's no reliable repro.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Orientation | A custom multi-file read | One `init diagnose` call | Default case already returns the full blob (verified) |
| Persisting the trail | A bespoke debug-log file format | `sovereign-tools state save` (+ `commit`) | Engine owns MANIFEST regen + commit-doc branching |
| The diagnosis discipline | A fresh debugging methodology | The locked 5-step loop + `tdd`/`verify-self`/`sentinel` composition | DIAG-01 specifies it; siblings already implement the sub-steps |
| Writing the failing test | Inline test guidance | Hand off to `/tdd` | `tdd` owns red-green-refactor + "test behavior at the interface" |
| Marking unconfirmed root cause | A new marker scheme | `/verify-self` → `SOVEREIGN:UNVERIFIED` | `verify-self` owns the marker spec; `sentinel` scans it |
| Standards pass on the fix | A review checklist | `/sentinel` | `sentinel` owns the four native checks + verdict |

**Key insight:** diagnose's entire job is ORCHESTRATION + DISCIPLINE. Every side-effecting sub-capability already ships as a skill or an engine command. A reviewer must see diagnose *delegate*, not *duplicate*.

## The init-diagnose Verdict (Open Question #1 — RESOLVED)

**Question:** Does `init diagnose` (an unknown workflow name) return a usable orient blob via the default case, or error?

**Method:** Scaffolded `.sovereign/` from `templates/sovereign` into a tmpdir, then ran `node bin/sovereign-tools.cjs init diagnose --cwd <tmp>` from `engine/`.

**Actual output (verbatim, trimmed):**
```json
{
  "project_root": "<tmp>",
  "sovereign_version": "2.3.0",
  "models": {},
  "config": { "model_profile": "balanced", "commit_docs": true,
              "council_mode_default": "standard", "parallelization": true },
  "phase": { "current": 0, "name": "Setup", "gate_status": "Not started", "active_tracks": [] },
  "context_injection": { "manifest_path": ".sovereign/MANIFEST.md", "glossary_path": ".sovereign/CONTEXT.md" },
  "paths": { "state": ".sovereign/STATE.md", "manifest": ".sovereign/MANIFEST.md" },
  "exists": { "sovereign_dir": true, "manifest": true, "constitution": true, "glossary": true },
  "agents_installed": true, "missing_agents": []
}
```

**Why it works (from `init.cjs`):** the `switch (workflow)` `default:` branch (lines 414–433) catches any name not explicitly cased and builds the fast-lane stub blob; `withProjectContext` wraps it. `requiredAgentsFor('diagnose')` returns `[]` (not in `REQUIRED_AGENTS`), so `agents_installed` is `true` with no required agents — diagnose dispatches no subagent of its own (it hands to other *skills*, which is a user `/`-invocation, not an agent dispatch).

**VERDICT: NO engine change.** `diagnose` uses the default-case blob. Parse `config.commit_docs` (for the persist step), `context_injection.glossary_path` (project vocabulary in the diagnosis record), and `paths.state`. **No new init test needed** — the default case is already exercised by the existing 164-test suite; the engine stays at 164 green with deps `{}`.

> If a future maintainer *wanted* a richer blob (e.g. surfacing a detected test command), the minimal change would be a `case 'diagnose':` mirroring `anchor-docs` (lines 372–389) + an `init.cjs` test. **Not recommended for Phase 17** — it adds engine scope for no behavior the skill needs, and the project explicitly prefers no engine change.

## Recommended Authoring Artifacts (concrete)

### Frontmatter block (Open Question #2 — literal recommendation)
```yaml
---
name: diagnose
description: Debug a failure methodically instead of guessing — run a recommendation-first loop (reproduce → isolate → hypothesis → fix → verify) that finds the root cause, not the symptom, using your project's own test/run tooling. Use when a test fails, something errors at runtime, behavior is flaky, or you notice you're guessing at a fix.
disable-model-invocation: true
argument-hint: "[what's failing]"
---
```
- `name: diagnose` — passes `validate.cjs` (lowercase, no reserved word, ≤64).
- `description` leads with the use case, names the loop, ends with the trigger signals; well within 1024 chars and contributes ~310 chars to the listing — but since `disable-model-invocation: true`, it costs **zero** listing budget anyway.
- `argument-hint` optional but matches `verify-self` (`"[what you're unsure about]"`) and `anchor-docs`.

### The orient snippet (Open Question #3 — exact, copy verbatim)
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init diagnose)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Then: "Parse `config.commit_docs` and `context_injection.glossary_path`. **Detect the project's own test/run command** (from STATE/config or the project's conventions) — do not introduce a new framework or assume a toolchain." (This is the `tdd` stack-agnostic pattern, mirrored.)

### Composition hooks (Open Question #4 — exact by-name wiring)
In the FLOW:
- **Step 1 (Reproduce):** "Capture the bug as a failing test with **`/tdd`** (RED) so the repro is regression-proof, or pin a single failing command."
- **Step 4 (Fix):** "Drive the minimal root-cause fix test-first via **`/tdd`** (RED→GREEN) where it fits."
- **Step 5 (Verify):** "Re-run the repro/failing test (now green) AND the project's full suite (no regression). If you assumed the root cause but did NOT confirm it against authoritative behavior → hand to **`/verify-self`**, which marks the unconfirmed claim `SOVEREIGN:UNVERIFIED`. Then run **`/sentinel`** for the standards pass on the fix."

In the FOOTER (recommendation-first, mirroring `verify-self`'s rich footer):
```
▶ NEXT
  Root cause found and fixed; repro green, suite green (no regression).
  • Assumed the root cause but didn't confirm it? → /verify-self (marks it
    SOVEREIGN:UNVERIFIED so /sentinel surfaces it instead of shipping silently)
  • Fix ready for review? → /sentinel — standards + spec pass on the change
  • Need the fix locked as a test first? → /tdd (red→green→refactor)
  Couldn't reproduce? Stop — say so and gather a reliable repro before guessing.
```

### The diagnosis-trail persist step (Discretion — resolved)
End the flow with: "Record the trail — hypothesis, confirmed root cause, the fix, and the verification — as a short note, then `node ".claude/sovereign-engine/sovereign-tools.cjs" state save` (regenerates MANIFEST), and commit via `sovereign-tools commit` if `commit_docs` is on, so the diagnosis survives the session." Confirmed: bare `state save` is a valid alias of `state patch` that regenerates MANIFEST (state.cjs line 294 comment) — exactly how `anchor-docs`/`bridge` persist.

## Common Pitfalls

### Pitfall 1: Gates pass vacuously (run from the wrong directory)
**What goes wrong:** `doctor`/`validate skills` walk `<cwd>/.claude/skills` and `<cwd>/skills` (see `doctor.cjs` `checkBudget` + `validate.cjs` `validateSkills`). They do NOT walk `engine/skills/`. Run from repo root and they find 0 skills and pass meaninglessly.
**How to avoid:** Run every gate from `engine/` (which has `skills/`). Verified: `cd engine && node bin/sovereign-tools.cjs doctor` reports `total_skills: 18`. From repo root it would report 0.
**Warning sign:** `total_skills` < 19 after adding diagnose, or `checked` < 19.

### Pitfall 2: The `wc -l >= 70` line gate is a CONVENTION, not engine-enforced
**What goes wrong:** CONTEXT and the objective both assert `wc -l ≥ 70`. But this is NOT enforced anywhere in the engine, and **`tdd` ships at 67 lines and `sentinel` at 64** (measured). `skill-format.md` does not mention a 70-line rule.
**How to avoid:** Treat ≥70 as a quality target for *substance* (diagnose has plenty: 5 steps + isolation tactics + composition + persist will land well above 70 naturally — `verify-self`=83, `bridge`=83, `anchor-docs`=84 are the right comparators since diagnose is similarly rich). Do not pad to hit a number; do not block on it. If the Validation Architecture lists `wc -l >= 70`, it's a self-imposed structural assertion the author controls, not an external gate.
**Warning sign:** A thin body under ~60 lines means the flow is underspecified, not that a lint failed.

### Pitfall 3: Treating composition as duplication
**What goes wrong:** Authoring inline test-writing guidance, an inline marker scheme, or an inline review checklist — re-implementing `tdd`/`verify-self`/`sentinel`.
**How to avoid:** Reference the sibling skills BY NAME (`/tdd`, `/verify-self`, `/sentinel`); let them own their sub-steps. diagnose owns only the loop discipline and the orchestration.
**Warning sign:** The body explains how to write a test or how to format a marker.

### Pitfall 4: Hardcoding a toolchain
**What goes wrong:** Writing `npm test` / `pytest` / `cargo test` as literal commands.
**How to avoid:** Mirror `tdd` — "detect the project's existing test command; don't introduce a new framework." Reference the project's own tooling abstractly.
**Warning sign:** Any package-manager or test-runner literal in the body.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Engine + gates | ✓ | (project baseline ≥20; engine runs locally) | — |
| `sovereign-tools.cjs` engine | orient/state/commit/doctor/validate | ✓ | 2.3.0 (self-reported) | — |
| Shipped sibling skills (`tdd`, `verify-self`, `sentinel`) | composition | ✓ | present in `engine/skills/` | — |

No external/network dependencies. This is a code/doc-only phase. Engine test suite runs clean (164 pass).

## Validation Architecture

All assertions are grep/command-checkable. **CRITICAL caveat: run every `doctor`/`validate`/`test` command from `engine/`** (gates walk `<cwd>/skills`, not `engine/skills/`). `SKILL` below = `engine/skills/diagnose/SKILL.md`.

### Structural gates (→ Success Criterion 3, M5-CC)
| Assertion | Check |
|-----------|-------|
| SKILL.md exists | `test -f engine/skills/diagnose/SKILL.md` |
| `disable-model-invocation: true` present | `grep -q '^disable-model-invocation: true$' SKILL` |
| Has `## Why this matters` | `grep -q '^## Why this matters$' SKILL` |
| Has `## When to use this` (with a "Don't") | `grep -q '^## When to use this$' SKILL` and `grep -qi 'don.t' SKILL` |
| Navigation footer present | `grep -q '▶ NEXT' SKILL` |
| Substance target (convention, NOT engine-enforced — see Pitfall 2) | `[ "$(wc -l < SKILL)" -ge 70 ]` |
| No v1 frontmatter fields | `! grep -qE '^(triggers|works-best-with|min-model|tokens|phase):' SKILL` |
| Literal engine path (not `$ENGINE`) | `grep -q '\.claude/sovereign-engine/sovereign-tools\.cjs' SKILL` and `! grep -q '\$ENGINE' SKILL` |
| Exactly one orient call | `grep -c 'init diagnose' SKILL` ≥ 1 and the `@file:` guard present: `grep -q 'INIT == @file:' SKILL` |

### Behavior-in-prose gates (→ Success Criterion 1)
| Assertion | Check |
|-----------|-------|
| Five steps present AND ordered (reproduce→isolate→hypothesis→fix→verify) | `grep -niE 'reproduce\|isolate\|hypothesis\|fix\|verify' SKILL` returns the five in ascending line order (manual/scripted order check) |
| Recommendation-first | the Hypothesis step states ONE most-likely cause first (prose check); footer leads with the recommended next action (`▶ NEXT` first line is the recommended action) |
| Stack-agnostic — uses project's own tooling | `grep -qi 'project.s own' SKILL` AND no hardcoded runner: `! grep -qE '\b(npm test\|pytest\|cargo test\|go test\|jest\|vitest\|mvn|gradle)\b' SKILL` |
| Root-cause-not-symptom | `grep -qi 'root cause' SKILL` AND `grep -qi 'symptom' SKILL` |
| Verify includes no-regression | `grep -qi 'regression' SKILL` AND `grep -qi 'suite' SKILL` |

### Composition gates (→ Success Criterion 2)
| Assertion | Check |
|-----------|-------|
| References `tdd` by name | `grep -q '/tdd' SKILL` (or `\btdd\b`) |
| References `verify-self` by name | `grep -q '/verify-self' SKILL` (or `verify-self`) |
| References `sentinel` by name | `grep -q '/sentinel' SKILL` (or `sentinel`) |
| One-call orient is `init diagnose` | `grep -q 'init diagnose' SKILL` |
| Mentions `SOVEREIGN:UNVERIFIED` marker path | `grep -q 'SOVEREIGN:UNVERIFIED' SKILL` |

### Budget / lint / engine gates (RUN FROM `engine/`) (→ Success Criterion 3, M5-CC)
| Assertion | Command (from `engine/`) | Expected |
|-----------|--------------------------|----------|
| doctor auto-budget held at 5 | `node bin/sovereign-tools.cjs doctor` | `auto_count: 5`, `total_skills: 19`, `disabled_count: 14`, `ok: true`, `warnings: []` |
| validate skills passes | `node bin/sovereign-tools.cjs validate skills` | `valid: true`, `checked: 19`, `violations: []` |
| validate the file specifically | `node bin/sovereign-tools.cjs validate skills skills/diagnose/SKILL.md` | `valid: true` |
| Engine suite still green | `node --test "test/**/*.test.cjs"` | `pass 164`, `fail 0` (no new init case → no new test → stays 164) |

**Measured baseline (before diagnose, from `engine/`):** `total_skills: 18, auto_count: 5, disabled_count: 13`. Adding diagnose with `disable-model-invocation: true` → `total_skills: 19, auto_count: 5 (UNCHANGED), disabled_count: 14`. Confirms the budget is held at 5.

## State of the Art

No moving ecosystem — this is internal authoring. The "current approach" is the M4 hand-authored skill pattern (`verify-self`, Phase 16) which is the freshest exemplar:

| Older shape | Current shape (mirror this) | Why |
|-------------|------------------------------|-----|
| `tdd`/`sentinel` (M1) — solid but terse footers, no HARD-STOP framing | `verify-self` (M4) — HARD-STOP step, recommendation-marked choices, rich multi-branch footer | diagnose has the same "stop guessing / be deliberate" character as verify-self; copy its discipline framing |

## Open Questions

All five seeded open questions are **RESOLVED**:
1. `init diagnose` engine change? → **NO** (default case verified usable).
2. Frontmatter block? → **provided above** (literal).
3. Orient snippet + agnostic tooling reference? → **provided** (mirrors `tdd`).
4. Composition hooks by name? → **provided** (flow + footer wiring).
5. doctor stays 5 / validate passes? → **YES**, measured (18→19, auto 5, disabled 13→14).

Remaining minor judgment for the author (not blocking):
- **Exact diagnosis-record location.** Recommendation: a short inline note in the flow persisted via `state save` (+ commit if `commit_docs`). Do NOT invent a new file format. (Discretion area; lightweight reuse of the engine is locked.)

## Sources

### Primary (HIGH confidence — read directly / run live)
- `engine/bin/lib/init.cjs` (full) — the `switch (workflow)` + `default:` case (lines 414–433); `REQUIRED_AGENTS`/`requiredAgentsFor` (diagnose → `[]`); `withProjectContext`. **HIGH.**
- **Live run:** `node bin/sovereign-tools.cjs init diagnose --cwd <scaffolded tmp>` — verbatim blob captured above. **HIGH (empirical).**
- **Live run:** `cd engine && node bin/sovereign-tools.cjs doctor` → 18/5/13; `validate skills` → valid, checked 18; `node --test` → 164 pass. **HIGH (empirical).**
- `engine/bin/lib/doctor.cjs` — `checkBudget` walks `<cwd>/.claude/skills`+`<cwd>/skills`; `disable-model-invocation` removes from `auto_count`; `AUTO_MAX=7`. **HIGH.**
- `engine/bin/lib/validate.cjs` — frontmatter-only lint (name pattern/length/reserved, desc length); walks the same dirs. **HIGH.**
- `engine/bin/lib/state.cjs` — bare `state save` = `state patch` alias, regenerates MANIFEST (line 294). **HIGH.**
- `engine/references/skill-format.md` — required sections, frontmatter rules, single-init-load HARD RULE, dropped v1 fields, recommendation-first footer. Quoted. **HIGH.**
- `engine/references/listing-budget.md` — `disable-model-invocation` convention; `AUTO_MAX`/`TOKEN_BUDGET`. **HIGH.**
- `engine/skills/{tdd,verify-self,sentinel,anchor-docs,bridge}/SKILL.md` — patterns to mirror; line counts measured (tdd 67, sentinel 64, verify-self 83, anchor-docs 84, bridge 83). **HIGH.**
- `.planning/phases/17-diagnose-skill/17-CONTEXT.md`, `.planning/ROADMAP.md` (Phase 17), `.planning/REQUIREMENTS.md` (DIAG-01, M5-CC), `CLAUDE.md`. **HIGH.**

### Secondary / Tertiary
- None. Every claim is verified against the repo or a live engine run; no web sources were needed (this is an in-repo authoring task, not a web survey).

## Metadata

**Confidence breakdown:**
- `init diagnose` verdict (no engine change): **HIGH** — empirically run, output captured.
- Frontmatter / orient / composition / footer patterns: **HIGH** — copied from shipped, validated skills.
- Budget/lint/test gates: **HIGH** — measured baseline; arithmetic of +1 disabled skill is deterministic.
- `wc -l >= 70`: flagged **MEDIUM** as a convention (not engine-enforced; two shipped skills are below it).

**Research date:** 2026-06-09
**Valid until:** Stable — internal authoring against a frozen engine; revisit only if the engine adds a `case 'diagnose':` or the skill-format reference changes.
