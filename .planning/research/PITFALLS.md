# Pitfalls: Merging Calendar Pages into Target Pages (v1.8 UI Consolidation)

**Researched:** 2026-06-01
**Domain:** React 19 + React Router v6 — merging two standalone page-level components into existing pages
**Source:** Codebase analysis (Router.jsx, CalendarPageLayout, ActivityCalendarPage, MealCalendarPage, ActivitiesPage, FoodLogPage, tests)

---

## CRITICAL PITFALLS

These will cause test failures, application errors, or data integrity issues if not addressed.

### P-01: Dual Auto-Generation Conflict

**What goes wrong:** Merging a Calendar page into a target page creates two independent auto-generation systems running simultaneously, causing duplicate API calls, rate-limit consumption, and stale data overwrites.

**Why it happens:**

The codebase has **four** auto-generation points across two layers:

| Component | Auto-gen Mechanism | Triggers On |
|-----------|-------------------|-------------|
| `ActivityCalendarPage.jsx:98-139` | `useEffect` checks `dayStatusMap` for today's status | `currentMonth` change (page load = today) |
| `ActivityPlanSection.jsx:37-42` | `useEffect` checks `!loading && !plan && !generating` | `loading`/`plan` state changes |
| `MealCalendarPage.jsx:62-93` | `useEffect` checks `dayStatusMap` for today's status | `currentMonth` change |
| `DailyMealPlanSection.jsx:39-44` | `useEffect` checks `!loading && !plan && !generating` | `loading`/`plan` state changes |

When Activity Calendar merges into ActivitiesPage: `ActivityCalendarPage` auto-gen + `ActivityPlanSection` auto-gen fire sequentially. The PlanSection fires first (mount), then the Calendar fires (month state). Two Generate Week API calls within milliseconds — the second either hits a rate limit or overwrites the first.

Same risk for Meal Calendar + FoodLogPage: `MealCalendarPage` auto-gen + `DailyMealPlanSection` auto-gen.

**Consequences:**
- Rate-limit consumed on duplicate calls (5/15min limit)
- Second generation overwrites the first — user sees stale version
- `genRetryAfter` countdown from one system doesn't account for the other
- Both systems show "Generating..." simultaneously — confusing UX

**Prevention:**
- Deactivate one of the two auto-gen mechanisms in the merged page. The Calendar's auto-gen (`dayStatusMap` check) should take precedence since it already has month-awareness and past-day guards.
- Move `ActivityPlanSection`/`DailyMealPlanSection` to be **children** of the calendar's data layer: when calendar fetches a plan, pass it down; don't let the section auto-fetch independently.
- Or: merge the two auto-gen triggers into a single `useEffect` that only fires once.

**Phase to address:** Phase where Calendar is merged into target page. Requires restructuring the existing PlanSection components.

---

### P-02: Calendar Page Tests Will Fail — Pages Being Removed

**What goes wrong:** Both `ActivityCalendarPage.test.jsx` (7 tests) and `MealCalendarPage.test.jsx` (7 tests) test for elements that either move to a new parent or disappear entirely.

**File:** `frontend/src/features/activities/components/__tests__/ActivityCalendarPage.test.jsx`
**File:** `frontend/src/features/food-log/components/__tests__/MealCalendarPage.test.jsx`

**Tests that break for ActivityCalendarPage:**
| Lines | Test | Why it breaks |
|-------|------|---------------|
| 81-86 | `renders page title` → expects `'Activity Calendar'` text | Title will change or move |
| 88-93 | `renders Generate Week button` → expects `'Generate Week'` | Button may live in a section, not at top |
| 95-100 | `renders CalendarPageLayout` → expects `data-testid="calendar-page-layout"` | Calendar becomes a subsection, not the root |
| 102-108 | `shows Generating... when plan is being generated` | Text may conflict with PlanSection's "Generating..." |
| 110-122 | `calls generateWeeklyPlan on Generate Week click` | Mock import path or structure changes |
| 124-129 | `day detail panel shows empty state` | Panel rendered inside a subsection |
| 131-155 | loading/error state rendering | Depends on how calendar state integrates |

