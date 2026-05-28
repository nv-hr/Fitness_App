# Phase 07: Ingredient Logging & Calorie Calculation - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users log food by selecting an ingredient from the international database and entering weight in grams; the system calculates calories automatically and shows daily balance against TDEE target. Users can also add custom ingredients not in the database. This phase transforms the existing meal-based logging flow into an ingredient-weight-based logging flow. Depends on Phase 6 (ingredient database must exist for selection).

**Requirements:** LOG-07, LOG-08, LOG-09, CALC-01, CALC-02

</domain>

<decisions>
## Implementation Decisions

### Calorie Preview Display
- **D-01:** Show live calculated calorie preview as user types weight — updates in real-time (e.g., "150g = 248 kkal")
- **D-02:** Preview appears inline below the weight input, in the same section where food name and kkal/100g already display
- **D-03:** Hide preview when weight field is empty or invalid — no placeholder text shown
- **D-04:** Round calories to whole number using existing `calculateCalories()` formula (Math.round) — consistent with server-side calculation

### Logging Flow Layout
- **D-05:** Keep search-first pattern — search → select → portion → meal type → log. No changes to the core flow
- **D-06:** No category browsing UI on the logging page — pure search only. Category filter chips not added
- **D-07:** Keep current layout — meal type selector stays below portion input, above log button
- **D-08:** Single ingredient logging at a time — no multi-item meal builder. User logs one ingredient, then repeats for next

### Custom Ingredient Entry
- **D-09:** Custom ingredient entry requires only name + calories per 100g — category is NOT required (auto-assigned to 'other')
- **D-10:** Custom ingredients are saved to the foods table (is_custom=TRUE, user_id set) — they persist and appear in future searches for that user
- **D-11:** Custom entry triggered from the same "+ Add custom ingredient" toggle button below search results (existing FoodSearch.jsx pattern)
- **D-12:** Keep 0-5000 calories per 100g validation range — same as current food.service.js validation

### Quick-add Portion Default
- **D-13:** Quick-add from recent foods pre-fills weight with the user's last logged portion for that specific ingredient
- **D-14:** Recent foods list shows the last portion next to the ingredient name (e.g., "Chicken breast — last: 150g")
- **D-15:** Fallback to 100g if ingredient has no logging history

### the agent's Discretion
- Backend API endpoint design for fetching last portion per ingredient — planner decides whether to extend existing `/api/food/recent` endpoint or create a new one
- Database query optimization for last-portion lookup — planner decides indexing strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, and requirements (LOG-07, LOG-08, LOG-09, CALC-01, CALC-02)
- `.planning/REQUIREMENTS.md` — v1.1 requirements with traceability table

### Backend Files (existing — to be modified)
- `backend/src/controllers/food.controller.js` — logFood endpoint (line 50-101), getDailySummary (line 106-136), getRecentFoods (line 167-174). Server-side calorie calculation already implemented.
- `backend/src/services/food.service.js` — `calculateCalories()` function (line 59-61), `validateFoodData()` (line 36-50). Formula: `(caloriesPer100g * portionGrams) / 100`
- `backend/src/repositories/food.repository.js` — `searchFoods()`, `createCustomFood()`, `createFoodLog()`, `getRecentFoods()`. All work as-is for seeded foods.
- `backend/db/init.sql` — `foods` table schema (line 46-57), `food_logs` table schema (line 61-75). `portion_grams` and `calories` columns already exist.

### Frontend Files (existing — to be modified)
- `frontend/src/features/food-log/components/FoodLogPage.jsx` — Main logging page. handleFoodSelect (line 65-70), handleLogFood (line 79-119), selectedFood panel (line 162-214)
- `frontend/src/features/food-log/components/FoodSearch.jsx` — Search component with 300ms debounce, category labels mapping (line 5-14), results display
- `frontend/src/features/food-log/components/CalorieSummary.jsx` — Daily calorie summary bar with progress indicator
- `frontend/src/features/food-log/api/foodLogApi.js` — API client functions: searchFoods, logFood, getDailySummary, getRecentFoods

### Prior Phase Context
- `.planning/phases/06-international-ingredient-database/06-CONTEXT.md` — Phase 6 decisions: ingredient categories, USDA data source, search-first pattern, reusable assets

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculateCalories()` in `food.service.js` — Already implements the exact formula needed: `(caloriesPer100g * portionGrams) / 100`. Reuse for frontend preview.
- `food_logs` table — Already has `portion_grams` (INT) and `calories` (INT) columns. No schema change needed.
- `foods` table — Already has `calories_per_100g` (INT), `category` ENUM, `is_custom` (BOOLEAN). Custom ingredients use same table.
- `FoodSearch.jsx` — Debounced search (300ms), dropdown results, touch-friendly (44px min height), category labels mapping. Reuse as-is.
- `FoodLogPage.jsx` — Existing selectedFood panel with portion input, meal type selector, and log button. Add calorie preview to this section.
- `getRecentFoods()` repository function — Returns distinct foods ordered by most recent log. Extend to include last portion_grams per food.
- `CalorieSummary.jsx` — Already displays total consumed, target, remaining, and extreme deficit warning. Works with ingredient-based logging without changes.

### Established Patterns
- Server-side calorie calculation for seeded foods (food.controller.js line 68-74) — client sends foodId + portionGrams, server calculates
- Custom one-off logging (food.controller.js line 75-80) — client sends customFoodName + calories directly
- Indonesian error messages in backend — Phase 8 will switch to English, keep Indonesian for now
- Minimal inline styling in frontend — no CSS framework, function over form
- Feature-based folder structure: `features/food-log/components/`, `features/food-log/api/`

### Integration Points
- `FoodLogPage.jsx` selectedFood panel (line 162-214) — Add live calorie preview between portion input and meal type selector
- `foodLogApi.js` — May need new API function for fetching last portion per ingredient
- `food.repository.js` getRecentFoods() — Extend query to include MAX(portion_grams) grouped by food_id
- `food.controller.js` getRecentFoods() — Extend response to include last_portion_grams field
- `food.service.js` validateFoodData() — Remove category validation for Phase 7 custom ingredient entry (or make optional)

</code_context>

<specifics>
## Specific Ideas

- Calorie preview format: "{portionGrams}g = {calories} kkal" — matches existing "kkal/100g" display convention
- Custom ingredients auto-assigned to 'other' category since category is not required in the simplified form
- Recent foods list enhancement: "Food name — last: {portion}g" format for portion hint
- All decisions preserve compatibility with existing food_logs data structure
- No database migration needed — Phase 6 already set up the foods table with international ingredients and English categories

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-Ingredient Logging & Calorie Calculation*
*Context gathered: 2026-05-18*
