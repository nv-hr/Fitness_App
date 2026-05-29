# Phase 14: Activity Logger — Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Activity Logger feature on top of Phase 13's `activity_logs` table. Users can log activities with duration/intensity, view history grouped by date, delete entries, and see a daily net calorie summary.

**Success criteria (from ROADMAP.md):**
1. User can log an activity by selecting from the existing activity database, entering duration in minutes, and choosing intensity level (light/moderate/vigorous)
2. User can view their activity history list showing date, activity name, duration, intensity, and calculated calories burned
3. User can delete any logged activity from their history
4. Daily summary shows total active minutes, total calories burned, and net calorie display (consumed − burned vs TDEE target)

**Requirements covered:** ACT-01, ACT-02, ACT-03, ACT-04
</domain>

<decisions>
## UI/UX Decisions

### UI Placement
- **D-01:** Activity logging lives on the existing `/activities` page, below the recommendations and activity pool sections. No new route needed.

### Net Calorie Display
- **D-02:** Activity summary with total active minutes, calories burned, and net calorie calculation appears on the activities page only. Food-log page's CalorieSummary stays unchanged (food-only).

### Log Form UX
- **D-03:** Inline expandable form on each ActivityCard. User clicks "Log" → card expands with duration + intensity fields + real-time calorie preview. Collapses on submit or cancel.

### Activity Selection
- **D-04:** Two paths to log:
  - **Quick-log:** "Log this" button on recommendation/suggested activity cards — pre-fills the activity and pops the inline form
  - **Manual pick:** User clicks any activity from the full pool to open its log form

### Date Handling
- **D-05:** Default to today's date. User can change date if they want (matches food logging `logDate` pattern).

### Calorie Preview
- **D-06:** Show real-time estimated calories burned as user adjusts duration/intensity slider/inputs. Formula matches Phase 13 D-10.

### Delete UX
- **D-07:** Immediate delete, no confirmation dialog.

### History Display
- **D-08:** Grouped by date with expandable/collapsible sections. Daily totals (active minutes, calories burned) as section headers. Default scope: last 7 days (matching food history).

## Technical Decisions

### Calorie Calculation
- **D-09:** Formula (same as Phase 13 D-10):
  ```
  activity.estimated_calories * (duration_min / activity.duration_min) * intensity_multiplier
  ```
  Multipliers: light=0.7, moderate=1.0, vigorous=1.3
- **D-10:** Client-side preview uses the same formula but is display-only. Server-side recalculates on save — server value is authoritative and stored in `calories_burned`.
- **D-11:** For seeded activities, server looks up `estimated_calories` and `duration_min` from the `activities` table to compute. Client also needs these values for preview — return them from GET /api/activities endpoints.

### Repository & Controller Pattern
- **D-12:** Add activity log functions to the existing `activity.repository.js` (not a separate file). Matches food pattern where catalog + logging share one repository.
- **D-13:** Add activity log handler functions to the existing `activity.controller.js`. The controller will handle both activity catalog/recommendations and user logging — same pattern as food controller.
- **D-14:** Add a `activityLog.service.js` for the calorie calculation logic and any validation that spans multiple repositories.

### API Endpoints
- **D-15:**
  | Method | Path | Purpose |
  |--------|------|---------|
  | POST | /api/activities/log | Log an activity (body: activityId, durationMin, intensity, loggedDate) |
  | GET | /api/activities/logs?date= | Get logs for a specific date |
  | GET | /api/activities/history?days=7 | Get activity history grouped by date |
  | DELETE | /api/activities/log/:id | Delete a single log entry |
  | GET | /api/activities/summary?date= | Daily activity summary (total minutes, burned, net calories) |

### Net Calorie Calculation (ACT-04)
- **D-16:** The `/api/activities/summary` endpoint fetches:
  1. SUM of `activity_logs.calories_burned` for the given date
  2. Food total consumed from `food_repo.getDailyTotal()` for the given date
  3. TDEE target from `profile.service.getCalorieTarget()`
  4. Returns: `{ totalActiveMinutes, totalCaloriesBurned, totalConsumed, calorieTarget, netCalories: totalConsumed - totalCaloriesBurned, netVsTarget: (totalConsumed - totalCaloriesBurned) - calorieTarget }`
- **D-17:** Formula: `netVsTarget = (consumed - burned) - target`. Positive = surplus, negative = deficit. Display with color: green (deficit/on track), red (surplus).

