# Phase 24: Activity Plan Backend - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Activity plans persist to database with per-item completed tracking — cache-only plans become durable, survive page refreshes and cache eviction.

Deliverables:
1. New `activity_plans` database table (idempotent SQL migration)
2. Persistence hook: generated activity plans saved to DB
3. GET endpoint returning persisted plan with cache-first `fromCache` semantics
4. UNIQUE(user_id, plan_date) constraint preventing duplicate daily entries

</domain>

<decisions>
## Implementation Decisions

### Database Schema Pattern
- Migration file: `add_activity_plans.sql` following existing convention
- Table columns: `id`, `user_id`, `plan_date` (DATE), `plan_data` (JSONB with per-item `logged` flags), `status`, `created_at`, `updated_at`
- UNIQUE(user_id, plan_date) constraint — prevents duplicates per user per day
- Idempotent via `CREATE TABLE IF NOT EXISTS`

### API Architecture Pattern
- Route prefix: new `/api/activity-plans` (following `/api/weekly-plans` and `/api/meal-plans`)
- New `activityPlan.controller.js` with single responsibility
- Persistence in new `activityPlan.service.js`: persist after LLM generation, then return
- New `activityPlan.repository.js` with `findByUserAndDate()`, `upsertPlan()` following `mealPlan.repository.js` pattern

### GET Endpoint & Caching
- Cache-first: node-cache → DB fallback with `fromCache` boolean flag
- Response shape: `{ plan, fromCache }` matching existing weeklyPlan/mealPlan pattern
- Cache populated on generate (before DB upsert) so GET reads cache immediately
- GET accepts `?date=` query param; defaults to today (ISO date string)

### the agent's Discretion
Specific controller method signatures, route parameter names, error handling preferences, and edge case behavior not covered above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mealPlan.repository.js` — `findByUserAndWeek()`, `upsertPlan()`, `markItemsLogged()` — full pattern for activityPlan.repository
- `weeklyPlan.controller.js` — cache-first GET, generate with DI pattern
- `mealPlan.controller.js` — similar cache-first GET with `fromCache` flag
- `add_meal_plans.sql` — idempotent SQL migration template
- `run_migration.js` — migration runner script (imports pool, reads SQL, runs it)

### Established Patterns
- Repository pattern with `pool.query()` and pg driver
- Controller exports default object with handler methods
- Responses via `successResponse(res, data)` / `errorResponse(res, msg, code, errCode)`
- All routes use `authenticateToken` middleware
- Cache via `node-cache` with 1h TTL, `getCachedPlan()`/`setCachedPlan()`/`clearCachedPlan()` in `llm.service.js`
- `weeklyPlan.controller.js` uses `weekStart` date computation via `getMonday()`

### Integration Points
- New migration: `backend/db/add_activity_plans.sql` + add to `run_migration.js`
- New route: `backend/src/routes/activityPlan.routes.js`
- Register in `app.js`: `app.use('/api/activity-plans', activityPlanRoutes)`
- Repository reuses `pool` from `backend/src/config/database.js`
- Cache reuses existing `llm.service.js` cache functions (planCache with 'activity' type)
- Generation already happens in `llm.service.js generateWeeklyPlan()` — persistence hook goes after cache set

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard approaches based on established codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
