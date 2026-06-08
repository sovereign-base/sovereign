# Pitfalls Research

**Domain:** Universal agent-skills engineering system (Node/TS CLI engine + Claude Code skills + subagents, npx-distributed)
**Researched:** 2026-06-08
**Confidence:** HIGH (skill-format and token-budget mechanics verified against official Claude Code docs; npx/subagent pitfalls verified against multiple sources + GSD ground truth)

> **Read this first.** v1's fatal flaw — prose `SKILL.md` files with no engine underneath — is already on record (R-002, locked) and is *not* re-litigated here. This file surfaces the *other* mistakes that kill systems like this, several of which v1 also committed (43-skill sprawl, unbounded load order, model-agnostic hand-waving) but which the engine alone does not fix. Each pitfall maps to a build phase so the roadmap can prevent it, not just regret it.

---

## Critical Pitfalls

### Pitfall 1: Skill-listing token budget overflow (the 43-skill trap)

**What goes wrong:**
Claude Code loads *every* skill's `description` (+ `when_to_use`) into context at session start so the model knows what's available. That listing has a hard budget: **1% of the model's context window** (`skillListingBudgetFraction`, default `0.01`). When the combined descriptions overflow, Claude Code **silently drops the descriptions of the skills you invoke least** — keeping only the name. A skill whose description got dropped becomes effectively undiscoverable: the model no longer has the keywords to match a user request to it. v1 shipped a *43-skill* inventory (the Skeptic flagged exactly this over-scope). At 43 skills × a generous description each, you blow the budget and silently lose discoverability on the long tail — the skills least used are dropped first, which is precisely the adoption death-spiral (rarely used → dropped → never triggered → never used).

**Why it happens:**
The budget is invisible. Nothing errors. The system "works" in the author's testing (they invoke skills directly by name, bypassing description-matching). The degradation only shows up for *other* users relying on auto-trigger, and only once the catalog grows past the threshold.

**How to avoid:**
- **Cap the surfaced catalog.** Ship M1 with the Fast-Lane 5 + `council` + `sovereign-init` — roughly 7 auto-triggerable skills, well under budget. Do NOT register all 43 v1 skills as discoverable from day one.
- **Set most phase skills to `disable-model-invocation: true`** so they cost zero listing budget and are invoked deterministically by the orchestrator/engine (e.g., the `council` skill calls phase skills; the user does not auto-trigger `/entity-design`). The docs confirm `disable-model-invocation: true` **removes the description from context entirely.**
- **Keep each `description` tight and front-load the key use case** — the combined `description`+`when_to_use` is truncated at **1,536 chars** (`maxSkillDescriptionChars`) per skill regardless of total budget.
- Use `/doctor` to detect overflow; treat overflow as a build-time failure.

**Warning signs:**
- Skill count climbing toward double digits of *auto-triggerable* skills.
- `/doctor` reports listing-budget overflow.
- Skills work when invoked by `/name` but "never trigger on their own."

**Phase to address:** Phase 1 (Engine + state) must define the *invocation model* (which skills are model-invokable vs. orchestrator-only). Every phase that adds skills re-checks the budget. This is the load-order/token-cost concern the v1 Architect raised — answer it in the skill registry design, not later.

---

### Pitfall 2: Fat SKILL.md bodies — the orchestrator-context blowup

