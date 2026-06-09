---
phase: 10-engine-additions
plan: 02
subsystem: engine
tags: [security, scanSkillContent, vetting, prompt-injection, exfiltration, owasp, zero-dep]

# Dependency graph
requires:
  - phase: M1 (engine foundation)
    provides: security.cjs sanitizeForPrompt regex toolkit (zero-width + [SYSTEM]/[INST]/<<SYS>>/role-tag markers), node:test patterns, zero-dep .cjs discipline
provides:
  - "engine/bin/lib/security.cjs — scanSkillContent(text) pure pattern scanner returning { findings, verdict }"
  - "data-driven SKILL_SCAN_PATTERNS table covering exfiltration / overbroad_permission / prompt_injection"
  - "verdict escalation contract: high→block, medium→review, none→clean"
  - "engine/test/security.test.cjs — 14-case node:test suite incl. sanitizeForPrompt regression"
affects: [12-extension-skill, EXT-02, extension-audit, "10-04 extension.cjs (audit calls scanSkillContent)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data-driven pattern table (SKILL_SCAN_PATTERNS) so detection cases are enumerable + unit-testable"
    - "Pure function — no I/O, no throw; non-string/empty input → safe { findings: [], verdict: 'clean' }"
    - "Reuse existing regex toolkit (sanitizeForPrompt markers) rather than re-deriving injection patterns"
    - "Severity-ranked verdict via VERDICT_RANK monotonic escalation"

key-files:
  created:
    - engine/test/security.test.cjs
  modified:
    - engine/bin/lib/security.cjs

key-decisions:
  - "Verdict escalation: any high finding → 'block'; any medium (no high) → 'review'; low findings reported but do not lift above 'clean' on their own"
  - "Zero-width regex uses the escaped \\u200B-\\u200F\\u2028-\\u202F\\uFEFF\\u00AD class (literal invisible chars break the regex literal — U+2028/2029 terminate it)"
  - "OWASP mapping noted in JSDoc; live OWASP GenAI/Agentic pages were UNREACHABLE (offline) so the three CONTEXT categories were grounded against LLM01/LLM02/LLM06 + the Agentic taxonomy — re-verify + extend SKILL_SCAN_PATTERNS when network is available"
  - "ENG-08 left In Progress (phase-scoped — closes at final Phase-10 plan 10-05), matching 10-01"

patterns-established:
  - "Engine owns the mechanical pattern scan; Phase-12 extension skill owns necessity/conflict/recommendation judgment (engine-first split)"

requirements-progressed: [ENG-08]

metrics:
  duration_min: 4
  tasks: 2
  files: 2
  completed: 2026-06-09
---

# Phase 10 Plan 02: scanSkillContent Security Scanner Summary

Added `scanSkillContent(text)` to the zero-dep engine `security.cjs` — a pure, data-driven pattern scanner that audits materialized third-party skill content for data exfiltration, overbroad permission grants, and prompt injection, returning `{ findings: [{category, severity, evidence}], verdict: 'clean'|'review'|'block' }`. It reuses the existing `sanitizeForPrompt` zero-width/marker regex toolkit and is the EXT-02 vetting substrate that Plan 10-04's `extension audit` and the Phase-12 extension skill wrap.

## What Was Built

**Task 1 — scanSkillContent in security.cjs** (commit 4732987)
- Module-level `SKILL_SCAN_PATTERNS` array of `{ category, severity, re }` entries (data-driven, enumerable, testable).
  - **exfiltration**: `curl|wget | sh/bash` pipes (high), any pipe-to-shell (high), raw `curl/wget https://…` (medium), `fetch(`/`XMLHttpRequest`/`http(s).request(` (medium), webhook sinks — Slack/Discord/`*webhook*` URLs (medium).
  - **overbroad_permission**: `allowed-tools: *` (high), unconstrained `Bash` grant (medium), `paths: **/*` `/` `**` (medium), `disable-model-invocation: false` (low).
  - **prompt_injection**: zero-width/invisible Unicode (high), `[SYSTEM]`/`[INST]` (high), `<<SYS>>` (high), `<system|assistant|human>` tags (high), `ignore (all) previous instructions` (high), `disregard (the) above|prior` (high) — reuses the sanitizeForPrompt marker set.
- Pure function: non-string/empty input → `{ findings: [], verdict: 'clean' }`; never throws. Evidence captured per match, whitespace-collapsed and truncated to 120 chars.
- Verdict via `VERDICT_RANK` monotonic escalation (high→block, medium→review, low/none→clean).
- `module.exports` extended to `{ sanitizeForPrompt, scanSkillContent }`; `sanitizeForPrompt` untouched.

**Task 2 — security.test.cjs** (commit 05ed69b)
- 14 node:test cases: benign→clean; exfiltration (curl|bash + fetch); overbroad (`*` + Bash); prompt-injection (zero-width via `String.fromCharCode(0x200b)`, ignore-previous, `[SYSTEM]`); verdict escalation (block/review/clean); all-three-categories sample; sanitizeForPrompt regression (still neutralizes `[SYSTEM]`→`[SYSTEM-TEXT]`); bad-input safety (null/undefined/''/numbers/objects/arrays).

## Verification

- `npm test` (project standard `node --test "test/**/*.test.cjs"`): **101 pass, 0 fail** (14 new).
- `node --check bin/lib/security.cjs`: clean.
- `function scanSkillContent` present (line 149); exported (line 169); `sanitizeForPrompt` still exported (line 168).
- `engine/package.json` `dependencies`: `{}` (unchanged).
- Line gates: security.cjs 170 lines, security.test.cjs 118 lines (both ≥70).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zero-width regex literal broke `node --check`**
- **Found during:** Task 1 verification.
- **Issue:** Authoring the zero-width pattern with literal invisible characters in the source produced `SyntaxError: Invalid regular expression: missing /` because U+2028/U+2029 (line/paragraph separators) terminate a JS regex literal.
- **Fix:** Replaced the literal-char class with the escaped form `/[​-‏ - ﻿­]/` — identical to the class `sanitizeForPrompt` already uses.
- **Files modified:** engine/bin/lib/security.cjs
- **Commit:** 4732987 (fixed before the task commit).

### Note: OWASP re-verification fallback (per plan instruction, not a deviation)
The plan's Task 1 directs re-verifying the current OWASP Agentic Top-10 via WebFetch. The OWASP GenAI/Agentic pages were **unreachable (network timeout)** in this environment, so — exactly as the plan's fallback clause specifies — the three CONTEXT-specified categories were used and the fallback is documented in a JSDoc block above `SKILL_SCAN_PATTERNS`, grounded against the established OWASP LLM01 (Prompt Injection) / LLM02 (Sensitive Information Disclosure) / LLM06 (Excessive Agency) + Agentic taxonomy. Re-verify and extend `SKILL_SCAN_PATTERNS` when network is available.

## Known Stubs

None. `scanSkillContent` is fully wired and tested; it will be consumed by `extension.cjs` (`extension audit`) in Plan 10-04.

## Requirements

ENG-08 progressed (scanSkillContent substrate landed) but **left In Progress** — it is phase-scoped and closes only at the final Phase-10 plan (10-05), matching 10-01's handling.

## Self-Check: PASSED

All created/modified files exist and both task commits (4732987, 05ed69b) are present in history.
