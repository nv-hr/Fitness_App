---
type: quick
description: Write integration tests for all backend API endpoints that lack test coverage
file: backend/tests/integration/remaining-endpoints.test.js
files_modified:
  - backend/tests/integration/remaining-endpoints.test.js
depends_on: []
autonomous: true
---

<objective>
Write integration tests for ALL backend API endpoints currently lacking coverage.

**Purpose:** Close the test gap for 9 uncovered endpoints across 4 route groups + 1 inline route.
**Output:** `backend/tests/integration/remaining-endpoints.test.js` — new test file following existing patterns.

Endpoints covered:
1. `GET /api/health` (inline in app.js)
2. `GET /api/docs` (docs.routes.js)
3. `POST /api/weekly-plans/regenerate-day` (weeklyPlan.routes.js)
4. `GET /api/daily-meal-plans` (dailyMealPlan.routes.js)
5. `POST /api/daily-meal-plans/generate`
6. `POST /api/daily-meal-plans/log`
7. `GET /api/activity-plans` (activityPlan.routes.js)
8. `POST /api/activity-plans/generate`
9. `POST /api/activity-plans/log`

**Explicitly skipped** (noted in test file):
- `GET /api/auth/google`, `GET /api/auth/google/callback` — require real Google OAuth credentials
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md (if using GSD workflow)
</execution_context>

<context>
## Reference files

### Existing test patterns (copy exactly)
@backend/tests/integration/api.test.js — imports, describe/it/beforeAll/afterAll structure, assertion style, agent setup
@backend/tests/integration/helpers.js — createTestUser, seedTestData, startDatabase, stopDatabase
@backend/tests/integration/weeklyPlan.e2e.test.js — LLM-dependent test patterns

### Route implementations (request/response shapes)
@backend/src/routes/dailyMealPlan.routes.js — 3 endpoints: GET /, POST /generate, POST /log
@backend/src/routes/activityPlan.routes.js — 3 endpoints: GET /, POST /generate, POST /log
@backend/src/routes/weeklyPlan.routes.js — regenerate-day at POST /regenerate-day
@backend/src/routes/docs.routes.js — GET / returns apiDocs JSON
@backend/src/app.js — GET /api/health inline (lines 103-106)

### Controller implementations (validation logic)
@backend/src/controllers/dailyMealPlan.controller.js
@backend/src/controllers/activityPlan.controller.js
@backend/src/controllers/weeklyPlan.controller.js (regenerateDayHandler at line 165)

### Test config
@backend/package.json — jest config, scripts
@backend/jest.setup.js — NODE_ENV=test, DATABASE_URL override

## Key implementation details

### GET /api/health (public, no auth)
- Response: `{ status: 'ok', timestamp: 'ISO-8601 string' }`
- Defined inline in app.js, no auth middleware

### GET /api/docs (public, no auth)
- Response: full `apiDocs` object with `{ api: { name, description, version, format, authentication, rateLimiting, endpoints } }`
- No auth or rate limiting applied (app.js line 109)

### POST /api/weekly-plans/regenerate-day (auth required)
- Body: `{ weekStart?: string (YYYY-MM-DD), dayIndex: number (0-6), availableDays?: number (4-6) }`
- Validates: dayIndex must be 0-6, weekStart valid date, availableDays integer 4-6
- Requires existing generated plan for happy path (E2E — real LLM call)
- Error cases testable without LLM: validation errors, 401

### GET /api/daily-meal-plans (auth required)
- Query: `?date=YYYY-MM-DD`
- Response: `{ plan: object|null, fromCache: boolean }`
- When no plan exists: `{ plan: null, fromCache: false }`
- Error: 400 for invalid date format

### POST /api/daily-meal-plans/generate (auth required, LLM)
- Body: `{ date?: string (YYYY-MM-DD) }`
- Calls LLM generateDailyMealPlan (real call)
- Error: 400 for invalid date format
- Happy path requires LLM

