# SOVEREIGN — Requirements (Milestone M2: Architecture phase skills · v1.1)

Derived from `/SOVEREIGN.md` §6/§8 + the locked content in `archive/v1/`. Builds on the verified M1 foundation.
"User" = an engineer or agent using SOVEREIGN inside their own project.

> **M1 (Foundation, v1.0) shipped 28/28 requirements** — engine, installer, Council, Fast Lane 5, conventions. Recorded in PROJECT.md (Validated) and git history. This document scopes **M2**.

---

## M2 Requirements (Architecture)

SOVEREIGN's Phase-3 (Architecture) skills: conversational, recommendation-first design skills that turn a grilled idea into a recorded architecture. Each writes durable artifacts under `.sovereign/docs/`.

### Architecture design skills

- [x] **ARCH-01**: `adr-log` — a user can record an architectural decision to `.sovereign/docs/adr/NNNN-slug.md`, sequentially numbered, in the minimal form, and the skill applies the three-condition gate (hard-to-reverse + surprising + real trade-off) per `adr-format.md`.
- [x] **ARCH-02**: `entity-design` — a user can define the domain model (entities, relationships, bounded contexts) one piece at a time, using the `CONTEXT.md` glossary, recorded to `.sovereign/docs/`.
- [x] **ARCH-03**: `api-design` — a user can design a contract-first API (protocol-agnostic: REST/GraphQL/gRPC/events) and the skill produces a living `.sovereign/docs/api/API_SPEC.md` (endpoints/messages, auth, versioning, errors, pagination).
- [ ] **ARCH-04**: `stack-select` — a user gets a guided, recommendation-first stack selection based on project type, scale, budget, and constraints (not trend-following); the choice is recorded (ADR-worthy decisions offered).
- [ ] **ARCH-05**: `scale-design` — a user is walked through a scaling conversation (expected load, read/write ratio, caching, queues, data-layer bottlenecks) producing a recorded strategy + ADRs.
- [ ] **ARCH-06**: `security-design` — a user designs a layered security model (auth/authz, data classification, app/OWASP, infra, agent/prompt-injection) recorded to `.sovereign/docs/security/SECURITY_MODEL.md`.
- [ ] **ARCH-07**: `deploy-design` — a user designs a budget-aware deployment/infra plan (self-hosted vs managed, container strategy, IaC, CI/CD, environments, DR) recorded to `.sovereign/docs/infra/DEPLOY_MODEL.md`.

### Cross-cutting

- [ ] **ARCH-08**: Every M2 skill is a thin orchestrator over the M1 engine — orients via one `sovereign-tools init <skill>` call, recommendation-first, one-question-at-a-time where conversational, with a "Why this matters" section and a navigation footer (per `skill-format.md`). They set `disable-model-invocation: true` (phase-gated, user-invoked), so `sovereign-tools doctor` still reports the auto-trigger budget at the 5 Fast Lane skills. No engine changes; `validate skills` passes for all.

---

## Deferred (M3+)

- `anchor-docs` / `verify-self` — the architecture skills *flag* when current external docs are needed (anti-stale-knowledge), but the anchor skills themselves are M3.
- `sovereign-adopt`, `bridge`, extension protocol — M3.
- `service-design` / `service-contract` / `event-catalog` / `dependency-map` (microservices overlay) — M4+.
- Revenue-model → architecture coupling, track-intersection auto-docs — later.

---

## Out of Scope

- Engine changes — M2 is pure skill authoring (the `init` default case already serves arbitrary skill names).
- Adding M2 skills to the auto-trigger set — they are phase-gated, user-invoked (`disable-model-invocation`), to protect the listing budget.
- Running the project's actual infra/build — these skills *design and record*; execution stays with the project's own stack (stack-agnostic, per the M1 anti-feature stance).

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 6 | Complete |
| ARCH-02 | Phase 6 | Complete |
| ARCH-03 | Phase 7 | Complete |
| ARCH-04 | Phase 8 | Pending |
| ARCH-05 | Phase 8 | Pending |
| ARCH-06 | Phase 9 | Pending |
| ARCH-07 | Phase 9 | Pending |
| ARCH-08 | Phases 6, 7, 8, 9 (cross-cutting) | Pending |

**Coverage:** 8/8 M2 requirements mapped. ARCH-08 is cross-cutting (a success criterion of every M2 skill phase); ARCH-01..07 each map to exactly one phase.
