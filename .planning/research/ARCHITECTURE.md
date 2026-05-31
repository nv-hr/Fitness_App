# Architecture Research: v1.5 Smart Auto-Logging

**Project:** Fitness_App
**Milestone:** v1.5 Smart Auto-Logging
**Researched:** 2026-05-31
**Confidence:** HIGH — based on complete codebase analysis of existing architecture

---

## Overview

v1.5 transforms the Fitness_App from having **two separate modes** (generated plans vs. manual logging) into a **unified system** where LLM-generated plans auto-integrate with the user's manual logging experience. The core architectural theme is **convergence**: merging plan pages into log pages, auto-generating plans on visit, and auto-saving generated items to their respective log tables.

### Current Architecture Summary

```
Frontend Routes (all separate pages):
  /weekly-plan  → WeeklyPlanPage  (LLM activity plan, 7 days)
  /meal-plan    → MealPlanPage     (LLM meal plan, 7 days)
  /activities   → ActivitiesPage   (manual activity log + recommendations)
  /food-log     → FoodLogPage      (manual food log + search)

Backend Data Flow:
  weekly_plans:         in-memory cache only (node-cache), NO DB persistence
  meal_plans:           DB persisted (meal_plans table, JSONB) + cache
  activity_logs:        DB persisted (per-entry rows)
  food_logs:            DB persisted (per-entry rows)
```

### Target Architecture (v1.5)

```
Frontend Routes (merged):
  /activities   → ActivitiesPage   (recommendations + auto-generated plan + log)
  /food-log     → FoodLogPage      (food search + auto-generated meals + log)
  (weekly-plan and meal-plan routes REMOVED)

Data Flow:
  activity_plans:        DB persisted (new activity_plans table) + cache
  daily_meal_plans:      DB persisted (new daily_meal_plans table) + cache
  activity_logs:         DB persisted + auto-logged via plan
  food_logs:             DB persisted + auto-logged via plan
```

---

## Integration Points

### 1. Auto-Generation Trigger on Page Visit

**Where the logic lives:** Frontend `useEffect`, with a guard ref to prevent double-fires.

**Current behavior:** Page mounts → `GET /plan` → if null → show EmptyState with manual "Generate" button.

**Target behavior:** Page mounts → `GET /plan` → if null → auto-call `POST /plan/generate` → show loading state → display plan or rate-limit UI.

**Implementation pattern:**

```jsx
// In ActivitiesPage.jsx or FoodLogPage.jsx
const [plan, setPlan] = useState(null);
const [planLoading, setPlanLoading] = useState(false);
const [planStatus, setPlanStatus] = useState(null);
const autoGenAttempted = useRef(false);

useEffect(() => {
  loadPlan();
}, []);

// Auto-generate if no plan after initial load
useEffect(() => {
  if (!planLoading && plan === null && !autoGenAttempted.current) {
    autoGenAttempted.current = true;
    handleGenerate();
  }
}, [planLoading, plan]);

const loadPlan = useCallback(async () => {
  setPlanLoading(true);
  try {
    // For activity plans: GET /api/activity-plans?date=today
    // For meal plans: GET /api/daily-meal-plans?date=today
    const res = await getPlan(today);
    if (res.data?.plan) setPlan(res.data.plan);
  } catch (err) {
    // silently fail — generation will catch
  } finally {
    setPlanLoading(false);
  }
}, []);
```

**Key guard:** `useRef` flag prevents auto-gen from firing twice due to React StrictMode or re-renders.

**Backend impact:** None — the existing `GET` + `POST /generate` endpoints are reused. The auto-trigger is purely a UI concern.

---

### 2. Auto-Save to Activity Log with Completed Toggle

**Current architecture:** Weekly plan has `days[].activities[]` with no `logged` field. Activity logs are created independently via `POST /api/activities/log`.

**Target architecture:** Each activity in the generated plan gains a `logged: boolean` field. When toggled, the frontend sends a batch request that:
1. Creates entries in `activity_logs` table
2. Marks the activity as `logged: true` in the plan data

