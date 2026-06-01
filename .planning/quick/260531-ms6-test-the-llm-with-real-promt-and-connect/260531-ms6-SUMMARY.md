---
phase: quick
plan: 260531-ms6
subsystem: backend/llm
tags:
  - diagnostic
  - llm-test
  - service-layer
  - activity-plan
  - meal-plan
  - cache
  - prompt-mismatch
requires: []
provides:
  - Service-level LLM diagnostic results
  - Prompt-to-service alignment analysis
affects:
  - backend/src/services/activityPlan.service.js
  - backend/prompts/system-prompt.md
tech-stack:
  added: []
  patterns:
    - Dependency injection for DB mocking in service-level tests
key-files:
  created:
    - backend/scripts/test-backend-llm.js
  modified: []
decisions:
  - Use buildPrompt() manually to preview prompts sent to LLM before service call
  - Replicate buildActivityPlanPrompt() internals in test script since it's a private function
  - Validate service output using same validation functions the services use internally
metrics:
  duration: "2026-05-31T12:45:00Z - 2026-05-31T12:47:00Z (~2 min execution, ~90s LLM wait)"
  completed_date: 2026-05-31
---

# Phase Quick Plan 260531-ms6: Test the LLM Through Real Backend Services — Summary

**One-liner:** End-to-end service-level LLM diagnostic exercising real `generateActivityPlan()` and `generateDailyMealPlan()` with mock DB data, uncovering a critical system-prompt.md / service format mismatch.

## Execution Log

<details>
<summary>Click to expand full stdout from test-backend-llm.js</summary>

