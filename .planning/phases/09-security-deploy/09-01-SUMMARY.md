---
phase: 09-security-deploy
plan: 01
subsystem: skills
tags: [security-design, architecture, m2, hand-authored, disable-model-invocation]
requirements: [ARCH-06, ARCH-08]
key-files: { created: [engine/skills/security-design/SKILL.md] }
---
# Plan 09-01 Summary — security-design (ARCH-06)
Hand-authored thin orchestrator: one `init security-design` call, walks the 5 layers (auth/authz, data classification, app/OWASP, infrastructure, AI/agent prompt-injection) one at a time recommendation-first, assigns a security classification, writes `.sovereign/docs/security/SECURITY_MODEL.md` (in-place + format block), offers /adr-log. disable-model-invocation. validate PASS.
