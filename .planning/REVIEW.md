---
phase: v1.8-ui-consolidation
reviewed: 2026-06-01T12:00:00Z
depth: deep
files_reviewed: 10
files_reviewed_list:
  - frontend/src/app/Router.jsx
  - frontend/src/features/activities/ActivityPage.jsx
  - frontend/src/features/activities/components/ActivityCalendarSection.jsx
  - frontend/src/features/activities/components/ActivityLogSection.jsx
  - frontend/src/features/activities/index.js
  - frontend/src/features/food-log/components/FoodLogPage.jsx
  - frontend/src/features/food-log/components/FoodLogForm.jsx
  - frontend/src/features/food-log/components/MealCalendarSection.jsx
  - frontend/src/features/food-log/index.js
  - frontend/src/shared/calendar/CalendarPageLayout.jsx
findings:
  critical: 1
  warning: 7
  info: 4
  total: 12
status: issues_found
---

# Phase v1.8: Code Review Report — UI Consolidation (Phases 38-41)

**Reviewed:** 2026-06-01T12:00:00Z
**Depth:** deep (cross-file call chain tracing)
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed 10 source files implementing the v1.8 UI consolidation: tab-based page layouts for Activity and Food Log features, extracted calendar/log sections, and Router cleanup. The architecture is clean overall, but one **CRITICAL** bug causes the Activity Plan tab to never load calendar data. Several warnings around race conditions, error suppression, code duplication, and unused code were also found.

---

## Critical Issues

### CR-01: Missing required `fetchWeekFn` argument — Activity calendar data never loads

**File:** `frontend/src/features/activities/ActivityPage.jsx:15`
**Issue:** `useMonthData(currentMonth)` is called with only 1 argument, but the hook signature is `useMonthData(date, fetchWeekFn)` — it requires a second argument (`fetchWeekFn`) that fetches weekly plan data from the API. Without it, `fetchWeekFn` is `undefined`, and TanStack Query's `queryFn` (`() => fetchWeekFn(weekStart)`) throws a `TypeError` for every week query.

**Impact:** All 5-6 parallel week queries fail silently (caught by TanStack Query). The Activity Plan calendar shows an error banner ("Failed to load calendar data") and all days are marked with default status (`incomplete`/`pastIncomplete`). The Activity Plan tab is effectively broken — users see no plan data, day plans never load, and the auto-generate feature never fires because `dayStatusMap` is populated with default values from `buildMonthGrid`, not from actual API data.

**Call chain:**
```
ActivityPage.jsx:15         → useMonthData(currentMonth)          ← fetchWeekFn=undefined ✗
shared/calendar/hooks/useMonthData.js:28  → queryFn: () => fetchWeekFn(weekStart)  ← TypeError thrown
TanStack Query catches error → all queries fail → dayStatusMap filled with defaults
ActivityCalendarSection.jsx  → receives error={TypeError} from props → shows error banner
```

**Fix:** Pass the weekly plan fetch function as the second argument. Import `getWeeklyPlan` from the activity calendar API and pass it:

```jsx
// ActivityPage.jsx line 15 — change from:
const { dayStatusMap, loading, error } = useMonthData(currentMonth);

// To:
const { dayStatusMap, loading, error } = useMonthData(currentMonth, getWeeklyPlan);
```

This requires adding the import:
```jsx
import { getWeeklyPlan } from './api/activityCalendarApi.js';
```

---

## Warnings

### WR-01: Race condition in debounced search — stale responses overwrite latest results

**File:** `frontend/src/features/food-log/components/FoodSearch.jsx:19-38`
**Issue:** The debounce timer cleanup (`clearTimeout`) prevents the timer callback from executing for stale queries, but it cannot cancel an in-flight `fetch` request. If the user types "apple" → 300ms timer fires → request A is sent → user types "apples" → request B is sent → response A arrives first and sets stale results → response B arrives and corrects them. The UI flickers between stale and correct results.

**Impact:** Brief visual flicker where search results show data for an earlier query before correcting to the latest query. User-visible race condition.

**Fix:** Use an AbortController or a render-cycle counter to discard stale responses:

```jsx
useEffect(() => {
  if (query.length < 2) {
    setResults([]);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(async () => {
    setLoading(true);
    try {
      const response = await searchFoods(query, controller.signal);
      // Only update if this request was not aborted
      setResults(response.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, 300);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, [query]);
```

### WR-02: Empty catch blocks suppress errors — makes debugging production issues harder

**Files:** Multiple locations
| File | Line |
|------|------|
| `frontend/src/features/activities/ActivityPage.jsx` | 26 |
| `frontend/src/features/food-log/components/FoodLogPage.jsx` | 27 |
| `frontend/src/features/activities/components/ActivityLogSection.jsx` | 24, 54 |
| `frontend/src/features/food-log/components/FoodLogForm.jsx` | 53 |

