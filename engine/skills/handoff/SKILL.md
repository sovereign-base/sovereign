---
name: handoff
description: Capture the current session into a dense, resumable document so another agent (or you, tomorrow) picks up with full context and zero re-derivation. Use when a session is getting long, before a context reset, or when handing work to someone else.
---

## Why this matters

Agent performance degrades as a conversation grows, and every context reset throws away what was decided. The next session — or the next teammate — starts from zero, re-asks settled questions, and re-derives decisions that were already made. That re-work is pure waste, and worse, the re-derivation often lands somewhere subtly different.

Handoff fixes context decay. It compresses the live session into a tight document holding only what the next agent needs: the decisions made, where things stand, the exact next action, and what's still open. Whoever resumes reads one file and is immediately up to speed — no scrollback archaeology.

## When to use this

- A session is getting long and you feel performance softening.
- Before a deliberate context reset (`/clear`) you intend to resume from.
- Handing work to another agent or teammate.
- End of a work block you'll pick up later.

Don't use it as a substitute for committing real artifacts (decisions belong in ADRs/CONTEXT.md too) — handoff captures *session* state, not project state.

## The flow

A **thin orchestrator** — orient once, write the handoff, delegate state to `sovereign-tools`.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init handoff)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.state` and the handoff target (`.sovereign/HANDOFF.md`). Skim the current `.sovereign/MANIFEST.md` (path from init) so the handoff aligns with recorded state.

**2 — Compress the session into `.sovereign/HANDOFF.md`.** Strip everything except what a fresh agent needs to resume. Required sections:
- **Decisions made this session** — and the *why*, briefly.
- **Current state** — phase, what's done, what's in flight.
- **Next action** — the single most important next step, concrete enough to act on immediately (ideally a copy-paste command).
- **Unresolved / open questions** — what's still undecided, with enough context to pick it up.
- **Watch-outs** — anything that will bite the next agent (gotchas, dead ends already tried).

Be dense. This is a resumption brief, not a transcript. If a decision belongs in an ADR or `CONTEXT.md`, put it there too — `HANDOFF.md` is ephemeral session state.

**3 — Persist.** `node "$ENGINE/bin/sovereign-tools.cjs" state save` (records the stop point + regenerates MANIFEST), then commit via `sovereign-tools commit` if `commit_docs` is on, so the handoff travels with the repo.

## HANDOFF.md format

```markdown
# Handoff — <date>

## Decisions made
- <decision> — <why, in a phrase>

## Current state
Phase <n> — <what's done>; <what's in flight>.

## Next action
<the single most important next step — concrete, ideally a copy-paste command>

## Open questions
- <unresolved item + just enough context to pick it up>

## Watch-outs
- <gotcha, or a dead end already tried so the next agent doesn't repeat it>
```

Keep each section to the essentials — a resumption brief, not a transcript.

## Resuming from a handoff

When a new session starts and `.sovereign/HANDOFF.md` exists, read it first (after MANIFEST). It tells you the decisions, the next action, and the open items — resume from "Next action" without re-deriving anything. Clear or overwrite it once you've absorbed it.

## Navigation

```
▶ NEXT
  Session captured → .sovereign/HANDOFF.md (committed if commit_docs on)
  Safe to /clear now — the next session reads HANDOFF.md and resumes from "Next action".
```
