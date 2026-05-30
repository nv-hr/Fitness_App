---
phase: 16-weekly-plan-frontend
reviewed: 2026-05-30T16:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - backend/src/controllers/weeklyPlan.controller.js
  - backend/src/routes/weeklyPlan.routes.js
  - backend/src/services/llm.service.js
  - frontend/src/app/Router.jsx
  - frontend/src/features/weekly-plan/api/weeklyPlanApi.js
  - frontend/src/features/weekly-plan/components/DayActivityRow.jsx
  - frontend/src/features/weekly-plan/components/DayCard.jsx
  - frontend/src/features/weekly-plan/components/EmptyStatePlan.jsx
  - frontend/src/features/weekly-plan/components/FallbackBanner.jsx
  - frontend/src/features/weekly-plan/components/RateLimitedButton.jsx
  - frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx
  - frontend/src/features/weekly-plan/index.js
findings:
  critical: 4
  warning: 4
  info: 3
  total: 11
status: issues_found
---

# Phase 16: Code Review Report — Weekly Plan Feature

**Reviewed:** 2026-05-30T16:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

The weekly plan feature integrates an LLM-powered fitness plan generator with a React frontend. The overall architecture is sound, but several critical defects were found in cross-boundary data flow: **timezone handling is inconsistent** between frontend and backend, **the regenerate-day operation silently fails** when a cached plan exists, and **rate-limit error propagation is broken** at the HTTP abstraction layer so the frontend never sees rate-limit responses. These are data-loss/silent-failure bugs that must be fixed before shipping.

---

## Critical Issues

### CR-01: `regenerateDay` silently returns cached data — never regenerates

**File:** `backend/src/services/llm.service.js:437`
**Issue:** `regenerateDay` (line 437) calls `generateWeeklyPlan(deps)` which checks the in-memory cache first (line 333-336). If the plan is already cached, `generateWeeklyPlan` returns the cached plan without making any API call. The `freshPlan` is therefore the same stale cached plan, and `mergedPlan.days[dayIndex] = freshPlan.days[dayIndex]` copies the original day back onto itself — a silent no-op.

```
Line 437:  const result = await generateWeeklyPlan(deps);   // returns cached without regenerating!
Line 439:  const freshPlan = result.plan;                      // = cached plan (stale)
Line 445:  const cached = getCachedPlan(deps.userId, deps.weekStart);
Line 446:  const existingPlan = cached || freshPlan;            // = cached plan
Line 450:  mergedPlan.days[dayIndex] = freshPlan.days[dayIndex]; // overwrites same day with itself
```

The user sees no change, no error, and no indication that the day was not regenerated. The API call (and its rate-limit quota consumption) is skipped entirely.

**Fix:** Clear the cache for the user/week before calling `generateWeeklyPlan`, or bypass the cache check for regeneration:

```js
// In regenerateDay, before calling generateWeeklyPlan:
clearCachedPlan(deps.userId, deps.weekStart);
const result = await generateWeeklyPlan(deps);
```

---

### CR-02: Frontend rate-limit error handling completely broken — error shape mismatch

**Files:**
- `frontend/src/shared/lib/http.js:30` (see not in scope? Let me inline)
- `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx:61,86`

**Issue:** The rate limiter middleware (`weeklyPlanRateLimiter.js`) returns a structured JSON response on HTTP 429:

```json
{
  "success": false,
  "error": {
    "message": "Weekly plan generation limit reached...",
    "code": "RATE_LIMITED",
    "retryAfter": 150
  }
}
```

The `apiFetch` function in `http.js` parses this JSON into `data`, then on line 30 throws:
```js
throw new Error(data.error?.message || 'Request failed');
```

The resulting `Error` object has **only** the string message — no `retryAfter` property and `err.message` is `"Weekly plan generation limit reached..."` which does **not** contain the substring `'RATE_LIMITED'`.

Both frontend checks on line 61 consequently always fail:
```js
// Line 61 — ALWAYS false for rate-limit errors:
if (err.retryAfter || err.message?.includes('RATE_LIMITED')) {
```

1. `err.retryAfter` is `undefined` (plain `Error` has no such property)
2. `"Weekly plan generation limit reached..."`.includes('RATE_LIMITED') → `false`

The rate-limited user sees the generic error message `"Failed to generate plan. Try again or check back later."` instead of the intended countdown/delay UI.

**Fix:** Either make `apiFetch` throw an error that preserves the structured error data, or change the frontend condition to match the actual error message text:

