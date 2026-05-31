# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-31 (v1.3 archived)
**Phases:** 17 complete (v1.0 + v1.1 + v1.2 + v1.3)
**Milestones:** 4 shipped (v1.0, v1.1, v1.2, v1.3)

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-05-17)
- ✅ **v1.1 International Ingredient Logging** — Phases 6-8 (shipped 2026-05-18)
- ✅ **v1.2 Supabase Migration** — Phases 9-12 (shipped 2026-05-28)
- ✅ **v1.3 Activity Tracking & Smart Suggestions** — Phases 13-17 (shipped 2026-05-31)
- 🚧 **v1.4 LLM Food Recommendations** — Phases 18-23 (planning)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-05-17</summary>

- [x] Phase 1: Foundation & Authentication (3/3 plans) — completed 2026-05-17
- [x] Phase 2: Profile & BMI Calculator (2/2 plans) — completed 2026-05-17
- [x] Phase 3: TDEE Calculator & Goals (2/2 plans) — completed 2026-05-17
- [x] Phase 4: Food Database & Calorie Logging (3/3 plans) — completed 2026-05-17
- [x] Phase 5: Activity Recommendations & Polish (4/4 plans) — completed 2026-05-17

</details>

<details>
<summary>✅ v1.1 International Ingredient Logging (Phases 6-8) — SHIPPED 2026-05-18</summary>

- [x] Phase 6: International Ingredient Database (3/3 plans) — completed 2026-05-18
- [x] Phase 7: Ingredient Logging & Calorie Calculation (3/3 plans) — completed 2026-05-18
- [x] Phase 8: English UI Migration (3/3 plans) — completed 2026-05-18

</details>

<details>
<summary>✅ v1.2 Supabase Migration (Phases 9-12) — SHIPPED 2026-05-28</summary>

- [x] Phase 9: Supabase Setup & Schema Migration — completed 2026-05-27
- [x] Phase 10: Backend Query Rewrite — completed 2026-05-28
- [x] Phase 11: Docker Restructure — completed 2026-05-28
- [x] Phase 12: Testing & Validation — completed 2026-05-28

</details>

<details>
<summary>✅ v1.3 Activity Tracking & Smart Suggestions (Phases 13-17) — SHIPPED 2026-05-31</summary>

- [x] Phase 13: Database Schema & Foundation (1/1 plan) — completed 2026-05-29
- [x] Phase 14: Activity Logger (1/1 plan) — completed 2026-05-29
- [x] Phase 15: LLM Backend Integration (3/3 plans) — completed 2026-05-29
- [x] Phase 16: Weekly Plan Frontend (3/3 plans) — completed 2026-05-30
- [x] Phase 17: Testing & Polish (1/1 plan) — completed 2026-05-31

</details>

<details open>
<summary>🚧 v1.4 LLM Food Recommendations (Phases 18-23) — PLANNING</summary>

