---
type: quick
description: Update all documentation to reflect completed cleanup of legacy meal_plans system and v1.5 state
created: 2026-05-31
tasks: 3
context_estimate: 35%
---

# Plan: Update All Documentation

## Objective

Update all stale project documentation to reflect the completed cleanup of the legacy `meal_plans` system and the shipped v1.5 Smart Auto-Logging milestone.

## What Changed

1. **Legacy meal_plans system deleted** — Backend service/controller/repository/routes/rate limiter removed, frontend meal-plan feature directory deleted, route removed from app.js, nav link removed from Router.jsx
2. **Utilities moved** — `fuzzyMatchFoodName` and `recalculateDayCalories` moved from `mealPlan.service.js` to `backend/src/utils/food.js`
3. **Tests relocated** — mealPlan.service.test.js tests moved to food.utils.test.js (7 tests, all pass)
4. **Weekly plan route** (`/weekly-plan`) still exists and is active — only the **meal plan routes** (`/meal-plan`) were removed

## Documents to Update

| Document | Issue | Fix |
|----------|-------|-----|
| `STATE.md` | Line 79 says "Old `/weekly-plan` and `/meal-plan` routes still active" | Remove /meal-plan from note, clarify /weekly-plan still exists |
| `PROJECT.md` | Current State still says "v1.4 LLM Food Recommendations", phase/plan counts stale | Update to v1.5 shipped, correct phase/plan counts |
| `backend/docs/API.md` | Section 9 documents deleted `/api/meal-plans` routes; duplicate Section 6; rate limit table references old Meal Plans group | Remove Section 9, fix duplicate, update rate limit table |
| `.planning/codebase/ARCHITECTURE.md` | Lines 47-60 describe old meal_plans API flow that no longer exists | Update to describe current daily_meal_plans flow |

---

## Task 1: Update STATE.md and PROJECT.md

**Files:**
- `.planning/STATE.md`
- `.planning/PROJECT.md`

**Action:**

### STATE.md changes

1. **Update line 79** — Replace the stale note about old routes. The `/meal-plan` routes have been removed entirely. The `/weekly-plan` route for activity plans still exists and is active.

   Replace:
   ```
   - Old `/weekly-plan` and `/meal-plan` routes still active (no redirect configured) — consistent with "keep read-compatible for archive" design
   ```
   With:
   ```
   - Legacy `/api/meal-plans` routes removed (backend service/controller/repository/routes/rate limiter deleted, frontend meal-plan feature directory deleted, nav link removed)
   - `/weekly-plan` route still active for LLM activity plans
   - `daily_meal_plans` and `activity_plans` handle all new plan generation
   ```

2. **Update `total_plans`** — Currently says 68. v1.5 had 6 plans (24-29), so if the previous count was 62 (v1.0-v1.4), that's correct at 68. Confirm it matches.

### PROJECT.md changes

1. **Line 13** — Update "Shipped: v1.4 LLM Food Recommendations" to "Shipped: v1.5 Smart Auto-Logging"

2. **Line 14** — Update phase/plan counts: phases from 23 → 29, plans from 62 → 68

3. **Lines 15-19** — Add v1.5 shipped summary under the v1.3 section

4. **`Last updated`** at bottom — Update date

**Verify:**
- `grep -c "Old.*/meal-plan.*routes" .planning/STATE.md` returns 0 (no stale reference)
- `grep "Shipped:" .planning/PROJECT.md` shows v1.5
- `grep "completed_phases" .planning/STATE.md` still shows correct value

**Done:**
- STATE.md no longer claims old meal-plan routes are active
- PROJECT.md current state reflects v1.5 shipped

---

## Task 2: Update backend/docs/API.md — Remove Stale Content, Fix Duplicates

**Files:**
- `backend/docs/API.md`

**Action:**

