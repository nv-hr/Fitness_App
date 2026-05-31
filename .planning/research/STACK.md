# Stack Research — v1.5 Smart Auto-Logging

**Milestone:** v1.5 Smart Auto-Logging
**Researched:** 2026-05-31
**Confidence:** HIGH
**Overall Verdict: Zero new npm packages required.**

The existing stack (React 19 + Vite 8 + Express 5 ESM + Supabase PostgreSQL + pg driver + Passport JWT + node-cache + OpenRouter/OpenAI SDK + TanStack React Query + React Hook Form + Zod) handles every new feature in v1.5 without additions. All changes are architectural/configuration — new routes, modified prompts, merged UI components.

---

## Current Stack (Unchanged)

| Technology | Version | Purpose | Why Still Correct |
|------------|---------|---------|-------------------|
| React | 19 | Frontend UI | Merging two route-pages into two combined pages follows same component patterns |
| Vite | 8 | Build tool | No config changes needed for route merging |
| TanStack React Query | ^5.80.0 | Data fetching | Auto-generation on page visit is a natural `useEffect` + mutation pattern; React Query not yet in use for plan pages but optional |
| Express | 5 | Backend API | New `log-day` route for activities follows existing meal-plan `logDay` pattern |
| Supabase PostgreSQL | 17 | Database | No new tables; `logged` tracking lives in existing `weekly_plans.plan_data` JSONB |
| pg | ^8.21.0 | DB driver | `batchLogActivities()` reuses same pool transaction pattern as `batchLogItems()` |
| OpenRouter (OpenAI SDK) | ^6.39.1 | LLM provider | Meal prompts switch from 7-day to 1-day generation; same SDK, same call pattern |
| node-cache | ^5.1.2 | In-memory caching | Caching a 1-day meal plan vs 7-day changes nothing — key namespacing already exists |
| express-rate-limit | ^8.5.0 | Rate limiting | Add one new limiter for `POST /api/weekly-plans/log-day`; follows existing `logDayLimiter` pattern |
| Helmet | ^8.1.0 | Security headers | Unchanged |
| morgan | ^1.10.0 | Request logging | Unchanged |
| compression | ^1.8.1 | Gzip | Unchanged |
| bcrypt | ^6.0.0 | Password hashing | Unchanged |
| jsonwebtoken | ^9.0.2 | JWT auth | Unchanged |
| passport | ^0.7.0 | Auth strategy | Unchanged |
| cookie-parser | ^1.4.7 | Cookie parsing | Unchanged |
| cors | ^2.8.5 | CORS | Unchanged |
| dotenv | ^17.4.0 | Env vars | Unchanged |
| express-validator | ^7.3.0 | Validation | Unchanged |
| react-router-dom | ^7.6.0 | Client routing | Route merging removes `/weekly-plan` and `/meal-plan` paths — simpler routing tree |
| react-hook-form | ^7.58.0 | Form state | Unchanged (no new forms) |
| zod | ^3.25.0 | Validation | Unchanged |
| Jest + Supertest | latest | Backend testing | New tests for `log-day` endpoint, 1-day generation |
| Vitest + testing-library | latest | Frontend testing | Component tests for merged pages |

---

## Required Changes — Analysis

### 1. Activity Plan Auto-Log (New Feature)
**What:** When user toggles "completed" on a planned activity, it auto-saves to `activity_logs`.

**Integration point:** `weekly_plans.plan_data` JSONB contains `days[n].activities[m]` with `activity_id`, `duration_min`, `intensity`. The new endpoint `POST /api/weekly-plans/log-day` accepts `{ weekStart, dayIndex }` and:

1. Reads the weekly_plans row
2. Inserts rows into `activity_logs` (mapping activity_id, duration_min, intensity, calculated calories_burned)
3. Updates plan_data JSONB with `logged: true` on those activity entries
4. All wrapped in a single PostgreSQL transaction

