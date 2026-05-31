# Architecture: LLM Food Recommendations

**Project:** Fitness_App — v1.4 LLM Food Recommendations
**Researched:** 2026-05-31
**Mode:** Integration architecture for NEW feature within EXISTING system

## Executive Summary

This feature adds LLM-powered daily meal recommendations to the existing Fitness_App. The architecture follows the established pattern from v1.3's LLM activity plans (weeklyPlan controller → llm.service → prompt files → caching → rate limiting) with three major additions: (1) a new `meal_plans` database table mirroring `weekly_plans`, (2) a batch food-logging endpoint for one-click log of LLM-recommended meals, and (3) domain-specific prompt engineering that constrains the LLM to use ingredients exclusively from the existing 200+ food database with portions calculated to hit the user's calorie target.

The feature is **not a new service** — it extends the existing `llm.service.js` with meal-plan-specific generation functions and adds a new `mealPlan.controller.js` following the weekly plan pattern exactly.

## Data Flow

### Generation Flow

```
User (React)                          Backend                              LLM
    │                                    │                                   │
    │  POST /api/meal-plans/generate     │                                   │
    │  { weekStart }                     │                                   │
    │ ─────────────────────────────►     │                                   │
    │                                    │  Check in-memory cache            │
    │                                    │  (hit → return cached plan)       │
    │                                    │                                   │
    │                                    │  Fetch dependencies in parallel:  │
    │                                    │  ├─ getUserProfile(userId)        │
    │                                    │  ├─ getUserFoods(userId)          │
    │                                    │  │  (seeded + user's custom)      │
    │                                    │  └─ getDailySummary(days=7)       │
    │                                    │      (recent eating history)      │
    │                                    │                                   │
    │                                    │  Build prompt:                    │
    │                                    │  ├─ system role + profile         │
    │                                    │  ├─ calorie target                │
    │                                    │  ├─ FULL food list (ID, name,     │
    │                                    │  │   cal/100g, category)          │
    │                                    │  └─ meal structure constraints    │
    │                                    │                                   │
    │                                    │  callLLM(prompt)                  │
    │                                    │ ──────────────────────────────►   │
    │                                    │  ◄── structured JSON ─────────    │
    │                                    │                                   │
    │                                    │  Validate output:                 │
    │                                    │  ├─ 7 days, correct dates        │
    │                                    │  ├─ 4 meals/day (B/L/D/S)        │
    │                                    │  ├─ food names match DB fuzzy     │
    │                                    │  ├─ calories within target +/-20% │
    │                                    │  └─ portion sizes 1-5000g         │
    │                                    │                                   │
    │                                    │  Correction loop (max 2 attempts) │
    │                                    │                                   │
    │                                    │  Persist to meal_plans table      │
    │                                    │  Cache in memory (node-cache)     │
    │                                    │                                   │
    │  ◄── { plan, fromCache, status } ──│                                   │
```

### One-Click Log Flow

```
User clicks "Log This Day" (or "Log Breakfast" on specific meal)
    │
    ▼
Frontend: mealPlanApi.logDay(plan.days[dayIndex])
    │
    ▼
POST /api/meal-plans/log-day
    │
    ▼
Backend mealPlan.controller.logDay():
    ├─ Validate all items reference valid food_ids
    ├─ BEGIN TRANSACTION
    │   ├─ INSERT INTO food_logs (user_id, food_id, portion_grams, calories, log_date, meal_type)
    │   │  VALUES (...) RETURNING id
    │   │  (one row per meal item — 4-8 rows per day)
    │   └─ UPDATE meal_plans SET plan_data (mark items as "logged")
    ├─ COMMIT TRANSACTION
    └─ Return { loggedCount, items: [...logIds] }
```

### Regeneration Flow

```
User clicks "Regenerate Day" on a specific day card
    │
    ▼
POST /api/meal-plans/regenerate-day { weekStart, dayIndex }
    │
    ▼
Backend:
    ├─ Clear cache for this user+week
    ├─ Generate fresh full week plan via LLM
    ├─ Merge fresh_day → existing_plan[dayIndex]
    ├─ Update cache + DB
    └─ Return { plan, day, dayIndex }
```

