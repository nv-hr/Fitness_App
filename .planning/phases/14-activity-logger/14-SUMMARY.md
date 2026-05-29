---
phase: 14-activity-logger
plan: 14
subsystem: api, client
tags: activity-log, calories, express, react, intensity-multipliers
requires:
  - phase: 13-activity-logger-setup
    provides: activity_logs table, activities catalog, schema migration
provides:
  - Backend activity log API (CRUD + summary with net calories)
  - Frontend activity logging UI (form, history, summary components)
affects: phase 15 (LLM weekly suggestions — depends on activity history data)

tech-stack:
  added: []
  patterns:
    - Repository pattern with pg pool for activity_logs CRUD
    - Service layer with ValidationError for activity log business logic
    - Server-authoritative calorie calculation with client-side display-only preview
    - Frontend: component composition (Form, History, Summary, Card) orchestrated by page
    - Grouped history: single JOIN query + JS-side grouping (no N+1)

key-files:
  created:
    - backend/src/services/activityLog.service.js
    - frontend/src/features/activities/components/previewCalories.js
    - frontend/src/features/activities/components/ActivityLogForm.jsx
    - frontend/src/features/activities/components/ActivityHistory.jsx
    - frontend/src/features/activities/components/ActivitySummary.jsx
  modified:
    - backend/src/repositories/activity.repository.js
    - backend/src/controllers/activity.controller.js
    - backend/src/routes/activity.routes.js
    - frontend/src/shared/lib/http.js
    - frontend/src/features/activities/api/activityApi.js
    - frontend/src/features/activities/components/ActivityCard.jsx
    - frontend/src/features/activities/components/ActivitiesPage.jsx
    - frontend/src/features/activities/components/ActivityPool.jsx

key-decisions:
  - "Intensity multipliers: light=0.7, moderate=1.0, vigorous=1.3 (server authoritative)"
  - "ActivityLogForm rendered as dedicated section between recommendations and pool (not inline in card)"
  - "Grouped history via single JOIN query + JS-side grouping (avoids N+1)"
  - "includeEntries=true query param for history endpoint returning full entry details"
  - "apiDelete added to shared HTTP client for DELETE operations"

patterns-established:
  - "Activity components follow food-log component pattern (preview utility, form, summary, history)"
  - "Activity log API endpoints match food log pattern (/log, /logs, /history, /summary)"
  - "Daily summary endpoint parallel-fetches activity totals + food totals + profile"

requirements-completed: []

duration: 5min
completed: 2026-05-29
---

# Phase 14: Activity Logger — Plan Summary

**Full-stack activity logging: backend CRUD API with intensity-based calorie calculation + frontend logging form, grouped history, and daily net calorie summary**

## Performance

- **Duration:** 5 min (12 tasks)
- **Started:** 2026-05-29T18:02:01+07:00
- **Completed:** 2026-05-29T18:06:41+07:00
- **Tasks:** 12
- **Files modified:** 13 (5 created, 8 modified)

## Accomplishments

- **Activity log repository** — 7 new functions (createActivityLog, getActivityLogsByDate, getActivityHistory, getActivityLogsInRange, deleteActivityLog, getDailyActivityTotal, getActivityHistoryWithEntries) with JOIN queries for activity name and metadata
- **Activity log service** — calorie calculation (estimated_calories × duration ratio × intensity multiplier), input validation (activityId, duration 1-1440, intensity enum), daily net calories calculator
- **Activity log controller** — 5 new handlers (logActivity, getActivityLogs, getActivityHistory with optional includeEntries, deleteActivityLog scoped by user, getActivitySummary with parallel fetches)
- **Activity log API routes** — POST /log, GET /logs, GET /history, DELETE /log/:id, GET /summary
- **apiDelete HTTP client** — DELETE method support in shared HTTP client
- **Activity API functions** — 5 new functions matching all API endpoints
- **Activity calorie preview utility** — client-side display-only calorie calculation matching server formula
- **ActivityLogForm component** — duration/intensity/date inputs with real-time calorie preview
- **ActivityHistory component** — expandable date-grouped sections with delete per entry, empty state
- **ActivitySummary component** — active minutes, calories burned/consumed, TDEE target, color-coded net display (surplus=red, deficit=green)
- **ActivityCard updated** — "Log This" button with loading state, backward compatible (no button when onLogClick not provided)
- **ActivitiesPage orchestrator** — full activity logging flow: see recommendations → click Log This → form appears → adjust duration/intensity → see calorie preview → submit → summary updates → history shows entry → delete confirms removal

