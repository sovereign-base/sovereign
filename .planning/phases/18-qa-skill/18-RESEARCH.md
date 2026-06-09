# Phase 18: `qa` skill - Research

**Researched:** 2026-06-09
**Domain:** SOVEREIGN thin-orchestrator skill authoring (hand-authored SKILL.md, stack-agnostic correctness sweep)
**Confidence:** HIGH (all claims verified by reading shipped artifacts + live engine runs)

## Summary

Phase 18 is a **hand-authored SKILL.md authoring task**, not a web survey. The content is fully determined: the user's verbatim spec (`qa-skill-source-spec.md`), the locked CONTEXT decisions, and the three ROADMAP success criteria. The job is to translate that spec into SOVEREIGN's proven thin-orchestrator shape — mirroring the shipped `diagnose` / `sentinel` / `tdd` skills exactly — and to confirm the verification gates hold.

All six open questions are resolved with concrete, verified answers. The headline finding: **NO engine change is needed.** `init qa` was run live against a scaffolded tmp `.sovereign/` and returns a usable orient blob via the `switch (workflow)` **default case** in `engine/bin/lib/init.cjs` (exit 0), exactly as `init diagnose` does (diagnose has no dedicated case either — verified by absence in init.cjs). The default case surfaces `context_injection.manifest_path` + `glossary_path` and `project_root` — enough to orient. The cross-workspace API-contract check points at `.sovereign/docs/api/API_SPEC.md`, a literal path the skill states directly (the default-case blob does NOT surface an `api_spec` path; the skill hardcodes the known location, which is fine and matches how `verify-self` references `references/unverified-marker.md`).

Doctor currently reports `total_skills: 19, auto_count: 5, disabled_count: 14` (verified live from `engine/`). Adding `qa` with `disable-model-invocation: true` yields **20 / 5 / 15** — auto-budget held at 5. Engine suite is **164 green** (verified live). `validate skills` passes for any skill with a valid lowercase-hyphen name + sub-1024-char description.

**Primary recommendation:** Author `engine/skills/qa/SKILL.md` mirroring `diagnose`'s exact shape (frontmatter with `disable-model-invocation: true` + `argument-hint`, `## Why this matters` → `## When to use this` → `## The flow` (one-call `init qa` orient + the 5-category sweep, recommendation-first) → embedded report skeleton → `▶ NEXT` navigation footer). NO `init.cjs` change. Run all three gates from `engine/`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QA-01 | Stack-agnostic repo-wide correctness sweep over 5 check categories per workspace/module using the project's own toolchain; ✅/❌/⚠️ report grouped module→category, ❌ with exact error + `file:line`, one-line verdict; delegates to project's own `qa` command else per-module equivalents; composes with `diagnose`, complements `sentinel` | The source spec + CONTEXT lock all 5 categories verbatim (see Architecture Patterns below); `tdd`/`diagnose` show the agnostic "project's own tooling" phrasing to mirror; report skeleton provided below; composition footer pattern from `diagnose` |
| M5-CC | Core-tier thin-orchestrator shape per skill-format.md: one `init <skill>` orient, `## Why this matters`, recommendation-first, navigation footer; `disable-model-invocation: true` so doctor holds auto-budget at 5; `validate skills` passes; no/minimal engine work | Frontmatter block + body section order + one-call orient snippet all pinned below from the shipped siblings; live doctor/validate/test runs confirm gates hold with NO engine change |
</phase_requirements>

## User Constraints (from CONTEXT.md)

### Locked Decisions (NON-NEGOTIABLE)

**The five check categories**, per workspace/module, using whatever toolchain that module uses (stack-agnostic — never a hardcoded runner):
1. **Static correctness** — compile / type-check in no-output/check mode; validate schema definitions (DB, serialization, config) against their tooling; run the configured linter (surface errors).
2. **Tests** — run the module's unit + integration/component suites.
3. **Dependency & wiring integrity** — DI/service/provider wiring registered+imported+exported where the framework requires; every import resolves to a real installed module (no "module not found"); matched-version requirements agree exactly; example/template config (`.env.example`, sample config) cross-checked against what the code actually reads at runtime.
4. **Navigation / routing** — every route/link/navigation target referenced in code maps to a real, registered destination.
5. **Cross-workspace consistency** — a shared runtime resolves to exactly ONE version across modules; shared/contract types match producers↔consumers; data-model fields (DB/API) match their type/interface definitions; endpoint request/response shapes match the documented API contract at **`.sovereign/docs/api/API_SPEC.md`** (NOT `docs/api-contract.md`).