**Backend changes:**
- `activity.repository.js` — NEW `batchLogActivities(userId, items, clientOverride)` method (follows `batchLogItems()` in `food.repository.js` exactly, but targets `activity_logs` table)
- `weeklyPlan.controller.js` — NEW `logDay` handler (follows `mealPlan.controller.js:logDay` exactly)
- `weeklyPlan.routes.js` — NEW `router.post('/log-day', logDayLimiter, controller.logDay)`
- `middlewares/weeklyPlanRateLimiter.js` — NEW `logDayLimiter` export (follows `mealPlanRateLimiter.js:logDayLimiter`)

**No new packages.** Patterns exist already in:
- `food.repository.js:batchLogItems()` — same transaction pattern
- `mealPlan.controller.js:logDay()` — same control flow
- `mealPlanRateLimiter.js:logDayLimiter` — same limiter config

### 2. Meal Plan: 7-Day → 1-Day Generation
**What:** Meal recommendations generate for 1 day only, not a full week.

**Integration point:** `mealPlan.service.js` generates `plan_data.days` as an array of 7 day objects. This changes to a single-day or single-entry schema.

**Options considered:**

| Approach | Effort | Risk | Verdict |
|----------|--------|------|---------|
| A) Change prompt to generate 1 day, keep 7-day array in DB with other 6 days empty | Low | LOW — prompts are template strings, DB schema unchanged | **RECOMMENDED** |
| B) Change schema to single-day JSONB | Medium | MEDIUM — requires new migration, breaks existing cache | Not worth it |
| C) Generate 7 days as before, only display 1st day | Trivial | LOW — but wastes LLM tokens | Not optimal |

**Recommended approach (A):**
1. Modify `backend/prompts/meal-plan-prompt.md` — change "Exactly 7 consecutive days" to "Exactly 1 day (today)", change the example to single-day
2. Modify `mealPlan.service.js:generateMealPlan()` — after LLM returns, wrap the single-day result into a 7-day array (only the current day filled, other 6 days as empty placeholders) OR change the internal storage to single-day
3. Modify `mealPlan.service.js:validateMealPlanStructure()` — accept 1 day instead of 7

**Impact analysis for approach A:**
- DB schema: unchanged (`meal_plans.plan_data` JSONB still stores `{ days: [...] }`)
- Cache: unchanged (node-cache keys still `meal_{userId}_{weekStart}`)
- Frontend: only renders day cards for non-empty days
- Prompt: minimal change (constraint text + example)

**No new packages.**

### 3. Auto-Generate Plan on Page Visit
**What:** When visiting Activities or Food Log page and no plan exists, auto-trigger generation.

**Integration point:** Frontend `useEffect` in the page components.

**Current flow (v1.4):**
```
mount → GET /api/meal-plans → plan=null → show EmptyState with "Generate" button
```

**v1.5 target flow:**
```
mount → GET /api/meal-plans → plan=null → auto-call POST /api/meal-plans/generate → show spinner → show plan
```

**Backend:** No changes needed — existing `POST /api/weekly-plans/generate` and `POST /api/meal-plans/generate` work fine.

**Frontend changes:**
- `ActivitiesPage.jsx` or the merged plan component: after loading confirms no plan → call generate mutation
- `FoodLogPage.jsx` or the merged meal plan section: same pattern
- Rate-limit UX: if user hits rate limit on auto-generate, show the countdown display (already exists in `WeeklyPlanPage.jsx` and `MealPlanPage.jsx`)

**No new packages.**

### 4. Manual Regenerate Button Always Available
**What:** Even when a plan exists, the regenerate button is visible (not hidden behind expansion or state).

**Current:** Regenerate button is inside each expanded `DayCard` / `DayMealCard`.
**Target:** Regenerate button is always visible on the plan header, not nested inside expandable cards.

**Frontend only.** Moves the button from inside DayCard to the page-level header. No backend changes.

**No new packages.**

