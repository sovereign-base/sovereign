---
name: mcp-attach
description: Attach an MCP server to SOVEREIGN safely — define its launch spec, run a five-gate vetting pass (necessity, conflict, security audit of the spec, recommendation, logged decision), and record it in your committed .sovereign/ config only on a deliberate go. Use when you want SOVEREIGN's ground-truth and design skills to reach a docs/data MCP server.
disable-model-invocation: true
argument-hint: "[server id | npx/uvx command | server url]"
---

## Why this matters

An MCP server is *a process your agent will launch and trust* — it can fetch over the network, run remote code (`npx`/`uvx` pull and execute a package), and read whatever you hand it. Attaching one casually is the same supply-chain risk as installing an unvetted skill: a malicious or sloppy server is a backdoor.

`mcp-attach` keeps the usefulness without the blind trust. SOVEREIGN's ground-truth skills (`anchor-docs`, `verify-self`) and design skills (`stack-select`, `grill-with-docs`) get sharper when they can query a *current* docs/data server instead of relying on training memory — but nothing is attached before five gates pass, and the audit is the engine's call, not ad-hoc. The attachment is recorded in your **committed `.sovereign/config.json`**, so it travels with the repo and every future session (and every consuming skill) sees the same vetted server.

## When to use this

When you want SOVEREIGN's skills to reach an MCP server — a live-docs server (e.g. context7-style library docs), an internal/auth'd documentation service, a pricing/registry data source. You have a launch target: a `command + args` (stdio) or a `url` (http/sse).

**Don't** use it to install third-party *skills* — that's `/import-skill`. And don't bypass the audit; the whole point is that no server is attached blind.

## The flow

A **thin orchestrator** — the engine (`mcp.cjs`) owns the spec audit, deterministic storage, and the decision record; this skill owns the *judgment*: which server is actually needed, what it should be scoped to, and the go/no-go call.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init mcp)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.mcp_dir` (`.sovereign/mcp/`), `paths.config` (`.sovereign/config.json`), and `mcp.available` (servers already attached). No other orientation reads.

**2 — Define the spec (the judgment).** Assemble the launch descriptor with the user:
- **transport** — `stdio` (a local command) or `http`/`sse` (a remote url).
- **command + args** (stdio) — e.g. `npx -y @upstash/context7-mcp@1.0.0`. **Pin the version** (`@1.0.0`, not bare): an unpinned `npx`/`uvx` package silently tracks upstream HEAD and the audit will flag it `review`.
- **url** (http/sse) — prefer `https://`; a plain `http://` url is flagged `review` (MITM/downgrade).
- **env** — pass secrets as **environment-variable references** (`API_KEY=${MY_KEY}`), never an inline literal token (a literal is flagged and would commit a credential into the repo).
- **for** — which consuming skills may use it: `anchor-docs,verify-self,stack-select,grill-with-docs` (or `*`). This is what makes the server show up in those skills' `init … mcp.available`.

**3 — The five vetting gates — BEFORE any attach, recommendation-first:**
- **① Necessity** — does a consuming skill / active track actually need this server now? If `mcp.available` already has an equivalent, or nothing here will use it, say so.
- **② Conflict** — check against already-attached servers (`mcp.available` from step 1) and recorded decisions (`.sovereign/docs/adr/`). Flag duplicates or contradictions.
- **③ Security audit** — audit the exact spec you'll attach:
  ```bash
  node ".claude/sovereign-engine/sovereign-tools.cjs" mcp audit \
    --id context7 --transport stdio \
    --command npx --args -y @upstash/context7-mcp@1.0.0
  ```
  The engine's `scanMcpServer` returns `{findings, verdict}`. **Drive the gate on the engine's verdict, not skill-side scanning.** `block` is a hard stop; `review` means attach only with the caveats noted.
- **④ Recommendation** — state it first and plainly: **ATTACH** / **DON'T ATTACH** / **ATTACH WITH CAVEATS**, with the reason.
- **⑤ Logged decision** — `mcp add` writes the decision record to `.sovereign/mcp/<date>-<slug>.md` automatically; after attaching, fill in its **Rationale** line so the choice is auditable.

**4 — Attach only on a go.** If the decision is ATTACH (clean), or ATTACH WITH CAVEATS (`review` — pass `--force`):
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" mcp add \
  --id context7 --transport stdio \
  --command npx --args -y @upstash/context7-mcp@1.0.0 \
  --for anchor-docs,stack-select \
  --description "context7 — current library/framework docs"
  # add --force only to accept a `review` verdict
```
This records `mcp_servers.context7` in `.sovereign/config.json` and writes the decision record. **Never** attach on a `block` verdict (the engine refuses anyway). Never hand-edit `config.json` — the engine owns the record shape.

**5 — Make it live in your agent (Claude-best, optional, skippable).** The record in `.sovereign/config.json` is SOVEREIGN's portable system of record — but your agent still needs to know how to *launch* the server. For **Claude Code**, mirror the same launch spec into the project `.mcp.json`:
```jsonc
// .mcp.json  — Claude Code reads this to launch the server
{ "mcpServers": { "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@1.0.0"] } } }
```
Other SKILL.md agents (Gemini CLI, Cursor, Codex) read `.sovereign/config.json` and wire their own way. This step is a convenience, not the source of truth — skip it if you manage `.mcp.json` yourself.

**6 — Confirm & persist.**
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" mcp list      # show attached servers
node ".claude/sovereign-engine/sovereign-tools.cjs" state save    # regenerates MANIFEST
node ".claude/sovereign-engine/sovereign-tools.cjs" commit        # if commit_docs — travels with the repo
```

## What the security audit looks for

`mcp audit` (via the engine's `scanMcpServer`) flags, over the launch spec:

- **Data exfiltration** — `curl|wget … | sh`, pipe-to-shell, fetch/XHR, or webhook sinks baked into `command`/`args`; a plain-`http://` remote url.
- **Overbroad / remote-code risk** — spawning a raw shell (`bash -c`) as the server (a hard `block`); an **unpinned** `npx`/`uvx`/`pnpm dlx` package (supply-chain — tracks upstream HEAD).
- **Inline secrets** — a credential-looking `env` value written as a literal rather than a `${VAR}` reference.
- **Prompt injection** — `[SYSTEM]` / `<<SYS>>` / "ignore previous instructions" / zero-width Unicode hidden in the spec.

Escalation: any **high** → `block`; any **medium** → `review`; otherwise `clean`. The audit is the engine's call, so it's consistent across every attach.

## Decision record format

```markdown
# MCP attach decision: <slug>
Date: <date>   Verdict: clean | review | block

## Server
- Transport: stdio | http | sse
- Launch: <command + args | url>
- For: <consuming skills>

## Security audit
- <severity / category: evidence>   (or "none")

## Rationale
<why this server is attached, and any caveats accepted>
```

## Navigation

```
▶ NEXT
  Decision recorded → .sovereign/mcp/<date>-<slug>.md
  ATTACH:        recorded in .sovereign/config.json; consuming skills now see it in
                 their init mcp.available. Sync .mcp.json (step 5) to make it live in Claude Code.
  WITH CAVEATS:  attached via --force; honor the noted limits (and /adr-log if it's a real trade-off).
  DON'T ATTACH:  nothing changed — the reason is in the decision record.

  Now build against current truth → /anchor-docs (anchor the doc) · /verify-self
  (audit unsure code) · /stack-select · /grill-with-docs all prefer an attached
  docs server over memory.
```
