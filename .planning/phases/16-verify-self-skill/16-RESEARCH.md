# Phase 16: `verify-self` skill - Research

**Researched:** 2026-06-09
**Domain:** Hand-authored thin-orchestrator SKILL.md (in-repo composition; no web survey)
**Confidence:** HIGH (every pattern, path, field, and gate verified by reading the shipped repo + running read-only `init`/`doctor`/`validate`)

## Summary

Phase 16 authors ONE file — `engine/skills/verify-self/SKILL.md` — a core-tier thin orchestrator that mirrors the shipped `anchor-docs`/`bridge`/`import-skill` shape exactly. There is **zero engine work**: `init verify-self` already ships (Phase 14) and surfaces both paths the skill needs; markers are written by the agent *into code files* (not by an engine command); the audit boundary is derived skill-side from `anchor list`'s `date_retrieved` field + git. The skill's unique value is *behavioral prose*: a HARD STOP first, a retroactive `file:line` audit, and a forced 3-way choice (A→`anchor-docs`, B→write the `SOVEREIGN:UNVERIFIED` marker, C→discard+restart) that never silently continues.

Every contract this skill touches is already shipped and locked: the marker form (`engine/references/unverified-marker.md`), the `sentinel` literal-token scan, and the `anchor` engine command. The skill writes the existing marker form verbatim and composes with the existing skills — it invents nothing.

**Primary recommendation:** Copy the `anchor-docs` SKILL.md structure beat-for-beat (frontmatter → `## Why this matters` → `## When to use this` → `## The flow` numbered steps → navigation footer), swap the body to the hard-stop/audit/3-choice flow, set `disable-model-invocation: true`, keep `wc -l` ≥ 70, and run the gates **from `engine/`**. All numbers verified: adding verify-self → `total_skills` 18, `auto_count` 5, `disabled_count` 13; validate passes; 164 engine tests stay green (engine untouched).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (NON-NEGOTIABLE — from success criteria)
- **Hard stop, then retroactive audit (VERIFY-01).** On a low-confidence signal the skill's FIRST move is: stop writing new code. Then audit code written since the last verified anchor and surface **each specific unverified claim as `file:line` + what's uncertain** — using the same three valid-context classes the marker spec defines (unconfirmed API shape/endpoint/signature; assumed behavior; stale-knowledge-risk library).
- **Three choices, always offered, never auto-resolved (VERIFY-02).** Present exactly:
  - **(A) Provide docs** → hand off to **`/anchor-docs`** to anchor the authoritative source, then re-check the flagged code against the now-current doc.
  - **(B) Mark `SOVEREIGN:UNVERIFIED` and continue** → write a marker at each unverified claim's `file:line` in the **exact** form from `engine/references/unverified-marker.md`: `<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>`. `sentinel` already scans the literal token.
  - **(C) Discard and restart with docs** → revert the unverified changes (git), then anchor the docs (anchor-docs) before re-implementing.
  - The skill NEVER silently continues — it always surfaces + offers the choices.
- **Closes the loop (ANCHOR-02 end-to-end).** verify-self → (A) anchor-docs → anchor-docs surfaces stale anchors (`anchor check`) → (B) markers → sentinel scans. Phase 16 demonstrates this composition end-to-end.
- **One-call orient + core-tier shape (M4-CC).** First action: single `node ".claude/sovereign-engine/sovereign-tools.cjs" init verify-self` (with `@file:` guard); parse the blob's `unverified_marker_spec` path + `external_docs_dir`. Real frontmatter only; `## Why this matters`; `## When to use this` (+ Don't); `## The flow` (numbered, recommendation-first); navigation footer; `wc -l` ≥ 70; no v1 fields.
- **`disable-model-invocation: true`** so doctor keeps auto-trigger budget at 5; validate passes.

### Claude's Discretion (judgment choices — resolved below in Open Questions)
- "Last verified anchor" boundary — derive skill-side from `anchor list` `date_retrieved` + git. **RESOLVED in Open Question 1.**
- Trigger entry points reconciled with `disable-model-invocation: true`. **RESOLVED in Open Question 5.**
- Audit method: judgment review of bounded diff, `grep` as an aid only.
- Choice C revert mechanic: conservative `git restore`/stash of only the unverified hunks.
- `description`: lead with the use case, neutral name, within cap.

