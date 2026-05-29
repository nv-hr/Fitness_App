---
phase: 14-activity-logger
reviewed: 2026-05-29T12:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - backend/src/controllers/activity.controller.js
  - backend/src/repositories/activity.repository.js
  - backend/src/routes/activity.routes.js
  - backend/src/services/activityLog.service.js
  - frontend/src/features/activities/api/activityApi.js
  - frontend/src/features/activities/components/ActivitiesPage.jsx
  - frontend/src/features/activities/components/ActivityCard.jsx
  - frontend/src/features/activities/components/ActivityHistory.jsx
  - frontend/src/features/activities/components/ActivityLogForm.jsx
  - frontend/src/features/activities/components/ActivityPool.jsx
  - frontend/src/features/activities/components/ActivitySummary.jsx
  - frontend/src/features/activities/components/previewCalories.js
  - frontend/src/shared/lib/http.js
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 14: Code Review Report — Activity Logger

**Reviewed:** 2026-05-29T12:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the Activity Logger feature covering backend (controller, repository, routes, service) and frontend (API layer, 6 components, shared HTTP client). The implementation is structurally sound with proper separation of concerns, parameterized queries, and JWT auth. However, one critical argument-order bug exists in a fallback code path, along with several warnings around import hygiene, error handling, and defensive coding.

---

## Critical Issues

### CR-01: Wrong argument order in fallback repository call — userId passed as goalTags

**File:** `backend/src/controllers/activity.controller.js:43-44`
**Issue:** The fallback path (when user has no profile) calls `getAllActivities` from the repository with `(req.user.userId, ['lose_weight', 'maintain', 'gain_weight'])`, but the function signature is `getAllActivities(goalTags)` — it only expects one array argument. The userId (a number) is passed as `goalTags`, and the intended goal-tag array is silently ignored. This causes a PostgreSQL type mismatch: the `?|` JSONB operator expects a text array, not a number.

Furthermore, a dynamic `import()` is used despite `activityRepo` already being statically imported at line 7 (`import * as activityRepo from ...`). `activityRepo.getAllActivities` is available and should be used directly.

**Impact:** If the fallback branch is reached (user has no profile or no fitness_goal), the database query will fail with a type error, returning a 500 error to the client instead of the expected activity list.

**Fix:**
```javascript
// Replace lines 43-44 (dynamic import + wrong args) with:
activities = await activityRepo.getAllActivities(['lose_weight', 'maintain', 'gain_weight']);
```

---

## Warnings

### WR-01: Unused import `getFoodById`

**File:** `backend/src/controllers/activity.controller.js:5`
**Issue:** `getFoodById` is imported from `../repositories/food.repository.js` but never referenced anywhere in the controller. Only `getDailyTotal` from the same import is used (in `getActivitySummary`).

**Impact:** Linter warning; dead code that adds noise and suggests the developer may have intended to use it elsewhere.

**Fix:**
```javascript
// Change line 5:
import { getDailyTotal } from '../repositories/food.repository.js';
```

---

### WR-02: Inconsistent `isLogging` prop type — boolean vs object

**File:** 
- `frontend/src/features/activities/components/ActivitiesPage.jsx:143,178`

**Issue:** The `isLogging` prop is passed with two different types depending on the consumer:
- Line 143 (direct `ActivityCard` usage): `isLogging={loggingActivity?.id === activity.id}` — evaluates to a **boolean**
- Line 178 (`ActivityPool` usage): `isLogging={loggingActivity}` — passes the **activity object** (or null)

`ActivityPool.jsx` internally converts the object to a boolean at line 19 (`isLogging={isLogging?.id === activity.id}`), which masks the inconsistency. This makes the prop contract fragile — any future consumer that treats `isLogging` as a boolean (like `ActivityCard` does with `disabled={isLogging}`) will silently break if they receive the raw object.

**Fix:** Pass a boolean consistently from the parent:
```javascript
// ActivitiesPage.jsx line 178 — change from:
<ActivityPool ... isLogging={loggingActivity} />
// To:
<ActivityPool ... isLogging={!!loggingActivity} />
```
Or, better, rename the prop to distinguish the semantics (e.g., `loggingActivityId` in the parent, resolve to boolean in each child).

---

### WR-03: Missing URL encoding for query/path parameters

