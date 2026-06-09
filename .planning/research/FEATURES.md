# Feature Research

**Domain:** Agent-skills engineering system (Claude Code) — gated-phase methodology delivered as a CLI engine + thin orchestrator skills + subagents
**Researched:** 2026-06-08
**Confidence:** HIGH (all four comparison systems read directly: GSD locally, gstack + Matt Pocock via GitHub, find-skills locally; v1 SKILL.md content read in full)

---

## How To Read This Document

Categories are grounded in direct comparison to the real systems, not generic SaaS framing:

- **Table stakes** = present in GSD/gstack/Pocock such that *omitting it makes SOVEREIGN not credible* as a peer system.
- **Differentiators** = what makes SOVEREIGN distinct from those three (the reason to build it at all).
- **Anti-features** = things the comparison systems either avoid, or that SOVEREIGN explicitly decided against (R-001/R-003, ADRs).

Every row is flagged **M1** (Foundation milestone — must ship) or **Defer** (M2+). The headline question — *which Fast Lane skills + Council capabilities are genuinely M1-critical vs deferrable* — is answered in its own section after the landscape.

### What the comparison systems actually are (verified)

| System | Shape | Scale | The pattern SOVEREIGN borrows |
|--------|-------|-------|-------------------------------|
| **GSD** (`~/.claude/get-shit-done`) | 50+ workflows + 18 specialized `gsd-*` subagents + `gsd-tools.cjs` engine + `.planning/` committed state | Mature, deep | Engine (`init <workflow>`→JSON), thin orchestrator/subagent split, committed state, model profiles, decimal phases, autonomous mode, research synthesizers |
| **gstack** (garrytan/gstack) | 23 role-based skills (CEO→designer→engineer→QA→CSO→release) | Mature, role-chained | Role-based review *chains* that pass output downstream, atomic commit per fix, verification that runs the real product, GBrain persistent memory |
| **Matt Pocock skills** (mattpocock/skills) | ~20 thin `SKILL.md` skills, no engine | Craft-focused | Skill craft: thin SKILL.md, progressive disclosure, recommendation-first, one-question-at-a-time, codebase-aware. Direct ancestors of `grill-with-docs`, `tdd`, `handoff`, `diagnose`, `to-issues`, `to-prd` |
| **find-skills** (`npx skills`) | One discovery skill wrapping a CLI package manager | Single-purpose | Extension discovery/install — SOVEREIGN wraps + vets, does not reinvent (R-003) |

The strategic gap SOVEREIGN fills: **GSD has the engine but no engineering-domain opinion; Pocock has the skill craft but no engine; gstack has roles but is web/product-centric and engine-light. None of them gate phases, run a Council, or treat agent hallucination as a first-class concern with persistent verification markers.**

---

## Feature Landscape

### Table Stakes (Or It's Not Credible)

Missing any of these makes SOVEREIGN look like v1 again — prose with nothing underneath — or like a toy next to GSD/gstack.

