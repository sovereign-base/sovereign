# Phase 2: Bootstrap + Subagent Definitions - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Source:** Synthesized from `/SOVEREIGN.md` §5/§7, ROADMAP Phase 2, `.planning/research/ARCHITECTURE.md` (subagent mapping), `STACK.md` (install paths + frontmatter spec), `FEATURES.md` (M1 scoping). Builds on the verified Phase 1 engine.

<domain>
## Phase Boundary

Phase 2 makes SOVEREIGN installable and defines the reasoning subagents the later phases dispatch. After this phase: `npx sovereign init` installs SOVEREIGN's skills + agents into a project and scaffolds `.sovereign/`; the M1 subagents exist as definition files with fixed JSON return schemas; the engine's `agents_installed`/`missing_agents` guard does a real filesystem check; and a budget-check mechanism + the `disable-model-invocation` convention are in place so Phase 3-4 skills stay within Claude Code's skill-listing budget.

**In scope:** `bin/sovereign.cjs` installer (INIT-01/02/03); subagent definition files in `agents/`; replacing the hardcoded `agents_installed:true` in `init.cjs` with a real check; a `doctor`/budget-check command + the listing-budget convention (SKL-07).

**Out of scope:** the actual skill files (Council = Phase 3; Fast Lane = Phase 4); advisor *lens prompt content* (injected by the Council orchestrator in Phase 3); multi-agent / non-Claude install paths (delegate to `npx skills`, M3).
</domain>

<decisions>
## Implementation Decisions

### `bin/sovereign.cjs` — the `npx sovereign init` installer (INIT-01/02/03)
- **Default target = project `.claude/`** (`.claude/skills/` + `.claude/agents/`), **copy not symlink**, so the system travels with the repo and `.sovereign/` is committed (ADR-003). `--global` targets `~/.claude/` (offer symlink there for dev). Mirror `npx skills`' copy convention.
- Scaffold `.sovereign/` from the packaged `templates/sovereign/` (the tree shipped in Phase 1) only if absent.
- **`--quick`** installs only the Fast Lane 5 skill dirs; **`--full`** installs the full M1 skill set. The selection logic is built now and copies whatever skill dirs are present in the package (skills are populated in Phases 3-4) — so `--quick`/`--full` are correct from day one and grow as skills land.
- **Idempotent + version-aware** (INIT-03): ship/read the `VERSION` file (already `2.0.0`); on re-run, detect an existing install, diff versions, and prompt before overwrite (GSD pattern). Non-destructive to user-modified `.sovereign/` content.
- `package.json` `bin` already maps `sovereign` → `bin/sovereign.cjs`. Keep zero-dependency; native arg parsing; reuse engine `core.cjs` helpers.

### Subagent definitions in `agents/` (the agents M1 actually dispatches)
Define ONLY the reasoning agents an M1 SOVEREIGN skill dispatches:
- **`sovereign-advisor`** — ONE definition, parameterized by an injected `<lens>` (the 5 Council roles — Skeptic/Architect/Builder/Outsider/Risk Officer — are injected by the Council orchestrator in Phase 3; this file is the advisor *shell* + return schema, NOT the lens content).
- **`sovereign-chairman`** — synthesis of (anonymized) advisor transcripts → verdict.
- **`sovereign-peer-reviewer`** — the anonymous A–E cross-review pass.
- **`sovereign-sentinel`** — the native-tier post-phase reviewer (used by the Phase 4 `sentinel` skill).

Each agent file uses the **real Agent Skills subagent frontmatter** (`name`, `description`, `tools`, `model` — default `inherit`; optional `color`) per STACK.md — NOT v1's non-standard fields. Each MUST specify it returns **validated JSON against a fixed schema** (never prose) per the Phase-1 subagent-return-JSON ADR; document each agent's return schema in its body.

**DEVIATION (deliberate scope tightening):** ROADMAP criterion #3 also lists `planner` and `researcher`. SOVEREIGN's M1 has **no skill that dispatches a planner or researcher** (those were GSD analogues in the ARCHITECTURE mapping table, not SOVEREIGN requirements). Defining agents with no caller is the over-scope trap PITFALLS.md flags. **Defer `planner`/`researcher`** until a SOVEREIGN skill needs them (not M1). The planner must NOT mark INIT/SKL requirements incomplete over this — all four M1-dispatched agents above are defined.

