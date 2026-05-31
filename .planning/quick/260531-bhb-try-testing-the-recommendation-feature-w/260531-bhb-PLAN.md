---
phase: quick-bhb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/tests/integration/weeklyPlan.e2e.test.js
autonomous: true
requirements: []
must_haves:
  truths:
    - "A real LLM weekly plan generation test exists and can be run independently"
    - "The test creates an authenticated user with profile, calls the real /api/weekly-plans/generate endpoint, and validates the response"
    - "The test outputs the LLM model used and generation timing for inspection"
  artifacts:
    - path: "backend/tests/integration/weeklyPlan.e2e.test.js"
      provides: "Real LLM end-to-end test for weekly plan generation"
      contains: "describe('Weekly Plan E2E - Real LLM')"
  key_links:
    - from: "weeklyPlan.e2e.test.js"
      to: "helpers.js"
      via: "import { startDatabase, stopDatabase, createTestUser, seedTestData }"
    - from: "weeklyPlan.e2e.test.js"
      to: "POST /api/weekly-plans/generate"
      via: "supertest agent.post('/api/weekly-plans/generate')"
---

<objective>
Create a real end-to-end integration test that hits the actual LLM (OpenRouter) via the weekly plan generation API and validates the response.

Purpose: The existing 42 unit tests for llm.service.js mock the LLM responses. This test verifies the real pipeline — auth middleware → controller → LLM service → OpenRouter API → response parsing → plan validation — actually works end-to-end with real data and a real API call.

Output: `backend/tests/integration/weeklyPlan.e2e.test.js` — a self-contained test that can be run with `npm test -- --testPathPattern=weeklyPlan.e2e`
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>

## Key Files

- **Test helpers:** `backend/tests/integration/helpers.js` — exports `startDatabase`, `stopDatabase`, `createTestUser`, `seedTestData`
- **Existing integration tests:** `backend/tests/integration/api.test.js` — 1098 lines, establishes the pattern for auth+profile setup before tests
- **LLM service:** `backend/src/services/llm.service.js` — `generateWeeklyPlan(deps)` with retries, correction prompts, caching, and fallback logic
- **Controller:** `backend/src/controllers/weeklyPlan.controller.js` — `generate` handler calls `generateWeeklyPlan` with profile/history/activities data fetchers
- **Routes:** `backend/src/routes/weeklyPlan.routes.js` — `POST /generate` with `weeklyPlanLimiter`, `authenticateToken` middleware
- **Rate limiter:** `backend/src/middlewares/weeklyPlanRateLimiter.js` — in NODE_ENV=test: 1000 requests / 1s window (effectively unlimited)
- **System prompt:** `backend/prompts/system-prompt.md` — template with profile variables, activity list, and JSON response format constraints

## Key Interfaces (extracted from codebase)

From `backend/tests/integration/helpers.js`:
```javascript
export async function startDatabase(timeoutMs = 30000)  // drops/creates fitness_test schema, runs schema.sql + seed.sql
export async function stopDatabase()                     // drops fitness_test schema
export async function createTestUser(agent)              // registers user via API, returns { agent, email, password, user }
export async function seedTestData(agent)                // creates profile + food log, returns { profile, foodLogId }
```

From `backend/src/middlewares/weeklyPlanRateLimiter.js`:
```javascript
// NODE_ENV=test: windowMs=1000, max=1000 — effectively no rate limit
```

