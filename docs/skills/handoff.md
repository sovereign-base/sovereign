# /handoff

*Beat context decay — capture the session so the next agent resumes with zero re-derivation.*

## What it does

Compresses the current session into a dense, resumable document at `.sovereign/HANDOFF.md` holding only what the next agent needs: the decisions made (and why), where things stand, the single most important next action, open questions, and watch-outs. Whoever resumes reads one file and is immediately up to speed.

## When to use it

When a session is getting long and performance is softening; before a deliberate context reset (`/clear`) you intend to resume from; when handing work to another agent or teammate; at the end of a work block. **Don't** use it as a substitute for committing real artifacts — decisions belong in ADRs / `CONTEXT.md` too; `HANDOFF.md` is ephemeral *session* state.

## How it works

A thin orchestrator: one `sovereign-tools init handoff` call gives it the handoff target + state path; it writes the compressed brief (decisions / current state / next action / open questions / watch-outs), then delegates `state save` (recording the stop point) and a commit to the engine so the handoff travels with the repo.

## Outputs

- `.sovereign/HANDOFF.md` — the resumption brief (committed if `commit_docs` is on).

## Navigation

- **After writing:** safe to `/clear` — the next session reads `HANDOFF.md` and resumes from "Next action".
- Clear or overwrite `HANDOFF.md` once the next session has absorbed it.

Part of the Fast Lane — installed by `npx sovereign-cli init --quick`.
