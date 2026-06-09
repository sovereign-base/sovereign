---
phase: quick-260609-lkx
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - engine/bin/lib/install.cjs
  - engine/test/installed-engine.test.cjs
  - engine/VERSION
  - engine/package.json
  - engine/skills/adr-log/SKILL.md
  - engine/skills/api-design/SKILL.md
  - engine/skills/bridge/SKILL.md
  - engine/skills/council/SKILL.md
  - engine/skills/deploy-design/SKILL.md
  - engine/skills/entity-design/SKILL.md
  - engine/skills/grill-with-docs/SKILL.md
  - engine/skills/handoff/SKILL.md
  - engine/skills/import-skill/SKILL.md
  - engine/skills/scale-design/SKILL.md
  - engine/skills/security-design/SKILL.md
  - engine/skills/sentinel/SKILL.md
  - engine/skills/sovereign-adopt/SKILL.md
  - engine/skills/stack-select/SKILL.md
  - engine/skills/tdd/SKILL.md
  - engine/skills/ubiquitous-language/SKILL.md
  - engine/references/skill-format.md
autonomous: true
requirements: [INSTALL-FIX]

must_haves:
  truths:
    - "After runInstall, the engine binary is present in the project at .claude/sovereign-engine/sovereign-tools.cjs"
    - "The engine's lib/ tree travels with it so require('./lib/...') resolves from the installed location"
    - "An installed skill's exact invocation (node .claude/sovereign-engine/sovereign-tools.cjs init <wf>) returns a valid init blob when run from the project cwd"
    - "No shipped skill source still contains the broken $ENGINE reference"
    - "All pre-existing tests still pass after the version bump"
  artifacts:
    - path: "engine/bin/lib/install.cjs"
      provides: "Engine-copy step into .claude/sovereign-engine/ + engine_copied/engine_path result fields"
      contains: "sovereign-engine"
    - path: "engine/test/installed-engine.test.cjs"
      provides: "End-to-end installed-engine reachability test + $ENGINE regression tripwire"
      contains: "sovereign-engine"
    - path: "engine/VERSION"
      provides: "Bumped version 2.2.0"
      contains: "2.2.0"
  key_links:
    - from: "engine/bin/lib/install.cjs"
      to: ".claude/sovereign-engine/"
      via: "copyDirRecursive of path.join(packageRoot, 'bin')"
      pattern: "copyDirRecursive"
    - from: "engine/skills/*/SKILL.md"
      to: ".claude/sovereign-engine/sovereign-tools.cjs"
      via: "literal cwd-stable path (replaces $ENGINE/bin/sovereign-tools.cjs)"
      pattern: "\\.claude/sovereign-engine/sovereign-tools\\.cjs"
---

<objective>
Fix the critical install bug: `npx sovereign-cli init` copies skills + agents into `.claude/` but never copies the engine itself, so every installed skill's `node "$ENGINE/bin/sovereign-tools.cjs" ...` invocation fails (the binary isn't present and `$ENGINE` is never defined — and per-block fresh shells mean a shell var could never persist anyway).

Purpose: Restore the core value proposition — a skill orients with one engine CLI call. Without the engine present at a stable, cwd-relative path, the entire installed system is dead on arrival.

Output: install.cjs copies the engine into `.claude/sovereign-engine/` on every install/update; all 16 skills + the skill-format reference invoke the engine via the literal path `.claude/sovereign-engine/sovereign-tools.cjs`; a new end-to-end test proves reachability and guards the seam; version bumped 2.1.0 → 2.2.0.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@engine/bin/lib/install.cjs
@engine/test/install.test.cjs
@engine/test/pack-smoke.test.cjs

<interfaces>
<!-- Contracts the executor needs — extracted from the codebase, no exploration required. -->

From engine/bin/lib/install.cjs:
```js
// Existing helper — reuse, do not reinvent:
function copyDirRecursive(src, dest) { fs.cpSync(src, dest, { recursive: true }); }

// runInstall(opts) receives opts.packageRoot (= engine/ root) and opts.cwd (project root).
// installRoot = path.join(cwd, '.claude') for target 'project'.
// Skills/agents are copied only when `doCopy` (status !== 'up_to_date').
// InstallResult currently ends with: skills_copied, agents_copied, sovereign_scaffolded.
```

