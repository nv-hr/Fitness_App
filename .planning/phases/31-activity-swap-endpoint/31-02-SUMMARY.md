---
phase: 31-activity-swap-endpoint
plan: 02
subsystem: backend
tags: [controller, route, e2e-tests, weekly-plan, activity-swap]
requires: [31-01]
provides: [swap-endpoint]
affects: [llm.service, weeklyPlan.repository, weeklyPlan.controller, weeklyPlan.routes]
tech-stack:
  added: []
  patterns:
    - "swapHandler pattern matching regenerateDayHandler (deps assembly, input validation)"
    - "weeklyPlan.repository.js following activityPlan.repository.js pattern"
    - "swapLimiter following regenerateLimiter pattern (10 req/5min per user)"
key-files:
  created:
    - backend/src/repositories/weeklyPlan.repository.js
  modified:
    - backend/src/services/llm.service.js
    - backend/src/controllers/weeklyPlan.controller.js
    - backend/src/routes/weeklyPlan.routes.js
    - backend/tests/integration/weeklyPlan.e2e.test.js
decisions:
  - "swapActivity implementation: LLM generates single replacement via activity-swap-prompt.md, falls back to random DB activity when LLM fails"
  - "Dual-write: swap updates in-memory cache + persists to weekly_plans DB table"
  - "availableDays propagated from cached plan (not required in request body)"
metrics:
  duration: 3m
  completed_date: 2026-05-31
---

# Phase 31 Plan 02: Activity Swap Endpoint — Controller, Route & Tests

**One-liner:** swapHandler validates inputs, calls swapActivity with fallback to random activity, persists plan via upsertPlan to DB, and mounts POST /api/weekly-plans/swap with swapLimiter.

## Tasks Executed

| # | Name | Type | Commit | Files |
|---|------|------|--------|-------|
| PR | Add swapActivity() to llm.service.js | dev (Rule 3) | `d814b6b` | `backend/src/services/llm.service.js` |
| 1 | Create weeklyPlan.repository.js | auto | `47e14b6` | `backend/src/repositories/weeklyPlan.repository.js` |
| 2 | Add swapHandler to controller + POST /swap route | auto | `e417fe1` | `backend/src/controllers/weeklyPlan.controller.js`, `backend/src/routes/weeklyPlan.routes.js` |
| 3 | Add swap E2E tests | auto | `2ef7424` | `backend/tests/integration/weeklyPlan.e2e.test.js` |

## Implementation Details

### Pre-req: swapActivity in llm.service.js (Rule 3 — blocking dependency from Plan 31-01)

The `swapActivity(deps, activityId, dayIndex)` function:

1. **Input validation** — dayIndex (0-6 number), activityId (positive integer)
2. **Plan retrieval** — from in-memory cache via `getCachedPlan()`
3. **Activity location** — finds the day by dayIndex, and the activity by activity_id within that day
4. **LLM replacement** — builds a swap prompt using `buildPrompt('activity-swap-prompt.md', ...)` with the swapped activity, day context, and week context. Calls LLM with model fallback chain.
5. **Random fallback** — if LLM fails, calls `getRandomActivity(goalTags, 1)` for a random activity from the DB filtered by the user's fitness goal
6. **In-place merge** — deep-clones the cached plan, replaces the target activity, updates cache
7. **Return value** — `{ plan, day, dayIndex, activityIndex, replacement, fromCache: false, status: 'active' }`

### Task 1: weeklyPlan.repository.js

Created `backend/src/repositories/weeklyPlan.repository.js` with:

- `findByUserAndWeek(userId, weekStart, clientOverride)` — SELECT for weekly_plans table, returns row or null
- `upsertPlan(userId, weekStart, planData, status, clientOverride)` — INSERT with ON CONFLICT (user_id, week_start) DO UPDATE, returns row
- Both functions accept optional `clientOverride` for transactions
- Error handling wrapped in `AppError('DatabaseError', ...)` — matches `activityPlan.repository.js` exactly

### Task 2: Controller Handler + Route

**swapHandler** (`weeklyPlan.controller.js`):

1. Extracts `activityId`, `dayIndex`, `weekStart` from `req.body`
2. Validates: activityId presence/type, dayIndex range (0-6), weekStart date format
3. Fetches user profile to map `fitnessGoal` → `goalTags` for fallback callback
4. Assembles `deps` with `getRandomActivity: (tags) => getRandomActivities(tags, 1)`
5. Propagates `availableDays` from cached plan
6. Calls `swapActivity(deps, activityId, dayIndex)`
7. Persists result to DB via `upsertPlan(userId, weekStart, result.plan, 'active')`
8. Returns `successResponse(res, result)`

**Route** (`weeklyPlan.routes.js`):
- `router.post('/swap', swapLimiter, weeklyPlanController.swap)`

### Task 3: E2E Tests

Two new tests added to `weeklyPlan.e2e.test.js`:

1. **Successful swap** — generates a plan, picks an activity from the first activity day, calls POST /swap, verifies:
   - 200 + success=true
   - Replacement has different activity_id and name from original
   - Replacement structure valid (duration_min 10-180, intensity in valid range)
   - Cache updated (GET returns fromCache with replacement present)

2. **400 for missing activity** — generates a plan, calls POST /swap with non-existent activityId (99999), verifies:
   - 400 + success=false
   - Error message matches 'Activity not found in current plan'

## Deviation: Missing Plan 31-01 Deliverables

**Rule 3 — Blocking dependency:** `swapActivity` function was not delivered by Plan 31-01 (only the prompt template and swapLimiter existed). This is a blocking dependency that prevented the controller from functioning. Implemented `swapActivity()` in `llm.service.js` with:

- Swap prompt builder using `activity-swap-prompt.md` template
- LLM call with model fallback chain (`primary → fallback → fallback2`)
- Random activity fallback via `getRandomActivity(goalTags, 1)`
- Cache update after in-place swap
- Input validation matching controller-level checks

All subsequent tasks (controller, route, tests) depend on this function and were implemented on top of it.

## Verification Results

- `node -e "import('./backend/src/controllers/weeklyPlan.controller.js').then(...)"` — swap handler is a function: **PASS**
- `node -e "import('./backend/src/repositories/weeklyPlan.repository.js').then(...)"` — upsertPlan is a function: **PASS**
- `node -e "import('./backend/src/routes/weeklyPlan.routes.js').then(...)"` — routes load: **PASS**
- E2E tests added but require real LLM API key + Supabase test DB to run

## Known Stubs

None. All components are fully wired end-to-end with real implementations (no empty/mock data paths).

## Threat Flags

None. All new code (POST /swap route, swapHandler, upsertPlan) operates within the existing security boundaries:
- Authentication via `router.use(authenticateToken)` (inherited)
- Input validation before any data access (activityId, dayIndex, weekStart)
- DB upsert scoped by user_id from JWT (not from request body)
- Error messages are generic, no SQL internals exposed