### POST /api/daily-meal-plans/log (auth required)
- Body: `{ date?: string, mealTypes: string[] }`
- Validates: date format, mealTypes non-empty array, each mealType in ['breakfast','lunch','dinner','snack']
- 404 when no plan exists for date
- Requires existing generated plan for happy path

### GET /api/activity-plans (auth required)
- Query: `?date=YYYY-MM-DD`
- Response: `{ plan: object|null, fromCache: boolean }`
- Same pattern as daily-meal-plans GET

### POST /api/activity-plans/generate (auth required, LLM)
- Body: `{ date?: string (YYYY-MM-DD) }`
- Calls LLM generateActivityPlan
- Error: 400 for invalid date format

### POST /api/activity-plans/log (auth required)
- Body: `{ date?: string, activityIndexes: number[] }`
- Validates: date format, activityIndexes non-empty array
- 404 when no plan exists for date
- Requires existing generated plan for happy path

## Notable patterns to follow from api.test.js

```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { startDatabase, stopDatabase, createTestUser } from './helpers.js';
```

- Unique email format: `prefix_{Date.now()}@example.com`
- Auth test pattern: `request.agent(app)` then register via agent
- `beforeAll` for DB setup + user registration
- `afterAll` for DB teardown
- Assertions use `expect(res.status).toBe(NNN)`, `expect(res.body.success).toBe(true/false)`
- Error responses: `expect(res.body.error.code).toBe('UPPER_SNAKE_CASE')`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Test simple public endpoints + GET for meal/activity plans</name>
  <files>backend/tests/integration/remaining-endpoints.test.js</files>
  <action>
    Create `backend/tests/integration/remaining-endpoints.test.js` with:

    **Imports** (copy exactly from api.test.js):
    ```javascript
    import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
    import request from 'supertest';
    import app from '../../src/app.js';
    import { startDatabase, stopDatabase, createTestUser } from './helpers.js';
    ```

    **Top-level beforeAll/afterAll** — same pattern as api.test.js:
    - `beforeAll`: startDatabase(), create agent + testUser via createTestUser(agent)
    - `afterAll`: stopDatabase()

    **Describe block: "Health & Documentation Endpoints"**

    1. `GET /api/health` — 200, body has `{ status: 'ok', timestamp: string }`
       - Test status code, body.status === 'ok', body.timestamp is a string that parses as valid ISO date
       - No auth required, use `request(app)` not agent

    2. `GET /api/docs` — 200, body has api documentation structure
       - Test status code, body.api exists, body.api.name === 'Fitness App API'
       - body.api.endpoints is an array with at least 2 groups
       - No auth required, use `request(app)` not agent

    **Describe block: "Daily Meal Plan Endpoints"**

    3. `GET /api/daily-meal-plans` without auth → 401
       - Use `request(app).get('/api/daily-meal-plans')` (no cookie)
       - Assert 401, success false

    4. `GET /api/daily-meal-plans` with auth but no plan → 200 + `{ plan: null, fromCache: false }`
       - Use authAgent from top-level beforeAll
       - Assert 200, success true, body.data.plan === null, body.data.fromCache === false

    5. `GET /api/daily-meal-plans?date=invalid` → 400 VALIDATION_ERROR
       - Use authAgent
       - Assert 400, error.code === 'VALIDATION_ERROR'

    **Describe block: "Activity Plan Endpoints"**

    6. `GET /api/activity-plans` without auth → 401
       - Use `request(app)` (no cookie)
       - Assert 401, success false

    7. `GET /api/activity-plans` with auth but no plan → 200 + `{ plan: null, fromCache: false }`
       - Use authAgent
       - Assert 200, success true, body.data.plan === null, body.data.fromCache === false

    8. `GET /api/activity-plans?date=invalid` → 400 VALIDATION_ERROR
       - Use authAgent
       - Assert 400, error.code === 'VALIDATION_ERROR'
  </action>
  <verify>
    <automated>cd backend; node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=remaining-endpoints --verbose --testNamePattern="Health|Documentation|Daily Meal Plan GET|Activity Plan GET" 2>&1</automated>
  </verify>
  <done>
    - GET /api/health returns 200 with status: 'ok' and ISO timestamp
    - GET /api/docs returns 200 with API documentation structure
    - GET /api/daily-meal-plans returns 401 without auth, 404 with invalid date, 200+null plan when none exists
    - GET /api/activity-plans returns 401 without auth, 404 with invalid date, 200+null plan when none exists
  </done>