1. **Remove Section 9 (Meal Plans — `/api/meal-plans`)** — Lines 913-1120 inclusive. This documents the legacy 7-day meal plans API that has been deleted (no routes, controllers, services, or repository exist for it). Remove from `---` separator at line 913 through the end of log-day section at line 1120.

2. **Fix duplicate Section 6** — Lines 648-672 and 674-698 are identical "Documentation" sections. Remove the first occurrence (lines 648-672), keeping the second one (lines 674-698) which has the more complete description including "activity logging, LLM weekly plans, LLM meal recommendations."

3. **Update Rate Limiting table (line 56)** — The row "Meal Plans | 5/15, 3/30, 30/15 | Meal plan endpoints (see Section 9)" references a deleted section. Replace with:
   ```
   | Daily Meal Plans | 5 per 15 minutes | `/api/daily-meal-plans/generate` |
   | Activity Plans   | 5 per 15 minutes | `/api/activity-plans/generate`   |
   ```
   
   Also update the description above the table (lines 47-49) to remove the reference to "Section 9" if present.

4. **Update Section 8 heading** — Change `### 8. Weekly Plans (LLM) — /api/weekly-plans` to `### 8. Weekly Plans (LLM) — /api/weekly-plans` (keep it, just ensure numbering is correct after removal).