**Tests that break for MealCalendarPage:** Same pattern — all 7 tests check page-level UI elements that move or change context.

**ActivitiesPage.test.jsx (5 tests) is at risk too:**
| Lines | Test | Why it breaks |
|-------|------|---------------|
| 22-29 | `shows Loading... on initial render` | New merged page may combine loading states differently |
| 31-40 | `renders "Activity Recommendations" heading` | Page structure changes with calendar section |
| 53-63 | `has a Shuffle button` | Button still exists but page container changes |

**Prevention:**
- Do NOT simply delete test files — migrate useful assertions to a new merged-page test file
- `ActivityCalendarPage.test.jsx` and `MealCalendarPage.test.jsx` should be **replaced** by new test files for the merged pages (e.g., `MergedActivityPage.test.jsx`)
- Keep tests that verify calendar behavior (day selection, generate button click, loading/error) — rewrite them to mount the merged page
- Keep tests that verify PlanSection/LogSection behavior — rewrite them to mount the merged page
- **Shared component tests must NOT be removed**: `CalendarPageLayout.test.jsx`, `CalendarGrid.test.jsx`, `DayDetailPanel.test.jsx`, `calendarUtils.test.js`, `useMonthData.test.js`, `DayActivityRow.test.jsx` — these test reusable components and should work unchanged

**Phase to address:** The test phase within the consolidation milestone. Tests should be updated as part of the merge, not after.

---

### P-03: Dashboard and Navigation Links Point to Old Routes

**What goes wrong:** Removing `/activity-calendar` and `/meal-calendar` routes breaks navigation, leaving users unable to reach these features.

**Why it happens:**

In `Router.jsx:56-79`, the `DashboardPlaceholder` component renders navigation links:

```jsx
<Link to="/meal-calendar">Meal Calendar</Link>       {/* Line 69-71 — will 404 */}
<Link to="/activities">Activity Recommendations</Link> {/* Line 72-74 — will 404 */}
```

Wait — examining the current router more carefully:

| Route | Component | Status |
|-------|-----------|--------|
| `/activities` (line 90) | `ActivityCalendarPage` | ACTIVE — will be replaced |
| `/meal-calendar` (line 89) | `MealCalendarPage` | ACTIVE — will be removed |
| `/food-log` (line 88) | `FoodLogPage` | ACTIVE — target for merge |

So actually:
- `/activities` already serves the Calendar. The merger needs to put Calendar **inside** the ActivitiesPage-like view. No link change needed if `/activities` stays as the route.
- `/meal-calendar` is a separate route from `/food-log`. The dashboard link to `/meal-calendar` will 404 after removal.

**Also affected:**
- Any browser bookmarks users have saved to `/meal-calendar`
- Any external links or documentation referencing these paths
- The import in Router.jsx line 7: `import { ..., MealCalendarPage } from '../features/food-log/index.js'` — will break if `MealCalendarPage` export is removed from `index.js`
- Router.jsx line 8: `import { ActivityCalendarPage } from '../features/activities/index.js'` — will break if export is removed

**Prevention:**
- Change the dashboard `<Link to="/meal-calendar">` → `<Link to="/food-log">` (or keep both and add a tab/switch inside FoodLogPage)
- Keep the `index.js` exports for backward compatibility (export the component from the new location, or export a no-op/redirect component)
- If maintaining backward compatibility: add a catch-all redirect from old route to new route in Router.jsx
- Update Router.jsx to remove the stale imports

**Phase to address:** Route configuration phase. Should be the first thing changed in Router.jsx.

---

### P-04: State Explosion — Two Heavy State Systems in One Component

**What goes wrong:** Merging two page-level components means their combined state lives in one render cycle, causing excessive re-renders, stale closure bugs, and maintenance complexity.

**Current state counts per component:**

| Component | State Variables | Approx. setState Calls |
|-----------|----------------|----------------------|
| `ActivityCalendarPage` | 10 (`selectedDay`, `currentMonth`, `dayPlan`, `planLoading`, `generating`, `genRetryAfter`, `swappingActivityId`, `swapRetryAfter`, `toast`, `completedActivities`) | 18+ call sites |
| `ActivitiesPage` | 9 (`recommendations`, `allActivities`, `summary`, `history`, `loading`, `error`, `successMsg`, `reshuffling`, `loggingActivity`) | 15+ call sites |
| Combined Activity | **19 state variables** | **33+ call sites** |

