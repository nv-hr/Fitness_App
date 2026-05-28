---
phase: 10-backend-query-rewrite-pg-migration
plan: 04
subsystem: database
tags: [postgresql, pg, query-rewrite, activity, grep-sweep, mysql-migration]

# Dependency graph
requires:
  - phase: 10-01
    provides: pg Pool connection to Supabase PostgreSQL
  - phase: 10-02
    provides: food.repository.js PostgreSQL rewrite patterns
  - phase: 10-03
    provides: profile + user repository PostgreSQL rewrite patterns
provides:
  - PostgreSQL-compatible activity repository queries (?| operator, RANDOM(), $1 placeholders, { rows } destructuring)
  - Boolean comparison fixes in auth service and controller for pg BOOLEAN type
  - Verified zero MySQL patterns remaining in backend/src/ source code
affects:
  - 11-docker-simplification (MySQL references in docker-compose.yml to be removed)
  - 12-testing-phase (MySQL test setup to be migrated)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSONB ?| operator for array overlap (equivalent to MySQL JSON_OVERLAPS)"
    - "ORDER BY RANDOM() for PostgreSQL random sort (equivalent to MySQL RAND())"
    - "pg returns DECIMAL/numeric as string — Number() cast for arithmetic"
    - "pg BOOLEAN type uses true/false, not 1/0"

key-files:
  created: []
  modified:
    - backend/src/repositories/activity.repository.js
    - backend/src/services/auth.service.js
    - backend/src/controllers/auth.controller.js

key-decisions:
  - "activity.repository.js: goal_tags ?| $1 replaces JSON_OVERLAPS(goal_tags, CAST(? AS JSON)) — pg handles JS arrays as text[] params directly"
  - "auth.service.js/auth.controller.js: user.pdp_consent === true replaces === 1 for PostgreSQL native BOOLEAN type"
  - "Non-fixable MySQL references documented for Phase 11 (Docker) and Phase 12 (Integration Tests)"

patterns-established:
  - "Repository pattern: { rows } = await pool.query(sql, [$1, $2...])"
  - "pg BOOLEAN columns: compare with true/false, not 1/0"
  - "JSONB arrays: use ?| operator with JS array parameter for overlap checks"
  - "Random sort: ORDER BY RANDOM() (not RAND())"

requirements-completed:
  - QRY-04
  - QRY-05

# Metrics
duration: 5min
completed: 2026-05-28
---

# Phase 10 Plan 04: Activity Repository Query Rewrite & MySQL Pattern Sweep Summary

**Rewrote activity.repository.js to PostgreSQL syntax, fixed boolean comparisons for pg BOOLEAN type, and verified zero MySQL patterns remain in backend/src/**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-28T10:31:43Z
- **Completed:** 2026-05-28T10:36:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- **Task 1 — activity.repository.js PostgreSQL rewrite:**
  - `JSON_OVERLAPS(goal_tags, CAST(? AS JSON))` → `goal_tags ?| $1` (PostgreSQL JSONB array overlap)
  - `ORDER BY RAND()` → `ORDER BY RANDOM()` (PostgreSQL random sort)
  - All `?` placeholders → `$1, $2` numbered parameters
  - `[rows]` → `{ rows }` destructuring (pg result format)
  - Removed `JSON.stringify(goalTags)` — pg handles JS arrays as text[] params directly
  - All 3 functions (getRandomActivities, getAllActivities, getActivityById) converted

- **Task 2 — Full codebase MySQL pattern sweep:**
  - Fixed `user.pdp_consent === 1` → `user.pdp_consent === true` (3 occurrences in auth.service.js, 1 in auth.controller.js)
  - Verified zero MySQL patterns in `backend/src/`:
    - `ER_DUP_ENTRY`, `LAST_INSERT_ID`, `DATE_SUB`, `CURDATE`, `JSON_OVERLAPS`, `mysql2`
    - `RAND(`, `CAST(`, `pdp_consent === 1`, `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD`
  - Documented non-fixable MySQL references for Phase 11/12

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite activity.repository.js queries to PostgreSQL syntax** - `267a0b1` (feat)
2. **Task 2: Full codebase MySQL pattern sweep and boolean comparison fixes** - `fed5b79` (feat)

**Plan metadata:** (committed below)

## Files Created/Modified

- `backend/src/repositories/activity.repository.js` — All 3 functions rewritten:
  - `getRandomActivities` — `goal_tags ?| $1`, `ORDER BY RANDOM()`, `LIMIT $2`, `{ rows }`
  - `getAllActivities` — `goal_tags ?| $1`, `$1` placeholder, `{ rows }`
  - `getActivityById` — `$1` placeholder, `{ rows }`
- `backend/src/services/auth.service.js` — 3 occurrences of `pdp_consent === 1` → `=== true`
- `backend/src/controllers/auth.controller.js` — 1 occurrence of `pdp_consent === 1` → `=== true`

## Decisions Made

- **JSONB ?| operator:** Activity repository uses `?|` with JS array parameters directly (no JSON.stringify). pg handles JS arrays as PostgreSQL `text[]` params automatically.
- **Boolean comparisons:** All `=== 1` for `pdp_consent` replaced with `=== true` since PostgreSQL uses native BOOLEAN (TRUE/FALSE), not MySQL's TINYINT(1) (0/1).
- **Non-fixable patterns documented:** MySQL references in `docker-compose.yml` (Phase 11), `backend/tests/` (Phase 12), and `backend/db/init.sql` (archival) are intentionally excluded from this phase.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all grep sweeps returned clean results, all syntax checks passed.

## Known Stubs

None — all three modified files are production-ready.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new_db_boundary | activity.repository.js | `goal_tags ?| $1` introduces PostgreSQL-specific JSONB operator at database boundary; still parameterized, no concatenation — low risk |

## Non-Fixable MySQL References (Phase 11/12 Scope)

| File | Description | Target Phase |
|------|-------------|-------------|
| `docker-compose.yml` | MySQL container definition, env vars, volumes, health check, network alias | Phase 11 |
| `backend/tests/integration/helpers.js` | MySQL lifecycle management (start/stop container, wait for port 3306) | Phase 12 |
| `backend/tests/integration/api.test.js` | MySQL reference in file header comment | Phase 12 |
| `backend/db/init.sql` | Original MySQL schema (archival reference) | Phase 11/12 |

## Next Phase Readiness

- All 4 repository files converted to PostgreSQL syntax: food, profile, user, activity
- All MySQL patterns eliminated from `backend/src/` source code
- Auth service/controller boolean comparisons compatible with pg BOOLEAN type
- Phase complete; remaining MySQL references are in Docker and test infrastructure (Plans 11-12)
- Next: Phase 11 — Docker simplification (remove MySQL service)

## Self-Check: PASSED

- [x] All 3 modified files exist: activity.repository.js, auth.service.js, auth.controller.js
- [x] All 3 commits visible in git log: 267a0b1 (Task 1), fed5b79 (Task 2), 117d1f1 (metadata)
- [x] Zero MySQL patterns in backend/src/ — all sweep patterns clean
- [x] activity.repository.js: JSON_OVERLAPS free, ?| operator present, RANDOM() present, { rows } destructuring
- [x] auth.service.js: 3 occurrences of === true, zero occurrences of === 1
- [x] auth.controller.js: 1 occurrence of === true, zero occurrences of === 1
- [x] All 3 modified files pass Node.js syntax check

---

*Phase: 10-backend-query-rewrite-pg-migration*
*Completed: 2026-05-28*
