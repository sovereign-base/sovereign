---
name: bridge
description: Hand off one project's hard-won context to another — generate a BRIDGE.md (API contracts, auth, glossary, decisions already made) that a consuming project imports, with hash-based staleness detection so it never silently goes out of date. Use when starting a frontend/mobile/service that builds on this one.
disable-model-invocation: true
argument-hint: "[bridge name]"
---

## Why this matters

When you finish a backend and start the mobile app that consumes it, the new project starts from zero — re-asking what the auth flow is, what the endpoints look like, what "Order" means here, which decisions are already locked. The knowledge exists; it's just trapped in the first project. So the second team guesses, drifts, and rebuilds against a contract that was never written down.

`bridge` extracts that knowledge into one document the consuming project imports and is *immediately informed* by. And because a contract is only useful while it's true, the bridge records a hash of the source it was built from — so when the backend's API or auth later changes, re-running `bridge` tells you exactly what drifted instead of letting the consumer build against a stale promise.

## When to use this

When you're about to start a project that consumes or extends this one — a frontend/mobile client, another microservice, a third-party integration. Re-run it when the source's API, security model, or domain language changes (the staleness check will tell you it has).

**Don't** use it as general docs (it's a handoff contract, not a wiki), and don't hand-maintain the hashes — the engine owns those.

## The flow

A **thin orchestrator** — the engine does all hashing and registry diffing (`bridge.cjs`); this skill owns *which* docs to include, the BRIDGE.md prose, and the staleness UX.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init bridge)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse the bridgeable source docs that exist (API_SPEC.md, SECURITY_MODEL.md, CONTEXT.md, relevant ADRs — at their real `.sovereign/docs/...` paths), `paths.registry` (`.sovereign/bridges/registry.json`), and git info. Zero other orientation reads.

**2 — Check staleness FIRST.**
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" bridge check --id <name>
```
If `fresh:true` (combined hash matches a prior bridge) → tell the user it's up to date and **stop** (don't regenerate needlessly). If stale → name the `changed` source paths and continue. (`reason:no_registry` → first run; continue.)

**3 — Assemble the BRIDGE.md prose** (the judgment the engine can't do) from the source docs the `init` blob listed:
- **What this project exposes** — API contracts (from API_SPEC.md), auth/security summary (from SECURITY_MODEL.md), shared domain glossary (from CONTEXT.md).
- **Decisions already made — don't re-make these** — the relevant ADRs.
- **What the consuming project still needs to decide** — the gaps the source doesn't cover.

**4 — Hash + write frontmatter.**
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" bridge hash --files <the source docs> --raw
```
This returns `{ files: [{path, sha256}], combined }`. Write `.sovereign/BRIDGE.md` with the frontmatter below, taking `combined_hash` from `combined` and `sources_hashed` from `files` — **never compute hashes yourself.**

**5 — Record + persist.** Write/update `paths.registry` (`.sovereign/bridges/registry.json`) so the next `bridge check` can diff — keyed by bridge name, each entry `{ combined_hash, sources_hashed, generated, source_commit }` (the exact shape `bridge check` reads). Then `state save` and `commit` via `sovereign-tools`. Navigation footer.

## BRIDGE.md format

```markdown
---
bridge_version: 1
source_repo: <git remote / owner-repo>
source_commit: <short sha>
generated: <date>
combined_hash: <from `bridge hash` .combined>
sources_hashed:
  - { path: .sovereign/docs/api/API_SPEC.md, sha256: <hex> }
  - { path: .sovereign/CONTEXT.md, sha256: <hex> }
---
# Bridge: <source> → <consumer>

## What this project exposes
- API: <contracts from API_SPEC.md> · Auth: <summary from SECURITY_MODEL.md>
- Domain glossary: <key terms from CONTEXT.md>

## Decisions already made (don't re-make)
- ADR-0007: Paystack over Flutterwave — <why>

## What the consuming project still decides
- <state management / offline sync / its own auth surface …>
```

## Navigation

```
▶ NEXT
  Bridge written → .sovereign/BRIDGE.md (hash recorded in bridges/registry.json)
  In the consuming project: import this BRIDGE.md on init to start informed.
  Re-run /bridge here whenever the API / security model / glossary changes — staleness is detected by hash.
```