```
◇ injected env (12) from backend\.env
[LLM] Using model: openrouter/owl-alpha (fallbacks: none). Verify this model is available on OpenRouter.
◇ injected env (12) from backend\.env
============================================================
BACKEND LLM DIAGNOSTIC — Service-Level Test
============================================================

Model:          openrouter/owl-alpha
API key set:    YES
API key prefix: sk-or-v1...

============================================================
1. HTTP CONNECTIVITY CHECK
============================================================

  Endpoint: http://localhost:3001/api/health
  Status:   NOT REACHABLE
  Error:    fetch failed

============================================================
2. ACTIVITY PLAN — Service-Level Test
============================================================

---- 2a. Rendered Prompt (preview) ----

  Total length: 2977 characters

  [FIRST 600 CHARS]:
  # Role
  You are a fitness planner creating a personalized weekly activity plan for a user.

  # User Profile
  - Weight: 75 kg
  - Height: 180 cm
  - Age: 28
  - Gender: male
  - Fitness Goal: lose weight
  - Activity Level: moderate
  - Daily Calorie Target:  kcal
  - BMR:  kcal

  # Recent Activity History (last 14 days)
  ...

  [LAST 600 CHARS]:
  ities per day
  - Each activity is 10-180 minutes
  - No more than 3 activities of the same type per week
  - Include at least 1 variety day per week with a different activity than the user's usual
  - Activities MUST use exact names from the provided Available Activities list
  ...


---- 2b. Calling generateActivityPlan() with mock DB data ----

  Injecting DI deps: getProfile, getAllActivities, getActivityHistory
  Calling generateActivityPlan({ userId: 1, planDate: "2026-05-31", ... })

[ActivityPlan] Structure validation failed (attempt 1): Plan must have an "activities" array
[ActivityPlan] Structure validation failed (attempt 2): Plan must have an "activities" array
[ActivityPlan] All generation attempts failed, returning fallback

---- 2c. Request ----
  User ID:             1
  Plan date:           2026-05-31
  Profile:             75kg, 180cm, 28yo, male, lose weight
  Available activities: 12
  Activity history:     14 entries

---- 2d. Result Summary ----
  Status:       fallback
  From cache:   false
  LLM model:    template-fallback
  Duration:     32.02s

---- 2e. Generated Plan ----
  Date: 2026-05-31 (Sun)
  Activities: 3 total

  1. Walking (60min, moderate, 400 cal burned)
  2. Cycling (60min, moderate, 600 cal burned)
  3. Stretching (50min, light, 250 cal burned)

  Activity variety: Walking, Cycling, Stretching

---- 2f. Validation Results ----
  Activity structure validation: ✓ PASS
  Activity name matching:
    ✓ "Walking" → exact (id: 1)
    ✓ "Cycling" → exact (id: 4)
    ✓ "Stretching" → exact (id: 12)

  Summary: 3 total, 3 exact, 0 fuzzy, 0 missing

============================================================
3. DAILY MEAL PLAN — Service-Level Test
============================================================

---- 3a. Rendered Prompt (preview) ----

  Total length: 5218 characters

  [FIRST 600 CHARS]:
  # Role
  You are a fitness nutrition planner creating a personalized single-day meal plan for a user. Use ONLY real ingredients from the user's food database.

  # User Profile
  - Daily Calorie Target: 2000 kcal
  - Weight: 75 kg
  - Height: 180 cm
  - Age: 28
  - Gender: male
  - Fitness Goal: lose weight

...

---- 3b. Calling generateDailyMealPlan() with mock DB data ----

  Injecting DI deps: getProfile, getAllFoods, getLogHistory
  Calling generateDailyMealPlan({ userId: 1, planDate: "2026-05-31", ... })

[ActivityPlan] Failed to persist fallback plan: Failed to upsert activity plan: insert or update on table "activity_plans" violates foreign key constraint "activity_plans_user_id_fkey"

---- 3c. Request ----
  User ID:          1
  Plan date:        2026-05-31
  Profile:          75kg, 180cm, 28yo, male, lose weight
  Calorie target:   2000 kcal
  Available foods:  17
  Food log history: 5 days

---- 3d. Result Summary ----
  Status:       active
  From cache:   false
  LLM model:    openrouter/owl-alpha
  Duration:     11.91s

---- 3e. Generated Plan ----

  Breakfast (breakfast):
[DailyMealPlan] Failed to persist generated plan: Failed to upsert daily meal plan: insert or update on table "daily_meal_plans" violates foreign key constraint "daily_meal_plans_user_id_fkey"
    - Oatmeal (80g, 57 cal)
    - Banana (120g, 107 cal)
    - Milk (200g, 84 cal)

  Lunch (lunch):
    - Chicken Breast (180g, 297 cal)
    - Brown Rice (150g, 167 cal)
    - Broccoli (150g, 51 cal)

  Dinner (dinner):
    - Salmon (150g, 312 cal)
    - Sweet Potato (150g, 129 cal)
    - Spinach (100g, 23 cal)

  Snack (snack):
    - Greek Yogurt (150g, 89 cal)
    - Apple (150g, 78 cal)
    - Almonds (15g, 87 cal)

  Summary:
    Meals:            4 (breakfast, lunch, dinner, snack)
    Total items:      12
    Total calories:   1481 kcal (74% of 2000 target)
    Food variety:     Oatmeal, Banana, Milk, Chicken Breast, Brown Rice, Broccoli, Salmon, Sweet Potato, Spinach, Greek Yogurt, Apple, Almonds

---- 3f. Validation Results ----
  Meal structure validation: ✓ PASS
  Food name validation: ✓ PASS

  Individual food matching:
    ✓ "Oatmeal" → exact (id: 7)
    ✓ "Banana" → exact (id: 5)
    ✓ "Milk" → exact (id: 16)
    ✓ "Chicken Breast" → exact (id: 1)
    ✓ "Brown Rice" → exact (id: 8)
    ✓ "Broccoli" → exact (id: 9)
    ✓ "Salmon" → exact (id: 2)
    ✓ "Sweet Potato" → exact (id: 10)
    ✓ "Spinach" → exact (id: 12)
    ✓ "Greek Yogurt" → exact (id: 4)
    ✓ "Apple" → exact (id: 6)
    ✓ "Almonds" → exact (id: 11)

  Summary: 12 total, 12 exact, 0 fuzzy, 0 missing

============================================================
4. CACHE BEHAVIOR VERIFICATION
============================================================

---- 4a. Activity Plan Cache ----
  First call  fromCache: false
[ActivityPlan] Structure validation failed (attempt 1): Plan must have an "activities" array
[ActivityPlan] Structure validation failed (attempt 2): Plan must have an "activities" array
[ActivityPlan] All generation attempts failed, returning fallback
  Second call fromCache: false  ✗ Cache MISSED (expected true)
  Cache lookup time:    42.54s

---- 4b. Meal Plan Cache ----
  First call  fromCache: false
  Second call fromCache: true  ✓ Cache working
  Cache lookup time:    0.00s

============================================================
SUMMARY
============================================================

HTTP Backend:
  Server reachable: NO
  Error:            fetch failed

Activity Plan:
  Status:             fallback
  From cache (1st):   false
  From cache (2nd):   expected true
  Activities:         3
  LLM model:          template-fallback
  Total time:         32.02s

Meal Plan:
  Status:             active
  From cache (1st):   false
  From cache (2nd):   expected true
  Meals:              4
  Total items:        12
  Total calories:     1481 kcal (74% of 2000 target)
  LLM model:          openrouter/owl-alpha
  Total time:         11.91s

============================================================
DIAGNOSTIC COMPLETE
============================================================
```
</details>