| Feature | Why Expected (grounded) | Complexity | M1? | Notes |
|---------|-------------------------|------------|-----|-------|
| **Deterministic engine: `init <workflow>` → one JSON blob** | GSD's `gsd-tools.cjs` is the entire reason its skills stay token-cheap. v1 had none and failed. This *is* Core Value. | HIGH | **M1** | The one thing that must work. Everything else layers on it. |
| **Committed state dir (`.sovereign/`)** | GSD's `.planning/`, gstack's GBrain. A system with no persistent memory is not credible. | MEDIUM | **M1** | ADR-003. Includes MANIFEST/CONTEXT/STATE/SOVEREIGN/config.json/docs tree. |
| **MANIFEST-first load rule (<500 tokens)** | GSD's orientation pattern; ADR-006. Cold-start orientation in one cheap read. | LOW | **M1** | Depends on engine + state. Pure convention enforced by engine. |
| **Thin orchestrator / subagent split** | GSD's defining architecture (18 subagents). Heavy reasoning in isolated context keeps orchestrator cheap. | MEDIUM | **M1** | Council advisors + sentinel reviewer are the M1 subagents. |
| **Bootstrap/install (`npx sovereign init`, `--quick`/`--full`)** | Every system has a one-command install. find-skills = `npx skills`, GSD = `/gsd:new-project`. | MEDIUM | **M1** | `sovereign-init` skill + engine bootstrap. |
| **State save/load + git commit awareness** | gstack atomic commits, GSD `commit_docs`. State that isn't committed atomically rots. | MEDIUM | **M1** | Engine: `state load/save`, `commit --files`, gitignore checks. ADR-007. |
| **Session handoff / context survival** | Pocock `handoff`, gstack GBrain, GSD STATE.md. Context-reset survival is the baseline promise. | LOW | **M1** | Fast Lane `handoff`. Thin — reads context, doesn't generate. |
| **TDD / test discipline skill** | Pocock `tdd`, gstack `/qa`. A "build it properly" system without test discipline is not credible. | MEDIUM | **M1** | Fast Lane `tdd` (red-green-refactor). |
| **Post-change quality review** | gstack `/review`+`/qa`, GSD verifier/integration-checker. Something must check work after it's written. | MEDIUM | **M1** | Fast Lane `sentinel` native tier. |
| **Plan interrogation before building** | Pocock `grill-with-docs`/`grill-me`, GSD `discuss-phase`. Challenging the plan first is table stakes for this category. | MEDIUM | **M1** | Fast Lane `grill-with-docs`. |
| **Recommendation-first + navigation footer + "Why this matters"** | Pocock's signature craft conventions. Without them skills feel generic. | LOW | **M1** | Enforced as a cross-skill standard, not a feature. |
| **Model-profile resolution per agent** | GSD model profiles. Council on Opus, utilities on cheaper models. | LOW | **M1** | Engine: `model <agent>`. config.json toggle. |
| **Per-skill docs + format standards (SKILL/ADR/commenting)** | Pocock `write-a-skill`, GSD references/. A system others extend needs authoring standards. | LOW–MED | **M1** | One page per skill + SKILL_FORMAT/ADR_FORMAT/COMMENTING. |
| **Decimal/insertable phase model** | GSD decimal phases. Methodology systems need to slot work between phases. | MEDIUM | Defer | Concept defined in SOVEREIGN.md constitution; full machinery is M2+. |
| **Existing-project adoption** | gstack `/setup-gbrain`, GSD `map-codebase`. Greenfield-only adoption limits reach. | HIGH | Defer | `sovereign-adopt` is explicitly M3. |
| **Extension/discovery protocol** | find-skills `npx skills`. Closed systems don't survive. | MEDIUM | Defer | M3; wraps `npx skills` + vetting (R-003). |

### Differentiators (What Makes SOVEREIGN Distinct vs GSD / gstack / Pocock)

These are the reasons to build SOVEREIGN rather than just using GSD + Pocock skills.

| Feature | Value Proposition | Complexity | M1? | Notes |
|---------|-------------------|------------|-----|-------|
| **The Council (5 advisors + anonymous peer review + chairman verdict)** | *No comparison system has this.* gstack has cross-model `/codex` review; GSD has `discuss-phase` advisors. Neither does anonymized adversarial peer review with a binding PASS/CONDITIONAL/BLOCKED verdict logged to a gate. This is SOVEREIGN's signature. | HIGH | **M1 (`--standard`)** | Strongest differentiator. M1 ships `--standard`; `--express`/`--deep` flagged below. |
| **Gated phases with un-fakeable gates** | GSD has phases but they advance on completion; gstack has a sprint *flow* but no hard gate. SOVEREIGN's "gates cannot be silently skipped, only documented and acknowledged" is a distinct discipline stance. | MEDIUM | Partial M1 | Engine `gate open/pass` (append-only) is M1; full 6-phase gate content is M2+. |
| **Anti-hallucination protocol (`SOVEREIGN:UNVERIFIED` markers, anchor-docs, verify-self)** | *Unique.* No comparison system treats agent uncertainty as a first-class, persisted, gate-blocking concern. gstack verifies via real browser (runtime); SOVEREIGN verifies *epistemics* (did the agent actually know this?). | MED–HIGH | Partial M1 | UNVERIFIED-marker *scan* ships in sentinel M1. `anchor-docs`/`verify-self` skills are Defer (M2+). The marker convention itself is M1-cheap. |
| **Ubiquitous-language / glossary as living document** | Pocock's `grill-with-docs` touches CONTEXT.md, but SOVEREIGN makes a dedicated DDD glossary skill with bounded-context detection. Distinct from GSD/gstack which have no domain-language discipline. | MEDIUM | **M1** | Fast Lane `ubiquitous-language`. Feeds Council + grill context injection. |
| **Project-context injection into reasoning agents** | Council/grill advisors are framed with MANIFEST + CONTEXT + relevant ADRs so advice is project-specific, not generic. gstack's GBrain is memory; this is *active injection at reasoning time*. | MEDIUM | **M1** | Depends on state model + engine `init`. The thing that makes Council better than "ask 5 times." |
| **Universal / stack-agnostic, enterprise-by-default stance** | gstack is web/Chromium/iOS-centric; Pocock skews TS. SOVEREIGN takes no stack opinion and assumes "this matters" from day one. | LOW (stance) | **M1** | A positioning constraint enforced across skills, not a buildable unit. |
| **Two-tier Sentinel (native always + CodeRabbit opt-in)** | "Always works, better with tools" graceful-degradation design. gstack's `/qa` hard-requires a browser; Sentinel native runs with nothing. | MEDIUM | M1 (native) | Tier 2 (CodeRabbit/bug/security/perf) is Defer. |
| **Bridge (cross-project handoff + staleness detection)** | Distinct from session `handoff`. Multi-layer projects (backend/frontend/mobile) each a SOVEREIGN project, connected with staleness that blocks pre-flight (ADR-008). gstack/GSD are single-project. | HIGH | Defer (M3) | Differentiator but explicitly out of M1 scope. |
| **Role-based review *chain* (passing output downstream)** | Borrowed from gstack — but SOVEREIGN's version is the Council→grill→spec→sentinel chain. | MEDIUM | Partial M1 | M1 has the pieces; full chained handoff between phase skills is M2+. |

