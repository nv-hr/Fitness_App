---
phase: 13-database-schema-foundation
plan: 01
subsystem: database
tags: postgresql, schema, enums, node, supabase, openai, node-cache

# Dependency graph
requires:
  - phase: 12-testing-validation
    provides: Integration test infrastructure
provides:
  - activity_logs table with intensity tracking and FK constraints
  - weekly_plans table with JSONB plan_data and UNIQUE(week_start, user_id)
  - intensity_level ENUM (light, moderate, vigorous)
  - Drop script for deprecated user_activity_log table
  - openai@^6.1.0 and node-cache@^5.1.2 npm packages
  - Node >=18 engine guardrail for openai@^6 compatibility
affects:
  - 14-activity-logger
  - 15-llm-integration

# Tech tracking
tech-stack:
  added:
    - openai@^6.39.1 — LLM integration for weekly activity suggestions
    - node-cache@^5.1.2 — In-memory caching for rate-limited LLM calls
  patterns:
    - Schema ENUMs use separate DO $$ blocks for idempotent creation
    - New tables follow IF NOT EXISTS pattern from existing schema
    - verify-schema.js follows smoke-test.js ES module + Pool pattern

key-files:
  created:
    - backend/db/drop_user_activity_log.sql
    - backend/scripts/verify-schema.js
  modified:
    - backend/db/schema.sql
    - backend/package.json
    - Dockerfile

key-decisions:
  - "Separated intensity_level into its own DO $$ block instead of integrating into existing block — cleaner diff and respects D-08 idempotent ENUM pattern"
  - "verify-schema.js uses pg Pool with connectionString from DATABASE_URL — consistent with backend's database.js pattern"
  - "Both npm packages installed together — openai@^6 requires Node >=18, enforced via engines field in package.json and runtime check in Dockerfile"

requirements-completed: []

# Metrics
duration: 7 min
completed: 2026-05-29
---

# Phase 13: Database Schema & Foundation Summary

**intensity_level ENUM, activity_logs and weekly_plans tables, user_activity_log cleanup script, openai/node-cache packages, Node >=18 guardrails, and db:verify schema validation script**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-29T16:46:36Z
- **Completed:** 2026-05-29T16:54:20Z
- **Tasks:** 5 (4 committed, 1 deployment step)
- **Files modified:** 6

## Accomplishments
- Added `intensity_level` ENUM (light, moderate, vigorous) as idempotent DO $$ block
- Added `activity_logs` table with FK to users and activities, intensity constraint, and composite index on (user_id, logged_date)
- Added `weekly_plans` table with JSONB `plan_data`, status column, and UNIQUE(user_id, week_start) constraint
- Created `drop_user_activity_log.sql` cleanup script (safe for re-run with DROP IF EXISTS)
- Installed `openai@^6.39.1` and `node-cache@^5.1.2` — both resolve and import without errors
- Added `engines: { "node": ">=18" }` guardrail for openai@^6 compatibility
- Added `db:migrate` and `db:verify` npm scripts for schema management
- Added Node version check to Dockerfile in both development and production stages
- Created `verify-schema.js` that checks table existence, column structure, and ENUM type

## Task Commits

Each task was committed atomically:

1. **Task 1: Add intensity_level ENUM, activity_logs, and weekly_plans tables** - `1d5ff45` (feat)
2. **Task 2: Create cleanup script for user_activity_log** - `a6909f8` (feat)
3. **Task 3: Install openai@^6.1.0 and node-cache@^5.1.2** - `13abc83` (feat)
4. **Task 4: Add Node engine guardrail, npm scripts, and verify script** - `9411e31` (feat)
5. **Task 5: Apply schema changes to Supabase** — deployment step, no commit

**Plan metadata:** `pending final commit`

_Note: Task 2/3 had a git index.lock collision during initial commit that required a git reset --soft recovery (documented under deviations)._

## Files Created/Modified
- `backend/db/schema.sql` - Added intensity_level ENUM, activity_logs table, weekly_plans table, indexes
- `backend/db/drop_user_activity_log.sql` - Created cleanup script for deprecated table
- `backend/scripts/verify-schema.js` - Created schema verification script
- `backend/package.json` - Added engines guardrail, npm scripts, openai and node-cache deps
- `backend/package-lock.json` - Auto-updated by npm install
- `Dockerfile` - Added Node >=18 version check in development and production stages

