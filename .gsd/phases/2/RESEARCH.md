---
phase: 2
level: 2
researched_at: 2026-06-08
---

# Phase 2 Research

## Questions Investigated
1. How best to separate LLM generation and validation logic in `mealPlan.service.js` and `activityPlan.service.js`?
2. How to correctly address "unused" controller exports flagged by `knip`?
3. What is the impact on old tests?

## Findings

### Topic 1: Service Separation
`mealPlan.service.js` (433 lines) and `activityPlan.service.js` (178 lines) contain both validation schemas and LLM prompt generation/calling logic. 
**Recommendation:** Create subdirectories (`src/services/mealPlan/` and `src/services/activityPlan/`). Move validation logic (e.g. `validateMealPlanStructure`, `fuzzyMatchFoodName`) into `validator.js`. Move prompt building and LLM API calling into `generator.js`. Use an `index.js` as the main entry point to preserve the public API (so controllers don't need changing).

### Topic 2: Unused Controller Exports
`knip` flagged many controller functions (like `login`, `register`) because the files export them as named exports AND as part of an `export default` object, but the routes only import the default object.
**Recommendation:** Remove the `export default` block at the bottom of the controllers. Update the corresponding `*.routes.js` files to use `import * as XController from '../controllers/X.controller.js'`. This resolves the knip warnings and improves tree-shaking compatibility.

### Topic 3: Impact on Tests
The old tests currently import functions directly from `mealPlan.service.js` and `activityPlan.service.js`. By using an `index.js` that re-exports the exact same functions, we can minimize breakages in unit tests. We will run tests after refactoring and fix any import paths (e.g. if a test specifically imports a validation function that moved to `validator.js`).

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Service Refactor | Subdirectories with `index.js` | Preserves the public API, minimizing changes to Controllers while separating internal concerns. |
| Controller Exports | Named Exports + `import * as` | Modern ES Module best practice, resolves knip false positives. |

## Patterns to Follow
- `validator.js`: Pure functions for validating objects and structures. No LLM calls.
- `generator.js`: Orchestrates the LLM calls and caching, relying on `validator.js` for post-generation checks.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