Installed-skill invocation pattern (the literal path the fix introduces):
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init <workflow>)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Engine layout that MUST be reproduced under .claude/sovereign-engine/:
- engine/bin/sovereign-tools.cjs       (entry; does require('./lib/core.cjs') etc.)
- engine/bin/lib/*.cjs                  (REQUIRED — the require('./lib/...') tree)
- engine/bin/sovereign.cjs             (launcher; rides along harmlessly)
Copying the CONTENTS of engine/bin/ into .claude/sovereign-engine/ yields exactly this.

Engine command facts (for the test):
- `state save` / `state patch` with zero --field/--value pairs calls error() → exit 1.
  Use `state load` for a clean exit-0 reachability assertion (no required args).
- `init <workflow>` emits the nested blob; >50KB spills to `@file:<path>` (handle like pack-smoke).
- init blob includes `sovereign_version`.

$ENGINE occurrences to replace: 29 across 16 SKILL.md files + engine/references/skill-format.md.
NO engine/agents/*.md file references $ENGINE (confirmed by grep — leave agents untouched).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add engine-copy test + copy step in install.cjs (RED→GREEN)</name>
  <files>engine/test/installed-engine.test.cjs, engine/bin/lib/install.cjs</files>
  <behavior>
    New test engine/test/installed-engine.test.cjs (node:test + node:assert/strict, pure fs, tmpdir fixture, packageRoot = ENGINE_ROOT, skip-not-fail if something is unavailable):
    - Test A — copy lands: runInstall({cwd: tmp, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT}); assert `.claude/sovereign-engine/sovereign-tools.cjs` exists AND `.claude/sovereign-engine/lib/` exists (is a dir); assert result.engine_copied === true and result.engine_path === '.claude/sovereign-engine'; assert `.sovereign/` was scaffolded (runInstall already does this).
    - Test B — reachable + valid blob: spawnSync `node .claude/sovereign-engine/sovereign-tools.cjs init council` with cwd = tmp; parse JSON (handle the @file: spill prefix exactly like pack-smoke.test.cjs); assert exit 0 and blob.sovereign_version is present (equals the packaged VERSION read dynamically from ENGINE_ROOT/VERSION).
    - Test C — engine reachable for a non-init command: spawnSync `node .claude/sovereign-engine/sovereign-tools.cjs state load` with cwd = tmp; assert exit 0 (proves require('./lib/...') resolves from the installed location). NOTE: use `state load`, NOT `state save` (save with no --field/--value pairs exits 1 by design).
    - Test D — regression tripwire: read every engine/skills/*/SKILL.md source via fs and assert none contains the literal string `$ENGINE` (so the seam can't silently break again).
  </behavior>
  <action>
    1. Write engine/test/installed-engine.test.cjs implementing behaviors A–D above. Mirror install.test.cjs fixture style (mkProject via fs.mkdtempSync in os.tmpdir; rm helper; ENGINE_ROOT = path.join(__dirname, '..'); PACKAGED_VERSION read from ENGINE_ROOT/VERSION). For Test B's spill handling, copy pack-smoke's idiom: `out.startsWith('@file:') ? fs.readFileSync(out.slice('@file:'.length).trim(), 'utf8') : out`. For Test D, enumerate skill dirs with fs.readdirSync over path.join(ENGINE_ROOT, 'skills') and read each <dir>/SKILL.md if present. Run the test — Tests A/B/C MUST FAIL (engine not copied yet); Test D may pass or fail at this point (skills still have $ENGINE) — that's fine, it's fixed in Task 2.
    2. In engine/bin/lib/install.cjs runInstall(): AFTER the skills+agents copy and BEFORE / independent of the non-destructive `.sovereign/` scaffold block, add an engine-copy step that runs on EVERY install/update (NOT version-gated, NOT subject to the non-destructive rule — overwrite like skills/agents). Source = path.join(packageRoot, 'bin'); dest = path.join(installRoot, 'sovereign-engine'). Guard: if the source bin dir is missing (use the existing isDir helper), skip gracefully without crashing (mirror the agents-copy guard) and set engine_copied = false. When source exists: copyDirRecursive(src, dest) (copies the CONTENTS-as-tree so dest/sovereign-tools.cjs + dest/lib/*.cjs result), set engine_copied = true. Set engine_path = '.claude/sovereign-engine' (the project-relative path skills use; for target 'global' set it to the installRoot-relative equivalent — keep it the literal '.claude/sovereign-engine' string for the default project case which is what skills depend on).
    3. Add `engine_copied` (boolean) and `engine_path` (string) to the returned InstallResult object and update the InstallResult @typedef. Run the new test again — Tests A/B/C MUST PASS now.
  </action>
  <verify>
    <automated>cd engine && node --test test/installed-engine.test.cjs</automated>
  </verify>
  <done>installed-engine.test.cjs Tests A/B/C pass; runInstall copies engine/bin contents to .claude/sovereign-engine/ on every run (guarded if source absent) and returns engine_copied + engine_path; InstallResult typedef updated.</done>
</task>

<task type="auto">
  <name>Task 2: Replace all $ENGINE references with the literal installed path</name>
  <files>engine/skills/adr-log/SKILL.md, engine/skills/api-design/SKILL.md, engine/skills/bridge/SKILL.md, engine/skills/council/SKILL.md, engine/skills/deploy-design/SKILL.md, engine/skills/entity-design/SKILL.md, engine/skills/grill-with-docs/SKILL.md, engine/skills/handoff/SKILL.md, engine/skills/import-skill/SKILL.md, engine/skills/scale-design/SKILL.md, engine/skills/security-design/SKILL.md, engine/skills/sentinel/SKILL.md, engine/skills/sovereign-adopt/SKILL.md, engine/skills/stack-select/SKILL.md, engine/skills/tdd/SKILL.md, engine/skills/ubiquitous-language/SKILL.md, engine/references/skill-format.md</files>
  <action>
    Replace every occurrence of the substring `"$ENGINE/bin/sovereign-tools.cjs"` (quoted form, used in INIT=$(...) lines and `node "..."` calls) AND any bare `$ENGINE/bin/sovereign-tools.cjs` (in inline-code spans like `bridge check`, `state save`, `commit`, `adopt scan` references) with the literal, cwd-stable path `.claude/sovereign-engine/sovereign-tools.cjs`. Concretely: every `$ENGINE/bin/sovereign-tools.cjs` becomes `.claude/sovereign-engine/sovereign-tools.cjs`. Preserve the surrounding quoting and prose verbatim — e.g. `node ".claude/sovereign-engine/sovereign-tools.cjs" init council` keeps its double quotes; inline-code spans keep their backticks. Do NOT touch anything else. Apply across all 17 listed files (29 total occurrences). Skills are invoked by the agent from the project root, so the project-root-relative path resolves; the `$ENGINE` variable (which never persisted across fresh per-block shells) is eliminated.
  </action>
  <verify>
    <automated>cd engine && ! grep -rn '\$ENGINE' skills/ references/ && node --test test/installed-engine.test.cjs</automated>
  </verify>
  <done>Zero `$ENGINE` occurrences remain in engine/skills/ and engine/references/; the Task 1 regression tripwire (Test D) passes; every engine invocation in skills uses the literal `.claude/sovereign-engine/sovereign-tools.cjs` path with prose otherwise unchanged.</done>
</task>

<task type="auto">
  <name>Task 3: Version bump 2.1.0 → 2.2.0 and full-suite gate</name>
  <files>engine/VERSION, engine/package.json</files>
  <action>
    1. Set engine/VERSION to `2.2.0` (single line, trailing newline preserved).
    2. In engine/package.json set `"version": "2.2.0"`.
    3. Confirm no test hardcodes the literal '2.1.0' (install.test.cjs and pack-smoke.test.cjs both read PACKAGED_VERSION/EXPECTED_VERSION dynamically from the VERSION file, so the bump is safe — but verify by grepping the test tree). Run the entire engine test suite to confirm all pre-existing tests plus the new installed-engine test pass (the install test's version-stamp assertion uses the dynamically-read packaged VERSION, so it tracks the bump automatically).
  </action>
  <verify>
    <automated>cd engine && ! grep -rn "2\.1\.0" test/ && node --test "test/**/*.test.cjs"</automated>
  </verify>
  <done>VERSION and package.json both read 2.2.0; no test hardcodes 2.1.0; the full `node --test` suite (all prior tests + installed-engine.test.cjs) passes green.</done>
</task>

</tasks>

<verification>
- `cd engine && node --test "test/**/*.test.cjs"` → all green (133 prior + new installed-engine tests).
- `cd engine && grep -rn '\$ENGINE' skills/ references/` → no matches.
- Manual sanity (optional): `node bin/sovereign.cjs init --full --cwd /tmp/sov-check` then `cd /tmp/sov-check && node .claude/sovereign-engine/sovereign-tools.cjs init council` returns a JSON blob with sovereign_version.
</verification>

<success_criteria>
- runInstall copies engine/bin contents → `.claude/sovereign-engine/` (sovereign-tools.cjs + lib/) on every install/update, guarded if source absent, reporting engine_copied + engine_path.
- All 16 skills + skill-format.md invoke the engine via the literal `.claude/sovereign-engine/sovereign-tools.cjs` path; zero `$ENGINE` references remain.
- A freshly installed skill invocation reaches the engine and returns a valid init blob from the project cwd.
- VERSION + package.json = 2.2.0; full test suite green; zero new runtime dependencies; init JSON contract untouched.
</success_criteria>

<output>
After completion, create `.planning/quick/260609-lkx-fix-install-bug-copy-engine-into-project/260609-lkx-SUMMARY.md`
</output>