**New endpoint:** `POST /api/activity-plans/log-activities`

**Request body:**
```json
{
  "planDate": "2026-05-31",
  "activities": [
    {
      "activityId": 5,
      "durationMin": 30,
      "intensity": "moderate",
      "caloriesBurned": 200
    }
  ]
}
```

**Backend flow:**
- Controller calls `activityRepo.createActivityLog()` for each activity
- Updates the plan JSONB to set `logged: true` on each activity
- Returns the updated plan

**Alternative (simpler):** Reuse existing `POST /api/activities/log` endpoint sequentially. The frontend calls it per activity and updates local plan state. This avoids a new batch endpoint but makes the toggle slower for multiple activities.

**Recommendation:** Build the new batch endpoint. Server-authoritative calorie calculation must still happen server-side (reuse `activityLogService.calculateCaloriesBurned()`). The `caloriesBurned` sent by the client is ignored; the server recalculates.

---

### 3. Auto-Save Meals to Food Log with Completed/Regenerate/Select Alternatives

**Current architecture:** `logDay` endpoint already batch-logs all unlogged items from a meal plan day. Per-item logging is supported via optional `mealType` filter.

**Target architecture:** Keep the existing `POST /api/meal-plans/log-day` pattern, but extend it:

#### Completed Toggle (✓)
The existing pattern works. Each meal item has `logged: boolean`. The `logDay` endpoint creates food_log entries and marks items logged. **No architectural change needed** for the basic flow.

#### Per-Meal Regeneration
Currently `regenerateDay` regenerates a full day's worth of meals. With daily plans (single day), this regenerates everything. **Add per-meal regeneration** — regenerate only `breakfast`, `lunch`, `dinner`, or `snack`.

**New endpoint:** `POST /api/daily-meal-plans/regenerate-meal`

**Request:**
```json
{
  "date": "2026-05-31",
  "mealType": "lunch",
  "excludeItems": [14, 27]  // food_ids to exclude (for "select alternatives")
}
```

#### Select Alternatives
Allow user to swap a single food item with an alternative from the database.
- Frontend sends `POST /api/daily-meal-plans/alternatives` with `{date, mealType, foodId}`
- Backend queries the food database for similar-category foods, picks one randomly
- Replaces the item in the plan JSONB, recalculates calories
- Returns updated plan

**Simpler alternative:** Reject "select alternatives" complexity in v1.5 and defer. The user can already regenerate the entire meal via "Regenerate." This avoids a new endpoint and LLM call. **Recommend deferral** to keep scope contained.

---

### 4. Daily Meal Generation (Change from Weekly)

**This is the highest-impact architectural change in v1.5.**

**Current pattern:** All meal plan logic uses `weekStart` (Monday) as the cache/DB key, generates 7 days, validates 7 days, stores 7 days.

**Target pattern:** Use `date` (today) as the key, generate 1 day, validate 1 day, store 1 day.

#### What Changes

| Area | Current | Target |
|------|---------|--------|
| **Cache keys** | `plan_meal_${userId}_${weekStart}` | `plan_meal_${userId}_${date}` |
| **DB table** | `meal_plans` (user_id, week_start UNIQUE) | New `daily_meal_plans` (user_id, date UNIQUE) |
| **Validation** | Expects 7 days, 7 dates in sequence | Expects 1 day, single date |
| **Prompt** | Generate Mon-Sun | Generate today only |
| **Fallback** | 7-day rotation via template | Single-day template meals |
| **regenerateDay** | Replaces one of 7 days | Regenerates the single day |
| **LLM cost** | ~2K tokens per plan | ~300-500 tokens per plan |

#### Proposed Schema

```sql
CREATE TABLE IF NOT EXISTS daily_meal_plans (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_date)
);
```

#### Cache Key Change

In `llm.service.js`, the cache functions use concatenated keys:
```js
// Current: `plan_meal_${userId}_${weekStart}`
// Target:  `plan_meal_${userId}_${date}`
```

The cache functions (`getCachedPlan`, `setCachedPlan`, `clearCachedPlan`) already accept a `planType` parameter — just change the caller.

