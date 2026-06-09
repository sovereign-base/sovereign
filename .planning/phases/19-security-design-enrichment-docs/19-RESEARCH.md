# Phase 19: `security-design` enrichment + docs - Research

**Researched:** 2026-06-09
**Domain:** In-repo (enrich a shipped skill + add a reference + 2 small docs edits). Direct artifact inspection by the orchestrator; no web survey. **Confidence: HIGH.**

## Summary

Three small, well-understood deliverables; every target inspected directly:

1. **`engine/references/security-controls.md`** (NEW, agnostic) — mirror the size/tone of `engine/references/unverified-marker.md` / `commenting.md` (tight, sectioned markdown). Ships automatically: `package.json` `files` includes `references`.
2. **Enrich `engine/skills/security-design/SKILL.md`** (currently 70 lines, `disable-model-invocation: true`) — add a controls-coverage step that consults `references/security-controls.md` and offers the checklist, surfacing uncovered classes on re-run. Keep it thin (the reference holds depth) and ≥70 lines (it will grow, fine).
3. **DOCS-01** — README + installer output.

## Key confirmed facts

- **Reference ships:** `files: ["bin","templates","agents","skills","references","VERSION"]` → `security-controls.md` is distributed. The skill references it by the installed package-relative path `references/security-controls.md` (same convention as `verify-self` → `references/unverified-marker.md`). No `init` change needed; the skill names the path literally.
- **Launcher edit is safe.** `engine/bin/sovereign.cjs` `renderHuman()` has the line (~128): `After install, the skills run inside your agent (e.g. /council, /tdd).` The per-agent invocation note goes here (one additional `say(...)` line). The launcher UX tests (`engine/test/install.test.cjs`) only assert SUBSTRINGS — `/SOVEREIGN/`, `/Next steps/i`, not-raw-JSON, `--version` includes the version, `--adopt` mentions `sovereign-adopt`. An additive line breaks none of them.
- **README touch points:** line ~24 (`you invoke them by typing /skill-name in your agent`) and line ~155 (`user-invoked (you type /name)`). Add a brief, accurate note that `/`-autocomplete is Claude Code's affordance; other SKILL.md agents (Gemini CLI, etc.) have no `/`-menu — read/point at the `SKILL.md` and invoke by name. Don't rewrite the walkthrough.
- **No new skill → budget unchanged.** Enrichment only; `doctor` stays `total_skills: 20, auto_count: 5, disabled_count: 15`. `validate skills` re-passes for the changed `security-design` (frontmatter unchanged). Engine suite stays **164 green** (no engine contract change; the `renderHuman` string edit is covered by the substring-based launcher tests).
- **Agnostic control classes** (the reference content): input validation; injection (SQL/NoSQL, XSS, command/shell, SSRF, template, deserialization); authN/authZ/IDOR; secrets handling; rate-limiting/abuse. Each = "what it is / why it bites / what to verify" — NO framework/library names.

## Open questions — resolved

1. **Does the skill need an engine/init change to find the reference?** NO — name `references/security-controls.md` literally in the skill body (verify-self precedent). The reference ships via the files allowlist.
2. **Will the `renderHuman` edit break tests?** NO — launcher tests assert substrings only; additive line is safe (confirmed by reading the assertions).
3. **Does enriching security-design risk the validate/line gates?** NO — frontmatter unchanged (still `disable-model-invocation: true`); adding body lines keeps it ≥70 and `validate skills` passes (lint is frontmatter-only).

## Validation Architecture

> SKILL+reference+docs phase: gates are structural/lint/command + content-presence checks. Each maps to a Phase 19 success criterion. RUN command gates FROM `engine/` (else vacuous); ASSERT doctor's `auto_count` value (doctor exits 0 regardless).

| # | Gate (grep/command-checkable) | SC | Req |
|---|------------------------------|----|-----|
| G1 | `engine/references/security-controls.md` exists | SC1 | SEC-01 |
| G2 | reference names all 5 control classes: `grep -iq` each of input validation, injection, (authz OR IDOR), secrets, rate-limit | SC1 | SEC-01 |
| G3 | reference is agnostic — NO framework/library names: `! grep -Eqi '\b(helmet\|express-validator\|owasp zap\|bcrypt\|passport\.js)\b'` (class-level only) | SC1 | SEC-01 |
| G4 | `security-design/SKILL.md` references the controls file: `grep -q 'security-controls.md'` | SC1 | SEC-01 |
| G5 | skill still has `disable-model-invocation: true`, `## Why this matters`, nav footer, ≥70 lines, no v1 fields | SC3 | M5-CC |
| G6 | skill still invokes engine via literal `.claude/sovereign-engine/sovereign-tools.cjs` (not `$ENGINE`) | SC3 | M5-CC |
| G7 | README documents per-agent invocation: `grep -iq 'gemini'` OR `grep -iqE 'invoke (it|them|the skill) by name'` near the skill-invocation prose | SC2 | DOCS-01 |
| G8 | installer output documents it: `grep -q` the new per-agent line in `engine/bin/sovereign.cjs` `renderHuman` | SC2 | DOCS-01 |
| G9 | `cd engine && validate skills skills/security-design/SKILL.md` → `valid: true` | SC3 | M5-CC |
| G10 | `cd engine && doctor` → auto_count == 5, total_skills == 20 (no new skill) | SC3 | M5-CC |
| G11 | `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (launcher UX tests included) | — | regression |

### Sampling
- After each edit: the relevant grep gate + (for the launcher) `node --test test/install.test.cjs`.
- Before completion: full `node --test` 164 green + `doctor` auto==5 + `validate skills`.

## Sources
- Direct reads (HIGH): `engine/skills/security-design/SKILL.md` (70 lines), `engine/references/unverified-marker.md`/`commenting.md` (format), `engine/bin/sovereign.cjs` `renderHuman`, `engine/test/install.test.cjs` (launcher assertions), `README.md` (lines ~24, ~155), `engine/package.json` (`files`).
- `.planning/REQUIREMENTS.md` (SEC-01, DOCS-01, M5-CC), `.planning/ROADMAP.md` (Phase 19 SC), CONTEXT.md.

**Valid until:** stable (in-repo conventions).
