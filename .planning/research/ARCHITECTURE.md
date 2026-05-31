# Architecture Research

**Domain:** Calendar-Based Plan UI for Fitness Tracking App
**Researched:** 2026-05-31
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    ROUTER (app/Router.jsx)                        │
│  /activity-calendar  /meal-calendar  /profile  /food-log ...     │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────────┐
│                    FEATURE PAGE LAYERS                             │
│                                                                   │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │ Activity Calendar │   │  Meal Calendar   │  (NEW v1.7)       │
│  │ Page             │   │  Page            │                    │
│  └────────┬─────────┘   └────────┬─────────┘                    │
│           │                      │                               │
│  ┌────────┴──────────────────────┴─────────┐                     │
│  │        SHARED CALENDAR LAYER             │  (NEW)             │
│  │  CalendarGrid  DayCell  MonthNav         │                     │
│  │  CalendarPageLayout  useMonthRange       │                     │
│  └────────┬──────────────────────┬─────────┘                     │
│           │                      │                               │
│  ┌────────┴─────────┐  ┌────────┴─────────┐                     │
│  │ ActivityDayDetail│  │  MealDayDetail   │  (NEW)              │
│  │ Panel            │  │  Panel           │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           │                      │                               │
│  ┌────────┴──────────────────────┴─────────┐                     │
│  │      EXISTING COMPONENT REUSE LAYER      │                     │
│  │  DayActivityRow  MealRow  FallbackBanner │                     │
│  │  Toast  RateLimitedButton               │                     │
│  └──────────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────────┐
│                      API CLIENT LAYER                              │
│  shared/lib/http.js (apiGet/apiPost)                              │
│  features/*/api/*.js (weeklyPlanApi, mealPlanApi, foodLogApi...)  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────────┐
│                    BACKEND API LAYER                               │
│  Express 5 ESM routes → controllers → services → repositories     │
│  GET/POST /api/weekly-plans                                       │
│  GET/POST /api/meal-plans                                         │
│  GET /api/food/history, GET /api/activities/history               │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CalendarGrid** | Renders month grid: 7-column layout, weeks as rows, day cells. Handles prev/next month navigation. | Shared `features/calendar/` — pure presentational, receives `year`, `month`, `days[]`, `onDayClick` |
| **DayCell** | Single day in grid. Color-coded background (blue/green/grey/white). Past days non-interactive. | Shared `features/calendar/` — receives `dayStatus` enum, `date`, `onClick` |
| **CalendarPageLayout** | Layout shell: title row + generate button + calendar grid + day detail panel. Manages selected-day state. | Base wrapper for both calendar pages |
| **DayDetailPanel** | Container that shows day's content when a day is clicked. Renders a title bar (date + status) and a scrollable content area. | Shared — renders different children based on page type |
| **ActivityCalendarPage** | Full page replacing ActivitiesPage. Loads weekly plans for month range, computes per-day status, renders CalendarPageLayout with ActivityDayDetail. | New feature page |
| **MealCalendarPage** | Full page replacing FoodLogPage. Loads weekly meal plans for month range, computes per-day status, renders CalendarPageLayout with MealDayDetail. | New feature page |
| **ActivityDayDetail** | Detail panel content for activity days. Renders DayActivityRow per activity, completion toggle, swap button. Past days are read-only. | Renders existing DayActivityRow |
| **MealDayDetail** | Detail panel content for meal days. Renders MealRow per meal item per meal type, log-to-diary button. Past days read-only. | Renders existing MealRow |

## Recommended Project Structure

```
frontend/src/
├── features/
│   ├── activities/                  # EXISTING — activity logging, pool, history
│   │   └── components/
│   │       ├── ActivitiesPage.jsx   # KEPT — still has ActivityLogForm, History, Pool
│   │       ├── ActivityCard.jsx     # KEPT — used in ActivityPool
│   │       ├── ActivityLogForm.jsx  # KEPT
│   │       ├── ActivityHistory.jsx  # KEPT
│   │       ├── ActivityPlanSection.jsx  # REMOVED — replaced by ActivityCalendarPage
│   │       └── ...
│   │
│   ├── food-log/                    # EXISTING — food search, manual logging
│   │   └── components/
│   │       ├── FoodLogPage.jsx      # KEPT — manual food logging still needed
│   │       ├── DailyMealPlanSection.jsx  # REMOVED — replaced by MealCalendarPage
│   │       ├── FoodSearch.jsx       # KEPT
│   │       ├── FoodLogTable.jsx     # KEPT
│   │       ├── CalorieSummary.jsx   # KEPT
│   │       └── ...
│   │
│   ├── weekly-plan/                 # EXISTING — WILL BE REMOVED after migration
│   │   └── components/
│   │       ├── WeeklyPlanPage.jsx   # REMOVED — replaced by ActivityCalendarPage
│   │       ├── DayCard.jsx          # REMOVED — replaced by CalendarGrid + DayDetailPanel
│   │       ├── DayActivityRow.jsx   # KEPT — reused in ActivityDayDetail
│   │       ├── RateLimitedButton.jsx # KEPT — reused for generate action
│   │       ├── FallbackBanner.jsx   # KEPT — reused for LLM fallback state
│   │       ├── Toast.jsx            # KEPT — reused for rate-limit toasts
│   │       └── EmptyStatePlan.jsx   # REMOVED
│   │
│   ├── meal-plan/                   # EXISTING — WILL BE REMOVED after migration
│   │   └── components/
│   │       ├── MealPlanPage.jsx     # REMOVED — replaced by MealCalendarPage
│   │       ├── DayMealCard.jsx      # REMOVED — replaced by CalendarGrid + MealDayDetail
│   │       ├── MealRow.jsx          # KEPT — reused in MealDayDetail
│   │       └── ...
│   │
│   ├── calendar/                    # NEW — shared calendar components
│   │   ├── components/
│   │   │   ├── CalendarGrid.jsx     # NEW — month grid layout
│   │   │   ├── DayCell.jsx          # NEW — individual day cell
│   │   │   ├── CalendarPageLayout.jsx  # NEW — layout shell
│   │   │   ├── DayDetailPanel.jsx   # NEW — detail panel container
│   │   │   └── MonthNav.jsx         # NEW — prev/next month controls
│   │   ├── hooks/
│   │   │   └── useMonthRange.js     # NEW — month date math + week boundary calc
│   │   ├── utils/
│   │   │   └── calendarUtils.js     # NEW — date grid building, day status compute
│   │   ├── api/
│   │   │   └── calendarApi.js       # NEW — month-range data fetch composition
│   │   └── index.js
│   │
│   ├── activity-calendar/           # NEW — activity calendar page
│   │   ├── components/
│   │   │   ├── ActivityCalendarPage.jsx  # NEW — replaces ActivitiesPage + WeeklyPlanPage
│   │   │   └── ActivityDayDetail.jsx     # NEW — detail panel for activity days
│   │   ├── hooks/
│   │   │   └── useActivityMonthData.js   # NEW — fetches monthly plan + computes status
│   │   ├── api/
│   │   │   └── activityCalendarApi.js    # NEW — compositions on weeklyPlanApi
│   │   └── index.js
│   │
│   ├── meal-calendar/               # NEW — meal calendar page
│   │   ├── components/
│   │   │   ├── MealCalendarPage.jsx     # NEW — replaces FoodLogPage + MealPlanPage
│   │   │   └── MealDayDetail.jsx        # NEW — detail panel for meal days
│   │   ├── hooks/
│   │   │   └── useMealMonthData.js      # NEW — fetches monthly meals + computes status
│   │   ├── api/
│   │   │   └── mealCalendarApi.js       # NEW — compositions on mealPlanApi + foodLogApi
│   │   └── index.js
│   │
│   └── ... (auth, profile remain unchanged)
│
├── shared/
│   ├── hooks/
│   │   └── useResponsive.js         # EXISTING
│   └── lib/
│       └── http.js                  # EXISTING
│
├── app/
│   ├── App.jsx                      # UPDATE routes
│   ├── Providers.jsx                # EXISTING
│   └── Router.jsx                   # UPDATE — add /activity-calendar, /meal-calendar routes
│
└── main.jsx
```

### Structure Rationale

- **`features/calendar/`:** Shared components for both calendar types. Avoids duplicating month grid logic. The CalendarGrid is purely presentational — it doesn't know about activities or meals, only receives status enums.
- **`features/activity-calendar/` and `features/meal-calendar/`:** Separate page directories following the existing `features/<name>/` pattern. Each owns its data-fetching hook and detail panel. This keeps concerns separated — activity-specific swap/logic doesn't leak into meal-land.
- **Existing components stay in place, not duplicated:** `DayActivityRow`, `MealRow`, `FallbackBanner`, `Toast` remain in their original feature directories. The new calendar pages import them directly. This avoids code duplication and keeps maintenance centralized. When the old `weekly-plan/` and `meal-plan/` features are eventually removed, these surviving components can be promoted to `shared/` at that time.
- **Hooks for data composition:** `useActivityMonthData` and `useMealMonthData` encapsulate the multi-week data fetch logic. They determine which weekStarts to fetch based on the viewed month, aggregate the results, and compute per-day status. Keeping this in hooks (not components) keeps detail panels clean and testable.

## Architectural Patterns

### Pattern 1: Calendar Data Composition from Existing Weekly Endpoints

**What:** The month view needs data for a calendar-month range (28-31 days), but existing endpoints return weekly data (7 days at a time). The strategy is to determine which weeks overlap with the viewed month, fetch each week's plan, and aggregate the days.

**When to use:** When integrating a calendar UI with an existing week-oriented data model. No backend changes needed.

**Trade-offs:**
- Pro: Zero backend changes — works with existing `GET /api/weekly-plans` and `GET /api/meal-plans`
- Pro: Frontend-only change, deployable independently
- Con: Up to 5-6 parallel API calls per month render (acceptable — same data flow as loading 5 weekly plans)
- Con: Week boundaries don't align with month boundaries, so we fetch partial edge weeks

**Example — Month data composition:**

```javascript
// features/calendar/utils/calendarUtils.js

/**
 * Given a year/month, return the weekStarts (Mondays) that overlap with this month.
 * e.g., June 2026 → ['2026-05-25', '2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']
 */
