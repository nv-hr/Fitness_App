---
phase: 35-activity-calendar-page
reviewed: 2026-05-31T10:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - frontend/src/features/activities/ActivityCalendarPage.jsx
  - frontend/src/features/activities/api/activityCalendarApi.js
  - frontend/src/features/activities/index.js
  - frontend/src/app/Router.jsx
  - frontend/src/shared/calendar/CalendarPageLayout.jsx
  - frontend/src/features/weekly-plan/components/DayActivityRow.jsx
  - frontend/src/features/weekly-plan/components/__tests__/DayActivityRow.test.jsx
  - frontend/src/features/activities/components/__tests__/ActivityCalendarPage.test.jsx
  - backend/src/controllers/weeklyPlan.controller.js
  - backend/src/routes/weeklyPlan.routes.js
findings:
  critical: 3
  warning: 7
  info: 2
  total: 12
status: issues_found
---

# Phase 35: Code Review Report — Activity Calendar Page

**Reviewed:** 2026-05-31T10:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed 10 files across frontend and backend implementing the Activity Calendar feature. Found 3 critical bugs (broken swap flow, wrong day index in toggle, unsafe shared style cleanup), 7 warnings (misrouted API parameters, validation gaps, missing rate limiter, timezone logic error, incomplete test), and 2 info items. The most severe issue is that the swap functionality never works because `DayActivityRow` calls `onSwap()` without passing the `activityId`, causing the backend to always reject the request.

## Critical Issues

### CR-01: Swap button calls `onSwap()` without passing `activityId` — swap is completely broken

**File:** `frontend/src/features/weekly-plan/components/DayActivityRow.jsx:111`
**Issue:** The swap button's `onClick` handler calls `onSwap()` with no arguments:
```jsx
onClick={() => { if (!isSwapDisabled && onSwap) onSwap() }}
```
But the parent (`ActivityCalendarPage.jsx:312`) wraps the callback as:
```jsx
onSwap={isPast ? undefined : (activityId) => handleSwap(activityId, idx)}
```
Since `onSwap()` is called without arguments, `activityId` is `undefined`. This is then sent to the backend as the `activityId` in the POST body. The backend validation on line 209 of `weeklyPlan.controller.js` rejects `activityId === undefined` with a `VALIDATION_ERROR`. **Every swap attempt fails silently** (the error is caught and shows a generic toast).

**Fix:** Change `DayActivityRow` to pass the activity ID, OR change the parent to use closure-based capture. The simplest fix is to make the parent capture `activity.activity_id` in the closure (matching the pattern used by `onToggle`):

```jsx
{/* Option A: Fix the caller in DayActivityRow */}
onClick={() => { if (!isSwapDisabled && onSwap) onSwap(activity.activity_id) }}

{/* Option B: Fix the parent (no function parameter needed) — RECOMMENDED */}
onSwap={isPast ? undefined : () => handleSwap(activity.activity_id, dayOfWeekIndex)}
```

---

### CR-02: `toggleComplete` passes activity array index as `dayIndex` — wrong day is modified

