---
name: council
description: Five advisor personas argue your decision in parallel, an anonymous peer-review round catches what each missed, and a chairman returns a binding verdict. Run before any decision that is expensive to undo — build-or-not, architecture, stack, pivots.
disable-model-invocation: true
argument-hint: "[--standard] \"<decision>\""
---

<!--
disable-model-invocation: true — Council is user-invoked via /council and is
side-effecting (it writes transcripts and commits). Setting this keeps Council
OFF the skill-listing auto-trigger budget (see engine/references/listing-budget.md):
only the user convenes the Council, never the model on a hunch.
-->

## Why this matters

AI is agreeable. Ask it "should I build this?" and it finds reasons you should. Ask "is this a bad idea?" and it finds reasons it is. Same idea, opposite answers — the framing decides. That's harmless for an email and dangerous for a decision you can't cheaply undo.

The Council removes the framing. Five distinct thinking styles attack the **same** neutralized question from fundamentally different angles. Their answers are anonymized and peer-reviewed — each critique written without knowing who said what — and a chairman synthesizes where they genuinely agree, where they truly clash, what every one of them missed, and what to do. You get a verdict you can trust instead of the answer that sounded good in the moment.

Run it before anything expensive to reverse.

## When to use this

Use it for:

- Deciding whether a product idea deserves to be built.
- Choosing between two or more architectural approaches.
- A significant technology or stack choice.
- Evaluating a pivot or major change.
- Any decision that costs weeks or months to recover from if it's wrong.

Don't use it for:

- Questions you've already decided — this is not validation-seeking.
- Implementation details with a clear right answer.
- Quick factual questions or simple debugging.

**Scope:** `--express` and `--deep` are deferred to a later milestone; this skill runs `--standard`. If invoked with `--express` or `--deep`, print a one-line notice ("`--express`/`--deep` are not yet available — running `--standard`.") and proceed as `--standard`.

---

## The `--standard` flow

Execute these steps in order. The Council is a **thin orchestrator**: every state/gate/commit/model action is delegated to `sovereign-tools` — this file holds flow + content only. Throughout, pass subagents **paths, not file contents** (path-passing), and use the resolved `models.*` aliases from `init` as each `Task` model.

**1 — Orient with ONE call.** Run the engine's `init council` and handle the `@file:` spill:

