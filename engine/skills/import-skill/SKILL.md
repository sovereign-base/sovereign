---
name: import-skill
description: Bring a third-party skill into SOVEREIGN safely — discover it via the npx skills ecosystem, run a five-gate vetting pass (necessity, conflict, security audit, recommendation, logged decision), and install only on a deliberate go. Use when you want to extend your agent with an external skill.
disable-model-invocation: true
argument-hint: "[owner/repo@skill | search query]"
---

## Why this matters

The agent-skills ecosystem is full of genuinely useful third-party skills — and pulling one in is a single command away. But a skill is *instructions your agent will follow*: an unvetted one can carry prompt-injection, exfiltrate data, or quietly grant itself broad permissions. "Just install it" is how a supply-chain problem enters your project.

`import-skill` keeps the convenience without the blind trust. It wraps the `npx skills` ecosystem (SOVEREIGN never reinvents the registry) but refuses to install anything before five gates pass — is it needed, does it conflict, is it safe, what's the recommendation, and is the decision recorded. You get the ecosystem's reach with a paper trail and a security pass.

## When to use this

When you want to add an external skill (you have an `owner/repo@skill` target, or a capability to search for). Re-run it to re-vet a skill before updating.

**Don't** use it to author your own skills (that's the skill-format reference), and don't bypass the audit — the whole point is that nothing is adopted blind.

## The flow

A **thin orchestrator** — it wraps the engine's `extension` commands (which drive `npx skills`); the engine owns the shell-out + the security scan, the skill owns the judgment and the decision record.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init extension)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse the extensions dir (`.sovereign/extensions/`), config, and the project's active tracks / current phase. Zero other orientation reads.

**2 — Discover (optional).** Show what's already installed with `sovereign-tools extension list`. If the user gave a search query rather than a target, surface `npx skills find <query>` results and help them pick an `owner/repo@skill`. SOVEREIGN **wraps**, never reinvents, the registry (R-003).

**3 — The five vetting gates — BEFORE any install, recommendation-first:**
- **① Necessity** — is this skill actually needed for the active tracks / current phase? If it duplicates a SOVEREIGN skill or isn't relevant now, say so.
- **② Conflict** — check against installed skills (`sovereign-tools extension list`) and against recorded decisions (the ADRs in `.sovereign/docs/adr/`). Flag overlaps or contradictions.
- **③ Security audit** — `sovereign-tools extension audit <source>` runs the engine's `scanSkillContent` over the skill's real content (fetched via `skills use`) and returns `{findings, verdict}`. **Drive the gate on the engine's findings, not ad-hoc skill-side scanning.** A `block` verdict means do not install.
- **④ Recommendation** — state it first and plainly: **INSTALL** / **DON'T INSTALL** / **INSTALL WITH CAVEATS**, with the reason.
- **⑤ Logged decision** — write `.sovereign/extensions/<date>-<skill>.md` (timestamp, source, the audit verdict + findings, the recommendation, and the rationale) — so the choice is auditable later.

**4 — Install only on a go.** If the decision is INSTALL (or the user accepts the caveats), run `sovereign-tools extension install <source>` (which calls `skills add --copy -a claude-code -y`). Never install on a `block` audit verdict.

**5 — Persist.** `state save`, then `commit` the decision record via `sovereign-tools`. Navigation footer.

## Decision record format

```markdown
# Extension decision: <owner/repo@skill>
Date: <date>   Verdict: INSTALL | DON'T INSTALL | INSTALL WITH CAVEATS

## Vetting
- Necessity: <needed for which track/phase, or "duplicates X">
- Conflict: <none / overlaps installed <skill> / contradicts ADR-NNNN>
- Security audit: <clean|review|block> — <findings summary>

## Rationale
<why this decision>
```

## What the security audit looks for

`extension audit` (via the engine's `scanSkillContent`) flags three classes in the skill's real content:

- **Data exfiltration** — suspicious outbound calls (curl/fetch to unknown hosts, piping to a shell).
- **Overbroad permissions** — wildcard tool grants the skill doesn't justify.
- **Prompt injection** — embedded instructions to the agent (`[SYSTEM]`, `<<SYS>>`, "ignore previous instructions"), zero-width Unicode.

A `block` verdict is a hard stop; `review` means install only with the caveats noted in the decision record. The audit is the engine's call, not the skill's — so it's consistent across every import.

## Navigation

```
▶ NEXT
  Decision recorded → .sovereign/extensions/<date>-<skill>.md
  INSTALL:          installed via the npx skills ecosystem; re-run /import-skill to re-vet before updates.
  DON'T INSTALL:    nothing changed — the reason is in the decision record.
  WITH CAVEATS:     installed; honor the noted limits (and any ADR you should log via /adr-log).
```
