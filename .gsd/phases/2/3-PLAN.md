---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: ActivityPlan Service Separation

## Objective
Split the large `activityPlan.service.js` into distinct `validator.js`, `generator.js`, and `index.js` modules inside a new `activityPlan` directory.

## Context
- backend/src/services/activityPlan.service.js
- backend/tests/

## Tasks

<task type="auto">
  <name>Extract ActivityPlan Logic</name>
  <files>
    - backend/src/services/activityPlan.service.js
    - backend/src/services/activityPlan/validator.js
    - backend/src/services/activityPlan/generator.js
    - backend/src/services/activityPlan/index.js
  </files>
  <action>
    1. Create directory `backend/src/services/activityPlan`.
    2. Create `validator.js` and move `validateActivityPlanStructure`.
    3. Create `generator.js` and move generation/API functions: `generateFallbackActivityPlan`, `buildActivityPlanPrompt`, `generateActivityPlan`, and helpers `computeCaloriesBurned`, `pickRandom`. Import validators from `validator.js`.
    4. Create `index.js` that re-exports everything from `validator.js` and `generator.js`.
    5. Delete the original `activityPlan.service.js`.
    6. Update any internal `../` import paths in the new files to point correctly (e.g. `../../utils/errors.js`).
  </action>
  <verify>cd backend ; node -c src/services/activityPlan/index.js</verify>
  <done>The activityPlan logic is modularized into a directory structure without syntax errors.</done>
</task>

<task type="auto">
  <name>Fix Broken ActivityPlan Tests</name>
  <files>
    - backend/tests/
  </files>
  <action>
    1. Run `npm run test:unit`.
    2. If tests fail due to missing modules or incorrect import paths, update the imports in the test files to point to `services/activityPlan/index.js`.
    3. Do NOT rewrite the logic of the tests, just fix imports and mocking references.
  </action>
  <verify>cd backend ; npm run test:unit</verify>
  <done>All unit tests pass after the refactoring.</done>
</task>

## Success Criteria
- [ ] `activityPlan.service.js` is replaced by an `activityPlan/` directory.
- [ ] Logic is separated into `validator.js` and `generator.js`.
- [ ] Unit tests continue to pass.
