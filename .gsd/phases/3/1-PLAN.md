# Phase 3 Plan: Fix Sync Issue

## Objective
Fix issue where logging a food/activity manually checks the AI plan item, but preserve correct check/uncheck plan item sync behavior.

## Architecture Impact
- **Database Repository Layer**:
  - `dailyMealPlan.repository.js` to sum logged food portion sizes.
  - `food.repository.js` to support deleting a specific food log matching a portion size.
  - `activity.repository.js` to support deleting a specific activity log matching a duration.
- **Controller Layer**:
  - `dailyMealPlan.controller.js` and `weeklyPlan.controller.js` to handle UI toggles (unchecking) by removing only the exact weight/duration.

## Implementation Steps

### 1. Update Daily Meal Plan Repositories and Controller (Food Syncing)
- **File**: `backend/src/repositories/dailyMealPlan.repository.js`
  - Modify `syncItemLoggedState` and `syncMealPlanLoggedStates` to query the sum of `portion_grams` logged for a food. Compare the sum `>=` planned `portion_grams`.
- **File**: `backend/src/repositories/food.repository.js`
  - Modify `deleteFoodLogByPlan` to accept `portionGrams` and query: `DELETE FROM food_logs WHERE id IN (SELECT id FROM food_logs WHERE user_id = $1 AND food_id = $2 AND log_date = $3::date AND meal_type = $4 AND portion_grams = $5 LIMIT 1)`.
- **File**: `backend/src/controllers/dailyMealPlan.controller.js`
  - Modify `toggleItemLogged` to find the plan item's portion size and pass it to `deleteFoodLogByPlan` when unchecking.

### 2. Update Weekly Plan Repositories and Controller (Activity Syncing)
- **File**: `backend/src/repositories/activity.repository.js`
  - Modify `deleteActivityLogByPlan` to accept `durationMin` and only delete a log with the exact duration.
- **File**: `backend/src/controllers/weeklyPlan.controller.js`
  - Modify `toggleComplete` to pass the planned duration to `deleteActivityLogByPlan` when unchecking.

### 3. Verification
- Run backend unit tests to verify nothing is broken.