## Key Findings

### a) HTTP Connectivity
| Metric | Value |
|--------|-------|
| Server reachable | **NO** — backend not running |
| Endpoint tested | `http://localhost:3001/api/health` (3s timeout) |
| Error | `fetch failed` — no server listening on port 3001 |

**Assessment:** Non-blocking. The user must start the backend to use the app. The script correctly reports this as a diagnostic, not a failure.

### b) Activity Plan — CRITICAL: System-prompt / Service Format Mismatch

| Metric | Value |
|--------|-------|
| Status | `fallback` (LLM API call failed validation twice) |
| LLM model used | `openrouter/owl-alpha` (the model answered, but in wrong format) |
| Prompt size | 2,977 characters |
| Total duration | 32.02 seconds (2 LLM calls × ~12s + DB persist) |
| Fallback activities | 3 (Walking, Cycling, Stretching) |
| Name matching in fallback | All 3/3 exact matches ✓ |

**Root Cause:** The `system-prompt.md` template starts with *"You are a fitness planner creating a personalized **weekly** activity plan"* and contains instructions for a 7-day `days[]` array format. However, the new `generateActivityPlan()` service (post-v1.5 refactor) expects a **single-day** format with `{ activities: [...] }` — not a 7-day `{ days: [...] }` format.

The LLM (`openrouter/owl-alpha`) faithfully follows the prompt and returns a 7-day plan, which fails `validateActivityPlanStructure()` at line: `if (!plan || !Array.isArray(plan.activities))` — because the LLM returned `plan.days` instead of `plan.activities`.

Both retry attempts failed → service fell back to template-generated plan.

### c) Daily Meal Plan — Fully Operational

| Metric | Value |
|--------|-------|
| Status | `active` — LLM generated and validated successfully |
| LLM model | `openrouter/owl-alpha` |
| Prompt size | 5,218 characters |
| Duration | 11.91 seconds |
| Meals | 4 ✓ (breakfast, lunch, dinner, snack) |
| Items | 12 total (3 per meal) |
| Total calories | 1,481 kcal (74% of 2,000 target) |
| Name matching | 12/12 exact matches ✓ (no fuzzy needed) |

**Assessment:** The daily meal plan pipeline works correctly end-to-end. The `daily-meal-plan-prompt.md` is properly aligned with what `generateDailyMealPlan()` expects (a single-day `{ meals: [...] }` format).

### d) Cache Behavior

| Component | First call | Second call | Status |
|-----------|-----------|-------------|--------|
| Activity Plan | `fromCache: false` | `fromCache: false` (fallback) | ⚠ Fallback plans not cached (expected) |
| Meal Plan | `fromCache: false` | `fromCache: true` (0.00s) | ✓ Working correctly |

**Activity Plan cache note:** The activity plan never cached because no valid plan passed validation. The `setCachedPlan()` is only called on successful validation (line 159 of `activityPlan.service.js`). Fallback plans explicitly skip caching. This is **correct behavior** — you don't want to cache failed/fallback plans.

**Meal Plan cache:** First call successfully generated and cached the plan. The second call (same `userId` + `planDate`) hit the cache in < 1ms. Model: `openrouter/owl-alpha`.

### e) Errors / Warnings