- **Run the project's own `qa` command when present** (e.g. `make qa` / a configured script / a task runner — detect, don't assume) from the repo root for a full sweep; **else run the per-module equivalents**. Stack-agnostic throughout.
- **Report format:** group by workspace/module, then by check category. `✅` pass, `❌` failure with the **exact error + `file:line`**, `⚠️` warning (non-blocking). End with a **one-line overall verdict** (pass / fail with N blocking issues).
- **One-call orient** — first action is a single `node ".claude/sovereign-engine/sovereign-tools.cjs" init qa` (with `@file:` guard); then read only what it points to (e.g. `API_SPEC.md`, glossary).
- **Composition** — failures hand off to `/diagnose`; `qa` is the **mechanical correctness** complement to `/sentinel` (standards/judgment) and `/tdd` (test-first). Footer makes this legible.
- **Core-tier shape + `disable-model-invocation: true`** (M5-CC): real frontmatter only; `## Why this matters`; `## When to use this` (+ a "Don't"); `## The flow` (recommendation-first); navigation footer; `wc -l` ≥ 70; no v1 frontmatter fields.

### Claude's Discretion (resolved in this research)
- **`init qa` orientation:** RESOLVED → use the generic `init` default case. NO dedicated `case 'qa':` in init.cjs (default-case blob is sufficient; the API_SPEC path is stated literally in the skill body). See Open Questions Q1.
- **Workspace/module discovery:** describe agnostically — detect repo structure from the project's own manifests/config; don't assume npm workspaces.
- **"The project's own qa command":** describe how to detect generically (check common task-runner manifests); fall back to per-module equivalents. Name the idea, not a tool.
- **Report skeleton:** concrete copyable template provided below (Code Examples).
- **Trigger entry points:** before a commit/PR/build, after a big change, when wiring feels shaky.
- **`description` frontmatter:** lead with the use case (catch errors before a running build), neutral name, within the cap.

### Deferred Ideas (OUT OF SCOPE)
- `security-design` enrichment (Phase 19).
- A pre-flight gate that BLOCKS on a failing `qa` / a `qa --fix` auto-repair (post-M5).
- An engine-side `qa` runner or results store (never — the project's own tooling + the agent's inspection do the work).

## Project Constraints (from CLAUDE.md)

