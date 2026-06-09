# Phase 2: Frontend Static Analysis & Mapping - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Task Boundary

Static analysis of the frontend codebase to trace API calls to the backend to identify unused routes and tables.
</domain>

<decisions>
## Implementation Decisions

### Analysis approach
- AST parser (I will write a Node.js script to safely parse the JS/TS syntax)

### Output format
- Both JSON (for Phase 3 cleanup scripts) and Markdown (for our records)

### Coverage scope
- Comprehensive (Include fetch, axios, and any data fetching hooks like React Query or SWR)
</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches
</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above
</canonical_refs>
