# Project Research Summary

**Project:** Fitness_App — v1.7 Calendar-Based Plan UI
**Domain:** Fitness tracking — Month-grid calendar for activity and meal plans
**Researched:** 2026-05-31
**Confidence:** HIGH

## Executive Summary

The v1.7 Calendar-Based Plan UI replaces the existing section-based plan displays (ActivityPlanSection, DailyMealPlanSection) with standalone calendar-driven pages. Two new pages — **Activity Calendar** (`/activity-calendar`) and **Meal Calendar** (`/meal-calendar`) — each show a month-grid with color-coded day cells (blue=incomplete, green=completed, grey=past/missed) and a detail panel that opens on day click. The core UX pattern is established across health apps (MyFitnessPal, TrainingPeaks, Apple Health, Strava): users browse months to see plan status at a glance, then drill into days for detail.

**The recommended approach:** Build a custom month-grid calendar using **CSS Grid + date-fns** (no full calendar library — they model events, not day status, creating a paradigm mismatch). Share a `CalendarGrid` component across both pages. Compute day status client-side from existing weekly-plan endpoints (5-6 `Promise.all` calls per month, not 28-31 daily calls). Reuse existing leaf components (`DayActivityRow`, `MealRow`, `FallbackBanner`, `RateLimitedButton`) in the detail panels — no duplication, no backend changes. Follow the existing feature-based directory pattern, local useState conventions, and auto-generation logic already proven in v1.3-v1.6.

**Key risks and mitigations:** (1) N+1 API calls — prevented by using weekly endpoints, fetching 5-6 overlapping weeks per month. (2) CalendarGrid coupled to domain logic — prevented by passing precomputed status enums, keeping the grid pure. (3) Week boundary misalignment — prevented by a tested `getWeekStartsForMonth()` utility that captures edge weeks. (4) Plan/log status mismatch — prevented by cross-referencing plan `logged` flags with activity/food history data. (5) Stale data after log/swap actions — prevented by re-fetching the affected week's plan and merging into the month map.

## Key Findings

### Recommended Stack

The research confirms that **no new major library is needed** for the calendar UI. Full calendar libraries (react-big-calendar, @mantine/dates, antd Calendar, trud-calendar) model **events** (start/end times), but this project needs **day status** (completion state) — fundamentally different data models. Using any would add 30-95KB bundle cost while using <20% of features.

**Core technology additions:**

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **date-fns** | ^3.6.0 | Date manipulation (month grid, day math, formatting, comparison) | Tree-shakeable (~1-2KB gzip for 12 functions), zero dependencies, immutable, TypeScript-first, works with existing Vite tree-shaking |
| **clsx** (optional) | ^2.1.1 | Conditional className construction for day cells | 239B gzipped, useful if using CSS class-based styling instead of inline styles |

**What NOT to use:**
- No full calendar libraries (wrong paradigm — events vs status)
- No Moment.js (deprecated, no tree-shaking) or dayjs (less ecosystem, no tree-shaking)
- No Redux/Zustand (local useState is sufficient and matches existing patterns)
- No tailwind-merge (project has no Tailwind)
- No classnames (clsx is smaller and faster)

