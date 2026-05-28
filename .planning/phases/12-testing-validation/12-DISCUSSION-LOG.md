# Phase 12: Testing & Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 12-Testing & Validation
**Areas discussed:** Integration test DB strategy, Integration test migration approach, Docker smoke test definition, Unit test expansion

---

## Integration Test Database Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase test project | Separate schema in same Supabase project, connected via DATABASE_URL_TEST env var | ✓ |
| Local PostgreSQL container | Add PostgreSQL to compose for testing — no internet needed but differs from production | |
| Mock the database layer | Mock pool.query() — fastest but lowest confidence for migration validation | |

**User's choice:** Supabase test project — separate schema in existing Supabase project
**Notes:** Test schema populated by running seed SQL before test suite. DATABASE_URL_TEST env var in existing .env file.

---

## Integration Test Migration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite helpers only | Replace helpers.js MySQL lifecycle with Supabase test schema setup. Minimal test changes. | ✓ |
| Rewrite both helpers and tests | Full rewrite from scratch — duplicates effort | |

**User's choice:** Rewrite helpers only, update MySQL-specific assertions

**Follow-up questions:**
- MySQL assertions: Update expectations for PostgreSQL types (`is_custom: 1` → `true`) — ✓
- Frontend tests: Update alongside backend tests (same assertion fixes) — ✓
- Existing unit tests: Verify they pass as-is (no DB dependency) — ✓

---

## Docker Smoke Test

| Option | Description | Selected |
|--------|-------------|----------|
| Automated script | Node.js script managing lifecycle: build → run → health check → E2E flow → cleanup | ✓ |
| Manual checklist | Written procedure requiring human verification | |

**User's choice:** Automated script with full E2E flow

**Follow-up questions:**
- Script location: `backend/scripts/smoke-test.js` — ✓
- Scope: Full E2E flow (auth + profile + food log via API against container) — ✓
- Lifecycle: Script manages lifecycle (build, run, test, stop) — ✓

---

## Unit Test Expansion

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum viable coverage | dbErrors.js + BMI/TDEE calc | |
| Comprehensive | All pure-logic modules: dbErrors, profile.service, auth.service, activity.service | ✓ |
| No — focus on integration | Integration tests already cover endpoints | |

**User's choice:** Comprehensive — add unit tests for dbErrors.js, profile.service.js, auth.service.js, and activity.service.js

**Follow-up questions:**
- Location: `backend/tests/unit/` (existing convention) — ✓

---

## the agent's Discretion

- Exact seed SQL execution strategy for test schema (psql vs pg pool.query)
- Whether to drop/recreate test schema per run or use TRUNCATE-based cleanup
- Docker smoke test port selection strategy
- Jest timeout values for test schema setup and Docker build steps
- Whether to run integration tests in a specific order or parallel

## Deferred Ideas

None — discussion stayed within phase scope.
