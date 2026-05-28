---
phase: 07-ingredient-logging-calorie-calculation
verified: 2026-05-18T16:30:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps: []
human_verification:
  - test: "Select ingredient from search, enter weight (e.g., 150g), verify preview shows '150g = X kkal' inline below weight input"
    expected: "Preview appears in real-time as weight is typed, hides when weight cleared, uses Math.round formula"
    why_human: "Visual UI behavior — preview positioning, real-time update timing, and conditional visibility require browser rendering"
  - test: "Log a seeded food entry, then verify server-stored calories match expected calculation (calories_per_100g × portion / 100)"
    expected: "Database food_logs.calories equals server-calculated value, not client-supplied value"
    why_human: "Requires running server + database to verify end-to-end data persistence"
  - test: "Create custom ingredient with name + calories only (no category field visible), verify it saves and appears in future searches"
    expected: "Form shows only name and calories fields; saved food has is_custom=TRUE, category='other', appears in search for that user"
    why_human: "Visual form rendering + cross-user data isolation requires live application testing"
  - test: "Quick-add a recently logged food, verify weight pre-fills with last logged portion (or 100g fallback)"
    expected: "Portion input shows last_portion_grams value; recent food button displays 'terakhir: Xg' hint"
    why_human: "Requires existing log data in database to test quick-add pre-fill behavior"
  - test: "Log multiple ingredient entries in a day, verify daily calorie summary shows correct total and balance against TDEE target"
    expected: "CalorieSummary bar shows sum of all entries, remaining = TDEE - totalConsumed, progress bar reflects percentage"
    why_human: "Requires live server with user profile data to verify TDEE-based balance calculation"
---

# Phase 07: Ingredient Logging & Calorie Calculation Verification Report

