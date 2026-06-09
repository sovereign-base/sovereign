---
name: verify-self
description: Catch your own uncertainty before it ships — when you're about to assert an API shape, version, endpoint, or config you haven't confirmed against current docs, hard-stop and audit the code you've written since the last verified anchor, then resolve each unverified claim deliberately. Use the moment you notice you're guessing.
disable-model-invocation: true
argument-hint: "[what you're unsure about]"
---

## Why this matters

The most dangerous code an agent writes is the code it's *confident* about and *wrong* about — a payment webhook signature it half-remembers, an SDK method renamed after the training cutoff, a config default that changed. It compiles, it reads fine in review, and it fails in production. The uncertainty was there the whole time; it just never got written down or acted on.

`verify-self` turns that quiet "...I think this is right?" into a hard stop. It audits what you've built since you last anchored to a real doc, names each thing you're actually unsure about as `file:line`, and forces one of three deliberate resolutions — get the doc, mark it, or throw it away — so uncertain code never silently becomes shipped code. It's the verify half of the loop: `anchor-docs` captures ground truth, `verify-self` catches when you've drifted from it, and `sentinel` scans the markers you leave behind.

## When to use this

Reach for it the moment any of these is true — these are the signals to stop and run it (the agent should recognize them and surface this skill; the user can also invoke it directly):

1. **Unverified third-party API shape** — you're about to write an endpoint, payload, or signature you haven't confirmed against the current docs.
2. **Assumed behavior** — you're relying on a default, an ordering guarantee, or an idempotency promise you haven't proven.
3. **Stale-knowledge risk** — the library or API may have changed after your training cutoff.

**Don't** use it as a general code review (that's `/sentinel`) or to silence doubt by rubber-stamping — the point is to *resolve* uncertainty, never to wave it through.

## The flow

A **thin orchestrator** — the engine surfaces the dates and the marker spec; this skill owns the judgment: where the boundary is, what's actually uncertain, and which resolution to take.

**1 — HARD STOP.** Stop writing new code right now. Do not add more on top of code you're unsure about — that just buries the uncertainty deeper. Everything below happens before you continue.

**2 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init verify-self)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.unverified_marker_spec` (the exact marker form to use in choice B) and `paths.external_docs_dir`.

**3 — Establish the boundary ("since the last verified anchor").**
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor list
```
Take the **most-recent `date_retrieved`** across anchors as the last-verified point, then bound the code to audit with git — uncommitted work plus anything since that date:
```bash
git status --short ; git diff ; git log --since="<that-date>" --oneline ; git diff "<since>"..HEAD
```
If there are **no anchors yet**, the boundary is "all un-anchored work on this branch" — treat everything that touches an external API/version/config as unverified.

**4 — Retroactive audit.** Read the bounded changes and surface each unverified claim as **`file:line` + what's uncertain** — one line each, mapped to the signal classes above (unconfirmed API shape / assumed behavior / stale-knowledge risk). If nothing is uncertain, say so and stop. Otherwise present the list and go to the choices — `verify-self` **never silently continues**.

**5 — Resolve each claim (always offer all three; the user chooses).**

- **(A) Provide docs** → hand off to **`/anchor-docs`** to anchor the authoritative source, then re-check the flagged `file:line` against the now-current doc and fix it. (Recommended when the doc is reachable.)
- **(B) Mark `SOVEREIGN:UNVERIFIED` and continue** → write a marker at each unverified `file:line`, in the **exact** form from the spec (`paths.unverified_marker_spec`):
  ```
  <comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>
  ```
  Worked example:
  ```js
  // SOVEREIGN:UNVERIFIED — Paystack webhook signature is HMAC-SHA512? | ref: https://paystack.com/docs/webhooks | 2026-06-09
  ```
  `/sentinel` already scans the literal `SOVEREIGN:UNVERIFIED` token, so every marker becomes a tracked, greppable concern instead of a forgotten thought.
- **(C) Discard and restart with docs** → revert only the unverified change (e.g. `git restore <file>` for the specific hunks, or `git stash` the uncertain work), anchor the doc with `/anchor-docs`, then re-implement against ground truth. (Use when the code is likely wrong and cheap to redo.)

**6 — Persist.** `node ".claude/sovereign-engine/sovereign-tools.cjs" state save`, then commit via `sovereign-tools commit` if `commit_docs` is on, so any markers travel with the repo.

## Navigation

```
▶ NEXT
  You've turned silent uncertainty into a decision. Continue only on code that's
  now anchored, marked, or discarded — nothing unresolved.

  • Chose (A)? → /anchor-docs anchored the source; re-check the flagged file:line
    against it. (anchor-docs also surfaces stale anchors via `anchor check`.)
  • Chose (B)? → the SOVEREIGN:UNVERIFIED markers are now tracked — /sentinel
    scans them, so they surface in review instead of shipping silently.
  • Chose (C)? → re-implement against the doc you just anchored.

  This closes the loop: anchor-docs (ground truth) → verify-self (catch drift) →
  sentinel (scan the markers).
```
