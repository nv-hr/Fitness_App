---
phase: 07-ingredient-logging-calorie-calculation
reviewed: 2026-05-18T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - backend/src/controllers/food.controller.js
  - backend/src/repositories/food.repository.js
  - backend/src/services/food.service.js
  - backend/tests/food.service.test.js
  - frontend/src/features/food-log/components/__tests__/previewCalories.test.js
  - frontend/src/features/food-log/components/CustomFoodForm.jsx
  - frontend/src/features/food-log/components/FoodLogPage.jsx
  - frontend/src/features/food-log/components/FoodLogTable.jsx
  - frontend/src/features/food-log/components/previewCalories.js
  - frontend/tests/CustomFoodForm.test.js
  - frontend/vitest.config.js
findings:
  critical: 3
  warning: 6
  info: 5
  total: 14
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed 11 source files covering the backend food logging API (controller, repository, service, tests) and frontend food log components (page, table, form, calorie preview, tests, vitest config). The codebase uses parameterized queries correctly (no SQL injection), has reasonable validation in the service layer, and the `previewCalories.js` pure function is well-tested.

However, there are **3 critical bugs** in the calorie calculation and logging flow that produce incorrect data, plus **6 warnings** around error handling, information leakage, and test configuration. The most severe issues are in `FoodLogPage.jsx` where the quick-add and custom one-off logging paths send wrong calorie values, and in `food.controller.js` where zero-calorie foods are incorrectly rejected.

## Critical Issues

### CR-01: Quick-add maps total calories to `calories_per_100g`, corrupting preview display

**File:** `frontend/src/features/food-log/components/FoodLogPage.jsx:74`
**Issue:** In `handleQuickAdd`, the `food.calories` value (which is the **total calories** from the last logged portion) is assigned to `calories_per_100g`. This causes the calorie preview to be wrong whenever the user changes the portion. For example, if a food was previously logged at 200g with 300 total calories, quick-adding it sets `calories_per_100g = 300`. If the user then changes the portion to 100g, the preview shows 300 kcal instead of the correct ~150 kcal.

```js
// Current (WRONG — food.calories is total, not per-100g):
setSelectedFood({ id: food.food_id, name: food.name, calories_per_100g: food.calories });
```

**Fix:** For seeded foods (where `food.food_id` is set), look up the actual `calories_per_100g` from the food data. The `recentFoods` API response should include `calories_per_100g`, or the frontend should derive it:

```js
// Fix — derive per-100g from total calories and last portion:
const per100g = food.last_portion_grams
  ? Math.round((food.calories * 100) / food.last_portion_grams)
  : food.calories;
setSelectedFood({ id: food.food_id, name: food.name, calories_per_100g: per100g });
```

Alternatively, modify the `getRecentFoods` repository query to JOIN and return `calories_per_100g` from the `foods` table.

### CR-02: Custom one-off food logging sends per-100g value as total calories

**File:** `frontend/src/features/food-log/components/FoodLogPage.jsx:106`
**Issue:** When logging a custom one-off food (no `foodId`), the frontend sends `calories: parseInt(selectedFood.calories_per_100g, 10)` — the per-100g value — as the **total calories** for the log entry. The server accepts this value directly without recalculating (see `food.controller.js:80`). This means if a user logs 250g of a food with 200 kcal/100g, only 200 calories are recorded instead of the correct 500.

```js
// Current (WRONG — sends per-100g as total):
await logFood({
  customFoodName: selectedFood.name,
  calories: parseInt(selectedFood.calories_per_100g, 10),  // ← per-100g, not total!
  portionGrams: parseInt(portion, 10),
  ...
});
```

**Fix:** Calculate the total calories for the actual portion before sending:

```js
// Fix — calculate total calories for the portion:
const portionGrams = parseInt(portion, 10);
const totalCalories = Math.round((parseInt(selectedFood.calories_per_100g, 10) * portionGrams) / 100);
await logFood({
  customFoodName: selectedFood.name,
  calories: totalCalories,
  portionGrams,
  ...
});
```

Or better: use the existing `calculatePreviewCalories` function which is already imported:

```js
const totalCalories = calculatePreviewCalories(selectedFood.calories_per_100g, portion);
```

### CR-03: Zero-calorie custom foods are rejected by falsy check

**File:** `backend/src/controllers/food.controller.js:77`
**Issue:** The check `if (!clientCalories || clientCalories < 0)` uses JavaScript's falsy evaluation, which treats `0` as falsy. This means zero-calorie foods (water, black coffee, etc.) cannot be logged as custom one-off entries. The condition should explicitly check for `null`/`undefined` rather than relying on truthiness.

```js
// Current (WRONG — rejects 0):
if (!clientCalories || clientCalories < 0) {
  return errorResponse(res, 'Kalori wajib diisi', 400, 'VALIDATION_ERROR');
}
```

**Fix:**
```js
// Fix — explicit null/undefined check:
if (clientCalories == null || clientCalories < 0) {
  return errorResponse(res, 'Kalori wajib diisi', 400, 'VALIDATION_ERROR');
}
```

## Warnings

### WR-01: Database errors leaked to client in `searchFoods`

**File:** `backend/src/controllers/food.controller.js:26`
**Issue:** Unlike all other endpoints in this controller (which use `next(err)` to delegate to the global error handler), `searchFoods` directly sends a JSON response with `err.message` and `err.name`. This leaks internal database error details (e.g., table names, SQL state) to the client and bypasses centralized error formatting.

```js
// Inconsistent — all other handlers use next(err):
res.status(500).json({ success: false, error: { message: err.message, code: err.name } });
```

**Fix:** Use `next(err)` consistently:
```js
next(err);
```

### WR-02: No upper bound validation on client-supplied calories

**File:** `backend/src/controllers/food.controller.js:77`
**Issue:** The validation `if (!clientCalories || clientCalories < 0)` checks for negative values but has no upper bound. A client could submit `calories: 999999999` and it would be accepted and stored. Given the maximum portion is 5000g and max `calories_per_100g` is 5000, the theoretical maximum is 250,000 calories.

**Fix:**
```js
if (clientCalories == null || clientCalories < 0 || clientCalories > 250000) {
  return errorResponse(res, 'Kalori tidak valid', 400, 'VALIDATION_ERROR');
}
```

### WR-03: `getFoodById` lacks user-scoping — allows ID enumeration

**File:** `backend/src/repositories/food.repository.js:220-229`
**Issue:** `getFoodById(foodId)` queries `SELECT * FROM foods WHERE id = ?` without filtering by `user_id`. Called from `food.controller.js:70` in the `logFood` handler, this allows any authenticated user to look up any food by ID, including other users' custom foods. While users cannot discover other users' custom food IDs through `searchFoods` (which is properly scoped), ID enumeration is still possible.

```js
// Current — no user scoping:
'SELECT * FROM foods WHERE id = ? LIMIT 1'
```

**Fix:** Since this is only used to look up `calories_per_100g` for seeded foods, add a filter:
```js
'SELECT * FROM foods WHERE id = ? AND (is_custom = FALSE OR user_id = ?) LIMIT 1'
```

And update the controller call: `foodRepo.getFoodById(foodId, req.user.userId)`.

### WR-04: Server error message displayed directly to user in CustomFoodForm

**File:** `frontend/src/features/food-log/components/CustomFoodForm.jsx:30`
**Issue:** `setErrorMsg(err.message || t('foodLog.customFoodError'))` displays the raw server error message to the user. If the server returns an unexpected error (e.g., database constraint violation, stack trace), internal details could be exposed.

**Fix:** Use a generic user-facing message and log the full error separately:
```js
setErrorMsg(t('foodLog.customFoodError'));
// Optionally log err.message to console for debugging
```

### WR-05: Silent failure in `refreshData` hides data sync errors

**File:** `frontend/src/features/food-log/components/FoodLogPage.jsx:61`
**Issue:** The `catch {}` block in `refreshData` silently swallows all errors. If the refresh fails (network error, server down, auth expired), the UI continues showing stale data with no indication to the user. The initial load (`useEffect`) does set `setError(err.message)`, but subsequent refreshes do not.