### Anti-Features (Deliberately NOT Build)

Grounded in explicit decisions (R-001/R-003, ADRs) and in failure modes observed in the comparison systems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Own skill registry / marketplace** | "We need extension discovery." | find-skills already solved it (`npx skills`, skills.sh). Rebuilding a registry is a multi-quarter distraction. R-003 locked against it. | Wrap `npx skills find/add`, add a vetting/audit layer only. |
| **Forking or chaining to GSD's engine/code** | "GSD already works, just build on it." | Chains SOVEREIGN to GSD's roadmap + governance; muddies identity; R-001 locked Option C. | Lift GSD's *patterns* (init→JSON, orchestrator/subagent split), write own `sovereign-tools`. |
| **Building on v1's prose skills** | "The content is already written." | v1 had no engine — building on it repeats the exact failure. PROJECT.md: "mine for content, do not build on it." | Treat `archive/v1/` as content reference; rebuild on the engine. |
| **Real-browser / runtime QA (gstack `/qa`, `/canary`, `/ios-qa`)** | gstack proves bugs by actually browsing. | Stack-specific (Chromium/iOS), heavy infra, breaks the universal/stack-agnostic stance. Wrong layer for SOVEREIGN. | Sentinel checks *artifacts + epistemics* (spec alignment, UNVERIFIED, ADR consistency); runtime testing left to the project's own stack via `tdd`. |
| **Monetization / paid tiers** | "Sustainability." | ADR-001: open-source MIT, community before revenue. | Open source; quality is the moat. |
| **Multi-model Council (`--deep` with Gemini/GPT/Grok)** | "Genuine perspective diversity, not simulated." | Requires provider config/keys, multiplies cost + failure modes, low payoff before the single-model Council is even validated. | Ship single-model `--standard` first; `--deep` is M4+. |
| **Auto-skipping gates / fully autonomous gate-passing** | GSD has autonomous mode; "just let it run." | Defeats the entire un-fakeable-gates value proposition. Autonomy that bypasses Council/gates is anti-thetical to SOVEREIGN. | Gates can be *acknowledged* (logged with reason), never silently skipped. |
| **43-skill big-bang (the full v1 inventory at once)** | "Ship the whole vision." | This is exactly how v1 over-scoped into prose-with-no-engine. | Milestone-gated: M1 = engine + Fast Lane 5 + Council `--standard`. Phases 2–6 skills come later. |
| **Heavy GUI / dashboard / web app** | "Visualize project state." | Adds a frontend stack to a stack-agnostic CLI system; git + markdown is the interface (ADR-007). | MANIFEST.md + STATE.md as the human-readable surface; git is the collaboration layer. |
| **Storing full third-party doc content by default** | "Cache the docs for the agent." | Copyright risk. ADR-004 stores URLs by default. | `external-docs/` stores URLs + versions; full content opt-in with explicit warning. |

---

## The M1 Decision: Fast Lane Skills + Council Capabilities

This is the headline question. Below, each M1-named capability is judged **genuinely M1-critical** vs **could-defer-but-scoped-in**.

### Fast Lane 5 — verdict per skill