### Frontend Changes
- **D-18:** Add API functions in `src/features/activities/api/activityApi.js`: `logActivity`, `getActivityLogs`, `getActivityHistory`, `deleteActivityLog`, `getActivitySummary`
- **D-19:** Add new components in `src/features/activities/components/`: `ActivityLogForm.jsx` (inline expandable form), `ActivityHistory.jsx` (grouped-by-date history), `ActivitySummary.jsx` (daily stats)
- **D-20:** Update `ActivitiesPage.jsx` orchestrator to manage activity log state + co-exist with existing recommendations/pool
- **D-21:** Calorie preview utility: create `previewCalories.js` in activities feature (mirrors food-log's pattern) for client-side formula

### Phase 13 Cleanup
- **D-22:** Before implementing Phase 14, the Phase 13 schema changes (`activity_logs`, `weekly_plans` tables, `intensity_level` ENUM) must be applied to the live Supabase database. The `backend/db/cleanup-user-activity-log.sql` script must also be run.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Database
- `backend/db/schema.sql` — Canonical PostgreSQL schema (already includes activity_logs + weekly_plans)
- `backend/db/seed.sql` — Seed data (35 activities with estimated_calories and duration_min)

### Backend Patterns
- `backend/src/repositories/food.repository.js` — Closest analog: catalog + logging in one file, pg queries, AppError wrapping
- `backend/src/controllers/food.controller.js` — Controller pattern: validation, error responses, success responses
- `backend/src/services/food.service.js` — Service pattern: validation functions, calorie calculation
- `backend/src/routes/food.routes.js` — Route registration pattern with authenticateToken middleware
- `backend/src/utils/response.js` — successResponse, errorResponse helpers
- `backend/src/utils/errors.js` — AppError, ValidationError, NotFoundError

### Prior Context
- `.planning/phases/13-database-schema-foundation/13-CONTEXT.md` — Phase 13 decisions (D-09/D-10: calorie formula, D-03: weekly_plans JSONB schema)

### Frontend Patterns
- `frontend/src/features/food-log/components/FoodLogPage.jsx` — Orchestrator pattern: useState/useEffect, calls APIs directly
- `frontend/src/features/food-log/api/foodLogApi.js` — API module pattern
- `frontend/src/features/food-log/components/CalorieSummary.jsx` — Calorie display with progress bar (reference for activity summary)
- `frontend/src/features/activities/components/ActivitiesPage.jsx` — Current orchestrator to extend
- `frontend/src/features/activities/components/ActivityCard.jsx` — Card that will get an inline log form
- `frontend/src/shared/lib/http.js` — Shared HTTP client (apiGet, apiPost, apiFetch)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Food logging full CRUD pattern (repository → service → controller → routes → API → page) is the direct analog
- `activity.repository.js` already has `getActivityById()` — needed for server-side calorie calculation
- `activity.service.js` already has `mapFitnessGoalToTags()` — filtering logic for activity selection
- All activities in seed data have `estimated_calories` and `duration_min` columns — required for the calorie formula

### Integration Points
- `food.repository.getDailyTotal(userId, date)` — needed by activity summary for net calorie calculation
- `profile.service.calculateTdee()` and `getCalorieTarget()` — needed for TDEE target in net display
- `activity_logs` table (from Phase 13) — target table for INSERT/SELECT/DELETE queries
- Schema already includes `calories_burned` column and `intensity_level` ENUM

### Established Patterns
- Server-side calorie calculation for seeded data (food pattern: `calculateCalories` server-side)
- `successResponse(res, data, statusCode)` / `errorResponse(res, message, statusCode, code)` response helpers
- `authenticateToken` middleware on all protected routes
- Date format: `YYYY-MM-DD` strings throughout
</code_context>

<specifics>
## Specific Ideas

None — decisions above cover all gray areas identified during discussion.

The implementation follows the well-established food logging pattern:
Repository (data access) → Service (business logic) → Controller (request handling) → Routes (registration) → Frontend API (HTTP calls) → Components (UI)

Key difference from food logging: the log form is inline on existing cards rather than a separate form section, and history is grouped by date.
</specifics>

<deferred>
## Deferred Ideas

- Custom activity entry (ACT-05) — explicitly Out of Scope for v1.3
- One-click plan-to-log (ACT-06) — deferred to v2
- Edit logged activities (ACT-07) — deferred; delete-and-recreate is sufficient
</deferred>

---

*Phase: 14-Activity Logger*
*Context gathered: 2026-05-29*
