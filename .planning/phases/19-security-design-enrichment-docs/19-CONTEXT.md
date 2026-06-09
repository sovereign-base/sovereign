# Phase 19: `security-design` controls enrichment + docs - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Hand-authored from locked M5 scope (ROADMAP Phase 19 success criteria + REQUIREMENTS SEC-01 + DOCS-01 + M5-CC). The M5 finale — enriches an existing skill + adds a reference + a docs touch (no new skill). Established dogfooding loop.

<domain>
## Phase Boundary

**Three small deliverables that close M5:**
1. **`engine/references/security-controls.md`** (NEW) — an agnostic reference enumerating security **control classes** + what-to-verify per class (input validation, injection, authn/authz/IDOR, secrets, rate-limiting/abuse), as *classes* not framework APIs.
2. **Enrich `engine/skills/security-design/SKILL.md`** — add a step that consults `security-controls.md` and offers the control-coverage checklist, surfacing uncovered classes on re-run. Keep it a thin orchestrator (the reference holds the depth; the skill points to it).
3. **DOCS-01** — document per-agent skill-invocation differences (Claude `/`-autocomplete vs other agents read `SKILL.md` / invoke by name) in the **README** and the **`npx sovereign-cli init` output** (the `sovereign.cjs` launcher's human-readable next-steps).

In scope only the above. **M5-CC final check:** `doctor` still 20 skills / auto 5 (NO new skill — enrichment only); `validate skills` passes for the changed `security-design`; engine suite stays 164 green; launcher UX tests stay green.

Explicitly OUT of scope (deferred):
- A separate `security-review` skill (audit existing code) — M6+ (REQUIREMENTS Deferred).
- Framework-specific control logic — everything stays at the *class* level (agnostic).
- Any engine (`sovereign-tools`) change — the reference ships via the existing `files: [references]` allowlist; the only code touched is the `sovereign.cjs` *launcher* human-output string (not the engine contract).
- A pre-flight gate that blocks on uncovered controls (post-M5).
</domain>

<decisions>
## Implementation Decisions

### Locked by success criteria (NON-NEGOTIABLE)
- **`security-controls.md` enumerates control CLASSES (SEC-01), agnostic:**
  - **Input validation** — validate/normalize all untrusted input at the boundary (type, range, length, encoding, allow-list); what-to-verify.
  - **Injection** — SQL/NoSQL, XSS, command/shell, SSRF, template, deserialization; parameterize/escape/sandbox by context; what-to-verify.
  - **AuthN / AuthZ / IDOR** — authenticate, then authorize every access on the server against the actual resource owner (no client-trusted ids); what-to-verify.
  - **Secrets handling** — never in code/logs/VCS; injected at runtime, rotated, least-privilege; what-to-verify.
  - **Rate-limiting / abuse** — throttle expensive + auth + write paths; backpressure; what-to-verify.
  - Each class = a short "what it is / why it bites / what to verify" block. NOT framework APIs (no `helmet`/`express-validator`/etc.).
- **The skill consults + offers the checklist (SEC-01):** `security-design` gains a step that reads `security-controls.md` (via the path the `init` blob/references surface), runs the control-coverage checklist against the current design, and **surfaces uncovered classes on re-run** — recommendation-first, not a dump. The layered model it already produces (`SECURITY_MODEL.md`) stays; controls coverage is the concrete complement.
- **DOCS-01 — two touch points:**
  - **README:** the existing "you invoke them by typing `/skill-name`" line (and the how-it-works section) gains a note that this is Claude Code's affordance; other SKILL.md agents (Gemini CLI, etc.) have no `/`-menu — you read/point them at the `SKILL.md` and invoke by name. Keep it brief + accurate.
  - **Installer output:** the `sovereign.cjs` `renderHuman` next-steps gains one line on per-agent invocation (so non-Claude users aren't stranded). Must NOT break the launcher UX tests (they assert substrings like "Next steps"/"/council" — additive line is safe).
- **M5-CC:** `security-design` keeps real frontmatter + `disable-model-invocation: true` (already set), the thin-orchestrator shape, and `wc -l` ≥ 70 (currently exactly 70 — enrichment will add lines, fine); `validate skills` passes; doctor auto stays 5 (no new skill).

### Claude's Discretion (judgment — confirm in research)
- **How the skill references `security-controls.md`:** by its shipped package-relative path `references/security-controls.md` (the installed layout), mirroring how `verify-self` surfaces `references/unverified-marker.md`. Confirm whether the `init` default blob can surface it or the skill just names the path literally (likely the latter — keep it simple).
- **Reference depth:** tight — a class per short section, what-to-verify bullets; this is a checklist substrate, not a textbook. Mirror the size/tone of `engine/references/unverified-marker.md` / `commenting.md`.
- **Exact README insertion points:** the `/skill-name` line (~line 24) + the how-it-works "user-invoked (you type `/name`)" line (~155). Add a short parenthetical/footnote, don't rewrite the walkthrough.
- **Installer line wording:** one concise line in `renderHuman` next-steps, e.g. "In Claude Code, type `/skill-name`; in other agents, open the skill's `SKILL.md` and follow it."

### Boundaries
- `security-controls.md` is a **reference** (consulted by the skill), parallel to `unverified-marker.md`/`skill-format.md` — NOT a skill, NOT engine logic.
- `security-design` enrichment must not turn it into a framework-specific checklist; keep classes agnostic. The skill still produces `SECURITY_MODEL.md`; controls coverage augments it.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before authoring.**

### The artifacts to change / mirror (shipped)
- `engine/skills/security-design/SKILL.md` (70 lines) — the skill to enrich. Read it fully; add the controls-coverage step + a reference pointer + footer mention WITHOUT bloating or breaking its shape.
- `engine/references/unverified-marker.md` + `engine/references/commenting.md` — the reference format/size/tone to mirror for `security-controls.md` (markdown, sectioned, tight, agnostic).
- `engine/references/skill-format.md` — the skill authoring contract (sections, frontmatter, line gate, recommendation-first, footer) the enriched `security-design` must still satisfy.
- `engine/bin/sovereign.cjs` `renderHuman()` (~line 69-130) — the installer human-output where the per-agent invocation line goes; `engine/test/install.test.cjs` launcher UX tests (assert substrings — keep green).
- `README.md` lines ~24 + ~155 — the skill-invocation mentions to annotate.

### Spec / requirement sources
- `.planning/ROADMAP.md` → Phase 19 Success Criteria (the 3 TRUE-conditions = verification target).
- `.planning/REQUIREMENTS.md` → **SEC-01** + **DOCS-01** + **M5-CC** + M5 non-goals (no framework-specific logic; class-level only).
- `CLAUDE.md` → skill frontmatter spec; model-agnostic body guidance; `files: [references]` ships the new reference.

### Verification tooling (phase gates) — RUN FROM `engine/`
- `cd engine && node bin/sovereign-tools.cjs validate skills skills/security-design/SKILL.md` → passes.
- `cd engine && node bin/sovereign-tools.cjs doctor` → auto_count stays **5**, total stays **20** (no new skill).
- `cd engine && node --test "test/**/*.test.cjs"` → still 164 green (incl. launcher UX tests after the `renderHuman` edit).
- (CRITICAL caveat: run from `engine/`; assert doctor's auto_count value, not exit code.)
</canonical_refs>

<specifics>
## Specific Ideas

- Keep the split clean: `security-controls.md` holds the agnostic control-class depth; `security-design` stays a thin orchestrator that *consults + offers* it (the same way `verify-self` points at `unverified-marker.md`). Don't inline the whole checklist into the skill body.
- DOCS-01 is a *small, accurate* note in two places — resist rewriting the README walkthrough or the installer flow; just close the "how do I run this in Gemini?" gap.
- Everything stays agnostic: control *classes* + what-to-verify, never a library name.
</specifics>

<deferred>
## Deferred Ideas

- `security-review` skill (audit existing code against `security-controls.md`) — M6+.
- A pre-flight gate blocking on uncovered control classes / a controls-coverage score in the engine (post-M5).
- Framework-specific control packs (would live in a future stack track, ADR-014).
</deferred>

---

*Phase: 19-security-design-enrichment-docs*
*Context gathered: 2026-06-09 (hand-authored from locked M5 scope — M5 finale)*