#### Validation Change

`mealPlan.service.js` `validateMealPlanStructure()` currently checks:
- `days.length === 7`
- Each day's `date` matches expected sequential dates

Change to:
- `days.length === 1`
- The day's `date` matches the requested date

#### Prompt Change

`meal-plan-prompt.md` currently says "Generate a 7-day meal plan starting on {{weekStartDate}}." Change to "Generate a meal plan for today ({{date}})."

#### Migration Strategy

1. Create `daily_meal_plans` table via migration
2. Create new service functions: `generateDailyMealPlan()`, `validateDailyMealPlanStructure()`
3. Create new controller + routes for `/api/daily-meal-plans`
4. Create separate rate limiters for daily meal plans
5. Leave existing `meal_plans` table untouched (backward compat, no data migration needed)
6. Once v1.5 is stable, remove old meal plan code

**Recommendation:** Start with a new service file `dailyMealPlan.service.js` rather than modifying `mealPlan.service.js` in-place. This isolates risk and keeps the old code functioning during development.

---

### 5. Manual Regenerate Button Always Available

**Current:** Regenerate button is inside the expanded DayCard (activity plan) or DayMealCard (meal plan). Not always visible.

**Target:** Always-show button at the section level, collapsed or not.

**Pattern:** Move the regenerate button outside the accordion expand logic. For the merged pages, place it in the plan section header.

```jsx
{/* Plan section header with always-visible regenerate */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h3>Today's Plan</h3>
  <button onClick={handleRegenerate} disabled={isRegenerating}>
    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
  </button>
</div>
```

The button calls the same `regenerateDay` or full-plan regeneration endpoint that already exists.

---

### 6. Merge Activity Plan into Activities Page

**Current:** Two separate pages with separate state machines, separate API calls, separate mounting.

**Target:** Single `ActivitiesPage` with two sections:
1. **Activity Recommendations** (existing: shuffle, manual log, pool, history)
2. **Activity Plan** (generated, auto-logged)

#### Layout Structure

```
┌──────────────────────────────────┐
│  Activity Summary (net calories) │
├──────────────────────────────────┤
│  ┌──────────────────────────────┐│
│  │ Today's Activity Plan (H3)   ││
│  │ [Regenerate]                 ││
│  │ ──────────────────────────── ││
│  │ Running · 30min · moderate   ││
│  │ [✓ Logged]                  ││
│  │ Walking · 20min · light      ││
│  │ [☐ Log to diary]            ││
│  └──────────────────────────────┘│
├──────────────────────────────────┤
│  Today's Recommendations         │
│  [ActivityCard] [Log]            │
│  [ActivityCard] [Log]            │
│  [Shuffle]                       │
├──────────────────────────────────┤
│  Activity Pool (all activities)  │
├──────────────────────────────────┤
│  Activity History (accordion)    │
└──────────────────────────────────┘
```

#### Component Changes

- Extract a `TodayActivityPlan` component from `WeeklyPlanPage.jsx` that shows only today's activities with inline log toggles
- Remove `WeeklyPlanPage.jsx` (or keep as deprecated redirect)
- Remove `/weekly-plan` route from `Router.jsx`
- Add the plan section to `ActivitiesPage.jsx` above the recommendations

#### State Integration

`ActivitiesPage.jsx` gains new state:
```jsx
const [activityPlan, setActivityPlan] = useState(null);
const [planStatus, setPlanStatus] = useState(null); // active|fallback|rate_limited
const [planLoading, setPlanLoading] = useState(true);
const [togglingActivity, setTogglingActivity] = useState(null); // activity_id being logged
```

These integrate existing log refresh: after toggling a plan activity, call `refreshActivityData()` to update the summary.

---

### 7. Merge Meal Plan into Food Log Page

**Current:** Two separate pages with separate state.