**Phase Goal:** Users log food by selecting an ingredient and entering weight in grams; system calculates calories and shows daily balance against TDEE target
**Verified:** 2026-05-18T16:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | User can select an ingredient from the database and enter weight in grams to log a food item | ✓ VERIFIED | FoodLogPage.jsx: FoodSearch component (line 157-160) with handleFoodSelect (line 66-71) sets selectedFood + default portion '100'. handleLogFood (line 84-126) sends `{foodId, portionGrams}` for seeded foods. Seeded path: `foodId: selectedFood.id` (line 101). |
| 2 | System displays calculated calories (weight × calories per 100g) before the user confirms the log entry | ✓ VERIFIED | FoodLogPage.jsx line 137: `const previewCalories = calculatePreviewCalories(selectedFood?.calories_per_100g, portion)`. Lines 201-205: conditional JSX `{previewCalories !== null && (...)}` renders `{parseInt(portion, 10)}g = {previewCalories} kkal`. previewCalories.js uses `Math.round((caloriesPer100g * grams) / 100)` — identical to server formula. Preview hidden when invalid (returns null). |
| 3 | User can add a custom ingredient not in the database by providing a name and calories per 100g | ✓ VERIFIED | CustomFoodForm.jsx: zod schema (lines 8-11) has only `name` and `calories_per_100g` — no `z.enum` (category removed). Form submits via `createCustomFood(data)` (line 25) → POST `/api/food`. Backend: `validateCustomFoodData` (food.service.js lines 62-77) accepts optional category, defaults to `'other'`. Controller (food.controller.js line 36) uses new validation. Repository (food.repository.js lines 38-54) INSERT sets `is_custom=TRUE, user_id`. |
| 4 | Daily calorie summary shows total calories consumed from all logged ingredient entries | ✓ VERIFIED | food.repository.js `getDailyTotal` (line 116): `SELECT COALESCE(SUM(calories), 0) as total FROM food_logs WHERE user_id = ? AND log_date = ?` — sums ALL food_logs entries regardless of food_id (seeded or custom). food.controller.js `getDailySummary` (line 111) calls `foodRepo.getDailyTotal(req.user.userId, date)`. CalorieSummary.jsx (line 3) receives and displays `totalConsumed` prop with progress bar. |
| 5 | Calorie balance (consumed vs TDEE target) displays correctly using the new ingredient-based logging model | ✓ VERIFIED | food.controller.js `getDailySummary` (lines 114-131): fetches user profile, calculates TDEE via `calculateTdee()`, gets calorie target via `getCalorieTarget()`, computes `remaining = calorieTarget - totalConsumed`. CalorieSummary.jsx (lines 4-5, 40-46) displays remaining balance, over-target warning, and progress bar. Works for all food_logs entries (ingredient-based or custom). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `frontend/src/features/food-log/components/FoodLogPage.jsx` | Live calorie preview between portion input and meal type selector | ✓ VERIFIED | 238 lines. Contains `previewCalories` derived variable (line 137), conditional JSX display (lines 201-205), imports `calculatePreviewCalories` (line 8). handleLogFood sends `foodId: selectedFood.id` (line 101) for seeded foods. handleQuickAdd derives per100g correctly (lines 74-78, CR-01 fix). Custom one-off calculates total calories (line 109, CR-02 fix). |
| `frontend/src/features/food-log/components/previewCalories.js` | Pure function for calorie calculation with null-return guards | ✓ VERIFIED | 16 lines. Exports `calculatePreviewCalories(caloriesPer100g, portion)`. Returns null for invalid inputs (grams < 1, > 5000, NaN, no caloriesPer100g). Uses `Math.round` formula. |
| `frontend/src/features/food-log/components/CustomFoodForm.jsx` | Simplified form with name + calories only, no category field | ✓ VERIFIED | 91 lines. Zod schema (lines 8-11) has only `name` and `calories_per_100g`. No `z.enum`, no `<select>` for category. Form submits via `createCustomFood(data)` to POST `/api/food`. |
| `backend/src/services/food.service.js` | validateCustomFoodData with optional category defaulting to 'other' | ✓ VERIFIED | 88 lines. `validateCustomFoodData` (lines 62-77) validates name (1-100 chars), calories (0-5000), defaults category to `'other'`. `calculateCalories` (lines 86-88) uses `Math.round` formula. `validateFoodData` (lines 36-50) unchanged — still requires category. |
| `backend/src/controllers/food.controller.js` | createCustomFood using validateCustomFoodData; logFood with zero-calorie fix | ✓ VERIFIED | 184 lines. Imports `validateCustomFoodData` (line 4). createCustomFood (line 36) uses new validation. logFood (line 77) uses `clientCalories == null` (CR-03 fix — allows zero-calorie foods). getDailySummary (lines 106-136) computes TDEE-based balance. |
| `backend/src/repositories/food.repository.js` | getRecentFoods with last_portion_grams; getDailyTotal with SUM aggregation | ✓ VERIFIED | 230 lines. getRecentFoods (lines 154-173) uses `MAX(fl.portion_grams) as last_portion_grams` with GROUP BY. getDailyTotal (line 116) uses `COALESCE(SUM(calories), 0)`. createCustomFood (lines 38-54) INSERT sets `is_custom=TRUE, user_id`. |
| `frontend/src/features/food-log/components/FoodLogTable.jsx` | Recent foods display with last portion hint | ✓ VERIFIED | 112 lines. Quick-add buttons (lines 87-106) show `{food.name}` with conditional `— terakhir: {food.last_portion_grams}g` (lines 101-103). |
| `frontend/src/features/food-log/components/CalorieSummary.jsx` | Daily calorie summary with progress bar, remaining balance, warnings | ✓ VERIFIED | 57 lines. Receives `totalConsumed`, `calorieTarget`, `remaining`, `isExtremeDeficit` props. Displays progress bar, over-target warning, extreme deficit warning. |
| `frontend/src/features/food-log/api/foodLogApi.js` | API client functions for all food logging endpoints | ✓ VERIFIED | 29 lines. Exports `logFood`, `createCustomFood`, `getDailySummary`, `getRecentFoods`, `searchFoods`, `getDailyLogs`, `getLogHistory`. All route to correct backend endpoints. |
| `frontend/vitest.config.js` | Vitest configuration for testing | ✓ VERIFIED | 10 lines. Configures vitest with React plugin, globals. **Warning:** environment set to `'node'` instead of `'jsdom'` (WR-06 from code review) — works for pure function tests but not component rendering. |
| `frontend/src/features/food-log/components/__tests__/previewCalories.test.js` | 12 unit tests for calculatePreviewCalories | ✓ VERIFIED | 55 lines. 12 tests covering valid inputs, edge cases, boundaries (1g, 5000g), null returns, and rounding behavior. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| FoodLogPage.jsx portion input onChange | calorie preview display | `calculatePreviewCalories()` via React state re-render | ✓ WIRED | `setPortion(e.target.value)` (line 194) triggers re-render; `previewCalories` (line 137) recomputed; conditional JSX (lines 201-205) renders/hides. |
| FoodLogPage.jsx handleLogFood | POST /api/food/log | `logFood()` API call with foodId + portionGrams | ✓ WIRED | `logFood({foodId: selectedFood.id, portionGrams: parseInt(portion, 10), ...})` (lines 100-105) for seeded; `logFood({customFoodName, calories: totalCalories, portionGrams, ...})` (lines 110-116) for custom. |
| food.controller.js logFood | food.service.js calculateCalories | Server-side calculation for seeded foods | ✓ WIRED | `calculateCalories(food.calories_per_100g, portionGrams)` (line 74) called after fetching food by ID. |
| CustomFoodForm.jsx onSubmit | POST /api/food | `createCustomFood(data)` API call | ✓ WIRED | `await createCustomFood(data)` (line 25) → `apiPost('/api/food', data)` (foodLogApi.js line 8) → POST /api/food. |
| food.controller.js createCustomFood | food.repository.js createCustomFood | Repository call with validated object | ✓ WIRED | `foodRepo.createCustomFood(req.user.userId, validated)` (line 37) passes validated object with auto-assigned category. |
| food.repository.js getRecentFoods | food_logs table | SQL with MAX(portion_grams) GROUP BY | ✓ WIRED | Query (lines 156-167) joins food_logs with foods, groups by food identity, returns `last_portion_grams`. |
| FoodLogPage.jsx handleQuickAdd | selectedFood + portion state | `setPortion(food.last_portion_grams \|\| 100)` | ✓ WIRED | Lines 73-82: derives per100g from total calories and last portion, sets portion to `last_portion_grams || 100`. |
| food.controller.js getDailySummary | food.repository.js getDailyTotal | `foodRepo.getDailyTotal(userId, date)` | ✓ WIRED | Line 111: calls repository function, returns totalConsumed for summary response. |
| CalorieSummary.jsx props | rendered display | Props: totalConsumed, calorieTarget, remaining | ✓ WIRED | Component receives props from FoodLogPage.jsx (lines 148-153) and renders progress bar, remaining balance, warnings. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| FoodLogPage.jsx preview display | `previewCalories` | Derived from `selectedFood.calories_per_100g` (from search API) + `portion` (user input) | ✓ Real — `calories_per_100g` comes from seeded food database via searchFoods API | ✓ FLOWING |
| FoodLogPage.jsx log entry | `foodId`, `portionGrams` | User selection + input → POST /api/food/log → server calculates via `calculateCalories(food.calories_per_100g, portionGrams)` | ✓ Real — server fetches `calories_per_100g` from foods table, computes calories | ✓ FLOWING |
| CustomFoodForm.jsx → log entry | `name`, `calories_per_100g` | User input → POST /api/food → INSERT into foods table → custom food usable in search | ✓ Real — validated server-side, stored with is_custom=TRUE | ✓ FLOWING |
| CalorieSummary.jsx totalConsumed | `totalConsumed` | `SELECT COALESCE(SUM(calories), 0) FROM food_logs` | ✓ Real — SQL aggregation over actual log entries | ✓ FLOWING |
| CalorieSummary.jsx calorieTarget | `calorieTarget` | User profile → `calculateTdee()` → `getCalorieTarget()` | ✓ Real — computed from stored profile data | ✓ FLOWING |
| FoodLogTable.jsx recentFoods | `recentFoods` array | `getRecentFoods` → SQL with GROUP BY + MAX(portion_grams) | ✓ Real — aggregated from food_logs table | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Calorie formula correctness | `node -e "const m=Math.round((165*150)/100); console.log(m===248?'PASS':'FAIL: '+m)"` | PASS | ✓ PASS |
| previewCalories.js exists and exports function | File read: 16 lines, exports `calculatePreviewCalories` | Verified | ✓ PASS |
| CustomFoodForm schema has no z.enum | Select-String for `z.enum` in CustomFoodForm.jsx | No matches | ✓ PASS |
| handleQuickAdd uses last_portion_grams | Select-String in FoodLogPage.jsx lines 75-79 | Found: `food.last_portion_grams` | ✓ PASS |
| getDailyTotal uses SUM aggregation | Select-String in food.repository.js line 116 | Found: `COALESCE(SUM(calories), 0)` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| LOG-07 | 07-01-PLAN.md | User can select an ingredient and enter weight in grams | ✓ SATISFIED | FoodSearch → handleFoodSelect → selectedFood panel with portion input → handleLogFood sends foodId + portionGrams |
| LOG-08 | 07-01-PLAN.md | System calculates calories automatically (weight × calories per 100g) | ✓ SATISFIED | previewCalories.js frontend preview; server-side calculateCalories in food.controller.js line 74 |
| LOG-09 | 07-02-PLAN.md | User can add custom ingredients not in database (name + calories per 100g) | ✓ SATISFIED | CustomFoodForm.jsx (no category), validateCustomFoodData with optional category defaulting to 'other', createCustomFood repository |
| CALC-01 | 07-03-PLAN.md | Daily calorie summary shows total from ingredient-based logging | ✓ SATISFIED | getDailyTotal sums ALL food_logs entries; CalorieSummary displays totalConsumed |
| CALC-02 | 07-03-PLAN.md | Calorie balance against TDEE target works with new logging model | ✓ SATISFIED | getDailySummary computes remaining = calorieTarget - totalConsumed; CalorieSummary renders balance |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| frontend/vitest.config.js | 8 | `environment: 'node'` instead of `'jsdom'` for React project | ⚠️ Warning | Works for pure function tests; future component tests will fail. Noted as WR-06 in code review. |
| frontend/src/features/food-log/components/CustomFoodForm.jsx | 9-10, 84 | Hardcoded Indonesian strings ('Maksimal 100 karakter', 'Batal') instead of `t()` calls | ℹ️ Info | Phase 8 (English UI Migration) will address i18n. Not a blocker for Phase 7. |
| frontend/src/features/food-log/components/FoodLogPage.jsx | 61 | Silent failure in `refreshData` — `catch {}` swallows all errors | ⚠️ Warning | Noted as WR-05 in code review. Data refresh fails silently. |
| backend/src/controllers/food.controller.js | 26 | Database errors leaked to client in searchFoods (inconsistent with other handlers) | ⚠️ Warning | Noted as WR-01 in code review. Should use `next(err)`. |
| backend/src/repositories/food.repository.js | 220-229 | `getFoodById` lacks user-scoping — allows ID enumeration | ⚠️ Warning | Noted as WR-03 in code review. Low risk for seeded foods. |

