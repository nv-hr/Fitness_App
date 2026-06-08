---
phase: 2
plan: fix-unresolved-imports
wave: 1
gap_closure: true
---

# Fix Plan: Unresolved Imports

## Problem
During the extraction of `mealPlan` and `activityPlan` services from single files into directories (`validator.js`, `generator.js`, `index.js`), the original `.service.js` files were deleted, but there were consumers still trying to import them. Knip detected that `src/controllers/activityPlan.controller.js` and `src/services/dailyMealPlan.service.js` still import the old `.service.js` paths.

## Tasks

<task type="auto">
  <name>Fix unresolved imports</name>
  <files>
    backend/src/controllers/activityPlan.controller.js
    backend/src/services/dailyMealPlan.service.js
  </files>
  <action>
    - In `src/controllers/activityPlan.controller.js`, update `import * as activityPlanService from '../services/activityPlan.service.js';` to `import * as activityPlanService from '../services/activityPlan/index.js';`
    - In `src/services/dailyMealPlan.service.js`, update `import { buildMealPlanPrompt, generateFallbackMealPlan } from './mealPlan.service.js';` to `import { buildMealPlanPrompt, generateFallbackMealPlan } from './mealPlan/index.js';`
  </action>
  <verify>Run `npx knip --production` and verify that `Unresolved imports` disappears.</verify>
  <done>No unresolved imports are reported by Knip.</done>
</task>
