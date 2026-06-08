# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v1.1.1/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-08

### Scope
- Keep old tests intact until Phase 3 for reference purposes, rather than deleting them in Phase 1.

### Approach
- Chose: Option A - Complete structural analysis.
- Reason: User prefers to use tools to map dependencies, find dead code, and measure complexity.

### Constraints
- Must not delete the old test suite during the cleanup phase.

## Phase 2 Decisions

**Date:** 2026-06-08

### Scope
- Separate LLM generation and validation logic into distinct modules.
- Remove all unused exports definitively.

### Approach
- Chose: Deep Refactor.
- Reason: User requested aggressive refactoring to enforce strict boundaries and separation of concerns.

### Constraints
- Must fix any existing tests that break during the refactoring process rather than ignoring them.
