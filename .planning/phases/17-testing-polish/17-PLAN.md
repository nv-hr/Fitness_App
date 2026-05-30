---
phase: 17-testing-polish
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/tests/integration/api.test.js
  - backend/tests/unit/llm.service.test.js
  - frontend/src/features/activities/components/__tests__/ActivityLogForm.test.jsx
  - frontend/src/features/activities/components/__tests__/ActivityHistory.test.jsx
  - frontend/src/features/activities/components/__tests__/ActivitySummary.test.jsx
  - frontend/src/features/activities/components/__tests__/ActivitiesPage.test.jsx
  - frontend/src/features/weekly-plan/components/__tests__/DayCard.test.jsx
  - frontend/src/features/weekly-plan/components/__tests__/RateLimitedButton.test.jsx
  - frontend/src/features/weekly-plan/components/__tests__/FallbackBanner.test.jsx
  - frontend/src/features/weekly-plan/components/__tests__/EmptyStatePlan.test.jsx
  - frontend/src/features/weekly-plan/components/__tests__/WeeklyPlanPage.test.jsx
autonomous: true
requirements:
  - "Quality gate — no direct user-facing requirements"

must_haves:
  truths:
    - "Activity Logger integration tests pass (log activity, list history, delete entry, daily summary with net calories)"
    - "LLM integration tests pass with mocked OpenRouter responses (generation, caching, fallback, rate limiting, output validation)"
    - "All new UI components render correctly in loading, empty, error, and success states"
    - "Full-stack smoke test completes without errors covering activity logging and weekly plan features"
  artifacts:
    - path: "backend/tests/integration/api.test.js"
      provides: "Extended integration tests with activity logger endpoints"
      contains: "activity log, activity logs, delete activity log, activity summary"
    - path: "backend/tests/unit/llm.service.test.js"
      provides: "Unit tests for LLM service with mocked OpenRouter"
      contains: "generateWeeklyPlan, validatePlanStructure, fuzzyMatchActivityName, generateFallbackPlan"
    - path: "frontend/src/features/activities/components/__tests__/"
      provides: "UI component tests for activities feature"
    - path: "frontend/src/features/weekly-plan/components/__tests__/"
      provides: "UI component tests for weekly-plan feature"
---

<objective>
Create comprehensive integration and unit tests for all v1.3 features (Activity Logger, LLM Integration, Weekly Plan Frontend).

**Output:**
- `backend/tests/integration/api.test.js` — Extended with activity logger endpoint tests
- `backend/tests/unit/llm.service.test.js` — New: LLM service tests with mocked OpenRouter
- `frontend/src/features/activities/components/__tests__/` — New: UI component tests
- `frontend/src/features/weekly-plan/components/__tests__/` — New: UI component tests
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/codebase/TESTING.md

<interfaces>
**Backend test patterns:**
- Jest + supertest for integration tests
- Test schema lifecycle: `startDatabase()` → `createTestUser(agent)` → `seedTestData(agent)`
- Tests in `backend/tests/integration/api.test.js` follow describe('Endpoint Name', () => { it('should ...') })
- Each test suite creates its own auth agent with unique email
- Tests at `backend/tests/unit/` for pure unit tests (no DB needed)

**Frontend test patterns:**
- Vitest with `globals: true`, `environment: 'node'`
- Component tests use static file analysis (readFileSync + string assertions)
- Frontend API integration in `frontend/src/__tests__/api-integration.test.js` forks backend process

**Activity Logger API (all auth-protected):**
- `POST /api/activities/log` — body: { activityId, durationMin, intensity, loggedDate? }
- `GET /api/activities/logs?date=` — returns activity log entries for a date
- `DELETE /api/activities/log/:id` — deletes a log entry (scoped to user)
- `GET /api/activities/summary?date=` — returns { totalActiveMinutes, totalCaloriesBurned, totalConsumed, calorieTarget, netCalories, netVsTarget }
- `GET /api/activities/history?days=&includeEntries=true` — grouped history with entries

