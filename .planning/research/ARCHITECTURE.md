# Architecture Research: v1.8 UI Consolidation — Merging Calendar Pages into Manual-Log Pages

**Researched:** 2026-06-01
**Mode:** Ecosystem (focus on existing codebase patterns)
**Confidence:** HIGH — all findings verified against actual source code

---

## 1. Current State Map

Before proposing changes, here is the exact current architecture as verified from source:

### Routes (Router.jsx)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/activities` | `ActivityCalendarPage` | Calendar grid + weekly plan detail per day |
| `/food-log` | `FoodLogPage` | Manual food log + DailyMealPlanSection (today only) |
| `/meal-calendar` | `MealCalendarPage` | Calendar grid + daily meal plan detail per day |
| `/` | `DashboardPlaceholder` | Nav links to all pages including `/meal-calendar` |

### Component Ownership

| Component | Location | Role |
|-----------|----------|------|
| `CalendarPageLayout` | `shared/calendar/` | **Owns** `currentMonth` + `selectedDay` state internally. Fires `onDaySelect`/`onMonthChange` callbacks. Contains `MonthNav` + `CalendarGrid` + `DayDetailPanel` slot. |
| `CalendarGrid` | `shared/calendar/` | Pure presentational. Wraps `react-day-picker`. |
| `DayDetailPanel` | `shared/calendar/` | Pure presentational. Slot-based children renderer. |
| `useMonthData(date, fetchWeekFn)` | `shared/calendar/hooks/` | Generic hook — 5-6 parallel weekly plan fetches, returns `dayStatusMap` |
| `useMonthMealData(date)` | `features/food-log/hooks/` | Meal-specific variant — 28-31 daily fetches, returns `dayStatusMap` |
| `ActivityCalendarPage` | `features/activities/` | Wraps `CalendarPageLayout`. Manages: dayPlan fetching, generate/swap/toggle state. |
| `MealCalendarPage` | `features/food-log/` | Wraps `CalendarPageLayout`. Manages: dayPlan fetching, generate/log state. |
| `FoodLogPage` | `features/food-log/` | Today-only manual log. Fetches summary + logs + history + recent foods. Embedded `DailyMealPlanSection`. |
| `ActivitiesPage.jsx` | `features/activities/components/` | **Dead code** — not imported/exported anywhere (v1.7 cleanup carried over). Contains ActivityLogForm, ActivityPool, ActivityHistory, etc. |
| `DailyMealPlanSection` | `features/food-log/components/` | Today-only inline plan display. Separate from `MealCalendarPage` — different data flow. |
| `ActivityPlanSection` | `features/activities/components/` | Today-only inline plan display. Separate from `ActivityCalendarPage`. |

### Data Fetching Patterns

| Page | Mount Fetch | Day-Select Fetch | Calendar Color Logic |
|------|-------------|------------------|---------------------|
| `ActivityCalendarPage` | Auto-gen if today has no plan | `getWeeklyPlan(weekStart)` → find day | `useMonthData` → 5-6 weekly calls |
| `MealCalendarPage` | Auto-gen if today has no plan | `getDailyMealPlan(dateStr)` | `useMonthMealData` → 28-31 daily calls |
| `FoodLogPage` | `Promise.all([summary, logs, history, recent])` for today | N/A (today only) | N/A |

### Key Architectural Fact: CalendarPageLayout is NOT Controlled

This is the single most important finding:

```jsx
// CalendarPageLayout manages its OWN selectedDay + currentMonth state
export default function CalendarPageLayout({ dayStatusMap, loading, error, onMonthChange, onDaySelect, children }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  
  // External handlers are called AFTER internal state updates
  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);              // internal first
    if (externalOnDaySelect) externalOnDaySelect(day);  // then notify
  }, [externalOnDaySelect]);
```

This means:
- The parent (calendar page) cannot control `selectedDay` — it can only **react** via `onDaySelect`
- The parent receives the selected day as a notification, not as a prop
- This is fine for the current pattern (calendar page renders detail panel children) but limits what the parent can do

---

## 2. Merge Strategies Evaluated

