# Phase 5: Backend Static Analysis & Deduplication - Context

**Gathered:** 2026-06-12T20:59:00Z
**Status:** Ready for planning

<domain>
## Phase Boundary

Identifying unused/duplicated code in the backend and refactoring shared services (e.g., controllers, database queries) to enforce DRY principles, while maintaining the Express 5 + PostgreSQL stack and ensuring data integrity.

</domain>

<decisions>
## Implementation Decisions

### Analysis Tooling Strategy
- **D-01:** (Recommended) Automated analysis with fallow (Consistent with frontend, catches hidden dependencies)
- **D-02:** (Recommended) Use fallow's code duplication detection (Requires less manual effort, consistent with frontend approach)
- **D-03:** (Recommended) Rely on repository pattern static analysis (Traces references from controllers to repository files)

### Dead Code Handling
- **D-04:** (Recommended) Prefix file names with `_deprecated_` and add a JSDoc warning, do not delete immediately (Consistent with frontend strategy)
- **D-05:** (Recommended) Move unused database repository functions/queries to a `_deprecated.js` file within the repositories folder

### Refactoring Strategy
- **D-06:** (Recommended) Create simple utility functions in a `utils/` or `shared/` folder (Simpler, easier to maintain)
- **D-07:** (Recommended) Inside the `services/shared/` folder, clearly separated from domain-specific services

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements & Roadmap
- `.planning/ROADMAP.md` — Roadmap defining phases
- `.planning/PROJECT.md` — Project context, constraints, and key decisions
- `.planning/REQUIREMENTS.md` — Detailed requirements (BE-01, BE-02, BE-03)

### Codebase Context
- `.planning/codebase/ARCHITECTURE.md` — Describes the layered backend approach (routes, controllers, middlewares, services, repositories)
- `.planning/codebase/STRUCTURE.md` — Backend folder structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `services/shared/` folder: The target destination for extracted common logic.
- Repository pattern: Used for raw DB queries via `pg` driver, making static analysis easier.

### Established Patterns
- Layered backend approach (controllers, services, repositories).
- Avoiding complex OOP Base Controllers in favor of simpler utility functions.

### Integration Points
- Connecting controllers and repositories to the new shared services.

</code_context>

<specifics>
## Specific Ideas

- Ensure simple utility functions instead of deep inheritance for shared logic.
- Prefix dead routes with `_deprecated_` and move dead queries to `_deprecated.js`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 5-Backend Static Analysis & Deduplication*
*Context gathered: 2026-06-12T20:59:00Z*
