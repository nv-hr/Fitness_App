---
phase: 33-plan-migration-edge-cases
plan: 01
subsystem: api
tags: [migration, llm, weekly-plan, format-version, edge-cases]

requires:
  - phase: 30-prompt-validation-rework
    provides: format_version field on plans, validatePlanStructure with rest_day awareness
  - phase: 31-activity-swap-endpoint
    provides: swapActivity function, weeklyPlan.repository CRUD, swapHandler endpoint

provides:
  - isOldFormat() pure function for plan format detection
  - Lazy migration of old-format plans on GET request (transparent regeneration)
  - Auto-migration of old-format plans during swap operations
  - 404 NotFoundError for nonexistent activityId in swapActivity

affects:
  - 33-02 (testing plan)
  - Frontend WeeklyPlanPage (transparently receives migrated plans)

tech-stack:
  added: []
  patterns:
    - "Lazy migration pattern: detect old format at load time, regenerate silently"
    - "attemptMigration helper encapsulates LLM regeneration + fallback logic"

key-files:
  created: []
  modified:
    - backend/src/services/llm.service.js
    - backend/src/controllers/weeklyPlan.controller.js

key-decisions:
  - "availableDays default for migrated plans = 5 (CONTEXT.md discretion)"
  - "Migration on LLM failure in GET: retain old format, retry next visit (D-03)"
  - "Migration on LLM failure in swap: throw 500 error (can't swap without valid plan)"
  - "Cache cleared before migration to prevent stale cache hit"
  - "NotFoundError (404) for nonexistent activityId instead of ValidationError (400)"

patterns-established:
  - "Old-format detection: !!plan && plan.format_version === undefined"
  - "Transparent migration: no extra response fields, no user notification"

requirements-completed: [MIGR-01]

duration: 3min
completed: 2026-05-31
---

# Phase 33 Plan 01: Lazy Migration Logic + Swap Edge Case Fixes Summary

**isOldFormat() detection, lazy migration on GET, auto-migration during swap, and 404 fix for nonexistent activityId**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-31T19:51:30Z
- **Completed:** 2026-05-31T19:53:33Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added `isOldFormat()` pure function to `llm.service.js` — detects old-format plans by absence of `format_version` at root level
- Implemented lazy migration in GET handler: old-format plans trigger silent regeneration via `generateWeeklyPlan()` on cache load or DB load path
- Added `attemptMigration()` helper with LLM fallback: on failure, old format is retained transparently; no notification or extra response fields
- Implemented auto-migration in `swapHandler`: old-format plans detected during swap trigger migration before proceeding with swap
- Migration availableDays default = 5 for regenerated plans (CONTEXT.md discretion)
- Fixed nonexistent activityId error in `swapActivity` to return 404 `NotFoundError` (was returning 400 `ValidationError`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add isOldFormat() + 404 fix** - `c9a17c6` (feat)
   - Added `isOldFormat()` to `llm.service.js`
   - Added `NotFoundError` import
   - Fixed 404 for nonexistent activityId in swapActivity

2. **Task 2: Lazy migration in GET handler** - `c1a90fc` (feat)
   - Updated imports with `clearCachedPlan` and `isOldFormat`
   - Added old-format detection in cache path with silent regeneration
   - Added old-format detection in DB path with silent regeneration
   - Added `attemptMigration()` helper function

3. **Task 3: Auto-migration in swapHandler** - `07e3add` (feat)
   - Load plan from cache or DB with old-format detection
   - Auto-trigger migration before swap on old-format plans
   - Migration failure throws 500 AppError (swap requires valid plan)
   - Re-read availableDays from migrated plan

## Files Created/Modified

- `backend/src/services/llm.service.js` — Added `isOldFormat()` function, `NotFoundError` import, 404 fix in swapActivity (lines 6, 263-272, 663)
- `backend/src/controllers/weeklyPlan.controller.js` — Added lazy migration in GET handler, `attemptMigration()` helper, auto-migration in swapHandler (lines 2, 40-53, 70-80, 203-240, 253-282)

## Decisions Made

- **availableDays = 5** for migrated plans, per CONTEXT.md discretion
- **LLM failure in GET**: retain old format, retry next visit (non-blocking, transparent)
- **LLM failure in swap**: throw 500 error — swap cannot proceed without a valid plan
- **Cache cleared before migration** to prevent `generateWeeklyPlan()` from returning stale cache
- **NotFoundError (404)** for nonexistent activityId — semantically correct vs 400 ValidationError

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all tasks straightforward, code aligned with existing patterns.

## Self-Check: PASSED

All 3 claimed files exist. All 3 claimed commits found in git history.

## Next Phase Readiness

- Plan 33-01 code is complete and committed
- Ready for Plan 33-02 (testing): existing unit tests plus new tests for `isOldFormat`, migration flows, and 404 fix
- Threat mitigations applied per plan's threat model (T-33-01 through T-33-03)
