# Research Summary: v1.5 Smart Auto-Logging

**Project:** Fitness_App
**Milestone:** v1.5 Smart Auto-Logging
**Domain:** Health & Fitness — Auto-Logging of LLM-Generated Plans, Page Merges, Inline Management
**Researched:** 2026-05-31
**Confidence:** HIGH (overall)

---

## Executive Summary

Fitness_App v1.5 bridges the gap between "view your generated plan" and "live your plan." Currently, activity plans and meal plans live on separate pages from the actual logging tools (Activities page, Food Log page). Users must generate plans on one page, then manually log items on another. This release converges these into two unified pages, auto-generates plans on visit (no empty state), enables one-click logging from plan items with completed tracking, and shifts meal plans from 7-day to 1-day for higher daily relevance.

**The research recommends a zero-new-packages approach** — the existing React 19 + Express 5 + Supabase PostgreSQL + OpenRouter LLM stack handles every new feature through architectural changes alone. The core work splits into: (1) new database tables for daily meal plans and activity plan persistence, (2) new backend service files for daily meal generation and activity batch-logging, (3) frontend section extraction and route merging, and (4) auto-generation triggers with careful guard logic.

**The top risks** are: (A) **Double-logging** — every page visit could trigger log inserts if generation and logging aren't separated; (B) **Infinite regeneration loops** — if auto-generation fails, React effects can retry endlessly; (C) **State explosion** — naively merging two page components creates unmaintainable God components. All three are preventable with known patterns: separate sub-components with independent state, `useRef` one-shot guards, and a strict "generation creates `logged: false` items; only explicit user toggle inserts DB rows" policy.

**Key architectural decision made:** Create two new tables (`daily_meal_plans`, `activity_plans`) instead of modifying existing schemas. This isolates risk, preserves backward compatibility with v1.4 data, and enables gradual migration. "Select alternatives" for meal items is deferred to v1.6 to keep scope contained.

---

## Key Findings

### Stack Recommendations

**Zero new npm packages required.** Every v1.5 feature maps to existing capabilities in the current stack.

| Technology | Role in v1.5 | Why No Change Needed |
|------------|-------------|---------------------|
| React 19 + Vite 8 | Frontend rendering | Route merging follows existing component patterns; no version change needed |
| Express 5 ESM | Backend API | New `log-day` and `daily-meal-plans` endpoints follow existing controller/route patterns |
| Supabase PostgreSQL 17 | Database | Two new tables (`daily_meal_plans`, `activity_plans`); same `pg` driver + JSONB patterns |
| OpenRouter (OpenAI SDK) | LLM provider | Meal prompt switches from 7-day to 1-day; same SDK, same call pattern, fewer tokens |
| TanStack React Query | Data fetching | Not used on plan pages currently; plain `useState` + `useEffect` sufficient for single-page plan state |
| node-cache | In-memory caching | Key namespace change only (`plan_meal_` → `plan_daily_meal_`, `plan_activity_`); same TTL/maxKeys |
| react-router-dom | Client routing | Remove 2 routes, add 2 redirects; simpler routing tree |
| Jest + Vitest | Testing | New tests for batch-log endpoints, daily validation, merged component rendering |

**What NOT to add:**
- No ORMs (Prisma, Drizzle, Knex) — JSONB updates via raw pg is simpler
- No state management library (Redux, Zustand) — sub-components manage their own state
- No Supabase Auth/RLS — server-side Passport JWT remains
- No WebSockets/SSE — generation is request/response
- No Redis — node-cache with 1h TTL handles scale
- No background job queue — single-user generation is fast enough

**Required backend changes:**
- `activity.repository.js` — NEW `batchLogActivities()` (pattern: `food.repository.js:batchLogItems`)
- `weeklyPlan.controller.js` — NEW `logDay` handler (pattern: `mealPlan.controller.js:logDay`)
- `dailyMealPlan.service.js` — NEW file: 1-day generation, validation, fallback, per-meal regeneration
- `activityPlan.repository.js` — NEW file: CRUD for activity_plans table
- `meal-plan-prompt.md` — CHANGE "7 consecutive days" to "1 day"
- Rate limiters — ADD for new endpoints (follow existing patterns)

**Required frontend changes:**
- `ActivitiesPage.jsx` — IMPORT `ActivityPlanSection` component + auto-generation trigger
- `FoodLogPage.jsx` — IMPORT `MealPlanSection` component + auto-generation trigger
- `Router.jsx` — REMOVE `/weekly-plan`, `/meal-plan`; ADD redirects `/weekly-plan → /activities`
- `WeeklyPlanPage.jsx` — REFACTOR into `ActivityPlanSection` for embedding
- `MealPlanPage.jsx` — REFACTOR into `MealPlanSection` for embedding

