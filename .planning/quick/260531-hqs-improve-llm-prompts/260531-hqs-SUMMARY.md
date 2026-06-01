---
quick_id: 260531-hqs
description: Improve LLM prompts for activity plans and daily meal plans
completed: "2026-05-31T12:30:00Z"
duration_minutes: 15
tasks_completed: 2
tasks_total: 2
commits:
  - hash: 1141250
    message: "feat(260531-hqs): improve activity plan prompt and fix topActivityNames bug"
  - hash: cd1443b
    message: "feat(260531-hqs): improve daily meal plan prompt with richer fields and guidance"
---

# Quick Task 260531-hqs: Improve LLM Prompts for Activities & Meal Plan

## One-liner
Strengthened LLM prompts with TDEE/calorie context, expanded response fields (logged, calories_burned, total_calories, per-item calories), exemplar outputs, and macro/variety guidance; fixed `topActivityNames` hardcoded empty string bug.

## Files Modified

| File | Change |
|------|--------|
| `backend/prompts/system-prompt.md` | Added `calorieTarget`/`bmr` context, `logged`/`calories_burned` fields, exemplar output, better distribution constraints |
| `backend/src/services/activityPlan.service.js` | Computed `topActivityNames` from history (instead of `''`), passes `calorieTarget`/`bmr` to prompt |
| `backend/prompts/daily-meal-plan-prompt.md` | Added `total_calories`/`calorie_target` top-level fields, `calories`/`logged` per item, exemplar output, macro-guidance, variety/variety-portions constraints |

## Task Summary

### Task 1: Improve activity plan prompt and fix topActivityNames bug ✓
- **Commit:** `1141250`
- **Changes:**
  - Added `Daily Calorie Target: {{calorieTarget}} kcal` and `BMR: {{bmr}} kcal` to User Profile in system-prompt.md
  - Added guidance to prioritize favorite activities but introduce 1-2 new ones for variety
  - Added `logged: false` and `calories_burned: <integer>` to each activity in response format
  - Added exemplar output JSON block after schema
  - Replaced constraints with better distribution rules (rest day limit, consecutive day limit, variety day, calorie estimation)
  - Fixed `topActivityNames` from empty string to computed from `activityHistory` using same pattern as `llm.service.js`
  - Added `calorieTarget` and `bmr` to `buildPrompt` variables in `buildActivityPlanPrompt`

### Task 2: Improve daily meal plan prompt ✓
- **Commit:** `cd1443b`
- **Changes:**
  - Added `total_calories` and `calorie_target` top-level fields to response JSON
  - Added `calories` (integer) and `logged: false` per food item
  - Added exemplar output block after schema with realistic 4-meal example
  - Added macro-balance guidance: ~15-25% protein, ~45-55% carbs, ~20-30% fat
  - Added "each meal needs a protein/dairy source" constraint
  - Added food variety constraint (no repeating same food across meals, at least 3 categories)
  - Added portion realism guidance with gram ranges
  - Added calorie estimation guidance using `calories_per_100g`
  - Updated snack distribution to 5-15% for more precision

## Verification

- ✅ `system-prompt.md` has `{{calorieTarget}}`, `calories_burned`, `logged`, `"days"` structure intact
- ✅ `activityPlan.service.js` no longer has hardcoded `topActivityNames: ''`
- ✅ `daily-meal-plan-prompt.md` has `total_calories`, `calorie_target`, `"calories"`, `"logged"`, `protein`, `calories_per_100g`
- ✅ All 42 existing tests in `llm.service.test.js` pass
- ✅ Backward-compatible: all existing template variables preserved, `topNames` falls back to empty string

## Deviations from Plan

**None** — plan executed exactly as written.

## Success Criteria

| Criterion | Status |
|-----------|--------|
| Activity plan prompt includes calorie target context, proper response fields (logged, calories_burned), and an exemplar | ✅ |
| Top activity names computed from history instead of empty string | ✅ |
| Meal plan prompt includes total_calories, per-item calories, logged field, macro guidance, variety constraint, and an exemplar | ✅ |
| All existing template variables preserved (backward-compatible) | ✅ |
| Existing tests still pass | ✅ (42/42) |

## Self-Check: PASSED

- ✅ File `backend/prompts/system-prompt.md` exists and verified
- ✅ File `backend/src/services/activityPlan.service.js` exists and verified
- ✅ File `backend/prompts/daily-meal-plan-prompt.md` exists and verified
- ✅ Commit `1141250` exists
- ✅ Commit `cd1443b` exists