- **Engine stays zero-dependency.** No bundled test runner / linter / type checker — `qa` drives the project's OWN toolchain. (Reinforces QA-01's stack-agnostic mandate and the M5 non-goal.)
- **Skill frontmatter: real Agent Skills fields only.** `name` ≤64 chars, lowercase-hyphen, no `claude`/`anthropic`; `description` leads with use case, within cap. NO v1 fields (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`).
- **Author as a skill directory** (`engine/skills/qa/SKILL.md`), never a bare command file.
- **`disable-model-invocation: true`** for user-only / side-effecting orchestrators — keeps the listing budget at 5 (ADR-014 / listing-budget.md).
- **Literal engine path** in the body: `.claude/sovereign-engine/sovereign-tools.cjs` (the installed location), not a `$ENGINE` variable or `engine/bin/...`.
- **Model-agnostic body:** the non-Claude path must work — "read SKILL.md, run `init qa`, follow the steps." Don't depend on Claude-only frontmatter for correctness.

## Standard Stack

Not applicable in the usual sense — this is an authoring task, not a library-selection task. The "stack" is fixed by CLAUDE.md and the shipped engine:

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Engine (`sovereign-tools.cjs`) | 2.3.0 (verified `cat engine/VERSION`) | Orient via `init qa` | Zero-dep CommonJS; the `init` default case already serves unknown workflow names |
| Agent Skills frontmatter | n/a | `name` + `description` + `disable-model-invocation` + `argument-hint` | The only real public surface; `validate skills` enforces the constraints |
| Markdown SKILL.md body | n/a | The skill itself | Hand-authored, mirrors shipped siblings |

**No installation.** No new dependencies (engine deps stay `{}`). No `npm install`.

## Architecture Patterns

### File location
```
engine/skills/qa/SKILL.md       # the one deliverable
```
Shipped via the package `files` allowlist; `npx sovereign-cli init` copies it to `.claude/skills/`.

### Pattern 1: The frontmatter block (Q2 — copyable)

Mirror `diagnose` exactly. Recommended literal block:

```yaml
---
name: qa
description: Sweep the whole repo for correctness before it fails in a running build — typecheck/compile, schema, lint, tests, broken imports and wiring, missing config, dead routes, and cross-workspace/contract drift — using the project's own toolchain, reporting ✅/❌/⚠️ with file:line. Use before a commit, PR, or build, after a big change, or when wiring feels shaky.
disable-model-invocation: true
argument-hint: "[module or path to scope the sweep]"
---
```
- `name: qa` — lowercase, 2 chars, passes `^[a-z0-9-]+$`, no reserved words. ✓
- `description` leads with the use case ("Sweep the whole repo for correctness before it fails in a running build"). At ~330 chars it is well under the 1024 API cap and the validate `DESC_MAX`. ✓ (diagnose's is ~360 chars and passes.)
- `disable-model-invocation: true` — MANDATORY (M5-CC; keeps auto-budget at 5). Note: `sentinel` is Fast Lane and OMITS this — do NOT copy sentinel's frontmatter; copy `diagnose`'s. ✓
- `argument-hint` — OPTIONAL but recommended (both `diagnose` and `anchor-docs` use it). Lets the user scope the sweep to a module.

### Pattern 2: Body section order (from skill-format.md + every sibling)

Required, in order:
1. `## Why this matters` — plain language; what goes wrong if you skip a correctness sweep (you ship plausible-but-broken code; the failure shows up in a running build, not review).
2. `## When to use this` — the trigger signals + a `**Don't**` line (don't use it for standards/judgment → that's `/sentinel`; don't use it to debug ONE failure → that's `/diagnose`; don't use it to write new tests → that's `/tdd`).
3. `## The flow` — numbered orchestrator steps, recommendation-first, delegating side effects to the engine. (diagnose/tdd/sentinel all use a bold-numbered `**1 — …**` list.)
4. A `## Navigation` footer with a `▶ NEXT` recommendation-first block.

### Pattern 3: One-call orient (Q3 — copyable, hard rule)

Exact snippet (literal installed engine path + `@file:` guard), copied from `diagnose`:

```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init qa)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Then read only what it points to (`context_injection.glossary_path`, `manifest_path`) — and the literal `.sovereign/docs/api/API_SPEC.md` for the contract check. No other orientation reads.

### Pattern 4: Agnostic command-detection language (Q5)

Mirror `tdd`/`diagnose`'s phrasing — describe each check as a **class**, never a tool. Recommended body language for the "detect the project's own qa command" step:

> **Run the project's own `qa` command if it has one.** Detect it from the project's task-runner/manifest (a configured `qa`/`check`/`verify` script or task target) and run it from the repo root for a full sweep. SOVEREIGN imposes no runner — use whatever this project already uses. **If there is no project-level `qa` command, run the per-module equivalents below**, one workspace/module at a time, using each module's own toolchain.

And for each category, class-level phrasing (NO `npm test` / `pytest` / `jest` / `go test` / `cargo test` / `vitest` / `mvn` / `gradle` as a default):
- Static correctness → "run the language's compiler or type checker in check/no-emit mode; validate schema definitions against their own tooling; run the configured linter and surface errors."
- Tests → "run the module's unit and integration/component test suites with its own runner."
- Dependency & wiring → "confirm every import resolves to a real installed module; verify DI/service/provider registration where the framework requires it; check matched-version constraints agree; cross-check the example/template config against what the code reads at runtime."
- Navigation/routing → "confirm every route/link/navigation target referenced in code maps to a real, registered destination."
- Cross-workspace → "a shared runtime resolves to exactly one version across modules; shared/contract types match producers↔consumers; schema fields match their type/interface definitions; endpoint shapes match `.sovereign/docs/api/API_SPEC.md`."

### Anti-patterns to avoid
- **Hardcoding a runner** (`npm test`, `pytest`, etc.) as THE command → violates stack-agnostic; mention only as parenthetical *examples* ("e.g. `make qa`, a `qa` script, a task target") never as the default.
- **Reimplementing a linter/test runner in the skill** → the skill ORCHESTRATES the project's tooling + inspects output; it never bundles tooling (CLAUDE.md / M5 non-goal).
- **Copying `sentinel`'s frontmatter** (no `disable-model-invocation`) → would push auto_count to 6.
- **Using `$ENGINE` or `engine/bin/...`** → use the literal `.claude/sovereign-engine/sovereign-tools.cjs`.
- **Fat body / multiple orientation reads** → exactly one `init qa` call to orient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Orientation (models/config/phase/paths) | Manual file reads | One `init qa` call (default case) | Single-call orient is the core value; default case already returns a usable blob |
| `>50KB` output handling | Manual chunking | The `@file:` guard line | `output()` already spills; the guard line consumes it |
| Running tests / typechecks / lint | An engine-side runner | The **project's own** toolchain, invoked by the agent | Engine is zero-dep, never bundles language tooling (CLAUDE.md) |
| State/commit | Hand-written state writes | `sovereign-tools state save` / `commit` | All bookkeeping is delegated (skill-format.md) |
| API-contract comparison store | A results DB | Read `.sovereign/docs/api/API_SPEC.md` + inspect code | M5 non-goal: no engine-side qa runner/results store |

**Key insight:** `qa` is a *thin orchestrator + inspector*. Its value is COVERAGE + DISCIPLINE + a consistent report — not new machinery. Every category runs the project's own tools; the engine only orients.

## Common Pitfalls

### Pitfall 1: Running the gates from the repo root instead of `engine/`
**What goes wrong:** `doctor`/`validate` walk `<cwd>/skills` and `<cwd>/.claude/skills` (verified in doctor.cjs L77-78 and validate.cjs L137-138). The repo root has no `skills/` dir — only `engine/skills/` does. From the root the gates pass **vacuously** (`total_skills: 0`) and `doctor` exits 0 regardless of warnings.
**How to avoid:** Run all gates from `engine/`: `cd engine && node bin/sovereign-tools.cjs doctor`. ASSERT `auto_count == 5` and `total_skills == 20` in the JSON — don't trust the exit code alone.
**Warning signs:** `total_skills: 0` or `19` (means qa not seen / not added).

### Pitfall 2: Forgetting `disable-model-invocation: true`
**What goes wrong:** `qa` becomes auto-triggerable → `auto_count` jumps to 6 (still under AUTO_MAX 7, so doctor wouldn't *error* — but it breaks the M5-CC "held at 5" success criterion).
**How to avoid:** Set the flag (verified: doctor's `isInvocationDisabled` matches the literal string `true`). Confirm `disabled_count == 15` after adding.

### Pitfall 3: Drifting the report format
**What goes wrong:** Output becomes a vague "check the code" prose dump; loses the ✅/❌/⚠️ + `file:line` + verdict discipline QA-01 requires.
**How to avoid:** Embed the concrete report skeleton (below) IN the skill body so every run/agent produces the same shape. `sentinel` does this (its `SENTINEL REPORT` block).

### Pitfall 4: Adding a dedicated `init qa` case unnecessarily
**What goes wrong:** Expands engine scope, adds a test, risks the 164-green count for zero benefit.
**How to avoid:** The default case is sufficient (Q1, verified live). Do NOT touch init.cjs.

## Code Examples

### One-call orient (verified working — exact body snippet)
```bash
# Source: engine/skills/diagnose/SKILL.md L30-33 (mirror verbatim, swap the workflow name)
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init qa)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

