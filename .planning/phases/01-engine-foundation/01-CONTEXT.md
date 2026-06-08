# Phase 1: Engine Foundation - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** Synthesized from gated vision (`/SOVEREIGN.md` §3-§5) + project research (`ARCHITECTURE.md`, `STACK.md`, `PITFALLS.md`). No interactive discuss-phase needed — the engine contract is already pinned by direct reading of GSD's shipped engine.

<domain>
## Phase Boundary

Phase 1 delivers **build-order chain A→B→C** (kept whole, never split): the zero-dependency Node `.cjs` engine `sovereign-tools` and the committed `.sovereign/` state model it manages. After this phase, an agent can run `sovereign-tools init <workflow>` and get one JSON blob — paths, config, resolved models, phase status — with zero file reads. This is SOVEREIGN's Core Value; nothing skill-shaped is allowed before it works.

**In scope:** the `.cjs` router + arg helpers + `@file:` spill; `loadConfig`; model-profiles table; `state load`/`state save` (field-level patch, regenerates MANIFEST); `gate open`/`gate pass`; `commit`; `model`/`resolve-model`; `init <workflow>`; `validate skills`; the `.sovereign/` directory templates; tests + `npm pack` smoke test.

**Out of scope (later phases):** `sovereign-init` *skill* (Phase 2), subagent definitions (Phase 2), Council (Phase 3), Fast Lane skills (Phase 4). Phase 1 is engine + state only.
</domain>

<decisions>
## Implementation Decisions

### ADRs to write BEFORE code (locked, record under `docs/adr/`)
- **ADR: engine = zero-dependency `.cjs`.** Mirror GSD's `bin/gsd-tools.cjs`. No compiled TS, no `tsx`, no `bun`, no `commander`/`yargs`. Source IS the artifact. Native `process.argv` parsing.
- **ADR: CJS packaging.** `package.json` without `"type":"module"`; `engines.node >= 20`; `bin` entry with shebang `#!/usr/bin/env node`. (Resolves the ESM-vs-CJS pitfall flagged in research.)
- **ADR: every command is authored as a skill directory** (skill wins over a bare command file on name clash in current Claude Code). Relevant later, recorded now.
- **ADR: drop v1's non-standard frontmatter** (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`) in favour of the real Agent Skills spec. The `validate skills` linter enforces this.
- **ADR: MANIFEST is an engine-derived view**, regenerated on every `state save`, never hand-edited.
- **ADR: subagent return-JSON schema contract** — reasoning subagents return validated JSON, never prose (pins the shape Phase 2/3 consume).

### Engine architecture (copy GSD's shapes verbatim where noted)
- Single `sovereign-tools.cjs` entry with a `main()`/`runCommand` switch router; helper libs split under `bin/lib/*.cjs` as GSD does.
- Port GSD's `extractField()` (dot + bracket notation) to support `--pick models.advisor`. Support `--raw`, `--cwd` flags.
- `output()` helper: write JSON to stdout; when blob > ~50KB, spill to a tmpfile and emit `@file:/tmp/...`. **Non-optional** — keeps large `init` payloads from blowing the Bash buffer. Every skill handles `if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi`.
- `loadConfig`: deep-merge `defaults ← ~/.sovereign/defaults.json (optional global) ← .sovereign/config.json (project)`, with flat+nested key fallback.

### `init <workflow>` JSON contract (nested namespaces)
Return: `project_root`, `sovereign_version`, `models{}`, `config{}`, `phase{}`, `context_injection{ manifest_path, constitution_path, glossary_path, relevant_adrs }`, `paths{}`, `exists{}`, `agents_installed`, `missing_agents`. Group into `models`/`config`/`phase`/`paths`/`exists` namespaces (greenfield readability) while keeping `--pick` dot-notation. The flagship workflow to support first is `init council`; also `init sovereign-init` and `init <fast-lane skill>` stubs.

