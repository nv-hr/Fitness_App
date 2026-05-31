---
quick_id: 260531-hqs
description: Improve LLM prompts for activity plans and daily meal plans
type: quick
autonomous: true
files_modified:
  - backend/prompts/system-prompt.md
  - backend/prompts/daily-meal-plan-prompt.md
  - backend/src/services/activityPlan.service.js
---

# Quick Task: Improve LLM Prompts for Activities & Meal Plan

<objective>
Improve the quality of AI-generated activity plans and daily meal plans by strengthening the LLM prompts with richer context (TDEE/calorie targets, exemplar outputs, additional response fields) and fixing a service bug where `topActivityNames` was hardcoded as empty string.
</objective>

<context>
@backend/prompts/system-prompt.md
@backend/prompts/daily-meal-plan-prompt.md
@backend/prompts/correction-prompt.md
@backend/src/services/activityPlan.service.js
@backend/src/services/dailyMealPlan.service.js
@backend/src/services/llm.service.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Improve activity plan prompt and fix topActivityNames bug</name>
  <files>
    backend/prompts/system-prompt.md
    backend/src/services/activityPlan.service.js
  </files>
  <action>
    === PART A: Improve `system-prompt.md` ===

    Rewrite `system-prompt.md` with these improvements (keep all existing template variables like `{{weightKg}}`, `{{activityHistory}}`, etc.):

    1. **Add TDEE/calorie context:** Insert a line after the fitness goal: "Daily Calorie Target: {{calorieTarget}} kcal" and "BMR: {{bmr}} kcal" — so LLM can calibrate activity volume to energy expenditure.

    NOTE: `buildActivityPlanPrompt` already passes `calorieTarget` (from `profile.calorieTarget`). Make sure the template accepts `{{calorieTarget}}`.

    2. **Enrich `topActivityNames` usage:** Add guidance: "These are the user's favorite activities from their history. Prioritize these where appropriate, but also introduce 1-2 new activities for variety."

    3. **Response format additions:** Add `"logged": false` and `calories_burned` fields to each activity object:
    ```json
    {
      "activity_id": <integer>,
      "name": "<exact name>",
      "duration_min": <integer 10-180>,
      "intensity": "light" | "moderate" | "vigorous",
      "logged": false,
      "calories_burned": <integer>
    }
    ```

    4. **Add exemplar output:** After the template schema, add:
    ```
    # Example (for illustration only)
    ```json
    {
      "days": [
        {
          "date": "2026-06-01",
          "activities": [
            { "activity_id": 3, "name": "Walking", "duration_min": 30, "intensity": "light", "logged": false, "calories_burned": 120 },
            { "activity_id": 8, "name": "Cycling", "duration_min": 45, "intensity": "moderate", "logged": false, "calories_burned": 315 }
          ]
        }
      ]
    }
    ```

    5. **Better distribution constraints:** Replace the last two constraints with:
    ```
    - No more than 2 rest days with only 1 light activity
    - At most 2 consecutive days of the same activity type
    - Include at least 1 variety day per week with a different activity than the user's usual
    - Activities MUST use exact names from the provided Available Activities list
    - Prioritize activities the user has done recently (from history)
    - For "{{fitnessGoal}}" goal: suggest activities that align with this objective
    - Estimate `calories_burned` using the activity's typical burn rate per minute
    ```

    Preserve everything else (Role, User Profile, Recent Activity History, Available Activities sections).

    === PART B: Fix `topActivityNames` in `activityPlan.service.js` ===

    In `buildActivityPlanPrompt()`, replace:
    ```js
    topActivityNames: '',
    ```
    with logic that computes top activity names from `activityHistory` (same pattern as `llm.service.js` line 67):
    ```js
    const topNames = activityHistory && activityHistory.length > 0
      ? [...new Set(activityHistory.map(a => a.activity_name || a.activityName).filter(Boolean))].slice(0, 5).join(', ')
      : '';
    ```
    Then pass `topActivityNames: topNames` instead of `''`.

    Also add `calorieTarget` to the prompt variables by extracting it from profile:
    ```js
    calorieTarget: String(profile.calorieTarget || ''),
    ```
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const p=fs.readFileSync('backend/prompts/system-prompt.md','utf8'); console.assert(p.includes('{{calorieTarget}}'), 'calorieTarget missing'); console.assert(p.includes('calories_burned'), 'calories_burned missing'); console.assert(p.includes('logged'), 'logged missing'); console.assert(p.includes('\"days\"'), 'days structure intact'); console.log('system-prompt.md OK');"</automated>
    <automated>node -e "const fs=require('fs'); const s=fs.readFileSync('backend/src/services/activityPlan.service.js','utf8'); console.assert(!s.includes(\"topActivityNames: ''\"), 'empty topActivityNames still present'); console.log('activityPlan.service.js OK');"</automated>
  </verify>
  <done>
    system-prompt.md has:
    - `calorieTarget` template variable
    - `logged` + `calories_burned` in response format
    - Exemplar output block
    - Better distribution constraints
    activityPlan.service.js:
    - topActivityNames computed from history (not empty string)
    - calorieTarget passed to prompt
  </done>
</task>

<task type="auto">
  <name>Task 2: Improve daily meal plan prompt</name>
  <files>
    backend/prompts/daily-meal-plan-prompt.md
  </files>
  <action>
    Rewrite `daily-meal-plan-prompt.md` with these improvements (keep all existing template variables like `{{foodDatabase}}`, `{{calorieTarget}}`, etc.):

    1. **Add total_calories and calorie_target to response format** — expand the JSON template:
    ```json
    {
      "meals": [
        {
          "meal_type": "breakfast",
          "items": [
            {
              "food_id": <integer>,
              "food_name": "<exact name from Available Foods>",
              "portion_grams": <integer>,
              "calories": <integer>,
              "logged": false
            }
          ]
        }
      ],
      "total_calories": <integer>,
      "calorie_target": <integer>
    }
    ```

    2. **Add macro-balance guidance** after the distribution constraint:
    ```
    - Recommend a balanced macro split: ~15-25% protein, ~45-55% carbs, ~20-30% fat of total calories
    - Ensure each meal has at least one protein or dairy source
    ```

    3. **Add variety constraint** to avoid boring repetition:
    ```
    - Avoid repeating the same food item across different meals (e.g., chicken in lunch AND dinner)
    - Include at least 3 different food categories across the day
    ```

    4. **Add portion realism guidance:**
    ```
    - Portion sizes should be realistic for a single meal: 100-250g for protein, 50-200g for carbs, 50-150g for vegetables
    ```

    5. **Add exemplar output** after the schema:
    ```
    # Example (for illustration only)
    ```json
    {
      "meals": [
        {
          "meal_type": "breakfast",
          "items": [
            { "food_id": 12, "food_name": "Oatmeal", "portion_grams": 150, "calories": 195, "logged": false },
            { "food_id": 5, "food_name": "Banana", "portion_grams": 120, "calories": 107, "logged": false }
          ]
        },
        {
          "meal_type": "lunch",
          "items": [
            { "food_id": 23, "food_name": "Chicken Breast", "portion_grams": 180, "calories": 297, "logged": false },
            { "food_id": 45, "food_name": "Brown Rice", "portion_grams": 150, "calories": 173, "logged": false },
            { "food_id": 67, "food_name": "Broccoli", "portion_grams": 100, "calories": 35, "logged": false }
          ]
        },
        {
          "meal_type": "dinner",
          "items": [
            { "food_id": 30, "food_name": "Salmon", "portion_grams": 200, "calories": 416, "logged": false },
            { "food_id": 52, "food_name": "Sweet Potato", "portion_grams": 150, "calories": 129, "logged": false },
            { "food_id": 70, "food_name": "Asparagus", "portion_grams": 100, "calories": 20, "logged": false }
          ]
        },
        {
          "meal_type": "snack",
          "items": [
            { "food_id": 15, "food_name": "Greek Yogurt", "portion_grams": 150, "calories": 97, "logged": false },
            { "food_id": 8, "food_name": "Almonds", "portion_grams": 30, "calories": 173, "logged": false }
          ]
        }
      ],
      "total_calories": 1642,
      "calorie_target": 2000
    }
    ```

    6. **Update the calorie distribution** to be more precise:
    ```
    - Distribute calories: breakfast ~20-25%, lunch ~30-35%, dinner ~30-35%, snack ~5-15%
    - Estimate `calories` for each item based on portion_grams and typical calories_per_100g
    - Set `total_calories` to the sum of all item calories
    - Set `calorie_target` to the {{calorieTarget}} value
    ```

    Preserve everything else (Role, User Profile, Available Foods, Recent Food Logs sections).
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const p=fs.readFileSync('backend/prompts/daily-meal-plan-prompt.md','utf8'); console.assert(p.includes('total_calories'), 'total_calories missing'); console.assert(p.includes('calorie_target'), 'calorie_target missing'); console.assert(p.includes('\"calories\"'), 'calories field missing'); console.assert(p.includes('\"logged\"'), 'logged field missing'); console.assert(p.includes('protein'), 'macro guidance missing'); console.assert(p.includes('calories_per_100g'), 'cal/100g reference missing'); console.log('daily-meal-plan-prompt.md OK');"</automated>
  </verify>
  <done>
    daily-meal-plan-prompt.md has:
    - `total_calories` and `calorie_target` in response format
    - `calories` and `logged: false` per item
    - Macro-balance guidance (protein/carbs/fat split)
    - Food variety constraint (no same food across meals)
    - Exemplar output block
    - Portion realism guidance
  </done>
</task>

</tasks>

<verification>
1. Run the automated verify checks above
2. Review each file once to confirm all template variables are intact
3. Check that `callLlmApi` in `activityPlan.service.js` still works — the `buildPrompt` call receives the same variables plus `calorieTarget` and `topNames` which are backward-compatible (empty string fallback)
</verification>

<success_criteria>
- Activity plan prompt includes calorie target context, proper response fields (logged, calories_burned), and an exemplar
- Top activity names are now computed from history instead of empty string
- Meal plan prompt includes total_calories, per-item calories, logged field, macro guidance, variety constraint, and an exemplar
- All existing template variables preserved (backward-compatible)
- Existing tests in `backend/tests/` still pass (run `npx jest backend/tests/unit/llm.service.test.js` and `npx jest backend/tests/unit/activityPlan*`)
</success_criteria>

<output>
After completion, create `.planning/quick/260531-hqs-improve-llm-prompts/260531-hqs-SUMMARY.md`
</output>