### Report skeleton to embed in the skill (Q4 — copyable)
A concrete template (module → category → ✅/❌/⚠️ with file:line → one-line verdict), modeled on sentinel's structured-verdict block:

```
QA SWEEP — <repo or scope>
Toolchain: <project qa command | per-module equivalents>

── <workspace/module A> ───────────────────────────────
  Static correctness   ✅ typecheck · ✅ schema · ❌ lint
     ❌ src/api/user.ts:42 — 'unused import "Foo"' (no-unused-vars)
  Tests                ✅ 128 passed
  Dependency & wiring  ❌ src/db/client.ts:7 — cannot resolve 'pg-native' (module not found)
                       ⚠️ .env.example missing STRIPE_KEY read at src/pay.ts:15
  Navigation/routing   ✅ all routes resolve
  Cross-workspace      ✅ (covered in the cross-workspace section)

── <workspace/module B> ───────────────────────────────
  Static correctness   ✅ · ✅ · ✅
  Tests                ⚠️ 2 skipped
  Dependency & wiring  ✅
  Navigation/routing   ✅
  Cross-workspace      ✅

── CROSS-WORKSPACE CONSISTENCY ────────────────────────
  Shared-runtime version  ❌ react 18.2.0 (web) vs 18.3.1 (admin) — must match
  Shared/contract types   ✅
  Schema ↔ types          ✅
  API contract            ❌ POST /users response missing `createdAt`
                          (src/api/user.ts:55 vs .sovereign/docs/api/API_SPEC.md:120)

── VERDICT ────────────────────────────────────────────
  FAIL — 4 blocking issues (hand each ❌ to /diagnose)
```

