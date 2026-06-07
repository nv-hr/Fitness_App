---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Fix Sync Issue

## Objective
Fix issue where logging a food/activity manually checks the AI plan item, but preserve correct check/uncheck plan item sync behavior.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- backend/src/repositories/dailyMealPlan.repository.js
- backend/src/repositories/food.repository.js
- backend/src/controllers/dailyMealPlan.controller.js
- backend/src/repositories/activity.repository.js
- backend/src/controllers/weeklyPlan.controller.js

## Tasks

<task type="auto">
  <name>Update Daily Meal Plan Repositories and Controller (Food Syncing)</name>
  <files>
    backend/src/repositories/dailyMealPlan.repository.js
    backend/src/repositories/food.repository.js
    backend/src/controllers/dailyMealPlan.controller.js
  </files>
  <action>
    - Modify `syncItemLoggedState` and `syncMealPlanLoggedStates` in `dailyMealPlan.repository.js` to query the sum of `portion_grams` logged for a food. Compare the sum `>=` planned `portion_grams`.
    - Modify `deleteFoodLogByPlan` in `food.repository.js` to accept `portionGrams` and query: `DELETE FROM food_logs WHERE id IN (SELECT id FROM food_logs WHERE user_id = $1 AND food_id = $2 AND log_date = $3::date AND meal_type = $4 AND portion_grams = $5 LIMIT 1)`.
    - Modify `toggleItemLogged` in `dailyMealPlan.controller.js` to find the plan item's portion size and pass it to `deleteFoodLogByPlan` when unchecking.
  </action>
  <verify>npm run test -- backend/src/repositories/dailyMealPlan.repository.test.js</verify>
  <done>Food logs are correctly synced, deleted only by exact weight, and checked only if total logged is >= planned.</done>
</task>

<task type="auto">
  <name>Update Weekly Plan Repositories and Controller (Activity Syncing)</name>
  <files>
    backend/src/repositories/activity.repository.js
    backend/src/controllers/weeklyPlan.controller.js
  </files>
  <action>
    - Modify `deleteActivityLogByPlan` in `activity.repository.js` to accept `durationMin` and only delete a log with the exact duration.
    - Modify `toggleComplete` in `weeklyPlan.controller.js` to pass the planned duration to `deleteActivityLogByPlan` when unchecking.
  </action>
  <verify>npm run test -- backend/src/repositories/activity.repository.test.js</verify>
  <done>Activity logs are correctly deleted only by exact duration when unchecking the plan item.</done>
</task>

## Success Criteria
- [ ] Food logs sync check when sum of logged portion >= planned portion
- [ ] Unchecking food plan item deletes only one manual log of the exact portion size
- [ ] Unchecking activity plan item deletes only one manual log of the exact duration