**File:** `frontend/src/features/activities/ActivityCalendarPage.jsx:315-316`
**Issue:** The `handleToggleComplete` receives `idx` (the position of the activity within the day's activities array, e.g., 0, 1, 2, ...) as the `dayIndex` parameter. The backend (`weeklyPlan.controller.js:403`) uses `dayIndex` to index into the week's days array (`planData.days[dayIndex]`), expecting a 0–6 day-of-week value.

This means: if a user views Monday and clicks the 4th activity (idx=3), the backend targets `planData.days[3]` (Thursday), not `planData.days[0]` (Monday). If the activity ID doesn't exist on Thursday, a confusing "Activity not found" error is shown. If it does exist on Thursday (possible with repeated activities), the wrong day's completion is toggled.

The same `idx`-as-`dayIndex` pattern applies to the swap handler (WR-01), though swap is currently masked by CR-01.

**Fix:** Compute the correct day-of-week index from `selectedDay`:

```jsx
// In ActivityCalendarPage.jsx, add a helper or inline computation:
const dayOfWeek = selectedDay ? ((selectedDay.getDay() + 6) % 7) : -1; // Mon=0..Sun=6

// Then use dayOfWeek instead of idx when calling handleToggleComplete:
onToggle={isPast ? undefined : () => handleToggleComplete(
  activity.activity_id,
  ((selectedDay.getDay() + 6) % 7),  // correct day-of-week index
  completedActivities.has(activity.activity_id)
)}
```

**Also apply the same correction to `handleSwap` where `idx` is passed as `dayIndex` (line 312).**

---

### CR-03: Unsafe cleanup of shared `<style>` element breaks spinner animation across all `DayActivityRow` instances

**File:** `frontend/src/features/weekly-plan/components/DayActivityRow.jsx:10-20`
**Issue:** When a list of activities is rendered, multiple `DayActivityRow` instances mount, each running the same `useEffect`. The guard on line 11 (`if (document.getElementById('swap-spin-style')) return`) prevents duplicates on mount. However, the cleanup function (lines 16–19) **unconditionally removes** the shared `#swap-spin-style` element when *any* instance unmounts:

```jsx
return () => {
  const el = document.getElementById('swap-spin-style');
  if (el) el.remove();
};
```

If one row unmounts (e.g., list reconciliation during a swap, or a day's activities changing), the `<style>` tag is removed from the DOM. All **remaining rows** lose the `swap-spin` keyframe animation, causing their spinner to stop or behave incorrectly.

**Fix:** Move the style injection to a parent component or a singleton wrapper that mounts exactly once:

```jsx
// Option A: Inject in ActivityCalendarPage (higher up, guaranteed singleton)
// ActivityCalendarPage.jsx — add a one-time effect
useEffect(() => {
  if (!document.getElementById('swap-spin-style')) {
    const style = document.createElement('style');
    style.id = 'swap-spin-style';
    style.textContent = '@keyframes swap-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
  // No cleanup — persists for entire app lifetime
}, []);

// Option B: Use a counter-based guard in DayActivityRow
// (more complex but keeps the injection close to usage)
```

## Warnings

### WR-01: Activity index passed as `dayIndex` in swap handler (masked by CR-01)

**File:** `frontend/src/features/activities/ActivityCalendarPage.jsx:312`
**Issue:** Once CR-01 is fixed, the same `idx`-as-`dayIndex` bug from CR-02 would affect the swap handler. On line 312, `idx` is the activity position in the day's array, not the day-of-week index:

```jsx
onSwap={isPast ? undefined : (activityId) => handleSwap(activityId, idx)}
```

**Fix:** Same as CR-02 — compute day-of-week index from `selectedDay`:

```jsx
onSwap={isPast ? undefined : () => handleSwap(activity.activity_id, ((selectedDay.getDay() + 6) % 7))}
```

---

### WR-02: Inconsistent `activity_id` fallback between Set initialization and lookup

**File:** `frontend/src/features/activities/ActivityCalendarPage.jsx:69`
**Issue:** The `completedActivities` Set is initialized on line 69 using the raw `activity_id`:
```jsx
if (act.completed) completed.add(act.activity_id);
```
But checked on lines 318–319 with a `?? idx` fallback:
```jsx
completedActivities.has(activity.activity_id ?? idx)
```
If `activity_id` were ever `null`/`undefined`, the Set would store `undefined`, but the lookup would search for the numeric index (e.g., `0`), causing a mismatch. While `activity_id` should always be valid from the backend, this is a latent bug.

**Fix:** Use the same key consistently:
```jsx
// Initialization (line 69):
const key = act.activity_id ?? idx;  // but idx isn't available here — refactor needed
if (act.completed) completed.add(act.activity_id);

// Or simpler: just use act.activity_id everywhere and trust the backend.
// The ?? idx fallback on lines 315-319 can be removed since the backend always returns valid IDs.
```

---

### WR-03: `getMonday` mixes local time with UTC — potential off-by-one-day

**File:** `backend/src/controllers/weeklyPlan.controller.js:47-53`
**Issue:** The function uses `d.getDay()` and `d.getDate()` (local timezone-dependent) but returns `d.toISOString().split('T')[0]` (UTC date). For dates near midnight in negative UTC offset timezones, the local date and UTC date can differ by one day, causing the wrong Monday to be computed:

```js
function getMonday(date) {
  const d = new Date(date);
  const localDay = d.getDay();
  const diff = d.getDate() - localDay + (localDay === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
```

Example: If `date` is `2024-03-11T23:00:00-05:00` (which is March 12 UTC), `getDay()` returns the local day (Monday=1), but `toISOString()` returns the UTC date (March 12), producing the wrong week start.

**Fix:** Use UTC methods consistently, or use `date-fns`:

```js
import { startOfWeek, format } from 'date-fns';

function getMonday(date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}
```

---

### WR-04: `isValidDateString` accepts non-ISO date formats

**File:** `backend/src/controllers/weeklyPlan.controller.js:41-45`
**Issue:** The function relies solely on `new Date(str)` parsing, which accepts many ambiguous formats like `'01/02/2024'` (interpreted differently by locale), `'2024/03/11'`, or `'March 11 2024'`. The API contract specifies YYYY-MM-DD but the validation doesn't enforce it.

**Fix:** Add a regex check before the Date parse:

```js
function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}
```

---

### WR-05: Missing validation for `completed` field in `toggleComplete` handler

**File:** `backend/src/controllers/weeklyPlan.controller.js:374`
**Issue:** The `completed` field in the request body is not validated for type. If omitted or passed as a non-boolean value, `completed === true` evaluates to `false`, silently treating the operation as "mark incomplete" without any error to the caller. If `completed` is passed as `"false"` (string), it evaluates to `false`, which matches the string value but is coincidental behavior.

**Fix:** Add validation:

```js
if (typeof completed !== 'boolean') {
  return errorResponse(res, 'completed must be a boolean', 400, 'VALIDATION_ERROR');
}
```

---

### WR-06: `/toggle-complete` endpoint has no rate limiter

**File:** `backend/src/routes/weeklyPlan.routes.js:14`
**Issue:** All other POST endpoints in this router (`/generate`, `/regenerate-day`, `/swap`) have dedicated rate limiters. The `/toggle-complete` endpoint has none, allowing rapid database writes without throttle.

**Fix:** Add a rate limiter, even a generous one:

```js
import weeklyPlanLimiter, { regenerateLimiter, swapLimiter, toggleCompleteLimiter } from '../middlewares/weeklyPlanRateLimiter.js';

router.post('/toggle-complete', toggleCompleteLimiter, weeklyPlanController.toggleComplete);
```

With a corresponding limiter in the middleware file:

```js
const toggleCompleteLimiter = rateLimit({
  windowMs: isTest ? 1000 : 1 * 60 * 1000,
  max: isTest ? 1000 : 60,
  keyGenerator: (req) => `user_${req.user.userId}`,
  handler: (req, res) => {
    // ...standard rate limit error response
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

### WR-07: Test does not verify what its name claims

**File:** `frontend/src/features/activities/components/__tests__/ActivityCalendarPage.test.jsx:110-116`
**Issue:** The test named "calls generateWeeklyPlan on Generate Week click" only runs:
```jsx
test('calls generateWeeklyPlan on Generate Week click', async () => {
  render(<ActivityCalendarPage />);
  await waitFor(() => {
    const btn = screen.getByText('Generate Week');
    expect(btn).toBeInTheDocument();
  });
});
```
It asserts the button exists in the DOM but never clicks it and never asserts that `generateWeeklyPlan` was called. The mock for `generateWeeklyPlan` is never verified for call count or arguments.

**Fix:** Add actual click and assertion:

```jsx
test('calls generateWeeklyPlan on Generate Week click', async () => {
  render(<ActivityCalendarPage />);
  await waitFor(() => {
    expect(screen.getByText('Generate Week')).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText('Generate Week'));
  await waitFor(() => {
    expect(generateWeeklyPlan).toHaveBeenCalledTimes(1);
  });
});
```

## Info

### IN-01: Dual `selectedDay` state across `CalendarPageLayout` and `ActivityCalendarPage`

**File:** `frontend/src/shared/calendar/CalendarPageLayout.jsx:31`
**File:** `frontend/src/features/activities/ActivityCalendarPage.jsx:15`

**Issue:** Both components independently manage `selectedDay` state. `CalendarPageLayout` clears its internal `selectedDay` on month change (line 46) but does not notify `ActivityCalendarPage`, which still holds the stale day. When the user selects a new day, the layout calls `externalOnDaySelect` which correctly propagates to the parent. Currently not producing wrong behavior, but creates coordination risk — any future feature that clears selection from the parent side would silently leave the layout holding stale state.

**Fix:** Either fully lift `selectedDay` state to the parent (making `CalendarPageLayout` a controlled component), or have the layout call `externalOnDaySelect(null)` on month change to keep both in sync.

---

### IN-02: Completion toggle button below recommended touch target size

**File:** `frontend/src/features/weekly-plan/components/DayActivityRow.jsx:59-61`

**Issue:** The completion circle toggle button is 28×28px, well below the WCAG-recommended 44×44px minimum touch target. On mobile, this can cause mis-taps.

**Fix:** Increase to at least 44×44px, or add invisible touch extension padding:

```jsx
// Increase size:
width: '44px',
height: '44px',
minWidth: '44px',
// Or keep visual 28px but add padding for touch:
padding: '8px',
// Combined with box-sizing: content-box
```

---

_Reviewed: 2026-05-31T10:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
