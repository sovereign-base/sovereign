# CONTEXT AND GLOSSARY

**Project:** sovereign-cli
**Purpose:** SOVEREIGN — the engineering system for agents and the humans who work with them. Zero-dependency CommonJS engine.

## Sub-Domains
1. **Engine** - The core orchestration layer that runs skills and subagents.
2. **Skills** - Specific tasks or orchestrations (like sovereign-adopt, security-design) that execute standard processes.
3. **Subagents** - Reasoners that provide judgments (e.g. Council, peer-reviewer, Sentinel). Subagents return validated JSON, never prose (ADR-013).

## Domain Dictionary (Ubiquitous Language)

| Term | Definition |
|------|------------|
| Sovereign Engine | The CLI and zero-dependency CommonJS package that runs tasks and parses markdown to direct the AI. |
| Subagent | A prompt-specialized reasoner that renders a judgment via JSON Schema. |
| Skill | A deterministic procedure mapped to a specific command directory. |
| Layer 1/2 | The mechanical, deterministic scan functions of the engine (extracting info). |
| Layer 3 | The judgment layer executed by LLMs/subagents reading specific highest-signal files. |
| ADR | Architecture Decision Record, housed in `docs/adr/`. |