| Skill | M1-critical? | Reasoning |
|-------|-------------|-----------|
| **`grill-with-docs`** | **Critical** | The first *proof the engine works* end-to-end (loads MANIFEST+CONTEXT, updates CONTEXT/ADRs via engine). It's the thinnest meaningful orchestrator — ideal first skill. Has a direct Pocock ancestor to port. Depends on: engine, state, `ubiquitous-language` (consumes CONTEXT.md). |
| **`ubiquitous-language`** | **Critical** | Produces CONTEXT.md, which `grill-with-docs` *and* Council context-injection both consume. It is a dependency of the other M1 differentiators, so it must land early. Lowest complexity of the five. |
| **`tdd`** | **Critical (credibility), but lowest coupling** | Table stakes — a "build properly" system without test discipline isn't credible. But it's the *most standalone* (no dependency on Council/CONTEXT). Could ship last within M1 without blocking anything. Port from Pocock. |
| **`sentinel` (native tier)** | **Critical** | Carries two M1 differentiators: the `SOVEREIGN:UNVERIFIED` marker scan (anti-hallucination beachhead) and spec/ADR-consistency. Without it, nothing reviews written work. Native-only for M1; CodeRabbit Tier 2 deferred. Depends on: state, marker convention, ADR format. |
| **`handoff`** | **Critical (cheap)** | Context-reset survival is the baseline category promise and it's near-zero cost (reads context, writes one doc). High value-to-effort. Mostly a port of Pocock/v1. Depends on: state, MANIFEST. |

**Conclusion:** all five are genuinely M1. They were chosen as a coherent minimal set, not padding. **Recommended build order within M1:** `ubiquitous-language` → `grill-with-docs` → `handoff` → `sentinel` → `tdd` (dependency-respecting; the standalone `tdd` last). `grill-with-docs` is the best *first* skill to prove the engine.

### Council capabilities — what's M1 vs deferrable

| Capability | M1? | Reasoning |
|-----------|-----|-----------|
| **`--standard` mode** (5 advisors + anonymous peer review + chairman verdict) | **M1 — critical** | This is SOVEREIGN's signature differentiator. M1 without it is "GSD with extra steps." The anonymous peer-review round is the non-negotiable core (it's what makes it more than "ask 5 times"). |
| **Project-context injection** (MANIFEST+CONTEXT+ADRs into advisor framing) | **M1 — critical** | Without it, Council gives generic advice. It's the integration that justifies Council living *inside* SOVEREIGN. Depends on state model + `ubiquitous-language` output. |
| **Verdict + gate logging** (PASS/CONDITIONAL/BLOCKED → `.sovereign/council/` + gate) | **M1 — critical** | The output that makes Council binding rather than advisory. Depends on engine `gate` + commit. |
| **5 advisor subagent definitions** (Skeptic/Architect/Builder/Outsider/Risk Officer) | **M1 — critical** | Required for the orchestrator/subagent split; running 5 lenses in one context is the v1 anti-pattern. Parallel subagent dispatch is the architecture. |
| **`--express` mode** (single synthesized voice, no peer review) | **Defer — but cheap to add** | Useful for low-stakes checks, but it skips peer review (the core value). Not needed to prove the thesis. Add in M2 once `--standard` is validated. |
| **`--deep` mode** (follow-up Qs, two-round rebuttal, minority-position handling) | **Defer (M4+)** | High cost, marginal value before `--standard` exists. Explicitly out of scope. |
| **Multi-model `--deep`** (different model per advisor) | **Defer (M4+)** | Requires provider config; anti-feature for M1 (see table). |
| **Adopt-mode Council** (gap-analysis framing) | **Defer (M3)** | Depends on `sovereign-adopt`, which is M3. |
| **Proactive Council suggestion** (interject before irreversible Phase-3 decisions) | **Defer (M2)** | Depends on Phase-3 architecture skills existing. |

**Conclusion:** M1 Council = `--standard` only, fully wired (5 subagents + peer review + context injection + verdict/gate logging). Every mode flag (`--express`, `--deep`, multi-model) defers. This matches PROJECT.md exactly and is the right call: ship the differentiating *core* of the differentiator, not its variants.

---

## Feature Dependencies

