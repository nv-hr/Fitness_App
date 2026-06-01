---
phase: 34-calendar-shared-components
reviewed: 2026-05-31T22:12:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - frontend/src/shared/calendar/calendarUtils.js
  - frontend/src/shared/calendar/MonthNav.jsx
  - frontend/src/shared/calendar/CalendarGrid.jsx
  - frontend/src/shared/calendar/DayDetailPanel.jsx
  - frontend/src/shared/calendar/CalendarPageLayout.jsx
  - frontend/src/shared/calendar/hooks/useMonthData.js
  - frontend/src/shared/calendar/index.js
  - frontend/src/shared/calendar/__tests__/calendarUtils.test.js
  - frontend/src/shared/calendar/__tests__/CalendarGrid.test.jsx
  - frontend/src/shared/calendar/__tests__/DayDetailPanel.test.jsx
  - frontend/src/shared/calendar/__tests__/CalendarPageLayout.test.jsx
  - frontend/src/shared/calendar/__tests__/useMonthData.test.js
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: clean
---

# Phase 34: Code Review Report — Calendar Shared Components

**Reviewed:** 2026-05-31T22:12:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

**Tests executed:** All 33 tests pass (`vitest run` — 5 test files, 33 tests, 7.26s)

## Summary

The Calendar Shared Components implement a reusable calendar page layout with month navigation, a day grid (wrapping `react-day-picker`), a day detail panel slot, and a hook for fetching monthly plan data via TanStack Query. The code is generally clean, well-documented, and tests pass.

However, one **critical design defect** exists: `useMonthData` only populates the status map with days that have plan data from the API. Days that exist but weren't logged (especially past skipped days) receive no color coding, making the status system invisible for those days. Additionally, there are three warnings around unused imports, stale closure risk in navigation callbacks, and type brittleness at the `Map` API boundary.

## Critical Issues

### CR-01: Past days without plan data receive no status color coding

**File:** `frontend/src/shared/calendar/hooks/useMonthData.js:38-54`
**Issue:** The `dayStatusMap` is built by iterating only over `result.data.plan.days` returned from each weekly API fetch. If a day in the past has no plan data (user never logged it), it simply won't appear in the map. In `CalendarGrid.jsx:29-31`, the modifier functions only match days that exist in the map. The result: **past days without logged data look identical to future days** — they get no status modifier at all, instead of being colored as `PAST_INCOMPLETE`.

This defeats the entire purpose of the color-coded status system, which is to show at a glance which days were completed and which were missed or skipped.

**Impact:** A user who opens the calendar to view a past month will see a grid where most days have no color coding (unless they logged plans for every single day). The visual feedback that distinguishes "did the work" from "didn't do the work" is missing for all days without plan data.

**Fix (option A — in `useMonthData`):** After populating the map from API data, iterate over the full month grid (`buildMonthGrid`) and set a default status for any date not yet in the map. This ensures every visible day gets a status.

```js
// In useMonthData.js — add import for buildMonthGrid
import { getWeekStartsForMonth, buildMonthGrid, computeDayStatus } from '../calendarUtils.js';

// After line 54 — populate defaults for all grid days
const dayStatusMap = useMemo(() => {
  const map = new Map();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // 1. Fill from API data
  results.forEach(result => {
    if (!result.data?.plan?.days) return;
    result.data.plan.days.forEach(planDay => {
      const dateStr = planDay.date;
      const isPast = dateStr < todayStr;
      const status = computeDayStatus(dateStr, planDay, isPast);
      map.set(dateStr, status);
    });
  });

  // 2. Fill defaults for all grid days not covered by API data
  const allGridDays = buildMonthGrid(date);
  allGridDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (!map.has(dateStr)) {
      const isPast = dateStr < todayStr;
      map.set(dateStr, computeDayStatus(dateStr, null, isPast));
    }
  });

  return map;
}, [results, date]);
```

**Fix (option B — in `CalendarGrid`):** Add a fallback modifier that applies when no other modifier matched and the day is before today:

```js
// CalendarGrid.jsx — would require passing additional info or
// computing isPast inside the modifier
const modifiers = {
  incomplete: (day) => dayStatusMap?.get(format(day, 'yyyy-MM-dd')) === DAY_STATUS.INCOMPLETE,
  completed: (day) => dayStatusMap?.get(format(day, 'yyyy-MM-dd')) === DAY_STATUS.COMPLETED,
  pastIncomplete: (day) => {
    const status = dayStatusMap?.get(format(day, 'yyyy-MM-dd'));
    if (status) return status === DAY_STATUS.PAST_INCOMPLETE;
    // Default: past days without any status entry → past incomplete
    return isBefore(day, today) && !isSameDay(day, today);
  },
  ...
};
```

Option A is preferred because it keeps the status computation centralized in the hook.

## Warnings

### WR-01: Unused imports `startOfDay` and `startOfToday` in calendarUtils.js