### Core command mechanics (verified against GSD)
- **state load** → `{config, state_raw, manifest_raw, *_exists}` (add `manifest_raw` so one call also returns the <500-token MANIFEST).
- **state save / patch** → field-level regex patching against `**Field:**` patterns (no whole-file rewrites). **Must also re-derive and rewrite MANIFEST** (phase, blockers, next-action, decision/stack quick-refs). This is the one place SOVEREIGN extends GSD.
- **gate open / gate pass `<n>`** → append-only writes to `.sovereign/SOVEREIGN.md` (audit trail; avoids whole-file rewrite). GSD has no gate primitive — net-new.
- **commit** → replicate GSD `cmdCommit`: bail if `!commit_docs`, bail if `.sovereign/` gitignored, optional branch create, stage files, commit, return short hash. **Keep prompt-injection sanitization** of the message (it gets read back into agent context). Retarget to `.sovereign/`.
- **model / resolve-model** → per-agent override → `resolve_model_ids:'omit'` → profile-table lookup → fallback `sonnet`. Profiles: `quality` / `balanced` / `budget` / `inherit`. Under `quality`, council advisors + chairman + peer_reviewer + planner = `opus`.
- **validate skills** → lint SKILL.md frontmatter: `name` ≤64 chars, lowercase-hyphen, must NOT contain "claude"/"anthropic"; `description` within the platform cap. Exit non-zero on violation.

### `.sovereign/` state model (templates seeded here)
```
.sovereign/
├── MANIFEST.md     # DERIVED, regenerated every state save, <500 tokens, loads first
├── SOVEREIGN.md    # constitution; gates appended (append-only)
├── CONTEXT.md      # ubiquitous-language glossary
├── STATE.md        # field-patchable `**Field:** value` lines
├── config.json     # model_profile, commit_docs, parallelization, toggles
├── council/        # council transcripts (orchestrator-only writes)
├── external-docs/  # anchor URLs + versions
├── extensions/     # imported skills + vetting log
└── docs/{adr,api,specs,security,infra,intersections}/
```
- STATE.md and MANIFEST quick-ref tables use `**Field:** value` so `stateReplaceField`-style patching works unchanged.
- MANIFEST token budget enforced in code (count tokens on save; truncate quick-ref tables to top-N or warn).

### Testing / DoD
- `node --test` suite covering: arg parsing, `extractField`, `@file:` spill threshold, config merge, model resolution per profile, field-level patch, MANIFEST regeneration + budget, gate append, commit gating (commit_docs/gitignore), validate-skills pass/fail.
- `npm pack` → install the tarball into a fresh temp dir → run `sovereign-tools init` → succeeds (verifies shebang, bin path, CJS, no missing deps). Use `npm pack`, NOT `npm link`.

### Claude's Discretion
- Exact split of helper modules under `bin/lib/`.
- Internal function names and the token-counting heuristic for the MANIFEST budget (approx by chars/4 is acceptable).
- Test file organization.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SOVEREIGN's own design (authoritative)
- `/SOVEREIGN.md` §3 (five layers), §4 (`.sovereign/` model), §5 (engine commands), §9 (ADRs) — the gated north star.
- `.planning/research/ARCHITECTURE.md` — the concrete `init` JSON contract, command mechanics table, and A→B→C build order. **Primary spec for this phase.**
- `.planning/research/STACK.md` — zero-dep `.cjs` rationale, packaging, frontmatter spec, discovery rules.
- `.planning/research/PITFALLS.md` — context-blowup, packaging, subagent foot-guns to design out.

### Reference implementation to study (do NOT copy wholesale — lift shapes)
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` and `~/.claude/get-shit-done/bin/lib/*.cjs` — `main()`/`runCommand`, `extractField()`, `output()` spill, `loadConfig`, `cmdStateLoad`/`cmdStatePatch`, `cmdCommit`, `resolveModelInternal`.
- `~/.claude/get-shit-done/references/model-profiles.md` — profile table shape.
- `archive/v1/templates/` (MANIFEST.md, SOVEREIGN.md, CONTEXT.md) — v1 template content to mine.
</canonical_refs>

<specifics>
## Specific Ideas

- Engine lives at repo `engine/` per `/SOVEREIGN.md` §7 (`engine/src/`, `engine/package.json`). The published bin name is `sovereign-tools` (invoked by skills); `npx sovereign` is the user-facing wrapper (its `init` *skill* is Phase 2, but the package/bin wiring can be stubbed here).
- `sovereign_version` starts at `2.0.0`.
- The five "ADRs before code" should be committed as the FIRST plan's work, before engine code — make the decisions durable.
</specifics>

<deferred>
## Deferred Ideas

- Exact gate-criteria schema (what makes a gate *passable*) — `gate open/pass` writes the record now; richer pass-criteria validation can come when phases actually gate real work.
- MANIFEST budget enforcement strategy (truncate-to-top-N vs warn-only) — pick during implementation, flagged as discretion.
- `~/.sovereign/defaults.json` global config — support the merge hook now; the install UX for it is later.
</deferred>

---

*Phase: 01-engine-foundation*
*Context gathered: 2026-06-08 — synthesized from gated vision + project research*
