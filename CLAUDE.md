<!-- GSD:project-start source:PROJECT.md -->
## Project

**SOVEREIGN (v2 rebuild)**

SOVEREIGN is a universal, project-agnostic engineering system delivered as agent skills: gated phases, living documents, and guardrails that guide any software project from first thought to live production and beyond. This project is the **v2 rebuild** — keeping v1's content and philosophy but replacing its architecture with GSD-class foundations (a deterministic engine + thin orchestrator skills + specialized subagents). It ships as `github.com/sovereign-base/sovereign`, installed via `npx sovereign`, MIT-licensed.

It is for engineers and agents who want to build properly — and refuse to let the answer to "how do we build this?" be *vibes*.

**Core Value:** **The engine.** A skill orients itself with one CLI call (`sovereign-tools init <workflow>` → one JSON blob), not ten file reads. If that token-efficient engine + committed `.sovereign/` state works, everything else (skills, council, phases) is layered cheaply on top. v1 failed precisely because it had no engine — skills were prose with nothing underneath. The engine is the one thing that must work.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR — The Prescriptive Stack
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Node.js** | >= 20 LTS (dev verified on v23.11) | Runtime for `sovereign-tools` engine | `npx` ships with Node; no separate toolchain. GSD targets the Node baseline and runs dependency-free. Pin `"engines": { "node": ">=20" }`. |
| **Plain CommonJS `.cjs`** | n/a | Engine source format | The installed GSD engine (`gsd-tools.cjs` + 17 `lib/*.cjs` modules) is hand-written CommonJS with **zero runtime dependencies** and **no build step**. The shipped artifact *is* the source — `npx`-runnable instantly, no `dist/`, no compile gap between repo and package. ADR-002 says "matches GSD `.cjs`." |
| **Native `process.argv` arg parsing** | n/a | CLI routing | GSD uses a `switch(command)` router + two helpers (`parseNamedArgs`, `parseMultiwordArg`) over `process.argv.slice(2)`. ~40 lines, zero deps. A CLI whose only consumers are skills (machine callers, not humans) does not need commander/yargs ergonomics. |
| **JSON-on-stdout contract** | n/a | Engine↔skill interface | The core value proposition: `init <workflow>` returns one JSON blob so a skill orients with one call, not ten reads. Mirror GSD's `output(result, raw, rawValue)` helper: `JSON.stringify(result, null, 2)` to fd 1 via `fs.writeSync(1, …)`; errors to fd 2 + `exit(1)`. **Include GSD's >50KB spill-to-tmpfile trick** (`@file:/tmp/…` prefix) to survive Claude Code's ~50KB Bash buffer. |
| **`node:test` + `node:assert`** | built-in (Node >= 20) | Unit/integration tests | Built into Node, so it preserves the zero-dependency property and runs anywhere `npx sovereign` runs. The engine is pure functions over the filesystem + git — ideal for `node:test` with `tmpdir` fixtures. No reason to pull in a framework. |
### Skill / Agent / Command File Formats (verified spec)
| Field | Required? | Notes (exact, from Claude Code frontmatter reference) |
|-------|-----------|-------|
| `name` | No (Claude Code) / Required (API spec) | Display name. Defaults to directory name. **API constraints:** max 64 chars, lowercase + numbers + hyphens only, may NOT contain `anthropic`/`claude`. |
| `description` | Recommended | What it does + when to use it. API max 1024 chars; Claude Code truncates `description`+`when_to_use` at **1,536 chars** in the listing. Put key use case first. |
| `when_to_use` | No | Trigger phrases / example requests. Appended to description, counts toward the 1,536 cap. |
| `allowed-tools` | No | Tools usable without permission prompt while active. Space-/comma-separated string or YAML list. |
| `disallowed-tools` | No | Tools removed while active (e.g. block `AskUserQuestion` in autonomous loops). |
| `disable-model-invocation` | No | `true` = only the user can run it via `/name` (use for side-effecting workflows). Default `false`. |
| `user-invocable` | No | `false` = hidden from `/` menu, Claude-only background knowledge. Default `true`. |
| `model` | No | Model override for the turn (`/model` values, or `inherit`). |
| `effort` | No | `low`/`medium`/`high`/`xhigh`/`max`. |
| `context` | No | `fork` = run skill in a forked subagent context. |
| `agent` | No | Which subagent type to use when `context: fork`. |
| `argument-hint`, `arguments` | No | Autocomplete hint + named positional args (`$name` substitution). |
| `paths` | No | Glob patterns; auto-activate only on matching files. |
| `hooks`, `shell` | No | Skill-scoped hooks; `bash`(default)/`powershell`. |
| Field | Required? | Notes |
|-------|-----------|-------|
| `name` | Yes | Subagent identifier. |
| `description` | Yes | Drives delegation — Claude uses it to decide when to spawn. |
| `tools` | No | Allowed tools (e.g. `Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*`). Omit to inherit all. GSD agents set this explicitly. |
| `disallowedTools` | No | Inherit everything except listed tools. |
| `model` | No | `haiku`/`sonnet`/`opus`/`inherit`. GSD uses `color` too (cosmetic). |
| `skills` | No | Preload named skills into the subagent. |
| `mcpServers` | No | Inline MCP server scoped to the subagent. |
### Discovery & Install Locations (verified)
| Location | Path | Scope |
|----------|------|-------|
| Personal skills | `~/.claude/skills/<name>/SKILL.md` | all the user's projects |
| Project skills | `.claude/skills/<name>/SKILL.md` (+ every parent dir up to repo root, + nested dirs on demand) | that project |
| Plugin skills | `<plugin>/skills/<name>/SKILL.md` → `/plugin:name` namespace | where plugin enabled |
| Personal/project agents | `~/.claude/agents/*.md` or `.claude/agents/*.md` | — |
| Plugin manifest | `<dir>/.claude-plugin/plugin.json` makes a skills folder load as a plugin bundling agents/hooks/MCP | — |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **(none in the engine — by design)** | — | — | The engine MUST stay zero-dependency to preserve instant `npx` + offline determinism, matching GSD. Resist all additions. |
| **`vercel-labs/skills` (`npx skills`)** | 1.5.10 | Extension discovery/install (Layer 5) | Per R-003, SOVEREIGN *wraps and vets* this, never reinvents it. Supports `~70` agents; installs to `.claude/skills/` (Claude), `.agents/skills/` (Cursor/Codex-style), symlink-or-copy. `npx skills find/add/init/check/update`. Invoke as a subprocess from a `sovereign extensions` skill. |
| **`@types/node`** | matches Node | Type-checking the engine | DEV ONLY (see below). Lets you author `.cjs` with JSDoc + `// @ts-check` and get typecheck-grade safety without a build step. |
| **`typescript`** | 6.0.x | `tsc --noEmit` typecheck of `.cjs` via JSDoc | DEV ONLY. Run in CI as a linter; never ship compiled output. Optional — adopt only if JSDoc typechecking proves valuable. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| **`node --test`** | Test runner | `node --test bin/lib/*.test.cjs`. Zero install. Use `node:assert/strict`. |
| **`tsc --noEmit` + JSDoc `// @ts-check`** | Type safety without compilation | Author plain `.cjs`, annotate with JSDoc, typecheck in CI. Keeps the "source is the artifact" property while catching type bugs. (Confidence: MEDIUM — this is a recommended discipline, not something GSD's install demonstrates.) |
| **Prettier** | Formatting | DEV ONLY; cosmetic. |
| **GitHub Actions** | CI: `node --test` + `tsc --noEmit` on PR | Matrix on Node 20/22/LTS to guarantee the `npx` baseline. |
| **`npm publish` / `npm pack`** | Distribution | `package.json` `"bin": { "sovereign": "bin/sovereign.cjs", "sovereign-tools": "bin/sovereign-tools.cjs" }`, `"files": ["bin","skills","agents","templates","references"]`, `#!/usr/bin/env node` shebang on bin entries. `npx sovereign` resolves the `bin`. |
## Installation
# END USERS — no install step; npx fetches and runs:
# CONTRIBUTORS building SOVEREIGN — engine has NO runtime deps:
# EXTENSION LAYER (wrapped, not bundled):
## `npx sovereign init` install design (prescriptive)
- `package.json` `bin.sovereign` → `bin/sovereign.cjs` (the installer/launcher), `bin.sovereign-tools` → the engine.
- `init` should, by default, **install to project `.claude/`** (so the system travels with the repo and `.sovereign/` is committed per ADR-003), with `--global` to target `~/.claude/`.
- Prefer **copy** over symlink for the committed-project case (portable across machines/CI); offer symlink for `--global` dev. (`npx skills` exposes the same choice — mirror its convention.)
- Seed `.sovereign/` from `templates/` (GSD seeds `.planning/` from a `templates/` tree the same way).
- Idempotent: detect existing install, diff versions (ship a `VERSION` file like GSD), prompt before overwrite.
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Plain `.cjs`, no build | **Compiled TypeScript (`tsc` → `dist/`)** | Only if the engine grows a large typed domain model with many contributors who refuse JSDoc. Cost: a build step, a source/artifact gap, and risk that the published `dist` drifts from source. GSD deliberately avoids this; so should we. |
| Plain `.cjs`, no build | **`tsx` (run TS directly)** | If you want `.ts` authoring with no build AND accept a runtime dep + slower cold start on every `npx` call. Adds `tsx` to the dependency closure, which breaks "zero-dep, instant npx." Reject for the engine. |
| Node | **Bun** (`bun build`/`bun run`) | If you were targeting a Bun-first audience. But `npx` (npm) is the universal entry; requiring Bun fragments install. Reject — contradicts `npx sovereign` as the front door. |
| Native arg parsing | **commander 15 / yargs** | If `sovereign-tools` ever becomes a human-facing CLI with help text, completions, nested command trees. Today its callers are skills; native parsing (GSD-style) is sufficient and dependency-free. Revisit only if a human CLI surface emerges. |
| `node:test` | **Vitest 4 / Jest** | If you add a TS build and want watch mode/rich mocking/coverage UI. For pure FS+git functions, `node:test` is enough and keeps zero deps. Vitest is the right pick *only if* you also adopt compiled TS. |
| Wrap `npx skills` | **Build own skill registry** | Never (R-003). find-skills already solved discovery/install across ~70 agents. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Compiling the engine to `dist/`** | Creates a source↔artifact gap; the published package can silently diverge from the repo; adds a build the `npx` user never sees. GSD ships source-as-artifact for exactly this reason. | Ship `.cjs` source directly; typecheck with `tsc --noEmit`. |
| **`commander` / `yargs` / `clipanion`** | Runtime dependency for a machine-called CLI that only needs `switch` + 2 helpers. Bloats install, slows `npx`. | Native `process.argv` parsing (copy GSD's `parseNamedArgs`/`parseMultiwordArg`). |
| **`tsx`/`ts-node`/`bun` as the runtime** | Each adds a dependency or a non-npm toolchain in front of `npx sovereign`, breaking the "works out of the box" promise (ADR-002 rationale). | Plain Node. |
| **v1's custom SKILL.md frontmatter** (`triggers`, `works-best-with`, `min-model`, `tokens`, bare `phase`) | Not in the Agent Skills standard; non-portable; pollutes the spec'd surface. Other tools ignore them and Claude Code doesn't act on them. | `description` + `when_to_use` for triggers; namespaced `metadata:` for portability hints; phase logic lives in the engine, not frontmatter. |
| **Authoring commands as bare `.claude/commands/*.md`** | Legacy path; no supporting-files dir, no auto-load, skill wins on name clash. | Author each command as a `skills/<name>/SKILL.md` directory. |
| **Tool/model names in skill `name`** | API spec forbids `anthropic`/`claude` in `name`, and caps at 64 chars lowercase-hyphen. | Neutral names (`council`, `grill-with-docs`, `sovereign-init`). |
| **Reinventing extension discovery** | Duplicates `npx skills`; wasted effort, worse coverage. | Wrap `npx skills` + add a vetting/audit log (R-003). |
| **Large JSON without spill handling** | Claude Code Bash buffer is ~50KB; big `init` payloads truncate and corrupt parsing. | Copy GSD's `@file:` tmpfile spill in the `output()` helper. |
## Model-Agnostic Strategy (best-on-Claude, runs anywhere)
- **Portable core:** Skills that use only `name` + `description` + markdown body run unmodified across all adopters. Keep SOVEREIGN's skill *bodies* in this lowest-common-denominator form, with the heavy logic in the **engine** (a plain Node CLI any agent can shell out to via Bash) rather than in Claude-only frontmatter.
- **Claude-best layer (graceful degradation):** `context: fork`, `disable-model-invocation`, `user-invocable`, subagent `skills:` preload, `!`command`` injection, hooks — these are Claude Code extensions. Other tools ignore unknown frontmatter, so a skill still loads; it just doesn't auto-fork or auto-inject. Design every skill so the non-Claude path is *"read SKILL.md, run `sovereign-tools init`, follow the steps"* and works fine without the extensions.
- **Install fan-out:** Claude → `.claude/skills/`, Codex → `.agents/skills/`, Gemini → `~/.gemini/.../skills/`. `npx sovereign init` should target Claude paths by default and either delegate to `npx skills` (which knows ~70 agents' paths) or accept `--agent <name>` to write the right directory. (Confidence: MEDIUM — exact per-agent paths shift; let `npx skills` own them.)
- **Engine is inherently agent-agnostic:** any `SKILL.md`-capable agent that can run Bash can call `sovereign-tools` and parse the JSON. That is the real portability guarantee — the engine, not the prose.
## Stack Patterns by Variant
- Plain `.cjs` + `node:test` + JSDoc `// @ts-check`.
- Because zero-dep + instant-`npx` + source-as-artifact is the whole point; matches GSD's proven shape.
- Reconsider compiled TS + Vitest, accepting a build step and `dist/` publish.
- Only if JSDoc typechecking demonstrably fails to scale — do not pre-optimize.
- Keep skill bodies on the portable core format; lean on `npx skills` for multi-agent install paths; gate Claude-only features behind "if your agent supports forked context…" guidance.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `sovereign-tools.cjs` | Node >= 20 LTS | Pin `engines.node`. Verified locally on Node v23.11; GSD baseline is the same family. |
| `npx skills` | skills@1.5.10 | Pin a known-good major in docs; it's invoked, not depended-on. |
| Claude Code skills | spec name max 64 chars, lowercase-hyphen, no `anthropic`/`claude` | Enforce in a `sovereign-tools validate skills` lint. |
| `init` JSON payload | Claude Code Bash buffer ~50KB | Spill to `@file:` tmpfile above threshold (GSD pattern). |
| `typescript@6` + `@types/node` | dev typecheck only | Not shipped; no runtime coupling. |
## Sources
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` + `bin/lib/*.cjs` + `VERSION` (1.30.0) — engine shape: zero-dep CommonJS, switch router, native arg parsing, `output()`/`error()` JSON contract, `@file:` 50KB spill, `init <workflow>` compound commands. **HIGH** (read directly).
- `~/.claude/agents/gsd-planner.md` — subagent frontmatter (`name`, `description`, `tools`, `model`, `color`). **HIGH** (read directly).
- `code.claude.com/docs/en/skills` (fetched 2026-06-08) — Claude Code skill frontmatter reference, discovery/precedence, commands-merged-into-skills, install locations, substitutions. **HIGH**.
- `platform.claude.com/docs/en/agents-and-tools/agent-skills/overview` (fetched 2026-06-08) — `name`/`description` requirements & limits (64/1024 chars, reserved words), progressive disclosure, Claude Code = custom skills only. **HIGH**.
- `code.claude.com/docs/en/sub-agents` (fetched 2026-06-08) — subagent fields `name`/`description`/`tools`/`disallowedTools`/`model`/`skills`/`mcpServers`. **HIGH**.
- `archive/v1/skills/.../SKILL.md` (read directly) — v1's non-standard frontmatter, flagged for removal. **HIGH**.
- `~/.claude/skills/find-skills/SKILL.md` + `npm view skills` (1.5.10, `vercel-labs/skills`) + GitHub README — `npx skills` commands, ~70-agent support, install paths. **HIGH** on commands/version; **MEDIUM** on per-agent paths.
- WebSearch: agentskills.io open standard / 32 adopters incl. Codex, Cursor, Gemini CLI; skills.sh launched 2026-01-20 — cross-tool portability claim. **MEDIUM** (secondary sources, multiple agree; agentskills.io itself timed out).
- `npm view` (live, 2026-06-08): typescript 6.0.3, tsx 4.22.4, vitest 4.1.8, commander 15.0.0, esbuild 0.28.0. **HIGH**.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