### Deferred Ideas (OUT OF SCOPE)
- Pre-flight deploy-gate BLOCKING on unresolved markers / stale anchors (post-M4; M4 surfaces only).
- Any engine command for the audit boundary (use `anchor list` + git; no new engine surface).
- Auto-resolving low confidence without the user (never).
- Re-authoring `anchor-docs` (only compose with it); changing the marker form or sentinel scan (shipped/locked).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VERIFY-01 | User or agent triggers `verify-self` on a low-confidence signal → hard stop + retroactive audit of code since last verified anchor, surfacing each unverified claim (`file:line` + what's uncertain). | The flow's step 1 = HARD STOP; step 3 = audit bounded by Open Question 1's boundary recipe; recognizable signals named in Open Question 5. The three valid-context classes come verbatim from `unverified-marker.md` (read below). |
| VERIFY-02 | Presents the three choices (A docs→anchor-docs / B mark+continue / C discard+restart); on B emits the marker per `engine/references/unverified-marker.md` which sentinel scans. | The exact marker line + worked examples in Open Question 4; choice A hands off to the shipped `anchor-docs` SKILL.md; choice C uses the conservative git revert in Open Question 1. |
| ANCHOR-02 | `anchor-docs` lists + flags stale anchors; verify-self composes with it on choice A — closing the anchor→verify→sentinel loop. | `anchor check` / `anchor list` confirmed live (anchor.cjs); the loop is closed in prose by the footer + choice A handoff. Phase 16 is the formal verification point. |
| M4-CC | Core-tier thin orchestrator, one `init` orient, Why/recommendation-first/footer, `disable-model-invocation: true`, doctor budget held at 5, validate passes. | Shape mirrored from `anchor-docs`; doctor/validate numbers verified (18/5/13); skill-format.md authoring contract read in full. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Real Agent Skills frontmatter only** — `name`, `description`, optional `disable-model-invocation`, `argument-hint`. NO v1 fields (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`). Validate enforces only `name`/`description`; v1-field absence is a structural lint here.
- **`name`** ≤64 chars, `^[a-z0-9-]+$`, must NOT contain `claude`/`anthropic`. `verify-self` passes (11 chars, lowercase-hyphen).
- **`description`** ≤1024 chars (validate cap), lead with the use case.
- **Model-agnostic body** — the flow must read as "run `init verify-self`, audit, choose A/B/C" so any SKILL.md agent can execute it via Bash. Claude-only extensions are not used here.
- **Engine stays zero-dep** — no engine change in this phase; if a genuine gap is found, flag it, don't patch.
- **Author at `engine/skills/<name>/SKILL.md`** (shipped via the package `files` allowlist; install copies to `.claude/skills/`).

## Standard Stack

This is a documentation-authoring phase — no libraries. The "stack" is the shipped engine surface the skill drives and the references it follows.

### Core (shipped, verified live)
| Artifact | Purpose | Verified |
|----------|---------|----------|
| `engine/bin/lib/init.cjs` `case 'verify-self':` | Orient blob — surfaces the two paths the skill parses | Read lines 391-412; ran `init verify-self` (output below) |
| `engine/bin/lib/anchor.cjs` | `anchor list` (boundary source) / `anchor check` (stale) | Read in full; `date_retrieved` field confirmed |
| `engine/references/unverified-marker.md` | The EXACT marker form choice B emits | Read in full |
| `engine/references/skill-format.md` | Authoring contract (sections, frontmatter, line gate) | Read in full |
| `engine/references/listing-budget.md` + ADR-014 | Why `disable-model-invocation: true` is mandatory | Read in full |
| `engine/bin/lib/doctor.cjs` / `validate.cjs` | The two phase gates | Read in full; ran both |

### The actual `init verify-self` blob (ran 2026-06-09, from `engine/`)
The skill parses exactly these fields:
```json
{
  "config": { "commit_docs": true, ... },
  "paths": {
    "external_docs_dir": ".sovereign/external-docs",
    "unverified_marker_spec": "references/unverified-marker.md",
    "state": ".sovereign/STATE.md",
    "manifest": ".sovereign/MANIFEST.md"
  }
}
```
- **`paths.unverified_marker_spec`** = `references/unverified-marker.md` (package-root-relative — `references/` ships via the `files` allowlist, verified in `package.json`). The skill reads THIS path for the marker form, NOT the repo-relative `engine/references/...`.
- **`paths.external_docs_dir`** = `.sovereign/external-docs` — where `anchor list`/`anchor check` read; the skill uses it to know what's anchored.
- **`config.commit_docs`** — delegate commit decision to `sovereign-tools commit`; never branch on this in-body.

## Architecture Patterns

### The thin-orchestrator template (mirror `anchor-docs` exactly)
Verified shape shared by `anchor-docs` (84 lines), `bridge` (83), `import-skill` (77), `sentinel` (64):

```
---
name: <name>
description: <use-case-first, one line>
disable-model-invocation: true        # all user-invoked siblings set this on line 4
argument-hint: "[...]"                  # optional
---

## Why this matters        # plain-language, what goes wrong if skipped
## When to use this         # genuine uses + a "Don't" anti-use
## The flow                 # "A thin orchestrator — ..." intro, then numbered steps
  **1 — Orient (one call).** <init + @file: guard>
  **2..N — ...** <recommendation-first steps>
## Navigation               # fenced ▶ NEXT block, recommendation-first
```

### Pattern 1: The one-call orient (literal engine path, `@file:` guard)
Copy verbatim from every sibling (only the skill name changes):
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init verify-self)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
- The path is the **literal** `.claude/sovereign-engine/sovereign-tools.cjs` — NOT a `$ENGINE` variable (all siblings use the literal; the install resolves it).
- `@file:` guard handles the >50KB spill (GSD pattern). Every sibling has this exact two-line block.
- "Zero other orientation reads" — the skill reads file *content* only from paths `init` handed it.

### Pattern 2: Recommendation-first navigation footer (fenced `▶ NEXT`)
`anchor-docs` footer (the composition target — verify-self's footer mirrors it back):
```
▶ NEXT
  <state where you are>
  • <recommended next action> → /<skill>
  • <alternative>
  Note: <loop legibility line>
```
For verify-self the footer MUST name `/anchor-docs` (choice A companion) AND note `/sentinel` scans the `SOVEREIGN:UNVERIFIED` markers choice B writes — this is what makes the ANCHOR-02 loop legible.

### Pattern 3: The decision step (parallel to `import-skill`'s five gates)
`import-skill` step 3 is a **recommendation-first, lettered/numbered decision list** before any side effect. verify-self's 3-way choice mirrors this: surface the audit FIRST, then present A/B/C with a stated recommendation, never auto-resolve.

### Anti-Patterns to Avoid
- **`$ENGINE` or any variable for the engine path** — siblings hard-code the literal path. (Grep gate: literal string present, no `$ENGINE`.)
- **Ten-file orientation reads** — exactly one `init` call.
- **Hand-writing state/commit/branching on `commit_docs`** — delegate to `sovereign-tools state save` / `sovereign-tools commit`.
- **Inventing a new marker shape** — copy the form from `unverified-marker.md` verbatim.
- **Silently continuing** — the flow always surfaces + offers A/B/C.
- **v1 frontmatter fields** — none.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marker format | A new comment convention | The exact form in `references/unverified-marker.md` | `sentinel` scans the literal `SOVEREIGN:UNVERIFIED` token; a new shape is invisible to it |
| Staleness / anchor storage | A skill-side anchor reader | `anchor list` / `anchor check` (engine) | Engine owns the deterministic staleness math + header parse |
| Audit boundary date source | A new engine command or parsing files by hand | `anchor list` → most-recent `date_retrieved` + git | CONTEXT locks "no new engine surface"; the field is already exposed |
| Doc anchoring on choice A | Re-implementing ingest | Hand off to `/anchor-docs` | Phase 15 already ships it; verify-self only composes |
| Code revert on choice C | A custom revert | `git restore` / `git stash` of the specific hunks | Conservative, non-destructive, standard |

**Key insight:** verify-self's only original content is *behavioral prose* (hard-stop discipline + the forcing function). Everything mechanical reuses a shipped contract.

## Common Pitfalls

### Pitfall 1: Running the gates from the repo root (THE Phase 15 trap)
**What goes wrong:** `doctor` and `validate skills` walk `<cwd>/.claude/skills` and `<cwd>/skills` — NOT `engine/skills/`. Run from repo root and they pass *vacuously* (find zero skills) or miss verify-self.
**How to avoid:** Run all gates **from `engine/`**: `cd engine && node bin/sovereign-tools.cjs doctor`. Verified: from `engine/`, doctor sees all 17 skills today (→18 with verify-self).
**Warning signs:** `total_skills` not 18 after authoring → wrong cwd.

### Pitfall 2: Using the repo-relative marker path
**What goes wrong:** Skill tells the agent to read `engine/references/unverified-marker.md`, which doesn't exist at install time (it ships as `references/unverified-marker.md`).
**How to avoid:** Parse `paths.unverified_marker_spec` from the `init` blob (= `references/unverified-marker.md`). The skill *body* may cite `engine/references/unverified-marker.md` as the in-repo authoring source, but the *runtime* path it tells the agent to read is the blob's value.

### Pitfall 3: Forgetting `disable-model-invocation: true` on line 4
**What goes wrong:** verify-self becomes auto-triggerable → `auto_count` jumps to 6, busting the budget-held-at-5 criterion.
**How to avoid:** Line 4 of frontmatter, exactly as every user-invoked sibling. Verified: 12 siblings set it today; verify-self is the 13th.

### Pitfall 4: A marker that sentinel can't grep
**What goes wrong:** Reformatting the token (e.g. `SOVEREIGN_UNVERIFIED`, extra punctuation in the token) → `grep -rn "SOVEREIGN:UNVERIFIED"` misses it.
**How to avoid:** The literal token `SOVEREIGN:UNVERIFIED` must appear unmodified inside a code comment. Verified: `grep -rn "SOVEREIGN:UNVERIFIED"` finds the exact form `// SOVEREIGN:UNVERIFIED — ... | ref: ... | YYYY-MM-DD`.

## Code Examples

### The orient step (verify-self)
```bash
# Source: engine/skills/anchor-docs/SKILL.md lines 25-28 (verified shape)
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init verify-self)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

### The audit boundary derivation (Open Question 1, concrete)
```bash
# Source: engine/bin/lib/anchor.cjs cmdAnchorList — date_retrieved is exposed per anchor
# 1) most-recent anchor date = "last verified anchor" timestamp
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor list
#    → JSON array; each item has .date_retrieved (e.g. "2026-06-08"). Take the max.
#    If [] (no anchors yet) → boundary is "all un-anchored work this session/branch".

# 2) bound the code to audit (uncommitted + commits since that date)
git status --short                       # uncommitted/untracked work
git diff                                 # unstaged hunks
git diff --staged                        # staged hunks
git log --since=<date> --oneline         # commits since the last anchor
git diff <ref>..HEAD                     # the committed diff to read
```

### Choice B — the exact marker line (worked, two comment syntaxes)
```js
// Source: engine/references/unverified-marker.md lines 11-13, 21-28 (verbatim form)
// SOVEREIGN:UNVERIFIED — Paystack webhook signature is HMAC-SHA512? | ref: https://paystack.com/docs/webhooks | 2026-06-09
```
```python
# SOVEREIGN:UNVERIFIED — assumes the cursor is opaque base64, not an offset | ref: ADR-014
```
Form (from the spec): `<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>` — `reason` required; `ref` and date optional. Verified `grep -rn "SOVEREIGN:UNVERIFIED"` finds it.

### Choice C — conservative revert
```bash
git restore <path>                       # discard unstaged changes to a tracked file
git restore --staged --worktree <path>   # discard staged + unstaged
git stash push -- <path>                 # non-destructive: stash specific hunks
```
Then hand off to `/anchor-docs` before re-implementing. Never `reset --hard` / `clean -fd` beyond the unverified changes.

## State of the Art

Not applicable — no external technology survey. All contracts are in-repo and shipped. The only "state" that matters: the engine surface and references are at version `sovereign-cli@2.2.0`, 164 tests green, deps `{}`.

## Open Questions

### 1. The "last verified anchor" boundary (RESOLVED — concrete recipe)
- **What we know:** `anchor list` (anchor.cjs `cmdAnchorList`, verified) emits a JSON array where each anchor has `date_retrieved` (underscore — the JSON key; the *file header* uses `date-retrieved`, the parser maps it via `readField(content, 'date-retrieved')` → `date_retrieved`). Each item also carries `stale`.
- **The recipe the skill uses:**
  1. `anchor list` → take the **max `date_retrieved`** across anchors = the last-verified-anchor timestamp.
  2. Audit code changed since that point: uncommitted work (`git status --short`, `git diff`, `git diff --staged`) PLUS commits since the date (`git log --since=<date>`, then read `git diff <ref>..HEAD`).
  3. **No-anchors case** (`anchor list` → `[]`): the boundary is "all un-anchored work in this session/branch" — treat every claim touching an external API/version/config as unverified and audit the working tree + recent branch commits.
- **What's unclear:** Nothing blocking. The exact "session/branch" extent in the no-anchors case is judgment, not a hard rule — document it plainly as "the un-anchored work you just wrote."
- **Recommendation:** Put this 3-step recipe in the flow as the audit step. Use `date_retrieved` (the JSON key) when telling the agent what to read from `anchor list`.

### 2. The literal frontmatter block (RESOLVED — drop-in)
```yaml
---
name: verify-self
description: Catch your own uncertainty before it ships — when you're about to assert a version/endpoint/config you haven't confirmed, this hard-stops, audits the code you've written since your last anchored doc, and forces a deliberate choice: anchor the real docs, mark it SOVEREIGN:UNVERIFIED, or discard and restart. Use the moment you notice you're guessing about an external API.
disable-model-invocation: true
argument-hint: "[file or scope to audit]"
---
```
- Use-case-first; neutral name; well within the 1024-char cap (this description is ~340 chars). `argument-hint` is optional but matches siblings (all four set one). Confirm length stays <1024 when finalized.

### 3. The exact bash snippets (RESOLVED)
- Orient: see Code Examples (orient step) — literal path + `@file:` guard.
- Boundary/audit: see Code Examples (boundary derivation) — `anchor list` + the git quartet.
- These are the only commands the audit needs; the marker write is a file edit by the agent (no engine command), and persistence is `state save` + `commit` via `sovereign-tools` (delegated).

### 4. Choice B marker line + sentinel confirmation (RESOLVED)
- Exact line + worked examples: see Code Examples (choice B).
- **sentinel WILL find it:** `sentinel` SKILL.md step 3(a) greps changed files for "the literal token per `engine/references/unverified-marker.md`" and reports each as `file:line — reason`. The marker spec's scan rule confirms `grep -rn "SOVEREIGN:UNVERIFIED"` is deterministic on the literal token. Verified live: grep finds the exact form. The loop language to echo: sentinel **reads, never writes** markers; verify-self **writes** them.

### 5. VERIFY-01 "agent itself can trigger" vs `disable-model-invocation: true` (RESOLVED)
- **No conflict.** `disable-model-invocation: true` only removes the skill from the *auto-trigger listing budget* — it stays `/verify-self`-invocable. The "agent itself triggers" path is **recognition, not auto-invocation**: the agent NOTICES a low-confidence signal and *runs the verify-self flow* (it does not need the skill to auto-fire to do that). The skill body names the recognizable signals so the agent knows when to reach for it.
- **The recognizable low-confidence signals to name in the body** (the three valid-context classes from `unverified-marker.md`, phrased as triggers):
  1. About to assert a **version / endpoint / config / signature** you haven't confirmed against current docs (unverified third-party API shape).
  2. Implementing an **integration with no anchor** / relying on an **assumed behavior** (a default, ordering guarantee, idempotency promise) you haven't proven.
  3. Touching a **library/API released or materially changed after training cutoff** (stale-knowledge risk).

### 6. doctor/validate after adding verify-self (RESOLVED — verified)
- **Confirmed by running `cd engine && node bin/sovereign-tools.cjs doctor` today:** `total_skills: 17, auto_count: 5, disabled_count: 12, ok: true`.
- Adding verify-self **with `disable-model-invocation: true`** → it lands in `disabled_count`: **total_skills 18, auto_count 5 (UNCHANGED), disabled_count 13.** Budget held at 5. ✅
- `validate skills skills/verify-self/SKILL.md` will pass (name 11 chars, lowercase-hyphen, no reserved words; description <1024). Verified the linter on anchor-docs returns `{ valid: true }`.
- Engine untouched → **164 tests stay green** (verified the suite is 164 green now).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | run the engine for gates | ✓ | v23.11 (CLAUDE.md baseline; engine runs) | — |
| git | audit boundary (choice C revert + diff) | ✓ | repo is a git repo | — |
| `sovereign-tools` engine | orient + gates | ✓ | sovereign-cli@2.2.0, 164 tests green | — |
| `anchor` command | boundary date source | ✓ | shipped Phase 14 (anchor.cjs verified) | — |
| `references/unverified-marker.md` | marker form | ✓ | ships at package root via `files` allowlist | — |

**Missing dependencies:** None. All shipped and verified.

## Validation Architecture

> nyquist_validation: this phase ships a SKILL.md (prose), not testable code. The "tests" are the SKILL-phase gates below — each a grep/command assertion mapped to a Phase 16 success criterion. **Run all command gates from `engine/`** (the Pitfall 1 caveat — doctor/validate walk `<cwd>/.claude/skills`+`<cwd>/skills`, NOT `engine/skills/`).

### Test "framework"
| Property | Value |
|----------|-------|
| Framework | grep assertions + `sovereign-tools doctor`/`validate skills` + `node --test` |
| Config file | none (engine self-contained) |
| Quick run | `cd engine && node bin/sovereign-tools.cjs validate skills skills/verify-self/SKILL.md` |
| Full suite | `cd engine && node --test "test/**/*.test.cjs"` |

### Structural gates (grep/command-checkable; `$F = engine/skills/verify-self/SKILL.md`)
| # | Assertion | Command | Maps to |
|---|-----------|---------|---------|
| S1 | SKILL.md exists | `test -f "$F"` | M4-CC |
| S2 | `disable-model-invocation: true` present | `grep -q '^disable-model-invocation: true$' "$F"` | SC4 / M4-CC |
| S3 | `## Why this matters` heading | `grep -q '^## Why this matters$' "$F"` | M4-CC |
| S4 | `## When to use this` heading | `grep -q '^## When to use this$' "$F"` | M4-CC |
| S5 | Navigation footer (`▶ NEXT`) | `grep -q '▶ NEXT' "$F"` | M4-CC |
| S6 | `wc -l` ≥ 70 | `[ "$(wc -l < "$F")" -ge 70 ]` | M4-CC |
| S7 | No v1 fields | `! grep -Eq '^(triggers\|works-best-with\|min-model\|tokens\|phase):' "$F"` | CLAUDE.md / skill-format |
| S8 | Literal engine path (not `$ENGINE`) | `grep -q '\.claude/sovereign-engine/sovereign-tools\.cjs' "$F" && ! grep -q '\$ENGINE' "$F"` | M4-CC |
| S9 | One-call orient `init verify-self` | `grep -q 'init verify-self' "$F"` | SC4 / M4-CC |
| S10 | `@file:` spill guard present | `grep -q '@file:' "$F"` | M4-CC |

### Behavior-in-prose gates (grep-checkable phrases — confirm intent is on the page)
| # | Assertion | Command (illustrative) | Maps to |
|---|-----------|------------------------|---------|
| B1 | HARD STOP appears first in the flow | `grep -in 'hard.stop\|stop writing' "$F"` (appears before choices) | VERIFY-01 / SC1 |
| B2 | Retroactive audit surfaces `file:line` uncertainties | `grep -iq 'file:line' "$F"` | VERIFY-01 / SC1 |
| B3 | Three choices A/B/C present | `grep -iq 'discard' "$F" && grep -q 'SOVEREIGN:UNVERIFIED' "$F" && grep -iq 'anchor-docs' "$F"` | VERIFY-02 / SC2 |
| B4 | Choice B writes the exact marker form | `grep -q 'SOVEREIGN:UNVERIFIED — ' "$F"` (em-dash form from spec) | VERIFY-02 / SC2 |
| B5 | Never silently continues | `grep -iq 'never silently\|always surface\|always offer' "$F"` | VERIFY-02 |

### Loop gates (ANCHOR-02 closed)
| # | Assertion | Command | Maps to |
|---|-----------|---------|---------|
| L1 | References `/anchor-docs` (choice A) | `grep -q 'anchor-docs' "$F"` | ANCHOR-02 / SC3 |
| L2 | Mentions `SOVEREIGN:UNVERIFIED` marker + `/sentinel` | `grep -q 'SOVEREIGN:UNVERIFIED' "$F" && grep -iq 'sentinel' "$F"` | ANCHOR-02 / SC2,SC3 |

### Budget / lint gates (RUN FROM `engine/`)
| # | Assertion | Command | Maps to |
|---|-----------|---------|---------|
| G1 | doctor `auto_count == 5`, `total_skills == 18` | `cd engine && node bin/sovereign-tools.cjs doctor` → assert `.auto_count==5 && .total_skills==18 && .disabled_count==13` | SC4 / M4-CC |
| G2 | validate passes for verify-self | `cd engine && node bin/sovereign-tools.cjs validate skills skills/verify-self/SKILL.md` → `.valid==true` | SC4 / M4-CC |
| G3 | Engine suite still 164 green | `cd engine && node --test "test/**/*.test.cjs"` → `pass 164, fail 0` | engine untouched |

**Wave 0 gaps:** None — all gate tooling (doctor, validate, node --test, grep) ships and was run successfully today. The only new artifact is the SKILL.md itself.

## Sources

### Primary (HIGH confidence — read directly / ran live)
- `engine/skills/anchor-docs/SKILL.md` — the freshest sibling + composition target (choice A). 84 lines; shape mirrored.
- `engine/skills/bridge/SKILL.md`, `engine/skills/import-skill/SKILL.md`, `engine/skills/sentinel/SKILL.md` — thin-orchestrator template + decision-step pattern + the marker-scanning consumer.
- `engine/references/unverified-marker.md` — exact marker form + 3 valid-context classes + scan rule (sentinel reads, never writes).
- `engine/references/skill-format.md` + `engine/references/listing-budget.md` — authoring contract + budget rationale.
- `engine/bin/lib/init.cjs` `case 'verify-self':` (lines 391-412) + ran `init verify-self` — confirmed `paths.external_docs_dir`, `paths.unverified_marker_spec: references/unverified-marker.md`, `config.commit_docs`.
- `engine/bin/lib/anchor.cjs` — `anchor list` emits `date_retrieved` + `stale`; `anchor check` emits `{ anchors, stale_count }`. Confirmed the boundary field name.
- `engine/bin/lib/doctor.cjs` + `validate.cjs` — gate logic; ran both. doctor today: `total 17 / auto 5 / disabled 12`. validate on anchor-docs: `valid:true`.
- `engine/package.json` — `files` includes `references` (so `references/unverified-marker.md` ships); deps `{}`; version 2.2.0.
- Ran `node --test "test/**/*.test.cjs"` → **164 pass, 0 fail**.
- Ran `grep -rn "SOVEREIGN:UNVERIFIED"` on the exact marker form → found.
- `.planning/ROADMAP.md` (Phase 16 success criteria), `.planning/REQUIREMENTS.md` (VERIFY-01/02, ANCHOR-02, M4-CC), `CLAUDE.md`, `16-CONTEXT.md`.

### Secondary / Tertiary
- None. This is a closed-repo composition task; no web sources were needed or used.

## Metadata

**Confidence breakdown:**
- Frontmatter / shape: HIGH — mirrored from four shipped siblings; validate logic read; numbers re-run.
- Engine surface / paths: HIGH — ran `init verify-self`; read anchor.cjs/init.cjs directly.
- Marker form / sentinel scan: HIGH — read the spec + sentinel SKILL.md; grep verified live.
- Boundary recipe: HIGH on the field/commands (verified); the no-anchors extent is documented judgment (by design, per CONTEXT discretion).
- Gates: HIGH — doctor/validate/node --test all run from `engine/` today.

**Research date:** 2026-06-09
**Valid until:** Stable — these are in-repo locked contracts; only re-verify if the engine `anchor`/`init`/`doctor` surface changes (it won't in this phase).
