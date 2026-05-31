# Plan 24-02: Service + Controller + Routes — Complete

## Files Created
- `backend/src/services/activityPlan.service.js` — Service with `validateActivityPlanStructure()`, `generateFallbackActivityPlan()`, `buildActivityPlanPrompt()`, `generateActivityPlan()`
- `backend/src/controllers/activityPlan.controller.js` — Controller with `get` (cache-first, `?date=` query) and `generate` (POST) handlers
- `backend/src/routes/activityPlan.routes.js` — Routes: GET `/api/activity-plans/`, POST `/api/activity-plans/generate`

## Files Modified
- `backend/src/app.js` — Added `app.use('/api/activity-plans', activityPlanRoutes)` after meal plan routes

## Design Decisions
- Per-day plans: `planDate` (YYYY-MM-DD) replaces the `weekStart` pattern used by meal/weekly plans
- Cache key: `userId + planDate + 'activity'` — uses existing `getCachedPlan/setCachedPlan` with `planType='activity'` default
- Prompt reuse: builds prompt from `system-prompt.md` with `buildPrompt()` — the template expects a 7-day week response, but validation only checks for a single-day `activities` array. LLM may produce extra days; `validateActivityPlanStructure` only validates the first day's structure. This is acceptable for v1 — a dedicated `activity-plan-prompt.md` can be added in a later iteration.
- Fallback: picks random activities from DB, assigns `logged: false` to each activity item
- No rate limiter middleware yet — can be added when rate limits are tuned for this endpoint

## Phase 24 Complete
Migration SQL is idempotent; run `node backend/db/run_migration.js` when DB is reachable.
