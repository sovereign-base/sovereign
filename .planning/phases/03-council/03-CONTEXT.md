# Phase 3: Council `--standard` - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** `/SOVEREIGN.md` §6, `archive/v1/skills/council/SKILL.md` (locked content to mine), hex/claude-council design (in the project chat history), `.planning/research/ARCHITECTURE.md` (dispatch shapes), `FEATURES.md` (standard-only M1 scoping). Builds on the verified Phase 1 engine + Phase 2 subagents.

<domain>
## Phase Boundary

Phase 3 builds the **Council `--standard`** skill — SOVEREIGN's flagship reasoning skill and the **integration proof** that exercises every engine primitive end-to-end (init → context injection → parallel subagents → orchestrator-only transcript write → state save → gate → commit). After this phase, `/council --standard "<decision>"` runs a real multi-advisor deliberation with a blind peer-review round and a binding chairman verdict, persisted to `.sovereign/council/`.

**In scope:** `skills/council/SKILL.md` (thin orchestrator, `--standard` only) + supporting `skills/council/lenses.md` (the 5 advisor lens prompts) + the report/transcript format. Wires the Phase-2 subagents (`sovereign-advisor` ×5, `sovereign-peer-reviewer` ×1, `sovereign-chairman`).

**Out of scope:** `--express` and `--deep` modes, multi-model advisors, and the richer "every advisor re-reviews" peer round — all deferred (M4). The skill parses `--express`/`--deep` only to print a "deferred to a later milestone — running --standard" notice.

## This is hand-authored content (R-004)

Per the build agreement, the Council skill + advisor lens content is **hand-authored by the orchestrator**, NOT built by executors. The lenses, chairman voice, and verdict format are authorial. Planning still goes through GSD; execution is by hand; verification still runs.
</domain>

<decisions>
## Implementation Decisions

### The skill shape
- `skills/council/SKILL.md` — a **thin orchestrator** (real Agent Skills frontmatter; `disable-model-invocation: true` because Council is user-invoked via `/council` and side-effecting — this also keeps it off the auto-trigger listing budget). Includes a plain-language "## Why this matters" section (AI is sycophantic; framing flips the answer; Council forces structured disagreement) and a navigation footer at the end.
- `skills/council/lenses.md` — the 5 lens prompts (progressive disclosure: loaded when Council runs, not in the skill header).
- The skill orients with ONE call: `sovereign-tools init council` → models, `context_injection` paths, `paths.council_dir`/`paths.transcript`, `agents_installed`/`missing_agents`. If `agents_installed` is false → **hard error** listing missing advisors (no silent fallback).

### The flow (`--standard`)
1. `init council` → get models, context-injection paths, transcript path, agents guard.
2. Read MANIFEST + CONTEXT (+ relevant ADRs) from the injected paths; neutralize the question (strip loaded language).
3. **Round 1 — 5 advisors in parallel:** dispatch `sovereign-advisor` ×5 (one per lens), each injected with its lens + the project context + the neutral question. Each leans fully into its lens (no hedging). Advisors do NOT write files — they return JSON to the orchestrator.
4. **Round 2 — blind peer review (the resolved spike):** the orchestrator shuffles the 5 advisor responses into anonymized **A–E**, then dispatches `sovereign-peer-reviewer` **once** over the anonymized set. It answers: which is strongest + why, which has the biggest blind spot, and what did ALL of them miss. (The richer "every advisor re-reviews" variant is a `--deep`/M4 enhancement.)
5. **Round 3 — chairman:** dispatch `sovereign-chairman` with the 5 responses + the peer review → synthesis (where they agree / where they genuinely clash / blind spots caught) + a binding **verdict: PASS / CONDITIONAL PASS / BLOCKED** + a recommendation + one "first thing to do."
6. **Persist (orchestrator-only write):** the orchestrator — and ONLY the orchestrator — writes the full transcript to `paths.transcript` (`.sovereign/council/council-<stamp>.md`). Advisors/reviewer/chairman never write files (file-race safety, CNL-04).
7. **Side effects:** `state save` (regenerates MANIFEST), `gate pass <n>` if the Council was convened at a phase gate, then `commit` the transcript (sanitized message, commit_docs/gitignore aware).
8. **Navigation footer:** recommended next action + the transcript path.