```
ENGINE (sovereign-tools: init→JSON, state, gate, commit, model)
   └──enables──> .sovereign/ STATE MODEL (MANIFEST/CONTEXT/STATE/SOVEREIGN/config)
                     ├──enables──> MANIFEST-first load rule
                     ├──enables──> sovereign-init (bootstrap)
                     └──enables──> ALL skills

ubiquitous-language ──produces──> CONTEXT.md
   ├──required by──> grill-with-docs (consumes glossary, flags terminology)
   └──required by──> Council context-injection (grounds advisors)

Council (--standard)
   ├──requires──> 5 advisor subagents (orchestrator/subagent split)
   ├──requires──> context injection  (state model + CONTEXT.md)
   ├──requires──> gate open/pass + commit (engine) for binding verdict
   └──enhances──> grill-with-docs (Council before, grill after)

sentinel (native)
   ├──requires──> SOVEREIGN:UNVERIFIED marker convention
   ├──requires──> ADR format + spec format (consistency checks)
   └──beachhead-for──> anti-hallucination protocol (anchor-docs/verify-self, M2+)

handoff ──requires──> state model + MANIFEST   (lowest coupling, cheap)
tdd ──standalone──   (credibility table-stake; no M1 dependents)

DEFERRED CHAINS:
  sovereign-adopt (M3) ──enables──> adopt-mode Council
  Phase-3 skills (M2)  ──enables──> proactive Council suggestion
  bridge (M3) ──requires──> staleness detection ──blocks──> pre-flight (M2+)
  npx skills (find-skills) ──wrapped+vetted-by──> extension protocol (M3)
```

### Dependency Notes

- **Engine is the universal root.** Nothing ships before `init→JSON` + state save/load work. v1's failure was building skills with this missing (R-002).
- **`ubiquitous-language` is an internal M1 bottleneck.** Two other M1 features (`grill-with-docs`, Council injection) consume CONTEXT.md. Build it first among the skills.
- **`tdd` is the only M1 skill with no dependents** — it can be built last/in-parallel without blocking anyone.
- **Sentinel is the anti-hallucination beachhead.** The marker *scan* ships in M1; the marker *generation* skills (`verify-self`, `anchor-docs`) are M2+. Defining the `SOVEREIGN:UNVERIFIED` convention in M1 is cheap and unblocks the later skills.
- **Council's binding-ness depends on the engine's gate + commit** — context injection makes it smart, but `gate open/pass` makes it *count*.

---

## MVP Definition

### Launch With (M1 — Foundation)

- [ ] **`sovereign-tools` engine** (`init`, `state`, `gate`, `commit`, `model`) — Core Value; everything depends on it
- [ ] **`.sovereign/` state model** (MANIFEST/CONTEXT/STATE/SOVEREIGN/config + docs tree) — engineering memory
- [ ] **`sovereign-init`** (`--quick`/`--full`) — the install/bootstrap entry point
- [ ] **`ubiquitous-language`** — produces CONTEXT.md (dependency of grill + Council)
- [ ] **`grill-with-docs`** — best first skill to prove the engine end-to-end
- [ ] **`handoff`** — context-survival baseline, cheap
- [ ] **`sentinel` (native)** — quality gate + UNVERIFIED scan (anti-hallucination beachhead)
- [ ] **`tdd`** — test-discipline credibility
- [ ] **Council `--standard`** — the signature differentiator, fully wired
- [ ] **5 advisor subagent defs + cross-skill conventions + per-skill docs + format standards**

### Add After Validation (M2 — Architecture phase)

- [ ] Council `--express` (cheap add once `--standard` proven) — trigger: users want low-stakes checks
- [ ] Anti-hallucination skills `anchor-docs` + `verify-self` — trigger: sentinel marker scan proves the convention works
- [ ] Phase-2/3 skills (`write-spec`, `entity-design`, `api-design`, `stack-select`, `adr-log`, etc.)
- [ ] Sentinel Tier 2 (CodeRabbit opt-in)
- [ ] Proactive Council suggestion — trigger: Phase-3 skills exist
- [ ] Full decimal-phase gate machinery

### Future Consideration (M3 / M4+)

- [ ] `sovereign-adopt` (3-layer archaeology) + adopt-mode Council — M3
- [ ] `bridge` + staleness detection — M3
- [ ] Extension protocol over `npx skills` + vetting/audit — M3
- [ ] Council `--deep` + multi-model — M4+
- [ ] Phase-6 operations skills, microservices overlay, IoT/embedded tracks — M4+

---

