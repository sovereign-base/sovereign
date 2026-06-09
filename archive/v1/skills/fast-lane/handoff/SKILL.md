---
name: handoff
phase: system
description: Compresses the current session into a dense handoff document. Any agent resumes with full context.
triggers:
  - "handoff"
  - "save my progress"
  - "end session"
  - "save context"
  - "I need to stop"
  - "continue later"
  - "save state"
works-best-with: claude
compatible-with: [codex, cursor, gemini-cli, copilot, opencode]
min-model: sonnet-class
tokens: minimal
---

## Why This Matters

Agent sessions are not infinite. Context windows fill up. Conversations end.
Engineers sleep.

Every time a session ends without a proper handoff, something is lost —
a decision made in passing, a direction half-agreed, a risk identified but
not documented. The next session starts with questions that were already
answered, re-covering ground that was already covered.

This skill is the equivalent of a surgeon's handoff note — precise,
complete, and structured so the next person can pick up exactly where
the last one stopped. Nothing reconstructed from memory. Nothing assumed.

Run it before every session ends. It costs almost nothing. It saves
everything.

---

## When to Use This Skill

Use this when:

- Ending any SOVEREIGN session
- Context window is getting long (performance degrades)
- Switching between agents or machines
- Handing work to a teammate
- Bridging between phases

Don't use this for:

- Cross-project handoffs — use `/bridge` instead
- Handing off to a different project layer — use `/bridge` instead

---

## Quick Reference

1. Read MANIFEST.md and SOVEREIGN.md
2. Scan session for decisions, actions, and open items
3. Write compressed HANDOFF.md
4. Update MANIFEST.md with current state
5. Output resume instructions

---

## Full Protocol

### Step 1 — Session Scan

The agent reads the full current session context and extracts:

- What was the goal of this session?
- What decisions were made (and were they logged to ADRs)?
- What was built or changed?
- What is currently in progress and incomplete?
- What is blocking progress?
- What was the last agreed next action?

### Step 2 — Check for Unlogged Decisions

Before writing the handoff, the agent checks if any decisions
made during the session were not yet logged as ADRs:

```
⚡ UNLOGGED DECISIONS DETECTED

The following decisions were made this session but not yet
written to docs/adr/:

1. "[Decision description]"
2. "[Decision description]"

Logging them now before handoff...
📝 ADR-[N].md created
📝 ADR-[N+1].md created
```

### Step 3 — Write HANDOFF.md

```markdown
# HANDOFF — [Project Name]

Generated: [timestamp]
Session duration: [approximate]
Agent: [model if known]

## What This Session Was About

[2–3 sentences. What was being worked on and why.]

## What Was Completed

- [Specific thing completed]
- [Specific thing completed]

## Decisions Made This Session

| Decision   | Outcome       | ADR     |
| ---------- | ------------- | ------- |
| [Decision] | [Choice made] | ADR-[N] |

## What Is In Progress (Incomplete)

- [Task or feature currently half-done]
  Status: [where exactly it stopped]
  Next step: [first thing to do to resume]

## Open Questions (Not Yet Resolved)

- [Question] — [context needed to answer it]

## Current Blockers

- [Blocker] — [what would unblock it]

## SOVEREIGN:UNVERIFIED Markers Added This Session

- [file:line] — [what needs verification]

## Phase Status

Current phase: [N — Name]
Gate progress: [N/M conditions met]
Next gate condition: [specific condition to meet]

## Exact Resume Instructions

To resume this session, start a new conversation with:

"I'm resuming work on [project name].
Read .sovereign/HANDOFF.md and .sovereign/MANIFEST.md
and tell me what we were doing and what to do next."

The agent will orient itself from these two files and
continue exactly where this session stopped.

## Files Changed This Session

- [filepath] — [what changed]
- [filepath] — [what changed]
```

### Step 4 — Update MANIFEST.md

The agent updates MANIFEST.md with:

- Current blockers (from this session)
- Next recommended action (first thing to do when resuming)
- Any new key decisions in the quick reference table

### Step 5 — Completion Output

```
HANDOFF COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session compressed and saved.

Decisions logged:    [N]
Open items:          [N]
Unverified markers:  [N]

To resume, start a new session and say:
"Resume [project name] from handoff"

The agent will read HANDOFF.md and MANIFEST.md
and continue from exactly here.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Saved to: .sovereign/HANDOFF.md
```

---

## Resuming From a Handoff

When an engineer starts a new session and says "resume from handoff"
or "continue where we left off", the agent:

1. Reads `.sovereign/HANDOFF.md`
2. Reads `.sovereign/MANIFEST.md`
3. Reads any ADRs referenced in the handoff
4. Outputs a resume brief:

```
RESUMING: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last session: [date]
Phase: [N — Name]

What we were doing:
[2-3 sentence summary from HANDOFF.md]

What was completed:
  ✅ [item]
  ✅ [item]

What's in progress:
  🔄 [item] — [where it stopped]

First thing to do:
  [Specific next action]

Run: /[skill-name] to continue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Output

| File                     | Action              | Description            |
| ------------------------ | ------------------- | ---------------------- |
| `.sovereign/HANDOFF.md`  | Created/Overwritten | Full session state     |
| `.sovereign/MANIFEST.md` | Updated             | Blockers, next action  |
| `docs/adr/ADR-[N].md`    | Created (if needed) | Any unlogged decisions |

---

## Navigation

Available at any point during any phase.  
No "before" or "after" — this is a utility that can run anytime.

---

## Example Session

```
User: I need to stop for today. Save my progress.

Agent: On it. Scanning this session...

       I see 3 decisions were made that aren't yet in ADRs:
       1. You decided to use cursor-based pagination over offset
       2. You decided the Wallet entity lives in the Payments context
       3. You agreed the minimum top-up is 500 NGN

       Logging them now...
       📝 ADR-008.md — Cursor-based pagination
       📝 ADR-009.md — Wallet bounded context
       📝 ADR-010.md — Minimum top-up amount

       Writing HANDOFF.md...

HANDOFF COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Decisions logged:    3
Open items:          2
Unverified markers:  1

To resume, start a new session and say:
"Resume Skoolith from handoff"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Token Cost

Minimal — this skill reads context, it doesn't generate it.

Conservative mode: ~200–400 tokens  
Balanced mode: ~400–700 tokens  
Rich mode: ~700–1,200 tokens

---

_sovereign-base/sovereign v1.0.0_
