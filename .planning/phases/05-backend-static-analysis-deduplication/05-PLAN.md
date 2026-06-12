# Phase 5: Backend Static Analysis & Deduplication - Plan

## Wave 1: Dead Code Cleanup

### Task 5-01-01: Deprecate dead backend exports
- **Files Modified**: 
  - `backend/src/services/activityPlan/index.js`
  - `backend/src/services/food.service.js`
- **Description**: 
  - Per decision D-04, do not delete immediately. Prefix `validateActivityPlanStructure` and `generateFallbackActivityPlan` in `activityPlan/index.js` with `_deprecated_` and add JSDoc warnings.
  - Prefix `validateFoodData` in `food.service.js` with `_deprecated_` and add JSDoc warnings.
- **Automated Verify**: `cd backend && npm run test`

### Task 5-01-02: Fix Unlisted Dependencies
- **Files Modified**: 
  - `backend/package.json`
- **Description**: Add `"@jest/globals"` to `devDependencies` in `package.json` since it is used extensively in test files but flagged by fallow as an unlisted dependency.
- **Automated Verify**: `cd backend && npm install && npm run test`

## Wave 2: Deduplication

### Task 5-02-01: Extract Shared Timezone Logic
- **Files Modified**:
  - `backend/src/utils/date.utils.js` (NEW)
  - `backend/src/controllers/activity.controller.js`
  - `backend/src/controllers/dailyMealPlan.controller.js`
  - `backend/src/controllers/food.controller.js`
  - `backend/src/controllers/weeklyPlan.controller.js`
- **Description**: Extract `isDateWithinTimezoneRange` (duplicated 4 times across controllers) into a new shared utility `utils/date.utils.js` and update imports.
- **Automated Verify**: `cd backend && npm run test`

### Task 5-02-02: Extract Shared SSE Logic
- **Files Modified**:
  - `backend/src/utils/sse.utils.js` (NEW)
  - `backend/src/controllers/dailyMealPlan.controller.js`
  - `backend/src/controllers/weeklyPlan.controller.js`
- **Description**: Extract the Server-Sent Events HTTP header setup and `onChunk` handler logic (duplicated 3 times) into a shared `setupSSE` utility in `utils/sse.utils.js`.
- **Automated Verify**: `cd backend && npm run test`

### Task 5-02-03: Refactor Duplicate Validation Logic
- **Files Modified**:
  - `backend/src/controllers/weeklyPlan.controller.js`
- **Description**: Consolidate duplicate validation blocks for `dayIndex` and `targetWeekStart` normalization within `weeklyPlan.controller.js`.
- **Automated Verify**: `cd backend && npm run test`

### Task 5-02-04: Refactor Duplicate DB Query Logic
- **Files Modified**:
  - `backend/src/repositories/activity.repository.js`
  - `backend/src/repositories/food.repository.js`
- **Description**: Extract the common `days = 7` validation and `cutoffDate` string generation block into a shared utility function.
- **Automated Verify**: `cd backend && npm run test`

### Task 5-02-05: Configure Fallow for Intentional Re-exports
- **Files Modified**:
  - `backend/.fallowrc.json` (or update package.json fallow config)
- **Description**: Add `ignoreExports` rules for functions like `createCustomFood`, `getDailyLogs`, `getProfile`, and `login` which are intentionally exported across controllers and services/repositories, preventing them from being flagged as `duplicate-export`.
- **Automated Verify**: `cd backend && npx fallow dupes --format json --quiet`