</task>

<task type="auto">
  <name>Task 2: Test POST /api/weekly-plans/regenerate-day validation</name>
  <files>backend/tests/integration/remaining-endpoints.test.js</files>
  <action>
    Add a new describe block **"Weekly Plan Regenerate Day Endpoint"** at the end of the file (after existing content):

    Create a dedicated agent (like api.test.js does for sub-groups) with `beforeAll` that registers a fresh user and creates a profile.

    1. **No auth → 401**
       - `request(app).post('/api/weekly-plans/regenerate-day').send({ dayIndex: 0 })`
       - Assert 401, success false

    2. **Missing dayIndex → 400 VALIDATION_ERROR**
       - Use authAgent, send `{ weekStart: '2026-06-01' }` (no dayIndex)
       - Assert 400, success false, error.code === 'VALIDATION_ERROR'
       - Note: controller checks `typeof dayIndex !== 'number'`, so undefined triggers this

    3. **dayIndex < 0 → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: -1 }`
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /dayIndex/

    4. **dayIndex > 6 → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: 7 }`
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /dayIndex/

    5. **dayIndex as string → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: '0' }` (string instead of number)
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /dayIndex/

    6. **Invalid weekStart format → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: 0, weekStart: 'not-a-date' }`
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /date/i

    7. **Invalid availableDays < 4 → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: 0, availableDays: 3 }`
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /availableDays/i

    8. **Invalid availableDays > 6 → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: 0, availableDays: 7 }`
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /availableDays/i

    9. **Invalid availableDays non-integer → 400 VALIDATION_ERROR**
       - Send `{ dayIndex: 0, availableDays: 4.5 }`
       - Assert 400, error.code === 'VALIDATION_ERROR', error.message matches /availableDays/i

    Add a note as a comment at the end of the describe block indicating that the successful regenerate-day happy path requires an existing LLM-generated plan and is covered by the E2E test pattern in `weeklyPlan.e2e.test.js`.
  </action>
  <verify>
    <automated>cd backend; node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=remaining-endpoints --verbose --testNamePattern="Weekly Plan Regenerate" 2>&1</automated>
  </verify>
  <done>
    - All validation error cases return 400 with VALIDATION_ERROR code
    - Unauthenticated request returns 401
    - dayIndex validation: missing, negative, >6, string
    - weekStart format validation: invalid date string
    - availableDays validation: <4, >6, non-integer
  </done>
</task>