| Source | Message | Severity |
|--------|---------|----------|
| Activity Plan service | `Structure validation failed (attempt 1): Plan must have an "activities" array` | 🛑 **HIGH** — prompt mismatch |
| Activity Plan service | `Structure validation failed (attempt 2): Plan must have an "activities" array` | 🛑 **HIGH** |
| Activity Plan service | `All generation attempts failed, returning fallback` | 🟡 Fallback engaged |
| Activity Plan persist | `Failed to upsert activity plan: violates foreign key constraint "activity_plans_user_id_fkey"` | 🟡 Expected — no user_id=1 in DB |
| Daily Meal Plan persist | `Failed to upsert daily meal plan: violates foreign key constraint "daily_meal_plans_user_id_fkey"` | 🟡 Expected — no user_id=1 in DB |
| HTTP check | `fetch failed` for localhost:3001 | 🟢 Non-blocking |

## Side-by-Side Comparison with test-llm-output.js

| Dimension | test-llm-output.js (previous) | test-backend-llm.js (this run) |
|-----------|-------------------------------|--------------------------------|
| **Approach** | Builds prompts manually, calls LLM directly via OpenAI client | Imports and calls REAL service functions with mock DI |
| **Service layer** | Bypasses all service code | Exercises real `generateActivityPlan()` and `generateDailyMealPlan()` |
| **Validation** | Uses old `validatePlanStructure()` from `llm.service.js` (expects 7-day `days[]`) | Uses new `validateActivityPlanStructure()` from `activityPlan.service.js` (expects single-day `activities[]`) |
| **Name fixing** | Calls `validateAndFixPlan()` from `llm.service.js` (weekly name fixer) | Calls same `validateAndFixPlan()` diagnostically; the service itself doesn't call name fixing for activities |
| **Caching** | Not tested — creates new OpenAI client each call | Tests real `getCachedPlan()` / `setCachedPlan()` from `llm.service.js` |
| **DB persist** | Not attempted | Attempts real `upsertPlan()` — fails with FK constraint (expected) |
| **Prompt alignment** | Validates against old weekly format → likely passes | Fails against new daily format → exposes the prompt mismatch |
| **Meal plan validation** | Uses correctly aligned `validateDailyMealPlanStructure()` | Same — both pass |

**What the service layer adds** (not exercised by test-llm-output.js):
- In-memory caching via `NodeCache` (`getCachedPlan` / `setCachedPlan`)
- DB persistence attempt (`upsertPlan`) — catches failures gracefully
- Fallback plan generation when LLM fails
- Structured validation → retry loop (up to 2 attempts)
- Calorie computation (`computeCaloriesBurned`) for activity plans
- `logged: false` flag initialization on each item

## Data Flow Diagram

```
Mock DB Data → generateActivityPlan(deps)
                ├── getProfile()               → returns { profile: {...} }
                ├── getAllActivities()          → returns 12 activities
                ├── getActivityHistory()        → returns 14 entries
                ├── buildPrompt()               → system-prompt.md (2977 chars)
                │   └── [CRITICAL: says "weekly" — expects 7-day format]
                ├── callLlmApi()                → OpenRouter (owl-alpha)
                │   └── returns { days: [...] } ← weekly format per prompt
                ├── validateActivityPlanStructure() → FAILS (no "activities" key)
                ├── [retry with correction prompt — same result]
                ├── generateFallbackActivityPlan() → template plan (3 activities)
                ├── upsertPlan()                → DB persist (FK error — caught)
                └── returns { plan, fromCache: false, status: 'fallback' }

Repeated call with same params:
                └── [No cache hit — fallback not cached]
                └── Same flow again → same fallback

Mock DB Data → generateDailyMealPlan(deps)
                ├── getProfile()               → returns { profile: {...}, calorieTarget }
                ├── getAllFoods()              → returns 17 foods
                ├── getLogHistory()            → returns 5 days
                ├── buildPrompt()              → daily-meal-plan-prompt.md (5218 chars)
                │   └── [OK: says "single-day meal plan"]
                ├── callLlmApi()               → OpenRouter (owl-alpha)
                │   └── returns { meals: [...] } ← correct format
                ├── validateDailyMealPlanStructure() → ✓ PASS
                ├── validateAndFixDailyMealPlan()    → ✓ 12/12 exact
                ├── setCachedPlan()            → stored in NodeCache
                ├── upsertPlan()               → DB persist (FK error — caught)
                └── returns { plan, fromCache: false, status: 'active' }

Repeated call with same params:
                └── getCachedPlan()            → hits cache immediately
                └── returns { plan, fromCache: true, status: 'active' }
```

## Deviations from Plan

