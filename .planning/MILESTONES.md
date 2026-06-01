# Milestones

## v1.9 Progress Tracking (Shipped: 2026-06-01)

**Phases completed:** 5 phases (42-46), 6 plans

**Key accomplishments:**

- Database schema: `weight_logs` table with UNIQUE(user_id, logged_date), target_weight_kg/target_date on profiles, backfill migration
- Weight logging API with CRUD, auto-log on profile update (UPSERT), goal validation (2-300kg, date >= today, direction match)
- Frontend: weight entry form, history table with delete, goal fields in profile form
- Weight Trend Chart: Recharts LineChart with goal reference line, 30/60/90 day date range filter, all state handling
- Progress Dashboard: /progress route with nav link, coordinated sub-components with refreshKey
- Trend Prediction: OLS linear regression hook, TrendPredictionCard with 7 states (loading/error/empty/insufficient/no-goal/normal/stable), color-coded status (green/amber/red)

**Test results:** 171/175 frontend tests passing (4 pre-existing integration test failures — profile 500 errors and calorieTarget type issues)

**Known deferred items at close:** 37 (see STATE.md Deferred Items)

---

**Phases completed:** 8 phases, 23 plans, 28 tasks

**Key accomplishments:**

- Docker Compose MySQL 8.4 infrastructure, user table with PDP consent, ESM backend with mysql2 connection pool, and repository pattern with parameterized queries
- Complete auth backend with email/password registration and login, Google OAuth via Passport, JWT session management using httpOnly cookies, PDP consent enforcement, and Express app with security middleware
- Plan:
- Profiles table with FK to users, profile CRUD repository, BMI calculation service using Asian-Pacific cutoffs, and /api/profile routes with auth + rate limiting
- Profile form with Zod validation, color-coded BMI result display, Indonesian translations, and first-login redirect guard
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Updated foods table ENUM to 8 English categories and replaced 105 Indonesian foods with 201 international ingredients across all categories
- Updated VALID_CATEGORIES constant from 7 Indonesian values to 8 English values matching the init.sql ENUM migration, while preserving Indonesian validation error messages for Phase 8 UI migration.
- FoodSearch component categoryLabels mapping updated from 7 Indonesian keys to 8 English keys matching the new ingredient database ENUM
- Live calorie preview on food logging page with real-time calculation as user enters weight, backed by 12 unit tests and verified end-to-end server-side calculation flow
- Custom ingredient form reduced to name + calories per 100g only, with backend auto-assigning 'other' category (LOG-09)
- Extended recent foods with last logged portion for quick-add pre-fill; verified daily calorie summary correctly aggregates ingredient-based entries (CALC-01, CALC-02)
- All 123 Indonesian translation values in translations.js replaced with English equivalents across 8 sections (app, auth, validation, profile, bmi, tdee, foodLog, activities), with 'kcal' replacing 'kkal' per D-21
- All hardcoded 'kkal' replaced with 'kcal', all hardcoded Indonesian strings replaced with English across 6 frontend components and 3 backend service files; VALID_MEAL_TYPES updated to English values per D-18
- food_logs.meal_type ENUM migrated from Indonesian (sarapan, makan_siang, makan_malam, camilan) to English (breakfast, lunch, dinner, snack) with 3-step migration script in init.sql

---

## v1.3 Activity Tracking & Smart Suggestions (Shipped: 2026-05-31)

**Phases completed:** 5 phases, 9 plans

**Key accomplishments:**

- Activity Logger with full CRUD: log, list, delete, daily summary with net calorie calculation
- LLM Integration via OpenRouter with prompt templates, output validation, in-memory + DB caching, rate limiting (5 req/15min)
- Weekly Plan Frontend with day-by-day cards, single-day regeneration, rate-limit countdown UX
- 260/260 tests passing (backend 134, frontend 126)
- Comprehensive test suite: 14 Activity Logger integration tests, 39 LLM unit tests, 10 frontend component test files

**Known deferred items at close:** 25 (see STATE.md Deferred Items)

---

## v1.8 UI Consolidation (Completed: 2026-06-01)

**Phases completed:** 4 phases (38-41)

**Key accomplishments:**

- Route cleanup — `/meal-calendar` redirect, nav updates, CalendarPageLayout `defaultDay` prop
- Food Log page merge — Meal Calendar integrated with tabs (Plan/Log), date-awareness, summary bar on both tabs
- Activity page merge — Activity Calendar integrated with tabs (Plan/Log), summary bar on both tabs, dead code removal
- Test restructuring — page-level tests updated, all 33 shared calendar tests passing, full suite green

---