<task type="auto">
  <name>Task 3: Test POST /api/daily-meal-plans/generate, /log and POST /api/activity-plans/generate, /log</name>
  <files>backend/tests/integration/remaining-endpoints.test.js</files>
  <action>
    Add two new describe blocks at the end of the file:

    **Describe block: "POST /api/daily-meal-plans/generate"**

    Create a fresh agent with profile, test:

    1. **No auth → 401**
       - `request(app).post('/api/daily-meal-plans/generate').send({})`
       - Assert 401

    2. **Invalid date format → 400 VALIDATION_ERROR**
       - Use authAgent, send `{ date: 'bad-date' }`
       - Assert 400, error.code === 'VALIDATION_ERROR'

    **Describe block: "POST /api/daily-meal-plans/log"**

    Create a fresh agent with profile, test:

    3. **No auth → 401**
       - `request(app).post('/api/daily-meal-plans/log').send({ mealTypes: ['breakfast'] })`
       - Assert 401

    4. **Missing mealTypes → 400 VALIDATION_ERROR**
       - Send `{ date: '2026-06-01' }` (no mealTypes)
       - Assert 400, error.code === 'VALIDATION_ERROR', message matches /mealTypes/

    5. **Empty mealTypes array → 400 VALIDATION_ERROR**
       - Send `{ mealTypes: [] }`
       - Assert 400, error.code === 'VALIDATION_ERROR', message matches /mealTypes/

    6. **Invalid mealType → 400 VALIDATION_ERROR**
       - Send `{ mealTypes: ['invalid_type'] }`
       - Assert 400, error.code === 'VALIDATION_ERROR', message matches /invalid|mealType/i

    7. **No plan exists → 404 NOT_FOUND**
       - Send `{ date: '2026-06-01', mealTypes: ['breakfast'] }` (no plan for this date)
       - Assert 404, error.code === 'NOT_FOUND', message matches /no daily meal plan/i

    8. **Invalid date format → 400 VALIDATION_ERROR**
       - Send `{ date: 'not-a-date', mealTypes: ['breakfast'] }`
       - Assert 400, error.code === 'VALIDATION_ERROR'

    **Describe block: "POST /api/activity-plans/generate"**

    9. **No auth → 401**
       - Assert 401

    10. **Invalid date format → 400 VALIDATION_ERROR**
       - Assert 400, error.code === 'VALIDATION_ERROR'

    **Describe block: "POST /api/activity-plans/log"**

    11. **No auth → 401**
       - Assert 401

    12. **Missing activityIndexes → 400 VALIDATION_ERROR**
       - Send `{ date: '2026-06-01' }` (no activityIndexes)
       - Assert 400, error.code === 'VALIDATION_ERROR', message matches /activityIndexes/

    13. **Empty activityIndexes array → 400 VALIDATION_ERROR**
       - Send `{ activityIndexes: [] }`
       - Assert 400, error.code === 'VALIDATION_ERROR', message matches /activityIndexes/

    14. **No plan exists → 404 NOT_FOUND**
       - Send `{ date: '2026-06-01', activityIndexes: [0] }` (no plan)
       - Assert 404, error.code === 'NOT_FOUND', message matches /no activity plan/i

    15. **Invalid date format → 400 VALIDATION_ERROR**
       - Send `{ date: 'not-a-date', activityIndexes: [0] }`
       - Assert 400, error.code === 'VALIDATION_ERROR'

    Add comments at the end of each log describe block noting that successful log happy path requires an LLM-generated plan.

    Add a final top-level comment block documenting:
    - Skipped endpoints (Google OAuth routes)
    - Prerequisites (Supabase DB running, .env configured)
    - Usage command
  </action>
  <verify>
    <automated>cd backend; node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=remaining-endpoints --verbose 2>&1</automated>
  </verify>
  <done>
    - POST /api/daily-meal-plans/generate: 401 without auth, 400 with invalid date
    - POST /api/daily-meal-plans/log: 401, 400 for missing/empty/invalid mealTypes, 400 for invalid date, 404 when no plan exists
    - POST /api/activity-plans/generate: 401 without auth, 400 with invalid date
    - POST /api/activity-plans/log: 401, 400 for missing/empty activityIndexes, 400 for invalid date, 404 when no plan exists
    - Google OAuth routes explicitly noted as SKIPPED
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | Untrusted input crosses at all POST endpoints |
| unauthenticated→API | Public endpoints health + docs; all others require auth |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Spoofing | POST /api/health | accept | Public endpoint, no sensitive data |
| T-quick-02 | Tampering | POST regenerate-day/log/generate | mitigate | Tests validate auth middleware rejects unauthenticated requests; validation checks reject malformed input |
</threat_model>

<verification>
- All tests pass: `cd backend; node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=remaining-endpoints --verbose`
- No test file duplicates existing api.test.js or weeklyPlan.e2e.test.js test cases
- Google OAuth routes explicitly documented as skipped (not silently omitted)
</verification>

<success_criteria>
- File `backend/tests/integration/remaining-endpoints.test.js` created with 3 describe blocks
- All 9 missing endpoints have test coverage for at least validation/error cases
- Existing test patterns (imports, helpers, assertion style) followed exactly
- Tests pass against running Supabase test schema
- Google OAuth routes documented as skipped with rationale
</success_criteria>

<output>
After completion, update this plan to FINAL status.
</output>
