# Phase 12: Testing & Validation - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate the Supabase migration through automated integration tests and a full-stack Docker smoke test. Migrate existing MySQL-based integration tests (774-line backend suite + 601-line frontend suite) to target Supabase PostgreSQL. Add comprehensive unit tests for pure-logic modules. This is the final v1.2 phase — confirms everything works post-migration before declaring the milestone complete.

**Requirements:** TST-01, TST-02

</domain>

<decisions>
## Implementation Decisions

### Integration Test Database Strategy
- **D-01:** Tests connect to a **separate schema in the existing Supabase project** (e.g., `fitness_test` schema), not a separate Supabase project. Full isolation without project management overhead.
- **D-02:** Test database connection string configured via **`DATABASE_URL_TEST` env var** in the existing `backend/.env` file. Tests override `DATABASE_URL` with this value at startup.
- **D-03:** Test schema populated by running **seed SQL (`schema.sql` + `seed.sql`) on the test schema** before the test suite runs (in `beforeAll`). This validates the migration scripts work correctly while keeping test users created via API as before.

### Integration Test Migration Approach
- **D-04:** **Rewrite `helpers.js` only** — replace MySQL lifecycle management (docker-compose start/stop MySQL) with Supabase test schema setup (create schema if not exists, run seed SQL, run test, drop schema or clean). The existing 31 test cases stay with minimal changes.
- **D-05:** **Update MySQL-specific assertions** — change `is_custom: 1` expectations to `is_custom: true` (PostgreSQL BOOLEAN). DECIMAL/NUMERIC still returns strings from pg driver — those assertions remain unchanged.
- **D-06:** **Frontend API integration test** (`frontend/src/__tests__/api-integration.test.js`, 601 lines) updated alongside backend tests with the same assertion fixes. It forks backend as child process — no helper rewrite needed, backend connects via `DATABASE_URL`.
- **D-07:** **Existing unit tests** (`food.service.test.js`, `previewCalories.test.js`) verified they pass as-is — they have no DB dependency and test functions unchanged by the migration.

### Docker Smoke Test
- **D-08:** **Automated smoke test script** at `backend/scripts/smoke-test.js` — not a manual checklist. Script manages lifecycle: `docker build` → `docker run` with random host port → wait for HEALTHCHECK → `GET /api/health` returns 200 → frontend `index.html` loads → run a mini E2E flow (auth + profile + food log via API against the container) → `docker stop`. Exit code 1 on any failure.
- **D-09:** Full E2E flow within the container — not just health check. Validates the entire deployment artifact (Docker image) works end-to-end.

### Unit Test Expansion
- **D-10:** **Comprehensive unit test coverage** added for all pure-logic modules in `backend/tests/unit/`:
  - `dbErrors.test.js` — error code mapping (23505 → UNIQUE_VIOLATION, etc.)
  - `profile.service.test.js` — BMI formula accuracy, TDEE calculation (Mifflin-St Jeor), validation logic
  - `auth.service.test.js` — password validation, email normalization, PDP consent handling
  - `activity.service.test.js` — goal-based activity filtering logic, randomization bounds
- **D-11:** Unit tests placed in existing `backend/tests/unit/` directory — consistent with `food.service.test.js`.

### the agent's Discretion
- Exact seed SQL execution strategy for test schema (psql via child_process vs pg pool.query)
- Whether to drop/recreate test schema per run or use TRUNCATE-based cleanup
- Docker smoke test port selection strategy (random OS-assigned vs fixed fallback)
- Jest timeout values for test schema setup and Docker build steps
- Whether to run integration tests in a specific order or parallel

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 12 — Goal, success criteria, requirements (TST-01, TST-02)
- `.planning/REQUIREMENTS.md` §v1.2 — Requirements with traceability (TST-01, TST-02)

### Project Decisions
- `.planning/PROJECT.md` §Key Decisions — Supabase PostgreSQL migration, no ORM, single-container Docker
- `.planning/STATE.md` — Current project state, existing test infrastructure, pending todos

### Prior Phase Context (Direct Dependencies)
- `.planning/phases/11-docker-restructure-single-container/11-CONTEXT.md` — Single-container Docker, HEALTHCHECK, docker-compose without MySQL
- `.planning/phases/10-backend-query-rewrite-pg-migration/10-CONTEXT.md` — D-11 (tests against live Supabase), pg Pool config, error mapper
- `.planning/phases/09-supabase-setup-schema-migration/09-CONTEXT.md` — Schema/seed SQL, DATABASE_URL, test schema reference

### Existing Test Files (to be migrated)
- `backend/tests/integration/api.test.js` — 774-line backend integration test suite (all 16 endpoints, ~31 test cases). MySQL-dependent — target of D-04/D-05.
- `backend/tests/integration/helpers.js` — 223-line MySQL lifecycle management. Target of D-04 rewrite to Supabase.
- `backend/tests/unit/food.service.test.js` — 84-line unit test for food validation. Verified as-is per D-07.
- `frontend/src/__tests__/api-integration.test.js` — 601-line frontend API integration test. Updated per D-06.
- `frontend/src/features/food-log/components/__tests__/previewCalories.test.js` — 55-line unit test. Verified as-is per D-07.