All 3 critical bugs from the code review (CR-01, CR-02, CR-03) have been **fixed in the codebase**:
- **CR-01:** FoodLogPage.jsx lines 74-78 derive `per100g` from `food.calories * 100 / food.last_portion_grams`
- **CR-02:** FoodLogPage.jsx line 109 uses `calculatePreviewCalories(selectedFood.calories_per_100g, portionGrams)` for total calories
- **CR-03:** food.controller.js line 77 uses `clientCalories == null` instead of `!clientCalories`

### Human Verification Required

1. **Live Calorie Preview UI**
   **Test:** Select ingredient from search, enter weight (e.g., 150g), verify preview shows "150g = X kkal" inline below weight input
   **Expected:** Preview appears in real-time as weight is typed, hides when weight cleared, uses Math.round formula
   **Why human:** Visual UI behavior — preview positioning, real-time update timing, and conditional visibility require browser rendering

2. **End-to-End Server-Side Calculation**
   **Test:** Log a seeded food entry, then verify server-stored calories match expected calculation (calories_per_100g × portion / 100)
   **Expected:** Database food_logs.calories equals server-calculated value, not client-supplied value
   **Why human:** Requires running server + database to verify end-to-end data persistence

3. **Custom Ingredient Creation Flow**
   **Test:** Create custom ingredient with name + calories only (no category field visible), verify it saves and appears in future searches
   **Expected:** Form shows only name and calories fields; saved food has is_custom=TRUE, category='other', appears in search for that user
   **Why human:** Visual form rendering + cross-user data isolation requires live application testing

4. **Quick-Add Portion Pre-fill**
   **Test:** Quick-add a recently logged food, verify weight pre-fills with last logged portion (or 100g fallback)
   **Expected:** Portion input shows last_portion_grams value; recent food button displays "terakhir: Xg" hint
   **Why human:** Requires existing log data in database to test quick-add pre-fill behavior

5. **Daily Calorie Summary with TDEE Balance**
   **Test:** Log multiple ingredient entries in a day, verify daily calorie summary shows correct total and balance against TDEE target
   **Expected:** CalorieSummary bar shows sum of all entries, remaining = TDEE - totalConsumed, progress bar reflects percentage
   **Why human:** Requires live server with user profile data to verify TDEE-based balance calculation

---

_Verified: 2026-05-18T16:30:00Z_
_Verifier: the agent (gsd-verifier)_