**Issue:** Catch blocks are either completely empty (`catch { // Silently fail }`) or only update state without logging. When APIs fail (due to network errors, backend changes, auth issues), the error is swallowed with no trace. In production, this makes it impossible to diagnose why summary data or history data silently disappears.

**Impact:** Hard-to-diagnose "it works on my machine" bugs. Backend failures manifest as missing UI sections with no console trace and no user feedback.

**Fix:** Add `console.error` (or a shared logger) to every catch block that currently has only a silent handler:

```jsx
catch (err) {
  console.error('Failed to load activity summary:', err);
  // Silently fail — summary is optional UI
}
```

### WR-03: Significant code duplication between ActivityCalendarSection and MealCalendarSection

**Files:**
- `frontend/src/features/activities/components/ActivityCalendarSection.jsx` (324 lines)
- `frontend/src/features/food-log/components/MealCalendarSection.jsx` (300 lines)

**Issue:** These two components share ~70% identical logic:
- Day plan fetch-on-select (`useEffect` with `selectedDay` dependency + cancellation flag)
- Auto-generate on mount (`useEffect` with `currentMonth`/`dayStatusMap` deps + `monthNavRef` guard)
- Retry-after countdown timer (`useEffect` with `setInterval` pattern)
- `CalendarPageLayout` usage pattern
- Month/day callback wiring via `useCallback`
- Loading/error/empty state rendering
- Toast/notification patterns
- `isPast` computation

The differences are minor: ActivityCalendarSection uses `getWeeklyPlan`/`generateWeeklyPlan`/`swapActivity`, while MealCalendarSection uses `getDailyMealPlan`/`generateDailyMealPlan`/`logMeals`. MealCalendarSection has `formatCountdown` extracted as a function; ActivityCalendarSection has it inlined. Their `onSwap`/`onToggle` vs `handleLogMeal` logic differs, but the infrastructure is identical.

**Impact:** ~400 lines of duplicated boilerplate. Any bug fix or enhancement to the auto-generate logic, retry timer, or cancellation pattern must be applied to both files. This has already caused a minor inconsistency: `ActivityCalendarSection` uses the shared `Toast` component, while `MealCalendarSection` renders its own inline toast with different styling.

**Fix:** Extract a shared composable hook (e.g., `useCalendarPlan(opts)`) that encapsulates the common patterns:

```js
// shared/calendar/hooks/useCalendarPlan.js
export function useCalendarPlan({ fetchDayPlan, generatePlan, onGenerateSuccess }) {
  // selectedDay, currentMonth, dayPlan, planLoading, generating,
  // genRetryAfter, monthNavRef, handleMonthChange, handleDaySelect,
  // fetchForDay useEffect, autoGenerate useEffect, retryCountdown useEffect
  // ... returns all shared state and handlers
}
```

### WR-04: `defaultDay` prop added to CalendarPageLayout but never consumed

**File:** `frontend/src/shared/calendar/CalendarPageLayout.jsx:25`
**Issue:** The `defaultDay` prop and its associated `useEffect` sync (lines 61-66) were introduced as an enhancement, but no consumer in this review actually passes `defaultDay`:

- `FoodLogPage.jsx` → `MealCalendarSection` → `CalendarPageLayout` — no `defaultDay` prop
- `ActivityPage.jsx` → `ActivityCalendarSection` → `CalendarPageLayout` — no `defaultDay` prop

The `defaultDay` parameter defaults to `null`, and the guard `if (defaultDay)` prevents the effect from ever running. This is dead code unless a future component passes the prop.

**Impact:** Unnecessary code complexity. The `useEffect` creates a dependency on `externalOnDaySelect` which is also unused. If left dead, it's confusing for future maintainers.

**Fix:** Either remove `defaultDay` and its effect, or add a TODO comment explaining the intended future consumer. If keeping it, at minimum remove the `useEffect` guard's dead branch:

```jsx
// If keeping for future use, add a usage note:
/**
 * defaultDay — Currently unused. Reserved for parent-driven day selection sync.
 * Consumers should pass a Date to programmatically set the selected day.
 */
```

### WR-05: Stale closure in MealCalendarSection auto-generate effect captures `selectedDay`

**File:** `frontend/src/features/food-log/components/MealCalendarSection.jsx:82-97`
**Issue:** The async IIFE inside the auto-generate effect captures `selectedDay` from the closure when the effect runs. This value becomes stale if the user selects a different day while the `generateDailyMealPlan` API call is in-flight. If the user had no day selected (selectedDay=null), navigates to today, and the auto-generate fires before the dayStatusMap populates, the null-check `if (res.data?.plan && selectedDay)` prevents execution. But if the user selected a day, then auto-gen fires with that selection, and the user switches to a different day before the response arrives, the stale `selectedDay` could set `dayPlan` to the wrong day's data.

