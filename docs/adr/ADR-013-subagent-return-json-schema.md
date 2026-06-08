# ADR-013: Reasoning subagents return validated JSON, never prose

**Status:** Accepted
**Date:** 2026-06-08

## Context

SOVEREIGN's reasoning lives in subagents (Council advisors, planner, sentinel
reviewer, verifier, researcher — SOVEREIGN.md §3 Layer 3). Orchestrator skills must
consume those results programmatically: tally Council verdicts, route findings,
gate phases. If subagents return free-form prose, the orchestrator must heuristically
parse natural language — a documented foot-gun (Pitfall 8) that is brittle, lossy,
and non-deterministic. Pinning a return shape now lets Phase 2/3 consume subagent
output reliably.

## Decision

Reasoning subagents **return validated JSON, never prose.** The minimal return schema
is:

```json
{
  "agent": "string (required) — the subagent identifier",
  "verdict": "string (optional) — e.g. PASS | CONDITIONAL | FAIL",
  "findings": [
    {
      "title": "string",
      "detail": "string",
      "severity": "string (optional)"
    }
  ],
  "confidence": "string (optional) — e.g. HIGH | MEDIUM | LOW"
}
```

- `agent` and `findings` are required; `verdict` and `confidence` are optional and
  used by agents that render a judgement.
- Individual subagent types may extend this shape with additional fields, but MUST
  preserve these keys so a generic consumer can always read `agent`, `findings`, and
  (when present) `verdict`/`confidence`.
- Orchestrators validate the returned JSON; malformed output is an error, not
  something to prose-parse.

## Consequences

- **Positive:** Orchestrators consume subagent output deterministically — verdict
  tallies, finding routing, and phase gating become simple data operations.
- **Positive:** The contract is portable: any agent runtime that can emit JSON can
  participate; consumers never depend on natural-language phrasing.
- **Negative / accepted cost:** Subagent prompts must be engineered to emit
  schema-conformant JSON, and orchestrators must validate it. Acceptable — this is
  the price of determinism and is far cheaper than heuristic prose parsing.
- **Scope note:** This ADR pins the shape now; the validating consumers and the
  Council anonymized-peer-review flow are built in Phase 2/3.