### 5. UI Route Merging

| Current Route | Target | Change |
|---------------|--------|--------|
| `/weekly-plan` | Merged into `/activities` | Remove route; render WeeklyPlanPage content as section inside ActivitiesPage |
| `/meal-plan` | Merged into `/food-log` | Remove route; render MealPlanPage content as section inside FoodLogPage |
| `/activities` | Contains activity log + plan section | Add plan cards after the activity pool |
| `/food-log` | Contains food log + meal plan section | Add meal plan cards after the calorie history |

**Architecture pattern:** Each merged component imports the other's sub-components and renders them in a new layout. Both pages share the same `weekStart` computation.

**Frontend changes only:**
- `Router.jsx` — remove `/weekly-plan` and `/meal-plan` route entries
- `ActivitiesPage.jsx` — import `WeeklyPlanPage` content (or a new `ActivityPlanSection` component) and render conditionally
- `FoodLogPage.jsx` — import `MealPlanPage` content (or `MealPlanSection`) and render conditionally
- The dashboard (`DashboardPlaceholder`) links update accordingly

**No new packages.**

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **TanStack React Query** for plan pages | Existing `useState` + `useEffect` patterns work fine for the single-page plan views; React Query's caching/refetch adds overhead without benefit | Plain `useState` + `useEffect` with api layer (current pattern) |
| **New npm packages** | Every feature in v1.5 maps to existing capabilities | Exising packages handle all needs |
| **New database tables** | `weekly_plans` and `meal_plans` tables suffice; `logged` tracking goes in existing `plan_data` JSONB | JSONB update of `logged: true` |
| **State management library** (Redux, Zustand, Jotai) | Two merged pages share no cross-cutting state; each page manages its own plan state | `useState` per page component |
| **Supabase Auth / RLS** | Server-side architecture; no direct client-database access | Existing Passport JWT + httpOnly cookies |
| **Supabase Realtime** | No real-time features needed — auto-generation is a simple fetch-on-mount | REST calls |
| **WebSockets / SSE** | Plan generation is request/response, not streaming | Regular HTTP POST |
| **Background job queue** (Bull, Bee-Queue) | Single-user generation per request is fast enough; 1-day generation reduces LLM response time | Synchronous request handler |
| **Redis** | node-cache with 1-hour TTL and 1000 maxKeys handles all caching needs at this scale | node-cache (existing) |
| **Separate meal-plan vs activity-plan LLM clients** | Both use same OpenRouter client from `llm.service.js` | Single `getClient()` singleton |
| **OR/M (Prisma, Drizzle, Knex)** | Repository pattern with raw pg works; adding ORM for JSONB updates adds migration complexity | Raw SQL with pg pool |

---

## Changes Summary (No New Packages)

### Backend: Files Modified

| File | Change | Pattern Follows |
|------|--------|-----------------|
| `backend/src/controllers/weeklyPlan.controller.js` | ADD `logDay` handler | `mealPlan.controller.js:logDay` |
| `backend/src/routes/weeklyPlan.routes.js` | ADD `POST /log-day` route | `mealPlan.routes.js:logDay` |
| `backend/src/middlewares/weeklyPlanRateLimiter.js` | ADD `logDayLimiter` export | `mealPlanRateLimiter.js:logDayLimiter` |
| `backend/src/repositories/activity.repository.js` | ADD `batchLogActivities()` method | `food.repository.js:batchLogItems` |
| `backend/src/services/mealPlan.service.js` | CHANGE validation for 1-day; modify prompt building | Self (existing pattern) |
| `backend/prompts/meal-plan-prompt.md` | CHANGE "7 consecutive days" → "1 day" | Update prompt template |
| `backend/src/services/llm.service.js` | No changes needed | N/A |
| `backend/src/app.js` | No changes needed (routes already registered) | N/A |

### Backend: Files Unchanged

