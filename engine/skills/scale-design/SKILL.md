---
name: scale-design
description: Design how the system holds up under growth — load, read/write mix, caching, queues, data-layer bottlenecks — as a real conversation, not a checklist, recorded as a scaling strategy. Use when scale matters before launch, or before a feature that moves a lot of data.
disable-model-invocation: true
argument-hint: "[the system or surface to scale]"
---

## Why this matters

Systems rarely fall over gracefully — they work fine at 1,000 users and collapse at 50,000, in a spot nobody looked at: a connection pool, an unindexed query, a synchronous call that should have been a queue. "We'll scale it later" usually means "we'll rewrite it under fire later."

`scale-design` has the hard conversation *before* the traffic: what load is actually coming, where the pressure lands first, and what to do about it. It's not a checklist — it's a walk through your real numbers with concrete recommendations ("at 100k users your pool size bottlenecks — here's the fix"), recorded so the strategy survives the next planning session.

## When to use this

When scale is a real requirement before launch, after `stack-select` (the strategy depends on the stack), or before a feature that touches a lot of data. Also any time someone says "will this hold up at N?"

**Don't** use it to provision infrastructure (that's `deploy-design`) or to prematurely optimize a system with no scale requirement — over-engineering for traffic you'll never see is its own failure.

## The flow

A **thin orchestrator** over the engine — recommendation-first, concrete, like its siblings. Delegates persistence to `sovereign-tools`; offers `/adr-log`.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init scale-design)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.state` + project context from the blob. Read `STACK.md`/`ENTITY_MODEL.md` by path if present — bottlenecks are stack- and data-shaped.

**2 — Walk the scaling conversation, one topic at a time, recommendation-first, tied to real numbers:**
- **Expected load** — users/requests at launch, 6mo, 2yr, and worst-case spike.
- **Read/write ratio, data volume, latency targets** — these decide the shape of everything else.
- **Stateless vs stateful** services — what can scale horizontally vs what pins state.
- **Caching** — what to cache, where (app/edge/CDN), and invalidation.
- **Queues / async** — which work moves off the request path.
- **Data layer** — connection pooling, indexing, and the sharding/partitioning *trigger* (not premature).
- **Scaling triggers** — the concrete metric thresholds that say "scale now."
Give a concrete recommendation at each step, anchored to the load numbers — not generic advice.

**3 — Record + offer ADRs.** Write/update `.sovereign/docs/SCALE_STRATEGY.md` (the strategy + the trigger thresholds). Consequential, hard-to-reverse choices (sharding strategy, queue architecture, datastore-for-scale) → **offer `/adr-log`** (don't write ADRs here). Then `state save` and `commit` via `sovereign-tools`.

Stays at the strategy level — no infra provisioning (that's `deploy-design`).

## SCALE_STRATEGY.md format

```markdown
# Scaling Strategy
Targets: launch 5k / 6mo 50k / 2yr 250k users; read:write ≈ 9:1; p95 < 200ms.

## Caching
Cache hot reads in Redis (TTL 60s); CDN for static. Invalidate on write of <entity>.

## Async / queues
Move email + report generation off the request path (queue X).

## Data layer
Pool size 100 + PgBouncer above 50k concurrent. Index <queries>. Shard trigger: >Y rows on <table>.

## Scaling triggers
Scale web horizontally at p95 > 200ms sustained 5m; add read replica at >70% CPU on primary.
```

## Navigation

```
▶ NEXT
  Strategy recorded → .sovereign/docs/SCALE_STRATEGY.md
  /adr-log       — record any hard-to-reverse choice (sharding, queue architecture)
  /security-design — design the security model next (Phase 9)
```
