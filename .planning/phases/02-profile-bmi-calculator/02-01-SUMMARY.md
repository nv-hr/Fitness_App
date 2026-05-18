---
phase: 02-profile-bmi-calculator
plan: 01
subsystem: backend
tags: [mysql, express, bmi-calculation, repository-pattern, asian-pacific-cutoffs]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    provides: users table, auth middleware, error/response utilities, repository pattern
provides:
  - Profiles table with FK to users(id) ON DELETE CASCADE
  - Profile CRUD repository (create, findByUserId, updateByUserId)
  - BMI calculation service with Asian-Pacific cutoffs (D-14)
  - Profile controller returning { profile, bmi, bmiCategory }
  - /api/profile routes with authenticateToken + rate limiter (15/15min)
affects: [02-02 (profile UI), 03-tdee-calculator]

# Tech tracking
tech-stack:
  added: []
  patterns: [service layer with pure BMI functions, validation in Indonesian, namespace import for named-export services, rate limiter per route group]

key-files:
  created:
    - backend/src/repositories/profile.repository.js
    - backend/src/services/profile.service.js
    - backend/src/controllers/profile.controller.js
    - backend/src/routes/profile.routes.js
  modified:
    - backend/db/init.sql
    - backend/src/app.js

key-decisions:
  - "BMI computed on-the-fly (no column stored) — follows D-12/D-13"
  - "Validation messages in Indonesian for user-facing errors"
  - "Controller imports service as namespace (* as) since service uses named exports only"
  - "Rate limiter placed before route mounting on /api/profile"

requirements-completed: [PROF-01, PROF-02, PROF-03, BMI-01, BMI-02]

# Metrics
duration: 8min
completed: 2026-05-17
---

# Phase 02 Plan 01: Profile & BMI Calculator Backend Summary

**Profiles table with FK to users, profile CRUD repository, BMI calculation service using Asian-Pacific cutoffs, and /api/profile routes with auth + rate limiting**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-17T15:45:00Z
- **Completed:** 2026-05-17T15:53:00Z
- **Tasks:** 3 completed
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- Profiles table added to init.sql with all 9 columns and FK to users(id) ON DELETE CASCADE
- Profile repository implements create/findByUserId/updateByUserId with parameterized queries and ER_DUP_ENTRY handling
- Profile service calculates BMI on-the-fly with Asian-Pacific cutoffs (underweight <18.5, normal 18.5-22.9, overweight 23-24.9, obese >=25)
- Profile controller returns { profile, bmi, bmiCategory } on create/get/update with Indonesian validation messages
- Profile routes mounted at /api/profile with authenticateToken middleware and 15 req/15min rate limiter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create profiles table schema and profile repository** - `120e4da` (feat)
2. **Task 2: Create profile service with BMI calculation and controller** - `ed32b00` (feat)
3. **Task 3: Create profile routes and wire to Express app** - `7fbaf40` (feat)

## Files Created/Modified

- `backend/db/init.sql` — Added profiles table with FK to users(id) ON DELETE CASCADE
- `backend/src/repositories/profile.repository.js` — 3 CRUD functions with parameterized queries
- `backend/src/services/profile.service.js` — calculateBmi, getBmiCategory, createProfile, getProfile, updateProfile with validation
- `backend/src/controllers/profile.controller.js` — HTTP handlers returning { profile, bmi, bmiCategory }
- `backend/src/routes/profile.routes.js` — POST/GET/PUT /api/profile with authenticateToken
- `backend/src/app.js` — Wired profile routes with rate limiter

## Decisions Made

- BMI computed on-the-fly (no column stored) — per D-12, avoids stale data
- Validation messages in Indonesian (e.g., "Berat badan harus antara 2-300 kg")
- Controller imports service as `* as profileService` since service has no default export
- Rate limiter placed before route mounting to apply to all /api/profile requests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed service import in controller (named exports, no default)**
- **Found during:** Task 3 verification
- **Issue:** profile.controller.js imported `profileService` as default from profile.service.js, but service only has named exports — caused SyntaxError on import
- **Fix:** Changed `import profileService from ...` to `import * as profileService from ...`
- **Files modified:** backend/src/controllers/profile.controller.js
- **Verification:** `node -e "import('./backend/src/routes/profile.routes.js')"` succeeds without error
- **Committed in:** 7fbaf40 (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for route import to work. No scope creep.

## Issues Encountered

None beyond the import fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Profile backend complete — ready for frontend profile UI (Plan 02)
- BMI calculation verified: calculateBmi(70, 170) = 24.2, all category cutoffs correct
- All 5 requirements (PROF-01, PROF-02, PROF-03, BMI-01, BMI-02) satisfied
- Database migration needed: run init.sql against MySQL to create profiles table

## Self-Check: PASSED

All 4 created files verified on disk. All 3 commits verified in git log. All acceptance criteria pass.

---
*Phase: 02-profile-bmi-calculator*
*Completed: 2026-05-17*