| File | Why |
|------|-----|
| `backend/src/repositories/mealPlan.repository.js` | `findByUserAndWeek`, `upsertPlan`, `markItemsLogged` all work as-is |
| `backend/src/repositories/food.repository.js` | `batchLogItems` already handles transaction pattern |
| `backend/src/services/mealPlan.service.js:generateFallbackMealPlan()` | Can adapt or keep 7-day with single rendered day |
| `backend/src/config/database.js` | No connection changes |
| `backend/package.json` | No new dependencies |

### Frontend: Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/Router.jsx` | Remove `/weekly-plan` and `/meal-plan` routes; update dashboard links |
| `frontend/src/features/activities/components/ActivitiesPage.jsx` | Import and render `ActivityPlanSection` (from WeeklyPlanPage) after activity pool |
| `frontend/src/features/food-log/components/FoodLogPage.jsx` | Import and render `MealPlanSection` (from MealPlanPage) after food log |
| `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx` | Refactor into `ActivityPlanSection` export for embedding + standalone page (if kept) |
| `frontend/src/features/meal-plan/components/MealPlanPage.jsx` | Refactor into `MealPlanSection` export for embedding + standalone page |

### Frontend: New Components (if extracted)

| Component | Source | Target |
|-----------|--------|--------|
| `ActivityPlanSection.jsx` (recommended) | Extracted from `WeeklyPlanPage.jsx` | Embedded in `ActivitiesPage.jsx` |
| `MealPlanSection.jsx` (recommended) | Extracted from `MealPlanPage.jsx` | Embedded in `FoodLogPage.jsx` |

Extracting section components keeps the standalone pages working (`/weekly-plan`, `/meal-plan` routes) while enabling embedding. If routes are fully removed, inline the logic directly into the parent pages.

### Frontend: Files Unchanged

| File | Why |
|------|-----|
| `frontend/src/features/weekly-plan/components/DayCard.jsx` | Reused as-is in embedded section |
| `frontend/src/features/weekly-plan/components/DayActivityRow.jsx` | Reused as-is |
| `frontend/src/features/weekly-plan/components/RateLimitedButton.jsx` | Reused as-is |
| `frontend/src/features/weekly-plan/components/EmptyStatePlan.jsx` | Reused as-is |
| `frontend/src/features/meal-plan/components/DayMealCard.jsx` | Reused as-is in embedded section |
| `frontend/src/features/meal-plan/components/MealRow.jsx` | Reused as-is |
| `frontend/src/features/activities/components/ActivityLogForm.jsx` | Reused as-is |
| `frontend/src/features/activities/components/ActivitySummary.jsx` | Reused as-is |
| `frontend/src/features/food-log/components/FoodSearch.jsx` | Reused as-is |
| `frontend/src/features/food-log/components/FoodLogTable.jsx` | Reused as-is |
| `frontend/package.json` | No new dependencies |

---

## Integration Point Map

```
┌──────────────────────┐      POST /api/weekly-plans/log-day      ┌──────────────────┐
│  Weekly Plan Page    │ ──────────────────────────────────────→  │  activity_logs    │
│  (merged into        │    { weekStart, dayIndex }                │  table            │
│   Activities Page)   │ ←──────────────────────────────────────  │                  │
│                      │    { logged: N, items: [...] }           │  batchLogActivities│
└──────────────────────┘                                          └──────────────────┘

┌──────────────────────┐      POST /api/meal-plans/log-day         ┌──────────────────┐
│  Meal Plan Page      │ ──────────────────────────────────────→  │  food_logs        │
│  (merged into        │    { weekStart, dayIndex, mealType? }    │  table            │
│   Food Log Page)     │ ←──────────────────────────────────────  │                  │
│                      │    { logged: N, items: [...] }           │  batchLogItems    │
└──────────────────────┘                                          └──────────────────┘

┌──────────────────────┐      GET /api/meal-plans?weekStart=      ┌──────────────────┐
│  Auto-generate       │ → plan=null →                             │  mealPlan.service │
│  on page visit       │      POST /api/meal-plans/generate       │  .js (1-day gen)  │
│                      │                                           │                  │
│  (frontend only)     │      GET /api/weekly-plans?weekStart=    │  weeklyPlan.      │
│                      │ → plan=null →                             │  controller       │
│                      │      POST /api/weekly-plans/generate     │                   │
└──────────────────────┘                                          └──────────────────┘
```

