# M3 Research Notes — Adoption, Bridging & Extensions

**Researched:** 2026-06-09
**Scope:** ADOPT-01/02, BRIDGE-01/02, EXT-01/02, ENG-08, M3-CC
**Mode:** Consolidated focused research (verify genuinely-new technical surface vs training data)
**Overall confidence:** HIGH on the engine patterns + `npx skills` command surface; MEDIUM on `skills`' exact stdout text (deliberately undocumented — design the wrapper to tolerate this).

Ground truth read directly: `find-skills/SKILL.md`, `engine/bin/lib/{init,core,commit,security}.cjs`, `engine/bin/sovereign-tools.cjs` router, `archive/v1/SOVEREIGN_PROJECT.md`, `.planning/REQUIREMENTS.md`. Live-verified: `npm view skills` (1.5.10, published 6 days ago) + the vercel-labs/skills README.

---

## 1. Extension protocol (the real unknown)

### Current `npx skills` CLI surface — VERIFIED (HIGH)

`skills@1.5.10` (latest, MIT, single dep `yaml`, supports ~70 agents). Binaries: `skills`, `add-skill`. The README is the authoritative command spec; the local `find-skills/SKILL.md` is a *consumer summary* and is **partly stale** — it lists a `check` subcommand that **no longer exists** in 1.5.10 (the README's command set is `add`, `use`, `list`/`ls`, `find`, `remove`/`rm`, `update`, `init`). Treat `find-skills/SKILL.md` as a usage hint, not the spec.

Commands a SOVEREIGN wrapper cares about:

| Command | Syntax | Notes for the wrapper |
|---------|--------|------------------------|
| `find` | `npx skills find [query]` | Interactive (fzf) with no query; keyword search with a query. Prints `owner/repo@skill` lines + a `skills.sh` URL each. **No `--json`.** Parse leniently. |
| `add` | `npx skills add <source> [opts]` | Source = `owner/repo`, `owner/repo@skill`, full URL, git URL, GitLab, or local path. |
| `use` | `npx skills use <source> [--agent <a>]` | **Key for vetting:** writes the selected skill files to a **temp dir** and prints the generated prompt to stdout (does NOT install into `.claude/skills/`). This is how the wrapper fetches skill *content* to audit before adopting. |
| `list`/`ls` | `npx skills list [-g] [-a <agent>]` | Like `npm ls`. For the conflict check (what's already installed). |
| `update` | `npx skills update [skills...] [-g\|-p] [-y]` | `-y` auto-detects scope (project if in a project dir). |
| `remove`/`rm` | `npx skills remove [skills] [-g] [-a] [-s] [--all]` | For rollback of a rejected/failed install. |

**Flags that matter (HIGH):**
- `-g, --global` → installs to `~/.claude/skills/` (else project `./.claude/skills/`).
- `-a, --agent <agents...>` → e.g. `claude-code`, `codex`. SOVEREIGN should pass `-a claude-code` explicitly for the Claude path; for fan-out, let `skills` own the per-agent dirs.
- `-s, --skill <skills...>` → install specific skill(s) from a multi-skill repo; `'*'` = all.
- `-l, --list` → on `add`, lists available skills in the source **without installing** (useful for the necessity/preview step).
- `--copy` → copy instead of symlink. **SOVEREIGN should prefer `--copy`** for the committed-project case (portable across machines/CI), mirroring ADR-003's copy-over-symlink convention.
- `-y, --yes` → skip confirmation prompts (needed for non-interactive wrapper calls).
- `--all` → install everything to all agents, no prompts (avoid — too broad for a vetting gate).

**Default Claude-Code install dir (HIGH):** project `.claude/skills/`, global `~/.claude/skills/`.

### What the wrapper must shell out + parse

The hard constraint: **`skills` has no machine-readable output** (no `--json`, output text "not explicitly documented"). So:

1. **Drive on exit code, not stdout parsing, for success/failure.** `spawnSync('npx', ['skills', 'add', source, '-a','claude-code','--copy','-y'])` → branch on `result.status`. Capture stdout/stderr for the decision log but do not depend on its exact shape.
2. **For discovery**, run `find` and surface the raw lines to the user/agent rather than trying to structure them — the `owner/repo@skill` token + `skills.sh` URL are the only stable bits. Optionally regex `^[\w.-]+\/[\w.-]+@[\w.-]+$` to extract installable targets.
3. **For the security audit, use `skills use <source> --agent claude-code` to materialize the skill into a temp dir / capture its prompt, then read & scan the content BEFORE running `add`.** This is the clean separation: `use` = fetch-for-inspection, `add` = adopt. Do not install-then-audit.

### Vetting layer shape (EXT-02)

Five gates, recommendation-first, logged to `.sovereign/extensions/` (v1 called it `SOVEREIGN_EXTENSIONS.md`; v2 should use a per-decision log dir to match the engine's file conventions). Pipeline:

1. **Necessity** — does this overlap an active track / current phase need? (Read `.sovereign/STATE.md` active_tracks + MANIFEST; cross-ref the skill's `description`/`when_to_use`.) Cheap, skill-side.
2. **Conflict** — name clash or behavioral overlap vs installed skills (`skills list`) and vs existing ADRs (`.sovereign/docs/adr/*`). Engine can supply the installed-skill inventory; ADR semantic check is skill-side reasoning.
3. **Security audit** — scan the materialized skill body (from `skills use`) for: data-exfiltration (outbound `curl`/`fetch`/webhooks to non-allowlisted hosts), overbroad permissions (`allowed-tools: *`, `Bash` with no constraint, broad `paths`), and prompt-injection patterns (instruction-mimicking markers, hidden/zero-width unicode, "ignore previous instructions"). **Reuse + extend `security.cjs`** — `sanitizeForPrompt` already detects zero-width unicode and `[SYSTEM]`/`<<SYS>>`/role-tag markers. A new `scanSkillContent(text)` engine helper returning structured findings is the right home (OWASP Agentic Top-10-aligned, per v1 ADR-SOVEREIGN-007 lineage).
4. **Recommendation** — INSTALL / DON'T INSTALL / INSTALL-WITH-CAVEATS, with reasoning. Skill-side (reasoning agent).
5. **Logged decision** — append a structured record (timestamp, source, hashes, audit findings, verdict, rationale) to `.sovereign/extensions/<date>-<skill>.md` and commit via the existing `commit` command.

**Engine vs skill split:** engine provides the *mechanical* pieces (shell out to `skills use`/`add`/`list`, scan content for the pattern set, emit a JSON audit blob); the *judgment* (necessity, conflict reasoning, final recommendation) stays in the thin skill + reasoning agent. R-003 holds: never reinvent the registry.

---

## 2. Bridge staleness mechanism

### Hashing approach — VERIFIED (HIGH)

Zero-dep, built-in: `node:crypto`. Canonical recipe:

```js
const crypto = require('node:crypto');
function hashFile(absPath) {
  const buf = fs.readFileSync(absPath);            // bytes, not utf-8, for stable hashing
  return crypto.createHash('sha256').update(buf).digest('hex');
}
// Per-source-file hashes, plus a combined manifest hash:
function hashSources(cwd, relPaths) {
  const files = relPaths
    .map(rel => ({ rel, abs: path.join(cwd, rel) }))
    .filter(f => fs.existsSync(f.abs))
    .sort((a, b) => a.rel.localeCompare(b.rel));   // deterministic order
  const entries = files.map(f => ({ path: f.rel, sha256: hashFile(f.abs) }));
  const combined = crypto.createHash('sha256')
    .update(entries.map(e => `${e.path}:${e.sha256}`).join('\n'))
    .digest('hex');
  return { entries, combined };
}
```

Use **SHA-256** (not MD5) — it's the modern default, still zero-dep, speed is irrelevant for a handful of docs. Hash **per-file** so staleness reporting can name *which* source changed (matches v1's "flag the specific changes"), and keep a **combined** hash for a fast single-value equality check.

### BRIDGE.md frontmatter + registry shape (BRIDGE-02)

BRIDGE.md frontmatter (the bridge document itself — the consuming project imports this):

```yaml
---
bridge_version: 1
source_repo: <git remote url or owner/repo>       # from execGit remote get-url
source_commit: <short sha at generation>          # execGit rev-parse --short HEAD
generated: 2026-06-09
combined_hash: <sha256 of all source files>
sources_hashed:
  - path: .sovereign/API_SPEC.md
    sha256: <hex>
  - path: .sovereign/SECURITY_MODEL.md
    sha256: <hex>
  - path: .sovereign/CONTEXT.md
    sha256: <hex>
  # + ADRs the bridge summarized
---
```

**Registry** (`.sovereign/bridges/registry.json` — in the *source* project, so re-running `bridge` can compare): a small JSON keyed by output bridge name, each entry storing `{ generated, source_commit, combined_hash, sources_hashed: [{path, sha256}] }`. Re-running `bridge` recomputes hashes and diffs against the registry:
- combined hash equal → fresh, no-op.
- differs → recompute per-file, report the changed paths, regenerate, update registry. This *is* the local staleness detection BRIDGE-02 scopes.

For the **consuming** side (detect that an imported bridge is stale relative to its source), the consuming project stores the BRIDGE.md's `combined_hash` + `source_repo`; on init/refresh it can compare against a re-fetched source (out of M3 scope per the deferral, but the frontmatter already carries everything needed for it later).

### v1 design notes (archive/v1/SOVEREIGN_PROJECT.md)

- BRIDGE.md lives at `.sovereign/BRIDGE.md`; contents = API contracts, auth flows, domain glossary, track intersections, decisions-already-made. (lines 184, 232–244, 482)
- v1 wanted **auto GitHub-issue notification + pre-flight blocking** on stale bridges (ADR-SOVEREIGN-008). **Both deferred** per REQUIREMENTS.md — M3 ships *local hash staleness only*. Don't build the GitHub/issue path now; just leave the frontmatter fields that make it possible later.
- Source inputs map cleanly to existing M2 artifacts: `API_SPEC.md`, `SECURITY_MODEL.md`, `CONTEXT.md`, and `.sovereign/docs/adr/*` (the `init` blob already lists `relevant_adrs`).

---

## 3. Adopt archaeology (sovereign-adopt)

### 3-layer scan — CONFIRMED (HIGH, matches v1 lines 272–290)

- **Layer 1 — config/manifest (near-zero tokens):** `package.json`, `pyproject.toml`/`requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`/`build.gradle`, `Gemfile`, `composer.json`, `Dockerfile`, `docker-compose.yml`, `.env.example`, `tsconfig.json`, CI config (`.github/workflows/*`), lockfiles (existence only). v1: "reveals 80% of stack decisions in under 20 files."
- **Layer 2 — structure scan (low tokens):** folder tree + filenames only, **no file contents**. Respect `.gitignore` and skip `node_modules/`, `dist/`, `.git/`, vendored dirs. Shape reveals architecture (monorepo vs single, `src/routes` vs `app/`, presence of `migrations/`, `models/`, `middleware/`).
- **Layer 3 — targeted deep reads (medium tokens):** 5–10 surgical reads chosen *from* Layers 1–2 — main router/entrypoint, auth middleware, base model/ORM config, primary config file. Precise, not exhaustive. This layer is **skill/agent judgment**, not engine.

### Engine `adopt` scan-helper JSON contract (keeps the skill thin)

The engine should do the **cheap, mechanical** Layers 1+2 and hand back a JSON blob; the skill/agent does Layer 3 (deciding which files to read) and the reasoning (gap analysis, retro-ADRs, roadmap). Proposed `sovereign-tools adopt scan` output:

```json
{
  "project_root": "/abs/path",
  "manifests": [
    { "path": "package.json", "kind": "npm", "present": true }
  ],
  "detected": {
    "languages": ["typescript", "..."],     // inferred from manifests + extensions
    "package_managers": ["npm"],
    "has_dockerfile": true,
    "has_ci": true,
    "has_tests": true,
    "monorepo": false
  },
  "structure": {
    "top_level_dirs": ["src", "test", "..."],
    "file_count": 1234,
    "tree": ["src/index.ts", "src/routes/..." ]   // filenames only, gitignore-filtered, capped
  },
  "deep_read_candidates": [
    { "path": "src/index.ts", "reason": "entrypoint" },
    { "path": "src/middleware/auth.ts", "reason": "auth" }
  ]
}
```

Notes:
- **Cap and spill:** the structure tree can be large — rely on the existing `output()` `@file:` >50KB spill (do not reimplement). Cap `tree` to a sane N with a `truncated: true` flag.
- **Gitignore-aware:** reuse `core.cjs` `execGit`/`isGitIgnored`, or `git ls-files` (fast, respects ignores) when the project is a git repo; fall back to a manual walk otherwise.
- `deep_read_candidates` is a *suggestion list* (heuristic from filenames/conventions) — the agent decides. Keeps Layer 3 token-bounded and the skill thin.
- ADOPT-02's retro-ADRs go through the existing `adr-log` path; gap analysis + roadmap are reasoning-agent output, not engine.

---

## 4. Engine additions needed (ENG-08) — prescriptive

Three modest, zero-dep modules, each `node --test`'d, each routed in `sovereign-tools.cjs` via a new `case`. `init` gains `bridge`/`adopt`/`extension` workflows (greenfield-safe stubs in `buildInit`, like the existing fast-lane defaults).

| Module | Command(s) | Responsibility | Stays in engine? |
|--------|-----------|----------------|------------------|
| `bridge.cjs` | `bridge hash --files a b c`, `bridge check` (diff vs registry) | SHA-256 per-file + combined hashing (`node:crypto`); read/write `.sovereign/bridges/registry.json`; report stale paths. | YES — pure crypto + FS. Assembling BRIDGE.md *prose* is skill-side. |
| `extension.cjs` | `extension preview <source>` (wraps `skills use`), `extension install <source>` (wraps `skills add --copy -a claude-code -y`), `extension list` (wraps `skills list`), `extension audit <path>` (scan content) | `spawnSync('npx', ['skills', ...])`; branch on exit code; emit JSON `{ ok, exitCode, stdout, stderr, source }`. `audit` runs `scanSkillContent`. | YES for the mechanical shell-out + scan. Necessity/conflict/recommendation judgment is skill-side. |
| `adopt.cjs` | `adopt scan` | Layers 1+2 → the JSON contract above; `git ls-files` / walk; manifest detection; deep-read-candidate heuristics. | YES — mechanical scan. Layer-3 reads + analysis are skill/agent. |
| `security.cjs` (extend) | (lib fn) `scanSkillContent(text)` | Pattern scan: exfiltration, overbroad perms, prompt-injection/zero-width. Returns `{ findings: [{severity, kind, evidence}], verdict }`. | YES — pure function, reuses existing regex toolkit. |

**Patterns every new command MUST follow (from the read engine):**
- Zero runtime deps; `node:` built-ins only (`crypto`, `fs`, `path`, `child_process`).
- Emit via `core.cjs` `output(result, raw)` — inherits the `@file:` >50KB spill; never reimplement spill. Errors via `error()` → stderr + exit(1).
- Shell out with `spawnSync`/`execFileSync` **array args, never a shell string** (matches `execGit`), so skill/repo names can't inject.
- Greenfield-safe: every probe returns a value, never throws on a missing `.sovereign/` or non-git dir.
- Router: add `case 'bridge'|'adopt'|'extension'` using existing `parseNamedArgs`/`parseMultiwordArg`/`parseFieldValuePairs` (e.g. `--files a b c` already parsed for `commit`).
- M3-CC: each skill is a thin orchestrator (one `init <workflow>` orient, "Why this matters", recommendation-first, nav footer), `disable-model-invocation: true` (user-invoked, like Council/architecture), so `doctor`'s auto-trigger budget stays at the 5 Fast Lane skills. `validate skills` must pass.

---

## 5. Open questions / flags for planning

1. **`skills` output instability (MEDIUM).** `find`/`add` stdout is undocumented and could change between versions. **Decision:** wrapper drives on exit codes + `skills use` for content; only loosely regex `owner/repo@skill` from `find`. Pin a known-good `skills` major in docs (1.5.x) and note it's *invoked, not depended-on*.
2. **`skills use` exact behavior (MEDIUM).** README says it writes to a temp dir and prints the prompt; verify empirically during planning that `use` reliably yields the raw `SKILL.md` body for the security scan (vs only a transformed prompt). If `use` is insufficient, fall back to a shallow `git`/HTTP fetch of the source `SKILL.md`. **Action: smoke-test `npx skills use vercel-labs/agent-skills@<skill> --agent claude-code` in phase.**
3. **`find-skills/SKILL.md` is stale (HIGH).** It documents a `check` subcommand that 1.5.10 dropped. Don't mirror that file's command list; use the README's set (`add/use/list/find/remove/update/init`). Use `update` (not `check`) for staleness-of-installed.
4. **Extensions log location (LOW, design choice).** v1 used a single `SOVEREIGN_EXTENSIONS.md`; v2 should use `.sovereign/extensions/<date>-<skill>.md` per-decision files (matches engine's per-artifact convention + Council transcripts). Confirm with the constitution/manifest naming during planning.
5. **Adopt scope guard (HIGH, already in REQUIREMENTS).** `sovereign-adopt` reads + records only — never refactors source. Type-3 legacy deferred; M3 = greenfield-with-code + Type-2 mid-flight.
6. **OWASP Agentic Top-10 mapping (MEDIUM).** v1 ADR cites "OWASP Agentic Skills Top 10" for the security audit. The exact list should be re-verified against a current OWASP source when authoring `scanSkillContent`'s pattern set, rather than hard-coding from memory.

### Suggested phase ordering rationale

`extension` and `bridge` are independent; `adopt` is the largest (scan helper + retro-ADR + roadmap reasoning). Build **engine helpers first** (`bridge.cjs` hashing is the smallest, fully testable, no external process), then **`extension`** (needs the live `skills` smoke-test), then **`adopt`** (depends on the most reasoning + reuses `execGit`). Each skill layers thinly on its engine command per M3-CC.

---

## Sources

- `~/.claude/skills/find-skills/SKILL.md` — consumer usage summary (HIGH for intent; flagged stale on `check`).
- `npm view skills` live, 2026-06-09: `skills@1.5.10`, latest, published 6 days ago, MIT, dep `yaml`, ~70 agents, bins `skills`/`add-skill` (HIGH).
- `github.com/vercel-labs/skills` README — authoritative command/flag spec; confirms no `--json`, `use`→tempdir+stdout, `.claude/skills/` default, `--copy`, `-g`, `-a`, `-s`, `-y` (HIGH).
- `engine/bin/lib/{init,core,commit,security}.cjs` + `sovereign-tools.cjs` — engine patterns: `output()`/`@file:` spill, `error()`, `execGit` array-arg shell-out, `parseNamedArgs`/`--files`, greenfield-safe probes, `sanitizeForPrompt` (HIGH, read directly).
- `archive/v1/SOVEREIGN_PROJECT.md` lines 184, 232–290, 294–309, 530–540 — locked bridge/adopt/extension designs + deferred-feature lineage (HIGH).
- `.planning/REQUIREMENTS.md` — ADOPT/BRIDGE/EXT/ENG-08/M3-CC scope + deferrals (HIGH).
- `node:crypto` SHA-256 — built-in, zero-dep (HIGH).