**Fix:** At minimum, set the error state:
```js
} catch (err) {
  setError(err.message || 'Gagal memperbarui data');
}
```

### WR-06: Vitest environment set to `node` instead of `jsdom`

**File:** `frontend/vitest.config.js:8`
**Issue:** `environment: 'node'` is configured for a React frontend project. React components require a DOM environment (`jsdom` or `happy-dom`) to render. The existing tests pass only because they test pure functions (`previewCalories.js`) or read source files as text (`CustomFoodForm.test.js`) — they work by accident, not by correct configuration. Any future component tests that attempt to render will fail silently or crash.

**Fix:**
```js
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

## Info

### IN-01: Misleading variable name `isExtremeDeficit`

**File:** `backend/src/controllers/food.controller.js:124`
**Issue:** `const isExtremeDeficit = totalConsumed < 1200;` — The name suggests an extreme calorie deficit (gap between target and consumed), but the logic checks absolute intake below 1200 kcal. This is more accurately "low intake" or "below minimum threshold." A true deficit would be `calorieTarget - totalConsumed`.

**Fix:** Rename to `isLowIntake` or `belowMinimumCalories`:
```js
const isLowIntake = totalConsumed < 1200;
```

### IN-02: Missing boundary and type tests in `food.service.test.js`

**File:** `backend/tests/food.service.test.js`
**Issue:** The test suite does not cover:
- `calories_per_100g = 0` (valid boundary — should be accepted)
- `calories_per_100g` as a non-number type (e.g., string `"100"` — should be rejected)
- `name` as a non-string type (e.g., number `123` — should be rejected)

**Fix:** Add tests:
```js
test('accepts calories_per_100g = 0', () => {
  const result = validateCustomFoodData({ name: 'Water', calories_per_100g: 0 });
  expect(result.calories_per_100g).toBe(0);
});

test('throws when calories_per_100g is a string', () => {
  expect(() =>
    validateCustomFoodData({ name: 'Test', calories_per_100g: '100' })
  ).toThrow(ValidationError);
});
```

### IN-03: Hardcoded Indonesian strings in CustomFoodForm instead of i18n

**File:** `frontend/src/features/food-log/components/CustomFoodForm.jsx:9-10,84`
**Issue:** Several strings are hardcoded in Indonesian instead of using the `t()` translation function:
- Line 9: `'Maksimal 100 karakter'`
- Line 10: `'Minimal 0 kkal'`, `'Maksimal 5000 kkal'`
- Line 84: `'Batal'`

**Fix:** Replace with `t()` calls:
```js
z.string().min(1, t('validation.required')).max(100, t('validation.maxLength', { max: 100 })),
z.coerce.number().min(0, t('validation.minCalories')).max(5000, t('validation.maxCalories')),
// ...
{onCancel && <button ...>{t('common.cancel')}</button>}
```

### IN-04: Potential key collision in FoodLogTable quick-add buttons

**File:** `frontend/src/features/food-log/components/FoodLogTable.jsx:89`
**Issue:** `key={`${food.name}-${idx}`}` uses the food name plus array index. If two recent foods have the same name (e.g., "Nasi Goreng" logged at different times), the keys would collide, causing React rendering issues.

**Fix:** Use a more unique key. If `food.food_id` is available, use it; otherwise include the calories or timestamp:
```js
key={`${food.food_id ?? food.name}-${food.calories}-${idx}`}
```

### IN-05: Fragile test assertion in CustomFoodForm.test.js

**File:** `frontend/tests/CustomFoodForm.test.js:29`
**Issue:** `expect(content.includes('<select')).toBe(false)` asserts that no `<select` element exists anywhere in the component. This is a fragile static check — if a future change legitimately adds a select element (e.g., for portion unit selection), this test would fail even though the change is correct.

**Fix:** Test the specific behavior rather than the absence of a tag:
```js
test('does NOT contain category select element', () => {
  expect(content.includes('category')).toBe(false);
});
```

---

_Reviewed: 2026-05-18T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