```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init council)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse from the blob: `models.advisor` / `models.chairman` / `models.peer_reviewer`; `context_injection.manifest_path` / `.glossary_path` / `.constitution_path` / `.relevant_adrs[]`; `paths.transcript` / `paths.council_dir` / `paths.state` / `paths.manifest`; `config.commit_docs`; `phase.current` / `phase.gate_status`; `agents_installed` / `missing_agents`. **The skill performs zero other orientation reads** — `init` already resolved models, config, phase, and paths in one process.

**2 — Agents guard (hard error, no fallback).** If `agents_installed` is `false`, STOP. Print the `missing_agents` names and the fix: `npx sovereign-cli init --full`. **Never** silently fall back to a general-purpose agent — a Council without its advisors is not a Council.

**3 — Inject context + neutralize the question.** Only now, read the *content* of `context_injection.manifest_path`, `context_injection.glossary_path`, and any `context_injection.relevant_adrs` — because the advisors need grounding in this specific project, not generic advice. Strip loaded language and implied answers from the user's decision to get a **neutral** framing. Print the convening header:

```
COUNCIL CONVENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question (neutral): <neutral framing>
Phase: <phase.current> — <phase.name>
Relevant decisions: <ADR refs, if any>
Domain terms: <relevant CONTEXT.md terms>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Advisors deliberating...
```

**4 — Round 1: five advisors, IN PARALLEL (CNL-01).** Load `lenses.md` (this directory). In a **single parallel batch**, dispatch five `Task(subagent_type="sovereign-advisor", model=<models.advisor>)` calls — one per lens. Each prompt carries: (a) that lens's verbatim text from `lenses.md` as `<lens>`; (b) the `context_injection` **paths** (the advisor reads them itself — path-passing, not content-passing); (c) the neutral question. Each returns the advisor JSON contract (see `lenses.md`). If any advisor returns `ok:false`, surface the failure and stop — do not synthesize a partial council.

**5 — Round 2: anonymized peer review, BEFORE synthesis (CNL-02).** The orchestrator **shuffles** the five advisor responses into anonymized labels **A–E** (randomize the lens→label mapping and keep that mapping private to the orchestrator). Dispatch **one** `Task(subagent_type="sovereign-peer-reviewer", model=<models.peer_reviewer>)` over the anonymized A–E set. It returns per-label `strengths` / `weaknesses` / `overlooked` + `cross_cutting_concerns`. The reviewer never learns which lens is which — its blindness is the point. (The "every advisor re-reviews" variant is deferred to `--deep`/M4.)

**6 — Round 3: chairman verdict.** Dispatch **one** `Task(subagent_type="sovereign-chairman", model=<models.chairman>)` with the five advisor positions **labeled by lens** (the blind round is over; the chairman benefits from knowing who said what) plus the peer-review output. It returns the chairman JSON: `verdict` ∈ `PASS | CONDITIONAL_PASS | BLOCKED`, a `synthesis` (where the council agrees, where it genuinely clashes, blind spots caught), `conditions[]` (non-empty when CONDITIONAL_PASS), `dissents_addressed[]`, and `confidence`.

**7 — Persist (ORCHESTRATOR-ONLY write, CNL-04).** The orchestrator — and **only** the orchestrator — writes the full transcript (see Report format) to `paths.transcript` (`.sovereign/council/council-<stamp>-001.md`). The advisors, peer-reviewer, and chairman **never write files** — they return JSON only. This is the file-race guard: five parallel agents writing the same directory would corrupt it.

**8 — Side effects + footer.** In order:

```bash
node "$ENGINE/bin/sovereign-tools.cjs" state save          # regenerates MANIFEST
# Only if the council was convened at a phase gate:
node "$ENGINE/bin/sovereign-tools.cjs" gate pass <phase.current>   # references the transcript path
node "$ENGINE/bin/sovereign-tools.cjs" commit "council: <verdict> — <short summary>" \
  --files <paths.transcript> <paths.state> <paths.manifest>
```

`commit` is gated by the engine on `commit_docs` + gitignore and sanitizes the message — the skill does not branch on those itself. Finish with the Navigation footer.

---

## Report format

The orchestrator renders this to the user **and** writes it to `paths.transcript`:

```
SOVEREIGN COUNCIL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: --standard   Phase: <n> — <name>
Question (neutral): <framing>

── ADVISOR POSITIONS ─────────────────
🔴 The Skeptic      [oppose|support|conditional]  — <recommendation>
   <key points / risks>
🔵 The Architect    [...]  — <recommendation>
🟡 The Builder      [...]  — <recommendation>
⚪ The Outsider     [...]  — <recommendation>
🟣 The Risk Officer [...]  — <recommendation>

── PEER REVIEW (anonymous A–E) ───────
Strongest: <label> — <why>
Biggest blind spot: <label> — <what>
Missed by everyone: <cross_cutting_concerns>

── CHAIRMAN SYNTHESIS ────────────────
Where the council agrees: ...
Where it genuinely clashes: ...
Blind spots caught: ...
Recommendation: ...
First thing to do: ...
Dissents addressed: ...

── COUNCIL VERDICT ───────────────────
<PASS | CONDITIONAL PASS | BLOCKED>
<if CONDITIONAL PASS: the conditions to satisfy first>

Saved to: .sovereign/council/council-<stamp>-001.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Render the agent enum `CONDITIONAL_PASS` as **"CONDITIONAL PASS"** in this human-facing report.

## Navigation

End every Council run with a recommendation-first footer:

```
▶ NEXT
  <recommended action — derived from the chairman's "first thing to do">
  Verdict: <PASS|CONDITIONAL PASS|BLOCKED>   Transcript: .sovereign/council/council-<stamp>-001.md

  After PASS:            /grill-with-docs — interrogate the decision into a sharp spec
  After CONDITIONAL PASS: resolve the listed conditions, then re-run /council or proceed
  After BLOCKED:          address the blocking concerns before building anything
```
