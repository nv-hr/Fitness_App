# Phase 33: Plan Migration & Edge Cases - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Existing old-format plans migrate seamlessly to the new variable-day format; swap edge cases handled gracefully. This phase:
- Lazy regeneration: old-format plans detected and auto-regenerated on GET request (when user views plan page)
- Transparent migration: no visible notification to user
- LLM failure during migration: keep old format, try again on next visit
- Swap on old-format plan: auto-trigger migration, then retry swap on new plan
- Swap edge cases: nonexistent activityId returns clear error

Dependencies: Phase 32 complete (swap UI), Phase 30 (format_version detection), Phase 31 (swap endpoint).
</domain>

<decisions>
## Implementation Decisions

### Plan Migration Strategy
- Lazy regeneration triggers on GET request (when user visits weekly plan page) — detects old-format by absence of format_version field
- Transparent migration: no notification to user. Plan regenerates silently.
- LLM failure during migration: keep old-format plan, attempt again on next visit (non-blocking)

### Edge Case Handling
- Swap on nonexistent activityId in old-format plan: auto-trigger migration to new format, then retry swap
- Swap on nonexistent activityId in new-format plan: return 404 error

### the agent's Discretion
- Implementation details of the lazy regeneration flow
- Where to place the migration check (controller, service, or middleware)
- How to determine the availableDays for migrated plans (probably default 5)
- Test strategy

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `llm.service.js` — `format_version` field added in Phase 30, `validatePlanStructure()` checks for it
- `weeklyPlan.controller.js` — GET handler checks cache then DB
- `weeklyPlan.repository.js` — `findByUserAndWeek()` from Phase 31
- `WeeklyPlanPage.jsx` — frontend loads plan on mount via `loadPlan()` callback

### Established Patterns
- Plans stored as JSONB in weekly_plans table with plan_data column
- In-memory node-cache for plan caching
- GET endpoint returns from cache first, then DB
- format_version: 1 on new plans, absence = old format
- Fallback generation when LLM fails

### Integration Points
- `backend/src/services/llm.service.js` — Add migration logic to get() or create migration check
- `backend/src/controllers/weeklyPlan.controller.js` or service layer — Migration trigger
- Frontend WeeklyPlanPage — Already calls loadPlan on mount, which triggers GET
</code_context>

<specifics>
## Specific Ideas

- Migration should use the same generateWeeklyPlan flow with availableDays default (e.g., 5)
- The lazy regeneration should only trigger once per plan — after successful migration, mark as migrated
- Cache should be updated after migration so subsequent GET calls don't re-trigger

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
