# MCP server attachment reference

The contract behind `/mcp-attach` and the engine's `mcp` command. An MCP server is *a process your agent launches and trusts* — the same supply-chain surface as a third-party skill — so SOVEREIGN attaches one only through a vetted, logged flow, and records it in the **committed `.sovereign/config.json`** so it travels with the repo and every session/skill sees the same vetted server.

This is the parallel of `import-skill` for MCP: `import-skill` vets third-party *skills* (markdown + frontmatter); `mcp-attach` vets *servers* (launch specs).

---

## The record (`.sovereign/config.json` → `mcp_servers`)

`mcp add` writes one entry per server, keyed by a sanitized slug. **The engine owns this shape — never hand-edit it.**

```json
{
  "mcp_servers": {
    "context7": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@1.0.0"],
      "url": null,
      "env": { "API_KEY": "${CONTEXT7_KEY}" },
      "for": ["anchor-docs", "stack-select"],
      "description": "context7 — current library/framework docs",
      "verdict": "clean",
      "attached": "2026-06-11"
    }
  }
}
```

- **transport** — `stdio` (local `command`+`args`) or `http`/`sse` (remote `url`).
- **for** — the consuming skills allowed to use it (or `["*"]`). This is what `init <skill>` filters on to populate that skill's `mcp.available`.
- **verdict** — the security audit result at attach time (`clean` | `review`). A `block` is never recorded — the engine refuses.
- Servers in `~/.sovereign/defaults.json`'s `mcp_servers` deep-merge with the project's (user-global + per-project), via `loadConfig`. `mcp add`/`remove` only ever mutate the **project** file.

A per-attach decision record is also written to `.sovereign/mcp/<date>-<slug>.md` (the auditable rationale), mirroring `.sovereign/extensions/`.

---

## What the audit (`scanMcpServer`) flags

The engine scans the launch **spec** (not markdown). Two layers: the exfiltration + prompt-injection patterns reused from `scanSkillContent` (over the stringified spec), plus MCP-structured checks. Escalation matches `scanSkillContent`: any **high** → `block`, any **medium** → `review`, else `clean`.

| Category | Example | Severity |
|---|---|---|
| Exfiltration | `curl … \| sh`, pipe-to-shell, `fetch(`/XHR, webhook sink in `command`/`args` | high |
| Exfiltration | a remote `url` over plain `http://` (not `https://`) | medium |
| Overbroad / RCE | a raw shell as the server command (`bash -c …`) | high → **block** |
| Overbroad / supply-chain | an **unpinned** remote-code runner (`npx`/`uvx`/`pnpm dlx <pkg>` with no `@version`) | medium |
| Secrets | a credential-looking `env` value as a literal instead of a `${VAR}` reference | medium |
| Prompt injection | `[SYSTEM]` / `<<SYS>>` / "ignore previous instructions" / zero-width Unicode in the spec | high |

`mcp add` **refuses** a `block` verdict outright and refuses a `review` verdict unless `--force` (which records the server with its `review` verdict so the caveat stays visible).

---

## How consuming skills read it

A skill learns which servers it may use from its **one `init` call** — `mcp.available` is a compact `[{ id, transport, description }]` list, filtered by the server's `for` scope:

```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init anchor-docs)
# … parse INIT.mcp.available → if non-empty, prefer mcp__<id>__* over raw web/memory
```

Consuming skills today: `anchor-docs`, `verify-self`, `stack-select`, `grill-with-docs`. Each prefers an attached docs/data server for *current external facts* and, when none is attached, **says so** rather than silently falling back (no silent fallback — the SOVEREIGN discipline).

---

## Making a server live in the agent (`.mcp.json`)

`.sovereign/config.json` is SOVEREIGN's **portable system of record** — but the agent still needs to know how to *launch* the server. For **Claude Code**, mirror the same launch spec into the project `.mcp.json`:

```jsonc
{ "mcpServers": { "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@1.0.0"] } } }
```

Other SKILL.md agents (Gemini CLI, Cursor, Codex) read `.sovereign/config.json` and wire their own way. `/mcp-attach` offers this `.mcp.json` sync as a labeled, **optional** convenience — it is not the source of truth, and is skippable if you manage `.mcp.json` yourself. (Portable core, Claude-best layer.)

---

## Engine commands

| Command | Does |
|---|---|
| `mcp audit --id … --command … --args … [--url …] [--env K=V …]` | Scan a spec without persisting → `{ ok, id, findings, verdict }`. The pre-attach gate. |
| `mcp add …` (same flags + `--for a,b` `--description` `--force`) | Re-audit, refuse on `block` (or `review` w/o `--force`), persist `mcp_servers[slug]` + write the decision record. |
| `mcp list` | Attached servers (merged global + project) as an array. Greenfield → `[]`. |
| `mcp remove --id <slug>` | Delete from the **project** config → `{ id, removed }`. |

All emit through `output()` (inheriting the `@file:` >50KB spill); `--args`/`--env` collect tokens until the next `--flag`, so place them last.