**LLM Service exports (`backend/src/services/llm.service.js`):**
- `buildPrompt(filename, variables)` — template rendering
- `buildSystemPrompt(profile, activityHistory, activities, weekStartDate)` — system prompt builder
- `callLlmApi(systemPrompt)` — calls OpenRouter (wraps OpenAI SDK)
- `validatePlanStructure(plan, weekStart)` — validates 7-day plan structure
- `fuzzyMatchActivityName(name, dbActivities)` — fuzzy name matching
- `validateAndFixPlan(plan, dbActivities)` — validates & fixes activity names
- `buildCorrectionPrompt(validationErrors)` — correction prompt builder
- `getCachedPlan(userId, weekStart)` / `setCachedPlan(userId, weekStart, plan)` / `clearCachedPlan`
- `generateFallbackPlan(deps)` — template-based fallback plan
- `generateWeeklyPlan(deps)` — full generation pipeline with caching, retry, fallback
- `regenerateDay(deps, dayIndex)` — single day regeneration

**Weekly Plan API (all auth-protected):**
- `GET /api/weekly-plans?weekStart=` — get cached plan (in-memory cache or DB)
- `POST /api/weekly-plans/generate` — generate new plan (rate-limited 5/15min)
- `POST /api/weekly-plans/regenerate-day` — regenerate single day (rate-limited)

**Activity Service exports (`backend/src/services/activityLog.service.js`):**
- `calculateCaloriesBurned(activity, durationMin, intensity)` — pure function
- `validateActivityLogInput({ activityId, durationMin, intensity, loggedDate })` — throws ValidationError
- `calculateDailyNetCalories(totalConsumed, totalBurned, calorieTarget)` — pure function
</interfaces>

<existing_test_patterns>
From api.test.js (integration):
```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { startDatabase, stopDatabase, createTestUser, seedTestData } from './helpers.js';

describe('Activity Endpoints', () => {
  let activityAgent;
  beforeAll(async () => {
    activityAgent = request.agent(app);
    const email = `activity_${Date.now()}@example.com`;
    await activityAgent.post('/api/auth/register').send({ email, password: 'TestP@ss123', pdpConsent: true });
    // Create profile
    await activityAgent.post('/api/profile').send({ ... });
  });
  
  describe('GET /api/activities/recommendations', () => {
    it('should return goal-based activity recommendations → 200 + { activities, count }', async () => {
      const res = await activityAgent.get('/api/activities/recommendations');
      expect(res.status).toBe(200);
      ...
    });
  });
});
```

From activity.service.test.js (unit):
```javascript
import { describe, it, expect } from '@jest/globals';
import { mapFitnessGoalToTags } from '../../src/services/activity.service.js';

describe('mapFitnessGoalToTags', () => {
  it('lose_weight -> [lose_weight]', () => {
    expect(mapFitnessGoalToTags('lose_weight')).toEqual(['lose_weight']);
  });
});
```

