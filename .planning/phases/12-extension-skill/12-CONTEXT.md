# Phase 12: Extension Protocol Skill - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 12, M3-NOTES §1, **a LIVE `npx skills` smoke-test run this phase** (the flagged verification), the Phase-10 `extension.cjs`. Mixed phase: a small engine CORRECTION (surfaced by the smoke-test) + the hand-authored skill.

<domain>
## Phase Boundary

Phase 12 ships the **extension protocol skill** — discover + install third-party skills through SOVEREIGN (wrapping `npx skills`, R-003) only after a **five-gate vetting layer** and a logged decision. The Phase-12 smoke-test revealed the Phase-10 `extension.cjs` preview/audit path is built on wrong `skills` flags, so this phase first corrects the engine, then authors the skill on the corrected surface.

**In scope:** correct `engine/bin/lib/extension.cjs` (+ its tests) to the verified `skills` surface; author `engine/skills/import-skill/SKILL.md` (the extension protocol skill).

**Out of scope:** sovereign-adopt (Phase 13); engine work beyond the extension correction.

## Skill name
The skill is invoked as **`/import-skill`** (the v1 name, clear verb) — dir `engine/skills/import-skill/`.
</domain>

<decisions>
## VERIFIED `npx skills` surface (live smoke-test, 2026-06-09 — supersedes assumptions)

`skills@latest` real commands: `add / use / remove / list / find / update / init`. Critically:
- **`skills use <pkg>@<skill>`** (BARE — no `-a`, no `--copy`) → prints a prompt to **stdout** that wraps the full raw SKILL.md inside `<SKILL.md>…</SKILL.md>` tags. **This is the auditable content.** (Confirmed against `vercel-labs/agent-skills@vercel-react-best-practices`.)
- **`use` does NOT accept `--copy`** (errors "Unknown option: --copy"), and **`use -a <agent>` means "start that agent INTERACTIVELY"** — must NOT be passed for a preview.
- **`skills add <pkg> -a claude-code --copy -y`** IS valid (`add` supports `-g/-a/-s/-l/-y/--copy/--all/--full-depth`). `extension install` is already correct.
- `skills find [query]` is interactive; parse `owner/repo@skill` + `skills.sh` URLs leniently from its output.

## Engine correction (extension.cjs) — surfaced by the smoke-test
1. `buildSkillsArgs('preview', source)` → return **`['skills', 'use', source]`** (drop `-a` and `--copy`). Optionally allow `--full-depth`. (`install` args unchanged — they're valid.)
2. `cmdExtensionAudit` must scan the **`skills use` stdout** (the prompt-wrapped SKILL.md), not a temp-dir file path. Change it to take a **source** and internally run `skills use <source>` then `scanSkillContent(stdout)` → `{ ok, source, findings, verdict }`. (Remove the `readMaterializedContent(contentPath)` file-path assumption.)
3. Update `engine/test/extension.test.cjs`: preview arg test asserts the bare `['skills','use',source]`; audit test injects a runner returning prompt-wrapped content with injection patterns → `verdict:'block'`, and benign → `clean`; keep the live `npx skills` test gated by `hasNpm()` (now asserting bare-`use` returns content).
4. Zero-dep + array-arg + `output()`/`@file:` invariants unchanged; full `node --test` green.

## The `/import-skill` skill (EXT-01 + EXT-02 + M3-CC)
Thin orchestrator, `disable-model-invocation: true`, one `init extension` orient, `## Why this matters`, recommendation-first, nav footer, `--full` install (NOT FAST_LANE), ≥70 lines (`wc -l`).
**Flow:**
1. `init extension` → extensions dir (`.sovereign/extensions/`) + config + active tracks/phase.
2. **Discover** (optional): surface `extension list` (installed) and, if the user is searching, `npx skills find <query>` results (parse targets leniently).
3. **Five-gate vetting BEFORE install** (recommendation-first):
   - **Necessity** — is it needed for the active tracks/current phase?
   - **Conflict** — vs installed skills (`extension list`) and vs existing ADRs.
   - **Security audit** — `extension audit <source>` (runs `scanSkillContent` over the `skills use` content); surface findings + verdict. Drive on the engine's findings, NOT ad-hoc skill scanning.
   - **Recommendation** — INSTALL / DON'T INSTALL / INSTALL-WITH-CAVEATS, stated first.
   - **Logged decision** — write `.sovereign/extensions/<date>-<skill>.md` (timestamp, source, hashes/verdict, audit findings, rationale).
4. **Install** only on a go decision: `extension install <source>` (`skills add --copy -a claude-code -y`).
5. Persist: `state save` + `commit` the decision record. Nav footer.

### Claude's Discretion
- Exact decision-record layout; whether `find` is in-skill or referenced.
- Whether `extension audit` returns hashes too (can reuse the verdict; bridge owns hashing).
</decisions>

<canonical_refs>
## Canonical References
**MUST read before implementing:**
- `engine/bin/lib/extension.cjs` — the module to correct (buildSkillsArgs preview + cmdExtensionAudit).
- `engine/test/extension.test.cjs` — the suite to update (preview args, audit-on-stdout, gated live test).
- `engine/bin/lib/security.cjs` — `scanSkillContent` (the audit engine; unchanged).
- `.planning/research/M3-NOTES.md` §1 + **this CONTEXT's "VERIFIED surface"** (the live findings supersede the notes where they differ).
- `engine/references/skill-format.md`; `engine/skills/bridge/SKILL.md` + `engine/skills/api-design/SKILL.md` (sibling skill pattern to mirror).
- `archive/v1/SOVEREIGN_PROJECT.md` (the `/import-skill` extension-protocol design + the five steps — lines ~445-462).
</canonical_refs>

<specifics>
## Specific Ideas
- Skill dir: `engine/skills/import-skill/` (NOT FAST_LANE; `--full`). Decision records → `.sovereign/extensions/<date>-<skill>.md`.
- After this phase, `doctor` on a `--full` install: 5 auto-triggerable, council + 7 arch + bridge + import-skill = 10 disabled.
- Engine fix is real code → executor-built (like Phase 10); skill is hand-authored. Likely 2 plans: 12-01 engine correction + tests, 12-02 the skill.
- A live end-to-end smoke (`extension preview`/`audit` against a real source) should pass in-phase after the fix.
</specifics>

<deferred>
## Deferred Ideas
- `sovereign-adopt` (Phase 13).
- Extension auto-update / version pinning, a curated SOVEREIGN extension registry — later (R-003: never reinvent the registry).
</deferred>

---

*Phase: 12-extension-skill*
*Context gathered: 2026-06-09 — engine correction (from the live smoke-test) + the import-skill protocol skill*
