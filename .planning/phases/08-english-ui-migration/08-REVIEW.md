---
phase: 08-english-ui-migration
reviewed: 2026-05-19T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - backend/db/init.sql
  - backend/src/controllers/food.controller.js
  - backend/src/services/food.service.js
  - backend/src/services/profile.service.js
  - frontend/src/features/food-log/components/CalorieHistory.jsx
  - frontend/src/features/food-log/components/CalorieSummary.jsx
  - frontend/src/features/food-log/components/CustomFoodForm.jsx
  - frontend/src/features/food-log/components/FoodLogPage.jsx
  - frontend/src/features/food-log/components/FoodLogTable.jsx
  - frontend/src/features/food-log/components/FoodSearch.jsx
  - frontend/src/shared/i18n/translations.js
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-05-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This phase migrates the food-log UI from Indonesian to English. The backend database migration (init.sql lines 84-93) correctly converts the `meal_type` ENUM from Indonesian (`sarapan`, `makan_siang`, `makan_malam`, `camilan`) to English (`breakfast`, `lunch`, `dinner`, `snack`). However, **the frontend was not updated to match** — two BLOCKER issues prevent the food logging feature from working at all after this migration. The frontend still sends Indonesian meal type values to the server and groups logs by Indonesian keys, while the backend now only accepts and stores English values.

Additional warnings cover input validation gaps, inconsistent error handling, and dead translation keys.

## Critical Issues

### CR-01: FoodLogPage sends Indonesian mealType values to English-only backend ENUM

**File:** `frontend/src/features/food-log/components/FoodLogPage.jsx:18,215-218`
**Issue:** The `mealType` state defaults to `'sarapan'` (line 18) and the `<select>` options use Indonesian `value` attributes (`sarapan`, `makan_siang`, `makan_malam`, `camilan`) on lines 215-218. After the init.sql migration (lines 84-93), the backend `food_logs.meal_type` ENUM only accepts English values (`'breakfast'`, `'lunch'`, `'dinner'`, `'snack'`). When the user submits a food log, the MySQL INSERT will fail with a data truncation error because `'sarapan'` is not a valid ENUM value. **All food logging is broken after this migration.**

**Fix:**
```jsx
// Line 18: Change default to English
const [mealType, setMealType] = useState('breakfast');

// Lines 215-218: Change option values to English
<select id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value)} ...>
  <option value="breakfast">{t('foodLog.sarapan')}</option>
  <option value="lunch">{t('foodLog.makanSiang')}</option>
  <option value="dinner">{t('foodLog.makanMalam')}</option>
  <option value="snack">{t('foodLog.camilan')}</option>
</select>
```
The translation keys (`t('foodLog.sarapan')` etc.) correctly map to English labels ("Breakfast", "Lunch", etc.) — only the `value` attributes need changing.

### CR-02: FoodLogTable groups by Indonesian mealType keys but API returns English

**File:** `frontend/src/features/food-log/components/FoodLogTable.jsx:3-10,18-20`
**Issue:** The `mealTypeLabels` mapping (lines 3-8) and `mealTypeOrder` array (line 10) use Indonesian keys (`sarapan`, `makan_siang`, `makan_malam`, `camilan`). After the backend migration, `getDailyLogs` returns logs with `meal_type` as English values (`'breakfast'`, `'lunch'`, etc.). In the grouping loop (lines 18-20), `grouped[log.meal_type]` creates new English keys that are never iterated over (line 38 only iterates `mealTypeOrder` which has Indonesian keys). **Result: no food logs are displayed in the table** — all entries are grouped under keys that the render loop never visits.

**Fix:**
```js
// Lines 3-10: Change all keys to English
const mealTypeLabels = {
  breakfast: t('foodLog.sarapan'),
  lunch: t('foodLog.makanSiang'),
  dinner: t('foodLog.makanMalam'),
  snack: t('foodLog.camilan'),
};

const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
```

## Warnings

### WR-01: portionGrams not validated as numeric — non-numeric strings pass

**File:** `backend/src/controllers/food.controller.js:55`
**Issue:** The validation `!portionGrams || portionGrams < 1 || portionGrams > 5000` relies on JavaScript's loose comparison. A non-numeric string like `"abc"` passes all three checks: `!"abc"` is `false`, `"abc" < 1` coerces to `NaN < 1` which is `false`, and `"abc" > 5000` is also `false`. The string then flows into `calculateCalories()` producing `NaN`, which is sent to the database and either coerced to 0 or causes an error.

**Fix:**
```js
const portionNum = Number(portionGrams);
if (!portionGrams || isNaN(portionNum) || portionNum < 1 || portionNum > 5000) {
  return errorResponse(res, 'Portion must be between 1-5000 grams', 400, 'VALIDATION_ERROR');
}
// Use portionNum downstream instead of portionGrams
```

### WR-02: Inconsistent error handling in searchFoods — bypasses global error handler

**File:** `backend/src/controllers/food.controller.js:26`
**Issue:** `searchFoods` catches errors and sends a direct `res.status(500).json(...)` response, while all other controller functions (`createCustomFood`, `logFood`, `getDailySummary`, etc.) use `next(err)` to delegate to the global error handler. This inconsistency means search errors skip any centralized logging, formatting, or monitoring the global handler provides.