- [ ] **Phase 18: Database & Prompt Foundation** — meal_plans table migration and LLM prompt files for meal generation
- [ ] **Phase 19: Core Meal Plan Service** — LLM generation, validation pipeline, fuzzy matching, calorie recalculation, fallback plan, day regeneration
- [ ] **Phase 20: Batch Log Integration** — one-click food diary logging with atomic PostgreSQL transactions
- [ ] **Phase 21: Backend API Layer** — controllers, routes, rate limiting middleware
- [ ] **Phase 22: Meal Plan Frontend** — day-by-day view, meal cards, log buttons, visual indicators, state machine
- [ ] **Phase 23: Testing & Edge Cases** — backend + frontend tests, prompt QA, edge case coverage

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 3/3 | Complete | 2026-05-17 |
| 2. Profile & BMI Calculator | v1.0 | 2/2 | Complete | 2026-05-17 |
| 3. TDEE Calculator & Goals | v1.0 | 2/2 | Complete | 2026-05-17 |
| 4. Food Database & Calorie Logging | v1.0 | 3/3 | Complete | 2026-05-17 |
| 5. Activity Recommendations & Polish | v1.0 | 4/4 | Complete | 2026-05-17 |
| 6. International Ingredient Database | v1.1 | 3/3 | Complete | 2026-05-18 |
| 7. Ingredient Logging & Calorie Calculation | v1.1 | 3/3 | Complete | 2026-05-18 |
| 8. English UI Migration | v1.1 | 3/3 | Complete | 2026-05-18 |
| 9. Supabase Setup & Schema Migration | v1.2 | 1/1 | Complete | 2026-05-27 |
| 10. Backend Query Rewrite | v1.2 | 1/1 | Complete | 2026-05-28 |
| 11. Docker Restructure | v1.2 | 1/1 | Complete | 2026-05-28 |
| 12. Testing & Validation | v1.2 | 1/1 | Complete | 2026-05-28 |
| 13. Database Schema & Foundation | v1.3 | 1/1 | Complete | 2026-05-29 |
| 14. Activity Logger | v1.3 | 1/1 | Complete | 2026-05-29 |
| 15. LLM Backend Integration | v1.3 | 3/3 | Complete | 2026-05-29 |
| 16. Weekly Plan Frontend | v1.3 | 3/3 | Complete | 2026-05-30 |
| 17. Testing & Polish | v1.3 | 1/1 | Complete | 2026-05-31 |
| 18. Database & Prompt Foundation | v1.4 | 0/0 | Not started | - |
| 19. Core Meal Plan Service | v1.4 | 0/0 | Not started | - |
| 20. Batch Log Integration | v1.4 | 0/0 | Not started | - |
| 21. Backend API Layer | v1.4 | 0/0 | Not started | - |
| 22. Meal Plan Frontend | v1.4 | 0/0 | Not started | - |
| 23. Testing & Edge Cases | v1.4 | 0/0 | Not started | - |

---

## Phase Details

### Phase 18: Database & Prompt Foundation
**Goal**: The `meal_plans` database table and LLM prompt files exist and are ready for service layer consumption.
**Depends on**: Nothing
**Requirements**: None (infrastructure prerequisite)
**Success Criteria** (what must be TRUE):
  1. The `meal_plans` table exists with columns: `id`, `user_id`, `week_start`, `plan_data` (JSONB), `status`, `created_at`, `updated_at` — mirrors `weekly_plans` schema exactly
  2. The migration SQL is idempotent — can be run multiple times without error
  3. The `meal-plan-prompt.md` system prompt constrains the LLM to use only foods from the existing database, with explicit delimiters and a full week's few-shot example
  4. The `meal-correction-prompt.md` provides structured recovery instructions for validation failures
**Plans**: TBD

### Phase 19: Core Meal Plan Service
**Goal**: The LLM generates valid, calorie-targeted weekly meal plans using only real database ingredients, with fallback when the LLM is unavailable.
**Depends on**: Phase 18
**Requirements**: REQ-MEAL-GENERATE, REQ-MEAL-REGENERATE, REQ-MEAL-FALLBACK
**Success Criteria** (what must be TRUE):
  1. User can trigger generation and receive a 7-day meal plan with 4 meals per day (breakfast, lunch, dinner, snack) — all items reference real `food_ids` from the food database
  2. LLM-hallucinated food names are handled gracefully: fuzzy matching (exact → case-insensitive → substring → Levenshtein ≤ 3) fixes names where possible; unmatchable items are removed rather than failing the whole plan
  3. Daily calorie totals are within 80-120% of the user's calorie target, recalculated server-side from `calories_per_100g × portion / 100` — never trusts LLM arithmetic
  4. When the LLM is unreachable or fails validation after 2-attempt correction loop, a template-based fallback plan is returned with 6-8 diverse ingredients (2 proteins, 2 carbs, 2 vegetables, 1 fruit, 1 dairy) distributed across 4 meals
  5. User can regenerate any single day without regenerating the full week — the fresh day is merged into the existing plan at the same day index
**Plans**: TBD

