# Domain Pitfalls

**Domain:** Calendar-Based Plan UI for Fitness App
**Researched:** 2026-05-31

## Critical Pitfalls

### Pitfall 1: N+1 API Calls for Month Data

**What goes wrong:** Implementing the month grid by fetching daily data — calling `GET /api/daily-meal-plans?date=X` 28-31 times to fill a month grid, or calling `GET /api/weekly-plans` for only the current week and having missing data for other weeks.

**Why it happens:** The existing pages only load a single day or single week of data. A month view spans 4-5 weeks, and developers default to fetching data day-by-day.

**Consequences:** 31 sequential API calls makes the page load time 5-10 seconds. Even parallel calls hit server rate limits and create unnecessary load. Users get a sparse half-loaded calendar.

**Prevention:** Compute which weeks overlap with the viewed month using `getWeekStartsForMonth()` (typically 5-6 Mondays). Fetch all weeks in parallel with `Promise.all()`. The weekly endpoints return 7 days of data with `logged` flags — one round-trip per week is all that's needed.

**Detection:** Count network requests in devtools. If you see more than 8 API calls for a single page load, you're over-fetching. Each weekly plan fetch should be ~1 network request for ~7 days of data.

### Pitfall 2: Making CalendarGrid Domain-Aware

**What goes wrong:** Passing raw activity/meal data structures into CalendarGrid and letting it compute status colors. The grid ends up with `if` statements checking `activity.logged` or `meal.meal_type` to decide colors.

**Why it happens:** Calendar grid examples from tutorials often bake in domain logic. It seems convenient to pass the data directly and let the grid sort it out.

**Consequences:** CalendarGrid can't be reused between activity and meal calendars without copious conditionals. Domain model changes (e.g., renaming `logged` to `completed`) require updates in both the grid and the page components.

**Prevention:** CalendarGrid receives a **precomputed status enum** for each day. The status computation lives in `features/calendar/utils/calendarUtils.js` as a pure function `computeDayStatus(dateStr, planDay, loggedEntries, isPast)`. CalendarGrid only maps enum → color. Activity and meal pages each call `computeDayStatus` with their own domain data.

### Pitfall 3: Week Boundary Misalignment

**What goes wrong:** A month's grid doesn't align with Monday-Sunday weeks. The first week of June 2026 starts on Monday May 25 (previous month). The last week extends into July. The month grid needs 6 rows to show all days, but the data fetch only gets 4-5 weeks.

**Why it happens:** Date math is hard. Developers compute weekStarts from the 1st of the month, missing the partial week at the start.

**Consequences:** Empty cells in the grid (days with no plan data), or the grid showing incorrect status for edge days. The calendar looks broken.

**Prevention:** Use a proven `getWeekStartsForMonth()` that finds the first Monday **on or before** the 1st of the month. Always fetch that leading partial week. Always fetch the trailing partial week that extends into the next month. The function in `calendarUtils.js` handles this with standard Date arithmetic.

### Pitfall 4: Status Computation Mismatch Between Plans and Actual Logs

**What goes wrong:** A day shows "incomplete" (blue) because the plan's logged flags say not done, but the user actually logged the activity/food manually through the non-plan interface (e.g., used the food search to log breakfast instead of the meal plan log button).

**Why it happens:** The plan's `logged` flag is only true when the user clicks "Log This" inside the plan. Manual logging through the food search / activity logger doesn't update the plan's logged flags.

**Consequences:** False "incomplete" days. The user sees blue when they should see green. They click the day and see items marked as not logged, creating confusion.

**Prevention:** Cross-reference plan data with activity/food log history. `computeDayStatus()` receives both `planDay` (plan-internal flags) and `loggedEntries` (actual logged entries from history). If the plan says incomplete but there are logged entries for that day, use the log history as the source of truth. Fetch `GET /api/activities/history?days=62` and `GET /api/food/history?days=62` alongside the weekly plans.

## Moderate Pitfalls

### Pitfall 5: Auto-Generate Fires on Every Month Navigation

**What goes wrong:** The auto-generate-on-view-today logic fires every time the user navigates to the current month, even if a plan already exists. The user gets a "generating" spinner every time they switch back to the current month.

