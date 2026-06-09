---
name: adr-log
description: Record an architectural decision — the why behind a hard-to-reverse choice — as a numbered ADR in .sovereign/docs/adr/. Applies the three-condition gate so the log stays signal, not noise. Use when you've made (or are about to lock) a decision that a future reader would question.
disable-model-invocation: true
argument-hint: "\"<the decision>\""
---

## Why this matters

The most expensive question in any codebase is "why on earth did they do it this way?" — asked six months later by someone (maybe you) staring at a choice with no record of the reasoning. The decision gets reverted, the original pain returns, the cycle repeats.

An ADR is one paragraph that ends that cycle: what the context was, what you decided, and why. It's not bureaucracy — it's a note to the future. `adr-log` makes recording one a single step, and (just as importantly) it **refuses** to record decisions that aren't worth it, so the log stays something people actually read.

## When to use this

Run it when a decision is **hard to reverse, surprising without context, and the result of a real trade-off** — a database choice, an integration pattern, a deliberate deviation from the obvious path, a constraint not visible in the code. Other skills (`entity-design`, `grill-with-docs`, the later architecture skills) point you here when they hit such a choice.

**Don't** log easily-reversible choices, obvious ones, or things with no real alternative — those go in `CONTEXT.md` or the code itself, not the ADR log.

## The flow

A **thin orchestrator** over the engine — it owns ADR numbering and the gate; it delegates persistence to `sovereign-tools`. Implements [`engine/references/adr-format.md`](../../references/adr-format.md).

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init adr-log)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.state` and the project root. (The default `init` blob does not carry the ADR list — this skill scans the directory itself in step 3.)

**2 — Apply the three-condition gate.** Before writing anything, check the decision against all **three** conditions:
1. **Hard to reverse** — changing your mind later costs real time.
2. **Surprising without context** — a future reader will wonder why.
3. **A real trade-off** — there were genuine alternatives and you picked one for reasons.

If **any** condition is missing, **decline**: tell the user this isn't ADR-worthy and advise recording it in `CONTEXT.md` or the plan instead. Do not pad the log — a decline is a feature, not a failure.

**3 — Number it.** Scan `.sovereign/docs/adr/` for the highest existing `NNNN-*.md`, add one, zero-pad to four digits. Derive a short kebab-case slug from the decision (e.g. `0007-paystack-over-flutterwave`).

**4 — Write the minimal form.** Create `.sovereign/docs/adr/NNNN-slug.md` — **1–3 sentences**: the context, the decision, and the why. Add optional `Status` / `Considered options` / `Consequences` sections **only** when they add real value (most ADRs need none).

```markdown
# 0007-paystack-over-flutterwave

We use Paystack as the primary gateway, not Flutterwave, because settlement is
faster in our launch market and webhook signing is simpler to verify. Flutterwave
stays a documented fallback.
```

**5 — Persist.** `node ".claude/sovereign-engine/sovereign-tools.cjs" state save`, then `node ".claude/sovereign-engine/sovereign-tools.cjs" commit "adr: NNNN <slug>" --files <the new ADR> .sovereign/STATE.md .sovereign/MANIFEST.md`. The engine handles commit_docs + gitignore.

## What qualifies (and what doesn't)

**Log it** — passes all three conditions:
- A technology choice that carries lock-in (database, message bus, auth provider).
- An integration pattern between contexts ("Ordering and Billing talk via events, not HTTP").
- A deliberate deviation from the obvious path ("manual SQL instead of an ORM because X").
- A constraint not visible in the code ("must stay under 200ms for the partner SLA").
- A boundary/scope decision, including the explicit *no*s.

**Decline it** — record in `CONTEXT.md` or the code instead:
- Which utility library to use, or a naming choice.
- Anything you'd happily reverse next week.
- The obvious default where there was no real alternative.

When you decline, say *why* it failed the gate (which condition is missing) so the user learns the line — that's how the log stays worth reading.

## Navigation

```
▶ NEXT
  Logged ADR NNNN (or: declined — recorded in CONTEXT.md instead).
  /entity-design  — model the domain these decisions shape
  /grill-with-docs — keep interrogating the plan; it offers ADRs through this skill
```