**Option A — Preserve error shape in `apiFetch` (recommended):**
```js
// In http.js, replace line 30:
const err = new Error(data.error?.message || 'Request failed');
err.retryAfter = data.error?.retryAfter;
err.code = data.error?.code;
throw err;
```

**Option B — Change frontend check (fragile):**
```js
if (err.message?.includes('limit reached')) {  // matches rate limiter text
```

And populate `retryAfter` from the error object if the backend returned it.

---

### CR-03: Timezone mismatch in `getMonday` between frontend and backend causes weekStart drift

**Files:**
- `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx:7-13`
- `backend/src/controllers/weeklyPlan.controller.js:18-24`

**Issue:** The frontend's `getMonday` uses local-time methods (`d.getDay()`, `d.getDate()`, `d.setDate()`) but serializes to UTC via `d.toISOString()`. The backend's `getMonday` uses UTC methods (`d.getUTCDay()`, `d.getUTCDate()`, `d.setUTCDate()`).

For a user in UTC+12 timezone at `2026-05-31 23:00:00` local time:
- **Frontend:** Local date May 31 (Sunday) → computes Monday = May 25 → `toISOString()` → `"2026-05-24T12:00:00.000Z"` → `weekStart = "2026-05-24"`
- **Backend `generate`:** Receives `"2026-05-24"` → `new Date("2026-05-24")` = midnight UTC May 24 → `getUTCDay()` = 0 (Sunday) → computes Monday = May 18 → **stores plan at week `"2026-05-18"`**

The frontend then queries `GET /api/weekly-plans?weekStart=2026-05-24` and the backend looks for `week_start = '2026-05-24'` — but the plan was stored at `'2026-05-18'`. **No plan found. Empty state every time.**

The effect is amplified for users in timezones far from UTC (Asia/Pacific, Americas), but can affect any user whose local UTC offset pushes the date past midnight.

**Fix:** Both `getMonday` functions must use the same timezone convention. Options:

**Option A (preferred):** Make the frontend use UTC throughout (matching backend expectation):
```js
function getMonday(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}
```

**Option B:** Have the backend accept the frontend's weekStart as an opaque key without re-normalizing (requires updating `generate` and `regenerateDay` to not call `getMonday` on the provided weekStart).

---

### CR-04: `get` and `generate` endpoints handle `weekStart` inconsistently — plans become unfindable

**File:** `backend/src/controllers/weeklyPlan.controller.js`

**Issue:** The `get` handler (line 34) uses the frontend-provided `weekStart` **as-is**:
```js
weekStart = weekStart || getMonday(new Date());   // provided value NOT normalized
```

But the `generate` handler (line 76) **re-normalizes** the same `weekStart` through `getMonday`:
```js
weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());  // ALWAYS normalized
```

This creates a scenario where:
1. Frontend sends `weekStart = "2026-05-24"` to `generate`
2. Backend normalizes to `"2026-05-18"` and stores plan there
3. Frontend sends `weekStart = "2026-05-24"` to `get`
4. Backend queries `WHERE week_start = '2026-05-24'` — **returns nothing**
5. Frontend shows empty state and offers "Generate" button again
6. User clicks Generate → creates duplicate plan at `"2026-05-18"`

**Fix:** Either normalize in both places or neither. Since the DB column `week_start` stores the normalized value, `get` must also normalize:

```js
// In get handler:
weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());
```

---

## Warnings

### WR-01: Debug log shows overwritten value — original name lost

**File:** `backend/src/services/llm.service.js:246-248`
**Issue:** In `validateAndFixPlan`, when a fuzzy match corrects an activity name, the code overwrites `act.name` first (line 246), then logs both sides of the arrow showing the same value:

```js
act.name = result.activity.name;          // line 246 — overwrites original
act.activity_id = result.activity.id;
console.warn(`[LLM] Fixed activity name: "${act.name}" → "${result.activity.name}"`);
//                                  ^ always equals result.activity.name now
```

Both sides of the arrow render the corrected name. The original (incorrect) name from the LLM is lost from the log, making debugging impossible.

**Fix:** Capture the original name before overwriting:
```js
const originalName = act.name;
act.name = result.activity.name;
act.activity_id = result.activity.id;
console.warn(`[LLM] Fixed activity name: "${originalName}" → "${result.activity.name}"`);
```

---

### WR-02: `String.replace` in `buildPrompt` interprets `$` groups in activity names — template injection risk