---

### Feature Analysis

The 7 targets are grouped into three categories:

#### Category A: Auto-Save & Completed Tracking (Targets 1, 2)

| Feature | Status | Complexity |
|---------|--------|------------|
| Auto-save activity plan → activity_logs | **NEW** | MEDIUM |
| Auto-save meals → food_log with toggle | Builds on v1.4 `logDay` | MEDIUM |
| "Select alternatives" for meal items | **DEFERRED to v1.6** | HIGH (deferred) |
| Completed tracking via `logged` flag in plan_data JSONB | **NEW** (activity plan) | MEDIUM |

**State machine per day:** PENDING → LOGGING (spinner) → COMPLETED (green) → regenerate resets to PENDING.

**Critical rule:** Generation sets `logged: false` on every item. Only explicit user toggle inserts DB rows. Never auto-log during generation.

#### Category B: 1-Day Meal Plans & Auto-Generate (Targets 3, 4, 5)

| Feature | Status | Complexity |
|---------|--------|------------|
| 1-day meal plans (was 7-day) | **CHANGE** | HIGH (foundation) |
| Auto-generate plan on page visit | **NEW** | MEDIUM |
| Always-visible regenerate button | **CHANGE** | LOW |

**Table stakes users expect:**
- Plans auto-appear on page load (no "click Generate" empty state)
- One-click log from plan (see it → log it)
- Single-screen workflow (no page switching)
- Plan adapts to today (yesterday's meal plan is irrelevant)
- Always-available regenerate ("I don't like this suggestion")
- Completion tracking ("Did I do this already?")

**Differentiators:**
- Rate-limit-aware auto-generation (respects quota without confusing user)
- Unified activity + plan view (single page shows what you planned AND what you logged)
- Auto-calculated calorie adjustments when toggling items

#### Category C: Page Merges (Targets 6, 7)

| Feature | Status | Complexity |
|---------|--------|------------|
| Merge Activity Plan → Activities page | **CHANGE** | HIGH |
| Merge Meal Plan → Food Log page | **CHANGE** | HIGH |

**Recommendation: Section-based merge** (not tabs). Plan section appears as an inline section on the target page. This keeps everything visible on a single scroll, requires no tab state management, and allows acting on plan items without switching views.

**Anti-features (do not build):**
- ❌ Drag-and-drop meal planning — too complex for v1.5
- ❌ Auto-log without confirmation — user must own their diary
- ❌ Calendar view for plans — over-engineered for mobile-first
- ❌ Fitness goal auto-adjustment from completed plans — v2+ scope

---

### Architecture Changes

#### Current Architecture (v1.4)

```
Frontend Routes (4 separate pages):
  /activities     → ActivitiesPage   (manual activity log + recommendations)
  /weekly-plan    → WeeklyPlanPage   (LLM activity plan, 7 days, cache-only)
  /food-log       → FoodLogPage      (manual food log + search)
  /meal-plan      → MealPlanPage     (LLM meal plan, 7 days, DB persisted)
```

#### Target Architecture (v1.5)

```
Frontend Routes (2 unified pages):
  /activities     → ActivitiesPage   (recommendations + auto-generated plan + log)
  /food-log       → FoodLogPage      (food search + auto-generated meals + log)

Backend:
  daily_meal_plans table   (NEW — 1-day generation, single-day key)
  activity_plans table     (NEW — persistence for auto-log tracking)
  weekly_plans             (KEPT — read-compatible for archive, no new writes)
  meal_plans               (KEPT — read-compatible, no new writes)
```

#### Major Components

| Component | Responsibility |
|-----------|---------------|
| `ActivityPlanSection` (NEW) | Extracted from `WeeklyPlanPage`; shows today's generated activities with inline log toggles |
| `MealPlanSection` (NEW) | Extracted from `MealPlanPage`; shows today's meals with per-item log/regenerate |
| `dailyMealPlan.service.js` (NEW) | 1-day generation pipeline, validation, fallback, per-meal regeneration |
| `activityPlan.repository.js` (NEW) | CRUD for activity_plans table; `markActivitiesLogged` for JSONB flag updates |
| `activityPlan.controller.js` (NEW) | Handlers: generate, get, log-activities for activity plans |
| `dailyMealPlan.controller.js` (NEW) | Handlers: generate, get, log-meals, regenerate-meal |

#### Key Data Flows

**Activity Plan (NEW persistence + auto-log):**
```
Page mount → GET /api/activity-plans?date=today → null → auto-trigger POST generate
  → LLM returns 1-day plan → stored in activity_plans (DB) + node-cache
  → User toggles activity "completed" → POST /api/activity-plans/log-activities
    → batch inserts to activity_logs table → marks logged=true in plan_data JSONB
```

**Meal Plan (1-day generation):**
```
Page mount → GET /api/daily-meal-plans?date=today → null → auto-trigger POST generate
  → LLM returns 1-day, 4-meal plan → stored in daily_meal_plans (DB) + cache
  → User clicks "Log Breakfast" → POST log-meals { date, mealType }
    → batchLogItems to food_logs → markItemsLogged in plan_data
```

#### Integration Point Map

```
ActivitiesPage (merged)
├── ActivitySummary (existing)
├── ActivityPlanSection (NEW) ← auto-gen, inline toggle, always-visible regenerate
└── Activity Logging (existing: log form, pool, history)

FoodLogPage (merged)
├── CalorieSummary (existing)
├── MealPlanSection (NEW) ← auto-gen, per-meal log, always-visible regenerate
└── Food Logging (existing: search, log table, history)
```

---

### Critical Pitfalls & Mitigations

#### Top 5 Risks

1. **DOUBLE-LOGGING ON EVERY VISIT** (Critical)
   - *What:* Auto-generation triggers logging to DB on every page load
   - *Why:* Ambiguity between "auto-save as DB row" vs "auto-save as UI pre-fill"
   - *Prevention:* **Separate generation from logging.** Generation sets `logged: false` on all items. Only explicit user toggle calls the log endpoint. Never auto-insert to `food_logs`/`activity_logs` during generation.

2. **INFINITE REGENERATION LOOP** (Critical)
   - *What:* Auto-gen fails → state remains "no plan" → effect re-fires → endless API calls
   - *Prevention:* Use `useRef` one-shot guard (`autoGenAttempted.current`) that persists across renders. After a failed auto-gen, show manual "Retry" — never auto-retry.

3. **STATE EXPLOSION IN MERGED PAGES** (Critical)
   - *What:* Merging two pages creates 15+ state variables in one component
   - *Prevention:* **Keep sub-components independent.** Use `TodayActivityPlan.jsx` and `TodayMealPlan.jsx` as self-contained components with their own state. Extract plan logic into `useActivityPlan()` / `useMealPlan()` custom hooks. The container page only passes shared context (selected date).

4. **RATE LIMITER STACKING — AUTO-GEN CONSUMES USER QUOTA** (Critical)
   - *What:* Auto-gen on page visit consumes the same rate limit bucket as manual regenerate
   - *Prevention:* Auto-gen only when absolutely needed (no plan exists at all). Don't auto-gen if a plan exists (even stale). Use stricter limiter for auto-triggered requests (header-based: `x-auto-gen: true`).

5. **WEEKLY-TO-DAILY MIGRATION GAP** (High)
   - *What:* Existing `meal_plans` table uses `(user_id, week_start)` UNIQUE — incompatible with daily generation
   - *Prevention:* **Create separate `daily_meal_plans` table** with `UNIQUE(user_id, date)`. Leave old table untouched. No migration of existing data needed. New code reads/writes new table; old code remains functional during transition.

#### Phase-Specific Warnings

| Phase | Pitfall | Prevention |
|-------|---------|------------|
| Daily Meal Plan | Schema collision with weekly plans | New table, don't modify existing |
| Activity Plan Log | No `logged` flag in plan_data (currently absent) | Add `logged: boolean` to activity plan items; create `markActivitiesLogged()` |
| Page Merge | ProfileGuard mismatch (missing on activities route) | Add ProfileGuard to merged route or show prompt banner |
| Auto-Gen on Visit | Auto-gen fires when user just wants to log | Debounce 2s; cancel if user interacts with log section |
| Completed Toggle | Manual log + toggle create duplicates | Cross-reference plan items with already-logged entries |

---

## Implications for Roadmap

### Phase Structure (6 Phases Recommended)

The build order follows a strict dependency chain: daily meal foundation → activity plan persistence → auto-log endpoints → frontend merges.

#### Phase 1: Foundation — Daily Meal Plan Service
**Rationale:** The shift from 7-day to 1-day meal generation is the most invasive change. Everything else (auto-generation, auto-save, merging) builds on it. Getting this right unblocks all other work.
**Delivers:** New `daily_meal_plans` DB table, `dailyMealPlan.service.js` (generate, validate, fallback, per-meal regenerate), new prompt file, new controller/routes/rate-limiters.
**Addresses:** Target 3 (1-day meal plans)
**Avoids:** Pitfall 7 (weekly-to-daily migration gap) — new table isolates risk
**Risk:** MEDIUM — new code path but follows existing `mealPlan.service.js` pattern exactly
**Test target:** 10-12 backend tests (validation, fallback, regeneration)

#### Phase 2: Persistence — Activity Plan DB Storage
**Rationale:** Activity plans are currently cache-only (node-cache). v1.5 needs DB persistence for `logged` flags that survive cache eviction and page refreshes.
**Delivers:** `activity_plans` DB table, `activityPlan.repository.js`, `activityPlan.service.js`.
**Addresses:** Foundation for Target 1 (auto-save activity plans)
**Avoids:** Pitfall 8 (completed toggle disappears on refresh)
**Risk:** LOW — mirrors existing `mealPlan.repository.js` pattern
**Test target:** 5-8 backend tests (DB read/write, upsert)

#### Phase 3: Logging — Batch Activity Log + Meal Log Extensions
**Rationale:** Needs Phases 1-2 for persistence. Adds the actual auto-log endpoints.
**Delivers:** `POST /api/activity-plans/log-activities` (batch insert + capacity recalculation), `POST /api/daily-meal-plans/log-meals` (extend existing meal log), `POST /api/daily-meal-plans/regenerate-meal`.
**Addresses:** Targets 1 (activity auto-save), 2 (meal auto-save with completed toggle)
**Avoids:** Pitfall 1 (double-logging) — generation creates `logged: false`; only toggle inserts rows
**Risk:** MEDIUM — transaction patterns exist but need careful idempotency
**Test target:** 10-12 backend tests (transaction rollback, idempotency, duplicate prevention)

#### Phase 4: Frontend — Merge Activity Plan into Activities Page
**Rationale:** Phase 3 provides the backend endpoint for the inline completed toggle. Pattern established here is reused for Food Log merge.
**Delivers:** `TodayActivityPlan.jsx`, `ActivityPlanCard.jsx` components; modified `ActivitiesPage.jsx` with plan section; removed `/weekly-plan` route + redirect.
**Addresses:** Target 6 (merge Activity Plan), Target 5 (always-visible regenerate)
**Avoids:** Pitfall 5 (state explosion) — sub-component with own state, not merged into parent
**Risk:** MEDIUM — refactoring working page requires careful preservation
**Test target:** 8-10 frontend tests (section rendering, auto-gen trigger, toggle integration)

#### Phase 5: Frontend — Merge Meal Plan into Food Log Page
**Rationale:** Follows Phase 4 pattern. Daily meal backend exists from Phase 1.
**Delivers:** `TodayMealPlan.jsx`, `MealPlanItem.jsx` components; modified `FoodLogPage.jsx` with meal plan section; removed `/meal-plan` route + redirect.
**Addresses:** Target 7 (merge Meal Plan), Target 4 (auto-generate on visit), Target 5 (always-visible regenerate)
**Avoids:** Pitfall 4 (routing breakage) — redirect routes; Pitfall 11 (ProfileGuard) — check guard placement
**Risk:** MEDIUM — follows Phase 4 pattern, lower risk
**Test target:** 8-10 frontend tests (section rendering, per-meal log, auto-gen trigger)

#### Phase 6: Polish & Rate Limit Tuning
**Rationale:** Non-functional improvements and cleanup after all features work.
**Delivers:** Tuned rate limits (auto-gen vs manual buckets), dead code removal, cache key namespace verification, README update.
**Addresses:** Target 5 (rate-limit UX for always-visible regenerate)
**Avoids:** Pitfall 9 (rate limiter stacking) — separate auto-gen limiter from manual; Pitfall 18 (test debt)
**Risk:** LOW
**Test target:** Audit existing tests pass; verify rate limiter isolation

### Phase Ordering Rationale

1. **Daily meal plan first** because it's the foundational schema change — get the DB right before building on it
2. **Activity plan persistence second** because it's low-risk (pattern duplication) and unblocks auto-log
3. **Backend logging endpoints third** because frontend merges depend on them
4. **Activity merge before meal merge** because the activity plan is simpler (no per-meal regeneration)
5. **Meal merge follows the same pattern** as activity merge, reducing risk
6. **Polish last** — rate limiting, cleanup, and docs after all features are stable

### Research Flags

| Phase | Needs Research? | Reason |
|-------|----------------|--------|
| Phase 1 (Daily Meal Service) | **Standard patterns** | Direct mirror of existing `mealPlan.service.js` — well-documented |
| Phase 2 (Activity Plan Persistence) | **Standard patterns** | Mirror of `mealPlan.repository.js` — well-documented |
| Phase 3 (Logging Endpoints) | **Caution: auto-gen rate limit** | Need to verify header-based rate limiter separation (`x-auto-gen: true`) — `/gsd-research-phase` on rate limiter design |
| Phase 4 (Activity Merge) | **Standard patterns** | Section extraction pattern is React best practice |
| Phase 5 (Meal Merge) | **Caution: ProfileGuard** | Need to verify guard placement for merged route — `/gsd-research-phase` on routing security |
| Phase 6 (Polish) | **Standard patterns** | Cleanup and rate limit tuning |

### Items Deferred to v1.6

| Feature | Reason |
|---------|--------|
| "Select alternatives" for meal items | Significant UI complexity, new endpoint, LLM prompt changes — risks scope creep |
| Un-log / undo completed toggle | Adds delete/rollback logic to food_logs — edge cases need design |
| Auto-calculated portion adjustment for alternatives | Depends on alternatives feature |
| Meal plan week-overview (what's for dinner this week) | Anti-pattern for daily generation — revisit if users request it |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Zero new packages — all patterns verified via code inspection in STACK.md. 18 package.json files checked, 30+ existing patterns mapped |
| **Features** | HIGH | Based on existing v1.3 (activity plan) and v1.4 (meal plan) implementations. All 7 targets have clear current/desired state mapping. "Select alternatives" flagged as HIGH complexity — deferred |
| **Architecture** | HIGH | Complete codebase analysis of current architecture. Integration points (controllers, routes, repositories, services, cache) mapped in detail. 6-phase build order with dependency justification |
| **Pitfalls** | HIGH | 20 pitfalls documented (4 critical, 11 moderate, 5 minor). Each has prevention strategy rooted in existing code patterns. Top 5 have both detection and prevention |
| **Overall** | **HIGH** | All four research files reached HIGH confidence independently. Convergent recommendations across files (zero new packages, section-based merging, new tables instead of schema changes, defer alternatives) |

### Gaps to Address

| Gap | How to Handle |
|-----|---------------|
| **Rate limiter separation for auto-gen vs manual gen** | Needs planning-level design. Current `express-rate-limit` instances key by user ID; adding header-based (`x-auto-gen: true`) differentiation needs verification. Flagged for Phase 3 research |
| **ProfileGuard placement after merge** | `/activities` and `/food-log` currently lack ProfileGuard. Plan generation requires user profile (BMI, goals). Need to decide: add ProfileGuard to merged route, or show inline prompt. Flagged for Phase 5 research |
| **`logged` flag migration for existing plans** | Existing weekly plans lack `logged` flags. Soft migration: treat missing `logged` as `logged: false`. New plans include `logged: false` by default. No schema migration needed |
| **Cache key collision between old weekly and new daily keys** | Low risk — existing keys use `plan_meal_` prefix, new keys use `plan_daily_meal_` and `plan_activity_`. Verify during Phase 6 |
| **LLM token cost comparison (7-day vs 1-day)** | Weekly meal plans cost ~2K tokens; daily estimated ~300-500. Monitor OpenRouter logs after Phase 1 deployment to validate cost reduction |

---

## Sources

### Primary (HIGH confidence)
- **Existing codebase**: `mealPlan.controller.js` — `logDay` handler pattern
- **Existing codebase**: `food.repository.js` — `batchLogItems` transaction pattern
- **Existing codebase**: `mealPlan.repository.js` — `markItemsLogged` JSONB update pattern
- **Existing codebase**: `mealPlan.service.js` — meal generation pipeline
- **Existing codebase**: `WeeklyPlanPage.jsx` — frontend state machine for plan generation
- **Existing codebase**: `MealPlanPage.jsx` — frontend logging + regenerate UX
- **Existing codebase**: `ActivitiesPage.jsx` — activity logging with history and summary
- **Existing codebase**: `FoodLogPage.jsx` — food logging with ingredient search
- **Existing codebase**: `Router.jsx` — route definitions, ProfileGuard placement
- **Existing codebase**: `add_meal_plans.sql`, `schema.sql` — DB schema and constraints
- **Existing codebase**: `activity.repository.js` — activity log CRUD patterns
- **Existing codebase**: `package.json` (backend + frontend) — dependency manifests (no changes)

### Secondary (MEDIUM confidence)
- No external sources needed — all patterns exist in the current codebase

---

*Research completed: 2026-05-31*
*Ready for roadmap: yes*
