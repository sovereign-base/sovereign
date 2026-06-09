---
name: api-design
description: Design the contract before the code — a protocol-agnostic API spec over your domain model, decided one choice at a time and recorded as a living API_SPEC.md. Use after the domain is modeled and before building endpoints or clients.
disable-model-invocation: true
argument-hint: "[API or surface to design]"
---

## Why this matters

An API is a promise to everyone who calls it — and once clients depend on it, the promise is expensive to break. Most API pain (the field that means two things, the breaking change shipped without a version, the error nobody can parse) comes from designing the contract *while* writing the handler, one endpoint at a time, with no shared shape.

`api-design` flips that: you decide the contract first — protocol, resources, auth, errors, versioning — against the domain model you already built, and record it as a living `API_SPEC.md` that frontend, mobile, third parties, and construction all build against. The contract becomes the single source of truth instead of the implementation's accidental shape.

## When to use this

After `entity-design` (the API exposes those entities) and before building endpoints or clients. Also when adding a new surface to an existing API, or when consumers keep asking "what's the shape of X?"

**Don't** use it to write server/handler code or generate OpenAPI/proto files — this designs the *contract*; construction implements it. And don't design an API for entities that aren't modeled yet — run `/entity-design` first.

## The flow

A **thin orchestrator** over the engine — conversational, recommendation-first, like `entity-design`. Delegates persistence to `sovereign-tools`; offers `adr-log` for gate-passing decisions.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init api-design)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `context_injection.glossary_path` and `paths.state`. Read the glossary and the Phase-6 model at `.sovereign/docs/ENTITY_MODEL.md` (by path). If `ENTITY_MODEL.md` is absent, say so and suggest `/entity-design` first — degrade gracefully, don't invent entities.

**2 — Walk the contract, one decision at a time, recommendation-first:**
- **Protocol** — recommend by use case (REST for external CRUD, GraphQL for flexible client-driven reads, gRPC for internal service-to-service, events/webhooks/MQTT for async or streaming). More than one is fine; say which surface uses which.
- **Consumers** — frontend / mobile / third-party / another service (shapes auth + versioning).
- **Resources / messages** — map them to the `ENTITY_MODEL.md` entities using glossary terms.
- **Auth** — per endpoint/message (and the scheme: bearer/JWT, scopes, none).
- **Versioning** — strategy + deprecation window. **Errors** — one canonical shape for the whole API. **Pagination** — cursor vs offset. **Rate limiting**. **Webhook/event contracts** where relevant.
Ask one question, give your recommended answer first, wait, then continue.

**3 — Offer ADRs, don't write them.** Protocol and contract choices that pass the three-condition gate (e.g. "REST not GraphQL because…", "cursor pagination", "events over sync HTTP between services") → **offer `/adr-log`**. Do not number or write ADRs here.

**4 — Record the contract.** Write/update `.sovereign/docs/api/API_SPEC.md`. **Update in place** on re-run (match on section/endpoint headings — don't duplicate). Keep it contract-level: no handler code.

**5 — Persist.** `node "$ENGINE/bin/sovereign-tools.cjs" state save`, then `node "$ENGINE/bin/sovereign-tools.cjs" commit "api-design: <surface>" --files .sovereign/docs/api/API_SPEC.md .sovereign/STATE.md .sovereign/MANIFEST.md`.

## API_SPEC.md format

```markdown
# API Specification
Version: 1.0.0   Protocol(s): REST (JSON) + WebSocket (events)
Auth: Bearer JWT unless noted   Base: /api/v{n}/

## Endpoints
### POST /orders
Purpose: place an Order (see ENTITY_MODEL: Order).
Auth: Bearer JWT (scope: orders:write)
Request: { customer_id, line_items[] }   Response: 201 { id, status }
Errors: 400 validation, 402 payment_required
Rate limit: 30/min per user

## Event contracts
Channel/topic: order.placed   Payload: { order_id, placed_at }

## Versioning
Breaking changes → new version; 6-month deprecation window.

## Error format (standard)
{ "code": "ORDER_NOT_FOUND", "message": "...", "trace_id": "..." }
```

## Navigation

```
▶ NEXT
  Contract recorded → .sovereign/docs/api/API_SPEC.md
  /adr-log     — record any gate-passing protocol/contract decision
  /entity-design — if the API revealed a missing or fuzzy entity
```
