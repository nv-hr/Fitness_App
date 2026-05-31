# Phase 34: Calendar Shared Components - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared month-grid calendar foundation — CalendarGrid, DayCell, MonthNav, CalendarPageLayout, DayDetailPanel, and calendar utility functions that will be used by both the Activity Calendar (Phase 35) and Meal Calendar (Phase 36) pages.

</domain>

<decisions>
## Implementation Decisions

### Calendar Implementation
- **Library**: react-day-picker v9+ for the calendar grid (day-status model, built-in modifiers for color coding, month navigation). Not custom CSS Grid.
- **Date utility**: date-fns ^3.6.0 — tree-shakeable, zero dependencies, ~1-2KB for needed functions (startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameDay, isBefore, isAfter, addMonths, subMonths)
- **Styling**: Inline styles (existing project pattern) — no additional CSS library needed
- **State management**: useState for currentMonth and selectedDay — component-local, consistent with existing page patterns

### Calendar Component Architecture
- **Shared location**: `src/shared/calendar/` — shared directory since both activity and meal calendars consume it
- **CalendarGrid**: Pure presentational — receives precomputed day status array; renders react-day-picker with modifiers for color coding
- **DayDetailPanel**: Slot-based — renders children passed from parent page (flexible for activity vs meal detail)
- **Color coding**: react-day-picker `modifiers` API + `modifierStyles` — blue for incomplete, green for completed, grey for past incomplete, today indicator
- **Detail panel position**: Inline below the calendar grid (not side panel or modal)
- **CalendarPageLayout**: Wraps CalendarGrid (top) + DayDetailPanel slot (bottom)

### Data Fetching & State
- **Month data loading**: Fetch 5-6 weekly plans that overlap with the calendar month using Promise.all — uses existing endpoints (no new backend endpoint)
- **React Query**: Custom `useMonthData(date)` hook wrapping `useQueries` — returns `{dayStatusMap, loading}`
- **Caching**: TanStack React Query default caching (staleTime 5min) — no extra caching layer
- **Navigation state**: useState for currentMonth; selectedDay resets on month change
- **Loading UX**: Show skeleton on first load only; subsequent navigations use React Query cache

### Testing Strategy
- **CalendarGrid rendering**: Vitest + React Testing Library with snapshot test for default render with mock data
- **Utility tests**: Unit tests for all three key functions — `getWeekStartsForMonth()`, `buildMonthGrid()`, `computeDayStatus()`
- **Color logic tests**: Unit tests for each status (blue/green/grey + today/selected)
- **Day click tests**: RTL fireEvent + assert correct selectedDay state updates

### the agent's Discretion
- Specific react-day-picker v9 configuration details (modifier names, style values)
- Exact file structure within `src/shared/calendar/`
- Test file organization within the shared directory
- Animation/transition details for month navigation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/hooks/useResponsive.js` — responsive breakpoint hook for mobile/desktop layout
- `src/shared/lib/http.js` — fetch wrapper for API calls
- TanStack React Query already configured in `src/app/Providers.jsx`
- Inline styles pattern established across all existing components

### Established Patterns
- Feature modules under `src/features/` with `api/`, `components/`, `index.js` structure
- React Hook Form + Zod for form validation (not needed for calendar)
- CSS modules technically available but project uses inline styles exclusively
- Relative imports within the same feature; absolute imports for cross-feature references

### Integration Points
- Router in `src/app/Router.jsx` — routes added in Phase 35 and 36
- **No backend changes needed** — all data uses existing endpoints
- Existing weekly plan API (`src/features/weekly-plan/api/weeklyPlanApi.js`) will be used for data fetching
- Existing meal plan API similarly used in Phase 36

</code_context>

<specifics>
## Specific Ideas

- react-day-picker v9 uses `DayPicker` component with `modifiers` prop for custom day styling
- `modifierStyles` maps modifier names to inline style objects for color coding
- Selected day should persist visually (different border/background) from the status color
- Month data query should derive dayStatusMap from plan data: check each day against fetched plans

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>