**Fix:**
```js
// Line 26: Replace direct response with next(err)
// Remove: res.status(500).json({ success: false, error: { message: err.message, code: err.name } });
// Add:
next(err);
```

### WR-03: validateCustomFoodData accepts invalid category values

**File:** `backend/src/services/food.service.js:74`
**Issue:** `validateCustomFoodData` defaults category to `'other'` when falsy (`category || 'other'`), but does not validate that a provided category is actually one of the valid ENUM values. If a caller passes `category: "invalid"`, it passes through and reaches the database, where the ENUM constraint rejects it with a database error instead of a clean validation error.

**Fix:**
```js
// Line 74: Add validation
const validCategory = category || 'other';
if (!VALID_CATEGORIES.includes(validCategory)) {
  throw new ValidationError('Invalid food category');
}
return { name: name.trim(), calories_per_100g, category: validCategory };
```

### WR-04: getCalorieTarget silently accepts invalid fitnessGoal

**File:** `backend/src/services/profile.service.js:88`
**Issue:** `const adjustment = adjustments[fitnessGoal] || 0;` — if `fitnessGoal` is an unrecognized value (e.g., `"bulk"`), it silently defaults to `0` (maintain adjustment). The caller receives an incorrect calorie target with no indication of the problem.

**Fix:**
```js
const adjustment = adjustments[fitnessGoal];
if (adjustment === undefined) {
  throw new ValidationError(`Invalid fitness goal: ${fitnessGoal}`);
}
return Math.round(tdee + adjustment);
```

### WR-05: FoodSearch categoryLabels keys don't match database categories

**File:** `frontend/src/features/food-log/components/FoodSearch.jsx:5-14`
**Issue:** The `categoryLabels` mapping uses Indonesian keys (`makanan_pokok`, `lauk`, `sayur`, `buah`, `minuman`, `snack`, `lainnya`) but the database `foods.category` ENUM uses English values (`proteins`, `carbs`, `vegetables`, `fruits`, `dairy`, `fats`, `drinks`, `other`). On line 91, `categoryLabels[food.category]` always returns `undefined`, falling back to the raw English key. No translated category labels are ever displayed.

**Fix:**
```js
const categoryLabels = {
  proteins: t('foodLog.categories.proteins'),
  carbs: t('foodLog.categories.carbs'),
  vegetables: t('foodLog.categories.vegetables'),
  fruits: t('foodLog.categories.fruits'),
  dairy: t('foodLog.categories.dairy'),
  fats: t('foodLog.categories.fats'),
  drinks: t('foodLog.categories.drinks'),
  other: t('foodLog.categories.other'),
};
```
And add matching keys to `translations.js` under `foodLog.categories`.

### WR-06: mealTypeLabels and categoryLabels computed at module scope

**File:** `frontend/src/features/food-log/components/FoodLogTable.jsx:3-8`, `FoodSearch.jsx:5-14`
**Issue:** Both `mealTypeLabels` (FoodLogTable) and `categoryLabels` (FoodSearch) are computed at module load time by calling `t()` once. If the translation system ever supports dynamic language switching, these labels will be stale — they won't re-evaluate when the language changes. Move them inside the component body or into the render path.

**Fix:** Move the mapping objects inside each component function, or compute labels inline during render.

## Info

### IN-01: validateFoodData imported but unused

**File:** `backend/src/controllers/food.controller.js:4`
**Issue:** `validateFoodData` is imported from `food.service.js` but never called in the controller. Only `validateCustomFoodData` is used. Dead import.
**Fix:** Remove `validateFoodData` from the import statement.

### IN-02: Hardcoded English validation messages in CustomFoodForm

**File:** `frontend/src/features/food-log/components/CustomFoodForm.jsx:9-10`
**Issue:** Zod schema error messages for `calories_per_100g` are hardcoded in English (`'Minimum 0 kcal'`, `'Maximum 5000 kcal'`) instead of using `t()` like the `name` field does. Inconsistent i18n.
**Fix:** Add translation keys and use `t()` for all error messages.

### IN-03: Dead Indonesian category translation keys

**File:** `frontend/src/shared/i18n/translations.js:122-130`
**Issue:** The `foodLog.categories` object contains Indonesian keys (`makanan_pokok`, `lauk`, `sayur`, `buah`, `minuman`, `snack`, `lainnya`) that don't match any database category values. These translation entries are unreachable dead code.
**Fix:** Replace with English keys matching the database ENUM: `proteins`, `carbs`, `vegetables`, `fruits`, `dairy`, `fats`, `drinks`, `other`.

### IN-04: init.sql migration runs on every execution

**File:** `backend/db/init.sql:84-93`
**Issue:** The meal_type ENUM migration (expand → update → shrink) is embedded in `init.sql` and runs every time the file is executed. On a fresh database, the table is created with English-only ENUM (line 69), then the migration adds Indonesian values back only to remove them again. Harmless but wasteful. In production, this should be a separate migration file, not part of the init script.
**Fix:** Move lines 84-93 to a separate migration script (e.g., `migrations/008-meal-type-english.sql`) that is run once, not on every init.

---

_Reviewed: 2026-05-19T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