### The five advisor lenses (LOCKED content — inject verbatim as each advisor's `<lens>`)
- **🔴 The Skeptic (Risk Hunter):** "Assume this has a fatal flaw and find it. Attack assumptions, question the problem statement, identify what will fail and why. Do not hedge. Do not balance. Your job is to break this."
- **🔵 The Architect (Systems Thinker):** "Probe technical feasibility and hidden complexity. Identify what hasn't been thought through — scaling cliffs, integration nightmares, data-model problems. Think three steps ahead."
- **🟡 The Builder (Action-First):** "Only care about what gets built Monday morning. If it sounds brilliant but has no clear first step or is too vague to implement, say so. Turn everything into concrete, executable decisions."
- **⚪ The Outsider (Fresh Eyes):** "You have zero context about this project, domain, or history. Catch the curse of knowledge — things obvious to the builder but confusing to everyone else. Question jargon. Question assumptions treated as fact."
- **🟣 The Risk Officer (Compliance & Safety):** "Focus on legal, regulatory, security, ethical, and operational risk. Surface what could go catastrophically wrong — compliance, data privacy, failure modes, reputational risk."

Natural tensions to preserve: Skeptic vs Builder (stop vs go); Architect vs Builder (rethink vs ship); Outsider vs everyone (assumptions vs reality).

### Subagent JSON return contracts (enforced at the orchestrator boundary)
- **advisor** → `{ ok, lens, position, key_points[], strongest_objection_or_support, recommendation }`
- **peer-reviewer** → `{ ok, strongest: {id, why}, biggest_blind_spot: {id, what}, missed_by_all }`
- **chairman** → `{ ok, agreements[], clashes[], blind_spots[], recommendation, first_action, verdict: "PASS"|"CONDITIONAL PASS"|"BLOCKED", conditions? }`
(These refine the Phase-2 agent shells, which already declare an `ok` field + "JSON only, no prose".)

### Report/transcript format
Mine `archive/v1/skills/council/SKILL.md` for the `SOVEREIGN COUNCIL REPORT` layout: header (mode/phase/question), advisor responses (with emoji), peer-review block, chairman synthesis, verdict, and a "Saved to: .sovereign/council/..." footer.

### Claude's Discretion
- Exact JSON field names beyond those pinned above; emoji choices; transcript timestamp scheme (use the `paths.transcript` init provides).
- Whether `lenses.md` is one file or a small `lenses.json` — pick what reads cleanest.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before planning/implementing:**
- `/SOVEREIGN.md` §6 (Council description, 5 advisors, modes).
- `archive/v1/skills/council/SKILL.md` — full locked content: lenses, peer-review wording, report format, "Why this matters." (Mine, don't copy frontmatter — v1 frontmatter is non-standard.)
- `.planning/research/ARCHITECTURE.md` — "Mapping to SOVEREIGN's reasoning agents" (dispatch shapes: parallel fan-out → fan-in; path-passing not content-passing; orchestrator-only writes).
- `.planning/research/FEATURES.md` — Council M1 = `--standard` only; the differentiating core to ship.
- `engine/bin/lib/init.cjs` — the `init council` blob (models, context_injection, paths, agents guard) the skill consumes.
- `engine/agents/sovereign-advisor.md`, `sovereign-peer-reviewer.md`, `sovereign-chairman.md` — the Phase-2 agent shells to parameterize/dispatch.
- `.planning/phases/01-engine-foundation/01-05-SUMMARY.md` — engine command surface (state save, gate pass, commit).

**Reference implementation:** `~/.claude/get-shit-done/workflows/new-project.md` Step "Spawn 4 parallel researchers → synthesizer" — the exact parallel-fan-out/single-fan-in Task() shape the Council mirrors (5 advisors → chairman).
</canonical_refs>

<specifics>
## Specific Ideas
- Council ships as a `--full` skill (NOT in the Fast Lane 5), installed to `.claude/skills/council/`.
- Council is the integration test for the whole engine — if it runs end-to-end (init + 7 subagent dispatches + transcript + state save + gate + commit), the architecture is proven.
- Only the orchestrator writes to `.sovereign/council/` — bake this into the skill instructions explicitly (CNL-04 + ARCHITECTURE anti-pattern on parallel file races).
</specifics>

<deferred>
## Deferred Ideas
- `--express` (single synthesized voice) and `--deep` (multi-model + every-advisor-re-reviews) — M4.
- Multi-provider advisors (Gemini/GPT/Grok) — M4.
- Council auto-recommendation interjection ("⚡ COUNCIL RECOMMENDED" when an irreversible decision is detected) — later.
</deferred>

---

*Phase: 03-council*
*Context gathered: 2026-06-08 — synthesized from gated vision + locked v1 content + Phase 1/2 outcomes*
