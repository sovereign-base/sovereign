---
name: deploy-design
description: Plan deployment and infrastructure from the start — budget-aware — covering hosting, containers, IaC, CI/CD, environments, and disaster recovery, recorded as a living DEPLOY_MODEL.md. Use during architecture, before construction, so how you ship is designed, not improvised.
disable-model-invocation: true
argument-hint: "[the system to plan deployment for]"
---

## Why this matters

"How do we deploy it?" answered the week before launch is how projects end up with secrets pasted into a dashboard, no staging environment, no rollback, and a hosting bill that surprises everyone in month three. Deployment designed late is deployment improvised — and infra mistakes are some of the most painful to unwind once there's real traffic and real data.

`deploy-design` has the infrastructure conversation *up front* and *against a budget*: where it runs, how it's packaged, how it's provisioned and shipped, what the environments are, and how you recover when something breaks. It records a `DEPLOY_MODEL.md` so the plan is real before construction, not a scramble at the end.

## When to use this

During architecture, before construction — ideally after `stack-select` and `scale-design` (infra follows the stack and the growth curve). Re-run it when scale, budget, or region requirements change.

**Don't** use it to *provision* anything (no `terraform apply`, no cluster creation) — this designs and records the plan; construction/ops execute it.

## The flow

A **thin orchestrator** over the engine — recommendation-first, budget-first. Delegates persistence to `sovereign-tools`; offers `/adr-log`.

**1 — Orient (one call).**
```bash
INIT=$(node "$ENGINE/bin/sovereign-tools.cjs" init deploy-design)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.state` + project context. Read `STACK.md`/`SCALE_STRATEGY.md`/`SECURITY_MODEL.md` by path if present — infra must honor all three.

**2 — Ask the budget first.** Explicitly: *what is the monthly infra budget?* It changes every recommendation that follows — say so.

**3 — Walk the plan, one decision at a time, recommendation-first:**
- **Hosting model** — self-hosted vs managed cloud vs hybrid.
- **Platform** — AWS / Azure / GCP / DigitalOcean / Hetzner / Fly.io, recommended by budget + scale + region/data-residency, with trade-offs.
- **Container strategy** — Docker, Kubernetes, or simpler (Coolify / Dokploy / Railway) when k8s is overkill.
- **IaC** — Terraform / Pulumi / Ansible / none, with reasoning (don't impose IaC on a one-box deploy).
- **CI/CD** — pipeline shape (build → test → deploy), where it runs.
- **Environments** — dev / staging / prod / preview.
- **Disaster recovery** — backups (what, where, how often, tested) + rollback plan.
Recommend at each step, anchored to the budget and the scale targets — not generic best practice.

**4 — Record + offer ADRs.** Write/update `.sovereign/docs/infra/DEPLOY_MODEL.md`. **Update in place** on re-run. Gate-passing choices (cloud/platform, container strategy, IaC tool) → **offer `/adr-log`** (don't write ADRs here). Then `state save` + `commit` via `sovereign-tools`.

## DEPLOY_MODEL.md format

```markdown
# Deploy Model
Budget: ~$X/mo infra.

## Hosting & platform
Managed: Hetzner VPS + Dokploy (budget fit, EU residency). Not AWS — cost at this scale.

## Containers
Docker; Dokploy orchestrates. Not k8s — single-region, small team, overkill.

## IaC
Ansible for the host; app deploy via Dokploy. (Terraform deferred until multi-region.)

## CI/CD
GitHub Actions: build → test → deploy on main; preview env per PR.

## Environments
dev (local) · staging · prod · per-PR preview.

## Disaster recovery
Nightly DB backup to object storage (30d retention, restore tested quarterly); rollback = redeploy previous image tag.
```

## Navigation

```
▶ NEXT
  Deploy plan recorded → .sovereign/docs/infra/DEPLOY_MODEL.md
  Architecture is now captured — enter Construction:
  /tdd      — build it test-first against the recorded architecture
  /adr-log  — record any gate-passing infra choice (cloud, containers, IaC)
```