### Navigation footer (Q4 — copyable; mirrors diagnose's footer + composition)
```
▶ NEXT
  Verdict: <PASS | FAIL with N blocking>
  PASS:  continue — /sentinel for the standards pass, or proceed to commit/PR.
  FAIL:  take each ❌ to /diagnose (reproduce → isolate → fix → verify) — qa finds
         breakage broadly; diagnose fixes one root cause at a time.

  qa is the mechanical-correctness sweep. Its complements:
  • /diagnose — debug a specific failure qa surfaced.
  • /sentinel — judge the result against your standards (qa = does it work;
    sentinel = is it right).
  • /tdd      — when a fix needs new behavior, drive it test-first.
```

## State of the Art

Not applicable — no external-library currency concerns. The "state of the art" is the shipped sibling set:

| Reference | Current shape | Impact |
|-----------|---------------|--------|
| `diagnose` (Phase 17, freshest) | `disable-model-invocation: true` + `argument-hint`; bold-numbered flow; one-call orient; `▶ NEXT` footer; 82 lines | The template to copy 1:1 |
| `sentinel` | Fast Lane (NO disable flag); embedded `SENTINEL REPORT` block; PASS/CONDITIONAL/BLOCKED verdict | Copy the *report-block* idea + verdict style; do NOT copy its frontmatter |
| `tdd` | Agnostic "project's own test runner" phrasing | Copy the agnostic command language |
| `init.cjs` default case | Serves any unknown workflow name with a usable blob | No engine change for `qa` |

## Open Questions (all RESOLVED)

### Q1 — `init qa`: engine change or not? → **NO engine change.**
- **What we know:** `init.cjs` has explicit cases for council/sovereign-init/bridge/adopt/extension/anchor-docs/verify-self, then a `default` case (L414-433) for "any other arg treated as a fast-lane skill name." `diagnose` has NO dedicated case yet ships and works (verified: no `case 'diagnose'` in init.cjs).
- **What's verified:** Ran `node bin/sovereign-tools.cjs init qa --cwd <scaffolded tmp>` → returned a complete blob (`project_root`, `sovereign_version: 2.3.0`, `models: {}`, `config`, `phase`, `context_injection` with `manifest_path` + `glossary_path`, `paths.state` + `paths.manifest`, `exists`, `agents_installed: true`), **exit 0**.
- **Recommendation:** Use the default case. The API_SPEC path (`.sovereign/docs/api/API_SPEC.md`) is stated literally in the skill body — the default blob does NOT surface an `api_spec` path, and adding a dedicated case just to surface one path is not warranted (CONTEXT discretion: "default to NO engine change"). This mirrors how `verify-self` hardcodes `references/unverified-marker.md`. Keep engine deps `{}` and the 164-test count intact.
- *(Minor note: the scaffolded `--cwd` run reported `phase.current: 0 / Setup` because the test STATE.md field format didn't match `readField`'s expectation — irrelevant to qa; the orient blob is still complete and usable.)*

### Q6 — Does doctor stay at auto_count 5 / total 20 / disabled 15, and validate pass?
- **Verified live (from `engine/`):** current doctor = `total_skills: 19, auto_count: 5, disabled_count: 14, ok: true`. Adding `qa` with `disable-model-invocation: true` → `total_skills: 20, auto_count: 5, disabled_count: 15`. ✓
- `validate skills` passes for any file with a valid name + sub-1024 description (verified the lint logic + a live `validate skills skills/diagnose/SKILL.md` → `valid: true`). `qa`'s proposed frontmatter satisfies all constraints. ✓
- Engine suite: **164 pass / 0 fail** (verified live `node --test "test/**/*.test.cjs"`). No change since no engine edit. ✓

## Environment Availability

