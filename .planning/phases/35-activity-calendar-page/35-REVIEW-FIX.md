---
phase: 35-activity-calendar-page
fixed_at: 2026-05-31T23:05:00Z
review_path: .planning/phases/35-activity-calendar-page/35-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 12
skipped: 0
status: all_fixed
---

# Phase 35: Code Review Fix Report

**Fixed at:** 2026-05-31T23:05:00Z
**Source review:** .planning/phases/35-activity-calendar-page/35-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 12
- Fixed: 12
- Skipped: 0

## Fixed Issues

### CR-01: Swap button calls `onSwap()` without passing `activityId`

**Files modified:** `frontend/src/features/weekly-plan/components/DayActivityRow.jsx`
**Applied fix:** Changed `onSwap()` to `onSwap(activity.activity_id)` so the swap handler receives the correct activity ID. Previously every swap attempt failed silently because the backend rejected `undefined` as `activityId`.

### CR-02: `toggleComplete` passes activity array index as `dayIndex` — wrong day is modified

**Files modified:** `frontend/src/features/activities/ActivityCalendarPage.jsx`
**Applied fix:** Replaced `idx` (activity position within the day's array) with `((selectedDay.getDay() + 6) % 7)` (correct day-of-week index: Mon=0..Sun=6) in both the `onSwap` and `onToggle` callbacks. Previously, clicking the 4th activity on Monday (idx=3) would target Thursday instead.

### CR-03: Unsafe cleanup of shared `<style>` element breaks spinner animation

**Files modified:** 
- `frontend/src/features/weekly-plan/components/DayActivityRow.jsx`
- `frontend/src/features/activities/ActivityCalendarPage.jsx`

**Applied fix:** Removed the `useEffect` that injected/removed the `#swap-spin-style` element from `DayActivityRow` (which had a cleanup that destroyed the shared style when any row unmounted). Added a one-time style injection with no cleanup in `ActivityCalendarPage` so the keyframe animation persists for the app's lifetime.

### WR-01: Activity index passed as `dayIndex` in swap handler

**Files modified:** `frontend/src/features/activities/ActivityCalendarPage.jsx`
**Applied fix:** Same as CR-02 — swap handler now receives `((selectedDay.getDay() + 6) % 7)` as the day index instead of `idx`.

### WR-02: Inconsistent `activity_id` fallback between Set initialization and lookup

**Files modified:** `frontend/src/features/activities/ActivityCalendarPage.jsx`
**Applied fix:** Removed the `?? idx` fallback from the `key` prop, `onToggle` callback args, and `completed` lookup. The backend always returns valid `activity_id` values, so the fallback was unnecessary and created a latent bug where the Set initialization stored `undefined` but the lookup searched for a numeric index.

### WR-03: `getMonday` mixes local time with UTC — potential off-by-one-day

**Files modified:** `backend/src/controllers/weeklyPlan.controller.js`
**Applied fix:** Replaced the manual `getMonday` implementation (which mixed `d.getDay()`/`d.getDate()` in local time with `d.toISOString()` in UTC) with a date-fns version using `startOfWeek(date, { weekStartsOn: 1 })` and `format(monday, 'yyyy-MM-dd')`. Added `import { startOfWeek, format } from 'date-fns'`.

### WR-04: `isValidDateString` accepts non-ISO date formats

**Files modified:** `backend/src/controllers/weeklyPlan.controller.js`
**Applied fix:** Added regex check `/^\d{4}-\d{2}-\d{2}$/` before the `Date` parse, ensuring only YYYY-MM-DD format is accepted. Previously, ambiguous formats like `'01/02/2024'` or `'March 11 2024'` would pass validation.

### WR-05: Missing validation for `completed` field in `toggleComplete` handler

**Files modified:** `backend/src/controllers/weeklyPlan.controller.js`
**Applied fix:** Added `if (typeof completed !== 'boolean')` validation after activityId validation in `toggleComplete`. Previously, a missing or non-boolean `completed` value would silently be treated as "mark incomplete" without any error.

### WR-06: `/toggle-complete` endpoint has no rate limiter

**Files modified:**
- `backend/src/middlewares/weeklyPlanRateLimiter.js`
- `backend/src/routes/weeklyPlan.routes.js`

**Applied fix:** Added `toggleCompleteLimiter` (60 requests per minute per user) to the rate limiter middleware, exported it alongside existing limiters, and applied it to the `/toggle-complete` route in the router.

### WR-07: Test does not verify what its name claims

**Files modified:** `frontend/src/features/activities/components/__tests__/ActivityCalendarPage.test.jsx`
**Applied fix:** Added `fireEvent.click(screen.getByText('Generate Week'))` and `expect(generateWeeklyPlan).toHaveBeenCalledTimes(2)` (the component's auto-generation fires once on mount with empty dayStatusMap, so click produces the second call). Also added `import { fireEvent } from '@testing-library/react'`.

### IN-01: Dual `selectedDay` state across `CalendarPageLayout` and `ActivityCalendarPage`

**Files modified:** `frontend/src/shared/calendar/CalendarPageLayout.jsx`
**Applied fix:** Added `if (externalOnDaySelect) externalOnDaySelect(null)` calls in both `handleMonthChange` and `handleTodayClick` to notify the parent (`ActivityCalendarPage`) to clear its stale `selectedDay` when the month changes. Updated both `useCallback` dependency arrays to include `externalOnDaySelect`.

### IN-02: Completion toggle button below recommended touch target size

**Files modified:** `frontend/src/features/weekly-plan/components/DayActivityRow.jsx`
**Applied fix:** Increased the completion toggle button from 28×28px to 44×44px (with 8px padding) to meet the WCAG-recommended minimum touch target of 44×44px.

---

_Fixed: 2026-05-31T23:05:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