### Phase 20: Batch Log Integration
**Goal**: Users can log recommended meals to their food diary in one click, with atomic PostgreSQL transactions preventing partial commits.
**Depends on**: Phase 18
**Requirements**: REQ-MEAL-LOG, REQ-MEAL-PERMEAL
**Success Criteria** (what must be TRUE):
  1. User can log all unlogged items for a full day with one click — inserts 4-8 `food_log` rows in a single atomic transaction
  2. User can log a single meal type (e.g., just "breakfast") without committing the entire day's items
  3. If any insert fails during batch logging, ALL inserts roll back (explicit BEGIN/COMMIT/ROLLBACK) — no partial commits
  4. Already-logged items are skipped on repeat requests (server-side idempotency check against `logged: true` in plan_data JSONB)
  5. Calories are recalculated server-side from stored `calories_per_100g × portion / 100` — never uses LLM-provided calorie values
**Plans**: TBD

### Phase 21: Backend API Layer
**Goal**: The meal plan feature has fully operational REST endpoints with rate limiting, following the established weeklyPlan controller pattern.
**Depends on**: Phase 19, Phase 20
**Requirements**: REQ-MEAL-RATELIMIT
**Success Criteria** (what must be TRUE):
  1. `POST /api/meal-plans/generate` triggers meal plan generation and returns the plan (or fallback) with status indicator
  2. `POST /api/meal-plans/regenerate-day { weekStart, dayIndex }` replaces a single day in an existing plan and returns the updated day
  3. `POST /api/meal-plans/log-day { weekStart, dayIndex, mealType? }` logs items to food diary and updates plan_data logged flags
  4. `GET /api/meal-plans?weekStart=YYYY-MM-DD` returns an existing cached/persisted plan
  5. Rate limiting is enforced: generate (5/15min), regenerate (3/30min), log-day (30/15min) — each returns HTTP 429 with `Retry-After` header when exceeded
**Plans**: TBD

### Phase 22: Meal Plan Frontend
**Goal**: Users can view, interact with, and log their generated meal plans from the web UI with a full state machine experience.
**Depends on**: Phase 21
**Requirements**: REQ-MEAL-VIEW, REQ-MEAL-INDICATORS
**Success Criteria** (what must be TRUE):
  1. User can navigate to the meal plan page and see the correct state: loading → empty (with generate button) → generating (with spinner) → active plan (day cards) or fallback banner
  2. Day-by-day view shows 7 expandable day cards — current day is expanded by default, showing 3-4 meal rows with ingredient name, portion (grams), and calories
  3. Food items already logged to today's food diary display a green checkmark; unlogged items show gray — color-coding matches the indicator requirement
  4. User can click "Log this Day" or "Log [Meal Type]" buttons to batch-log items — buttons show loading state during the request and disable after successful click
  5. User can click "Regenerate Day" on any day card, with rate-limit countdown display (reuses shared `RateLimitedButton` component from weekly-plan feature)
**Plans**: TBD
**UI hint**: yes

### Phase 23: Testing & Edge Cases
**Goal**: All meal plan functionality is validated through automated tests and manual prompt QA.
**Depends on**: Phase 19, Phase 20, Phase 21, Phase 22
**Requirements**: None (validation phase)
**Success Criteria** (what must be TRUE):
  1. Backend service tests pass (Jest, ~20 tests): validation pipeline, fuzzy matching edge cases (exact, case-insensitive, substring, Levenshtein), calorie recalculation, transaction rollback, fallback plan generation, rate limiter behavior
  2. Frontend component tests pass (Vitest, ~10 tests): state machine transitions, DayMealCard expand/collapse, MealRow log status rendering, button loading/disabled states, empty/fallback banners
  3. Manual prompt QA confirms 5+ real LLM generations produce usable plans against the current free-tier model — hallucination rate < 30% before correction loop
  4. Edge cases handled gracefully: empty food database, user with no custom foods, consecutive rapid generation requests, rapid log-then-regenerate sequence, double-click on log buttons
**Plans**: TBD

---

*Roadmap created: 2026-05-17*
*Last updated: 2026-05-31 (v1.4 added)*
