# Phase 5: Backend Static Analysis & Deduplication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12T20:59:00Z
**Phase:** 5-Backend Static Analysis & Deduplication
**Areas discussed:** Analysis Tooling Strategy, Dead Code Handling, Refactoring Strategy

---

## Analysis Tooling Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Automated analysis with fallow (Consistent with frontend, catches hidden dependencies) | | ✓ |
| Manual trace from frontend API usage (Targeted, but might miss internal backend dead code) | | |
| ESLint unused imports plugin (Lightweight, but only catches unused imports, not whole files/routes) | | |

**User's choice:** (Recommended) Automated analysis with fallow (Consistent with frontend, catches hidden dependencies)
**Notes:** 

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Use fallow's code duplication detection (Requires less manual effort, consistent with frontend approach) | | ✓ |
| Manual review of controllers and queries (Better for semantic duplication that tools might miss, but slower) | | |
| jscpd / specific duplication tool (Might be overkill if fallow is already running) | | |

**User's choice:** (Recommended) Use fallow's code duplication detection (Requires less manual effort, consistent with frontend approach)
**Notes:** 

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Rely on repository pattern static analysis (Traces references from controllers to repository files) | | ✓ |
| Manual audit of the repository folder (Takes longer but ensures 100% accuracy) | | |

**User's choice:** (Recommended) Rely on repository pattern static analysis (Traces references from controllers to repository files)
**Notes:** 

---

## Dead Code Handling

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Prefix file names with `_deprecated_` and add a JSDoc warning, do not delete immediately (Consistent with frontend strategy) | | ✓ |
| Delete them immediately (Keeps codebase clean, rely on git for history) | | |
| Keep them but comment out the `app.use()` bindings in the router (Fastest, but leaves dead files) | | |

**User's choice:** (Recommended) Prefix file names with `_deprecated_` and add a JSDoc warning, do not delete immediately (Consistent with frontend strategy)
**Notes:** 

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Move them to a `_deprecated.js` file within the repositories folder | | ✓ |
| Add `@deprecated` JSDoc to the functions but keep them in their original files | | |
| Delete them completely (Since DB queries are sensitive to schema changes) | | |

**User's choice:** (Recommended) Move them to a `_deprecated.js` file within the repositories folder
**Notes:** 

---

## Refactoring Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Create simple utility functions in a `utils/` or `shared/` folder (Simpler, easier to maintain) | | ✓ |
| Create generic Base Controller / Base Service classes (More OOP, but can get complicated) | | |
| Inline them into middlewares (Good for cross-cutting logic, but maybe not for business rules) | | |

**User's choice:** (Recommended) Create simple utility functions in a `utils/` or `shared/` folder (Simpler, easier to maintain)
**Notes:** 

| Option | Description | Selected |
|--------|-------------|----------|
| (Recommended) Inside the `services/shared/` folder, clearly separated from domain-specific services | | ✓ |
| At the root of the `services/` folder | | |
| Create a new `common/` folder at the root of the backend | | |

**User's choice:** (Recommended) Inside the `services/shared/` folder, clearly separated from domain-specific services
**Notes:** 

---

## the agent's Discretion

None.

## Deferred Ideas

None.