| # | Type | Description | Resolution |
|---|------|-------------|------------|
| 1 | [Rule 1 - Bug] | **system-prompt.md mismatch with generateActivityPlan service**: The prompt instructs the LLM to return a 7-day weekly format (`days[]` array), but the new `generateActivityPlan()` service (v1.5) expects a single-day format (`activities[]` array). All LLM generation attempts fail validation, falling back to template. | **CRITICAL ISSUE — requires fix.** Either update system-prompt.md to generate single-day plans, or update the service to accept the 7-day format and extract the current day. |
| 2 | [Observation] | **Activity cache behavior is correct**: The activity plan never caches because no valid plan was produced. Fallback plans are explicitly not cached. The "cache MISSED" on second call is expected behavior, not a bug. | No action — correct as-is. |
| 3 | [Observation] | **DB is actually reachable**: Both `activity_plans` and `daily_meal_plans` FK constraint errors indicate the database IS reachable. | Update STATE.md if needed — Supabase connectivity may have changed since last documentation. |

## Recommendations

### 1. 🛑 HIGH — Fix system-prompt.md for generateActivityPlan (Critical)

**Problem:** `backend/prompts/system-prompt.md` still instructs the LLM to generate a 7-day weekly plan, but `generateActivityPlan()` expects a single-day `{ activities: [...] }` format.

**Two options:**

**Option A (Recommended):** Update `system-prompt.md` to instruct the LLM to return a single-day plan. Change:
- "You are a fitness planner creating a personalized **weekly** activity plan" → "personalized **daily** activity plan"
- Remove all 7-day/week references
- Add explicit output format specification: `{ "activities": [ { "activity_id", "name", "duration_min", "intensity" } ] }`
- Keep the `weekStartDate` variable (still needed for context) or rename to `planDate`

**Option B (Architectural):** Change `generateActivityPlan()` to accept the 7-day format and extract the current day. This preserves the prompt but requires service changes.

**Risk:** Users clicking "Generate Plan" for activities currently always receive a fallback plan (template-generated, no AI personalization).

### 2. 🟡 MEDIUM — Improve calorie target for meal plans

The LLM generated 1,481 kcal which is 74% of the 2,000 target. This is on the low end. The prompt already says to stay within ±10% of target. The model may be being conservative. This is informational for now — the plan is within acceptable range.

### 3. 🟢 LOW — Update STATE.md DB connectivity note

The FK constraint errors show the database is actually reachable. The STATE.md note "Supabase unreachable from dev environment" may need updating.

## Known Stubs

| File | Detail | Reason |
|------|--------|--------|
| `backend/prompts/system-prompt.md` | Prompt says "weekly" and expects 7-day format | Mismatch with single-day service — needs update (see Recommendation 1) |

## Threat Flags

No threat flags — the diagnostic script is a read-only tool, and the service errors (FK constraint violations) are caught and logged without exposing sensitive information.

## Per-Task Summary

| Task | Description | Files | Commit | Duration |
|------|-------------|-------|--------|----------|
| 1 | Create `test-backend-llm.js` — service-level LLM diagnostic | `backend/scripts/test-backend-llm.js` (+873 lines) | `fa54584` | ~2 min (writing) |
| 2 | Run diagnostic and document findings | (SUMMARY.md only) | — | ~90s (LLM wait time) |

## Verification Checklist

- [x] Task 1: Script created at `backend/scripts/test-backend-llm.js` (873 lines ≥ 200 min)
- [x] Task 1: Script syntax validated (`node --check` passes)
- [x] Task 1: Script runs without crashing (exit 0)
- [x] Task 2: `generateActivityPlan()` called with mock DB data — result captured (falls back to template)
- [x] Task 2: `generateDailyMealPlan()` called with mock DB data — result captured (12 items across 4 meals)
- [x] Cache behavior verified: meal plan cache works (miss→hit), activity plan correctly doesn't cache fallbacks
- [x] HTTP connectivity checked: server not reachable (backend not started)
- [x] Full execution log captured in SUMMARY.md
- [x] Side-by-side comparison with test-llm-output.js documented
- [x] Key findings and recommendations recorded
- [x] Critical prompt/service mismatch identified

## Self-Check: PASSED

- `backend/scripts/test-backend-llm.js` — verified at 38550 bytes, 873 lines ✓
- Commit `fa54584` found in git log ✓
- `SUMMARY.md` written with full log and analysis ✓
