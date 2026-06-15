## 1. Algorithm Service

- [x] 1.1 Create `backend/src/services/activityPlan/weeklyPlanAlgorithm.js` with the `ACTIVITY_LEVEL_CALORIE_CEILING` map and `ACTIVITY_LEVEL_DURATION_TIER` map (D-01, D-02)
- [x] 1.2 Implement `filterActivities(activities, fitnessGoal, activityLevel)` — goal-tag filter first, then calorie ceiling, with fallback chain (spec: Fitness Goal Tag Filtering, fallback scenario)
- [x] 1.3 Implement `pickRestDays(count = 2)` — returns a Set of 2 random day indices 0–6 (spec: Weekly Schedule Structure)
- [x] 1.4 Implement `buildActiveDay(date, pool, durationTier)` — picks 3–4 activities; implements duration scaling for underflow/overflow (D-03); enforces no-duplicate rule per day (D-07)
- [x] 1.5 Implement `generateWeeklyPlanAlgorithm({ profile, activities, weekStart })` — assembles 7 days using rest-day placement and `buildActiveDay`, returns `{ days, generated_at, source: 'algorithm' }` (spec: Deterministic Plan Shape)
- [x] 1.6 Export `generateWeeklyPlanAlgorithm` from `backend/src/services/activityPlan/index.js`

## 2. Repository Query

- [x] 2.1 Add `getActivitiesByGoalAndCeiling(fitnessGoal, maxCalories)` to `backend/src/repositories/activity.repository.js` — queries `activities` WHERE `goal_tags @> $1` AND `estimated_calories <= $2` (use existing `pool` from config)
- [x] 2.2 Add `getAllActivitiesWithCeiling(maxCalories)` as a fallback query (no goal filter, only calorie ceiling) in the same repository file

## 3. Controller Wiring

- [x] 3.1 In `weeklyPlan.controller.js` `generate()` handler: replace the `generateWeeklyPlan(...)` call with calls to `findProfileByUserId`, `getAllActivities`, and `generateWeeklyPlanAlgorithm`; keep cache, DB persist, and response shape identical
- [x] 3.2 In `weeklyPlan.controller.js` `generateStream()` handler: replace the `generateWeeklyPlan(...)` call with the algorithm; send the same `{ type: 'done', plan }` SSE event; remove `onChunk` wiring since the algorithm is synchronous
- [x] 3.3 Remove the `generateWeeklyPlan` named import from `weeklyPlan.controller.js` (keep `getCachedPlan`, `setCachedPlan`, `clearCachedPlan`, `acquireLock`, `swapActivity`, `regenerateDay`)

## 4. Tests

- [x] 4.1 Write unit tests for `filterActivities` covering: goal match + ceiling, ceiling-only fallback, and all-activities fallback
- [x] 4.2 Write unit tests for `buildActiveDay` covering: unique activities per day, underflow scaling, overflow prorating
- [x] 4.3 Write unit tests for `generateWeeklyPlanAlgorithm` covering: exactly 2 rest days, 5 active days, correct date assignment, output shape matches spec
- [x] 4.4 Update or add controller-level tests for `generate` and `generateStream` to mock the algorithm instead of the LLM service

## 5. Cleanup

- [x] 5.1 Verify `npm run dev` starts without errors after controller changes
- [x] 5.2 Confirm no remaining direct calls to `generateWeeklyPlan` (from `llm.service.js`) in `weeklyPlan.controller.js` via grep