From previewCalories.test.js (frontend):
```javascript
import { describe, it, expect } from 'vitest';
import { calculatePreviewCalories } from '../previewCalories.js';

describe('calculatePreviewCalories', () => {
  it('returns correct calories for valid input', () => {
    expect(calculatePreviewCalories(165, '150')).toBe(248);
  });
});
```
</existing_test_patterns>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Activity Logger integration tests</name>
  <files>
    backend/tests/integration/api.test.js
  </files>
  <read_first>
    backend/tests/integration/api.test.js (existing Activity Endpoints section)
    backend/tests/integration/helpers.js
    backend/src/controllers/activity.controller.js
    backend/src/services/activityLog.service.js
    backend/src/repositories/activity.repository.js
    backend/src/routes/activity.routes.js
  </read_first>
  <action>
    Append to the existing "Activity Endpoints" describe block in `backend/tests/integration/api.test.js` (after line 773):

    New test suites to add inside `describe('Activity Endpoints', ...)`:

    **A. `POST /api/activities/log`** (4 test cases):
    1. Log an activity with valid data → 201 with activity details including calories_burned
       - Gets an activity ID from GET /api/activities first (pick first result)
       - Sends POST with activityId, durationMin=30, intensity='moderate'
       - Expects 201, success: true, body has activity_id, duration_min, intensity, calories_burned
    2. Log an activity with custom loggedDate → 201 + date matches
       - Uses a past date '2026-01-15'
    3. Reject log with invalid intensity → 400 VALIDATION_ERROR
       - Sends intensity='extreme'
    4. Reject log with duration > 1440 → 400 VALIDATION_ERROR
       - Sends durationMin=1500

    **B. `GET /api/activities/logs`** (2 test cases):
    1. Return logs for a date after logging → 200 + array with entries
       - Logs an activity, then GET /api/activities/logs?date=today
       - Expects array with at least 1 entry, entry has activity_name, calories_burned
    2. Return empty array for date with no logs → 200 + []

    **C. `DELETE /api/activities/log/:id`** (3 test cases):
    1. Delete an existing log entry → 200 + success: true
       - Logs an activity first, captures ID, then DELETE
    2. Return 404 for non-existent log ID → 404 NOT_FOUND
       - DELETE with id=999999
    3. Return 400 for invalid ID → 400 VALIDATION_ERROR
       - DELETE with id=0

    **D. `GET /api/activities/summary`** (3 test cases):
    1. Return summary with activity data after logging → 200 with all fields
       - Logs an activity, then GET /api/activities/summary?date=today
       - Expects: totalActiveMinutes > 0, totalCaloriesBurned > 0, totalConsumed >= 0, calorieTarget defined, netCalories defined
    2. Return summary with net calories calculation → netCalories = totalConsumed - totalBurned
    3. Return summary for date with no activity → totalActiveMinutes = 0, totalCaloriesBurned = 0

    **E. `GET /api/activities/history`** (2 test cases):
    1. Return grouped history with entries after logging → 200 + array with entries
       - Logs an activity, GET /api/activities/history?days=7&includeEntries=true
       - Expects array with logged_date, total_minutes, total_burned, entries array
    2. Return empty history when no logs exist → 200 + []
  </action>
  <acceptance_criteria>
    - 14 new test cases across 5 describe blocks added to Activity Endpoints section
    - All tests follow existing patterns (supertest, auth agent, error response checks)
    - Tests cover: log activity (valid, past date, invalid intensity, invalid duration), get logs (with data, empty), delete log (existing, not found, invalid ID), get summary (with activity, net calorie calc, empty), get history (grouped, empty)
  </acceptance_criteria>
  <verify>
    <automated>cd backend; if ($?) { node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=integration --testNamePattern="Activity" 2>&1 | Select-String -Pattern "Tests:" }</automated>
  </verify>
  <done>Activity Logger integration tests added — 14 test cases for log, logs, delete, summary, history endpoints.</done>
</task>