**What goes wrong:**
When a skill is invoked, its **entire rendered body enters context as one message and stays there for the rest of the session** — Claude Code does not re-read it, and it is a *recurring* per-turn token cost. A skill that inlines its full protocol, examples, templates, and reference docs (v1's prose-heavy style) bloats every subsequent turn. Worse: after auto-compaction, only the **first 5,000 tokens** of each invoked skill are re-attached, under a shared **25,000-token budget** across all skills — so a fat skill loses its tail *and* crowds out other skills. This is the exact failure the `init <workflow>` → one-JSON-blob pattern exists to prevent: a skill that reads ten files to orient itself dumps ten files' worth of tokens into a context that never clears.

**Why it happens:**
Authors treat `SKILL.md` like documentation (explain how, narrate why, include every example) instead of like a standing instruction. v1's content design was strong *as prose* — which is exactly why it's a trap: good docs make bad skills.

**How to avoid:**
- **Enforce the load rule architecturally (SOVEREIGN.md §3):** a skill runs **one** `sovereign-tools init <workflow>` call returning paths+config as JSON, then reads only the specific files it needs. No "read MANIFEST, then SOVEREIGN.md, then STATE.md, then config.json" sequences — the engine returns all of that in one blob.
- **Progressive disclosure:** keep `SKILL.md` thin (official tip: **under 500 lines**); push protocols, examples, and reference material to supporting files (`references/`, loaded on demand) — Matt Pocock's core craft principle.
- **State what to do, not how/why.** Apply the CLAUDE.md conciseness test to every line.
- Make MANIFEST.md the single orientation doc (<500 tokens, ADR-006) so a skill never needs to read the whole `.sovereign/` tree.

**Warning signs:**
- A `SKILL.md` over ~300 lines or that pastes full templates inline.
- Skills that open with multiple sequential `Read` calls before doing work.
- Context filling fast in multi-skill sessions; behavior degrading after compaction.

**Phase to address:** Phase 1 — the engine's `init` contract and the MANIFEST format are the prevention. Phase 2+ — every skill authored against a "thin orchestrator" checklist enforced by the skill-format reference.

---

### Pitfall 3: Description fields too vague to trigger (or that over-trigger)

**What goes wrong:**
Two failure modes, both from the `description` field:
1. **Too vague / no trigger keywords** → Claude never auto-loads the skill because the description doesn't match how users actually phrase requests. (Official troubleshooting: "Check the description includes keywords users would naturally say.")
2. **Too broad / generic** → the skill triggers when it shouldn't, hijacking unrelated requests.
For a *universal* system whose skills span ideation→ops, overlapping descriptions ("review your code", "check your work") will collide and mis-trigger against each other.

**Why it happens:**
Descriptions get written as titles ("Sentinel — the quality gate") instead of trigger specs ("Use when the user finishes a construction segment and wants spec-alignment, commenting, and UNVERIFIED-marker checks before proceeding"). The `when_to_use` field is ignored.

**How to avoid:**
- **Write descriptions as trigger specifications:** what it does + *when to use it* + natural-language phrases the user would say. Put the key use case **first** (truncation at 1,536 chars).
- Use the `when_to_use` field for explicit trigger phrases / example requests.
- For overlapping skills, **disambiguate in the description** ("Use for *post-phase* review" vs. "Use for *pre-deployment* gate") or make one orchestrator-only (`disable-model-invocation`).
- Author a **skill-format reference** (already in M1 scope) that mandates the description template.

**Warning signs:**
- Descriptions that read like titles or feature names.
- Two skills with semantically similar descriptions.
- During dogfooding: the wrong skill triggers, or none does, for an obvious request.

**Phase to address:** Phase 1 (skill-format reference defines the description contract) + every phase that authors skills.

---

### Pitfall 4: Context-reset / session-continuity failure

**What goes wrong:**
Agents lose their context window (compaction, `/clear`, new session, handoff to another engineer/agent). A system that holds phase state, gate status, decisions, or "next action" only in the conversation **forgets everything** on reset. v1 named this exact problem ("Lost context — every new session starts from zero") in its own pitch but had no mechanism to survive it. The subtle failure: even *with* committed state files, if the skill doesn't deterministically *reload* state on every invocation, the agent operates on stale or hallucinated context.

**Why it happens:**
Authors assume the conversation is durable. State lives in chat, not on disk. Or state lives on disk but reloading is manual/optional, so a fresh agent doesn't know to read it.

**How to avoid (how GSD survives this — adopt the pattern):**
- **Committed state on disk, reloaded deterministically.** GSD's `state load`/`state-snapshot` returns STATE.md as structured JSON on demand; `state begin-phase`, `state update`, `state patch` write it back atomically. SOVEREIGN's `sovereign-tools state load|save` must mirror this — and **every skill must call `init`/`state load` first**, so a context-reset agent re-orients from disk, not memory.
- **Checkpoints as formal resume points.** GSD's `checkpoint:*` tasks (`human-verify`, `decision`, `human-action`) and `WAITING.json` signal (`state signal-waiting`/`signal-resume`) externalize the "stop and wait for a human" state so a resumed session knows exactly where it paused and why. SOVEREIGN's gates (`gate open|pass`) are the analog — they must be **append-only on disk**, never conversation-only.
- **Continuation format.** GSD ends every workflow with a `▶ Next Up` block telling the user *what to run next* and to `/clear` first for a fresh window. This makes context-reset a *designed* transition, not a failure. SOVEREIGN's navigation footer (already a convention) must carry the same "next action + copy-paste command" payload, pulled from STATE.md/the engine, not invented.
- **STATE.md must always contain: current phase, blockers, next action** (mirrors GSD).

**Warning signs:**
- Any skill that proceeds without first loading state from disk.
- Gate/phase status that exists only in the transcript.
- A handoff doc that's a free-text summary rather than engine-generated structured state.
- After `/clear`, the agent can't tell you what phase the project is in.

**Phase to address:** Phase 1 — this is the *core value alongside the engine*. `state load|save`, `gate open|pass`, MANIFEST/STATE format, and the navigation-footer/continuation contract are all Phase 1. Get continuity wrong here and everything layered on top inherits amnesia.

---

### Pitfall 5: Over-scoping & skill sprawl (the v1 disease, recurring)

**What goes wrong:**
v1 defined **43 skills** across 6 phases before one engine existed — the Skeptic flagged it. Sprawl kills the system three ways: (1) it overflows the listing budget (Pitfall 1); (2) overlapping skills mis-trigger (Pitfall 3); (3) it dilutes build focus so nothing ships polished. A "universal" system has unbounded surface area — there's *always* another skill to add — so without a hard scoping discipline it sprawls indefinitely and the engine (the one thing that must work) competes for attention with 40 half-built skills.

**Why it happens:**
The vision is genuinely large and the content already exists in `archive/v1/`, so it *feels* free to "just port it all." Universal scope removes the natural stopping point a single-domain tool has.

**How to avoid:**
- **Milestone discipline is already correct — hold it.** M1 = engine + Fast-Lane 5 + council + init. M2–M4 add skill families. The roadmap must *resist* pulling M2+ skills forward. PROJECT.md's "Out of Scope" section is the enforcement mechanism; treat it as load-bearing.
- **Engine-first ordering (R-002) is the antidote** — but only if the roadmap doesn't let skill count creep within M1.
- **Each new skill must justify itself against active phase + non-overlap** before it's added (this is also the extension-vetting logic — apply it to first-party skills too).
- Prefer **one configurable skill over three near-duplicates** (e.g., `council --express|--standard|--deep`, not three council skills).

**Warning signs:**
- A milestone's skill count growing during planning.
- "While we're at it, let's also add…" in phase discussions.
- Skills whose descriptions overlap (sprawl + Pitfall 3 compounding).
- Engine work slipping while skill work accelerates.

**Phase to address:** Phase 0/roadmap definition (scope the milestone) + every `/gsd:transition` (audit Out-of-Scope reasons still hold). The Council/Skeptic role itself should gate scope at milestone boundaries.

---

### Pitfall 6: Model-agnostic claims that break in practice

**What goes wrong:**
v1's SOVEREIGN.md claims compatibility with "Claude Code, Cursor, Codex CLI, Gemini CLI, GitHub Copilot, and 30+ other agents" with `min-model: sonnet-class`. In practice, the mechanics SOVEREIGN depends on are **Claude-Code-specific extensions to the open standard**: `disable-model-invocation`, `context: fork`, `agent:`, dynamic `` !`cmd` `` injection, the skill-listing budget, subagent preloading. The Agent Skills *open standard* (agentskills.io) covers `SKILL.md` + frontmatter discovery — but invocation control, forked subagents, and budgets are Claude Code features. A skill that relies on them is **not portable**, and "works best on Claude" quietly becomes "only works on Claude." Reasoning-heavy skills (Council, grill) also genuinely degrade on weaker models in ways a blanket `min-model` tag hides.

**Why it happens:**
"It's just `SKILL.md`, the format is a standard" → assume portability → build on Claude-only features → ship a compatibility claim that's never been tested on any other agent.

**How to avoid:**
- **Be honest in the north star:** "Built for Claude Code; the `SKILL.md` *format* is portable, the *engine integration* (subagents, invocation control, gates) is Claude-Code-first." v2's SOVEREIGN.md already softened this to "Works best with Claude; compatible with any `SKILL.md` agent" — keep it that precise and don't let marketing re-inflate it.
- **Isolate the Claude-specific surface in the engine**, not the skills, so a future port has one place to adapt.
- **Don't tag `min-model` you haven't tested.** If Council needs a frontier model, say so per-skill (`model:`/`effort:` frontmatter) rather than one global floor.
- Defer multi-agent compatibility claims until actually validated (it's correctly out of M1 scope).

**Warning signs:**
- Compatibility lists naming agents nobody on the team has run the system on.
- Skills using `context: fork`/`agent:` while claiming cross-agent portability.
- A single `min-model` floor applied to both utility and reasoning skills.

**Phase to address:** Phase 0/north-star wording + Phase 1 (engine isolates platform-specific calls). Multi-agent validation is a dedicated later milestone, not a claim.

---

### Pitfall 7: npx packaging & distribution foot-guns

**What goes wrong:**
`npx sovereign` is the entire install/first-impression. Common breakage:
- **Missing/incorrect shebang** on the bin entry → "permission denied" or silent failure when run via `npx`.
- **`bin` field misconfigured** in package.json (wrong path, file not executable, not included in `files`/publish) → command not found after install.
- **Stale npx cache:** `npx sovereign@x` can serve a cached copy from `~/.npm/_npx/` instead of fetching the intended version, so users run old code and report "fixed" bugs.
- **ESM/CJS mismatch:** GSD's engine is `.cjs` deliberately. A TS engine compiled to ESM with a CJS-style bin (or vice versa), or `"type": "module"` confusion, breaks the entry point on some Node versions.
- **Node version assumptions:** relying on `fetch`/top-level await/`node:` built-ins without declaring `engines`, breaking on older Node.

**Why it happens:**
The CLI works on the author's machine (where it's linked locally and the cache is warm). Distribution-only failures don't surface until a clean `npx` on someone else's machine.

**How to avoid:**
- **Shebang `#!/usr/bin/env node`** on the bin file; ensure it's executable and listed in `files`/`bin`.
- **Test from a clean state:** `npm pack` → install the tarball in a fresh dir, or `npx ./` in a throwaway directory — never trust `npm link` alone as the distribution test.
- **Pin behavior, document `@latest`,** and tell users to `npx clear-npx-cache` / use `@version` deliberately; consider a version-check on startup.
- **Decide ESM vs CJS explicitly and declare `engines.node`.** GSD ships `.cjs` for a reason — match that conservatism unless there's cause not to (ADR-002 already commits to Node/TS for npx out-of-the-box; the *build/packaging* of that TS is the risk).
- Keep the bin thin; do the work in compiled modules so the entry point itself can't break.

**Warning signs:**
- Only ever tested via `npm link`/local path.
- No `npm pack` / clean-install step in CI.
- Bug reports of "old version" behavior after a publish.

**Phase to address:** Phase 1 — packaging is part of shipping the engine. Add a clean-install smoke test to the engine's definition of done.

---

### Pitfall 8: Subagent orchestration foot-guns

**What goes wrong:**
SOVEREIGN's architecture puts heavy reasoning in subagents (Council advisors, planner, sentinel, verifier, researcher). The known failure modes:
- **Linear token blow-up:** each subagent gets its own context window; token cost scales **linearly** with subagent count. 5 parallel Council advisors + peer review + chairman = a real multiplier per `council` run. Aggressive delegation also adds latency.
- **Race conditions on shared files:** two subagents writing the same file in parallel corrupt each other. Council advisors writing transcripts, or skills writing `.sovereign/`, must not collide.
- **Prose-return parsing:** if a subagent returns free-form prose and the orchestrator parses it heuristically, downstream stages get garbage. (This is the *whole point* of the `init → JSON` discipline applied to subagent returns.)
- **Vague subagent prompts:** the single biggest cause of useless subagent output.
- **`context: fork` with no task:** a forked skill that contains only guidelines ("use these conventions") and no actionable instruction returns nothing meaningful — the official docs warn about exactly this.

**Why it happens:**
Parallel subagents feel "free" because they're isolated; the cost and coordination hazards are invisible until a Council run is expensive, slow, or produces conflicting writes.

**How to avoid:**
- **Structured returns, not prose.** Define the JSON/structured-output schema each subagent returns; the orchestrator consumes validated data. (Mirror GSD: agents return structured results the orchestrator commits — the orchestrator doesn't parse essays.)
- **No two subagents write the same file.** Council advisors return verdicts to the chairman; **only the orchestrator writes** to `.sovereign/council/`. Keep tightly coupled changes in one context.
- **Model-tier per subagent** (GSD's `resolve-model` / SOVEREIGN's `sovereign-tools model <agent>`): use Quality/Opus for reasoning agents, cheaper tiers for utility — don't run everything at max.
- **Filter scope before spawning** and give each subagent a sharp, task-shaped prompt.
- **`context: fork` only for skills with an explicit task**, never for reference-only content.

**Warning signs:**
- Council runs that are surprisingly slow/expensive.
- Multiple subagents with write access to the same path.
- Orchestrator code doing string-parsing on subagent output.
- Subagents returning thin/empty results (vague prompt or task-less fork).

**Phase to address:** Phase 1 (council `--standard` + subagent definitions + `sovereign-tools model`). Define the subagent return-schema and the "orchestrator-writes-only" rule before building Council.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Port all 43 v1 skills now | Feels like fast progress; content exists | Listing-budget overflow, mis-triggering, engine starved of focus | **Never** — port per milestone, vetted |
| Skill reads several `.sovereign/` files directly instead of `init` JSON | Slightly less engine work upfront | Recurring per-turn token cost; breaks the load rule; context blowup | **Never** for orchestrator skills |
| State held in conversation, reloaded "when needed" | Less plumbing | Context-reset amnesia; the v1 failure | **Never** |
| Inline templates/examples in SKILL.md | One file, easy to read | Fat body re-sent every turn; lost after compaction | Only tiny (<10-line) snippets |
| One global `min-model` tag | Simple compatibility story | Over-promises portability; reasoning skills degrade silently | Only if every skill genuinely tested at that floor |
| Test CLI via `npm link` only | Fast inner loop | Distribution-only breakage (shebang, bin, cache) ships to users | Inner-loop dev only; never as release gate |
| Subagents return prose | No schema work | Heuristic parsing, brittle downstream | Throwaway/experimental agents only |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code skill discovery | Assuming a skill in any folder is found | Skills must live in `~/.claude/skills/<name>/SKILL.md` (personal), `.claude/skills/<name>/SKILL.md` (project), or a plugin `skills/` dir. Directory name = command name. New top-level skills dir requires session restart |
| `npx skills` (find-skills, R-003) | Reinventing a registry | Wrap `npx skills find/add`; add vetting only. Don't build discovery/install |
| Skill listing budget | Ignoring it until skills "stop triggering" | Treat 1%/1,536-char budgets as design constraints; run `/doctor`; mark orchestrator-only skills `disable-model-invocation` |
| Plugin packaging | Expecting `--add-dir` to load subagents/commands | Only `.claude/skills/` loads from added dirs; subagents/commands/output-styles do not. Bundle as a plugin for full distribution |
| Dynamic `` !`cmd` `` injection | Assuming portability / re-scanning | Claude-Code-specific; runs once; output not re-scanned; `!` must start a line. Settings can disable it (`disableSkillShellExecution`) |
| Subagent structured output | Parsing prose returns | Hand subagents a JSON Schema; validate + retry on mismatch |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Skill-listing budget overflow | Skills "never trigger"; `/doctor` flags it | Cap auto-triggerable skills; `disable-model-invocation` on the rest | Past ~1% of context window in descriptions (≈ tens of skills) |
| Fat SKILL.md body | Context fills fast; behavior degrades after compaction | Thin body (<500 lines), progressive disclosure, `init`-JSON load rule | Multi-skill sessions; immediately after auto-compaction (5k/25k token re-attach limits) |
| Subagent token blow-up | Council runs slow/expensive | Linear cost awareness; model-tier per agent; filter scope before spawn | Every Council `--standard` (5 advisors + review + synthesis) and any fan-out |
| Reading the whole `.sovereign/` tree to orient | Slow, token-heavy skill startup | MANIFEST <500 tokens + single `init` JSON blob | Once `.sovereign/` grows (ADRs, specs, transcripts accumulate) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Importing third-party skills unvetted | Malicious skill grants itself broad `allowed-tools`; prompt-injection; data exfil | The extension protocol's OWASP-Agentic-aligned audit (read fully, check conflicts, security audit) before adopt — apply to *every* import, log the decision |
| Trusting project `.claude/skills/` from a cloned repo | A checked-in skill can pre-approve tools via `allowed-tools` on workspace trust | Review project skills before accepting the workspace-trust dialog; document this in adopt/onboarding |
| `allowed-tools` over-broad on SOVEREIGN's own skills | A skill silently gains permissions the user didn't expect | Grant the minimum tools per skill; never blanket `Bash(*)` |
| Anchor-docs storing full third-party content | Copyright exposure | ADR-004: store URLs by default, full content opt-in with explicit warning |
| `disableSkillShellExecution` not considered for `` !`cmd` `` skills | Skill silently no-ops under a managed-settings policy | Don't make core behavior depend on shell injection; degrade gracefully |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No "what next" after a skill finishes | User stuck, doesn't know the next command | Navigation footer / continuation block with copy-paste next command + `/clear` note (GSD pattern) |
| Skill asks the user to run CLI/builds it could run | Friction, feels broken | Engine/skill automates everything automatable; checkpoints only for human judgment (GSD golden rule) |
| Gate friction with no override path | User abandons the system | Gates can be acknowledged/overridden with logging (v1 "documented and acknowledged, never silently skipped") |
| Wall-of-text SKILL.md output | Cognitive overload | Recommendation-first + "Why this matters" plain-language section (existing convention) |
| Auto-triggering the wrong skill | Surprise, distrust | Precise descriptions + `disable-model-invocation` on side-effecting skills (deploy, commit, council) |

## "Looks Done But Isn't" Checklist

- [ ] **Engine `init`:** returns *one* JSON blob with all paths+config — verify a skill never needs a second orientation read.
- [ ] **State survives reset:** after `/clear`, a fresh agent calling `state load` knows the current phase, blockers, and next action — verify with an actual clear.
- [ ] **Skill discovery:** skill is in a real `.claude/skills/<name>/` (or `~/.claude/skills/`) and `What skills are available?` lists it — verify, don't assume.
- [ ] **Description triggers:** the skill auto-loads on a natural-language request (not just `/name`) — verify with a phrasing you didn't write.
- [ ] **Listing budget:** `/doctor` shows no overflow with the full M1 skill set installed.
- [ ] **Clean npx install:** `npm pack` → install tarball in a fresh dir → `npx` works (shebang, bin, ESM/CJS, Node engine all correct).
- [ ] **Subagent returns:** Council advisors return structured/validated data, not prose; only the orchestrator writes `.sovereign/council/`.
- [ ] **Gates are append-only on disk:** gate status survives a new session, not just the transcript.
- [ ] **Continuation footer:** every skill ends with next-action + `/clear` guidance pulled from state, not invented.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Listing-budget overflow | LOW | Mark low-use skills `disable-model-invocation`/`skillOverrides: name-only`; raise `skillListingBudgetFraction`; trim descriptions |
| Fat SKILL.md bodies | MEDIUM | Extract reference content to supporting files; rewrite body as standing instructions; re-test post-compaction behavior |
| State-in-conversation amnesia | HIGH | Retrofit `state load` as first call in every skill; migrate state to STATE.md/MANIFEST — costly if skills already assume in-context state |
| Skill sprawl already shipped | HIGH | Demote skills to orchestrator-only or remove; consolidate near-duplicates into one configurable skill — disruptive once users depend on `/names` |
| npx distribution broken | LOW–MEDIUM | Fix shebang/bin/engines, republish patch, document cache-clear; add clean-install CI to prevent recurrence |
| Subagent file races | MEDIUM | Refactor so only the orchestrator writes; advisors return data; add schema validation |
| Over-promised model compatibility | LOW (words) / HIGH (trust) | Correct the claim immediately; per-skill `model` tags; defer untested compatibility assertions |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Listing-budget overflow / 43-skill trap | Roadmap scoping + Phase 1 (invocation model) | `/doctor` clean with full M1 set; ≤ ~7 auto-triggerable skills in M1 |
| 2. Fat SKILL.md / context blowup | Phase 1 (`init` contract, MANIFEST) + per-skill | Skills orient in one `init` call; bodies <500 lines |
| 3. Vague/over-broad descriptions | Phase 1 (skill-format reference) + per-skill | Auto-trigger works on unseen phrasings; no description collisions |
| 4. Context-reset / continuity | Phase 1 (state, gates, continuation) | Fresh agent re-orients from disk after `/clear` |
| 5. Over-scoping / sprawl | Roadmap def + every `/gsd:transition` | Milestone skill count stable; Out-of-Scope reasons hold |
| 6. Model-agnostic over-claims | Phase 0 wording + Phase 1 (engine isolates platform calls) | Claims match what's been tested; per-skill model tags |
| 7. npx packaging | Phase 1 (engine ships) | Clean `npm pack` install smoke test in CI |
| 8. Subagent orchestration | Phase 1 (Council + subagents + `model`) | Structured returns; orchestrator-writes-only; tiered models |

## Sources

- **Claude Code Skills (official docs)** — HIGH. `https://code.claude.com/docs/en/skills`. Skill discovery locations, frontmatter reference, `description`/`when_to_use` 1,536-char cap, `skillListingBudgetFraction` (1% of context window), skill content lifecycle (stays in context, 5k/25k re-attach budgets after compaction), `disable-model-invocation`/`user-invocable`, `context: fork` warnings, troubleshooting (skill not triggering / triggers too often / descriptions cut short).
- **GSD ground truth** — HIGH. `~/.claude/get-shit-done/references/checkpoints.md` (checkpoint types, automation golden rule), `continuation-format.md` (`▶ Next Up` / `/clear`), `planning-config.md` (committed state config), `bin/gsd-tools.cjs` (`state load/save/begin-phase/patch`, `signal-waiting/resume`, `resolve-model`, `commit` — the `init → JSON` + structured-state patterns).
- **find-skills SKILL.md** — HIGH. `~/.claude/skills/find-skills/SKILL.md`. Confirms `npx skills` is the registry to wrap (R-003); description-as-trigger example.
- **Matt Pocock — skills** — MEDIUM. `https://github.com/mattpocock/skills`. Thin SKILL.md, progressive disclosure, recommendation-first, codebase-aware, misalignment anti-pattern.
- **v1 reference + Council critique** — HIGH (primary source). `archive/v1/SOVEREIGN_PROJECT.md` (43-skill inventory, the over-claimed compatibility list, "lost context" problem stated without a fix) and `SOVEREIGN.md` (Architect's load-order/token-cost demand, Skeptic's over-scope flag).
- **npx/CLI distribution** — MEDIUM. WebSearch (npm docs, codestudy.net, DEV) on shebang, `bin` misconfig, `~/.npm/_npx/` stale cache, ESM/CJS, `engines`.
- **Subagent orchestration** — MEDIUM. WebSearch (Tembo, claudefa.st, Anthropic blog, CloudZero) on linear token cost, file race conditions, structured-output schemas, vague-prompt failures; cross-checked with official `context: fork` warning.

---
*Pitfalls research for: universal agent-skills engineering system (Node/TS CLI + Claude Code skills + subagents, npx)*
*Researched: 2026-06-08*