| Component | State Variables | Approx. setState Calls |
|-----------|----------------|----------------------|
| `MealCalendarPage` | 8 (`selectedDay`, `currentMonth`, `dayPlan`, `planLoading`, `generating`, `genRetryAfter`, `loggingMeal`, `toast`) | 15+ call sites |
| `FoodLogPage` | 10 (`summary`, `logs`, `history`, `recentFoods`, `selectedFood`, `portion`, `mealType`, `showCustomForm`, `error`, `successMsg`, `loading`) | 20+ call sites |
| Combined Meal | **18 state variables** | **35+ call sites** |

**Why this is dangerous:**
1. **Re-render cascades:** A single `setState` in one section re-renders the entire merged component — all 19+ useState hooks re-evaluate. Calendar toggles a completion → entire log form re-renders.
2. **Stale closure bugs:** `useCallback` dependencies become harder to track. A callback in the calendar section might accidentally capture stale `summary` or `error` state from the other section.
3. **`CalendarPageLayout` has its own internal state** for `currentMonth` and `selectedDay` (CalendarPageLayout.jsx:30-31) — this is **duplicated** with the parent. The parent tracks these too (to drive API fetches). This dual ownership is already fragile and becomes more so when the parent has additional unrelated state.
4. **`useEffect` interdependence:** Effects from both sections can trigger each other. An `error` state change from FoodLogPage could cancel an effect meant for MealCalendar.

**Prevention:**
- Extract the calendar section into its own wrapper component that manages its own state internally and communicates via a minimal props interface (e.g., `<ActivityCalendarSection selectedDate={date} onDaySelect={fn} />`)
- Use `React.memo` on the calendar section so it only re-renders when its specific props change
- Keep the log form section as a separate component, memoized similarly
- Consider using `useReducer` instead of multiple `useState` in calendar section — cleaner state updates, easier to reason about

**Phase to address:** Component extraction phase — before merging, extract calendar section into a standalone component.

---

## MODERATE PITFALLS

### P-05: CalendarPageLayout's Dual State Ownership is Fragile

**What goes wrong:** `CalendarPageLayout` owns internal `currentMonth`/`selectedDay` state while also calling `externalOnMonthChange`/`externalOnDaySelect` to sync with the parent. This creates two sources of truth that can diverge.

**Location:** `CalendarPageLayout.jsx:30-56`

**The problem in detail:**

```jsx
// CalendarPageLayout INTERNAL state (lines 30-31)
const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
const [selectedDay, setSelectedDay] = useState(null);

// Parent ALSO has:
// ActivityCalendarPage.jsx:26 - setCurrentMonth
// ActivityCalendarPage.jsx:25 - setSelectedDay
// But parent only learns of changes via callbacks (lines 39-40, 48-49, 55-56)
```

When the parent calls `handleMonthChange(newMonth)` — this only fires on user interaction with MonthNav. If the parent programmatically changes the month (e.g., resetting to today after a successful generation), it has no way to tell CalendarPageLayout. The layout's internal month state diverges.

When merged into a new parent, this becomes worse because the parent may have additional side effects that need to sync the calendar month.

**Prevention:**
- Convert `CalendarPageLayout` to be a **controlled component** — accept `currentMonth` and `selectedDay` as props from the parent, remove internal state
- OR: invert the pattern — let CalendarPageLayout be the single owner, and expose its state through a render prop or context
- Since v1.8 is pure UI restructuring with minimal changes to shared components, the safest approach is to make CalendarPageLayout optionally controlled: if `currentMonth` prop is provided, use it; otherwise use internal state

**Phase to address:** Can be fixed as part of the merge or deferred. If controlled mode is added with backward compatibility, existing CalendarPageLayout tests still pass.

---

### P-06: Rate-Limit Countdown Timers Conflict After Merge

**What goes wrong:** Both Calendar pages and their respective PlanSection components manage their own rate-limit countdown timers via `setInterval`. When merged, two independent countdown systems run simultaneously, showing different "wait" times to the user.