<task type="auto">
  <name>Task 2: LLM service unit tests with mocked OpenRouter</name>
  <files>
    backend/tests/unit/llm.service.test.js
  </files>
  <read_first>
    backend/src/services/llm.service.js
    backend/tests/unit/activity.service.test.js (for test pattern reference)
  </read_first>
  <action>
    Create `backend/tests/unit/llm.service.test.js` with the following test suites:

    **Imports:**
    ```javascript
    import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
    ```

    **A. `validatePlanStructure`** (6 test cases):
    1. Valid 7-day plan passes → { valid: true, errors: [] }
       - Build a complete 7-day plan with valid activity objects
    2. Missing days array → { valid: false, errors: ['Plan must have a "days" array'] }
    3. Wrong number of days (6) → errors includes 'Expected 7 days but got 6'
    4. Wrong number of days (8) → errors includes 'Expected 7 days but got 8'
    5. Day with 0 activities → error about 1-4 activities
    6. Day with 5 activities → error about 1-4 activities
    7. Invalid date on a day → error about expected date
    8. Missing activity_id, name, duration_min, intensity on an activity → multiple errors
    9. activity_id is not a number → error about invalid activity_id
    10. duration_min < 10 → error about duration_min 10-180
    11. duration_min > 180 → error about duration_min 10-180
    12. Invalid intensity → error about intensity must be light/moderate/vigorous

    **B. `fuzzyMatchActivityName`** (5 test cases):
    1. Exact match → { matched: true, matchType: 'exact' }
    2. Contains match → { matched: true, matchType: 'fuzzy-contains' }
       - e.g. "running" matches "Morning Running"
    3. Empty name → { matched: false, activity: null, matchType: 'none' }
    4. Non-string name → { matched: false, activity: null, matchType: 'none' }
    5. No match at all → { matched: false, activity: null, matchType: 'none' }

    **C. `validateAndFixPlan`** (3 test cases):
    1. Passes through valid plan with matched activity IDs → { valid: true }
    2. Fixes fuzzy-matched activity names → activity_id is set, name is fixed
    3. Returns errors for unmatched activities → { valid: false }

    **D. `generateFallbackPlan`** (3 test cases):
    1. Returns 7-day plan when user has history → 7 days, each with activities
    2. Returns unavailable status when no history → status: 'unavailable', message
    3. All activities in fallback have valid structure → each activity has activity_id, name, duration_min, intensity

    **E. `calculateCaloriesBurned` — pure function test** (moved from activityLog.service.js, 5 test cases):
    1. Moderate intensity: 200 cal * (30/60) * 1.0 = 100
    2. Light intensity: 200 cal * (30/60) * 0.7 = 70
    3. Vigorous intensity: 200 cal * (30/60) * 1.3 = 130
    4. Different duration: 200 cal * (45/60) * 1.0 = 150
    5. Rounds correctly: 165 * (35/30) * 1.0 = round(192.5) = 193

    **F. `validateActivityLogInput` — validation function tests** (from activityLog.service.js, 5 test cases):
    1. Valid input does not throw
    2. Missing activityId throws ValidationError
    3. Duration < 1 throws ValidationError
    4. Invalid intensity throws ValidationError
    5. Invalid date format throws ValidationError

    **G. `calculateDailyNetCalories` — pure function tests** (from activityLog.service.js, 3 test cases):
    1. Returns correct netCalories and netVsTarget with all values
    2. Returns null netVsTarget when calorieTarget is null
    3. Negative netCalories (more burned than consumed)

    **H. `buildSystemPrompt`** (2 test cases - snapshot-like):
    1. Returns a string containing the week start date
    2. Includes activity names from history in the output

    Note: Do NOT mock AppError or callLlmApi directly. These tests should test the pure functions + utility functions only. Tests that need OpenRouter mocking are deferred to integration-level testing.
  </action>
  <acceptance_criteria>
    - `backend/tests/unit/llm.service.test.js` exists
    - Tests cover: validatePlanStructure (12 cases), fuzzyMatchActivityName (5), validateAndFixPlan (3), generateFallbackPlan (3), calculateCaloriesBurned (5), validateActivityLogInput (5), calculateDailyNetCalories (3), buildSystemPrompt (2)
    - All tests pass without database connection (pure function tests)
    - calculateCaloriesBurned, validateActivityLogInput, calculateDailyNetCalories are tested by importing from activityLog.service.js
  </acceptance_criteria>
  <verify>
    <automated>cd backend; if ($?) { node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=unit/llm 2>&1 | Select-String -Pattern "Tests:" }</automated>
  </verify>
  <done>LLM service unit tests created — 38 test cases covering all pure functions and validation logic.</done>
</task>