**File:** `frontend/src/shared/calendar/calendarUtils.js:9-10`
**Issue:** `startOfDay` and `startOfToday` are imported from `date-fns` but never used anywhere in the module. No function in the file references them, and they are not re-exported.

Unused imports increase bundle size (though tree-shaking mitigates this) and create noise for future maintainers who may wonder if these functions are used somewhere.

**Fix:** Remove the unused imports:

```js
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isBefore,
  format,
} from 'date-fns';
```

### WR-02: `handleTodayClick` passes unnormalized date to `externalOnMonthChange`

**File:** `frontend/src/shared/calendar/CalendarPageLayout.jsx:40-45`
**Issue:** `handleMonthChange` normalizes the date via `startOfMonth(month)` before passing it to `externalOnMonthChange`. However, `handleTodayClick` passes the raw `new Date()` (line 41). Consumers relying on `externalOnMonthChange` to always receive a month-normalized date will get an inconsistent value when the "Today" button is used versus arrow navigation.

```js
// Line 34 — normalized
setCurrentMonth(startOfMonth(month));
if (externalOnMonthChange) externalOnMonthChange(month);  // NOT normalized

// Line 42-44 — raw today
setCurrentMonth(startOfMonth(today));
if (externalOnMonthChange) externalOnMonthChange(today);  // NOT normalized
```

Both paths pass unnormalized dates to the external callback. The only consumer-side difference is that `setCurrentMonth` receives `startOfMonth(month)` in one path and `startOfMonth(today)` in the other — but the external callback gets the raw value in both cases. If the external consumer expects to receive a month start, they should wrap the value themselves. This is inconsistent and confusing.

**Fix:** Normalize the date before passing to `externalOnMonthChange` in both callbacks:

```js
const handleMonthChange = useCallback((month) => {
  const normalized = startOfMonth(month);
  setCurrentMonth(normalized);
  setSelectedDay(null);
  if (externalOnMonthChange) externalOnMonthChange(normalized);
}, [externalOnMonthChange]);

const handleTodayClick = useCallback(() => {
  const today = startOfMonth(new Date());
  setCurrentMonth(today);
  setSelectedDay(null);
  if (externalOnMonthChange) externalOnMonthChange(today);
}, [externalOnMonthChange]);
```

### WR-03: No type/input validation for `dayStatusMap` — accepts `Map` or plain object, but plain object crashes

**File:** `frontend/src/shared/calendar/CalendarGrid.jsx:29-31`
**File:** `frontend/src/shared/calendar/CalendarPageLayout.jsx:21`
**Issue:** The documented contract for `dayStatusMap` is `Map<string, string>`, and the modifier functions use `.get()` (a Map method). If a consumer passes a plain object `{ '2026-06-01': 'incomplete' }` instead of a `new Map([...])`, the optional chaining `dayStatusMap?.get(...)` does not protect against this — it only guards against `null`/`undefined`. A plain object would throw `TypeError: dayStatusMap.get is not a function`.

Since this is JavaScript (not TypeScript), there is no compile-time type enforcement. A consumer could easily mistake the expected type, especially since plain objects are more common for key-value data than `Map`.

**Fix (option A):** Convert at the boundary — accept both forms defensively:

```js
// CalendarPageLayout.jsx
const normalizedMap = dayStatusMap instanceof Map
  ? dayStatusMap
  : new Map(Object.entries(dayStatusMap || {}));
```

**Fix (option B):** Document with a JSDoc `@throws` and add a runtime warning in development:

```js
if (process.env.NODE_ENV === 'development' && dayStatusMap && !(dayStatusMap instanceof Map)) {
  console.warn('CalendarGrid: dayStatusMap must be a Map instance. Received:', typeof dayStatusMap);
}
```

## Info

### IN-01: `CalendarPageLayout` accepts `error` prop but never renders it

**File:** `frontend/src/shared/calendar/CalendarPageLayout.jsx:16,23`
**Issue:** The component accepts an `error` prop (documented as "display handled by parent") but does not use it in any way. No error banner, no conditional rendering, nothing. This is an API design concern: consumers must inspect the error themselves and decide whether to hide this component entirely, or accept that errors are silently swallowed during rendering.

**Suggestion:** Either remove the `error` prop entirely, or render an error state within the component (e.g., inline error message replacing the grid).

### IN-02: `CalendarGrid` test `'calls onMonthChange when navigating months'` does not actually test navigation

**File:** `frontend/src/shared/calendar/__tests__/CalendarGrid.test.jsx:52-64`
**Issue:** The test name suggests it verifies month change navigation, but `hideNavigation={true}` means DayPicker renders no navigation buttons, and the test body only checks that `screen.getByText('June 2026')` is present. No navigation action is performed. The test is essentially a duplicate of the first render test.

**Suggestion:** Either rename the test to reflect what it actually tests (e.g., "renders with onMonthChange prop"), or add a meaningful interaction that triggers month change (keyboard arrow, swipe, etc.).

---

_Reviewed: 2026-05-31T22:12:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Tests: 33/33 passing_
