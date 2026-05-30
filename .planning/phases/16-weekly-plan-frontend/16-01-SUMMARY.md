---
phase: 16-weekly-plan-frontend
plan: 01
subsystem: api
tags: [express, node-cache, postgres, rate-limiter]
requires:
  - phase: 15-llm-backend-integration
    provides: llm.service.js with generateWeeklyPlan, getCachedPlan, setCachedPlan; weeklyPlanRateLimiter (5/15min); weeklyPlan.controller.js with generate; weeklyPlan.routes.js with POST /generate
provides:
  - GET /api/weekly-plans endpoint (no rate limit) for read-only plan retrieval
  - POST /api/weekly-plans/regenerate-day endpoint (with 5/15min rate limiter) for single-day regeneration
  - regenerateDay service function that generates a fresh plan and merges only the requested day
affects: [Phase 16 frontend plans (16-02, 16-03) that consume these endpoints]
tech-stack:
  added: []
  patterns:
    - "GET endpoint reads from in-memory cache first, falls back to DB query"
    - "regenerateDay generates full plan but merges only one day into existing cached plan"
key-files:
  created: []
  modified:
    - backend/src/controllers/weeklyPlan.controller.js
    - backend/src/routes/weeklyPlan.routes.js
    - backend/src/services/llm.service.js
key-decisions:
  - "GET endpoint returns cached plan with fromCache:true flag when available, avoiding DB hit and not consuming rate-limit quota"
  - "regenerateDay generates a full week plan internally but extracts only the requested day, merging it into the existing cached plan to preserve other days"
  - "Both POST /generate and POST /regenerate-day share the same weeklyPlanLimiter (5 req/15min per user)"
  - "regenerateDay handler uses function rename (regenerateDayHandler) to avoid name collision with imported regenerateDay service function"
patterns-established:
  - "Rate-limiter middleware applied at route level, not controller level, for clear separation of concerns"
  - "Controller functions delegate to service layer for business logic (generateWeeklyPlan, regenerateDay)"
requirements-completed: [LLM-02, LLM-03]
duration: 12min
completed: 2026-05-30
---

# Phase 16 Plan 01: Weekly Plan Backend Endpoints Summary

**GET endpoint for read-only plan retrieval (no rate-limit cost) and POST endpoint for single-day regeneration (shares 5/15min rate limiter)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-30T23:31:00Z
- **Completed:** 2026-05-30T23:43:09Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added GET /api/weekly-plans endpoint with cache-first strategy (no rate limiter, per D-02/D-03)
- Added POST /api/weekly-plans/regenerate-day endpoint with 5/15min rate limiter (per D-06/D-09)
- Added `regenerateDay` service function in llm.service.js that generates a fresh plan and merges only the requested day into cache
- Implemented input validation for dayIndex (must be number 0-6) and weekStart (valid date format)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GET endpoint for read-only plan retrieval** - `c8b72d5` (feat)
2. **Task 2: Add POST regenerate-day endpoint** - `f29b1bd` (feat)

## Files Created/Modified

- `backend/src/controllers/weeklyPlan.controller.js` - Added `get` and `regenerateDayHandler` controller functions; imported `getCachedPlan`, `regenerateDay`, `pool`, and `AppError`
- `backend/src/routes/weeklyPlan.routes.js` - Added `GET /` and `POST /regenerate-day` routes; GET has no limiter, POST uses `weeklyPlanLimiter`
- `backend/src/services/llm.service.js` - Added `regenerateDay` function that generates a full plan and merges only the requested day into the cached plan

## Decisions Made

- **GET endpoint cache-first strategy:** Returns cached plan with `fromCache: true` flag when available, avoiding DB and rate-limit cost
- **Shared rate limiter for both POST endpoints:** Both `/generate` and `/regenerate-day` share the same `weeklyPlanLimiter` (5 req/15min) to prevent quota abuse
- **Controller function renamed to `regenerateDayHandler`:** Avoids name collision with the imported `regenerateDay` service function
- **regenerateDay generates full plan then merges:** Generates a complete week plan via `generateWeeklyPlan`, extracts only the requested day, and deep-merges into the existing cached plan to preserve all other days

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GET endpoint ready for frontend consumption in Phase 16 Plan 02 (plan retrieval)
- POST /regenerate-day endpoint ready for Phase 16 Plan 03 (regeneration UI)
- Both endpoints tested via Node.js syntax validation (all files parse correctly)

## Self-Check: PASSED

- Files verified: controller ✓, routes ✓, llm.service ✓, SUMMARY ✓
- Commits verified: c8b72d5 ✓, f29b1bd ✓

---

*Phase: 16-weekly-plan-frontend*
*Completed: 2026-05-30*