### Strategy A: Tab-Based Toggle ("Log View" / "Calendar View")

The merged page uses a segmented control to switch between manual log and calendar view.

```
┌─────────────────────────┐
│  [ Log ] [ Calendar ]   │  ← tabs switch between two render branches
├─────────────────────────┤
│  ... manual log OR      │
│  ... calendar grid      │  ← mutually exclusive
└─────────────────────────┘
```

**Verdict: NOT RECOMMENDED.** This is a UX regression — the current standalone pages already have separate routes. Puting them behind tabs on a single route is the same UX as having two separate routes but worse (no deep-linking to calendar view, sharing doesn't work).

### Strategy B: Vertical Stack (Scroll-Based)

Stack both views vertically, one after the other.

```
┌─────────────────────────┐
│  Manual Log Section     │
│  (search, portion, etc.) │
├─────────────────────────┤
│  Calendar Grid          │
├─────────────────────────┤
│  Day Detail Panel       │
└─────────────────────────┘
```

**Verdict: NOT RECOMMENDED.** Two problems:
1. **Layout collision.** CalendarPageLayout has its own max-width 600px wrapper. Nesting this inside a page that already has a max-width wrapper creates visual inconsistencies.
2. **Scroll length.** On mobile (which this app targets with `isMobile` responsive behavior), a calendar grid + day detail panel is already ~800px tall. Adding manual log forms above makes for a very long, unfocused scroll.

### Strategy C: Calendar Detail Panel Enhancement (RECOMMENDED)

Keep the calendar as the primary navigational structure. Enhance the `DayDetailPanel` slot (already exists as `children`) to include manual log features for the selected day.

```
┌──────────────────────────────┐
│  Today's Summary Banner      │  ← always visible at top (compact)
├──────────────────────────────┤
│  Month Navigation             │
├──────────────────────────────┤
│  Calendar Grid                │
├──────────────────────────────┤
│  Day Detail Panel             │  ← slot-based children:
│  ├─ [selected date header]    │     shows when day clicked
│  ├─ Plan data (existing)      │
│  ├─ Manual Log Form           │  ← NEW: compact form for the selected day
│  └─ History snippet           │  ← NEW: quick reference
└──────────────────────────────┘
```

**Verdict: RECOMMENDED.** Reasons:
- Reuses the existing `DayDetailPanel` slot perfectly — no structural changes to `CalendarPageLayout` needed
- The calendar already handles navigation and data status (loading, error, dayStatusMap)
- Manual log features become "what you do when looking at a day" — natural UX
- No tab juggling, no scroll bloat, no layout conflicts
- The existing calendar pages already fetch day-specific data in useEffect on `selectedDay` change — manual log APIs that accept a date parameter can piggyback on the same effect

### Strategy D: CalendarPageLayout as Controlled Component

Refactor `CalendarPageLayout` to accept `currentMonth` and `selectedDay` as props instead of managing them internally. The parent becomes the source of truth.

**Verdict: HIGH EFFORT, LOW VALUE.** This would:
- Require changing `CalendarPageLayout`'s internal state management
- Break all existing tests
- Make the component more complex without solving the actual problem
- The callback pattern already works — `onDaySelect` already fires and parents already react

---

## 3. Recommended Approach Per Page

### 3.1 Food Log Merge (FoodLogPage + MealCalendarPage)

**Core Tension:** FoodLogPage is today-only. MealCalendarPage is any-day. These are fundamentally different orientations.

**Resolution:** Make FoodLogPage date-aware, but keep a "today focus" as the default entry point. The calendar becomes a navigation tool to browse other days.

**Component Structure (new):**

```
FoodLogPage (wrapper, renamed or extended)
│
├── [Top Banner: Today's Summary]
│   ├── CalorieSummary (shown only when selectedDate === today)
│   └── Or: "Viewing <date>" indicator when browsing other days
│
├── CalendarPageLayout (embedded, manages month/day internally)
│   ├── MonthNav
│   ├── CalendarGrid
│   └── DayDetailPanel (slot)
│       ├── Selected date: "Friday, June 5, 2026"
│       ├── Meal Plan data (reuse MealCalendarPage's renderDayContent logic)
│       ├── Manual Log Section (compact food search + portion entry)
│       └── Quick-add recent foods list
│
└── CalorieHistory (7-day history, always from today — not date-specific)
```

**Data Flow (new):**

```
selectedDate (derived from CalendarPageLayout's onDaySelect)
    │
    ├──→ Calendar hooks (unchanged):
    │     useMonthMealData(currentMonth) → dayStatusMap
    │     getDailyMealPlan(selectedDate) → plan data → renderDayContent
    │
    └──→ Manual log APIs (same functions, different parameter):
          getDailySummary(selectedDate)    // was: getDailySummary(today)
          getDailyLogs(selectedDate)       // was: getDailyLogs(today)
          logFood({...logDate: selectedDate})  // was: logDate: today
```

**What changes:**
- `FoodLogPage` adds `selectedDate` state, initialized to today
- `onDaySelect` callback updates `selectedDate`
- Manual log API calls use `selectedDate` instead of hardcoded `today`
- `CalendarPageLayout` is embedded, replacing the current static content area
- `CalorieHistory` stays on "last 7 days from today" (not the selected date)
- `DailyMealPlanSection` (today's auto-generated plan) — **keep it at the top as today banner**, since it's a quick-reference for today's plan. The calendar detail panel shows the plan for whatever day is selected.

**What stays the same:**
- `CalendarPageLayout` — no changes (internal state management stays)
- `CalendarGrid`, `MonthNav`, `DayDetailPanel` — no changes
- `useMonthMealData` — no changes
- `getDailyMealPlan` API — no changes
- `searchFoods`, `logFood`, `createCustomFood` APIs — no changes (they already accept dates)
- `CalorieSummary`, `FoodSearch`, `CustomFoodForm`, `FoodLogTable` — no changes (they receive props)

### 3.2 Activity Merge (ActivityCalendarPage + manual activity log)

**Core Challenge:** The old `ActivitiesPage.jsx` is dead code (not imported/exported). The current `ActivityCalendarPage` at `/activities` has the calendar but no manual logging. Manual logging was in the dead `ActivitiesPage` which used `ActivityLogForm`, `ActivityHistory`, `ActivitySummary`, etc.

**Resolution:** The current `ActivityCalendarPage` is already the right starting point — it has the calendar, day selection, plan display. Manual logging needs to be added to the DayDetailPanel slot.

**Component Structure (new):**

```
ActivityCalendarPage (extended, kept at /activities route)
│
├── [Top: Today's Activity Summary]
│   ├── Active minutes, calories burned (today)
│   └── Quick "Log Activity" button (compact, inline)
│
├── CalendarPageLayout (already embedded)
│   ├── MonthNav
│   ├── CalendarGrid
│   └── DayDetailPanel (slot — already used for plan display)
│       ├── Selected date header
│       ├── Planned activities (existing: DayActivityRow with swap/toggle)
│       ├── ─── divider ───
│       ├── Manual Activity Log (NEW: compact ActivityLogForm)
│       │   → Activity select + duration + intensity → Log button
│       └── Activity Recommendations for this day (small pool, inline)
│
└── Activity History (last 7 days, from today — reference)
```

**Data Flow (new):**
```
selectedDate (from onDaySelect)
    │
    ├──→ Calendar hooks (unchanged):
    │     useMonthData(currentMonth, fetchWeekFn) → dayStatusMap
    │     getWeeklyPlan(weekStart) → day plan → DayActivityRow
    │
    └──→ Manual log APIs (reuse from dead ActivitiesPage):
          getActivitySummary(selectedDate)  // new per selectedDate
          getActivityLogs(selectedDate)     // new per selectedDate
          logActivity({...date: selectedDate})
```

**What changes:**
- `ActivityCalendarPage` adds: summary state, activity log form state, history fetch
- `onDaySelect` triggers: fetch day plan (already does this) + fetch activity summary for that day (new)
- `DayDetailPanel` children enhanced to include: activity log form, suggestions
- `ActivityLogForm` component (exists in dead code) resurrected and made date-aware
- `ActivityHistory` component resurrected and placed at bottom

**What stays the same:**
- Calendar rendering, day status map, plan generation — unchanged
- Swap, toggle-complete logic — unchanged
- Toast, countdown timers — unchanged
- `activityApi.js` functions — already accept date parameters

---

## 4. Route Consolidation Plan

### Current vs Target Routes

| Current Route | Target Route | Action |
|---------------|--------------|--------|
| `/activities` | `/activities` | Enhance page content (add manual log) |
| `/food-log` | `/food-log` | Enhance page content (add calendar) |
| `/meal-calendar` | **REMOVED** | Delete route and add redirect |

### Redirect Strategy

For `/meal-calendar`:
```jsx
// In Router.jsx — add redirect
<Route path="/meal-calendar" element={<Navigate to="/food-log" replace />} />
```

This provides backward compatibility for bookmarks. The `replace` prop prevents the redirect from polluting browser history.

### Navigation Updates

In `DashboardPlaceholder` (or wherever nav links live), update:
- `/meal-calendar` link → `/food-log`
- `/activity-calendar` link → `/activities` (already done if it existed)

### Dead Route Removal

```
Router.jsx changes:
- Remove: import { MealCalendarPage } from '...'
- Remove: <Route path="/meal-calendar" .../>
- Add:    <Route path="/meal-calendar" element={<Navigate to="/food-log" replace />} />
```

---

## 5. State Management Architecture

### State Ownership After Merge

| State | Owned By | Why |
|-------|----------|-----|
| `currentMonth`, `selectedDay` | `CalendarPageLayout` (internal) | No change — component already manages this via callbacks |
| `selectedDate` (derived day for APIs) | Parent page (FoodLogPage, ActivityCalendarPage) | Derived from `onDaySelect`. Defaults to today on mount. |
| Manual log form state | Parent page (component state) | No change — form state is page-local |
| `dayStatusMap` | `useMonthData` / `useMonthMealData` hooks | No change — queries are independent of selectedDay |

### Data Dependency Graph

```
useMonthMealData(currentMonth)  ← independent, fetches ALL days
                                    ↓
                               dayStatusMap → CalendarGrid colors

onDaySelect(day) → selectedDate
                      ↓
            ├── getDailyMealPlan(selectedDate)  ← explicit fetch in useEffect
            ├── getDailySummary(selectedDate)    ← NEW fetch in useEffect
            └── getDailyLogs(selectedDate)       ← NEW fetch in useEffect
```

### Key Consideration: Separate Data Sources

The calendar color (`dayStatusMap`) and the manual log data (`summary`, `logs`) come from **different API endpoints**. They don't share state. This is correct — they should remain independent:
- Calendar data: `useMonthMealData` / `useMonthData` (TanStack Query, cached, staleTime: 5min)
- Manual log data: direct `useEffect` + fetch (not cached via TanStack, refetched on selectedDate change)

---

## 6. Integration Points (What Touches What)

### Files That MUST Change

| File | Change Type | What To Do |
|------|-------------|------------|
| `features/food-log/components/FoodLogPage.jsx` | **MODIFY** | Add selectedDate state, embed CalendarPageLayout, generalize API calls |
| `features/activities/ActivityCalendarPage.jsx` | **MODIFY** | Add manual log section to DayDetailPanel, add summary/history fetch |
| `app/Router.jsx` | **MODIFY** | Remove MealCalendarPage import, add /meal-calendar redirect, remove route |
| `features/food-log/index.js` | **MODIFY** | Remove `MealCalendarPage` export (no longer needed at route level) |

### Files That Should Be DELETED

| File | Reason |
|------|--------|
| `features/food-log/components/MealCalendarPage.jsx` | Logic merged into FoodLogPage. Component becomes internal or deleted. |
| Note: `ActivitiesPage.jsx` is already dead code — if not removed in v1.7, remove now. |

### Files That MIGHT Change (optional)

| File | Change | Reason |
|------|--------|--------|
| `shared/calendar/CalendarPageLayout.jsx` | Minor | If we want to support an "initially selected day = today" default (currently starts null). Could add `defaultSelectedDay` prop. |
| `features/food-log/hooks/useMonthMealData.js` | None needed | Already independent. |
| `features/activities/components/ActivitiesPage.jsx` | **Reference, don't modify** | Extract patterns/components from this dead code, then delete. |

### Files That Must NOT Change

| File | Reason |
|------|--------|
| `shared/calendar/CalendarGrid.jsx` | Pure presentational, tested. No reason to change. |
| `shared/calendar/MonthNav.jsx` | Pure presentational. |
| `shared/calendar/DayDetailPanel.jsx` | Slot-based, works as-is. |
| `shared/calendar/calendarUtils.js` | Pure utilities. |
| `shared/calendar/hooks/useMonthData.js` | Generic hook, works as-is. |
| `features/food-log/hooks/useMonthMealData.js` | Meal-specific hook, works as-is. |
| All backend code | Milestone explicitly says "no backend changes." |

---

## 7. Build Order (Dependency-Aware)

### Phase 1: Food Log Merge (higher priority)

**Rationale:** The food log merge has more structural changes (date-awareness, CalendarPageLayout embedding) and is riskier. Starting here surfaces issues early.

| Step | What | Depends On | Risk |
|------|------|------------|------|
| 1.1 | Add `selectedDate` state to FoodLogPage, init to today | Nothing | Low |
| 1.2 | Add `handleDaySelect` callback that sets `selectedDate` | 1.1 | Low |
| 1.3 | Replace static content area with `CalendarPageLayout` embedding | 1.1, 1.2 | **Medium** — layout restructuring, need to keep CalorieSummary/FoodSearch visible |
| 1.4 | Wire DayDetailPanel slot: meal plan data + compact manual log form | 1.3 | Medium — slot children customization |
| 1.5 | Generalize API calls: `getDailySummary(selectedDate)` instead of `getDailySummary(today)` | 1.2 | Low — APIs already accept date param |
| 1.6 | Keep CalorieHistory date-agnostic (still from today) | 1.1 | Low |
| 1.7 | Remove `/meal-calendar` route, add redirect | 1.4 | Low |
| 1.8 | Update navigation links in DashboardPlaceholder | 1.7 | Low |
| 1.9 | Delete `MealCalendarPage.jsx` | 1.4 | Low — verify nothing else imports it |
| 1.10 | Update tests for new FoodLogPage + delete MealCalendarPage tests | 1.9 | **Medium** — test structure changes |

### Phase 2: Activity Merge (lower priority)

**Rationale:** The activity calendar already mostly works. Adding manual logging to the DayDetailPanel slot is additive, not structural.

| Step | What | Depends On | Risk |
|------|------|------------|------|
| 2.1 | Resurrect `ActivityLogForm` component from dead code, make date-aware | Nothing | Low |
| 2.2 | Add summary/history state to ActivityCalendarPage | Nothing | Low |
| 2.3 | Add summary fetch to the onDaySelect effect | 2.2 | Low |
| 2.4 | Enhance DayDetailPanel slot: add ActivityLogForm + recommendations | 2.1, 2.3 | Low — additive change |
| 2.5 | Add compact "Today's Activity Summary" banner above calendar | 2.2 | Low |
| 2.6 | Add ActivityHistory at bottom of page | 2.2 | Low |
| 2.7 | Delete dead `ActivitiesPage.jsx` (if not already removed in v1.7) | 2.1 | Low |
| 2.8 | Update tests | 2.4, 2.6 | Medium |

### Phase Order Rationale

1. **Food log first** because it has the most architectural risk (date-awareness generalization, CalendarPageLayout embedding in a non-calendar page)
2. **Activity second** because it's purely additive — the calendar structure is already in place, manual log components just need to be dropped into the DayDetailPanel slot

---

## 8. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| CalendarPageLayout embedding breaks FoodLogPage layout | High | Medium | Keep Today's Summary above the calendar, test on mobile |
| selectedDate ≠ today causes stale/empty manual log data | Medium | Low | Default to today, lazy-load on day select |
| `onDaySelect` not firing on initial render (no day selected) | Medium | High | `CalendarPageLayout` initializes with `selectedDay = null` — need to auto-select today or show empty state for the detail panel |
| Manual log form in DayDetailPanel is too cramped on mobile | Medium | Medium | Use a compact inline form (no full-page modal), stack fields vertically |
| Meal calendar tests need restructuring | Low | High | Acceptable — tests must adapt to new component boundaries |
| Dead code (ActivitiesPage.jsx) accidentally resurrected | Low | Low | Audit imports before modifying |

### Critical Finding: CalendarPageLayout Starts With No Day Selected

```jsx
const [selectedDay, setSelectedDay] = useState(null);
```

This means on initial page load, `onDaySelect` fires with `null`. The DayDetailPanel shows "Select a day to view details." For the merged pages, this means:
- **Food log:** initially shows the "Select a day" placeholder. User must click today to see today's data.
- **Activity:** same behavior — no day selected means no detail panel content.

**Options:**
1. **Accept it** — user must click today on first visit. Simple, existing pattern.
2. **Auto-select today** — add a `defaultDay` prop to CalendarPageLayout. On mount, if `defaultDay` is provided, set it as selectedDay. This requires a minimal CalendarPageLayout change.
3. **External initial selection** — parent component detects `selectedDay === null` and auto-triggers `onDaySelect(today)` in a useEffect after first render.

**Recommendation: Option 2 (add `defaultDay` prop to CalendarPageLayout).** It's a small, backward-compatible change (defaults to `null` = existing behavior) and makes the UX much smoother for the merged pages.

```jsx
// CalendarPageLayout.jsx — proposed addition
export default function CalendarPageLayout({
  dayStatusMap, loading, error, 
  onMonthChange, onDaySelect, 
  defaultDay = null,  // NEW: optional default selected day
  children,
}) {
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  // ... rest unchanged
```

---

## 9. Test Strategy Implications

### Existing Test Coverage

| Test File | Tests | Relevance After Merge |
|-----------|-------|----------------------|
| `MealCalendarPage.test.jsx` | 8 tests | **DELETE** — component merged into FoodLogPage |
| `ActivityCalendarPage.test.jsx` | 8 tests | **UPDATE** — component gets new manual log features |
| `FoodLogPage` (no test file found) | 0 tests | **CREATE** — new tests for merged page |
| Calendar shared components | 33 tests | **NO CHANGE** — components not modified |

### Testing Considerations for Merged Pages

1. **Mock CalendarPageLayout** — the existing pages already mock it. The merged pages should too. The mock isolates tests from calendar rendering complexity.
2. **Test selectedDate changes** — verify that clicking a calendar day triggers the correct API calls with the right date parameter.
3. **Test today vs non-today behavior** — two key scenarios: viewing today (shows full summary + calendar) and viewing a past day (shows limited/read-only data).
4. **Test empty states** — no plan, no manual logs for the selected day.
5. **Test date transitions** — clicking different days should update manual log data correctly.

---

## 10. Summary of Recommendations

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| Merge strategy | **Calendar Detail Panel Enhancement (Strategy C)** — calendar stays primary nav, manual log features go in the day detail panel slot | HIGH |
| CalendarPageLayout changes | **Minimal** — add optional `defaultDay` prop for auto-selecting today. No internal state restructuring. | HIGH |
| FoodLogPage generalization | **Make date-aware** — `selectedDate` state replaces hardcoded `today`. APIs already accept dates. | HIGH |
| MealCalendarPage fate | **Delete** — logic absorbed into FoodLogPage's DayDetailPanel slot | HIGH |
| ActivitiesPage.jsx fate | **Delete dead code** — patterns reused in ActivityCalendarPage enhancements | HIGH |
| Route redirects | **Add `<Navigate>` redirect** for `/meal-calendar` → `/food-log`. Backward compatible. | HIGH |
| Build order | **Food log first** (structural risk), **activity second** (additive risk) | HIGH |
