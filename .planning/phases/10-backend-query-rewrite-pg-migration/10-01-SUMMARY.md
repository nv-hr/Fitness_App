---
phase: 10-backend-query-rewrite-pg-migration
plan: 01
subsystem: database
tags: [pg, postgresql, supabase, mysql, migration, error-handling]

# Dependency graph
requires:
  - phase: 09-supabase-setup-schema-migration
    provides: Supabase DATABASE_URL connection string, pg dependency installed
provides:
  - pg Pool connection layer with Supabase SSL config (max: 10, connectionTimeoutMillis: 5000)
  - normalizeDbError() utility mapping 4 PostgreSQL SQLSTATE codes
  - mysql2 dependency removed from package.json
  - .env cleaned of MySQL-specific environment variables
affects:
  - 10-backend-query-rewrite-pg-migration (Plans 02-04: repository rewrites, controller error handling)
  - 11-docker-simplification (Docker config cleanup removing MySQL service)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - pg Pool with connectionString from DATABASE_URL (single connection source)
    - normalizeDbError() pattern for database-agnostic error handling
    - SSL with rejectUnauthorized: true for Supabase connections

key-files:
  created:
    - backend/src/utils/dbErrors.js — normalizeDbError utility for PostgreSQL error code mapping
  modified:
    - backend/src/config/database.js — Rewritten from mysql2/promise to pg Pool
    - backend/package.json — mysql2 removed from dependencies
    - backend/.env — MySQL vars removed, comment updated

key-decisions:
  - "pg Pool uses connectionString from DATABASE_URL env var (no individual host/port/user/pass)"
  - "SSL configured with { rejectUnauthorized: true } per D-09 (strict, preventing MITM)"
  - "normalizeDbError() returns data object — does NOT throw AppError instances (controllers decide error handling)"
  - "mysql2 removed immediately after database.js rewrite per D-03 (clean break, no fallback)"
  - "server.js health check unchanged — await pool.query('SELECT 1') works with pg natively"

patterns-established:
  - "Connection config: single DATABASE_URL, strict SSL, max 10 pool, 5s connect timeout, 30s idle timeout"
  - "Error mapping: 4 SQLSTATE codes (23505, 23503, 23502, 23514) → normalized names"
  - "Error mapper: standalone utility, no direct dependency on database.js"

requirements-completed:
  - QRY-01
  - QRY-05

# Metrics
duration: 8min
completed: 2026-05-28
---

# Phase 10 Plan 01: Database Connection Rewrite Summary

**pg Pool connection layer replacing mysql2, with normalizeDbError utility for PostgreSQL SQLSTATE code mapping**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T03:05:00Z
- **Completed:** 2026-05-28T03:13:00Z
- **Tasks:** 3
- **Files modified:** 4 (3 committed, 1 .gitignore)

## Accomplishments

- Rewrote backend/src/config/database.js from mysql2/promise createPool to pg Pool with Supabase SSL connection string
- Created backend/src/utils/dbErrors.js with normalizeDbError() mapping 4 PostgreSQL SQLSTATE codes to normalized names
- Removed mysql2 dependency from package.json — pg is now the sole database driver
- Cleaned .env of MySQL-specific env vars (DB_ROOT_PASSWORD, DB_USER, DB_PASSWORD), updated comment to `# Database (Supabase PostgreSQL)`
- Verified server.js health check (`await pool.query('SELECT 1')`) works with pg natively without changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite database.js to pg Pool** - `8f5bf06` (feat)
2. **Task 2: Create normalizeDbError() utility** - `aa841e8` (feat)
3. **Task 3: Remove mysql2 dep, clean .env** - `7986616` (feat)

**Plan metadata:** (committed separately)

_Note: All commits use feat(10-01) scope per project convention._

## Files Created/Modified

- `backend/src/config/database.js` - Rewritten from mysql2/promise to pg Pool with Supabase SSL config, max=10, connectionTimeoutMillis=5000, idleTimeoutMillis=30000
- `backend/src/utils/dbErrors.js` - NEW: normalizeDbError() mapping 4 PostgreSQL SQLSTATE codes (23505, 23503, 23502, 23514)
- `backend/package.json` - mysql2 dependency removed; pg ^8.21.0 remains as sole database driver
- `backend/.env` - DB_ROOT_PASSWORD, DB_USER, DB_PASSWORD removed; comment updated (not committed — in .gitignore)

## Decisions Made

- **pg Pool config:** connectionString from DATABASE_URL, strict SSL `{ rejectUnauthorized: true }`, max 10 connections, 5s connection timeout, 30s idle timeout — per D-08, D-09, D-10
- **normalizeDbError() returns data, not throws:** Controllers will use the returned object to check error codes (`normalizeDbError(err).code === 'UNIQUE_VIOLATION'`) instead of catching AppError instances
- **mysql2 removed immediately:** No transitional period — clean break per D-03. The mysql2 package remains in node_modules as "extraneous" (harmless) until `npm prune`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `.env` is in .gitignore (expected — contains secrets), so env var cleanup is a local-only change. Verified via grep that DB_* vars are gone from the file on disk.
- Server startup test fails pre-existing passport.js OAuth2 env var loading issue (unrelated to pg migration — scope boundary). Verified via `npm ls mysql2` and `npm ls pg` that dependency resolution is correct.

## Stubs

None - all changes are production-ready. normalizeDbError() is a standalone utility with no missing data sources.

## Threat Flags

None — no new security-relevant surface introduced. The threat model (T-10-01, T-10-02, T-10-03) is fully addressed by existing .gitignore for .env, parameterized queries pattern unchanged, and strict SSL config.

## Next Phase Readiness

- Foundation for remaining Phase 10 plans (02-04): repository rewrites and controller error handling updates
- database.js now exports pg Pool — all 4 repository imports (`import { pool } from '../config/database.js'`) continue working without changes
- normalizeDbError() ready for use in controllers to replace `err.code === 'ER_DUP_ENTRY'` patterns
- Ready for Plan 02: food.repository.js rewrite

## Self-Check: PASSED

- [x] All 3 created/modified files exist on disk
- [x] All 3 commits visible in git log (8f5bf06, aa841e8, 7986616)
- [x] database.js has no mysql2 references
- [x] dbErrors.js exports normalizeDbError
- [x] package.json has no mysql2 dependency
- [x] .env has no DB_* variables remaining
- [x] server.js health check unchanged and pg-compatible

---
*Phase: 10-backend-query-rewrite-pg-migration*
*Completed: 2026-05-28*
