# Phase 9: Security & Deploy Design - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 9, `/SOVEREIGN.md` §6, the M1 references + the Phase 6-8 M2 siblings (proven pattern). The LAST M2 phase — closes SOVEREIGN's Architecture phase. Both skills NEW; author from references + sibling pattern.

<domain>
## Phase Boundary

Phase 9 builds the final two architecture skills: **`security-design`** (layered security model) and **`deploy-design`** (budget-aware deployment/infra plan). Thin orchestrators over the M1 engine; mutually independent; both compose with `adr-log`. After this phase, M2 (Architecture) is complete and ARCH-08 (the cross-cutting budget/shape rule) closes — `doctor` must still show 5 auto-triggerable after all 7 M2 skills are installed.

**In scope:** `engine/skills/security-design/SKILL.md`, `engine/skills/deploy-design/SKILL.md`.

**Out of scope:** engine changes; new subagents; actually configuring security controls or provisioning infra (these *design and record*); the M1-deferred `security-review` (mid-construction pass).
</domain>

<decisions>
## Implementation Decisions

### Shape (ARCH-08, same as siblings)
Both: `disable-model-invocation: true`; one `sovereign-tools init <skill>` call (+ `@file:` guard); `## Why this matters`; recommendation-first, one decision at a time; navigation footer; state/commit delegated; `--full` install (NOT FAST_LANE); passes `validate skills`; ≥70 lines. Both **offer `/adr-log`** for gate-passing choices and **update their doc in place** on re-run. Mirror `api-design`/`stack-select`.

### `security-design` (ARCH-06)
State-of-the-art, layered — not checkbox security.
- **Flow:** `init security-design` → read project context (entities/stack if present — data sensitivity is entity-shaped) → walk the layers one at a time, recommendation-first:
  - **Auth & authz** — auth strategy (sessions/JWT/OAuth2.1/passkeys/magic links), RBAC vs ABAC vs ReBAC, multi-tenancy isolation, token refresh/revocation/rotation.
  - **Data security** — classification (public/internal/confidential/restricted), encryption at rest + in transit, PII handling + minimization + erasure, secrets management.
  - **Application (OWASP)** — input validation, injection prevention, XSS/CSRF/CORS, rate limiting + abuse, dependency scanning.
  - **Infrastructure** — network segmentation, least privilege, audit logging (who/what/when/from where), intrusion-detection baseline.
  - **AI/agent (OWASP Agentic)** — prompt-injection prevention, skill supply-chain vetting, agent permission scoping.
  - Give a recommendation per layer; assign a security classification (low/medium/high/critical). → Record to `.sovereign/docs/security/SECURITY_MODEL.md`. → Gate-passing choices (auth model, tenancy isolation, encryption/KMS) → **offer `/adr-log`**.

### `deploy-design` (ARCH-07)
Full infrastructure conversation from the start — **budget-aware**.
- **Flow:** `init deploy-design` → **ask the budget explicitly** (monthly infra spend) → walk, one at a time, recommendation-first:
  - **Self-hosted vs managed cloud vs hybrid**; **platform** options with trade-offs (AWS/Azure/GCP/DigitalOcean/Hetzner/Fly.io) recommended by budget + scale + region;
  - **Container strategy** (Docker / k8s / simpler: Coolify/Dokploy/Railway);
  - **IaC** decision (Terraform/Pulumi/Ansible/none, with reasoning);
  - **CI/CD** pipeline; **environments** (dev/staging/prod/preview); **disaster recovery + backups**.
  - → Record to `.sovereign/docs/infra/DEPLOY_MODEL.md`. → Gate-passing choices (cloud/platform, container strategy, IaC) → **offer `/adr-log`**. Reads `STACK.md`/`SCALE_STRATEGY.md` by path if present (infra follows the stack + scale).
- Stays at the plan level — no actual provisioning.

### Claude's Discretion
- Exact `SECURITY_MODEL.md` / `DEPLOY_MODEL.md` layouts (a per-layer / per-topic block + the chosen option + rationale is the intent).
- Whether to read prior architecture docs to inform recommendations — fine, by path, degrade gracefully.
- Navigation footers (deploy-design's footer should point toward Construction / M1's `tdd`+`sentinel`, since this closes Architecture).
</decisions>

<canonical_refs>
## Canonical References
**MUST read before authoring:**
- `engine/references/skill-format.md` — the thin-orchestrator standard.
- `engine/skills/api-design/SKILL.md` + `engine/skills/stack-select/SKILL.md` — sibling M2 skills to mirror (init orient, recommendation-first one-at-a-time, offers adr-log, writes a docs file + a `## <ARTIFACT>.md format` block, in-place update, disable-model-invocation, budget-asking in stack-select).
- `engine/references/adr-format.md` — the gate both skills offer decisions against.
- `engine/bin/lib/init.cjs` — the `init <skill>` default blob; the scaffolded `.sovereign/docs/security/` + `docs/infra/` dirs (these are the write targets, already in the template tree).
- `/SOVEREIGN.md` §6 + the v1 `security-design`/`deploy-design` descriptions in `archive/v1/SOVEREIGN_PROJECT.md` (the layered security model + budget-aware deploy conversation are spelled out there — mine them).
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dirs: `engine/skills/security-design/`, `engine/skills/deploy-design/` (NOT FAST_LANE).
- security-design → `.sovereign/docs/security/SECURITY_MODEL.md`; deploy-design → `.sovereign/docs/infra/DEPLOY_MODEL.md` (both dirs ship in the scaffolded tree).
- **ARCH-08 closes here:** after this phase, `doctor` on a `--full` install must show **5 auto-triggerable** + **8 disabled** (council + the 7 M2 skills) and no warnings — the listing-budget guarantee held across the whole milestone.
- The two are independent — author in either order.
</specifics>

<deferred>
## Deferred Ideas
- `security-review` (mid-construction security pass against this model) — M1 listed it deferred; later.
- `anchor-docs`/`verify-self` (verifying current security/infra docs) — M3.
- Microservices deploy concerns (per-service pipelines, distributed tracing) — M4+.
</deferred>

---

*Phase: 09-security-deploy*
*Context gathered: 2026-06-09 — the final M2 phase, authored from M1 references + the Phase 6-8 sibling pattern*