**File:** `backend/src/services/llm.service.js:48-56`
**Issue:** `buildPrompt` uses `String.replace(regex, value)` to interpolate template variables. JavaScript's `String.replace` treats `$1`, `$&`, `$``, `$'` as special replacement patterns. If any activity name (passed through `activitiesText` or `historyText`) contains a `$` followed by a digit or special character, the prompt template will be corrupted.

For example, an activity named "Push & Pull $100 Challenge" would have the `$1` treated as a backreference, potentially removing chunks of the prompt.

**Fix:** Escape `$` signs in all string interpolations, or use a replacement function:
```js
template = template.replace(placeholder, () => String(value ?? ''));
```

Using a function (instead of a string) disables `$` pattern interpretation:
```js
template = template.replace(placeholder, () => String(value ?? ''));
```

---

### WR-03: `plan_data` null dereference in `get` controller

**File:** `backend/src/controllers/weeklyPlan.controller.js:57`
**Issue:** The code accesses `row.plan_data.days` without checking if `plan_data` is null:
```js
const plan = {
  days: row.plan_data.days || [],
  // ...
};
```

If `plan_data` is stored as `NULL` in the database (no `NOT NULL` constraint evident in the query — only `LIMIT 1`), `row.plan_data` will be `null`, causing a `TypeError: Cannot read properties of null`. This crashes the request handler with a 500 instead of returning a graceful empty state.

**Fix:** Add a null guard:
```js
const plan = {
  days: row.plan_data?.days || [],
  status: row.status || 'active',
  generated_at: row.plan_data?.generated_at || row.created_at,
};
```

---

### WR-04: `WeeklyPlanPage` missing `ProfileGuard` — users without profiles reach the page

**File:** `frontend/src/app/Router.jsx:91`
**Issue:** The `/weekly-plan` route is only wrapped in `ProtectedRoute`, unlike the home route (`/`) which is wrapped in both `ProtectedRoute` and `ProfileGuard`:
```jsx
<Route path="/" element={<ResponsiveLayout><ProtectedRoute><ProfileGuard><DashboardPlaceholder /></ProfileGuard></ProtectedRoute></ResponsiveLayout>} />
```

A user who registered but never created a profile will reach the weekly plan page. The backend gracefully degrades to a fallback plan, but the user sees "No activity history available" instead of being directed to create their profile. The data needed for LLM prompt personalization (weight, age, fitness goal) is missing.

**Fix:** Add `ProfileGuard` to the `/weekly-plan` route:
```jsx
<Route path="/weekly-plan" element={<ResponsiveLayout><ProtectedRoute><ProfileGuard><WeeklyPlanPage /></ProfileGuard></ProtectedRoute></ResponsiveLayout>} />
```

---

## Info

### IN-01: `regenerateDay` calls full `generateWeeklyPlan` — wasteful LLM call

**File:** `backend/src/services/llm.service.js:437`
**Issue:** `regenerateDay` calls the full 7-day `generateWeeklyPlan` just to extract one day. This consumes the same API quota and latency as a full generation. The LLM is asked to produce 7 days of activities, but 6 are discarded. In a rate-limited environment (5/15min), wasting calls is costly.

**Suggestion:** Consider adding a dedicated prompt for single-day regeneration to save cost and quota.

---

### IN-02: `dayIndex == null` check is dead code

**File:** `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx:75`
**Issue:** `Array.prototype.findIndex` never returns `null` — it returns `-1` on not found or a non-negative integer on success. The `== null` check is unreachable:
```js
const dayIndex = plan?.days?.findIndex((d) => d.date === day.date);
if (dayIndex == null || dayIndex < 0) return;
```

If `plan?.days` is `undefined`, the optional chaining short-circuits and `dayIndex` is `undefined` — so `== null` correctly catches that case. However, the only caller (`onRegenerateDay(day)`) passes a `day` object that must exist in `plan.days`, making the defensive check unnecessary noise.

**Suggestion:** Simplify to `if (dayIndex < 0) return;` since `findIndex` returns -1 when not found, and the `?.` chain handles `undefined` by yielding `undefined` which is also `< 0` ... actually `undefined < 0` is `false` in JS (NaN comparison). So keep the `== null` check for the `?.` short-circuit case, but add a clarifying comment.

---

### IN-03: Unnecessary `useMemo` in `DayCard` — array reference invalidates it

**File:** `frontend/src/features/weekly-plan/components/DayCard.jsx:14-16`
**Issue:** The `useMemo` on `totalMinutes` depends on `day.activities`, which is an array reference from parent state. Since the parent sets the entire `plan` object each time, `day.activities` is a new reference on every render, defeating memoization.

**Suggestion:** Either remove `useMemo` (the reduction is cheap — max 4 items) or use a deep comparison. For a max-4-item array, removing `useMemo` simplifies the code with no measurable performance difference.

---

_Reviewed: 2026-05-30T16:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
