---
phase: 03-council
verified: 2026-06-08T19:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 3: Council `--standard` (Integration Proof) Verification Report

**Phase Goal:** `/council --standard "<decision>"` runs end-to-end and in doing so exercises every engine primitive in combination (init, state save, gate pass, commit, model resolution) plus the full parallel fan-out / fan-in — validating the architecture before any Fast Lane skill is written.

**Verified:** 2026-06-08T19:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Five distinct advisor perspectives (Skeptic, Architect, Builder, Outsider, Risk Officer) produced by parallel subagents | VERIFIED | `lenses.md` names all 5 with verbatim locked directive text; `SKILL.md` Step 4 dispatches `sovereign-advisor` ×5 "in a single parallel batch" (CNL-01 tag in body) |
| 2 | Anonymous peer-review round (A–E) dispatched BEFORE chairman synthesis; reviewer never re-identifies lens | VERIFIED | `SKILL.md` Step 5 explicitly shuffles to A–E, dispatches one `sovereign-peer-reviewer` before Step 6 (chairman); `sovereign-peer-reviewer.md` discipline: "Do not attempt to re-identify the underlying lens." |
| 3 | Project context injected via `init council` paths (path-passing, not self-statting); skill performs zero other orientation reads | VERIFIED | `SKILL.md` Step 1 calls `init council` once and parses `context_injection.manifest_path`, `.glossary_path`, `.constitution_path`, `.relevant_adrs[]`; Step 3 reads content only after init; Step 4 passes paths to advisors (not content); `init council` live call returns all four `context_injection` fields |
| 4 | Chairman returns PASS/CONDITIONAL_PASS/BLOCKED; transcript written by orchestrator only to `.sovereign/council/`; state save + gate pass + commit all present; `disable-model-invocation: true`; no v1 fields | VERIFIED | `SKILL.md` Step 7 "ORCHESTRATOR-ONLY write"; Step 8 has `state save` + `gate pass` + `commit` bash commands; frontmatter: `name: council`, `disable-model-invocation: true`, `argument-hint` — no `triggers`, `works-best-with`, `min-model`, `tokens`, or `phase` fields; `validate skills` exits 0 |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/skills/council/SKILL.md` | Thin orchestrator, 8-step --standard flow | VERIFIED | 147 lines; all 8 steps present; `disable-model-invocation: true`; no v1 fields |
| `engine/skills/council/lenses.md` | 5 verbatim locked lenses + 3 return contracts | VERIFIED | All 5 lenses match CONTEXT.md locked text verbatim; 3 JSON return contracts present |
| `engine/agents/sovereign-advisor.md` | Parameterized shell, returns advisor JSON | VERIFIED | `tools: Read, Grep, Glob` (no Write); returns `{ok, lens, position, confidence, key_points, risks, recommendation}` |
| `engine/agents/sovereign-peer-reviewer.md` | Blind reviewer, A–E labels, returns critique JSON | VERIFIED | Preserves anonymity discipline; returns `{ok, reviews[], cross_cutting_concerns[]}` |
| `engine/agents/sovereign-chairman.md` | Synthesizes by lens, binding verdict | VERIFIED | `discipline` section: "Synthesize by lens"; returns `{ok, verdict, synthesis, conditions, dissents_addressed, confidence}` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SKILL.md` Step 1 | `init council` | `sovereign-tools init council` bash call + `@file:` spill handling | WIRED | Live call returns all expected fields: `models.{advisor,chairman,peer_reviewer}`, `context_injection.*`, `paths.{council_dir,transcript,state,manifest}`, `agents_installed`, `missing_agents` |
| `SKILL.md` Step 4 | `sovereign-advisor` ×5 | `Task(subagent_type="sovereign-advisor")` | WIRED | Explicit in Step 4; one per lens in single parallel batch |
| `SKILL.md` Step 5 | `sovereign-peer-reviewer` ×1 | `Task(subagent_type="sovereign-peer-reviewer")` | WIRED | Explicit in Step 5; dispatched after shuffle, before chairman |
| `SKILL.md` Step 6 | `sovereign-chairman` ×1 | `Task(subagent_type="sovereign-chairman")` | WIRED | Explicit in Step 6; receives lens-labeled positions + peer-review output |
| `SKILL.md` Step 7 | `.sovereign/council/` | Orchestrator writes `paths.transcript` | WIRED | "ORCHESTRATOR-ONLY write, CNL-04"; agents have `tools: Read, Grep, Glob` only — no Write capability |
| `SKILL.md` Step 8 | `state save` + `gate pass` + `commit` | `sovereign-tools` bash calls | WIRED | All three present in Step 8 code block |

---

### Consistency Checks

**Return contract alignment (lenses.md vs agent shells):**

- `sovereign-advisor`: `lenses.md` and `sovereign-advisor.md` schemas match exactly (`ok`, `lens`, `position`, `confidence`, `key_points`, `risks`, `recommendation`).
- `sovereign-peer-reviewer`: `lenses.md` and `sovereign-peer-reviewer.md` schemas match exactly (`ok`, `reviews[]`, `cross_cutting_concerns[]`).
- `sovereign-chairman`: `lenses.md` and `sovereign-chairman.md` schemas match exactly (`ok`, `verdict`, `synthesis`, `conditions`, `dissents_addressed`, `confidence`).

