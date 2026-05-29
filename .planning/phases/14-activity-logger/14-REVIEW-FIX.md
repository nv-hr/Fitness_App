---
phase: 14-activity-logger
fixed_at: 2026-05-29T18:20:00Z
review_path: .planning/phases/14-activity-logger/14-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report — Activity Logger

**Fixed at:** 2026-05-29T18:20:00Z
**Source review:** .planning/phases/14-activity-logger/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (1 Critical, 5 Warning)
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Wrong argument order in fallback repository call — userId passed as goalTags

**Files modified:** `backend/src/controllers/activity.controller.js`
**Commit:** `37c8ef7`
**Applied fix:** Replaced dynamic `import()` with static `activityRepo.getAllActivities(...)` call, and removed the extraneous `req.user.userId` argument that was being passed as `goalTags`. The repository function `getAllActivities(goalTags)` only expects one array argument — passing a number caused a PostgreSQL type mismatch when the fallback branch was reached.

### WR-01: Unused import `getFoodById`

**Files modified:** `backend/src/controllers/activity.controller.js`
**Commit:** `37c8ef7`
**Applied fix:** Removed `getFoodById` from the destructured import statement, keeping only `getDailyTotal` which is used in `getActivitySummary`.

### WR-02: Inconsistent `isLogging` prop type — boolean vs object

**Files modified:** `frontend/src/features/activities/components/ActivitiesPage.jsx`
**Commit:** `5eab24a`
**Applied fix:** Changed `isLogging={loggingActivity}` to `isLogging={!!loggingActivity}` on the `ActivityPool` component, ensuring the prop is always a boolean (not the activity object or null). `ActivityPool` internally converts to a boolean mask, but the parent now provides a consistent type.

### WR-03: Missing URL encoding for query/path parameters

**Files modified:** `frontend/src/features/activities/api/activityApi.js`
**Commit:** `04724e2`
**Applied fix:** Wrapped all interpolated URL parameters with `encodeURIComponent()`:
- `date` in `getActivityLogs` and `getActivitySummary` (query params)
- `days` in `getActivityHistory` (query param)
- `id` in `deleteActivityLog` (path segment)

This prevents URL malformation if future callers pass special characters.

### WR-04: `!estimatedCalories` guard rejects valid value `0`

**Files modified:** `frontend/src/features/activities/components/previewCalories.js`
**Commit:** `8e636d3`
**Applied fix:** Changed `if (!estimatedCalories || !activityDurationMin || ...)` to `if (estimatedCalories == null || activityDurationMin == null || ...)`. Using `== null` correctly rejects only `null`/`undefined` values instead of all falsy values (including `0`).

### WR-05: Empty catch block silently discards refresh errors

**Files modified:** `frontend/src/features/activities/components/ActivitiesPage.jsx`
**Commit:** `e62dcb3`
**Applied fix:** Replaced the empty `catch {}` block in `refreshActivityData()` with `catch (err) { console.warn('Failed to refresh activity data:', err); }` to log refresh failures instead of silently swallowing them.

---

_Fixed: 2026-05-29T18:20:00Z_
_Fixer: gsd-code-fixer_
_Iteration: 1_