## Decisions Made
- **Separate DO $$ block for intensity_level:** Kept the new ENUM in its own `DO $$ BEGIN ... END $$` block rather than merging into the existing block. This produces a cleaner git diff and follows the existing idempotent ENUM pattern (D-08).
- **verify-schema.js uses pg Pool:** The script uses the same `pg.Pool` pattern as the backend's `database.js`, with `connectionString` from `DATABASE_URL`. Consistent with the existing codebase pattern.
- **Dockerfile Node check added in both stages:** Both development (npm install) and production (npm ci --omit=dev) stages now check Node >= 18 before installing packages, ensuring openai@^6 compatibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Git index.lock collision during parallel commits**
- **Found during:** Task 2/Task 3 (parallel independent tasks)
- **Issue:** Attempting `git add` + `git commit` for Task 2 while the second Task 3 command also ran created an index.lock collision. This resulted in Task 2 getting merged into Task 3's commit with incorrect metadata.
- **Fix:** Ran `git reset --soft 1d5ff45` to return to Task 1's commit, then re-staged and re-committed Tasks 2 and 3 cleanly.
- **Files modified:** backend/db/drop_user_activity_log.sql, backend/package.json, backend/package-lock.json
- **Verification:** git log shows clean sequential commits with correct messages and file associations.
- **Committed in:** Separate commits — re-applied as clean sequential commits.

**2. [Rule 3 - Blocking] Duplicate RUN npm install in Dockerfile development stage**
- **Found during:** Task 4 (reviewing edits)
- **Issue:** The edit that added the Node version check before `npm install` did not remove the original `RUN npm install` line, resulting in two consecutive `RUN npm install` commands in the development stage.
- **Fix:** Removed the duplicate `RUN npm install` line from the Dockerfile.
- **Files modified:** Dockerfile
- **Verification:** Dockerfile now has exactly one `RUN npm install` per stage.

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were necessary for correctness. No scope creep.

## Issues Encountered
- **Supabase project unreachable:** The Supabase host `db.qddyfkmzjmuhhknbyxwt.supabase.co` resolves to IPv6 address only, and IPv6 is unreachable from this environment. Schema SQL files are committed and ready for deployment when network/Supabase is accessible. Task 5 deployment steps documented below.

## User Setup Required

None - no external service configuration required.

## Task 5 Deployment Instructions

Schema SQL is committed and ready. To apply to Supabase:

1. Ensure DATABASE_URL is set in `backend/.env`
2. Run the cleanup script first:
   ```
   psql "$DATABASE_URL" -f backend/db/drop_user_activity_log.sql
   ```
3. Run the schema (idempotent — safe to re-run):
   ```
   psql "$DATABASE_URL" -f backend/db/schema.sql
   ```
4. Re-seed data:
   ```
   psql "$DATABASE_URL" -f backend/db/seed.sql
   ```
5. Verify:
   ```
   DATABASE_URL="$DATABASE_URL" npm run db:verify
   ```

Or use the npm script (if DATABASE_URL is in environment):
```
npm run db:migrate
npm run db:verify
```

## Next Phase Readiness
- Database schema foundation complete — ready for Phase 14 (Activity Logger)
- `activity_logs` table structure is defined and ready for CRUD implementation
- `weekly_plans` table is defined and ready for LLM-generated content in Phase 15
- Schema must be applied to Supabase (Task 5) before Phase 14 development can use new tables
- openai and node-cache packages available for Phase 15 LLM integration

## Self-Check: PASSED

| Check | Status |
|-------|--------|
| backend/db/schema.sql exists | PASS |
| intensity_level ENUM in schema.sql | PASS |
| activity_logs table in schema.sql | PASS |
| weekly_plans table in schema.sql | PASS |
| UNIQUE(user_id, week_start) constraint | PASS |
| idx_activity_logs_user_date index | PASS |
| idx_weekly_plans_user_week index | PASS |
| backend/db/drop_user_activity_log.sql exists | PASS |
| backend/scripts/verify-schema.js exists | PASS |
| npm packages resolve (openai, node-cache) | PASS |
| engines.node >=18 in package.json | PASS |
| db:migrate script in package.json | PASS |
| db:verify script in package.json | PASS |
| Dockerfile Node >=18 check in both stages | PASS |
| Commit 1d5ff45 exists | PASS |
| Commit a6909f8 exists | PASS |
| Commit 13abc83 exists | PASS |
| Commit 9411e31 exists | PASS |

---
*Phase: 13-database-schema-foundation*
*Completed: 2026-05-29*
