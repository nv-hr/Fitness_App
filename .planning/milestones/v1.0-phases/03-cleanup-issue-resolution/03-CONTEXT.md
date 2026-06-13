# Phase 3: Cleanup & Issue Resolution - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Task Boundary

Cleanup unused backend routes and database tables based on Phase 2 mappings, and resolve critical/high-priority security issues found in Phase 1 (input validation and LLM injection).
</domain>

<decisions>
## Implementation Decisions

### Unused Table Deletion Strategy
- Drop tables immediately (Cleanest approach)

### Input Validation Library
- Standardize on Zod (Frontend already uses it, allows shared schemas)

### LLM Input Handling
- Silently truncate/filter bad characters (Better UX, assumes good intent)
</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.
</canonical_refs>

<code_context>
## Existing Code Insights

- Frontend already uses `zod` for validation.
- The backend has prompt logic in `backend/src/services/llm.service.js`.
- Auth logic is in `backend/src/services/auth.service.js`.
</code_context>