### Backend Source Files (for unit test expansion)
- `backend/src/utils/dbErrors.js` — Error code mapping function (D-10 target)
- `backend/src/services/profile.service.js` — BMI/TDEE calculation + validation (D-10 target)
- `backend/src/services/auth.service.js` — Auth validation logic (D-10 target)
- `backend/src/services/activity.service.js` — Activity recommendation logic (D-10 target)
- `backend/src/services/food.service.js` — Already tested via food.service.test.js (D-07)

### Docker Infrastructure (for smoke test)
- `Dockerfile` — Multi-stage Dockerfile (repo root). Used by smoke test script (D-08).
- `docker-compose.yml` — Single-service compose (app only, no MySQL). Smoke test can use `docker compose up` or `docker build + run`.

### Backend Configuration
- `backend/package.json` — Jest + supertest already installed. Test script: `npm test`.
- `backend/src/config/database.js` — pg Pool with DATABASE_URL. D-02 adds DATABASE_URL_TEST override.
- `backend/.env` — Target for DATABASE_URL_TEST env var (D-02).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/tests/integration/api.test.js` (774 lines) — Well-structured test suite covering all 16 endpoints across Auth (10 cases), Profile (6), Food (13), Activities (2). Uses `beforeAll`/`afterAll` with async DB lifecycle. Pattern to preserve and adapt.
- `backend/tests/integration/helpers.js` (223 lines) — Contains `createTestUser()` and `seedTestData()` helpers that work via API calls. These are reusable as-is — only the `startDatabase()`/`stopDatabase()` MySQL functions need replacement.
- `backend/scripts/verify-supabase-connection.js` — Demonstrates pg Pool pattern with DATABASE_URL and SSL config. Reference for the test schema seed SQL execution.
- `frontend/src/__tests__/api-integration.test.js` (601 lines) — Uses `fork()` to start backend as child process with `NODE_ENV=test`. Pattern works unchanged with Supabase — just needs assertion updates (D-06).
- `backend/src/utils/dbErrors.js` (24 lines) — Compact pure function mapping PostgreSQL SQLSTATE codes. Ideal unit test target.

### Established Patterns
- **Test file organization**: Backend tests split into `integration/` (DB-dependent) and `unit/` (pure logic). D-10 follows this pattern for new unit tests.
- **Unique user per test**: Both backend and frontend tests use timestamp+random unique emails to avoid duplicate-key conflicts. D-03/04 preserve this pattern.
- **`NODE_ENV=test`**: `helpers.js` sets it before app imports, disabling aggressive rate limits (`testMax: 1000` instead of `max: 10`). The frontend test also forks backend with `NODE_ENV=test`. This pattern must be preserved.
- **SuperTest agent for auth**: Tests create `request.agent(app)` and register via API to get cookie-based auth. Pattern works identically against Supabase.

### Integration Points
- `backend/src/config/database.js` — Central connection config. Tests will override via `DATABASE_URL_TEST` (D-02). The pg Pool reads `connectionString` from `process.env.DATABASE_URL` — tests set this before importing app.
- `docker-compose.yml` — No longer has MySQL service. The `helpers.js` `startDatabase()` function will be rewritten to run seed SQL against Supabase test schema instead of starting MySQL.
- `backend/package.json` test script — `npm test` runs Jest. D-10 adds new test files under `backend/tests/unit/` — Jest auto-discovers them.
- `frontend/package.json` test script — `vitest run`. D-06 updates assertion expectations in existing test file.
- `Dockerfile` — Multi-stage build with HEALTHCHECK. Smoke test (D-08) builds and runs this.

</code_context>

<specifics>
## Specific Ideas

- The existing `helpers.js` `startDatabase()` function can be repurposed: instead of waiting for MySQL port 3306, it creates (or reuses) the test schema, runs `schema.sql` and `seed.sql` via `pool.query()`, and sets `process.env.DATABASE_URL` to point at the test schema. The `stopDatabase()` can drop the test schema or truncate tables.
- Smoke test script should respect a `SKIP_DOCKER_BUILD` env var to reuse an already-built image during development iteration.
- Unit tests for BMI/TDEE should use known inputs and verify against independently calculated values (e.g., 70kg/175cm/30/male/medium → BMR ~1,685, TDEE ~2,610). These values can be verified against standard Mifflin-St Jeor formula.
- `database.js` currently reads `process.env.DATABASE_URL` at module load time. Tests may need to mock or set this before importing the module. Using `jest.mock()` or `setupFiles` pattern.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-Testing & Validation*
*Context gathered: 2026-05-28*