Authoring task — only the local engine + Node are needed, both present.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Run engine gates | ✓ | (engine runs; tests pass) | — |
| `sovereign-tools` engine | doctor/validate/init/test gates | ✓ | 2.3.0 | — |
| `.sovereign/docs/api/API_SPEC.md` | The cross-workspace API-contract check *target* (runtime, in a consuming project) | n/a here | — | Skill states the literal path; absent in greenfield → check is a no-op, report ⚠️/skip |

No external tools, services, or network needed. Hand-authoring + local gates only.

## Validation Architecture

> nyquist_validation is not explicitly disabled in config; this section is included. These are SKILL-phase gates (grep/command-checkable), each mapped to a Phase 18 success criterion (SC1 = the 5-category sweep + report; SC2 = report format + agnostic delegation; SC3 = thin-orchestrator shape + budget + composition).

### "Test framework" for this phase
| Property | Value |
|----------|-------|
| Framework | `node --test` (engine) + grep/`wc`/`node bin/sovereign-tools.cjs` assertions on the SKILL.md |
| Config file | none — `node:test` built in |
| Quick run command | `cd engine && node bin/sovereign-tools.cjs validate skills skills/qa/SKILL.md` |
| Full suite command | `cd engine && node --test "test/**/*.test.cjs"` |

### Phase Requirements → Gate Map

**Structural (SC3 / M5-CC) — run from repo root, paths relative to it:**
| Check | Command-checkable assertion |
|-------|-----------------------------|
| SKILL.md exists | `test -f engine/skills/qa/SKILL.md` |
| `disable-model-invocation: true` | `grep -qE '^disable-model-invocation:[[:space:]]*true' engine/skills/qa/SKILL.md` |
| `## Why this matters` present | `grep -qF '## Why this matters' engine/skills/qa/SKILL.md` |
| `## When to use this` present | `grep -qF '## When to use this' engine/skills/qa/SKILL.md` |
| Navigation footer present | `grep -qF '▶ NEXT' engine/skills/qa/SKILL.md` |
| Line gate ≥ 70 | `[ "$(wc -l < engine/skills/qa/SKILL.md)" -ge 70 ]` |
| No v1 fields | `! grep -qE '^(triggers|works-best-with|min-model|tokens|phase):' engine/skills/qa/SKILL.md` |
| Literal engine path (not `$ENGINE`) | `grep -qF '.claude/sovereign-engine/sovereign-tools.cjs' engine/skills/qa/SKILL.md` && `! grep -qF '$ENGINE' engine/skills/qa/SKILL.md` |
| One-call `init qa` orient | `grep -qE 'init qa' engine/skills/qa/SKILL.md` (expect exactly one orient invocation; `@file:` guard line present: `grep -qF '@file:' engine/skills/qa/SKILL.md`) |
| `name: qa` | `grep -qE '^name:[[:space:]]*qa[[:space:]]*$' engine/skills/qa/SKILL.md` |

**Coverage-in-prose (SC1 + SC2) — the body names every category + the report discipline:**
| Check | Command-checkable assertion (case-insensitive, tolerant of prose) |
|-------|------------------------------------------------|
| All 5 categories named | `grep -qiF 'static correctness'` · `grep -qiF 'tests'` · `grep -qiE 'wiring|dependency'` · `grep -qiE 'routing|navigation'` · `grep -qiE 'cross-workspace'` — all against the SKILL.md |
| API-contract source path | `grep -qF '.sovereign/docs/api/API_SPEC.md' engine/skills/qa/SKILL.md` |
| Reports all three glyphs | `grep -qF '✅'` && `grep -qF '❌'` && `grep -qF '⚠️'` |
| `file:line` discipline | `grep -qiF 'file:line' engine/skills/qa/SKILL.md` |
| One-line verdict | `grep -qiE 'verdict' engine/skills/qa/SKILL.md` |
| "project's own" qa command + fallback | `grep -qiE "project.?s own" engine/skills/qa/SKILL.md` && `grep -qiE 'per-module' engine/skills/qa/SKILL.md` |
| Stack-agnostic — NO hardcoded default runner | `! grep -qiE '\b(npm test\|pytest\|jest\|go test\|cargo test\|vitest\|mvn\|gradle)\b'` as a **default** — caveat: these MAY appear as parenthetical *examples*; assert they are not presented as THE command. Manual eyeball recommended over a brittle grep here; if asserting, scope to lines NOT containing "e.g." |

