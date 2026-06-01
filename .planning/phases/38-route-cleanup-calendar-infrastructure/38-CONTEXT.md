# Phase 38: Route Cleanup & Calendar Infrastructure - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Safe mechanical changes and component extraction that unblock both page merges for v1.8 UI Consolidation:

1. Route cleanup: Remove `/meal-calendar` route, add client-side redirect to `/food-log`, update navigation links
2. Component extraction: Extract `<ActivityCalendarSection>` and `<MealCalendarSection>` wrapper components from existing calendar pages with self-contained state
3. CalendarPageLayout enhancement: Add optional `defaultDay` prop for auto-selecting a day
4. PROJECT.md correction: Fix route references (`/activities` not `/activity-calendar`)
</domain>

<decisions>
## Implementation Decisions

### Route Redirect Strategy
- Client-side redirect using `<Navigate to="/food-log" replace />` in Router.jsx
- Keep MealCalendarPage export in barrel file (`features/food-log/index.js`) for potential reuse by MealCalendarSection
- Change DashboardPlaceholder nav link: replace "Meal Calendar" link with single "Food Log" link pointing to `/food-log`

### Component Extraction Boundaries
- ActivityCalendarSection wraps CalendarPageLayout + Generate Week button + auto-generation logic (self-contained)
- MealCalendarSection wraps CalendarPageLayout + Generate Day button + auto-generation logic (self-contained)
- Sections placed in their feature's components/ directory:
  - `features/activities/components/ActivityCalendarSection.jsx`
  - `features/food-log/components/MealCalendarSection.jsx`
- Minimal props interface: `dayStatusMap`, `loading`, `error`, `onDaySelect`, `onMonthChange` — passthrough to CalendarPageLayout

### CalendarPageLayout defaultDay Prop
- Optional `defaultDay` prop: auto-selects the given day if provided
- Always sync: re-selects whenever `defaultDay` prop changes (not just on mount)
- Backward-compatible: defaults to `null` (no auto-select when not provided)

### the agent's Discretion
- Internal implementation details of wrapper components (exact prop drilling, state lifting) are at the agent's discretion
- Exact inline styles for new or modified UI elements
- Error handling patterns (toast vs inline messages) within extracted sections

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Router.jsx` (frontend/src/app/) — Route definitions, DashboardPlaceholder with nav links
- `CalendarPageLayout.jsx` (shared/calendar/) — Uncontrolled state owner for month/day selection. Currently no defaultDay prop.
- `ActivityCalendarPage.jsx` (features/activities/) — 347 LOC, wraps CalendarPageLayout + Generate Week + swap + completion toggle
- `MealCalendarPage.jsx` (features/food-log/components/) — 294 LOC, wraps CalendarPageLayout + Generate Day + per-meal log buttons
- `FoodLogPage.jsx` (features/food-log/components/) — 244 LOC, currently today-only, date parameters in APIs but component hardcoded to today
- `ActivitiesPage.jsx` (features/activities/components/) — 192 LOC, confirmed dead code (not imported anywhere)
- Barrel exports: `features/food-log/index.js` exports FoodLogPage and MealCalendarPage; `features/activities/index.js` exports ActivityCalendarPage

### Established Patterns
- Inline styles (no CSS modules or styled-components)
- TanStack React Query for server state (useMonthData, useMonthMealData hooks)
- uncontrolled state in CalendarPageLayout (currentMonth/selectedDay via useState)
- Callbacks for parent notification (onMonthChange, onDaySelect)
- Minimal prop interfaces

### Integration Points
- Router.jsx lines 7-8: Imports from feature barrel files
- Router.jsx lines 88-90: Route definitions for /food-log, /meal-calendar, /activities
- Router.jsx lines 66-73: DashboardPlaceholder nav links
- CalendarPageLayout line 30-31: Internal state initialization for currentMonth and selectedDay

</code_context>

<specifics>
## Specific Ideas

- ActivityCalendarSection should extract the Generate Week button + auto-gen + swap/toggle logic from ActivityCalendarPage
- MealCalendarSection should extract the Generate Day button + auto-gen + log-meal logic from MealCalendarPage
- The defaultDay prop on CalendarPageLayout should use a useEffect that syncs whenever defaultDay changes
- After extraction, the original calendar pages (ActivityCalendarPage, MealCalendarPage) re-export their extracted sections until Phase 39/40 replace them

</specifics>

<deferred>
## Deferred Ideas

- Tab layout implementation — belongs in Phase 39 (Food Log) and Phase 40 (Activity)
- Summary bar placement — belongs in Phase 39/40
- None — discussion stayed within phase scope

</deferred>