**Why it happens:** The existing `useEffect` pattern checks `if (!loading && !plan)` and auto-generates. In a month view, "no plan" could mean "no plan for this week" — but the code checks `plan` as a single value, not per-week.

**Prevention:** Auto-generate only when `dayStatuses[today]` is `MISSED_PAST` or `EMPTY_FUTURE` (no plan and no logged entries). Use a ref guard (same pattern as existing `autoGenGuard`) to prevent re-firing. The condition should be: "is today visible AND does today have no plan AND is there no plan generating in progress."

### Pitfall 6: Detail Panel Content Layout for Days with Logged Items Outside Plan

**What goes wrong:** A day shows "completed" (green) because the user manually logged activities/food, but when they click the day, the detail panel shows "No plan for this day" because no weekly plan exists for that date.

**Why it happens:** The status computation cross-references log history (correct — shows green), but the detail panel only renders from plan data (incorrect — shows nothing).

**Prevention:** The detail panel must handle two states:
- **Plan exists:** Show plan data with DayActivityRow / MealRow
- **No plan but logged entries exist:** Show logged entries as a simple list (read-only), or show "Activities logged: [count]" / "Meals logged: [count]" with a link to the manual log pages

### Pitfall 7: Stale Weekly Plan Data After Log Action

**What goes wrong:** User logs an activity from the detail panel. The API response updates the weekly plan's `logged` flag. But the monthly aggregation map (`planDays`) still has the old data because it was built from a previous fetch that included this same week.

**Why it happens:** The weekly plan cache (both backend `node-cache` and in-memory frontend state) contains the plan before the log action. The log endpoint updates the DB but may or may not update the cache.

**Prevention:** After any log or swap action, re-fetch the affected week's plan (`getWeeklyPlan(weekContainingDate)`) and merge the updated week into the `planDays` map. Alternatively, optimistically update the local state (matching the existing pattern in `DayMealCard` and `ActivityPlanSection`).

## Minor Pitfalls

### Pitfall 8: Past Day Read-Only UX

**What goes wrong:** Users click a grey past day and see empty detail panel with no explanation.

**Prevention:** Show a clear message: "This date is in the past. Activity/meal logging is available only for today." Keep the detail panel consistent with the past-day visual context.

### Pitfall 9: Large History Fetch for Month Range

**What goes wrong:** `GET /api/activities/history?days=62` fetches two months of history when the month view might only need the current month plus edge weeks (about 40 days).

**Prevention:** Calculate the exact date range needed from the grid boundaries and pass a precise `days` parameter, or use date-range query params if the endpoint supports it. Alternatively, just over-fetch — history data is typically small (a few KB).

### Pitfall 10: Inconsistent Color Scheme

**What goes wrong:** The activity calendar uses blue = incomplete, green = completed, grey = past. The meal calendar uses different colors. Users get confused.

**Prevention:** Both calendars use the same color scheme from the shared `DAY_STATUS` enum. The `DayCell` component is the single source of truth for color mapping. Both pages pass status from the same enum.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: CalendarGrid date math | Pitfall 3 — Week boundary misalignment | Use tested `getWeekStartsForMonth()` utility; unit test with June 2026 (covers month boundary case) |
| Phase 2: ActivityCalendar status | Pitfall 4 — Plan vs manual log mismatch | Cross-reference activity history; `computeDayStatus` receives both data sources |
| Phase 3: MealCalendar data loading | Pitfall 1 — N+1 daily calls | Use weekly meal plan endpoints; verify with network tab during development |
| Phase 4: Component cleanup | Removed components still imported | Use glob search for imports before deleting; check Router.jsx for removed routes |

## Sources

- Codebase analysis of existing `WeeklyPlanPage.jsx`, `MealPlanPage.jsx`, `ActivitiesPage.jsx`, `FoodLogPage.jsx` — auto-generation, state management, and API patterns observed
- Analysis of `DayActivityRow.jsx`, `MealRow.jsx` — component props and reuse surface area
- Calendar date math standard patterns (first Monday on or before month start, 6-row grid)
- Existing patterns: `autoGenGuard` ref pattern, `dayRetryAfters` rate limit map, `Promise.all` parallel fetch