## Task Commits

Each task was committed atomically:

1. **Task 1: Add activity log repository functions** — `daf7ae7` (feat)
2. **Task 2: Create activity log service** — `a9fb760` (feat)
3. **Task 3: Add activity log controller handlers** — `1bf0d95` (feat)
4. **Task 4: Add activity log routes** — `a08cede` (feat)
5. **Task 5: Add apiDelete to shared HTTP client** — `b42be43` (feat)
6. **Task 6: Add activity log API functions** — `fdfa884` (feat)
7. **Task 7: Create activity calorie preview utility** — `55bfe1e` (feat)
8. **Task 8: Create ActivityLogForm component** — `92daef1` (feat)
9. **Task 9: Create ActivityHistory component** — `8bb2543` (feat)
10. **Task 10: Create ActivitySummary component** — `9e3bb05` (feat)
11. **Task 11: Add log button to ActivityCard** — `1f8d11e` (feat)
12. **Task 12: Update ActivitiesPage orchestrator** — `0e2a176` (feat)

## Files Created/Modified

### Backend (5 files)
- `backend/src/repositories/activity.repository.js` — Added 7 activity log CRUD functions (+159 lines)
- `backend/src/services/activityLog.service.js` — New service: calorie calculation, input validation, net calories (+74 lines)
- `backend/src/controllers/activity.controller.js` — Added 5 activity log handlers (+176 lines)
- `backend/src/routes/activity.routes.js` — Added 5 new API routes (+15 lines)

### Frontend (8 files)
- `frontend/src/shared/lib/http.js` — Added apiDelete function (+4 lines)
- `frontend/src/features/activities/api/activityApi.js` — Added 5 API functions (+21 lines)
- `frontend/src/features/activities/components/previewCalories.js` — New: activity calorie preview utility (+30 lines)
- `frontend/src/features/activities/components/ActivityLogForm.jsx` — New: duration/intensity/date form with preview (+140 lines)
- `frontend/src/features/activities/components/ActivityHistory.jsx` — New: expandable grouped history with delete (+118 lines)
- `frontend/src/features/activities/components/ActivitySummary.jsx` — New: net calorie summary card (+88 lines)
- `frontend/src/features/activities/components/ActivityCard.jsx` — Added Log This button with isLogging state (+25 lines)
- `frontend/src/features/activities/components/ActivitiesPage.jsx` — Updated orchestrator with full logging flow (+100 lines)
- `frontend/src/features/activities/components/ActivityPool.jsx` — Updated to pass onLogClick/isLogging props (+5 lines)

## Decisions Made

- **Intensity multipliers:** light=0.7, moderate=1.0, vigorous=1.3 — consistent across server (activityLog.service.js) and client (previewCalories.js), with server value authoritative
- **Grouped history via single JOIN query + JS-side grouping:** Avoids N+1 queries for date-grouped history display. The `getActivityHistoryWithEntries` repository function returns all rows from a single query; the controller groups by date in memory
- **includeEntries query param:** The history endpoint supports `includeEntries=true` for full detail or simple grouped totals by default
- **Form position:** ActivityLogForm renders as a dedicated section between recommendations and activity pool (not inline in each card), following the food-log pattern for form placement

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all tasks completed without issues.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Activity Logger phase is complete — users can now log activities, view grouped history with expand/collapse, delete entries, and see daily net calorie summary
- Phase 15 (LLM Weekly Suggestions) ready to begin — activity history data is now available via the API for the LLM feature
- The `getActivityHistory` endpoint with `includeEntries=true` provides the grouped history format needed for LLM prompt context

---

*Phase: 14-activity-logger*
*Completed: 2026-05-29*