export function getWeekStartsForMonth(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // First Monday on or before the 1st of the month
  const firstMonday = new Date(firstDay);
  const dayOfWeek = firstMonday.getDay(); // 0=Sun, 1=Mon, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstMonday.setDate(firstMonday.getDate() + diff);
  
  // Generate weekStarts until we pass the last day of month
  const weekStarts = [];
  const cursor = new Date(firstMonday);
  while (cursor <= lastDay || weekStarts.length === 0) {
    weekStarts.push(cursor.toISOString().split('T')[0]);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weekStarts; // typically 5-6 entries
}

/**
 * Build a grid of days for display: 6 rows × 7 columns.
 * Each cell has: { date: '2026-06-01', dayOfMonth: 1, isCurrentMonth: true }
 */
export function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Days before 1st
  
  const grid = [];
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startPad);
  
  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + row * 7 + col);
      const dateStr = d.toISOString().split('T')[0];
      week.push({
        date: dateStr,
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
      });
    }
    grid.push(week);
  }
  return grid;
}
```

### Pattern 2: Per-Day Status Computation

**What:** Each day in the calendar gets a color-coded status. The status is computed from multiple data sources (plan data + logged activity/food data). The computation is a pure function.

**When to use:** When you need to merge plan generation status with actual logging status to show progress.

**Trade-offs:**
- Pro: Pure function — easy to test
- Pro: Computed client-side from existing data — no new backend fields
- Con: Must keep status computation in sync with plan data format changes

**Status enum:**

```javascript
// features/calendar/utils/calendarUtils.js