**Target:** Single `FoodLogPage` with:
1. **Calorie Summary** (existing)
2. **Meal Plan Section** (today's generated meals with log buttons)
3. **Manual Food Logging** (existing: search, portion, log)
4. **Today's Log** (existing)
5. **Calorie History** (existing)

#### Layout Structure

```
┌──────────────────────────────────┐
│  Calorie Summary (progress bar)  │
├──────────────────────────────────┤
│  ┌──────────────────────────────┐│
│  │ Today's Meal Plan (H3)       ││
│  │ [Regenerate]                 ││
│  │ ──────────────────────────── ││
│  │ Breakfast  🔽                ││
│  │   ✓ Oatmeal 200g · 150 kcal  ││
│  │   ✓ Milk 100ml · 60 kcal     ││
│  │ Lunch     🔽 [Log meals]     ││
│  │   ○ Chicken 150g · 250 kcal  ││
│  │   ○ Rice 200g · 260 kcal     ││
│  └──────────────────────────────┘│
├──────────────────────────────────┤
│  Manual Food Entry               │
│  [Food Search] [Portion] [Log]   │
├──────────────────────────────────┤
│  Today's Food Log (table)        │
├──────────────────────────────────┤
│  Calorie History (chart)         │
└──────────────────────────────────┘
```

#### Component Changes

- Extract a `TodayMealPlan` component from `MealPlanPage.jsx` — shows only today, single accordion
- Remove `MealPlanPage.jsx` route and component
- Add the meal plan section to `FoodLogPage.jsx` between summary and manual entry

#### State Integration

```jsx
const [mealPlan, setMealPlan] = useState(null);
const [mealPlanStatus, setMealPlanStatus] = useState(null);
const [mealPlanLoading, setMealPlanLoading] = useState(false);
```

After logging a meal plan item, call `refreshData()` to update the daily summary and logs.

---

## New Components / Changes

### New Backend Files

| File | Purpose |
|------|---------|
| `backend/src/services/dailyMealPlan.service.js` | Daily (not weekly) meal generation, validation, fallback, regeneration |
| `backend/src/repositories/dailyMealPlan.repository.js` | `findByUserAndDate`, `upsertPlan`, `markItemsLogged` |
| `backend/src/repositories/activityPlan.repository.js` | CRUD for activity plans (currently only cached) |
| `backend/src/controllers/dailyMealPlan.controller.js` | Handlers for daily meal plan CRUD |
| `backend/src/controllers/activityPlan.controller.js` | New controller for activity plan (replaces weeklyPlan controller) |
| `backend/src/middlewares/dailyMealPlanRateLimiter.js` | Rate limiters for daily endpoints |
| `backend/src/middlewares/activityPlanRateLimiter.js` | Rate limiters for new activity plan endpoints |
| `backend/src/routes/dailyMealPlan.routes.js` | Routes: GET, POST generate, POST regenerate-meal, POST log-meal |
| `backend/src/routes/activityPlan.routes.js` | Routes: GET, POST generate, POST log-activities |
| `backend/db/add_daily_meal_plans.sql` | Migration for daily_meal_plans table |
| `backend/db/add_activity_plans.sql` | Migration for activity_plans table |
| `backend/prompts/daily-meal-prompt.md` | Single-day meal generation prompt |

### New/Modified Frontend Components

| Component | Status | Purpose |
|-----------|--------|---------|
| `TodayActivityPlan.jsx` | **NEW** | Inline plan section for ActivitiesPage |
| `TodayMealPlan.jsx` | **NEW** | Inline meal plan section for FoodLogPage |
| `ActivityPlanCard.jsx` | **NEW** | Single activity row with log toggle |
| `MealPlanItem.jsx` | **NEW** | Single meal item row with log/regenerate actions |
| `ActivitiesPage.jsx` | **MODIFIED** | Integrated plan section |
| `FoodLogPage.jsx` | **MODIFIED** | Integrated meal plan section |
| `WeeklyPlanPage.jsx` | **REMOVED** | Replaced by ActivitiesPage integration |
| `MealPlanPage.jsx` | **REMOVED** | Replaced by FoodLogPage integration |
| `Router.jsx` | **MODIFIED** | Remove /weekly-plan, /meal-plan routes |

### Database Migrations

```sql
-- daily_meal_plans table
CREATE TABLE IF NOT EXISTS daily_meal_plans (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_date)
);

-- activity_plans table (DB persistence — currently cached only)
CREATE TABLE IF NOT EXISTS activity_plans (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_date)
);
```

---

## Data Flow Changes

### Current Data Flow: Weekly Plan

```
Frontend                          Backend
  │                                 │
  ├─ GET /api/weekly-plans ────────┤
  │                                 ├─ Check node-cache
  │                                 ├─ If miss: check weekly_plans (DB)
  │                                 └─ Return plan or null
  │                                 │
  ├─ POST /api/weekly-plans/generate┤
  │                                 ├─ Check cache (TTL hit → return)
  │                                 ├─ Fetch profile, history, activities
  │                                 ├─ Call LLM (OpenRouter)
  │                                 ├─ Validate structure + names
  │                                 ├─ Store in node-cache only (NO DB)
  │                                 └─ Return plan
```

### Target Data Flow: Activity Plan (v1.5)

```
Frontend                          Backend
  │                                 │
  ├─ GET /api/activity-plans ──────┤
  │      ?date=2026-05-31           ├─ Check node-cache
  │                                 ├─ If miss: check activity_plans (DB)
  │                                 └─ Return plan or null
  │                                 │
  │  [auto-trigger if null]         │
  ├─ POST /api/activity-plans/      │
  │     generate ──────────────────┤
  │      { date }                   ├─ Check cache
  │                                 ├─ Fetch profile, history, activities
  │                                 ├─ Call LLM (OpenRouter)
  │                                 ├─ Validate
  │                                 ├─ Store in activity_plans (DB)
  │                                 ├─ Store in node-cache
  │                                 └─ Return plan
  │                                 │
  ├─ POST /api/activity-plans/      │
  │     log-activities ────────────┤
  │      { date, activities[] }     ├─ For each activity:
  │                                 │   ├─ activityRepo.createActivityLog()
  │                                 │   └─ (calories calculated server-side)
  │                                 ├─ Mark logged=true in plan JSONB
  │                                 ├─ Upsert plan in DB
  │                                 └─ Return updated plan
```

### Current Data Flow: Meal Plan (Weekly)

```
Frontend                          Backend
  │                                 │
  ├─ GET /api/meal-plans ──────────┤
  │      ?weekStart=2026-05-25      ├─ Check cache
  │                                 ├─ If miss: check meal_plans (DB)
  │                                 └─ Return plan or null
  │                                 │
  ├─ POST /api/meal-plans/generate ┤
  │      { weekStart }              ├─ Generate 7-day plan via LLM
  │                                 ├─ Validate 7 days
  │                                 ├─ Store in DB + cache
  │                                 └─ Return plan
  │                                 │
  ├─ POST /api/meal-plans/log-day ─┤
  │      { weekStart, dayIndex }    ├─ batchLogItems() → food_logs
  │                                 ├─ markItemsLogged() → plan
  │                                 └─ Return result
```

### Target Data Flow: Meal Plan (Daily, v1.5)

```
Frontend                          Backend
  │                                 │
  ├─ GET /api/daily-meal-plans ────┤
  │      ?date=2026-05-31           ├─ Check cache
  │                                 ├─ If miss: check daily_meal_plans (DB)
  │                                 └─ Return plan or null
  │                                 │
  │  [auto-trigger if null]         │
  ├─ POST /api/daily-meal-plans/    │
  │     generate ──────────────────┤
  │      { date }                   ├─ Generate 1-day plan via LLM
  │                                 ├─ Validate 1 day
  │                                 ├─ Store in daily_meal_plans (DB)
  │                                 ├─ Store in cache
  │                                 └─ Return plan
  │                                 │
  ├─ POST /api/daily-meal-plans/    │
  │     log-meals ─────────────────┤
  │      { date, mealType }         ├─ batchLogItems() → food_logs
  │                                 ├─ markItemsLogged() → plan
  │                                 └─ Return updated plan
  │                                 │
  ├─ POST /api/daily-meal-plans/    │
  │     regenerate-meal ───────────┤
  │      { date, mealType }         ├─ Rebuild prompt for one meal
  │                                 ├─ Call LLM (single meal)
  │                                 ├─ Validate + recalculate
  │                                 ├─ Replace in plan JSONB
  │                                 └─ Return updated plan
```

---

## Build Order Recommendations

### Phase 1: Foundation — Daily Meal Plan Service

**Duration estimation:** Medium complexity

**Why first:** The daily meal plan shift is the most invasive change — everything else (auto-generation, auto-save, merge) builds on it. Getting this right unblocks all other work.

**Work items:**
1. Create `daily_meal_plans` DB migration (new table)
2. Create `dailyMealPlan.repository.js` (findByUserAndDate, upsertPlan, markItemsLogged)
3. Create `dailyMealPlan.service.js` — daily version of all meal plan logic:
   - `generateDailyMealPlan()` — 1-day generation pipeline
   - `validateDailyMealPlanStructure()` — expects 1 day, not 7
   - `generateDailyFallback()` — single-day template fallback
   - `regenerateMeal()` — regenerate single meal within a day
4. Create `backend/prompts/daily-meal-prompt.md` — single-day prompt
5. Create `dailyMealPlan.controller.js` + `dailyMealPlan.routes.js` + `dailyMealPlanRateLimiter.js`
6. Register in `app.js` at `/api/daily-meal-plans`

**Files affected:** ~8 new files, ~2 modified files
**Risk:** Medium — new code path, but existing patterns (mealPlan.service.js) can be closely followed
**Test strategy:** Unit-test validation, fallback, and regeneration in isolation before integration

### Phase 2: Activity Plan Persistence

**Duration estimation:** Small complexity

**Why second:** Currently activity plans have NO DB persistence (cache only). v1.5 needs DB persistence for auto-save with logged state.

**Work items:**
1. Create `activity_plans` DB migration (new table, mirrors `meal_plans`)
2. Create `activityPlan.repository.js` (findByUserAndDate, upsertPlan, markActivitiesLogged)
3. Create `activityPlan.service.js` — wraps existing `generateWeeklyPlan` from `llm.service.js` but adds DB persistence
4. Create `activityPlan.controller.js` + `activityPlan.routes.js`
5. Register in `app.js` at `/api/activity-plans`

**Files affected:** ~5 new files, `llm.service.js` minor modification
**Risk:** Low — mirrors existing meal plan pattern exactly
**Test strategy:** Integration tests with DB read/write

### Phase 3: Activity Plan Logging (Auto-Save)

**Duration estimation:** Medium complexity

**Why third:** Requires persistence from Phase 2, plus the batch-log endpoint.

**Work items:**
1. Add `POST /api/activity-plans/log-activities` endpoint to activityPlan controller
2. Implement batch-log → inserts into `activity_logs` table + recalculates calories server-side
3. Add `markActivitiesLogged()` to repository — sets `logged: true` on activities in the plan JSONB
4. Rate-limiter for the log endpoint

**Files affected:** ~2 modified files (controller, repository)
**Risk:** Low — pattern already exists in meal plan `logDay`
**Test strategy:** Integration test for batch-log with calorie recalculation

### Phase 4: Frontend — Merge Activity Plan into Activities Page

**Duration estimation:** Medium complexity

**Why fourth:** Phase 3 provides the backend endpoint needed for the inline completed toggle.

**Work items:**
1. Create `TodayActivityPlan.jsx` component — shows today's generated activities with inline log toggle
2. Create `ActivityPlanCard.jsx` — single row with completed checkbox + logged indicator
3. Integrate into `ActivitiesPage.jsx`:
   - Add plan loading + state management
   - Add auto-generation trigger (useEffect + useRef guard)
   - Add plan section above Recommendations
   - Wire inline toggle to `POST /api/activity-plans/log-activities`
4. Remove `WeeklyPlanPage.jsx` from router
5. Remove `/weekly-plan` route from `Router.jsx`

**Files affected:** ~3 new components, ~2 modified files (ActivitiesPage, Router)
**Risk:** Medium — refactoring a working page requires careful retention of existing behavior
**Test strategy:** Component tests for TodayActivityPlan, updated ActivitiesPage tests

### Phase 5: Frontend — Merge Meal Plan into Food Log Page

**Duration estimation:** Medium complexity

**Why fifth:** Phase 1 provides the daily meal plan backend, Phase 4 provides the merge pattern to follow.

**Work items:**
1. Create `TodayMealPlan.jsx` component — shows today's meals with inline log/regenerate
2. Create `MealPlanItem.jsx` — per-item row with logged indicator and per‑meal regenerate
3. Integrate into `FoodLogPage.jsx`:
   - Add meal plan loading + state management
   - Add auto-generation trigger
   - Add plan section between CalorieSummary and manual food entry
   - Wire log action to `POST /api/daily-meal-plans/log-meals`
   - Wire regenerate to `POST /api/daily-meal-plans/regenerate-meal`
4. Remove `MealPlanPage.jsx` + `/meal-plan` route

**Files affected:** ~2 new components, ~2 modified files (FoodLogPage, Router)
**Risk:** Medium — follows Phase 4 pattern closely, lower risk
**Test strategy:** Component tests for TodayMealPlan, updated FoodLogPage tests

### Phase 6: Polish, Rate Limiting, Cleanup

**Duration estimation:** Small complexity

**Why last:** Non-functional improvements and cleanup after all features work.

**Work items:**
1. Tune rate limits for daily plans (lower quotas since single-day generation is cheaper)
2. Remove dead code: `WeeklyPlanPage.jsx`, `MealPlanPage.jsx`, old route files if applicable
3. Update dashboard links in `Router.jsx`
4. Verify `node-cache` key namespace isolation (no collisions between old weekly and new daily keys)
5. Update documentation in README

**Files affected:** ~2 modified files (rate limiters), ~6 deleted files
**Risk:** Low
**Test strategy:** Existing test suite still passes; verify no regressions

---

## Potential Pitfalls

| Issue | Risk | Mitigation |
|-------|------|------------|
| Auto-generation can exceed rate limit on first visit | Medium | The auto-generation `useEffect` must handle the `RATE_LIMITED` response gracefully — show the existing countdown UI instead of an error |
| `useEffect` double-fire in React StrictMode causes two auto-gen calls | High | Use `useRef` flag: `autoGenAttempted.current = true` before calling, checked before calling |
| Old weekly cache keys collide with new daily keys | Low | Namespace with `plan_meal_` vs `plan_daily_meal_` and `plan_activity_` prefixes |
| Removing `/weekly-plan` and `/meal-plan` routes breaks bookmarked URLs | Medium | Add redirect routes: `/weekly-plan` → `/activities`, `/meal-plan` → `/food-log` |
| Daily meal generation loses the week overview | Low | Today's meals are visible inline. The user doesn't need next-Tuesday's meals. |
| Batch-log endpoint for activities doesn't use intensity multipliers | Medium | Must call `activityLogService.calculateCaloriesBurned()` server-side; never trust client calories |

## Key Architectural Decisions

| Decision | Rationale | Confidence |
|----------|-----------|------------|
| New tables instead of repurposing existing ones | Keeps old code running during development, avoids schema migration conflicts | HIGH |
| New service files instead of modifying in-place | Isolates risk, easier to roll back, cleaner separation of concerns | HIGH |
| Auto-generation triggered by frontend useEffect | Backend already handles generation; no need for new server-initiated logic | HIGH |
| Batch-log for activities (new endpoint) | Single atomic operation vs. sequential API calls that could leave partial state | HIGH |
| Per-meal regeneration for daily plans | More granular than full-day regeneration, saves LLM tokens | MEDIUM |
| "Select alternatives" deferred | Adds significant scope (new endpoint, LLM prompt, UI state). Can follow in v1.6 | HIGH |
| Daily meal prompt separate from weekly prompt | Isolated changes, can test independently, doesn't break existing prompt | HIGH |
| Activity plans persisted to DB (currently cache-only) | Required for auto-save (logged state must survive cache eviction) | HIGH |
