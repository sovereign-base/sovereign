---
phase: 04-fast-lane
plan: 01
subsystem: references
tags: [unverified-marker, anti-hallucination, conv-03, hand-authored]
requirements: [CONV-03]
key-files: { created: [engine/references/unverified-marker.md] }
---
# Plan 04-01 Summary — SOVEREIGN:UNVERIFIED marker spec (CONV-03)
Authored `engine/references/unverified-marker.md`: the token, locked one-line form (`<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <date>`, reason required), 3 cross-language examples, valid contexts (unverified API / assumed behavior / stale knowledge), the scan rule tied to `sovereign-sentinel`'s `unverified_markers` schema, and the deferred gate threshold (surface now, block at M2 pre-flight). Grep gate PASS.