**Impact:** Brief UI inconsistency — after auto-generate completes, the `dayPlan` might correspond to a different day than what the user currently has selected. This clears on the next `fetchDayPlan` effect run (when the user clicks a new day), so it's a minor transient glitch.

**Fix:** Use a ref or check the current value via a ref:

```jsx
const selectedDayRef = useRef(selectedDay);
selectedDayRef.current = selectedDay;

// Inside the IIFE:
if (res.data?.plan && selectedDayRef.current) {
  const selStr = format(selectedDayRef.current, 'yyyy-MM-dd');
  if (selStr === todayStr) setDayPlan(res.data.plan);
}
```

### WR-06: Duplicated tab bar UI between ActivityPage and FoodLogPage

**Files:**
- `frontend/src/features/activities/ActivityPage.jsx:46-75`
- `frontend/src/features/food-log/components/FoodLogPage.jsx:56-85`

**Issue:** Both pages render an identical Plan/Log tab bar with 30 lines of inline styles each (border, colors, font-weight, flex layout, active indicators). The only differences are the `h2` heading text. This is ~60 lines of duplicated JSX across the codebase.

**Impact:** Maintainability — any style change to the tab bar (e.g., color, height, accessibility attributes like `role="tablist"` and `aria-selected`) must be applied in two places.

**Fix:** Extract a shared `TabBar` component:

```jsx
// shared/components/TabBar.jsx
export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1, padding: '0.75rem 1rem', cursor: 'pointer', minHeight: '44px',
            border: 'none', background: 'none',
            fontWeight: activeTab === tab.id ? 700 : 400,
            color: activeTab === tab.id ? '#16a34a' : '#666',
            borderBottom: activeTab === tab.id ? '2px solid #16a34a' : '2px solid transparent',
            marginBottom: '-2px', fontSize: '1rem',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### WR-07: `handleQuickAdd` treats `last_portion_grams: 0` as falsy

**File:** `frontend/src/features/food-log/components/FoodLogForm.jsx:65-73`
**Issue:** The `handleQuickAdd` function checks `food.last_portion_grams` in a boolean context. If `last_portion_grams` is legitimately `0` (a food item with a recorded 0-gram last portion), the check falls through to `food.calories`, which is a per-100g value being used as if it were a total value. This creates a mismatch: `per100g` gets set to `food.calories` (an absolute value) instead of computing a per-100g conversion.

**Impact:** If a user has a food with `last_portion_grams: 0`, the quick-add feature miscalculates the calories for the preset portion value. The `portion` defaults to `100` (grams), and the `calories_per_100g` is set to the raw `food.calories` value instead of being scaled. The logged calorie count would be wrong.

**Fix:** Use an explicit check:

```jsx
const per100g = food.last_portion_grams != null && food.last_portion_grams > 0
  ? Math.round((food.calories * 100) / food.last_portion_grams)
  : food.calories;
```

---

## Info

### IN-01: Today string computed on every render in multiple components

**Files:**
- `frontend/src/features/activities/ActivityPage.jsx:17`
- `frontend/src/features/food-log/components/FoodLogPage.jsx:18`
- `frontend/src/features/food-log/components/FoodLogForm.jsx:21`

`const today = new Date().toISOString().split('T')[0];` runs on every render. While string equality prevents spurious `useEffect` re-runs, this is still unnecessary work. Consider `useMemo` or a shared utility if this appears in many components.

### IN-02: Retry countdown display format differs between calendar sections

**Files:**
- `frontend/src/features/activities/components/ActivityCalendarSection.jsx:260`
- `frontend/src/features/food-log/components/MealCalendarSection.jsx:10-12`

`ActivityCalendarSection` inlines the countdown format: `Math.floor(genRetryAfter / 60)}:{String(genRetryAfter % 60).padStart(2, '0')}`. `MealCalendarSection` uses `formatCountdown()` helper. The `FormatCountdown` in `DayActivityRow.jsx` provides a third implementation. Consolidate into a shared utility.

### IN-03: `startOfMonth` import only used in initializer

**File:** `frontend/src/features/food-log/components/FoodLogPage.jsx:2`

`startOfMonth` from date-fns is imported but only used once in `useState(() => startOfMonth(new Date()))`. This is a minor code smell — consider whether the import is justified for a single use.

### IN-04: Development-only `console.warn` in CalendarGrid for type coercion

**File:** `frontend/src/shared/calendar/CalendarGrid.jsx:33-35`

The component includes a defensive type-coercion path for `dayStatusMap` with a `console.warn` in development. This is good defensive programming but also indicates API boundary type inconsistency that should be fixed at the source.

---

_Reviewed: 2026-06-01T12:00:00Z_
_Reviewer: gsd-code-reviewer (deep mode)_
_Depth: deep — cross-file call chain tracing completed_
