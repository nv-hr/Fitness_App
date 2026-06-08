---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: MealPlan Service Separation

## Objective
Split the large `mealPlan.service.js` into distinct `validator.js`, `generator.js`, and `index.js` modules inside a new `mealPlan` directory. Fix any tests that break due to this refactoring.

## Context
- backend/src/services/mealPlan.service.js
- backend/tests/

## Tasks

<task type="auto">
  <name>Extract MealPlan Logic</name>
  <files>
    - backend/src/services/mealPlan.service.js
    - backend/src/services/mealPlan/validator.js
    - backend/src/services/mealPlan/generator.js
    - backend/src/services/mealPlan/index.js
  </files>
  <action>
    1. Create directory `backend/src/services/mealPlan`.
    2. Create `validator.js` and move pure validation functions: `validateMealPlanStructure`, `fuzzyMatchFoodName`, `recalculateDayCalories`, `validateAndFixMealPlan`.
    3. Create `generator.js` and move generation/API functions: `buildMealPlanPrompt`, `generateFallbackMealPlan`, `generateMealPlan`, `regenerateDay`, and the local helpers like `pickRandom` and `calcPortion`. Import the required validators from `validator.js` and other deps from `../../llm.service.js`, etc.
    4. Create `index.js` that re-exports everything from `validator.js` and `generator.js` so external callers don't break.
    5. Delete the original `mealPlan.service.js`.
    6. Update any internal `../` import paths in the new files to point to the correct directories (e.g. `../../utils/errors.js`).
  </action>
  <verify>cd backend ; node -c src/services/mealPlan/index.js</verify>
  <done>The mealPlan logic is modularized into a directory structure without syntax errors.</done>
</task>

<task type="auto">
  <name>Fix Broken MealPlan Tests</name>
  <files>
    - backend/tests/
  </files>
  <action>
    1. Run `npm run test:unit`.
    2. If tests fail due to missing modules or incorrect import paths (e.g., tests importing from `services/mealPlan.service.js`), update the imports in the test files to point to `services/mealPlan/index.js` (or specifically `validator.js` / `generator.js`).
    3. Do NOT rewrite the logic of the tests, just fix imports and mocking references.
  </action>
  <verify>cd backend ; npm run test:unit</verify>
  <done>All unit tests pass after the refactoring.</done>
</task>

## Success Criteria
- [ ] `mealPlan.service.js` is replaced by a `mealPlan/` directory.
- [ ] Logic is separated into `validator.js` and `generator.js`.
- [ ] Unit tests continue to pass.
