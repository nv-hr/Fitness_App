# Phase 07: Ingredient Logging & Calorie Calculation - Research

**Researched:** 2026-05-18
**Research Level:** Level 0 — All patterns established in codebase

## Overview

This phase transforms the existing meal-based food logging flow into an ingredient-weight-based logging flow. All required infrastructure already exists from prior phases — no new external dependencies, libraries, or services are needed.

## Existing Patterns (Confirmed via Codebase Read)

### Calorie Calculation
- **Formula:** `(caloriesPer100g * portionGrams) / 100` — already implemented in `backend/src/services/food.service.js` line 59-61
- **Server-side:** Already used in `food.controller.js` logFood endpoint (line 68-74) for seeded foods
- **Frontend reuse:** The same formula can be applied client-side for live preview using `Math.round()`

### Database Schema (No Migration Needed)
- `foods` table: `calories_per_100g` (INT), `category` (ENUM), `is_custom` (BOOLEAN), `user_id` (INT) — all columns exist
- `food_logs` table: `portion_grams` (INT), `calories` (INT), `food_id` (INT FK), `custom_food_name` (VARCHAR) — all columns exist
- Custom ingredients use the same `foods` table with `is_custom=TRUE` and `user_id` set

### Search Pattern
- `FoodSearch.jsx`: 300ms debounce, dropdown results, 44px min touch height, category labels mapping
- `searchFoods()` API: parameterized LIKE query, returns seeded + user's custom foods, ordered by seeded first

### Custom Food Pattern
- `CustomFoodForm.jsx`: react-hook-form + zod validation, name + calories_per_100g + category fields
- `validateFoodData()`: name (1-100 chars), calories (0-5000), category (must be valid enum)
- `createCustomFood()`: inserts into foods table with is_custom=TRUE, user_id set

### Recent Foods Pattern
- `getRecentFoods()`: returns distinct foods ordered by most recent log, includes portion_grams
- Already returns `portion_grams` field — can be used directly for quick-add default

### Daily Summary Pattern
- `getDailySummary()`: calculates totalConsumed from food_logs, computes calorieTarget from TDEE profile
- `CalorieSummary.jsx`: displays consumed, target, remaining, progress bar, extreme deficit warning
- Already works with ingredient-based logging — no changes needed

## Key Findings

### What Needs to Change
1. **FoodLogPage.jsx**: Add live calorie preview between portion input and meal type selector (D-01 to D-04)
2. **CustomFoodForm.jsx**: Make category optional for Phase 7 custom ingredient entry (D-09), auto-assign to 'other'
3. **food.service.js validateFoodData()**: Make category validation optional or add separate validation for simplified custom entry (D-09)
4. **getRecentFoods()**: Extend to include `last_portion_grams` per food (D-13 to D-15) — already returns portion_grams, may need aggregation
5. **Recent foods display**: Show "Food name — last: {portion}g" format (D-14)

### What Stays the Same
- Server-side calorie calculation (already correct)
- Database schema (no migration needed)
- Search flow (D-05, D-06)
- Daily summary display (already works)
- API client functions (foodLogApi.js — may need minor extension for last-portion endpoint)

## Common Pitfalls

1. **Client-server calorie mismatch**: Frontend preview must use identical formula to server (`Math.round((caloriesPer100g * portionGrams) / 100)`)
2. **Custom food category validation**: Existing `validateFoodData()` requires category — need separate validation or make optional
3. **Recent foods portion aggregation**: Current `getRecentFoods()` returns individual log entries with DISTINCT — need MAX(portion_grams) grouped by food_id for "last portion" feature
4. **Empty weight preview**: Preview must hide when weight is empty/invalid (D-03) — no placeholder text

## Architectural Responsibility Map

| Tier | Component | Responsibility |
|------|-----------|---------------|
| UI | FoodLogPage.jsx | Live calorie preview, portion input, meal type selector |
| UI | CustomFoodForm.jsx | Simplified custom ingredient entry (name + calories only) |
| UI | FoodLogTable.jsx | Recent foods list with last portion display |
| API | food.controller.js | logFood (already correct), getRecentFoods (extend for last portion) |
| Service | food.service.js | calculateCalories (reuse), validateFoodData (add optional category variant) |
| Repository | food.repository.js | getRecentFoods (extend query for MAX portion_grams) |
| DB | foods, food_logs tables | No schema changes needed |
