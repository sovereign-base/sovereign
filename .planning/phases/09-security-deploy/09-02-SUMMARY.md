---
phase: 09-security-deploy
plan: 02
subsystem: skills
tags: [deploy-design, architecture, m2, hand-authored, disable-model-invocation]
requirements: [ARCH-07, ARCH-08]
key-files: { created: [engine/skills/deploy-design/SKILL.md] }
---
# Plan 09-02 Summary — deploy-design (ARCH-07)
Hand-authored thin orchestrator: one `init deploy-design` call, ASKS the budget first, walks hosting/platform/containers/IaC/CI-CD/environments/DR one decision at a time recommendation-first anchored to budget+scale, writes `.sovereign/docs/infra/DEPLOY_MODEL.md` (in-place + format block), offers /adr-log, footer routes to Construction. disable-model-invocation. validate PASS.
ARCH-08 CLOSES: doctor on --full install = 13 skills, 5 auto / 8 disabled, no warnings — listing budget held across the entire M2 milestone. 77 tests pass.
