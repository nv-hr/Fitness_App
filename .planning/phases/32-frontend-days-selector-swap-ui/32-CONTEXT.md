# Phase 32: Frontend — Days Selector & Swap UI - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

User-facing frontend changes for the v1.6 Activity Planner Rework. This phase:
- Adds a days selector to the Generate Plan flow (7 checkboxes, user picks 4-6, stored as availableDays)
- Displays rest days as dedicated rest day cards in the weekly plan view
- Adds swap buttons to each activity in DayActivityRow
- Handles swap loading state (spinner on individual activity row)
- Shows swap errors via toast notifications
- Integrates with backend swap endpoint from Phase 31

Dependencies: Phase 31 (swap endpoint) must be complete.
</domain>

<decisions>
## Implementation Decisions

### Days Selector UI
- Days selector appears as an expandable panel below the Generate button on the WeeklyPlanPage
- 7 checkboxes for each day of the week (Monday through Sunday), pre-selected based on an intelligent default
- User must select 4-6 days; validation enforces this range
- Selected days are sent to the backend as `availableDays` count (not individual day IDs)

### Swap UI & Rest Days
- Swap button appears on each DayActivityRow (next to each individual activity)
- Rest days display as dedicated rest day cards — same DayCard component but with rest day content
- Swap buttons only appear on activity days (not rest days)

### State Management & API
- Loading state: spinner on the swapped activity row only (not the whole card)
- Swap errors: global toast notification at top of page (consistent with existing patterns)
- Plan state updated optimistically or on successful swap response

### the agent's Discretion
- Exact styling of checkboxes, rest day card content, and swap button
- Toast notification implementation (existing library or custom)
- API function naming (`swapActivity` in weeklyPlanApi.js)
- How to pre-select default days in the checkbox panel

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WeeklyPlanPage.jsx` — Main page component with loadPlan, handleGenerate, handleRegenerateDay
- `DayCard.jsx` — Day card with expandable content, activities list, regenerate button
- `DayActivityRow.jsx` — Single activity row within a day card
- `RateLimitedButton.jsx` — Button with rate limit awareness
- `weeklyPlanApi.js` — API client: getWeeklyPlan(), generateWeeklyPlan(), regenerateDay()
- `apiPost/apiGet` from `shared/lib/http.js`
- `EmptyStatePlan.jsx` — Empty state when no plan exists
- `FallbackBanner.jsx` — Banner for fallback plan state

### Established Patterns
- React hooks (useState, useEffect, useCallback) for state management
- Inline styles (no CSS modules in weekly-plan feature)
- Expand/collapse on DayCard headers
- Single-day regeneration via RateLimitedButton
- Feature modules under `frontend/src/features/`
- API functions return full response, components destructure res.data

### Integration Points
- `frontend/src/features/weekly-plan/api/weeklyPlanApi.js` — Add swapActivity API call
- `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx` — Add days selector, swap handler, rest day handling
- `frontend/src/features/weekly-plan/components/DayCard.jsx` — Add rest day variant, pass swap handler
- `frontend/src/features/weekly-plan/components/DayActivityRow.jsx` — Add swap button
</code_context>

<specifics>
## Specific Ideas

- Days selector expands below the Generate button, showing 7 checkboxes (Mon-Sun)
- Selected count must be 4-6, validation shown inline if not met
- Rest day cards show "Rest Day" header with recovery description
- Swap button triggers POST to /api/weekly-plans/swap-activity with activityId and dayIndex
- On successful swap, the activity row updates in-place
- Rate limit errors show retry timer

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
