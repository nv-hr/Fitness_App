## Context

The codebase currently has 11 unused files, 31 unused exports, 21 potential security sinks, 96 duplicate code clones, and 94 complexity hotspots according to the `fallow` static analyzer. These issues slow down development, cause bundle size bloat, and introduce security vulnerabilities.

## Goals / Non-Goals

**Goals:**
- Eliminate dead code safely without breaking runtime functionality.
- Mitigate top security sinks (SSRF, SQLi, Path Traversal).
- Address major code duplicates and complexity hotspots.

**Non-Goals:**
- Complete rewrite of complex functions.
- 100% test coverage for refactored files.
- Functional changes to user-facing features.

## Decisions

- **Dead Code Cleanup:** We will use `fallow fix` where applicable and manually verify removals of unused dependencies and exports.
- **Security Mitigations:**
  - `path-traversal` in `llm.service.js`: Enforce input sanitization using `path.normalize` and checking that it starts with the allowed root directory.
  - `ssrf` in `http.js`: Implement an allowlist for outbound HTTP targets.
  - `sql-injection` in `basePlan.repository.js`: Migrate the offending query to use parameterized bindings instead of string interpolation.
  - `secret-pii-log` in `weeklyPlan.controller.js`: Remove the `console.log()` statement that logs incoming HTTP request bodies which may contain sensitive data.
- **Complexity and Duplication:** Focus on the most egregious clone groups and complexity hotspots first, extracting common utility functions to shared files.

## Risks / Trade-offs

- **Risk:** Removing an export that is dynamically loaded and not caught by static analysis.
  **Mitigation:** Verify dynamically loaded plugin/route directories are preserved.
- **Risk:** Breaking functionality while fixing security sinks.
  **Mitigation:** Add test cases for the updated security fixes (parameterized queries and SSRF allowlists).