**Currently separate rate-limit state:**

| Component | Timer Variables | Uses setInterval |
|-----------|----------------|-----------------|
| `ActivityCalendarPage` | `genRetryAfter`, `swapRetryAfter` | Lines 201-224 (two effects) |
| `ActivityPlanSection` | `genRetryAfter` | Delegate to parent? No — manages own |
| `MealCalendarPage` | `genRetryAfter` | Lines 134-144 (one effect) |
| `DailyMealPlanSection` | `genRetryAfter` | Delegate to parent? No — manages own |

**Why the timers conflict after merge:**
- `genRetryAfter` in Calendar page and `genRetryAfter` in PlanSection are independent state variables, both decreasing every 1s via `setInterval`
- When one hits a rate limit, it shows "Wait X:XX" — but the other component might not know and still show "Generate"
- Both countdowns fire `setInterval` independently, consuming more browser resources
- If the user sees two different countdowns, they can't tell which is accurate

**Prevention:**
- Unify rate-limit state into a single source of truth. The Calendar page's `genRetryAfter` should be the canonical timer; the PlanSection should receive it as a prop.
- Or: only keep rate-limit state in one place and remove it from the other. Since the Calendar is the primary generation UI, remove rate-limit handling from PlanSection.

**Phase to address:** State unification during merge. Requires changes to PlanSection components.

---

### P-07: Dynamic Style Injection Duplication

**What goes wrong:** `ActivityCalendarPage.jsx:16-22` injects a `<style>` element into `document.head` on mount for the swap-spin animation. After merging, this style injection still works — but if both the old page and new page render this component, the style gets injected twice.

```jsx
useEffect(() => {
  if (!document.getElementById('swap-spin-style')) {
    const style = document.createElement('style');
    style.id = 'swap-spin-style';
    style.textContent = '@keyframes swap-spin { ... }';
    document.head.appendChild(style);
  }
}, []);
```

The guard (`!document.getElementById('swap-spin-style')`) prevents duplication. But:
- If the merged page unmounts and remounts (React StrictMode in dev, or component key change), the style stays (no cleanup)
- This was an intentional design decision per comment "CR-03: no cleanup to avoid breaking remaining rows"
- After merging, this style injection is still needed for `DayActivityRow` swap animation. If the component moves, the style must move with it.

**Prevention:**
- Extract the style injection into a module-level constant or a shared utility that injects once, regardless of which component mounts first
- Move from `useEffect` to a lazy singleton pattern: `if (!document.getElementById(...)) inject();`
- Document that this style lives globally and has no cleanup — any component using swap-spin must ensure it exists

**Phase to address:** Shared component extraction. The style injection utility should be created before merging.

---

### P-08: Data Re-Fetch Waterfall on Month Navigation

**What goes wrong:** Navigating to a new month triggers 5-6 parallel `useQueries` for weekly plans (via `useMonthData`). Meanwhile, the target page's own data fetching (summary, history, recent foods) happens independently. These two sets of fetches can create a cascading waterfall that delays rendering.

**How it currently works:**

```
useMonthData(currentMonth, fetchWeekFn)
  → 5-6 parallel getWeeklyPlan calls for each week in month
  → Returns dayStatusMap (Map<string, string>)

Target page mounts:
  → 4 parallel calls: getDailySummary, getDailyLogs, getLogHistory, getRecentFoods
  → Renders summary + history + log form
```

**After merge (worst case):**
```
Page mounts:
  → Calendar useMonthData fires 5-6 parallel queries
  → Target page also fires 4 parallel queries
  → 9-10 total parallel queries on page load
  → If any of these share a rate-limit (they don't currently, but they all use the same JWT session), server may throttle
```

**More importantly:** After month navigation, the Calendar refetches all weeks. But the target page's summary/history only shows "today" — it doesn't change when the calendar month changes. This means every month navigation triggers a re-fetch of 5-6 queries that don't affect the visible data. Unnecessary API load.

**Prevention:**
- Don't re-trigger the target page's data fetching on month navigation. The summary/history sections always show current data.
- Consider lowering `staleTime` on calendar queries from 5min to encourage caching on back-nav
- Verify that `useMonthData`'s `useQueries` doesn't force parent re-fetches (it uses memoized query keys, so this should be OK)