**Composition (SC3):**
| Check | Assertion |
|-------|-----------|
| References `diagnose` by name | `grep -qF '/diagnose' engine/skills/qa/SKILL.md` (or `grep -qiF 'diagnose'`) |
| References `sentinel` by name | `grep -qF '/sentinel' engine/skills/qa/SKILL.md` (or `grep -qiF 'sentinel'`) |

**Budget / lint / suite (SC3 / M5-CC) — RUN FROM `engine/`:**
| Check | Command + asserted value |
|-------|--------------------------|
| doctor auto_count == 5 | `cd engine && node bin/sovereign-tools.cjs doctor` → assert `"auto_count": 5` AND `"total_skills": 20` AND `"disabled_count": 15`. **Caveat:** run from `engine/` (else walks an empty `skills/` → vacuous pass); `doctor` exits 0 regardless of warnings, so ASSERT the JSON field, don't trust exit code. |
| validate skills passes | `cd engine && node bin/sovereign-tools.cjs validate skills skills/qa/SKILL.md` → assert `"valid": true` (exits 0). |
| engine suite 164 green | `cd engine && node --test "test/**/*.test.cjs"` → assert `pass 164`, `fail 0`. (No new test unless a dedicated `init qa` case is added — which this research recommends AGAINST.) |

### Wave 0 Gaps
- None for the engine — no engine change, so no new `node:test` file. Existing 164-test infrastructure + doctor/validate cover all phase gates.
- The only new artifact is `engine/skills/qa/SKILL.md` itself; its "tests" are the grep/command assertions above (no separate test file needed for a SKILL.md).

## Sources

### Primary (HIGH confidence — read directly / run live)
- `engine/skills/diagnose/SKILL.md` — the 1:1 template (frontmatter, flow shape, one-call orient, footer, composition). Read fully.
- `engine/skills/sentinel/SKILL.md` — report-block + verdict style; Fast-Lane frontmatter (the one NOT to copy). Read fully.
- `engine/skills/tdd/SKILL.md` — agnostic "project's own test runner" language. Read fully.
- `engine/skills/anchor-docs/SKILL.md` — `argument-hint` + literal-path + `▶ NEXT` footer confirmation. Read.
- `engine/references/skill-format.md` — authoring contract (frontmatter, required sections, one-`init` rule, checklist). Read fully.
- `engine/references/listing-budget.md` — why `disable-model-invocation: true` is mandatory. Read fully.
- `engine/bin/lib/init.cjs` — confirmed default case (L414-433) serves `init qa`; no `case 'qa'`/`case 'diagnose'`. Read fully.
- `engine/bin/lib/doctor.cjs` — confirmed `isInvocationDisabled`, budget thresholds, walks `<cwd>/{skills,.claude/skills}`. Read fully.
- `engine/bin/lib/validate.cjs` — confirmed name/description constraints + walk paths. Read fully.
- **Live runs (2026-06-09):**
  - `init qa --cwd <scaffolded tmp>` → complete usable blob, exit 0.
  - `doctor` from `engine/` → `total_skills:19, auto_count:5, disabled_count:14, ok:true`.
  - `node --test "test/**/*.test.cjs"` → `pass 164, fail 0`.
  - `validate skills skills/diagnose/SKILL.md` → `valid:true`.
  - `cat engine/VERSION` → `2.3.0`; `ls skills/` → 19 skill dirs.

### Secondary
- `.planning/research/qa-skill-source-spec.md`, `.planning/phases/18-qa-skill/18-CONTEXT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `CLAUDE.md` — the content/decision sources (read fully).

### Tertiary (LOW confidence)
- None. No web research needed; all claims verified against shipped artifacts or live engine runs.

## Metadata

**Confidence breakdown:**
- Frontmatter / body shape: HIGH — copied from shipped, passing siblings + skill-format.md.
- `init qa` / no engine change: HIGH — confirmed live (exit 0, complete blob) + by reading the default case.
- Gate values (5/20/15, 164, validate): HIGH — all run live from `engine/`.
- Report skeleton / agnostic phrasing: HIGH — derived from the locked spec + sentinel/tdd patterns.

**Research date:** 2026-06-09
**Valid until:** Stable until the engine or sibling skills change (~30 days). The doctor counts (19→20) are exact as of this run; re-verify if any skill is added/removed before Phase 18 executes.
