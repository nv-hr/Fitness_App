---
phase: 3
plan: 3
wave: 2
---

# Plan 3.3: Integration Tests for Planning Endpoints

## Objective
Write complete integration tests hitting the real database schema (using `helpers.js`) and OpenRouter LLM for `POST /api/activity/plan/generate` and `POST /api/food/plan/generate`.

## Context
- `.gsd/DECISIONS.md`
- `backend/tests/integration/helpers.js`
- `backend/src/controllers/activityPlan.controller.js`
- `backend/src/controllers/dailyMealPlan.controller.js`

## Tasks

<task type="auto">
  <name>Integration test for Activity Plan generation</name>
  <files>
    backend/tests/integration/activityPlan.test.js
  </files>
  <action>
    - Use `startDatabase` and `stopDatabase` from `helpers.js` in `beforeAll`/`afterAll`.
    - Create a test user and seed profile.
    - Test `POST /api/activity/plan/generate`. This will trigger the actual LLM call.
    - Verify the response contains a 7-day activity plan structure.
  </action>
  <verify>npm run test:integration -- backend/tests/integration/activityPlan.test.js</verify>
  <done>Returns 200 OK with valid plan payload.</done>
</task>

<task type="auto">
  <name>Integration test for Daily Meal Plan generation</name>
  <files>
    backend/tests/integration/dailyMealPlan.test.js
  </files>
  <action>
    - Create a similar test for `POST /api/food/plan/generate`.
    - Note that this will consume LLM credits. It tests the real endpoint behavior.
    - Verify response contains 4 meals (breakfast, lunch, dinner, snack).
  </action>
  <verify>npm run test:integration -- backend/tests/integration/dailyMealPlan.test.js</verify>
  <done>Returns 200 OK with valid meals payload.</done>
</task>

## Success Criteria
- [ ] Integration tests hit the real DB and real LLM and pass.