**date-fns functions needed:** `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `format`, `isSameDay`, `isSameMonth`, `isToday`, `isBefore`, `isAfter`, `addMonths`, `subMonths`, `getDay` — each individually importable, combined ~1-2KB gzip.

**Existing stack remains:** React 19 + Vite 8 + TanStack React Query + React Hook Form + Zod (frontend), Express 5 ESM + Passport JWT + Supabase PostgreSQL (backend). No stack migrations needed.

### Expected Features

**Must have (table stakes)** — features users expect from any calendar-based plan view:

| Feature | Why Expected | Complexity |
|---------|--------------|------------|
| Month grid with day numbers | Non-negotiable — every calendar starts here | LOW |
| Current day highlighted | Users need immediate orientation | LOW |
| Status color coding (blue/green/grey) | Primary value: "how am I doing at a glance" | LOW |
| Click day → detail panel | Fundamental calendar interaction pattern | MEDIUM |
| Navigate between months (arrows + Today button) | Browse past/future plans | LOW |
| Read-only past days (grey, disabled actions) | Cannot edit the past — baseline expectation | LOW |
| Generate button visible (contextual: Week for activity, Day for meal) | Users must be able to initiate plan creation | LOW |
| Auto-generate on empty today | "Why do I have to click Generate?" — carry forward v1.5 pattern | MEDIUM |
| Loading states, error states, rate-limit UX | Existing patterns from current pages | LOW-MEDIUM |
| Activity swap in detail panel | Core interaction from v1.6 | MEDIUM |
| Meal log in detail panel | Core interaction from v1.4/1.5 | MEDIUM |

**Should have (differentiators)** — features that create competitive advantage:

| Feature | Value Proposition | Complexity |
|---------|-------------------|------------|
| LLM-generated plans accessible through calendar history | Past months show AI recommendations — unique vs manual planners | MEDIUM |
| Per-activity swap in calendar detail | Change individual activities without full regeneration | MEDIUM |
| Unified completion status across calendar and logs | Shows both what was planned AND what was logged | HIGH |
| Two calendar types (activity + meal) in single app | Consistent visual language across both domains | MEDIUM |
| Three-way color coding (incomplete/completed/missed) | Richer feedback than binary status | LOW |
| Rest days visually distinct in calendar cells | v1.6 rest day concept integrated into calendar | LOW |

**Defer (v2+):**
- Drag-and-drop activity scheduling
- Week/agenda view toggle
- Streak counter / GitHub heatmap
- Month-over-month comparison charts
- Calendar export (iCal/PDF)
- Custom day notes/reflections
- Month picker dropdown (stretch for v1.7.x)

### Architecture Approach

The architecture follows a **four-layer separation**: (1) shared calendar primitives (`features/calendar/` — pure presentational), (2) page-specific assemblies (`features/activity-calendar/`, `features/meal-calendar/`), (3) existing component reuse layer (DayActivityRow, MealRow, Toast, etc.), and (4) existing API client layer (unchanged). The CalendarGrid receives **precomputed status enums** rather than raw domain data, keeping it reusable across both calendars. Data composition happens in page-specific hooks (`useActivityMonthData`, `useMealMonthData`) that fetch 5-6 weekly plans in parallel via `Promise.all`, aggregate them into a flat `date → planData` map, and compute per-day status by cross-referencing plan data with activity/food history.

**Major components:**

1. **CalendarGrid** (shared) — 7-column CSS Grid, renders DayCell per day, handles month layout. Pure presentational — receives `year`, `month`, `dayStatusMap`, `onDayClick`.
2. **CalendarPageLayout** (shared) — Layout shell combining MonthNav + generate button + CalendarGrid + DayDetailPanel. Manages selected-day and current-month state.
3. **DayDetailPanel** (shared) — Generic detail panel container that renders page-specific content (ActivityDayDetail or MealDayDetail) based on which calendar is active.
4. **ActivityCalendarPage / ActivityDayDetail** — Activity-specific: fetches weekly plans, computes status, renders DayActivityRow in detail panel with swap + completion toggle.
5. **MealCalendarPage / MealDayDetail** — Meal-specific: fetches weekly meal plans, computes status, renders MealRow in detail panel with log action.

**Key data flow:** On mount, `getWeekStartsForMonth()` computes 5-6 Monday weekStarts that overlap the viewed month. `Promise.all` fetches all weeks in parallel. Responses aggregate into `Map<dateString, planDayData>`. `computeDayStatus(dateStr, planDay, loggedEntries, isPast)` produces the status enum for each cell. On day click, plan data is already in memory — no additional fetch.

### Critical Pitfalls

1. **N+1 API Calls for Month Data (CRITICAL)** — Fetching 28-31 daily endpoints instead of 5-6 weekly endpoints. **Prevention:** Use `getWeekStartsForMonth()` to compute the 5-6 overlapping weeks. Fetch all in parallel with `Promise.all`. Weekly endpoints return 7 days of plan data each. Verify with devtools: ≤8 network calls per page load.

2. **Making CalendarGrid Domain-Aware (CRITICAL)** — Passing raw activity/meal data into CalendarGrid and computing status inside it. **Prevention:** CalendarGrid receives **precomputed status enums** from `computeDayStatus()`. Grid only maps enum → color. Activity and meal pages call `computeDayStatus` with their own data. Grid stays pure and reusable.

3. **Week Boundary Misalignment (CRITICAL)** — Month grid starts on a partial week from the previous month; fetch misses edge weeks. **Prevention:** `getWeekStartsForMonth()` finds the first Monday **on or before** the 1st of the month. Always fetches the leading partial week (from prev month) and trailing partial week (into next month). Unit test with June 2026 (covers month boundary case — May 25 start, July 5 end).

4. **Status Computation Mismatch: Plans vs Actual Logs (CRITICAL)** — Plan shows "incomplete" (blue) because user logged food/activity manually instead of through the plan's log button. **Prevention:** `computeDayStatus()` cross-references both `planDay` (plan-internal flags) and `loggedEntries` (actual history). If plan says incomplete but history has entries, use history as source of truth. Fetch `GET /api/activities/history?days=62` and `GET /api/food/history?days=62` alongside weekly plans.

5. **Auto-Generate Fires on Every Month Navigation (MODERATE)** — Switching back to current month triggers unwanted regeneration. **Prevention:** Auto-generate only when `dayStatuses[today]` is `MISSED_PAST` or `EMPTY_FUTURE`. Use a ref guard (same `autoGenGuard` pattern from v1.5) to prevent re-fire. Condition: "is today visible AND has no plan AND no generation in progress."

6. **Stale Weekly Plan Data After Log/Swap (MODERATE)** — Log action updates DB but the in-memory month aggregation map still has old data. **Prevention:** After any log or swap, re-fetch the affected week's plan and merge the updated week into the `planDays` map. Alternatively, optimistically update local state (matching existing `DayMealCard` pattern).

## Implications for Roadmap

Based on research, here is the recommended phase structure:

### Phase 1: Foundation — Calendar Shared Components
**Rationale:** Both calendar pages depend on the shared calendar grid. Building the shared layer first decouples grid logic from domain-specific code and allows parallel development of the two calendar pages in Phase 2/3.

**Delivers:**
- `features/calendar/utils/calendarUtils.js` — `getWeekStartsForMonth()`, `buildMonthGrid()`, `computeDayStatus()`, `DAY_STATUS` enum
- `features/calendar/components/DayCell.jsx` — Individual cell with color coding
- `features/calendar/components/MonthNav.jsx` — Prev/next month + Today button
- `features/calendar/components/CalendarGrid.jsx` — 7-column CSS grid using DayCells
- `features/calendar/components/DayDetailPanel.jsx` — Generic detail panel shell
- `features/calendar/components/CalendarPageLayout.jsx` — Layout combining grid + nav + generate button + detail panel
- `features/calendar/hooks/useMonthRange.js` — Year/month state management + navigation
- Unit tests for all of the above

**Addresses features from FEATURES.md:**
- Category A (Calendar Grid Foundation): Month grid, day click, month navigation, color coding
- CAL-01/CAL-02 foundation: The shared grid that both pages will use

**Avoids pitfalls from PITFALLS.md:**
- Pitfall 2 (Domain-Aware Grid): By keeping CalendarGrid pure — receives status enums, not raw data
- Pitfall 3 (Week Boundary Misalignment): `getWeekStartsForMonth()` is unit-tested

**Research flag:** LOW — Standard CSS Grid + date-fns pattern. Well-documented in habit tracker and health app tutorials. No API dependencies. Skip research-phase during planning.

### Phase 2: Activity Calendar Page
**Rationale:** Activity calendar is the higher-priority page (matches the v1.6 Activity Planner Rework). Builds on Phase 1's shared components. Requires minor extension to `DayActivityRow` for the completion toggle.

**Delivers:**
- `features/activity-calendar/api/activityCalendarApi.js` — Month-range data composition
- `features/activity-calendar/hooks/useActivityMonthData.js` — Fetch + aggregate activity plans, compute day status map, auto-generation trigger
- `features/activity-calendar/components/ActivityDayDetail.jsx` — Detail panel rendering DayActivityRow per activity, swap + toggle log, read-only past state
- `features/activity-calendar/components/ActivityCalendarPage.jsx` — Full page assembly
- `features/activity-calendar/index.js` — Export
- Extension to `DayActivityRow.jsx` — Add `onToggleLog` prop + logged/unlogged rendering
- Update `app/Router.jsx` — Add `/activity-calendar` route
- Tests: useActivityMonthData aggregation, ActivityDayDetail past/empty rendering, full-page integration

**Addresses features:**
- CAL-01: Activity Calendar page (month grid, color coding, detail panel)
- CAL-03 (activity): Generate Week button above calendar
- CAL-04 (activity): Auto-generate on view today
- CAL-05: Past days read-only (shared behavior)
- CAL-06: Activity swap preserved in detail panel
- CAL-08 (activity portion): Remove deprecated interactions (single-day regenerate)

**Uses from STACK.md:** date-fns, existing TanStack Query pattern (or local useState), DayActivityRow component

**Avoids from PITFALLS.md:**
- Pitfall 1 (N+1 Calls): Uses weekly endpoints, 5-6 parallel fetches
- Pitfall 4 (Status Mismatch): Cross-references activity history
- Pitfall 5 (Auto-Gen Fires): ref guard prevents re-trigger
- Pitfall 7 (Stale Data): Re-fetches affected week after swap/log

**Research flag:** MEDIUM — `DayActivityRow` needs design work for the `onToggleLog` prop. Auto-generation logic must exactly match existing v1.5 behavior. Consider `/gsd-research-phase` if the extension surface is uncertain.

### Phase 3: Meal Calendar Page
**Rationale:** Follows the same pattern as Phase 2 but for meals. Can be built in parallel with Phase 2 or sequentially after. `MealRow` already handles logged state — no component extension needed.

**Delivers:**
- `features/meal-calendar/api/mealCalendarApi.js` — Month-range data composition
- `features/meal-calendar/hooks/useMealMonthData.js` — Fetch + aggregate meal plans, compute day status map
- `features/meal-calendar/components/MealDayDetail.jsx` — Detail panel rendering MealRow per meal, per-item log action, read-only past state
- `features/meal-calendar/components/MealCalendarPage.jsx` — Full page assembly
- `features/meal-calendar/index.js` — Export
- Update `app/Router.jsx` — Add `/meal-calendar` route
- Tests: useMealMonthData aggregation, MealDayDetail rendering, log interaction end-to-end

**Addresses features:**
- CAL-02: Meal Calendar page (month grid, color coding, detail panel)
- CAL-03 (meal): Generate Day button above calendar
- CAL-04 (meal): Auto-generate on view today
- CAL-05: Past days read-only (shared behavior)
- CAL-07: Meal log preserved in detail panel
- CAL-08 (meal portion): Remove deprecated interactions (alternative selector)

**Uses from STACK.md:** date-fns, existing MealRow component, dailyMealPlanApi

**Avoids from PITFALLS.md:**
- Pitfall 1 (N+1 Calls): Uses weekly meal plan endpoints (5-6 calls), not daily
- Pitfall 4 (Status Mismatch): Cross-references food history
- Pitfall 6 (Detail Panel Content): Handles "no plan but logged entries" edge case

**Research flag:** LOW — Same architecture as Phase 2. `MealRow` already supports logged state. No component extension needed. Skip research-phase during planning.

### Phase 4: Cleanup — Remove Replaced Components & Update Navigation
**Rationale:** Must wait until both calendar pages are deployed and verified. Prevents breaking the app during transition — old pages remain functional until calendar replacement is confirmed working.

**Delivers:**
- Remove `features/activities/components/ActivityPlanSection.jsx`
- Remove `features/weekly-plan/components/WeeklyPlanPage.jsx`, `DayCard.jsx`, `EmptyStatePlan.jsx`
- Remove `features/meal-plan/components/MealPlanPage.jsx`, `DayMealCard.jsx`, `EmptyStateMealPlan.jsx`
- Remove `features/food-log/components/DailyMealPlanSection.jsx`
- Remove associated tests
- Update navigation links to point to `/activity-calendar` and `/meal-calendar`
- Verify no remaining imports of removed components (glob search)

**Addresses features:**
- CAL-08 completion: Full removal of deprecated patterns and their tests
- Navigation update: Dashboard/menu now links to calendar pages

**Avoids from PITFALLS.md:**
- Pitfall 7 (Removed Components Still Imported): Glob search for imports before deletion
- Phase 4 warning from ARCHITECTURE.md: Coordinate test removal

**Research flag:** MEDIUM — Must audit the entire codebase for import references. Use `rg "ActivityPlanSection|WeeklyPlanPage|DayCard|MealPlanPage|DailyMealPlanSection"` to detect any remaining usage. Consider executing this in a separate verification pass.

### Phase Ordering Rationale

1. **Phase 1 must come first** — Both calendar pages depend on CalendarGrid, DayCell, CalendarPageLayout, and the utility functions. These have zero dependencies on existing feature code (pure presentational) and can be built and tested independently.

2. **Phase 2 and Phase 3 are independent** — They share the same CalendarGrid foundation but differ only in detail panel content and data-fetching hook. They can be built in parallel workstreams or sequentially. Phase 2 (activity) is slightly higher priority because it replaces the more complex v1.6 Activity Planner Rework.

3. **Phase 4 must come last** — Deleting components that are still referenced will break the build. Both calendar pages must be fully deployed and the old pages confirmed unused before cleanup. The old pages remain functional during transition, providing a safety net.

4. **DayActivityRow extension belongs in Phase 2, not Phase 1** — The `onToggleLog` prop is activity-specific. Extending it before Phase 1 would couple the shared foundation to activity domain logic.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Activity Calendar):** MEDIUM — The `onToggleLog` prop extension for `DayActivityRow` needs design. Review existing `DayActivityRow.jsx` to determine the exact prop interface. Auto-generation logic must match v1.5 exactly — review `ActivityPlanSection.jsx` autoGenGuard pattern.
- **Phase 4 (Cleanup):** MEDIUM — Full import graph audit needed. Use `rg` or IDE to find all references to components being deleted.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** LOW — Pure CSS Grid + date-fns pattern. Dozens of working examples in habit tracker tutorials. Standard calendar utility functions.
- **Phase 3 (Meal Calendar):** LOW — Follows identical pattern to Phase 2. `MealRow` already handles logged state (no extension needed). Straightforward replication.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | date-fns v3.6.0 verified via Context7 CDN references. All calendar libraries evaluated and rejected with clear bundle/paradigm rationale. CSS Grid-based custom implementation has dozens of working references. |
| Features | **HIGH** | All 8 CAL requirements mapped to specific components in build order. Color scheme validated against visual accessibility standards and fitness app UX research (PaletteRx, UXmatters). Past-day read-only behavior matches MyFitnessPal, TrainingPeaks, Apple Health. MVP definition clear with v2+ differentiation. |
| Architecture | **HIGH** | Component hierarchy, data flow, and build order verified against existing codebase patterns (directory structure, state management, API patterns). Anti-patterns identified from real calendar implementations. Scaling considerations documented. 698 lines of detailed architecture reasoning. |
| Pitfalls | **HIGH** | 10 pitfalls identified with severity classification, prevention strategies, and detection methods. N+1 API pitfall has clear mitigation (5-6 weekly calls vs 28-31 daily calls). Status mismatch between plans and actual logs addressed with cross-referencing approach. Auto-generation guard pattern carries forward from proven v1.5 implementation. |

**Overall confidence:** HIGH

### Gaps to Address

1. **DayActivityRow extension design** — The `onToggleLog` prop needs its exact TypeScript-type interface determined during Phase 2 planning. Review `DayActivityRow.jsx` current props, the existing log activity API (`POST /api/activity-plans/log`), and the calendar detail panel interaction design. Estimated: small surface area, but must be correct.

2. **Auto-generation exact behavior in month context** — The existing auto-generation logic fires when the page loads and finds no plan for today. In the calendar context, the page loads showing a full month grid. The auto-generation should still fire for "today" specifically, but the implementation needs to check: "is today visible in the current month view AND does today have no plan." The ref guard pattern from v1.5 should carry over directly.

3. **Month data cache invalidation** — The recommended LRU cache (`Map<yearMonth, planData[]>`) for preventing re-fetches during month navigation needs detail: what triggers invalidation? After generate (the plan changed — clear cache for that month)? After log/swap (only the day changed — merge into cache without full re-fetch)? Research suggests optimistic local updates + targeted week re-fetch, but the cache strategy should be explicitly designed in Phase 1.

4. **CSS Grid cross-browser testing** — The calendar uses CSS Grid (`display: grid; grid-template-columns: repeat(7, 1fr)`) which is widely supported but should be tested at 3 viewport widths (mobile 375px, tablet 768px, desktop 1280px+) during each phase. The `aspect-ratio: 1` on day cells ensures square cells but may need `min-height` fallback for older browsers.

5. **History over-fetching** — `GET /api/activities/history?days=62` and `GET /api/food/history?days=62` are recommended for cross-referencing plan vs actual log status. The exact `days` parameter calculation should be refined: grid boundaries may need only ~40 days, not 62. Check if the history endpoints support date-range params instead.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** — `frontend/src/features/` directory structure, WeeklyPlanPage.jsx, MealPlanPage.jsx, ActivitiesPage.jsx, FoodLogPage.jsx, DayActivityRow.jsx, MealRow.jsx — Component composition, state management, API patterns verified
- **Context7 `/date-fns/date-fns`** — Verified v3.6.0 CDN references, function signatures, tree-shaking documentation
- **Context7 `/lukeed/clsx`** — Verified v2.1.1, 239B gzip, zero dependencies

### Secondary (MEDIUM confidence)
- **WebSearch — Health/fitness calendar patterns** — MyFitnessPal, TrainingPeaks, Apple Health, Strava color coding and month grid navigation patterns confirmed across multiple sources
- **WebSearch — Habit tracker calendar tutorials** — Custom CSS Grid + date-fns pattern standard for status-based calendars (confirmed in 5+ tutorials)
- **WebSearch — Calendar library evaluation** — trud-calendar, react-big-calendar, mantine/dates, antd Calendar, Zesor/calendarkit-pro, svar-widgets evaluated and rejected per bundle/paradigm mismatch
- **Color psychology for fitness apps (PaletteRx, UXmatters)** — Green=completion, Blue=calm/neutral, Grey=inactive validated for accessibility and UX
- **UX Patterns (uxpatterns.dev)** — Calendar View pattern documented: header, date grid, event cell, selection state
- **Strava calendar UX case study (mreniewicki.com)** — Month/year dropdown usability findings, day selection behavior

### Tertiary (LOW confidence)
- **RapidNative habit tracker patterns** — Day cell color coding patterns referenced but not directly verified against production apps. Needs validation during implementation.

---

*Research completed: 2026-05-31*
*Ready for roadmap: yes*
