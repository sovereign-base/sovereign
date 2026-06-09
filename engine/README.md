# sovereign-cli

Install with `npx sovereign-cli init`. The package ships two bins: **`sovereign-cli`** (the human installer/launcher) and **`sovereign-tools`** (the engine the skills call).

The SOVEREIGN engine (`sovereign-tools`) is a **zero-dependency** CommonJS CLI (Node >= 20, no build step) that every SOVEREIGN skill calls to orient itself and mutate committed `.sovereign/` state. The source *is* the shipped artifact.

**The load rule:** a skill runs ONE call — `sovereign-tools init <workflow>` — and gets all paths, config, resolved models, and phase status as a single JSON blob. It reads files only when it needs their content. Bookkeeping lives here, in code, not in tokens.

## Command surface

| Command | Returns / does |
|---|---|
| `version` | Engine version (from `VERSION`). |
| `init <workflow>` | One nested JSON blob: `models`, `config`, `phase`, `context_injection`, `paths`, `exists`, `agents_installed`/`missing_agents`. Workflows: `council`, `sovereign-init`, fast-lane skills. |
| `state load` | `{ config, state_raw, manifest_raw, *_exists }` — one read for full orientation. |
| `state save` / `state patch --<field> <value>` | Field-level patch of `**Field:**` lines (no whole-file rewrite); **regenerates MANIFEST.md** within a ~500-token budget. |
| `gate open <n>` / `gate pass <n>` | Append-only gate records to `.sovereign/SOVEREIGN.md` (audit trail). |
| `commit "<msg>" --files ...` | Commits iff `commit_docs` and not gitignored; sanitizes the message; returns the short hash. |
| `model <agent>` / `resolve-model <agent>` | Resolves a subagent's model: per-agent override → `omit` → profile table → `sonnet`. |
| `validate skills [paths...]` | Lints SKILL.md frontmatter (name ≤64, lowercase-hyphen, no `claude`/`anthropic`; description ≤1024). Exits non-zero on violation. |
| `anchor add\|list\|check` | Anchor external docs under `.sovereign/external-docs/` (URL + `source`/`version`/`date-retrieved`/`re-verify-by` metadata; content opt-in via `--content`); `check` flags anchors past `re-verify-by`. Backs the `anchor-docs` / `verify-self` skills. |

## Conventions

- **`@file:` spill** — any output >50KB is written to a tmpfile and the path is emitted as `@file:/tmp/...`. Callers handle it: `if [[ "$OUT" == @file:* ]]; then OUT=$(cat "${OUT#@file:}"); fi`.
- **`--pick <path>`** — extract one field with dot/bracket notation (e.g. `--pick models.advisor`).
- **`--raw`** — emit a bare scalar instead of JSON. **`--cwd <dir>`** — run against another project root.

## Develop

```bash
node --test "test/**/*.test.cjs"   # full suite (zero deps)
```

Includes `pack-smoke.test.cjs`: `npm pack` → install the tarball in a fresh temp dir → run `init council` against it (never `npm link`). This is the distribution definition-of-done.
