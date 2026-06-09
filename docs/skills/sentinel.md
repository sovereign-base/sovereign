# /sentinel

*Guard the gate — catch problems while they're still cheap, against your own standards.*

## What it does

Reviews completed work against SOVEREIGN's own standards (not generic lint) and returns a structured verdict — **PASS / CONDITIONAL PASS / BLOCKED**. The native tier runs four checks: a `SOVEREIGN:UNVERIFIED` marker scan, commenting-standard compliance, spec alignment (acceptance criteria vs implementation), and ADR consistency. Zero external tools; works on any stack. (A CodeRabbit-enhanced tier is a later milestone.)

## When to use it

After completing a feature or vertical slice; before passing a phase gate; when you want a standards + spec-alignment pass on a diff. **Don't** use it for live runtime/QA of a running app — that's your project's own test suite via `/tdd`. Sentinel reviews the artifacts and their alignment, not a running process.

## How it works

A thin orchestrator: one `sovereign-tools init sentinel` call resolves models, spec/ADR paths, and the agents guard (it hard-errors if the `sovereign-sentinel` agent isn't installed — no silent skip). It dispatches `sovereign-sentinel` for the heavier reads, grouping findings by severity into a verdict. The `SOVEREIGN:UNVERIFIED` scan follows `references/unverified-marker.md`; markers are surfaced as findings (blocking-at-gate is deferred to M2).

## Outputs

- A `SENTINEL REPORT` (findings by check + verdict), written by the orchestrator; `state save` + commit delegated to the engine.

## Navigation

- **PASS:** continue — `/handoff` to checkpoint, or proceed to the next slice.
- **CONDITIONAL PASS:** address the listed follow-ups (incl. any UNVERIFIED markers).
- **BLOCKED:** fix the failing criteria / ADR conflicts, then re-run `/sentinel`.

Part of the Fast Lane — installed by `npx sovereign init --quick`.