**File:** `frontend/src/features/activities/api/activityApi.js:16,20,24,28`

**Issue:** Four API functions interpolate user-supplied or date-derived values directly into URL strings without `encodeURIComponent()`:
- Line 16: `getActivityLogs(date)` → ``/api/activities/logs?date=${date}``
- Line 20: `getActivityHistory(days)` → ``/api/activities/history?days=${days}&includeEntries=true``
- Line 24: `deleteActivityLog(id)` → ``/api/activities/log/${id}``
- Line 28: `getActivitySummary(date)` → ``/api/activities/summary?date=${date}``

While current callers pass safe values (numbers, YYYY-MM-DD dates), the lack of encoding is a defensive gap. If a future caller passes a date containing special characters (e.g., from user input rather than a controlled date picker), the URL could be malformed.

**Fix:** Wrap interpolated values with `encodeURIComponent()`:
```javascript
// activityApi.js
export async function getActivityLogs(date) {
  return apiGet(`/api/activities/logs?date=${encodeURIComponent(date)}`);
}
export async function getActivityHistory(days = 7) {
  return apiGet(`/api/activities/history?days=${encodeURIComponent(days)}&includeEntries=true`);
}
export async function deleteActivityLog(id) {
  return apiDelete(`/api/activities/log/${encodeURIComponent(id)}`);
}
export async function getActivitySummary(date) {
  return apiGet(`/api/activities/summary?date=${encodeURIComponent(date)}`);
}
```

---

### WR-04: `!estimatedCalories` guard rejects valid value `0`

**File:** `frontend/src/features/activities/components/previewCalories.js:25`

**Issue:** The validation check `if (!estimatedCalories || ...)` uses a falsy check that returns `null` for `estimatedCalories = 0`. While no activity should have zero estimated calories, the guard should only reject actual `null`/`undefined` values, not the valid numeric value `0`.

**Fix:**
```javascript
// Change line 25 from:
if (!estimatedCalories || !activityDurationMin || isNaN(dur) || dur < 1 || dur > 1440) {
// To:
if (estimatedCalories == null || activityDurationMin == null || isNaN(dur) || dur < 1 || dur > 1440) {
```

---

### WR-05: Empty catch block silently discards refresh errors

**File:** `frontend/src/features/activities/components/ActivitiesPage.jsx:30-32`

**Issue:** `refreshActivityData()` has an empty `catch` block that silently swallows all errors from the summary and history API calls. If these endpoints fail (e.g., network error, server error), the user sees stale data with no indication of failure. The success message from a preceding log/delete operation also persists, creating a misleading UX.

**Impact:** Silent data staleness. User is not notified when refresh fails.

**Fix:**
```javascript
// Lines 30-32 — add at minimum a console warning:
} catch (err) {
  console.warn('Failed to refresh activity data:', err);
  // Optionally surface to user:
  // setError('Failed to refresh activity data');
}
```

---

## Info

### IN-01: Extra blank lines at top of ActivityCard.jsx

**File:** `frontend/src/features/activities/components/ActivityCard.jsx:1-2`

**Issue:** Two empty lines before the component export. Trivial formatting issue.

**Fix:** Remove the two leading blank lines.

---

### IN-02: Simplifiable null/undefined check

**File:** `frontend/src/features/activities/components/ActivitySummary.jsx:10`

**Issue:** `netVsTarget !== null && netVsTarget !== undefined` can be written more concisely as `netVsTarget != null` (using loose inequality, which checks both `null` and `undefined` per ECMAScript spec). Also used at line 71.

**Fix:**
```javascript
// Line 10:
if (netVsTarget != null) {
// Line 71:
{netVsTarget != null && (
```

---

### IN-03: Missing `step="1"` on duration number input

**File:** `frontend/src/features/activities/components/ActivityLogForm.jsx:57`

**Issue:** The `<input type="number">` for duration minutes allows decimal values on some browsers (e.g., "30.5"). While the submit handler uses `parseInt` (truncating decimals) and the backend also allows non-integer durations, the UI should enforce integer-only input for minutes.

**Fix:** Add `step="1"` to the input:
```javascript
// Line 57 — change from:
min="1"
max="1440"
// To:
min="1"
max="1440"
step="1"
```

---

_Reviewed: 2026-05-29T12:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
