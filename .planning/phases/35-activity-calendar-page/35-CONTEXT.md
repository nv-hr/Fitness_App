# Phase 35: Activity Calendar Page - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Activity Calendar page that replaces the current `/activities` route. Uses the shared CalendarPageLayout (from Phase 34) with activity-specific detail panel. Users can browse weekly activity plans via month calendar, generate new weekly plans, swap activities, and toggle completion.

</domain>

<decisions>
## Implementation Decisions

### Activity Calendar Integration
- **Page component**: `src/features/activities/ActivityCalendarPage.jsx` (alongside existing ActivitiesPage)
- **Route**: Replace `/activities` route immediately (not a separate route)
- **Generate button**: In the page above CalendarPageLayout (separate button row, not inside calendar)
- **CalendarPageLayout integration**: Wrap CalendarPageLayout, pass Generate Week button as sibling above, activity detail as DayDetailPanel children

### Auto-generation & Past Days
- **Auto-gen gate**: `useRef(isMonthNavigation)` guard — set true in onMonthChange, checked and cleared in auto-gen useEffect. Does NOT fire on month navigation.
- **Past day UX**: DayDetailPanel renders with disabled DayActivityRow — no swap, no toggle, greyed out styling
- **Completion toggle**: Optimistic update via React Query mutation — calls existing API, updates local state immediately
- **Auto-gen priority**: Auto-gen gate coverage is a testing priority

### Testing
- RTL for ActivityCalendarPage interactions (Generate Week, swap, toggle)
- Unit test for auto-gen ref guard logic
- RTL for swap button rendering and click handler
- RTL for optimistic completion toggle

### the agent's Discretion
- Exact DayActivityRow props for disabled state and completion toggle
- API hook integration details (weeklyPlanApi.js mutations)
- Specific test file organization

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CalendarPageLayout`, `CalendarGrid`, `MonthNav`, `DayDetailPanel` from Phase 34 (`src/shared/calendar/`)
- `DayActivityRow` from `src/features/weekly-plan/components/DayActivityRow.jsx` — needs extension for completion toggle
- `WeeklyPlanPage` from `src/features/weekly-plan/components/WeeklyPlanPage.jsx` — reference for existing generate/auto-gen logic
- `weeklyPlanApi.js` — existing API functions for generate, swap, fetch
- `Toast` component from weekly-plan components
- `RateLimitedButton` from weekly-plan components

### Established Patterns
- Feature modules with `api/`, `components/`, `index.js`
- TanStack React Query mutations with `useMutation` + `useQueryClient` for cache invalidation
- Inline styles throughout
- Route structure in `src/app/Router.jsx`

### Integration Points
- Replace `/activities` route in Router.jsx — render ActivityCalendarPage instead of ActivitiesPage
- Existing `GET /api/weekly-plans` and `POST /api/weekly-plans/generate` endpoints
- Existing `POST /api/activity-plans/swap` endpoint
- Existing `PUT /api/activity-plans/{planId}/activities/{activityId}/complete` endpoint (if exists) or needs to be created

</code_context>

<specifics>
## Specific Ideas

- Generate Week button above calendar triggers the same weekly plan generation as currently in WeeklyPlanPage
- Auto-gen uses useRef guard: `const monthNavRef = useRef(false)` — set in `handleMonthChange`, checked in useEffect
- Past days: `isBefore(day, startOfToday())` check disables all interactions
- DayActivityRow extended with: `onToggle` callback, `disabled` prop, `completed` prop

</specifics>

<deferred>
## Deferred Ideas

- None

</deferred>