## New Components

### Backend

| Component | File | Type | Purpose | Pattern Source |
|-----------|------|------|---------|----------------|
| Meal Plan Controller | `backend/src/controllers/mealPlan.controller.js` | **NEW** | GET/POST /api/meal-plans/* | Copies `weeklyPlan.controller.js` |
| Meal Plan Routes | `backend/src/routes/mealPlan.routes.js` | **NEW** | Route definitions with rate limiting | Copies `weeklyPlan.routes.js` |
| Meal Plan Rate Limiter | `backend/src/middlewares/mealPlanRateLimiter.js` | **NEW** | 5 req/15min generate, 3 req/30min regenerate | Copies `weeklyPlanRateLimiter.js` |
| Meal Plan Repository | `backend/src/repositories/mealPlan.repository.js` | **NEW** | CRUD for `meal_plans` table | Analogous to `food.repository.js` |
| Meal Plan Service | `backend/src/services/mealPlan.service.js` | **NEW** | Orchestrates LLM call, validation, fallback | Adapts `llm.service.js` patterns |
| Batch Log Service | **Extend** `food.service.js` | **MODIFIED** | Add `batchLogFood()` — wraps repository in transaction | Uses existing `foodRepo.createFoodLog` |
| Batch Log Repo | **Extend** `food.repository.js` | **MODIFIED** | Batch insert with RETURNING clause | New method |
| App.js route | **Extend** `app.js` | **MODIFIED** | `app.use('/api/meal-plans', mealPlanRoutes)` | Follows weekly-plans pattern |
| Prompts | `backend/prompts/meal-plan-prompt.md` | **NEW** | System prompt for meal generation | Follows `system-prompt.md` pattern |
| Prompts | `backend/prompts/meal-correction-prompt.md` | **NEW** | Correction prompt for validation errors | Follows `correction-prompt.md` pattern |

### Frontend

| Component | File | Type | Purpose | Pattern Source |
|-----------|------|------|---------|----------------|
| Meal Plan API | `frontend/src/features/meal-plan/api/mealPlanApi.js` | **NEW** | API client: GET/POST/regenerate/log | Copies `weeklyPlanApi.js` |
| Meal Plan Page | `frontend/src/features/meal-plan/components/MealPlanPage.jsx` | **NEW** | Main page with state management | Copies `WeeklyPlanPage.jsx` |
| Day Meal Card | `frontend/src/features/meal-plan/components/DayMealCard.jsx` | **NEW** | Expandable card for one day | Adapts `DayCard.jsx` |
| Meal Row | `frontend/src/features/meal-plan/components/MealRow.jsx` | **NEW** | Individual meal item row | Adapts `DayActivityRow.jsx` |
| Empty State | `frontend/src/features/meal-plan/components/EmptyStateMealPlan.jsx` | **NEW** | Empty state + generate button | Copies `EmptyStatePlan.jsx` |
| Fallback Banner | `frontend/src/features/meal-plan/components/FallbackBanner.jsx` | **NEW** | Status banner for fallback plans | Copies `FallbackBanner.jsx` |
| Rate-Limited Button | **Reuse** `weekly-plan/components/RateLimitedButton.jsx` | **SHARED** | Countdown + disabled state | Extract to `shared/` or import cross-module |
| Feature index | `frontend/src/features/meal-plan/index.js` | **NEW** | Barrel export | Follows all feature modules |
| Router | **Extend** `Router.jsx` | **MODIFIED** | Add `/meal-plan` route | Follows existing route pattern |

### Database

| Object | Purpose | Type | Pattern Source |
|--------|---------|------|----------------|
| `meal_plans` table | JSONB persistence for generated meal plans | **NEW** | Mirrors `weekly_plans` table exactly |
| Migration SQL | `backend/db/add_meal_plans.sql` | **NEW** | Idempotent CREATE TABLE | Follows `add_activity_logs.sql` |

## Integration Points

### 1. Existing Food Database (READ-ONLY)

The LLM must ONLY recommend ingredients from the `foods` table. Integration:

```javascript
// In mealPlan.service.js — fetch ALL user-accessible foods
async function getUserFoods(userId) {
  return foodRepo.searchFoods(userId, '');  // empty query = all
  // Returns: [{ id, name, calories_per_100g, category }, ...]
}
```

**Critical:** The food list is passed into the LLM prompt as context. The LLM never creates new food entries. The 200+ seeded foods + user's custom foods are the universe of options.

### 2. User Profile (READ-ONLY)

Calorie target is from `profiles` table via `profile.service.js`:
```javascript
const profile = await profileRepo.findByUserId(userId);
const tdee = calculateTdee(profile);  // existing
const calorieTarget = getCalorieTarget(tdee, profile.fitness_goal, profile.calorie_rate);  // existing
```

### 3. Food Log (WRITE — One-Click Log)

**Integration point with existing food log routes.** Two options:

**Option A (Recommended): Batch endpoint via meal-plan routes**
```
POST /api/meal-plans/log-day
Body: { weekStart, dayIndex }
→ Creates 4-8 food_log entries in one transaction
→ Returns count of logged items
```
This avoids calling the existing `/api/food/log` 8 times from the frontend.

**Option B: Frontend loops over existing endpoint**
Simpler but slower. Each call to `POST /api/food/log` requires a round-trip.

**Recommendation:** Option A. Add a `batchLogItems` method to `food.repository.js`:
```javascript
export async function batchLogItems(userId, items) {
  // items: [{ foodId, portionGrams, calories, logDate, mealType }]
  // Single INSERT with multiple VALUES or BEGIN/COMMIT
}
```

### 4. LLM Service (EXTEND — not rewrite)

The existing `llm.service.js` provides reusable primitives:

| Existing Export | Used in Meal Plan? | How |
|----------------|-------------------|-----|
| `buildPrompt()` | YES | Load prompt template + interpolate variables |
| `callLlmApi()` | YES | Primary → fallback model chain |
| `getCachedPlan()` | YES | In-memory cache for meal plans |
| `setCachedPlan()` | YES | Write to cache |
| `clearCachedPlan()` | YES | On regeneration |
| `fuzzyMatchActivityName()` | NO | Will write `fuzzyMatchFoodName()` instead |
| `levenshteinDistance()` | YES | Reuse for food name fuzzy matching |
| `validatePlanStructure()` | NO | Will write `validateMealPlanStructure()` |
| `validateAndFixPlan()` | NO | Will write `validateAndFixMealPlan()` |
| `generateFallbackPlan()` | NO | Will write `generateFallbackMealPlan()` |

**Decision:** Do NOT extend `llm.service.js` further. Create `mealPlan.service.js` that imports the shared primitives (`buildPrompt`, `callLlmApi`, `levenshteinDistance`, caching functions) from `llm.service.js`.

### 5. Rate Limiting

Use the exact same pattern as `weeklyPlanRateLimiter.js`:

| Endpoint | Window | Max | Key |
|----------|--------|-----|-----|
| `POST /generate` | 15 min | 5 | `user_{userId}` |
| `POST /regenerate-day` | 30 min | 3 | `user_{userId}` |
| `POST /log-day` | 15 min | 30 | `user_{userId}` |

## Data Structures

### meal_plans Table

```sql
CREATE TABLE IF NOT EXISTS meal_plans (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    week_start DATE NOT NULL,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'fallback' | 'unavailable'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, week_start)
);
```

**Rationale:** Mirrors `weekly_plans` exactly. Keeps concerns separate (activity plans vs food plans). The UNIQUE(user_id, week_start) constraint ensures one plan per user per week.

### Plan Data JSON Structure (plan_data column)

```json
{
  "days": [
    {
      "date": "2026-06-01",
      "meals": [
        {
          "meal_type": "breakfast",
          "items": [
            {
              "food_id": 42,
              "name": "Oatmeal",
              "portion_grams": 200,
              "calories": 190,
              "logged": false
            },
            {
              "food_id": 156,
              "name": "Banana",
              "portion_grams": 120,
              "calories": 107,
              "logged": false
            }
          ],
          "total_calories": 297
        },
        {
          "meal_type": "lunch",
          "items": [ "...similar..." ],
          "total_calories": 550
        },
        {
          "meal_type": "dinner",
          "items": [ "...similar..." ],
          "total_calories": 650
        },
        {
          "meal_type": "snack",
          "items": [ "...similar..." ],
          "total_calories": 200
        }
      ],
      "total_calories": 1697,
      "logged": false
    }
  ],
  "calorie_target": 2000,
  "generated_at": "2026-05-31T12:00:00.000Z",
  "llm_model": "nvidia/nemotron-3-nano-30b-a3b:free"
}
```

**Design Decisions:**
- `meal_type` matches the existing ENUM: `breakfast`, `lunch`, `dinner`, `snack`
- `food_id` references `foods.id` for seeded foods, NULL for custom-only plans (future)
- `logged: false` enables tracking which items have been logged via one-click
- `calorie_target` is stored with the plan for reference and display

## Prompt Engineering

### System Prompt Structure

The meal plan prompt follows the same pattern as the existing activity plan prompt (`system-prompt.md`) but is a separate file with food-domain-specific instructions:

```
# Role
You are a nutritionist creating a personalized daily meal plan.

# User Profile
- Weight: {{weightKg}} kg
- Height: {{heightCm}} cm
- Age: {{age}}
- Gender: {{gender}}
- Fitness Goal: {{fitnessGoal}}
- Daily Calorie Target: {{calorieTarget}} kcal

# Recent Eating Pattern (last 7 days)
{{recentFoodSummary}}

# Available Ingredients (select ONLY from this list)
{{availableFoods}}
Each ingredient has: id, name, calories_per_100g, category

# Response Format — Valid JSON only, no markdown, no code fences
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "meal_type": "breakfast"|"lunch"|"dinner"|"snack",
          "items": [
            { "food_id": <integer>, "name": "<exact name>", "portion_grams": <integer>, "calories": <integer> }
          ]
        }
      ]
    }
  ]
}

# Constraints
- Exactly 7 consecutive days starting from {{weekStartDate}}
- 4 meals per day (breakfast, lunch, dinner, snack)
- Each meal has 1-4 ingredient items
- Total daily calories within 80-120% of {{calorieTarget}}
- Use ONLY ingredients from the Available Ingredients list
- Include a variety of categories (proteins, carbs, vegetables, fruits, dairy, etc.)
- Portion sizes must be realistic (e.g., rice 150-250g, chicken breast 150-200g)
- Calorie values must be calculated as: (calories_per_100g × portion_grams) / 100
- For {{fitnessGoal}}, adjust portions accordingly (restrict portions for lose_weight)
```

**Key Prompt Engineering Patterns:**
1. **Delimited sections** — Role, Profile, Context, Format, Constraints
2. **Exact format specification** — JSON structure with types
3. **Calculation instruction** — Tell LLM how to compute calories from database values
4. **Portion guidance** — Provide realistic ranges per food category
5. **Exclusion enforcement** — "Use ONLY from this list" with strong language
6. **Category diversity** — Encourage balanced meals across food groups

### Validation Strategy

Post-generation validation before returning to user:

```
validateMealPlanStructure(plan, weekStart):
  ✅ 7 days array
  ✅ Correct date strings (YYYY-MM-DD, consecutive)
  ✅ Each day has 4 meals (B/L/D/S)
  ✅ Each meal has 1-4 items
  ✅ Each item has valid portion_grams (1-5000)
  ✅ Each item has valid calories (positive number)
  ✅ Daily total within ±20% of calorie target

validateAndFixMealPlan(plan, dbFoods):
  For each item:
    ├─ fuzzyMatchFoodName(name, dbFoods)
    │   ├─ Exact match → assign food_id
    │   ├─ Case-insensitive match → assign food_id
    │   ├─ Contains match → assign food_id, log warning
    │   └─ Levenshtein (distance ≤ 3) → assign food_id, log warning
    │       └─ No match → remove item, add to errors
    └─ Recalculate calories: (calories_per_100g × portion_grams) / 100
        If |llm_calories - calculated_calories| > threshold → use calculated
```

**Correction Prompt** (when validation fails):

```
The meal plan you generated did not pass validation. Issues:
{{validationErrors}}

Please generate a corrected version:
- Return ONLY valid JSON
- Use ONLY ingredient names from the originally provided list
- Portions must be realistic (50-500g per ingredient)
- Do NOT create new food names
- Exactly 7 consecutive days with 4 meals each
```

## Fallback Strategy

Mirrors the existing triple fallback chain from activity plans:

```
1. Primary model (CONFIG.model)
   ↓ fails
2. Fallback model (CONFIG.fallbackModel)
   ↓ fails
3. Template-based fallback:
   - Select 6-8 random diverse ingredients from user's food database
   - Distribute across 4 meals based on category
   - Calculate portions to hit calorie target
   - Return with status: 'fallback'
```

The template fallback for meals is simpler than for activities (no history to draw from) — it's a random but nutritionally-plausible distribution. The `generateFallbackMealPlan()` function should:
- Pick 2 proteins, 2 carbs, 2 vegetables, 1 fruit, 1 dairy
- Assign breakfast: carb + dairy (300-400 cal)
- Assign lunch: protein + carb + vegetable (500-600 cal)
- Assign dinner: protein + vegetable (400-500 cal)
- Assign snack: fruit (100-150 cal)

## One-Click Log — Detail

### Endpoint

```
POST /api/meal-plans/log-day
Auth: Required (JWT)
Body: {
  weekStart: "2026-06-01",
  dayIndex: 0,             // Monday
  mealType: "lunch" | null // null = log ALL meals for this day
}
Response: {
  success: true,
  data: {
    loggedCount: 4,
    items: [
      { food_log_id: 123, food_id: 42, meal_type: "lunch", portion_grams: 200, calories: 190 },
      ...
    ]
  }
}
```

### Transaction Logic in Controller

```javascript
async function logDay(req, res, next) {
  const userId = req.user.userId;
  const { weekStart, dayIndex, mealType } = req.body;

  // 1. Get plan from cache or DB
  const plan = await getPlan(userId, weekStart);

  // 2. Collect items to log
  const day = plan.days[dayIndex];
  let items = [];
  for (const meal of day.meals) {
    if (mealType && meal.meal_type !== mealType) continue;
    for (const item of meal.items) {
      if (item.logged) continue;  // skip already-logged
      items.push({
        foodId: item.food_id,
        portionGrams: item.portion_grams,
        calories: item.calories,
        logDate: day.date,
        mealType: meal.meal_type,
      });
    }
  }

  if (items.length === 0) {
    return errorResponse(res, 'All items already logged', 400, 'ALREADY_LOGGED');
  }

  // 3. Batch insert in transaction
  const logged = await foodRepo.batchLogItems(userId, items);

  // 4. Mark items as logged in plan_data
  // (update plan_data JSONB to set logged: true)
  await mealPlanRepo.markItemsLogged(userId, weekStart, dayIndex, mealType);

  return successResponse(res, { loggedCount: logged.length, items: logged });
}
```

### "Log This Meal" vs "Log This Day"

Both use the same `/log-day` endpoint with `mealType` controlling scope:
- `mealType: null` → log ALL unlogged items for the day (full day)
- `mealType: "lunch"` → log only lunch items (partial — per-meal button)

## Component State Machine (Frontend)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Loading     │    │  Empty (no   │    │  Rate Limited    │
│  (fetch      │───►│  plan exists)│    │  (genRetryAfter) │
│   existing)  │    │              │    │                  │
└──────────────┘    └──────┬───────┘    └──────────────────┘
                           │
                           │ [Generate]
                           ▼
                    ┌──────────────┐
                    │  Generating  │──► (LLM call)
                    │  (loading)   │
                    └──────┬───────┘
                           │ success    ┌──────────────────┐
                           ▼            │  Fallback (no    │
                    ┌──────────────┐    │   LLM available) │
                    │  Plan Active │───►│                  │
                    │  (day cards) │    └──────────────────┘
                    └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
            ┌────────────┐ ┌──────────────┐
            │ Regen Day  │ │  Log Day/    │
            │ (loading)  │ │  Meal        │
            │            │ │ (loading)    │
            └────────────┘ └──────────────┘
```

## Build Order (Dependency-Aware)

| Step | Component | Depends On | Risk |
|------|-----------|------------|------|
| 1 | DB migration: `meal_plans` table | Nothing | Low — standard pattern |
| 2 | Prompt files (system + correction) | Nothing | Low — can iterate |
| 3 | `mealPlan.repository.js` | Step 1 | Low — CRUD pattern |
| 4 | `food.repository.js` batch insert | Nothing | Low — single method |
| 5 | `mealPlan.service.js` + prompt building | Steps 2, 3, 4 | HIGH — core LLM logic |
| 6 | Validation module (structure + fuzzy food match) | Step 5 | MEDIUM — fuzzy matching edge cases |
| 7 | Fallback plan generator | Step 3 | Low — template logic |
| 8 | `mealPlan.controller.js` + `mealPlan.routes.js` | Steps 5, 6, 7 | MEDIUM — integration |
| 9 | `mealPlanRateLimiter.js` | Nothing | Low — copy pattern |
| 10 | Extend `app.js` | Steps 8, 9 | Low — boilerplate |
| 11 | Frontend API module | Step 8 | Low — fetch calls |
| 12 | Frontend components (page, cards, meal rows) | Step 11 | MEDIUM — UX complexity |
| 13 | Frontend Router.jsx integration | Step 12 | Low — route addition |
| 14 | Batch log endpoint integration | Step 4 + frontend | MEDIUM — transaction correctness |
| 15 | Tests (backend: 20+, frontend: 10+) | Steps 10, 13, 14 | MEDIUM — validation coverage |

**Phase ordering rationale:**
- Steps 1-3 are prerequisites (infrastructure)
- Step 4 can happen early since it's small and independent
- Step 5 is the highest risk item — should be done early, validated independently
- Steps 8-10 form the backend API layer (thin after step 5)
- Steps 11-13 form the frontend layer
- Step 14 ties the two features together (meals → food log)
- Step 15 validates everything

## What Does NOT Change

- **Auth middleware** — JWT auth is unchanged
- **Error handling** — AppError, ValidationError pattern stays
- **Response format** — `successResponse`/`errorResponse` untouched
- **Profile service** — No changes needed (read-only)
- **Food service/repository** — Only adds ONE new method: `batchLogItems`
- **LLM service** — No changes. New `mealPlan.service.js` imports its primitives
- **Database driver** — pg Pool, no ORM
- **Logger** — morgan + console
- **Test framework** — Jest backend, Vitest frontend

## Sources

- **Existing codebase:** weeklyPlan.controller.js, llm.service.js, food.repository.js — HIGH confidence
- **OpenRouter structured outputs:** https://openrouter.ai/docs/guides/features/structured-outputs — HIGH confidence
- **NutriGen (LLM meal plan research):** https://arxiv.org/html/2502.20601v1 — MEDIUM confidence (academic, but validates approach)
- **LangChain + Zod structured output pattern:** https://www.wellally.tech/blog/build-ai-meal-planner-nextjs-langchain — MEDIUM confidence (industry blog)
- **Meal.io architecture:** https://dev.to/youssef_ahmed/mealio-ai-weekly-meal-planner-2mab — LOW confidence (single dev project, but similar stack)
