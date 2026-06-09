---
name: sentinel
description: Review completed work against SOVEREIGN's own standards before it compounds — scans for unverified markers, checks comment quality, spec alignment, and ADR consistency, and returns a structured verdict. Use after finishing a feature, slice, or before a phase gate.
---

## Why this matters

Problems caught late are problems that have already spread. A skipped acceptance criterion, an integration point built on an unverified API, a business rule with no comment explaining it — each is cheap to fix the moment it's written and expensive once three more things depend on it. Sentinel is the guard at the gate: it reviews work against *your project's* standards, not generic lint, and surfaces what drifted while it's still cheap.

It is the **native tier** — zero external tools, works on any stack. (A CodeRabbit-enhanced tier is a later milestone; the native review always works without it.)

## When to use this

- After completing a feature or a vertical slice.
- Before passing a phase gate.
- When you want a standards + spec-alignment pass on a diff.

Don't use it for live runtime/QA testing (that's your project's own test suite via `/tdd`) — Sentinel reviews the *artifacts and their alignment*, not a running app.

## The flow

A **thin orchestrator** — orient once, dispatch the reviewer, render the verdict.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init sentinel)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `models.*`, `context_injection.relevant_adrs`, the spec paths, and `agents_installed` / `missing_agents`.

**2 — Agents guard.** If `agents_installed` is false, STOP and print `missing_agents` + the fix (`npx sovereign-cli init --full`). Do not silently skip the review.

**3 — Run the four native checks** (dispatch the `sovereign-sentinel` agent for the heavier reads — it returns structured JSON; or run inline for a small diff):
- **(a) `SOVEREIGN:UNVERIFIED` scan.** Grep the changed files for the literal token per `engine/references/unverified-marker.md`. Report each as `file:line — reason` (one `unverified_markers` entry each). These are **findings**, surfaced not blocking, in M1.
- **(b) Commenting standard.** Check public functions/modules against the standard (HexDoc-style: comment the *why*, the *contract*, and the *danger* — not the *what*; module headers on major files; integration points reference their anchor). Flag missing or noise comments.
- **(c) Spec alignment.** Read the relevant spec/acceptance criteria and verify each is actually implemented. List criteria met vs. unmet (an unmet acceptance criterion is the most important finding).
- **(d) ADR consistency.** Check the change doesn't contradict a recorded decision in `.sovereign/docs/adr/`. Flag contradictions.

**4 — Emit a structured verdict.** Group findings by severity and conclude with one verdict:
- **PASS** — no critical/major findings; acceptance criteria met.
- **CONDITIONAL PASS** — minor findings or surfaced UNVERIFIED markers; safe to proceed with the listed follow-ups.
- **BLOCKED** — a failing acceptance criterion, an ADR contradiction, or a critical defect. Resolve before proceeding.

```
SENTINEL REPORT — <scope>
Engine: native
── UNVERIFIED MARKERS ──  <n> (file:line — reason)
── COMMENTING ─────────  <findings>
── SPEC ALIGNMENT ─────  <met>/<total> acceptance criteria
── ADR CONSISTENCY ────  <findings>
── VERDICT ────────────  PASS | CONDITIONAL PASS | BLOCKED
```

**5 — Persist.** Write the report (orchestrator-only) and `state save`; commit via `sovereign-tools commit` if appropriate.

## Navigation

```
▶ NEXT
  Verdict: <PASS | CONDITIONAL PASS | BLOCKED>
  PASS:             continue — /handoff to checkpoint, or proceed to the next slice
  CONDITIONAL PASS: address the listed follow-ups (incl. any UNVERIFIED markers)
  BLOCKED:          fix the failing criteria / ADR conflicts, then re-run /sentinel
```