<task type="auto">
  <name>Task 3: Frontend UI component tests for weekly-plan feature</name>
  <files>
    frontend/src/features/weekly-plan/components/__tests__/DayCard.test.jsx
    frontend/src/features/weekly-plan/components/__tests__/RateLimitedButton.test.jsx
    frontend/src/features/weekly-plan/components/__tests__/FallbackBanner.test.jsx
    frontend/src/features/weekly-plan/components/__tests__/EmptyStatePlan.test.jsx
    frontend/src/features/weekly-plan/components/__tests__/WeeklyPlanPage.test.jsx
  </files>
  <read_first>
    frontend/src/features/weekly-plan/components/DayCard.jsx
    frontend/src/features/weekly-plan/components/RateLimitedButton.jsx
    frontend/src/features/weekly-plan/components/FallbackBanner.jsx
    frontend/src/features/weekly-plan/components/EmptyStatePlan.jsx
    frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx
    frontend/src/features/weekly-plan/components/DayActivityRow.jsx
    frontend/tests/CustomFoodForm.test.js (for existing test pattern)
    frontend/vitest.config.js
  </read_first>
  <action>
    Create the following test files (using static file analysis pattern as used in CustomFoodForm.test.js — readFileSync + string assertions). The frontend vitest config uses `environment: 'node'`, so we cannot use jsdom. Use the same static analysis approach:

    **A. `frontend/src/features/weekly-plan/components/__tests__/DayCard.test.jsx`:**
    - Test that component exports a default function
    - Test that it imports DayActivityRow and RateLimitedButton
    - Test that it uses clickable header (onClick or cursor: pointer)
    - Test that it renders day.date in formatDayHeader (check for toLocaleDateString)
    - Test that it renders "activities" text and "min total" text
    - Test that it conditionally renders expand/collapse (▲/▼ characters)
    - Test that regenerate button is inside expanded section

    **B. `frontend/src/features/weekly-plan/components/__tests__/RateLimitedButton.test.jsx`:**
    - Test that component exports a default function
    - Test that it imports useState, useEffect, useRef
    - Test that it uses countdown logic (setInterval/clearInterval)
    - Test that it renders children text
    - Test that it shows "Wait" text during countdown (formatCountdown)
    - Test that it shows "Regenerating..." text when isLoading
    - Test button is disabled when isLoading or isCountingDown
    - Test minHeight: '44px' is present

    **C. `frontend/src/features/weekly-plan/components/__tests__/FallbackBanner.test.jsx`:**
    - Test that component exports a default function
    - Test that it returns null for status 'active'
    - Test that it renders fallback message for status 'fallback'
    - Test that it renders unavailable message for status 'unavailable'
    - Test that it returns null for null status
    - Test that it uses amber/yellow background colors (#fffbeb, #fde68a)

    **D. `frontend/src/features/weekly-plan/components/__tests__/EmptyStatePlan.test.jsx`:**
    - Test that component exports a default function
    - Test that it renders "No Weekly Plan Yet" heading
    - Test that it renders "Generate My Weekly Plan" button
    - Test that button is disabled when isGenerating is true
    - Test that button shows "Generating your plan..." when isGenerating
    - Test that onGenerate prop is present and called on button click
    - Test button uses #16a34a green background

    **E. `frontend/src/features/weekly-plan/components/__tests__/WeeklyPlanPage.test.jsx`:**
    - Test that component exports a default function
    - Test that it imports all child components: DayCard, EmptyStatePlan, FallbackBanner
    - Test that it imports API functions: getWeeklyPlan, generateWeeklyPlan, regenerateDay
    - Test that it uses useState and useEffect (state management)
    - Test that it renders "Loading..." text for loading state
    - Test that it renders "Weekly Activity Plan" heading for active plan
    - Test that it renders "Try Again" button in error state
    - Test that it renders rate-limit countdown UI for genRetryAfter state
    - Test that it renders "No Weekly Plan Yet" via EmptyStatePlan when no plan
    - Test that getMonday function computes correct Monday from various dates

    **F. `frontend/src/features/weekly-plan/components/__tests__/DayActivityRow.test.jsx`:**
    - Test that component exports a default function
    - Test that it renders activity name and duration
    - Test that it applies intensity colors (light=#6b7280, moderate=inherit, vigorous=#b45309)
  </action>
  <acceptance_criteria>
    - 6 test files created under `frontend/src/features/weekly-plan/components/__tests__/`
    - Each test file follows existing static-analysis pattern (readFileSync + string assertions)
    - Tests verify component exports, imports, conditional rendering, styling, and key text content
  </acceptance_criteria>
  <verify>
    <automated>cd frontend; if ($?) { npx vitest run --reporter=verbose 2>&1 | Select-String -Pattern "Tests|FAIL|PASS" }</automated>
  </verify>
  <done>Weekly-plan UI component tests created — 6 test files covering all weekly-plan components.</done>
</task>

<task type="auto">
  <name>Task 4: Frontend UI component tests for activities feature</name>
  <files>
    frontend/src/features/activities/components/__tests__/ActivityLogForm.test.jsx
    frontend/src/features/activities/components/__tests__/ActivityHistory.test.jsx
    frontend/src/features/activities/components/__tests__/ActivitySummary.test.jsx
    frontend/src/features/activities/components/__tests__/ActivitiesPage.test.jsx
  </files>
  <read_first>
    frontend/src/features/activities/components/ActivityLogForm.jsx
    frontend/src/features/activities/components/ActivityHistory.jsx
    frontend/src/features/activities/components/ActivitySummary.jsx
    frontend/src/features/activities/components/ActivitiesPage.jsx
    frontend/src/features/activities/components/previewCalories.js
    frontend/src/features/activities/api/activityApi.js
  </read_first>
  <action>
    Create the following test files (using static file analysis pattern):

    **A. `frontend/src/features/activities/components/__tests__/ActivityLogForm.test.jsx`:**
    - Test that component exports a default function
    - Test that it renders "Log Activity" heading with activity name
    - Test that it imports calculateActivityCalories for preview
    - Test that it has duration (input[type=number]), intensity (select), date (input[type=date]) fields
    - Test that it renders "Estimated calories burned" preview text
    - Test that it has "Log Activity" submit button and "Cancel" button
    - Test that submit button is disabled when submitting
    - Test that form has onSubmit handler that calls preventDefault
    - Test that duration validation includes min=1, max=1440
    - Test that intensity options include light, moderate, vigorous

    **B. `frontend/src/features/activities/components/__tests__/ActivityHistory.test.jsx`:**
    - Test that component exports a default function
    - Test that it renders "Activity History" heading
    - Test that it renders "No activity logged yet" for empty history
    - Test that it renders delete buttons when history has entries
    - Test that it renders duration and calories per entry
    - Test that it renders logged date for each entry

    **C. `frontend/src/features/activities/components/__tests__/ActivitySummary.test.jsx`:**
    - Test that component exports a default function
    - Test that it renders "Activity Summary" heading
    - Test that it renders active minutes, calories burned, net calories
    - Test that it renders "No activity logged today" when all zeros
    - Test that it renders calorie target when provided
    - Test that it renders positive net calories with green styling
    - Test that it renders negative net calories with red styling

    **D. `frontend/src/features/activities/components/__tests__/ActivitiesPage.test.jsx`:**
    - Test that component exports a default function
    - Test that it imports all sub-components: ActivityCard, ActivityPool, ActivityLogForm, ActivityHistory, ActivitySummary
    - Test that it imports API functions: getRecommendations, getAllActivities, getActivityHistory, getActivitySummary, logActivity, deleteActivityLog
    - Test that it uses useState and useEffect
    - Test that it renders "Activity Recommendations" heading
    - Test that it renders "Suggested activities for your fitness goal" text
    - Test that it has shuffle button with "Shuffle" text
    - Test that it conditionally renders ActivityLogForm when loggingActivity is set
    - Test that it renders "Loading..." for loading state
    - Test that it renders success message (green text) after successful log
  </action>
  <acceptance_criteria>
    - 4 test files created under `frontend/src/features/activities/components/__tests__/`
    - ActivityLogForm tests cover form fields, validation, preview, submit/cancel
    - ActivityHistory tests cover empty state and data rendering
    - ActivitySummary tests cover all states (data, empty, positive/negative)
    - ActivitiesPage tests cover imports, state management, conditional rendering
  </acceptance_criteria>
  <verify>
    <automated>cd frontend; if ($?) { npx vitest run --reporter=verbose 2>&1 | Select-String -Pattern "Tests|FAIL|PASS" }</automated>
  </verify>
  <done>Activities UI component tests created — 4 test files covering all activities components.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test <-> Source | Tests import and exercise source code directly or via HTTP |
| Mock <-> Real API | LLM tests mock OpenRouter — no real API calls made |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-17-01 | Spoofing | Test mocks | accept | LLM tests use Jest manual mocks — no real API keys or network calls. Safe even if run in CI with OPENROUTER_API_KEY unset. |
| T-17-02 | Information Disclosure | Test output | accept | Test output may reveal production DB schema (table/column names). Acceptable since schema.sql is already in the repository. |
| T-17-03 | Denial of Service | Test data | accept | Integration tests create/delete test schema. No production data impact. Guarded by NODE_ENV=test + test-specific DATABASE_URL. |
</threat_model>

<verification>
1. Backend integration tests pass: `cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=integration`
2. Backend unit tests pass: `cd backend && node --experimental-vm-modules node_modules/jest/bin/jest.js --testPathPattern=unit`
3. Frontend component tests pass: `cd frontend && npx vitest run --reporter=verbose`
4. grep for new describe blocks confirms activity logger tests exist
5. grep for new test file confirms llm.service.test.js exists
6. grep for component test files confirms all 10 frontend test files exist
</verification>

<success_criteria>
- All v1.3 backend endpoints have integration test coverage
- All LLM pure functions have unit test coverage
- All v1.3 UI components have render state coverage (loading, empty, error, success)
- Tests can run without real OpenRouter API key
- Tests can run without manual test database setup (automated schema creation)
</success_criteria>

<output>
After completion, create `.planning/phases/17-testing-polish/17-01-SUMMARY.md`
</output>
