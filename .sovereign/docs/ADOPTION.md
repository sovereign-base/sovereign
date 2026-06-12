# Adoption Report — sovereign-cli
Type: mid-flight (Type-2)
Detected: Node.js · npm · tests:y · ci:n

## Decisions reverse-engineered (→ retroactive ADRs)
- Stack: Node.js (>= 20), zero-dependency CommonJS engine (documented in existing docs/adr/ADR-002-zero-dep-cjs-engine.md)
- Subagent Communication: Validated JSON schemas over prose (documented in existing docs/adr/ADR-013-subagent-return-json-schema.md)
- Packaging: CommonJS (documented in existing docs/adr/ADR-009-cjs-packaging.md)

*(Note: Existing ADRs should be moved or symlinked to .sovereign/docs/adr/)*

## Gaps (risk-ordered)
| Risk | Gap | Close with |
|------|-----|-----------|
| HIGH | No security model | `/security-design` |
| MED  | No API contract / Interface doc | `/api-design` |
| LOW  | Missing CI pipeline | (manual setup / DevOps) |
| LOW  | Sparse domain glossary | `/ubiquitous-language` |