export const DAY_STATUS = {
  EMPTY_FUTURE: 'empty_future',     // No plan, future date — no color
  HAS_PLAN_INCOMPLETE: 'incomplete', // Plan exists, not all logged — BLUE
  HAS_PLAN_COMPLETED: 'completed',   // All activities/meals logged — GREEN
  MISSED_PAST: 'missed',            // Past date, nothing logged — GREY
  REST_DAY: 'rest_day',             // Rest day in plan — GREEN (completed)
  TODAY_INCOMPLETE: 'today_incomplete', // Today, not done — BLUE
  TODAY_COMPLETED: 'today_completed',   // Today, done — GREEN
  READ_ONLY_PAST: 'read_only_past', // Past day with logged data (viewable) — GREY
  FUTURE: 'future',                 // Future day, no plan — no fill
};

/**
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {object|null} planDay - Day data from weekly plan (activities[], rest_day, etc.)
 * @param {array} loggedEntries - Activities/food logged for this day
 * @param {boolean} isPast - Whether this day is in the past
 * @returns {string} DAY_STATUS key
 */
export function computeDayStatus(dateStr, planDay, loggedEntries, isPast) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = dateStr === today;
  
  if (planDay?.rest_day) return DAY_STATUS.REST_DAY;
  
  if (planDay?.activities?.length > 0 || planDay?.meals?.length > 0) {
    const allLogged = planDay.activities
      ? planDay.activities.every(a => a.logged)
      : planDay.meals.every(m => (m.items || []).every(i => i.logged));
    
    if (allLogged) return isToday ? DAY_STATUS.TODAY_COMPLETED : DAY_STATUS.HAS_PLAN_COMPLETED;
    return isToday ? DAY_STATUS.TODAY_INCOMPLETE : DAY_STATUS.HAS_PLAN_INCOMPLETE;
  }
  
  // No plan exists for this day
  if (isPast) return loggedEntries.length > 0 ? DAY_STATUS.READ_ONLY_PAST : DAY_STATUS.MISSED_PAST;
  return DAY_STATUS.FUTURE;
}
```

**Color mapping (to apply as cell background):**

| Status | Background Color | Hex |
|--------|-----------------|-----|
| incomplete / today_incomplete | Blue (incomplete tasks) | `#dbeafe` |
| completed / today_completed / rest_day | Green (all done) | `#dcfce7` |
| missed / read_only_past | Grey (can't interact) | `#f3f4f6` |
| empty_future / future | White/transparent | `#ffffff` |

### Pattern 3: Two-Phase Data Loading (Status First, Detail on Demand)

**What:** The calendar renders the month grid with color-coded status ASAP. Detailed day content (activity cards, meal rows) loads only when a user clicks a day. Status data is computed from lightweight plan headers; detail data may come from the same API response (already cached).

**When to use:** When the detail for a single day could be content-heavy and most days won't be clicked.

**Trade-offs:**
- Pro: Month grid renders immediately from plan data — no second round-trip
- Pro: Detail panel data is already in memory from the weekly-plan fetch
- Con: Full plan data for all 5 weeks is loaded upfront (acceptable — same data already loaded for status)
- Con: If plans are very large, could be wasteful (mitigated: existing plans are small, < 50KB for a week)

**Data flow:**

```
User navigates to ActivityCalendarPage
    ↓
useActivityMonthData(year, month)
    ↓
getWeekStartsForMonth(year, month) → ['2026-06-01', '2026-06-08', ...]
    ↓
Promise.all(weekStarts.map(ws => getWeeklyPlan(ws)))
    ↓
Aggregate: { [dateString]: planDayData }
Compute: { [dateString]: status }
    ↓
Render CalendarGrid with status map
    ↓
User clicks a day
    ↓
Look up planDayData[dateStr] (already in memory from fetch)
    ↓
Render ActivityDayDetail with planDayData
```

### Pattern 4: Existing Component Reuse Strategy

**What:** The new calendar pages reuse existing components (`DayActivityRow`, `MealRow`, `FallbackBanner`, `Toast`, `RateLimitedButton`) by importing them directly. No duplication — the old pages and new calendar pages coexist during migration.

**When to use:** When incrementally replacing pages — new UI reuses existing leaf components.

**Import map:**

| Calendar Component | Imports From |
|-------------------|--------------|
| ActivityDayDetail | `DayActivityRow` from `features/weekly-plan/components/DayActivityRow.jsx` |
| | `FallbackBanner` from `features/weekly-plan/components/FallbackBanner.jsx` |
| MealDayDetail | `MealRow` from `features/meal-plan/components/MealRow.jsx` |
| ActivityCalendarPage | `RateLimitedButton` from `features/weekly-plan/components/RateLimitedButton.jsx` |
| | `Toast` from `features/weekly-plan/components/Toast.jsx` |
| ActivitySwap (inlined) | Reuses swap API from `features/weekly-plan/api/weeklyPlanApi.js` |

**Refactoring needed for DayActivityRow:**

The existing `DayActivityRow` accepts `{ activity, onSwap, isSwapping, swapRetryAfter }`. In the calendar day detail panel, it also needs:
- A completion toggle (mark activity as logged) — new prop `onToggleLog`
- A `logged` display state (show checkmark vs toggle button)
The component needs a minor extension: accept an `onToggleLog` callback and render a log button/checkmark, similar to what `ActivityPlanSection` renders inline today.

## Data Flow

### Activity Calendar — Month Data Load

```
[ActivityCalendarPage mounts]
    |
    v
useActivityMonthData(currentYear, currentMonth)
    |
    ├── getWeekStartsForMonth(2026, 5) → ['2026-05-25', '2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']
    |
    ├── fetchAll parallel:
    |   Promise.all([
    |     getWeeklyPlan('2026-05-25'),   // partial (Mon-Sun)
    |     getWeeklyPlan('2026-06-01'),   // full week
    |     getWeeklyPlan('2026-06-08'),   // full week
    |     getWeeklyPlan('2026-06-15'),   // full week
    |     getWeeklyPlan('2026-06-22'),   // full week
    |     getWeeklyPlan('2026-06-29'),   // partial (Mon-Sun, into July)
    |   ])
    |
    v
Aggregate weekly plans into flat map:
{
  '2026-06-01': { activities: [...], rest_day: false },
  '2026-06-02': { activities: [...], rest_day: false },
  ...
}
    |
    ├── Also fetch activity history for the month range
    |   GET /api/activities/history?days=62  (over-fetch to cover month ± edge weeks)
    |
    v
Compute day status for each cell in month grid
    |
    v
Render: CalendarGrid with status color-coded DayCells
```

### Meal Calendar — Month Data Load

```
[MealCalendarPage mounts]
    |
    v
useMealMonthData(currentYear, currentMonth)
    |
    ├── getWeekStartsForMonth(2026, 5) → same weekStart array
    |
    ├── fetch weekly meal plans (not daily — too many calls)
    |   Promise.all([
    |     getMealPlan('2026-05-25'),
    |     getMealPlan('2026-06-01'),
    |     getMealPlan('2026-06-08'),
    |     getMealPlan('2026-06-15'),
    |     getMealPlan('2026-06-22'),
    |     getMealPlan('2026-06-29'),
    |   ])
    |
    ├── Also fetch food log history
    |   GET /api/food/history?days=62
    |
    v
Aggregate + compute status
    |
    v
Render: CalendarGrid with status color-coded DayCells
```

### Day Click — Detail Panel

```
[User clicks DayCell at 2026-06-15]
    |
    v
CalendarPageLayout receives selectedDay = '2026-06-15'
    |
    v
Looks up planDayData['2026-06-15'] from in-memory map
    |
    ├── If no data for this day → show "No plan for this day" empty state
    |
    ├── If activity calendar:
    |   Renders ActivityDayDetail
    |     ├── If rest_day → show rest day message (green background)
    |     ├── For each activity → DayActivityRow with swap + log toggle
    |     └── Past day → all buttons disabled, grey overlay
    |
    └── If meal calendar:
        Renders MealDayDetail
          ├── For each meal_type → meal header + MealRow per item
          ├── Log button per meal (or one-click log all)
          └── Past day → all buttons disabled, grey overlay
```

### State Management

The calendar pages use **local React state** (useState + useEffect), consistent with the existing pattern in the codebase. TanStack React Query is available but all existing pages (ActivitiesPage, WeeklyPlanPage, MealPlanPage, FoodLogPage) use local state + manual fetch. The calendar pages follow the same convention for consistency.

```
CalendarPageLayout:
  state = {
    selectedDay: string | null,       // 'YYYY-MM-DD' of clicked day
    currentYear: number,
    currentMonth: number,             // 0-indexed
  }

useActivityMonthData hook:
  state = {
    planDays: Map<string, object>,    // date → day data from weekly plans
    dayStatuses: Map<string, string>, // date → DAY_STATUS key
    activityHistory: Array,            // logged activities for the month
    loading: boolean,
    error: string | null,
  }

useMealMonthData hook:
  state = {
    planDays: Map<string, object>,    // date → day data from meal plans
    dayStatuses: Map<string, string>,
    foodHistory: Array,
    loading: boolean,
    error: string | null,
  }
```

### Key Data Flows

1. **Month range computation:** `getWeekStartsForMonth()` determines which weeks to fetch — 5-6 weekStarts that span the calendar grid (Mon-Sun weeks may start in previous month and end in next). This is pure date math — no API calls.

2. **Multi-week data fetch:** `Promise.all()` fetches all weekly plans in parallel. Each response contains a `days[]` array. The aggregator builds a flat `date → dayData` map from all weekly plans combined.

3. **Day status computation:** `computeDayStatus()` runs for each day in the month grid. It takes the aggregated plan day data (or null if no plan), the logged activity/food history for that date, and a boolean for whether it's past. Returns a `DAY_STATUS` key that maps to a color.

4. **Generate action:** The generate button above the calendar triggers `generateWeeklyPlan(nearestWeekStart)` for activities, or `generateDailyMealPlan(date)` / `generateMealPlan(weekStart)` for meals. After generation, the full data reloads to update the status map.

5. **Swap action (activity):** When user clicks Swap on a DayActivityRow inside the detail panel, the existing swap flow runs (same endpoint + rate limiting as today). The in-memory `planDays` map updates optimistically with the new activity from the response.

6. **Log action (activity):** When user toggles an activity as logged, the existing `/api/activity-plans/log` endpoint is called. The local `planDays[date].activities[i].logged` flag updates, and `dayStatuses[date]` recomputes.

7. **Log action (meal):** When user clicks "Log This Day" or per-meal log, the existing `/api/meal-plans/log-day` endpoint is called. Same local state update pattern.

## Auto-Generate Trigger

When the calendar page opens to the current month and the user's "today" has no plan:
- **Activity calendar:** Auto-triggers `generateWeeklyPlan(mondayOfCurrentWeek)` — same behavior as existing `WeeklyPlanPage` auto-generation.
- **Meal calendar:** Auto-triggers `generateMealPlan(mondayOfCurrentWeek)` — same behavior as existing `MealPlanPage`.

The auto-generation guard (`useRef` flag) from the existing pages is carried over to prevent double-generation on re-render.

## Build Order

### Phase 1: Foundation — Calendar Shared Components
**Dependencies:** None (pure presentational, no API calls)
**Files to create:**
- `features/calendar/utils/calendarUtils.js` — `getWeekStartsForMonth()`, `buildMonthGrid()`, `computeDayStatus()`, `DAY_STATUS` enum
- `features/calendar/components/DayCell.jsx` — Single cell with color coding
- `features/calendar/components/MonthNav.jsx` — Prev/next month navigation
- `features/calendar/components/CalendarGrid.jsx` — Grid using DayCell + MonthNav
- `features/calendar/components/DayDetailPanel.jsx` — Generic detail panel shell
- `features/calendar/components/CalendarPageLayout.jsx` — Layout combining grid + generate button + detail panel
- `features/calendar/hooks/useMonthRange.js` — `useMonthRange()` hook for year/month state + navigation

**Tests:**
- `CalendarGrid` renders correct number of cells for any month
- `DayCell` applies correct color for each status
- `DayCell` calls onDayClick with correct date
- `computeDayStatus()` returns correct status for each combination
- `getWeekStartsForMonth()` returns correct week starts
- `buildMonthGrid()` returns 6×7 grid

### Phase 2: Activity Calendar Page
**Dependencies:** Phase 1 (CalendarGrid, DayCell, CalendarPageLayout)
**Files to create:**
- `features/activity-calendar/hooks/useActivityMonthData.js` — Fetch + aggregate activity plans
- `features/activity-calendar/api/activityCalendarApi.js` — Month-range composition
- `features/activity-calendar/components/ActivityDayDetail.jsx` — Detail panel using DayActivityRow
- `features/activity-calendar/components/ActivityCalendarPage.jsx` — Page assembly
- `features/activity-calendar/index.js` — Export

**Files to modify:**
- `features/weekly-plan/components/DayActivityRow.jsx` — Add `onToggleLog` prop + logged display
- `features/activities/api/activityPlanApi.js` — No changes needed (existing endpoints suffice)
- `app/Router.jsx` — Add `/activity-calendar` route

**Tests:**
- `useActivityMonthData` aggregates weekly plans correctly
- `ActivityDayDetail` renders DayActivityRow for each activity
- `ActivityDayDetail` shows read-only state for past days
- `ActivityDayDetail` handles empty day (no plan)
- Full page integration test with mocked weekly plan API

### Phase 3: Meal Calendar Page
**Dependencies:** Phase 1 (CalendarGrid, DayCell, CalendarPageLayout)
**Files to create:**
- `features/meal-calendar/hooks/useMealMonthData.js` — Fetch + aggregate meal plans
- `features/meal-calendar/api/mealCalendarApi.js` — Month-range composition
- `features/meal-calendar/components/MealDayDetail.jsx` — Detail panel using MealRow
- `features/meal-calendar/components/MealCalendarPage.jsx` — Page assembly
- `features/meal-calendar/index.js` — Export

**Files to modify:**
- `features/meal-plan/components/MealRow.jsx` — Potentially add `onLogClick` prop (depends on detail panel interaction design)
- `app/Router.jsx` — Add `/meal-calendar` route

**Tests:**
- `useMealMonthData` aggregates weekly meal plans correctly
- `MealDayDetail` renders MealRow for each meal item
- `MealDayDetail` shows read-only state for past days
- Log interaction works end-to-end

### Phase 4: Cleanup — Remove Replaced Components
**Dependencies:** Phase 2 + 3 deployed and verified
**Files to remove:**
- `features/activities/components/ActivityPlanSection.jsx`
- `features/weekly-plan/components/WeeklyPlanPage.jsx`
- `features/weekly-plan/components/DayCard.jsx`
- `features/weekly-plan/components/EmptyStatePlan.jsx`
- `features/meal-plan/components/MealPlanPage.jsx`
- `features/meal-plan/components/DayMealCard.jsx`
- `features/meal-plan/components/EmptyStateMealPlan.jsx`
- `features/food-log/components/DailyMealPlanSection.jsx`

**Tests to remove/update:**
- Remove tests for removed components
- Update `Router.test.jsx` (if exists) to reflect new routes

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current approach works — 5-6 parallel API calls per month view, local state management sufficient |
| 1k-100k users | Add a batch month-range endpoint (`GET /api/activity-plans/month?year=2026&month=5`) to reduce client-side aggregation complexity |
| 100k+ users | Consider server-side day status computation endpoint to avoid client-side aggregation entirely. Cache weekly plans aggressively. |

### Scaling Priorities

1. **First bottleneck:** 5-6 weekly plan API calls per month view. Each call fetches data for 7 days, but we only use 1-2 days from edge weeks (end of prev month, start of next month). **Mitigation:** Add `GET /api/weekly-plans/month?year=2026&month=5` that returns all plan days for the month in a single response. **Deferred:** v1.8 or when users report slow page loads.

2. **Second bottleneck:** Client-side aggregation of 5-6 plan responses into a date-keyed map. **Mitigation:** If needed, move aggregation to a backend batch endpoint. **Deferred:** Not needed until users with years of history load the calendar.

## Anti-Patterns

### Anti-Pattern 1: Monthly View from Daily Endpoints

**What people do:** Call a daily endpoint (`GET /api/daily-meal-plans?date=X`) 28-31 times to populate a month grid.

**Why it's wrong:** 28-31 sequential or parallel API calls is wasteful. It creates unnecessary server load, increases page load time, and makes the UI feel sluggish. It's a classic N+1 query problem translated to the API layer.

**Do this instead:** Use the existing weekly endpoints (which batch 7 days per call) to reduce to 5-6 calls. Or add a dedicated month-range endpoint. The weekly approach requires zero backend changes and keeps requests at a manageable count.

### Anti-Pattern 2: Making CalendarGrid Know About Domain Logic

**What people do:** Pass activity/meal data directly to CalendarGrid and let it compute statuses internally.

**Why it's wrong:** CalendarGrid becomes coupled to the domain model. If activities change their logged field name, both ActivityCalendarPage and CalendarGrid need updating. CalendarGrid can't be reused for meal calendar without conditionals.

**Do this instead:** CalendarGrid receives a precomputed `dayStatus` value for each cell. Status computation happens upstream in `useActivityMonthData` / `useMealMonthData`. CalendarGrid only maps status → color + renders. This keeps the grid pure and reusable.

### Anti-Pattern 3: Deeply Nesting Calendar Page with Detail Panel Inside CalendarGrid

**What people do:** Put the detail panel as a child of CalendarGrid, making the grid responsible for layout that includes the detail panel.

**Why it's wrong:** The grid shouldn't know about the detail panel. This couples grid layout to page layout. If you want to show the detail panel as a sidebar on desktop and below on mobile, you'd need to modify the grid.

**Do this instead:** `CalendarPageLayout` manages the top-level layout split (calendar area + detail panel area). It renders `CalendarGrid` in the top portion and `DayDetailPanel` in the bottom. The grid just renders cells; the layout handles positioning. This follows the existing `ResponsiveLayout` pattern in the app.

### Anti-Pattern 4: Over-Fetching All Month Data on Every Navigation

**What people do:** Re-fetch all weekly plans every time the user clicks prev/next month.

**Why it's wrong:** Fetching 5-6 API calls per month navigation creates unnecessary latency. The user might flip between June and July quickly.

**Do this instead:** Keep a simple LRU cache (or just a `Map<yearMonth, planData[]>` ) keyed by `"2026-05"` style keys. Check the cache before fetching. Clear the cache on page reload or explicit refresh. The existing `node-cache` pattern in the backend already handles server-side caching — a lightweight client-side cache prevents redundant fetches during month navigation.

## Integration Points

### Component Reuse Summary

| Existing Component | Used By | Changes Needed |
|-------------------|---------|----------------|
| `DayActivityRow` | `ActivityDayDetail` | Add `onToggleLog` prop + completed state rendering |
| `MealRow` | `MealDayDetail` | None — already renders logged state via `item.logged` |
| `FallbackBanner` | Both calendar pages | None — already generic |
| `Toast` | Both calendar pages | None |
| `RateLimitedButton` | Activity calendar generate button | None — could be inlined for the "Generate Week" button |
| `ActivityCard` | NOT reused — detail panel uses DayActivityRow instead | N/A — ActivityCard is for the Pool page |
| `FoodSearch` / `FoodLogTable` | NOT moved to meal calendar | Stays in FoodLogPage (manual logging still separate) |
| `CalorieSummary` / `CalorieHistory` | NOT moved to meal calendar | Stays in FoodLogPage |

### Backend API Surface (No Changes)

| Endpoint | Used By Calendar | Data Consumed |
|----------|-----------------|---------------|
| `GET /api/weekly-plans?weekStart=X` | ActivityCalendar | `days[].activities[].logged`, `days[].rest_day`, `days[].date` |
| `POST /api/weekly-plans/generate` | ActivityCalendar | Week generation trigger |
| `POST /api/weekly-plans/swap` | ActivityDayDetail | Per-activity swap |
| `GET /api/meal-plans?weekStart=X` | MealCalendar | `days[].meals[].items[].logged`, `days[].date` |
| `POST /api/meal-plans/generate` | MealCalendar | Week generation trigger |
| `POST /api/meal-plans/log-day` | MealDayDetail | Log all day's meals to food diary |
| `GET /api/activities/history?days=N` | ActivityCalendar | Audit completion for days with logged activities but no plan |
| `GET /api/food/history?days=N` | MealCalendar | Audit completion for days with logged food but no meal plan |
| `GET /api/activity-plans?date=X` | NOT needed | Existing endpoint returns single day — weekly endpoint is more efficient |

### Router Integration

```javascript
// New routes in app/Router.jsx
// These REPLACE the old activity and food-log routes after migration
// During transition, both old and new routes coexist

<Route path="/activity-calendar" element={<ActivityCalendarPage />} />
<Route path="/meal-calendar" element={<MealCalendarPage />} />

// OLD routes still active during transition:
<Route path="/activities" element={<ActivitiesPage />} />       // REMOVE after v1.7
<Route path="/food-log" element={<FoodLogPage />} />             // KEEP (manual log still needed)
<Route path="/weekly-plan" element={<WeeklyPlanPage />} />       // REMOVE after v1.7
<Route path="/meal-plan" element={<MealPlanPage />} />           // REMOVE after v1.7
```

## Sources

- Codebase analysis: `frontend/src/features/` directory structure, component composition, API patterns
- Existing patterns: Local state management (useState + useEffect), feature-based directory structure, API composition in feature `api/` directories
- The current `WeeklyPlanPage` and `MealPlanPage` served as reference implementations for data loading and state management patterns
- `DayCard.jsx` and `DayMealCard.jsx` showed the expandable card pattern that the day detail panel replaces

---
*Architecture research for: Calendar-Based Plan UI*
*Researched: 2026-05-31*