## Feature Prioritization Matrix (M1 scope)

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `sovereign-tools` engine | HIGH | HIGH | P1 |
| `.sovereign/` state model | HIGH | MEDIUM | P1 |
| Council `--standard` | HIGH | HIGH | P1 |
| `ubiquitous-language` | HIGH | LOW | P1 |
| `grill-with-docs` | HIGH | MEDIUM | P1 |
| `sentinel` (native) | HIGH | MEDIUM | P1 |
| `sovereign-init` | HIGH | MEDIUM | P1 |
| `handoff` | MEDIUM | LOW | P1 |
| `tdd` | MEDIUM | MEDIUM | P1 |
| Cross-skill conventions + docs/standards | MEDIUM | LOW | P1 |
| Council `--express` | LOW | LOW | P2 |
| `anchor-docs` / `verify-self` | MEDIUM | MEDIUM | P2 |
| Council `--deep` / multi-model | LOW | HIGH | P3 |
| `sovereign-adopt` / `bridge` / extensions | MEDIUM | HIGH | P3 |

**Priority key:** P1 = must have for M1 launch · P2 = M2, add when core proven · P3 = M3/M4+, deferred.

---

## Competitor Feature Analysis

| Feature | GSD | gstack | Matt Pocock | SOVEREIGN's Approach |
|---------|-----|--------|-------------|----------------------|
| Deterministic engine (init→JSON) | Yes (`gsd-tools.cjs`) | Light | None | Own `sovereign-tools` (lift pattern, not code) |
| Orchestrator/subagent split | Yes (18 agents) | Yes (23 roles) | No (flat skills) | Yes — Council advisors + sentinel reviewer |
| Committed project memory | `.planning/` | GBrain | No | `.sovereign/` committed (ADR-003) |
| Adversarial multi-advisor review | `discuss-phase` (not anonymized) | `/codex` cross-model | No | **Council: anonymous peer review + chairman verdict (unique)** |
| Gated phases (un-fakeable) | Phases (completion-based) | Sprint flow | No | **Hard gates, acknowledge-not-skip (distinct)** |
| Anti-hallucination / verification | No | Runtime browser QA | No | **Epistemic: UNVERIFIED markers + anchor/verify (unique)** |
| Domain/ubiquitous language | No | No | `grill-with-docs` touches CONTEXT | **Dedicated skill + bounded-context detection** |
| Quality review after build | verifier agents | `/review`+`/qa` | No | Two-tier Sentinel (native + opt-in) |
| TDD / test discipline | `add-tests` | `/qa` | `tdd` | Fast Lane `tdd` (port) |
| Session handoff | STATE.md | GBrain | `handoff` | Fast Lane `handoff` (port) |
| Extension discovery | No | No | No | Wrap `npx skills` + vet (R-003, M3) |
| Cross-project bridge | No | No | No | **`bridge` + staleness (unique, M3)** |
| Stack/domain agnostic | Yes | No (web/iOS) | TS-leaning | **Yes — explicit universal stance** |
| Monetization | OSS | OSS | OSS | OSS MIT (ADR-001) |

---

## Sources

- **GSD** — read locally: `~/.claude/get-shit-done/workflows/` (50+ workflows incl. `fast.md`, `new-project.md`, `discuss-phase.md`, `autonomous.md`), `~/.claude/agents/gsd-*.md` (18 subagents incl. `gsd-advisor-researcher.md`), `~/.claude/get-shit-done/bin/gsd-tools.cjs`, FEATURES research template. Confidence: HIGH.
- **gstack** — `github.com/garrytan/gstack` (23 role-based skills, Think→Plan→Build→Review→Test→Ship→Reflect chain, atomic-commit-per-fix, real-browser `/qa`, GBrain). Confidence: HIGH (official repo).
- **Matt Pocock skills** — `github.com/mattpocock/skills` (`grill-with-docs`, `grill-me`, `tdd`, `handoff`, `diagnose`, `to-issues`, `to-prd`, `write-a-skill`; craft conventions). Confidence: HIGH (official repo).
- **find-skills** — read locally: `~/.claude/skills/find-skills/SKILL.md` (`npx skills find/add/check/update`, skills.sh). Confidence: HIGH.
- **v1 content reference** — read in full: `archive/v1/skills/council/SKILL.md`, `archive/v1/skills/fast-lane/{grill-with-docs,handoff,ubiquitous-language}/SKILL.md`, `archive/v1/SOVEREIGN_PROJECT.md` (43-skill inventory, Council design). Confidence: HIGH.
- **Project intent** — `.planning/PROJECT.md`, `/SOVEREIGN.md` (north star, milestones, ADRs, R-001..R-004). Confidence: HIGH.

---
*Feature research for: agent-skills engineering system (SOVEREIGN v2)*
*Researched: 2026-06-08*