5. **Renumber sections** — After removing Section 9, the numbering should be:
   - 1-7: unchanged
   - 8: Weekly Plans (currently section 8 — stays)
   - 9: (removed — old Meal Plans)
   - Add new sections for the v1.5 APIs at the end (after the end of section 8):

   **New Section 9: Daily Meal Plans — `/api/daily-meal-plans`**
   
   After the last line of Section 8 (line 1184), add:
   
   ```
   
   ---
   
   ### 9. Daily Meal Plans — `/api/daily-meal-plans`
   
   All daily meal plan endpoints require authentication.
   
   **Rate Limiters:**
   
   | Group              | Limit              | Applied To                              |
   |--------------------|--------------------|-----------------------------------------|
   | Daily Meal Generate | 5 per 15 minutes  | `POST /api/daily-meal-plans/generate`  |
   
   #### GET /api/daily-meal-plans
   
   - **Auth:** Required
   - **Rate Limit:** Global
   - **Description:** Retrieve the current daily meal plan. Checks in-memory cache first, then falls back to the `daily_meal_plans` database table.
   - **Query Parameters:**
     - `date` (optional): Format `YYYY-MM-DD`. Defaults to today.
   - **Response 200 (cached):**
     ```json
     {
       "success": true,
       "data": {
         "plan": {
           "date": "2026-05-31",
           "meals": [
             {
               "meal_type": "breakfast",
               "items": [
                 { "food_id": 1, "food_name": "Oatmeal", "portion_grams": 200, "calories": 190 }
               ],
               "total_calories": 190,
               "logged": false
             }
           ],
           "total_calories": 1950,
           "calorie_target": 2000,
           "generated_at": "2026-05-31T12:00:00.000Z",
           "llm_model": "deepseek/deepseek-chat:free"
         },
         "fromCache": true
       }
     }
     ```
   - **Response 200 (no plan):**
     ```json
     {
       "success": true,
       "data": {
         "plan": null,
         "fromCache": false
       }
     }
     ```
   - **Error Codes:** `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401)
   
   #### POST /api/daily-meal-plans/generate
   
   - **Auth:** Required
   - **Rate Limit:** Daily Meal Generate (5 per 15 minutes)
   - **Description:** Generate a 1-day meal plan using LLM (OpenRouter). Contains 4 meals (breakfast, lunch, dinner, snack) with items selected from the existing food database. Portions auto-calculated to meet the user's calorie target. Supports per-meal regenerate.
   - **Request Body:**
     ```json
     {
       "date": "2026-05-31"
     }
     ```
   - **Notes:** `date` is optional. Defaults to today.
   - **Response 200:**
     ```json
     {
       "success": true,
       "data": {
         "plan": {
           "date": "2026-05-31",
           "meals": [ ... ],
           "total_calories": 1950,
           "calorie_target": 2000,
           "generated_at": "2026-05-31T12:00:00.000Z"
         },
         "fromCache": false
       }
     }
     ```
   - **Error Codes:** `VALIDATION_ERROR` (400), `RATE_LIMITED` (429), `AUTHENTICATION_ERROR` (401)
   
   #### POST /api/daily-meal-plans/log
   
   - **Auth:** Required
   - **Rate Limit:** Global
   - **Description:** Log all meal items from the current daily meal plan to the food log. Uses an explicit database transaction for atomicity. Items with `logged: true` are skipped (idempotent).
   - **Request Body:**
     ```json
     {
       "date": "2026-05-31",
       "mealType": "lunch"
     }
     ```
   - **Notes:** `date` defaults to today. `mealType` is optional; if omitted, all meals for the day are logged.
   - **Response 200:**
     ```json
     {
       "success": true,
       "data": {
         "logged": 3,
         "items": [ ... ]
       }
     }
     ```
   - **Error Codes:** `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `AUTHENTICATION_ERROR` (401)

   **New Section 10: Activity Plans — `/api/activity-plans`**
   
   ```
   
   ---
   
   ### 10. Activity Plans — `/api/activity-plans`
   
   All activity plan endpoints require authentication.
   
   #### GET /api/activity-plans
   
   - **Auth:** Required
   - **Rate Limit:** Global
   - **Description:** Retrieve the current activity plan. Checks in-memory cache first, then falls back to the `activity_plans` database table.
   - **Query Parameters:**
     - `date` (optional): Format `YYYY-MM-DD`. Defaults to today.
   - **Response 200 (cached):**
     ```json
     {
       "success": true,
       "data": {
         "plan": {
           "date": "2026-05-31",
           "activities": [
             {
               "name": "Brisk Walking",
               "duration_min": 30,
               "intensity": "moderate",
               "calories_burned": 165,
               "category": "Cardio",
               "logged": false
             }
           ],
           "total_calories_burned": 330,
           "total_minutes": 60,
           "generated_at": "2026-05-31T12:00:00.000Z"
         },
         "fromCache": true
       }
     }
     ```
   - **Response 200 (no plan):**
     ```json
     {
       "success": true,
       "data": {
         "plan": null,
         "fromCache": false
       }
     }
     ```
   - **Error Codes:** `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401)
   
   #### POST /api/activity-plans/generate
   
   - **Auth:** Required
   - **Rate Limit:** Global
   - **Description:** Generate an activity plan for a given date using LLM (OpenRouter). Plan is personalized based on user profile, fitness goal, and activity history.
   - **Request Body:**
     ```json
     {
       "date": "2026-05-31"
     }
     ```
   - **Notes:** `date` is optional. Defaults to today.
   - **Response 200:**
     ```json
     {
       "success": true,
       "data": {
         "plan": {
           "date": "2026-05-31",
           "activities": [ ... ],
           "total_calories_burned": 330,
           "total_minutes": 60,
           "generated_at": "2026-05-31T12:00:00.000Z"
         },
         "fromCache": false
       }
     }
     ```
   - **Error Codes:** `VALIDATION_ERROR` (400), `RATE_LIMITED` (429), `AUTHENTICATION_ERROR` (401)
   
   #### POST /api/activity-plans/log-activities
   
   - **Auth:** Required
   - **Rate Limit:** Global
   - **Description:** Log all activities from the plan to the activity log. Uses an explicit database transaction for atomicity. Items with `logged: true` are skipped (idempotent).
   - **Request Body:**
     ```json
     {
       "date": "2026-05-31"
     }
     ```
   - **Response 200:**
     ```json
     {
       "success": true,
       "data": {
         "logged": 3,
         "items": [ ... ]
       }
     }
     ```
   - **Error Codes:** `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401)
   ```

**Verify:**
- `grep -c "Meal Plans (LLM)" backend/docs/API.md` returns 0 (Section 9 removed)
- `grep -c "Duplicate"` shouldn't appear; grep for section 6 heading count = 1
- Rate limit table no longer references "Meal Plans" section 9
- New Section 9 (Daily Meal Plans) and Section 10 (Activity Plans) are present

**Done:**
- Old Meal Plans API documentation removed
- Duplicate removed
- Rate limit table updated
- Daily Meal Plans and Activity Plans documented

---

## Task 3: Update codebase ARCHITECTURE.md

**Files:**
- `.planning/codebase/ARCHITECTURE.md`

**Action:**

The current "Meal Plan Generation (LLM)" section (lines 47-60) describes the old `/api/meal-plans` flow which no longer exists. Replace it with the current daily meal plan flow:

Replace the entire section starting from line 47 (`### Meal Plan Generation (LLM)`) through line 60 with the updated version:

```markdown
### Daily Meal Plan Generation (LLM)
1. User visits `/food-log` page → frontend auto-triggers `GET /api/daily-meal-plans?date=today`
2. If no plan exists (`plan: null`), frontend auto-triggers `POST /api/daily-meal-plans/generate`
3. Controller fetches user profile (calorie target), food database (up to 200 ingredients), and food log history
4. `dailyMealPlan.service.js` builds a 1-day meal prompt via `buildPrompt('daily-mp-prompt.md')`
5. OpenAI SDK sends chat completion to OpenRouter API with correction loop:
   - Attempt 1: Generate → validate structure (1 day × 4 meals, dates, 1-4 items/meal) → validate food names
   - Attempt 2: Correction prompt with specific errors → if still fails, fall back to template
6. Fuzzy matching cascade (in `food.js` from phase 29 cleanup): exact match → case-insensitive/substring → Levenshtein distance ≤ 3
7. Server-authoritative calorie recalculation via `recalculateDayCalories()` in `food.js` utility
8. Valid plan is upserted to `daily_meal_plans` table (JSONB) AND cached in-memory via node-cache
9. GET `/api/daily-meal-plans` reads from cache first, then falls back to DB
10. POST `/api/daily-meal-plans/log` batch-logs meal items to `food_logs` using transaction
11. Legacy `meal_plans` table remains untouched (read-compatible for archive); all new writes go to `daily_meal_plans`

### Activity Plan Generation (LLM)
1. User visits `/activities` page → frontend auto-triggers `GET /api/activity-plans?date=today`
2. If no plan exists, frontend auto-triggers `POST /api/activity-plans/generate`
3. Controller fetches user profile, activity history (30 days), and available activities
4. `activityPlan.service.js` builds a prompt for a single-day activity plan
5. Plan is upserted to `activity_plans` table (JSONB) AND cached in-memory
6. POST `/api/activity-plans/log-activities` batch-logs plan items to `activity_logs`
```

**Verify:**
- `grep "mealPlan.service.js" .planning/codebase/ARCHITECTURE.md` returns 0
- `grep "dailyMealPlan" .planning/codebase/ARCHITECTURE.md` returns non-zero
- `grep "activityPlan" .planning/codebase/ARCHITECTURE.md` returns non-zero

**Done:**
- ARCHITECTURE.md describes current daily meal plan flow, not the old 7-day API
- Activity plan generation flow documented
- No references to deleted `mealPlan.service.js` or old `/api/meal-plans` API

---

## Wave Structure

Single wave — all three tasks are independent file edits with no file overlap:

| Task | Files | Can Parallel? |
|------|-------|---------------|
| 1 | `.planning/STATE.md`, `.planning/PROJECT.md` | Yes (no overlap with 2 or 3) |
| 2 | `backend/docs/API.md` | Yes |
| 3 | `.planning/codebase/ARCHITECTURE.md` | Yes |

All tasks can execute simultaneously in Wave 1.
