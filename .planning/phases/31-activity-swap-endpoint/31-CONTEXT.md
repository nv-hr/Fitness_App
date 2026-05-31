# Phase 31: Activity Swap Endpoint - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can swap a single activity via dedicated backend endpoint with rate limiting. This phase creates a new API endpoint that:
- Accepts a swap request for a specific activity in the weekly plan (by dayIndex and activity_id)
- Calls LLM to generate a single contextually appropriate replacement activity
- Merges the replacement into the cached plan in-place without full regeneration
- Has a dedicated rate limiter independent from generate/regenerate
- Handles edge cases (missing activity, LLM failure, already-swapped activities)

Dependencies: Phase 30 (prompt/validation rework) must be complete.
</domain>

<decisions>
## Implementation Decisions

### Swap Endpoint Design
- POST endpoint with parameters in request body (activityId, dayIndex, weekStart) — consistent with existing generate/regenerateDay POST pattern
- New dedicated rate limiter: 10 requests per 5 minutes (independent from generate/regenerate)
- Single activity LLM call: new prompt path that generates one replacement activity with context of the swapped-out activity. More efficient than full regenerateDay.

### Error Handling & Edge Cases
- Re-swapping same slot multiple times is allowed (normal swap each time)
- Missing activity_id returns 400 error: 'Activity not found in current plan'
- LLM failure: fall back to picking a random activity from the database (not error to user)

### Integration & In-Place Merge
- Swap updates both in-memory cache AND database (cache + DB dual write)
- Swaps work on old-format plans (pre-format_version) — old plans get format_version: 1 when swap triggers plan update

### the agent's Discretion
- Specific prompt template for single-activity swap generation
- LLM response format for the swap (single activity vs array)
- Error message wording for 404/400 responses
- How to validate replacement activity against the database activity pool

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `llm.service.js` — has `generateWeeklyPlan()`, `regenerateDay()`, cache functions, validation
- `weeklyPlanRateLimiter.js` — has `weeklyPlanLimiter` and `regenerateLimiter` patterns to reuse for swap limiter
- `weeklyPlan.controller.js` — has `generate()` and `regenerateDayHandler()` patterns
- `weeklyPlan.routes.js` — route mounting pattern with authenticateToken middleware
- `system-prompt.md` updated in Phase 30 — has goal-specific and activity-level guidance
- `validatePlanStructure()` and `validateActivities()` from Phase 30

### Established Patterns
- Rate limiters in `backend/src/middlewares/` with export+import pattern
- Routes use `router.use(authenticateToken)` for JWT auth
- Controller methods: try/catch with `next(err)`, use `successResponse`/`errorResponse`
- LLM service: `buildPrompt()` + `callLlmApi()` + validation + correction loop
- Cache: `node-cache` with `planType='activity'` namespace, `getCachedPlan`/`setCachedPlan`/`clearCachedPlan`

### Integration Points
- `backend/prompts/` — New swap prompt template
- `backend/src/services/llm.service.js` — New `swapActivity()` function (or in weekly plan service)
- `backend/src/middlewares/weeklyPlanRateLimiter.js` — Add swapLimiter alongside existing limiters
- `backend/src/controllers/weeklyPlan.controller.js` — Add `swapActivity()` handler
- `backend/src/routes/weeklyPlan.routes.js` — Add swap route with swapLimiter
</code_context>

<specifics>
## Specific Ideas

- Swap prompt should pass: replaced activity name, user profile context, available days plan data for context awareness
- The replacement can be same activity type or different — LLM decides what's contextually appropriate
- Rate limiter set at 10 requests per 5 minutes per user

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
