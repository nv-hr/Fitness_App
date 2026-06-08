# Refactoring Targets (Phase 1)

## 1. Dead Code & Unused Files
- `src/utils/dbErrors.js` (Orphaned / unused)
- `src/utils/food.js` (Orphaned / unused)

## 2. Unused Dependencies
- `express-validator` (verified unused via search)
- `passport-local` (verified unused via search)

## 3. Unused Exports (To Verify Before Removal)
Knip flagged several exports as unused, but many are Express Controller methods that might be dynamically referenced.
- `src/controllers/auth.controller.js`: register, login, logout, getMe, setPassword, googleCallback
- `src/controllers/food.controller.js`: searchFoods, createCustomFood, logFood, etc.
- `src/controllers/profile.controller.js`: createProfile, getProfile, updateProfile
- `src/services/activity.service.js`: mapFitnessGoalToTags, getRecommendations
- `src/services/mealPlan.service.js`: several internal validation functions

*Action for Phase 2:* Manually verify if these exports are truly dead or dynamically wired in `routes/`.

## 4. Architectural Violations & Complexity
- Files handling LLM generation and validation like `src/services/mealPlan.service.js` and `src/services/activityPlan.service.js` contain multiple exported functions and fallback logic. These should be reviewed to see if they can be split into smaller, more focused modules.
- Ensure all business logic remains in Services and SQL queries remain in Repositories.

## 5. Circular Dependencies
- `madge` reported no circular dependencies.
