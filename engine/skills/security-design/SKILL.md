---
name: security-design
description: Design security as a layered model up front — auth, data, application/OWASP, infrastructure, and AI/agent risks — recorded as a living SECURITY_MODEL.md. Use during architecture, before construction, especially for anything touching auth, payments, or personal data.
disable-model-invocation: true
argument-hint: "[the system or surface to secure]"
---

## Why this matters

Security bolted on at the end is security that doesn't hold. Auth gets retrofitted, secrets end up in env files nobody rotated, the threat model lives only in one person's head — and the breach finds the layer no one designed. Worse, "we'll secure it later" almost always means "we'll find out in production."

`security-design` makes the model explicit *before* construction: who can do what, how data is classified and protected, which application and infrastructure attacks you've actually accounted for, and — increasingly — how the agent layer itself is defended. It's state-of-the-art-by-layer, not a checkbox list, and it records a `SECURITY_MODEL.md` the whole team (and every future session) builds against.

## When to use this

During architecture, before construction — and mandatory for anything touching authentication, payments, health/financial/personal data, or a regulated domain. Re-run it when a new surface changes the threat model.

**Don't** use it to *implement* controls or run a code-level audit (that's construction + the deferred `security-review`). This designs and records the model.

## The flow

A **thin orchestrator** over the engine — recommendation-first, by layer. Delegates persistence to `sovereign-tools`; offers `/adr-log`.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init security-design)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.state` + project context. Read `ENTITY_MODEL.md`/`STACK.md` by path if present — data sensitivity and attack surface are entity- and stack-shaped.

**2 — Walk the layers, one at a time, recommendation-first:**
- **Auth & authz** — strategy (sessions / JWT / OAuth 2.1 / passkeys / magic links); RBAC vs ABAC vs ReBAC by complexity; multi-tenancy isolation; token refresh, revocation, rotation.
- **Data security** — classification (public / internal / confidential / restricted); encryption at rest + in transit (which algorithms, key management); PII handling, minimization, right-to-erasure; secrets management.
- **Application (OWASP)** — input validation + sanitization; SQL/NoSQL injection prevention; XSS / CSRF / CORS; rate limiting + abuse prevention; dependency vulnerability scanning.
- **Infrastructure** — network segmentation + firewall rules; least privilege for every service; audit logging (who did what, when, from where); an intrusion-detection baseline.
- **AI / agent (OWASP Agentic)** — prompt-injection prevention; skill supply-chain vetting; agent permission scoping.
Recommend at each layer; assign an overall **security classification** (low / medium / high / critical) that sets the rigor bar.

**3 — Record + offer ADRs.** Write/update `.sovereign/docs/security/SECURITY_MODEL.md` (the layered model + the classification). **Update in place** on re-run. Gate-passing choices (auth model, tenancy isolation, encryption/KMS strategy) → **offer `/adr-log`** (don't write ADRs here). Then `state save` + `commit` via `sovereign-tools`.

## SECURITY_MODEL.md format

```markdown
# Security Model
Classification: high (handles PII + payments).

## Auth & authz
OAuth 2.1 + short-lived JWT, refresh rotation; ABAC for per-tenant resource rules.

## Data security
Restricted: card data (never stored — tokenized via gateway). Confidential: PII (encrypted at rest, KMS-managed keys). Secrets in a managed vault, rotated 90d.

## Application (OWASP)
Parameterized queries only; CSP + CSRF tokens; per-IP + per-user rate limits; dependency scan in CI.

## Infrastructure
Private subnets for data tier; least-privilege IAM; audit log shipped to <store>.

## AI / agent
Untrusted input never reaches a tool call unsanitized; extensions vetted before install; agent scoped to <permissions>.
```

## Navigation

```
▶ NEXT
  Security model recorded → .sovereign/docs/security/SECURITY_MODEL.md
  /deploy-design — design the infra this model runs on
  /adr-log       — record any gate-passing choice (auth model, encryption, tenancy)
```
