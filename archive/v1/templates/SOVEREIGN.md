# SOVEREIGN.md

<!--
  Project constitution. Phase gate log. Track registry. Extension registry.
  This file is append-only for phase gates — never overwrite, always append.
  Edited by: /sovereign-init, phase gate completions, /import-skill
-->

**Project:** [project-name]  
**Initialised:** [date]  
**Mode:** [--quick | --full | --adopt]  
**Context Strategy:** balanced

<!-- Options: conservative (minimal output) | balanced (default) | rich (full explanations) -->

---

## Active Tracks

<!-- Set during /sovereign-init. Add tracks with /sovereign-init --add-track -->

- [ ] Frontend (Web)
- [ ] Frontend (Desktop)
- [ ] Backend
- [ ] Mobile
- [ ] IoT / Embedded
- [ ] Data Platform
- [ ] AI / ML
- [ ] DevOps
- [ ] Microservices mode

---

## Phase Gate Log

<!-- APPEND ONLY. Never edit existing entries. -->

### Phase 0 — Setup

**Status:** ⏳ In Progress  
**Started:** [date]  
**Gate conditions:**

- [ ] MANIFEST.md created
- [ ] SOVEREIGN.md created
- [ ] CONTEXT.md created
- [ ] docs/ structure created
- [ ] Active tracks selected
- [ ] Context strategy set

---

### Phase 1 — Ideation

**Status:** 🔒 Locked (Phase 0 must pass first)  
**Gate conditions:**

- [ ] /council completed — transcript saved
- [ ] /grill-idea completed
- [ ] /revenue-model completed (if applicable)
- [ ] /ubiquitous-language — minimum 5 terms defined
- [ ] Council verdict: PASS or CONDITIONAL PASS

---

### Phase 2 — Specification

**Status:** 🔒 Locked  
**Gate conditions:**

- [ ] /grill-with-docs completed
- [ ] /write-spec completed — all acceptance criteria defined
- [ ] /api-spec completed (if applicable)
- [ ] Scale targets defined
- [ ] Security classification assigned [low | medium | high | critical]
- [ ] /to-prd completed

---

### Phase 3 — Architecture

**Status:** 🔒 Locked  
**Gate conditions:**

- [ ] /entity-design completed
- [ ] /api-design completed
- [ ] /scale-design completed
- [ ] /security-design completed
- [ ] /deploy-design completed — budget confirmed, platform chosen
- [ ] /stack-select completed — stack locked
- [ ] All ADRs logged
- [ ] Track intersection documents created (if 2+ tracks)
- [ ] Revenue-Architecture Impact Report reviewed (if revenue model defined)

---

### Phase 4 — Construction

**Status:** 🔒 Locked  
**Gate conditions:**

- [ ] /vertical-slice — first end-to-end slice complete
- [ ] All spec acceptance criteria met
- [ ] Tests passing
- [ ] /sentinel — PASS verdict
- [ ] 0 SOVEREIGN:UNVERIFIED markers (or all acknowledged)
- [ ] /security-review completed
- [ ] Architecture not degraded (/improve-architecture run)

---

### Phase 5 — Deployment

**Status:** 🔒 Locked  
**Gate conditions:**

- [ ] /pre-flight checklist — all green
- [ ] /db-migration-plan completed (if applicable)
- [ ] /observability-setup completed
- [ ] Rollback plan confirmed and tested
- [ ] 0 unacknowledged SOVEREIGN:UNVERIFIED markers
- [ ] 0 unacknowledged stale bridges
- [ ] /scale-test completed

---

### Phase 6 — Operations

**Status:** 🔒 Locked (activates after first deployment)  
**Activated:** —

---

## Council Sessions

<!-- Appended by /council -->

| Date | Mode | Question | Verdict | File |
| ---- | ---- | -------- | ------- | ---- |
| —    | —    | —        | —       | —    |

---

## Extension Registry

<!-- Appended by /import-skill -->

| Skill | Source | Track | Installed | Conflicts |
| ----- | ------ | ----- | --------- | --------- |
| —     | —      | —     | —         | —         |

---

## Skill Lock Log

<!-- Appended when a skill starts writing, cleared when complete -->

| Skill | Started | By  | Status |
| ----- | ------- | --- | ------ |
| —     | —       | —   | —      |

---

<!-- sovereign-base/sovereign v1.0.0 -->
