---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: Unit Tests for Meal Plan Service

## Objective
Write comprehensive unit tests for the pure business logic extracted during the meal plan refactoring (`validator.js` and `generator.js`).

## Context
- `backend/src/services/mealPlan/validator.js`
- `backend/src/services/mealPlan/generator.js`

## Tasks

<task type="auto">
  <name>Test mealPlan validator</name>
  <files>
    backend/tests/unit/mealPlan.validator.test.js
  </files>
  <action>
    - Create unit tests covering `validateMealPlanStructure` and `validateAndFixMealPlan`.
    - Check calorie bounds, missing fields, and fuzzy matched foods.
  </action>
  <verify>npm run test:unit -- backend/tests/unit/mealPlan.validator.test.js</verify>
  <done>All validation tests pass.</done>
</task>

<task type="auto">
  <name>Test mealPlan generator fallbacks</name>
  <files>
    backend/tests/unit/mealPlan.generator.test.js
  </files>
  <action>
    - Create unit tests covering `generateFallbackMealPlan`.
    - Test different categories of food fallbacks.
  </action>
  <verify>npm run test:unit -- backend/tests/unit/mealPlan.generator.test.js</verify>
  <done>Fallback logic passes execution.</done>
</task>

## Success Criteria
- [ ] `mealPlan.validator.test.js` is implemented and passes.
- [ ] `mealPlan.generator.test.js` is implemented and passes.