---

## Database: No Schema Changes

The `weekly_plans` and `meal_plans` tables already exist. The `logged` tracking flag is stored in the existing `plan_data` JSONB column — same pattern as `mealPlans.repository.js:markItemsLogged()`.

For activity plans specifically, the JSONB structure changes slightly:
```json
// Before v1.5 (no logged tracking)
{
  "days": [{
    "date": "2026-06-01",
    "activities": [{
      "activity_id": 5,
      "name": "Running",
      "duration_min": 30,
      "intensity": "moderate"
    }]
  }]
}

// After v1.5 (with logged flag)
{
  "days": [{
    "date": "2026-06-01",
    "activities": [{
      "activity_id": 5,
      "name": "Running",
      "duration_min": 30,
      "intensity": "moderate",
      "logged": true          // NEW — tracks if logged to activity_logs
    }]
  }]
}
```

This is a soft schema change — no migration needed. Existing plans without `logged` field render with a "Log" button. New plans include `logged: false`.

---

## Prompt Change (Meal Plan: 7-Day → 1-Day)

**Current** (`meal-plan-prompt.md` line 113):
```
- Exactly 7 consecutive days starting from Monday of {{weekStartDate}}
```

**Target:**
```
- Exactly 1 day: today's date ({{todaysDate}})
```

**Also change example block** from showing 7 days to showing 1 day with correct "today" date matching the user's current date.

The `buildMealPlanPrompt()` function in `mealPlan.service.js` needs:
- Receive `todaysDate` parameter (in addition to `weekStart`)
- Pass it to the prompt template
- Reduce validation from 7-days to 1-day in `validateMealPlanStructure()`

---

## Testing Strategy

| Area | Tests | Tools |
|------|-------|-------|
| `batchLogActivities()` transaction | Jest — verify BEGIN/COMMIT/ROLLBACK on success and failure | Jest + pg-mem or test DB |
| Weekly plan `logDay` endpoint | Supertest — 200, 404 (no plan), 400 (bad input) | Jest + Supertest |
| 1-day meal plan generation | Unit — validateMealPlanStructure accepts 1 day | Jest |
| Merged UI components | Vitest — render ActivitiesPage with PlanSection embedded | Vitest + testing-library |
| Auto-generation trigger | Vitest — verify generate called on mount when plan=null | Vitest + testing-library |

---

## Installation

```bash
# No new npm packages required for v1.5
# Zero additions to package.json (backend or frontend)
```

---

## Sources

- **Existing codebase files** — HIGH confidence (all patterns verified via code inspection)
- `backend/src/controllers/mealPlan.controller.js` — `logDay` handler pattern — HIGH confidence
- `backend/src/repositories/food.repository.js` — `batchLogItems` transaction pattern — HIGH confidence
- `backend/src/repositories/mealPlan.repository.js` — `markItemsLogged` JSONB update pattern — HIGH confidence
- `backend/src/services/mealPlan.service.js` — 7-day meal plan generation — HIGH confidence (will modify)
- `backend/prompts/meal-plan-prompt.md` — 7-day prompt template — HIGH confidence (will modify)
- `frontend/src/app/Router.jsx` — current route definitions — HIGH confidence (will modify)
- `backend/package.json` — dependency manifest — HIGH confidence (no changes)
- `frontend/package.json` — dependency manifest — HIGH confidence (no changes)

---

*Stack research for: Fitness_App v1.5 Smart Auto-Logging*
*Researched: 2026-05-31*
