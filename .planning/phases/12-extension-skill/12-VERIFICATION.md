---
phase: 12-extension-skill
verified: 2026-06-09T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 12: Extension Protocol Skill — Verification Report

**Phase Goal:** A user can discover and install third-party skills through SOVEREIGN — wrapping the `npx skills` ecosystem (R-003, never reinventing the registry) — only after a five-gate vetting layer runs and the decision is logged, so no skill is adopted blind.

**Verified:** 2026-06-09
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Skill surfaces `npx skills find` discovery + installs via `extension install` (`skills add --copy -a claude-code -y`); never reimplements the registry | ✓ VERIFIED | SKILL.md step 2 references `extension list` + `npx skills find`; step 4 calls `sovereign-tools extension install`; `buildSkillsArgs('install')` returns `['skills','add',source,'-a','claude-code','--copy','-y']`; no registry reimplementation anywhere |
| 2 | Five gates present before any install: necessity, conflict, security audit, clear recommendation, logged decision — surfaced recommendation-first | ✓ VERIFIED | SKILL.md lines 34–38 enumerate all five gates (①–⑤); recommendation (④) precedes install; "A `block` verdict means do not install" explicit |
| 3 | Decision record written to `.sovereign/extensions/<date>-<skill>.md`; audit drives on engine `scanSkillContent` over `skills use` stdout | ✓ VERIFIED | SKILL.md step 5 + decision record format; `extension audit` calls `scanSkillContent(run.stdout)` — no ad-hoc skill-side scanning; spot-check: malicious fixture → verdict `block`, 5 findings across 3 categories |
| 4 | Skill is a thin orchestrator: single `init extension` orient call, `@file:` guard, "Why this matters", recommendation-first, nav footer, `disable-model-invocation: true` | ✓ VERIFIED | SKILL.md line 4: `disable-model-invocation: true`; orient call at step 1 with `@file:` guard; `## Why this matters` at line 8; `## Navigation` at line 69; 76 lines (>= 70) |
| 5 | `validate skills` passes for import-skill; `doctor` reports auto-trigger budget at 5 auto / 10 disabled | ✓ VERIFIED | `validate skills engine/skills/*/SKILL.md` → `{valid:true, checked:15, violations:[]}`; `sovereign.cjs init --full` + `doctor` → `{auto_count:5, disabled_count:10, warnings:[]}`; `import-skill` absent from `FAST_LANE` constant |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/bin/lib/extension.cjs` | Corrected to bare `skills use` preview + audit-over-stdout | ✓ VERIFIED | Line 60: `return ['skills', 'use', source]`; line 179: `scanSkillContent(run.stdout)`; no `readMaterializedContent`, no `node:fs`/`node:path` imports; requires only `node:child_process` + `core.cjs` + `security.cjs` |
| `engine/test/extension.test.cjs` | 10 tests: bare-use args, exit-code branching, audit block/clean/no_content, gated live test | ✓ VERIFIED | 10/10 pass (including live `npx skills use` smoke test in ~5.3s); all four test groups present |
| `engine/skills/import-skill/SKILL.md` | Five-gate vetting thin orchestrator, 76 lines | ✓ VERIFIED | 77 lines; `disable-model-invocation: true`; five gates enumerated; nav footer; no v1 frontmatter |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `import-skill/SKILL.md` step 3 | `extension audit` | `sovereign-tools extension audit <source>` | ✓ WIRED | Skill calls `sovereign-tools extension audit <source>`; router case `'extension'` sub `'audit'` calls `cmdExtensionAudit(cwd, arg, raw)` |
| `import-skill/SKILL.md` step 4 | `extension install` | `sovereign-tools extension install <source>` | ✓ WIRED | "Never install on a `block` audit verdict" explicit; router sub `'install'` calls `cmdExtensionInstall` |
| `cmdExtensionAudit` | `scanSkillContent` | `security.cjs` import; `scanSkillContent(run.stdout)` | ✓ WIRED | Direct call at `extension.cjs:179`; no intervening file I/O |
| `buildSkillsArgs('preview')` | bare `skills use` | `return ['skills', 'use', source]` | ✓ WIRED | Line 60 confirmed; no `-a`, no `--copy` |
| `buildSkillsArgs('install')` | `skills add --copy -a claude-code -y` | `return ['skills', 'add', source, '-a', agent, '--copy', '-y']` | ✓ WIRED | Line 67 confirmed; install args unchanged from Phase 10 (verified valid) |

---

### Data-Flow Trace (Level 4)

`import-skill/SKILL.md` is a skill (prose instructions to the agent), not a UI component rendering dynamic data. The engine modules (`extension.cjs`) are pure function modules with no stateful rendering. Level 4 data-flow trace is not applicable.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `buildSkillsArgs('preview')` returns bare `['skills','use',source]` | `node --test test/extension.test.cjs` | 10/10 pass | ✓ PASS |
| `cmdExtensionAudit` blocks malicious content via `scanSkillContent` | Node inline runner fixture (malicious SKILL.md) | `verdict:block, ok:false, categories:exfiltration/overbroad_permission/prompt_injection` | ✓ PASS |
| `cmdExtensionAudit` cleans benign content | Node inline runner fixture | `verdict:clean, ok:true, findings:[]` | ✓ PASS |
| Live `extension preview` returns `ok:true` with real SKILL.md content | `node bin/sovereign-tools.cjs extension preview vercel-labs/agent-skills@vercel-react-best-practices` | `{ok:true, exitCode:0, stdout:<full SKILL.md>}` | ✓ PASS |
| `validate skills` passes for all 15 skills | `node bin/sovereign-tools.cjs validate skills skills/*/SKILL.md` | `{valid:true, checked:15, violations:[]}` | ✓ PASS |
| `doctor` reports 5 auto / 10 disabled after `--full` install | `sovereign.cjs init --full --cwd $TMPDIR && sovereign-tools doctor --cwd $TMPDIR/.claude` | `{auto_count:5, disabled_count:10, warnings:[]}` | ✓ PASS |
| Full engine suite still green | `node --test` | 129/129 pass, 0 fail | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXT-01 | 12-01, 12-02 | Discover + install third-party skills via `npx skills find`/`add`; never reinvent registry | ✓ SATISFIED | `extension list` for conflict, `npx skills find <query>` for discovery, `extension install` for adoption; `buildSkillsArgs` delegates all shell-out to `npx skills` |
| EXT-02 | 12-01, 12-02 | Five-gate vetting layer + logged decision in `.sovereign/extensions/` | ✓ SATISFIED | All five gates (necessity, conflict, security audit, recommendation, logged decision) enumerated in skill; decision record format documented; audit drives on `scanSkillContent` |
| M3-CC | 12-02 | Thin orchestrator, `disable-model-invocation: true`, `validate skills` clean, doctor budget held | ✓ SATISFIED | `disable-model-invocation: true`; one `init extension` orient call; `validate skills` clean 15/15; doctor 5 auto / 10 disabled; `import-skill` absent from `FAST_LANE` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

Scanned `extension.cjs` and `import-skill/SKILL.md` for TODO/FIXME/placeholder/return null/empty handler patterns. None found. The `reason: 'no_content'` on empty `skills use` stdout is an intentional safety path (not a stub), documented in the module JSDoc.

---

### Human Verification Required

None. All five success criteria are fully verifiable programmatically. The live smoke test (`extension preview` against the real `npx skills` registry) confirmed the end-to-end contract. The `import-skill` skill is a prose orchestrator — its "visual" output is the agent's judgment-plus-engine output during a real import session, which is inherently a runtime interaction and out of scope for a static phase verification.

---

### Gaps Summary

No gaps. All five Phase 12 success criteria verified against the actual codebase:

1. The engine correction is exact and tested: `buildSkillsArgs('preview')` returns the bare `['skills','use',source]` with no `-a`/`--copy`; `cmdExtensionAudit` scans `skills use` STDOUT via `scanSkillContent`; `readMaterializedContent` and its `node:fs`/`node:path` imports were fully removed.

2. The `import-skill` skill enumerates all five gates before any install; recommendation stated first; block verdict is a hard stop; install explicitly deferred to step 4 ("only on a go").

3. The decision record format is documented with the required fields (timestamp, source, audit verdict + findings, recommendation, rationale) and is committed via `sovereign-tools`.

4. Thin-orchestrator shape is correct: `disable-model-invocation: true`, single `init extension` orient call with `@file:` guard, "Why this matters" section, navigation footer, no v1 frontmatter.

5. Skill budget held: 5 auto-triggerable / 10 disabled (import-skill is NOT in `FAST_LANE`), `validate skills` 15/15 clean, 129/129 engine tests pass.

---

_Verified: 2026-06-09_
_Verifier: Claude (gsd-verifier)_