### Real `agents_installed` / `missing_agents` check (replaces Phase-1 stub)
`init.cjs` currently hardcodes `agents_installed: true` with a `// TODO(Phase 2)`. Replace with a real check: given the required agent names for the requested workflow, verify the corresponding `<name>.md` files exist in the install location (`.claude/agents/` or `~/.claude/agents/`); populate `missing_agents` and set `agents_installed` accordingly. No silent general-purpose fallback — skills hard-error on missing agents.

### SKL-07 — listing-budget mechanism + convention
- Add a **`sovereign-tools doctor`** command (or `validate budget`): enumerate installed SOVEREIGN skills, count the **auto-triggerable** ones (those WITHOUT `disable-model-invocation: true`) and sum their `name`+`description` chars; warn if the auto-triggerable count exceeds ~7 or the descriptions approach Claude Code's ~1% listing budget. With no skills yet it reports clean — the mechanism + threshold exist for Phases 3-4 to satisfy.
- Document the convention: **orchestrator-only / side-effecting skills set `disable-model-invocation: true`** (removing them from the listing budget); only genuinely auto-triggerable skills stay invocable. Record as a short reference (feeds CONV-01 in Phase 5).

### Claude's Discretion
- Exact installer prompt/flag UX and overwrite-prompt wording.
- Agent-file `color` and exact `tools` lists (least-privilege per agent).
- `doctor` output format and the precise budget heuristic (chars/4, 1% of 200k ≈ 2000 tokens listing budget is a reasonable target).
</decisions>

<canonical_refs>
## Canonical References
**MUST read before planning/implementing:**
- `/SOVEREIGN.md` §5 (engine entry `npx sovereign init`), §7 (repo layout: `engine/`, `skills/`, `agents/`).
- `.planning/research/ARCHITECTURE.md` — "Mapping to SOVEREIGN's reasoning agents" table + dispatch shapes; the `agents_installed` guard discussion.
- `.planning/research/STACK.md` — subagent frontmatter fields (exact), discovery/install locations (`.claude/` vs `~/.claude/`, plugins), `npx skills` copy convention, skill-name rules.
- `.planning/research/FEATURES.md` — M1 vs deferred scoping; Council `--standard` shape.
- `engine/bin/lib/init.cjs` — the `agents_installed:true` stub + `// TODO(Phase 2)` to replace; the `init sovereign-init` bootstrap-detection fields.
- `engine/bin/sovereign.cjs` — the installer stub to implement.
- `archive/v1/SOVEREIGN_PROJECT.md` + the hex/claude-council role JSON — the 5 advisor lenses (content lands in Phase 3, referenced here only for the advisor return-schema shape).

**Reference implementation (shapes, don't copy wholesale):**
- `~/.claude/agents/gsd-*.md` — real subagent file structure (frontmatter + body + structured-return discipline).
- `~/.claude/skills/find-skills/SKILL.md` + `npx skills` behavior — install/copy conventions.
</canonical_refs>

<specifics>
## Specific Ideas
- Agent files live at repo `agents/` and are shipped in the package `files` allowlist (add `agents` alongside `bin`,`templates`,`VERSION`).
- `npx sovereign init` is the user front door; the engine `sovereign-tools` is the skills' back door. Keep both bins zero-dep.
- Subagent return schema: at minimum `{ ok: boolean, ... }` plus agent-specific fields — pin per agent, validated at the orchestrator boundary (Phase 3 enforces; Phase 2 declares).
</specifics>

<deferred>
## Deferred Ideas
- `planner` / `researcher` subagents — until a SOVEREIGN skill dispatches them (not M1).
- Multi-agent (Codex/Cursor/Gemini) install paths — delegate to `npx skills`, M3.
- The actual skill files + advisor lens content — Phases 3-4.
</deferred>

---

*Phase: 02-bootstrap-subagents*
*Context gathered: 2026-06-08 — synthesized from gated vision + Phase 1 outcomes + project research*
