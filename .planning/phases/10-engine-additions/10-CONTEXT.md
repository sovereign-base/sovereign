# Phase 10: Engine Additions - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** ROADMAP Phase 10, `.planning/research/M3-NOTES.md` (the verified engine-vs-skill split + designs), the existing `engine/bin/lib/*.cjs` patterns. First M3 phase — REAL engine code (executor-built, like M1), not hand-authored prose.

<domain>
## Phase Boundary

Phase 10 adds the **zero-dependency, tested engine surface** the three M3 skills (bridge/extension/adopt, Phases 11-13) wrap — so each later skill stays a thin orchestrator. This is the engine-first build order (R-002): the mechanical/deterministic pieces land + pass `node --test` before any skill phase.

**In scope:** `engine/bin/lib/bridge.cjs`, `engine/bin/lib/extension.cjs`, `engine/bin/lib/adopt.cjs`, `scanSkillContent()` added to `engine/bin/lib/security.cjs`, the router cases in `engine/bin/sovereign-tools.cjs`, the `init bridge|adopt|extension` workflows in `engine/bin/lib/init.cjs`, and `node --test` suites for each.

**Out of scope:** the three skills themselves (Phases 11-13); any runtime dependency; actually mutating user source (adopt is read-only).
</domain>

<decisions>
## Implementation Decisions (from M3-NOTES §4 — prescriptive)

### Shared engine discipline (mirror M1)
Zero runtime deps (`node:` built-ins only — `crypto`, `child_process`, `fs`, `path`). All output via the existing `output()` helper (inherits the `@file:` >50KB spill — never reimplement it). Shell out with **array args** via `spawnSync`/`execFileSync` like `core.cjs` `execGit` (never a shell string). Greenfield-safe (return safe values on missing `.sovereign/` or non-git dirs). Each module gets a `node --test` suite; `engine/package.json` `dependencies` stays `{}`.

### `bridge.cjs` (BRIDGE-02 substrate)
- `bridge hash --files a b c` → per-file SHA-256 (`node:crypto`) **plus** a combined hash (concatenate per-file hashes, hash again — fast equality). Returns `{ files: [{path, sha256}], combined }`.
- `bridge check` → reads `.sovereign/bridges/registry.json`, recomputes hashes for the recorded source set, diffs, returns `{ fresh: bool, changed: [paths] }` (or `fresh:true` when combined matches).
- Registry shape per M3-NOTES §2: `.sovereign/bridges/registry.json` keyed by bridge id; the *skill* (Phase 11) writes BRIDGE.md frontmatter (`source_repo`, `source_commit`, `generated`, `combined_hash`, `sources_hashed[]`).

### `extension.cjs` (EXT substrate) — exit-code driven, NO stdout parsing
`skills` has **no `--json`** and stale local docs (it dropped `check`; real surface: `add/use/list/find/remove/update`). So:
- `extension preview <source>` → `npx skills use <source> --copy` (or equivalent) to **materialize the skill content into a temp dir for the audit BEFORE install**; return the content path.
- `extension install <source>` → `npx skills add <source> -a claude-code -y` (or `--copy`); drive success/failure on the **process exit code**, not stdout.
- `extension list` → `npx skills list`.
- `extension audit <path>` → run `scanSkillContent()` over the materialized content; return `{ findings, verdict }`.
- All emit `{ ok, exitCode, stdout, stderr, source }`. Only loosely regex `owner/repo@skill` out of `find` if needed.

### `scanSkillContent()` in `security.cjs` (EXT-02 substrate)
Reuse the `sanitizeForPrompt` regex toolkit. Scan materialized skill content for: data-exfiltration patterns (suspicious external calls / curl|fetch to unknown hosts), overbroad permissions (tool grants), and prompt-injection / zero-width / `[SYSTEM]`/`<<SYS>>`/"ignore previous instructions" markers. Return structured `{ findings: [{category, evidence}], verdict: clean|review|block }`. (Re-verify the current OWASP Agentic Top-10 list when authoring the pattern set — do not hardcode from memory.)