## Run Command
```bash
cd backend
npx cross-env NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=weeklyPlan.e2e --verbose
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create real LLM end-to-end test for weekly plan generation</name>
  <files>backend/tests/integration/weeklyPlan.e2e.test.js</files>
  <action>
    Create `backend/tests/integration/weeklyPlan.e2e.test.js` that:

    1. **Setup (beforeAll, 90s timeout):**
       - Call `startDatabase()` to create fresh test schema (same as api.test.js)
       - Create a `request.agent(app)` and register a test user via `createTestUser(agent)`
       - Create a profile via `POST /api/profile` with: `{ weightKg: 75, heightCm: 180, age: 32, gender: 'male', fitnessGoal: 'maintain', activityLevel: 'moderate' }`
       - **Do NOT** call `seedTestData` — it's for food logging, not needed for weekly plan generation
       - Log the profile creation status

    2. **Test: "POST /api/weekly-plans/generate returns a valid weekly plan from real LLM" (120s timeout):**
       - Call `agent.post('/api/weekly-plans/generate').send({})` (no weekStart = defaults to current Monday)
       - Expect `res.status === 200`
       - Expect `res.body.success === true`
       - Expect `res.body.data` to have `plan`, `fromCache`, and `status` fields
       - Expect `res.body.data.plan.days` to be an array of **exactly 7** objects
       - For each day:
         - Expect `day.date` to be a valid ISO date string (YYYY-MM-DD)
         - Expect `day.activities` to be an array with **1-4** entries
         - For each activity:
           - Expect `act.activity_id` to be a positive integer
           - Expect `act.name` to be a non-empty string
           - Expect `act.duration_min` to be an integer between 10 and 180
           - Expect `act.intensity` to be one of: `'light'`, `'moderate'`, `'vigorous'`
       - Expect `res.body.data.plan.generated_at` to be a valid ISO timestamp
       - Expect `res.body.data.plan.status` to be either `'active'` or `'fallback'`
       - **Log to console:**
         - "✓ LLM model used: {llm_model || 'unknown'}"
         - "✓ Generation time: {elapsed}ms" (measure wall-clock time)
         - "✓ Plan status: {status}"
         - "✓ Day activities summary: Mon={n1}, Tue={n2}, ... Sun={n7}" (activity count per day)

    3. **Test: "GET /api/weekly-plans returns the generated plan from DB/cache" (30s timeout):**
       - Call `agent.get('/api/weekly-plans')` to retrieve the plan
       - Expect 200 + success: true
       - Expect plan to have 7 days (same structure validation as above, but lighter — just check days.length === 7 and plan exists)

    4. **Cleanup (afterAll, 30s timeout):**
       - Call `stopDatabase()` to drop the test schema

    5. **Imports:**
       ```javascript
       import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
       import request from 'supertest';
       import app from '../../src/app.js';
       import { startDatabase, stopDatabase, createTestUser } from './helpers.js';
       ```

    6. **Test file metadata:** Add JSDoc header explaining this is a real LLM test (not mocked), requires OPENROUTER_API_KEY in .env, costs money to run, and is excluded from CI if needed.

    7. **Important implementation details:**
       - Use `jest.setTimeout()` in beforeAll and afterAll to set appropriate timeouts (90s for setup, 120s for the LLM test, 30s for cleanup)
       - The rate limiter is already set to 1000 requests / 1s in test mode — no rate limit concern
       - The LLM service has fallback logic: if the primary model fails, it tries fallback, then resorts to template-based fallback. The test should pass even if the LLM falls back (status === 'fallback' is acceptable), but should properly FAIL if the request itself returns an error (5xx, auth failure, etc.)
       - Do NOT call `seedTestData` — it creates a food log entry which is irrelevant to this test
       - The profile IS required (LLM service calls `getProfile` to build the system prompt)
       - The test must use the `@jest/globals` import style (matching existing api.test.js)
       - Use `process.env.NODE_ENV = 'test'` — already set by jest.setup.js which runs as setupFiles
       - The app imports database pool from `src/config/database.js` — it will use DATABASE_URL which jest.setup.js overrides to DATABASE_URL_TEST

  </action>
  <verify>
    <automated>
      cd backend; npx cross-env NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=weeklyPlan.e2e --verbose --forceExit 2>&1
    </automated>
  </verify>
  <done>
    - Test file exists at `backend/tests/integration/weeklyPlan.e2e.test.js`
    - Test passes with the real LLM (returns either 'active' or 'fallback' status)
    - Console output shows: model used, generation time, and per-day activity summary
    - Plan structure is fully validated (7 days, 1-4 activities each, valid fields)
    - Test schema is cleaned up after run (stopDatabase)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test→OpenRouter API | Test sends real API call to external LLM provider — exposes API key and incurs cost |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-bhb-01 | Information Disclosure | `.env` OPENROUTER_API_KEY | mitigate | API key already in `.env` (gitignored per `.gitignore`). Test only reads it at runtime via `process.env`. No API key is logged. |
| T-bhb-02 | Denial of Service | OpenRouter API call | accept | Real LLM call costs ~$0.001-0.01 per request. Test designed to be run on-demand, not in CI. Each run consumes one call with retries (max 2 attempts = 2-3 calls worst case). User is aware — this is the explicit purpose of the task. |
| T-bhb-03 | Resource Exhaustion | Test database schema | mitigate | `stopDatabase()` in `afterAll` drops the test schema. Even on test failure, the `afterAll` hook runs. |
</threat_model>

<verification>
1. Run `cd backend; npx cross-env NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=weeklyPlan.e2e --verbose --forceExit`
2. All tests pass (LLM generation + plan retrieval)
3. Console output shows model name, elapsed time, and day-by-day activity breakdown
4. No test schema left behind (verify by checking `fitness_test` schema existence — but this is handled by stopDatabase)
</verification>

<success_criteria>
- Test file committed and passing
- Real LLM call succeeds and returns a valid 7-day weekly plan with properly structured activities
- Output demonstrates the full end-to-end pipeline works: auth → profile → LLM generation → plan validation → retrieval
</success_criteria>

<output>
After completion, create `.planning/quick/260531-bhb-try-testing-the-recommendation-feature-w/260531-bhb-SUMMARY.md`
</output>
