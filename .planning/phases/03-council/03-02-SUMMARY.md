---
phase: 03-council
plan: 02
subsystem: skills
tags: [council, orchestrator, skill, parallel-fanout, peer-review, verdict, hand-authored, integration-proof]
requirements: [CNL-01, CNL-02, CNL-03, CNL-04]
key-files:
  created:
    - engine/skills/council/SKILL.md
  modified:
    - engine/agents/sovereign-chairman.md
---

# Plan 03-02 Summary — Council `--standard` thin orchestrator

**Outcome:** `engine/skills/council/SKILL.md` authored (hand-authored per R-004) — the flagship reasoning skill and the architecture's integration proof. `/council --standard "<decision>"` is now fully specified end-to-end; a Claude executing it needs no further interpretation. CNL-01..04 all covered.

## What shipped
- **Frontmatter:** `name: council`, `disable-model-invocation: true` (user-invoked + side-effecting → off the auto-trigger listing budget), `argument-hint`. Real Agent Skills frontmatter — no v1 fields. Passes `sovereign-tools validate skills`.
- **Why this matters / When to use** — plain-language framing (sycophancy/framing flip) mined from v1.
- **The 8-step `--standard` flow:** (1) one `init council` call + `@file:` spill; (2) `agents_installed` hard error, no fallback; (3) context injection from init paths + question neutralization (CNL-03); (4) 5 `sovereign-advisor` dispatched **in parallel**, one lens each (CNL-01); (5) shuffle to anonymized **A–E** + one blind `sovereign-peer-reviewer` **before** synthesis (CNL-02); (6) `sovereign-chairman` verdict; (7) **orchestrator-only** transcript write to `.sovereign/council/` (CNL-04); (8) `state save` + `gate pass` + `commit`, then nav footer.
- **Report format** (advisor blocks + PEER REVIEW + CHAIRMAN SYNTHESIS + COUNCIL VERDICT, `CONDITIONAL_PASS`→"CONDITIONAL PASS") + recommendation-first **Navigation footer**.
- Thin-orchestrator discipline held: every state/gate/commit/model action delegated to `sovereign-tools`; the skill holds flow + content only.

## Deviation / cross-phase reconciliation
The checker flagged a tension: the flow passes the chairman **lens-labeled** positions, but the Phase-2 `sovereign-chairman.md` discipline said "inputs are anonymized... do not re-identify." Resolved in favor of the flow (the blind step is the peer-review round; the chairman synthesizes by lens). Made a 2-line edit to `sovereign-chairman.md` ("Synthesize by lens" + path-passing line). `agents.test.cjs` asserts frontmatter/schema/JSON-only (not this prose) — full suite stays **76/76 green**.

## Scope
`--standard` only. `--express`/`--deep`/multi-model/every-advisor-re-reviews deferred (M4) — the skill prints a one-line notice and runs `--standard`. Council is a `--full` skill (not Fast Lane), source at `engine/skills/council/`.

## Verification
All three task grep gates PASS; `validate skills` valid (exit 0); engine suite 76/76.