### `adopt.cjs` (ADOPT substrate) — Layers 1+2 only (mechanical)
- `adopt scan` → Layer 1: read known config/manifest files (package.json, mix.exs, go.mod, Cargo.toml, requirements.txt, Dockerfile, docker-compose, .env.example, migrations dir presence). Layer 2: a gitignore-aware filename tree (`git ls-files` when in git, else a bounded walk), **capped** with a `truncated` flag. Returns the JSON contract from M3-NOTES §3: `{ manifests, languages, managers, flags, structure_tree, deep_read_candidates }` (heuristic candidates: main router, auth middleware, base model, primary config). Safe values on non-git / missing dirs. Layer 3 deep reads + gap analysis stay in the Phase-13 skill/agent.

### `init bridge|adopt|extension` workflows
Add to `init.cjs` (default-case style): each returns a greenfield-safe orientation blob (paths + config + relevant artifact paths) so the M3 skills orient with one call. `init bridge` lists the bridgeable source docs (API_SPEC/SECURITY_MODEL/CONTEXT/ADRs); `init adopt` returns project_root + git presence; `init extension` returns the extensions dir + config.

### Claude's Discretion
- Exact `skills use` invocation/flags — **smoke-test in this phase** to confirm it yields the raw SKILL.md body (fallback: shallow git/HTTP fetch); flag if it doesn't.
- Module-internal helper names; test layout.
- The precise registry.json schema beyond the M3-NOTES shape.
</decisions>

<canonical_refs>
## Canonical References
**MUST read before implementing:**
- `.planning/research/M3-NOTES.md` — the verified designs (npx skills surface, hashing, adopt JSON contract, the prescriptive ENG-08 module list). **Primary spec.**
- `engine/bin/lib/core.cjs` — `output()`/`@file:` spill, `execGit` (array-arg shell-out), `loadConfig`, `findProjectRoot`, `safeReadFile` to reuse.
- `engine/bin/lib/security.cjs` — `sanitizeForPrompt` toolkit to extend with `scanSkillContent()`.
- `engine/bin/lib/init.cjs` — the `init` default-case blob shape + `buildInit` to add bridge/adopt/extension workflows.
- `engine/bin/lib/commit.cjs` — `cmdCommit` + `isGitIgnored` patterns (git interaction).
- `engine/bin/sovereign-tools.cjs` — the router (add `bridge`/`extension`/`adopt` switch cases).
- `engine/test/*.test.cjs` — the `node:test` patterns (esp. `pack-smoke`/`install` for spawn-based tests).
- `~/.claude/skills/find-skills/SKILL.md` — note it's STALE on `check`; trust M3-NOTES' verified surface.
</canonical_refs>

<specifics>
## Specific Ideas
- New files: `engine/bin/lib/{bridge,extension,adopt}.cjs` + `engine/test/{bridge,extension,adopt}.test.cjs`; edits to `security.cjs`, `init.cjs`, `sovereign-tools.cjs`.
- The `extension` tests must NOT hit the network in CI by default — unit-test the arg construction + exit-code handling + `scanSkillContent` with fixtures; gate any live `npx skills` smoke-test so it skips when offline (like `pack-smoke` skips without npm).
- Definition of done: `node --test` green for all new suites; `engine/package.json` deps still `{}`; `init bridge|adopt|extension` return valid blobs.
</specifics>

<deferred>
## Deferred Ideas
- The bridge/extension/adopt **skills** (thin orchestrators) — Phases 11-13.
- Bridge deploy-gate blocking + GitHub-issue notification — M4.
- Adopt Layer-3 reads + gap analysis + retro-ADRs — Phase 13 (skill/agent judgment).
</deferred>

---

*Phase: 10-engine-additions*
*Context gathered: 2026-06-09 — first M3 phase, engine code per M3-NOTES + the M1 engine patterns*