NOTE: `03-CONTEXT.md` (the design-spike document) listed earlier draft contracts (`strongest: {id, why}`, `agreements[]`, `clashes[]`, `first_action`) that differ from the final shipped schemas. This is expected: CONTEXT.md is a pre-implementation research artifact; the authoritative contracts are in `lenses.md` + the agent shells. The SKILL.md report format renders from the `synthesis` string (the `{ok, synthesis, …}` field), not from the obsolete `agreements[]`/`clashes[]` stub — no functional gap.

**Chairman anonymization reconciliation (resolved):**

The chairman's `<role>` block retains a parenthetical "(anonymized)" from before the Phase-3 reconciliation. The operative `<discipline>` section explicitly states "Synthesize by lens" and "you receive positions labeled by lens" — this is the controlling instruction. The SUMMARY documented the deliberate two-line edit. No contradictory "do not re-identify" instruction remains in the chairman body. The description field says "anonymized advisor transcripts" which is accurate for the peer-review round; the chairman step itself is labeled-by-lens. The tension is cosmetic, not functional.

**SKILL.md frontmatter compliance (`sovereign-tools validate skills`):**

- `name: council` — 7 chars, lowercase-hyphen, no reserved words. Exit 0.
- `description` — 248 chars (limit 1024). Valid.
- `disable-model-invocation: true` — set.
- No v1 fields present (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`).

---

### Engine Suite

`cd engine && npm test` — **76/76 pass, 0 fail**. The chairman reconciliation edit did not break `agents.test.cjs`. The test asserts frontmatter/schema/`ok:`/`JSON only` markers — all pass.

---

### `--express`/`--deep` Deferral

`SKILL.md` "Scope" section (line 39): "If invoked with `--express` or `--deep`, print a one-line notice ("`--express`/`--deep` are not yet available — running `--standard`.") and proceed as `--standard`." Deferral correctly communicated with one-line notice.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `init council` returns all required fields | `node sovereign-tools.cjs init council` | All 7 top-level sections present; `agents_installed`, `missing_agents`, `paths.council_dir`, `paths.transcript`, `models.peer_reviewer` all populated | PASS |
| `validate skills` against SKILL.md | `validate skills --path .../SKILL.md` | `{"valid":true,"checked":1,"violations":[]}` | PASS |
| Engine test suite green | `cd engine && npm test` | 76/76 pass | PASS |
| All 5 verbatim lens directives match locked content | `grep -F` on each locked string | 5/5 MATCH | PASS |
| Agents have no Write tool | grep `tools:` in all 3 agents | `Read, Grep, Glob` only | PASS |

---

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|----------|
| CNL-01 | 03-01, 03-02 | 5 parallel advisor perspectives | SATISFIED | `lenses.md` 5 lenses; `SKILL.md` Step 4 parallel batch |
| CNL-02 | 03-02 | Anonymous peer-review round before synthesis | SATISFIED | `SKILL.md` Step 5 shuffles A–E; reviewer discipline preserved |
| CNL-03 | 03-02 | Project context injected via `init council` paths | SATISFIED | `SKILL.md` Step 1 one-call orientation; path-passing to advisors |
| CNL-04 | 03-02 | Chairman verdict, orchestrator-only transcript write, state save + gate pass + commit | SATISFIED | All present in Steps 7–8; agents have no Write tool |

---

### Anti-Patterns Found

None. No TODO/FIXME/PLACEHOLDER/stub patterns found in any council artifact or agent definition.

---

### Human Verification Required

#### 1. Five parallel Task() dispatches actually run concurrently

**Test:** Run `/council --standard "should we adopt a monorepo?"` and observe that all five advisor dispatches are shown as concurrent subagent invocations (not sequential).
**Expected:** Five subagent tasks appear in the same batch turn, not staggered over five consecutive turns.
**Why human:** Parallelism is a runtime behavior; the skill body specifies it but an executing agent could serialize.

#### 2. Anonymization mapping is private to orchestrator

**Test:** Run Council and inspect the peer-reviewer's context — it should see labels A–E only, not lens names.
**Expected:** The peer-reviewer's dispatch prompt and its working context contain no mention of Skeptic/Architect/Builder/Outsider/Risk Officer.
**Why human:** The shuffle happens in the orchestrator's live working memory; cannot verify the runtime prompt from static analysis.

#### 3. Transcript file format and `.sovereign/council/` persistence

**Test:** Run `/council --standard "..."` end-to-end and confirm a file appears at `.sovereign/council/council-<stamp>-001.md` with the full `SOVEREIGN COUNCIL REPORT` format.
**Expected:** File exists, contains all five advisor positions, the PEER REVIEW block, CHAIRMAN SYNTHESIS, and COUNCIL VERDICT sections.
**Why human:** File write is the orchestrator's runtime action; static analysis can only confirm the flow instruction.

---

### Gaps Summary

No gaps. All four CNL requirements are satisfied, all artifacts are substantive (not stubs), all key links are wired, the engine suite passes 76/76, and `validate skills` exits 0.

---

_Verified: 2026-06-08T19:00:00Z_
_Verifier: Claude (gsd-verifier)_