**Phase to address:** During merge, ensure parent data fetching is not tied to calendar month state.

---

### P-09: Past-Day UX Inconsistency Between Sections

**What goes wrong:** The calendar enforces past-day read-only (grey, no interactions). But the log form in the target page shows today's data by default — and has no concept of "past day." When a user selects a past day on the calendar, the log form still shows today's data, creating a split UX.

**How read-only is enforced:**

Calendar page (ActivityCalendarPage.jsx:262):
```jsx
const isPast = selectedDay ? isBefore(selectedDay, startOfToday()) : false;
```

Then passed to DayActivityRow as `disabled={isPast}`. The log form and history in ActivitiesPage have no concept of `selectedDay` — they always show today.

**After merge, these scenarios are broken:**
1. User clicks past day on calendar → Calendar detail shows greyed-out entries ✓
2. User scrolls down to log form → Log form still shows today's data and allows logging ✗
3. User sees calendar summary (today's data) while viewing past month → Which date is "active"? ✗
4. User logs food while calendar shows a future month → Confusing context mismatch ✗

**Prevention:**
- Connect the log form's target date to the calendar's `selectedDay`. When a day is selected on the calendar, the log form should show data for that day.
- For past days: disable logging (consistent with calendar read-only)
- For future days: show "no data" state (future dates can't have logs)
- For today (default): full functionality as currently implemented
- Add a visual indicator showing which date the log form is currently displaying

**Phase to address:** UX integration phase — this is the most user-visible aspect of the merge.

---

### P-10: Toast Notification Competition

**What goes wrong:** Both calendar pages manage their own `toast` state variable. The target pages manage `error` and `successMsg` as separate state. After merge, these are two independent notification systems that can show conflicting messages or overwrite each other.

Currently:
- Calendar pages: single `toast` state → Toast component (positioned fixed)
- Target pages: `error` + `successMsg` → inline `<p>` elements

After merge, an operation in the calendar section could set `error` while the log section shows `successMsg`, or vice versa.

**Prevention:**
- Unify notifications: either use a shared Toast system (preferred) or keep them separate but spatially distinct
- Easiest fix: use separate containers — calendar section has its own Toast (positioned fixed, top-right), log section shows inline messages at section level

**Phase to address:** UI integration during merge.

---

### P-11: Component Import Path Restructuring

**What goes wrong:** The `features/activities/index.js` and `features/food-log/index.js` barrel exports will need updating, potentially breaking imports used by tests and Router.

**Current exports:**

`features/activities/index.js`:
```jsx
export { default as ActivityCalendarPage } from './ActivityCalendarPage.jsx';
```

`features/food-log/index.js`:
```jsx
export { default as FoodLogPage } from './components/FoodLogPage.jsx';
export { default as MealCalendarPage } from './components/MealCalendarPage.jsx';
```

**After merge:**
- `ActivityCalendarPage` export will need to point to the new merged page or be removed
- `MealCalendarPage` export will need similar treatment
- Router.jsx imports these — they'll break if exports are removed

**Prevention:**
- Keep the exports but redirect them: `export { default as MealCalendarPage } from './components/MealCalendarPage.jsx';` can become `export { default as MealCalendarView } from './components/MealCalendarView.jsx';`
- Or: re-export from new location to maintain backward compatibility during transition
- Update Router.jsx imports atomically with the merge

**Phase to address:** First code change in the merge — update exports before or simultaneously with route changes.

---

### P-12: Scroll Position Loss When Switching Contexts

**What goes wrong:** The merged page becomes very long (calendar grid + detail panel + log form + history + recommendations on activity page, or calendar + food search + portion form + log table + history on food log page). Users scrolling between sections lose their position when state changes cause re-renders.

**Page length estimate:**

Activity merged page (vertical stacking):
1. Page title
2. ActivityPlanSection (~150px-400px depending on content)
3. ActivitySummary (~100px)
4. Generate Week button (~50px)
5. CalendarPageLayout (MonthNav ~50px + CalendarGrid ~400px + DayDetailPanel ~100-600px)
6. Recommendations (~200-500px)
7. ActivityLogForm (~300px when visible)
8. ActivityPool (~200px)
9. ActivityHistory (~200px)
**Total: ~1800-2600px of content**

Food Log merged page:
1. Page title
2. DailyMealPlanSection (~150-400px)
3. CalorieSummary (~80px)
4. Generate Day button (~50px)
5. CalendarPageLayout (~500-700px)
6. FoodSearch (~100px)
7. CustomFoodForm (~200px when visible)
8. Portion form + log button (~300px when visible)
9. FoodLogTable (~200-600px)
10. CalorieHistory (~200px)
**Total: ~1800-2500px of content**

**Why scroll position breaks:**
- Any `setState` in the calendar section re-renders the entire page
- DayDetailPanel expands/collapses (0px → 600px) on day selection, shifting everything below it
- On mobile (no max-width constraint), the page is even longer
- Browser scroll position is maintained but the content shifts, making it feel jumpy

**Prevention:**
- Wrap the calendar section in a container with `max-height` and `overflow-y: auto` so it scrolls independently
- On mobile: use a collapsible/expandable calendar section (default: collapsed)
- Keep the DayDetailPanel content within the calendar section container so expansions don't push page content below
- Consider a tab or toggle approach: "Manual Log" | "Calendar View" tabs that show different content rather than stacking everything

**Phase to address:** UX and layout during merge. Should be decided before coding begins.

---

## MINOR PITFALLS

### P-13: Loading State Ambiguity

**What goes wrong:** After merge, there are multiple independent loading states. The page may show "Loading..." from one section while another section is already rendered, or show nothing during the slowest loading section.

Loading states that run in parallel on mount:
- `useMonthData` loading → Calendar shows skeleton
- ActivitiesPage loading → Shows "Loading..." full page
- ActivityPlanSection loading → Shows "Loading activity plan..."
- FoodLogPage loading → Shows "Loading..." full page
- DailyMealPlanSection loading → Shows "Loading meal plan..."

**Risk:** User sees "Loading..." (from ActivitiesPage/FoodLogPage) until the slowest of all parallel fetches resolves. But if sections render independently, parts of the page appear at different times.

**Prevention:** Determine a single loading strategy. Either:
- Show a single page-level loading state until ALL data is ready (simpler, consistent but slower perceived load)
- Show sections as they load (faster perceived load but potential layout shift)

Recommendation: sections-as-they-load with skeleton placeholders, given the page length.

---

### P-14: `useMonthMealData` vs `useMonthData` Hooks

**What goes wrong:** The two calendar pages use different month-data hooks (`useMonthData` for activities, `useMonthMealData` for meals). These hooks have similar interfaces but different internal query structures (5-6 weekly calls vs 28-31 daily calls). If one is accidentally substituted for the other during the merge, data will be wrong or missing.

**Current split:**
- `ActivityCalendarPage` uses `useMonthData(currentMonth, fetchWeekFn)` — fetches weekly plans
- `MealCalendarPage` uses `useMonthMealData(currentMonth)` — fetches daily meal plans (different hook, different API)

This is correct behavior — activities use a weekly plan structure, meals use daily plans. The risk is in the merge: each hook must remain paired with its correct consumption pattern.

**Prevention:** The hooks are already correctly paired. Just ensure the merged page passes the right hook for the right context.

---

### P-15: Missing `Link` Rebase in Dashboard

**What goes wrong:** The `DashboardPlaceholder` in Router.jsx contains hardcoded `<Link>` elements pointing to routes. One of them (`/meal-calendar`) will 404 after the route is removed.

**The dashboard links (Router.jsx:63-74):**
```jsx
<Link to="/profile">Profile, BMI & TDEE</Link>
<Link to="/food-log">Log Food</Link>
<Link to="/meal-calendar">Meal Calendar</Link>          {/* WILL 404 */}
<Link to="/activities">Activity Recommendations</Link>  {/* Stays — points to ActivityCalendarPage currently */}
```

**Fix needed:** Change `/meal-calendar` → `/food-log` (or add a calendar tab within the food-log page and point to `/food-log?view=calendar`)

---

## SUMMARY OF TEST FILES AFFECTED

| Test File | Status | Action |
|-----------|--------|--------|
| `ActivityCalendarPage.test.jsx` | BREAKS (7 tests) | Replace with merged page tests |
| `MealCalendarPage.test.jsx` | BREAKS (7 tests) | Replace with merged page tests |
| `ActivitiesPage.test.jsx` | AT RISK (5 tests) | Update assertions for new page structure |
| `CalendarPageLayout.test.jsx` | SAFE (5 tests) | No changes needed |
| `CalendarGrid.test.jsx` | SAFE | No changes needed |
| `DayDetailPanel.test.jsx` | SAFE | No changes needed |
| `calendarUtils.test.js` | SAFE | No changes needed |
| `useMonthData.test.js` | SAFE | No changes needed |
| `DayActivityRow.test.jsx` | SAFE | No changes needed |
| `ActivitySummary.test.jsx` | SAFE | No changes needed |
| `ActivityLogForm.test.jsx` | SAFE | No changes needed |
| `ActivityHistory.test.jsx` | SAFE | No changes needed |
| `previewCalories.test.js` | SAFE | No changes needed |
| `api-integration.test.js` | AT RISK* | Check if it mocks routes |

*`api-integration.test.js` needs inspection — if it tests `/meal-calendar` API endpoints, those may still work (backend unchanged). If it mocks frontend routes, update accordingly.

---

## PREVENTION CHECKLIST BY PHASE

```
Phase 1: Route Configuration
  ☐ Keep index.js exports (redirect, don't delete)
  ☐ Update Dashboard links
  ☐ Add redirect from old route to new route (optional)
  ☐ Update Router.jsx imports

Phase 2: Component Extraction
  ☐ Extract calendar section into <ActivityCalendarSection> wrapper
  ☐ Extract meal calendar section into <MealCalendarSection> wrapper
  ☐ Unify style injection (swap-spin) into singleton utility
  ☐ Make CalendarPageLayout optionally controlled (accept currentMonth prop)

Phase 3: State Unification
  ☐ Deactivate duplicate auto-gen (keep Calendar's, disable PlanSection's)
  ☐ Unify rate-limit state (Calendar's timer is canonical)
  ☐ Merge toast/error/successMsg into one notification system
  ☐ Connect log form's target date to calendar's selectedDay

Phase 4: Layout & UX
  ☐ Decide stacking strategy: scrollable section vs tabs vs toggle
  ☐ Make calendar section independently scrollable with max-height
  ☐ Mobile: default calendar collapsed
  ☐ Past-day consistency: disable log form for past days
  ☐ Show which date the log form is displaying

Phase 5: Test Updates
  ☐ Replace ActivityCalendarPage.test.jsx → MergedActivityPage.test.jsx
  ☐ Replace MealCalendarPage.test.jsx → MergedFoodLogPage.test.jsx
  ☐ Update ActivitiesPage.test.jsx assertions as needed
  ☐ Verify all SAFE test files still pass
  ☐ Run full test suite before merge commit
```

---

## Sources

- Codebase analysis: `frontend/src/app/Router.jsx`
- Codebase analysis: `frontend/src/features/activities/ActivityCalendarPage.jsx` (347 LOC)
- Codebase analysis: `frontend/src/features/activities/components/ActivitiesPage.jsx` (192 LOC)
- Codebase analysis: `frontend/src/features/activities/components/ActivityPlanSection.jsx` (160 LOC)
- Codebase analysis: `frontend/src/features/food-log/components/MealCalendarPage.jsx` (294 LOC)
- Codebase analysis: `frontend/src/features/food-log/components/FoodLogPage.jsx` (244 LOC)
- Codebase analysis: `frontend/src/features/food-log/components/DailyMealPlanSection.jsx` (184 LOC)
- Codebase analysis: `frontend/src/shared/calendar/CalendarPageLayout.jsx` (106 LOC)
- Codebase analysis: `frontend/src/shared/calendar/hooks/useMonthData.js` (79 LOC)
- Test files: 15 test files inspected (141 tests total)
- `PROJECT.md` line 43-48: "Goal: Merge standalone Activity Calendar and Meal Calendar pages"
