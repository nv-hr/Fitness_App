---
title: "Architecture"
last_updated: "2026-05-31"
focus: arch
---

# ARCHITECTURE.md — System Architecture

## Overview

Fitness_App is a full-stack web application with a React 19 frontend (Vite 8 SPA), Express 5 API backend (ESM), and Supabase PostgreSQL database. The architecture follows a layered backend pattern and a feature-module frontend pattern.

## Architectural Pattern

- **Backend**: Layered architecture — Routes → Controllers → Services → Repositories → Database (pg driver).
- **Frontend**: Feature-module architecture — each feature (auth, food-log, activities, profile) is isolated under `src/features/`.
- **Auth**: httpOnly JWT cookie with Passport.js (local strategy for email/password + Google OAuth).

## Layers

| Layer | Components |
|-------|-----------|
| UI | React 19 SPA, Vite 8, React Router 7, TanStack React Query, React Hook Form, Zod |
| API | Express 5 REST API (ESM), routes/controllers/services/repositories pattern |
| Auth | Passport.js (JWT + Google OAuth), httpOnly cookies, bcrypt password hashing |
| LLM | OpenRouter API (OpenAI SDK), OpenAI SDK, node-cache for in-memory plan caching |
| Data | Supabase PostgreSQL 17, pg driver (no ORM), node-pg-migrate |

## Data Flow

### Weekly Plan Generation (LLM)
1. User POSTs to `/api/weekly-plans/generate`
2. Controller fetches user profile, activity history (30 days), and available activities via injected dependencies
3. `llm.service.js` builds a prompt with user stats + history + activity pool
4. OpenAI SDK sends chat completion to OpenRouter API (primary model with fallback)
5. LLM returns a structured 7-day JSON plan
6. Plan is upserted to `weekly_plans` table (JSONB) AND cached in-memory via node-cache
7. GET `/api/weekly-plans` returns from in-memory cache (no DB hit) with `fromCache: true` flag

### Activity Logging
1. User POSTs to `/api/activities/log` with `{ activityId, durationMin, intensity, loggedDate? }`
2. Server fetches activity definition, calculates calories burned using intensity multiplier
3. Intensity multipliers (server-authoritative): light=0.7, moderate=1.0, vigorous=1.3
4. Creates entry in `activity_logs` table
5. GET `/api/activities/summary` merges activity + food data for net calorie calculation

### Daily Meal Plan Generation (LLM)
1. User visits `/food-log` page → frontend auto-triggers `GET /api/daily-meal-plans?date=today`
2. If no plan exists (`plan: null`), frontend auto-triggers `POST /api/daily-meal-plans/generate`
3. Controller fetches user profile (calorie target), food database (up to 200 ingredients), and food log history
4. `dailyMealPlan.service.js` builds a 1-day meal prompt via `buildPrompt('daily-mp-prompt.md')`
5. OpenAI SDK sends chat completion to OpenRouter API with correction loop:
   - Attempt 1: Generate → validate structure (1 day × 4 meals, dates, 1-4 items/meal) → validate food names
   - Attempt 2: Correction prompt with specific errors → if still fails, fall back to template
6. Fuzzy matching cascade (in `food.js`): exact match → case-insensitive/substring → Levenshtein distance ≤ 3
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

## Abstractions

- **Controllers** — Thin request/response handlers (no business logic)
- **Services** — Business logic, validation, calculation (BMI, TDEE, activity calories, LLM prompt building)
- **Repositories** — Database queries (pg driver, raw SQL, parameterized queries)
- **Middlewares** — `authenticateToken` (JWT verification), `validate` (Zod schemas), rate limiters
- **Utils** — `AppError` class, `successResponse`/`errorResponse` helpers

## Entry Points

- **Backend**: `backend/src/index.js` — Express app bootstrap (middleware stack, route mounting, error handler)
- **Frontend**: `frontend/src/main.jsx` — React DOM render, provider tree, router setup

## Key Formulas

- **BMI**: weight(kg) / height(m)²
- **TDEE**: BMR × Activity Multiplier (Mifflin-St Jeor)
- **BMR (Male)**: 10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5
- **BMR (Female)**: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
- **Activity Calories**: calories_per_hour × (durationMin / 60) × intensity_multiplier
- **Net Calories**: totalConsumed − totalCaloriesBurned
- **Net vs Target**: netCalories − calorieTarget (negative = deficit)

## Notes

- `weekly_plans`, `daily_meal_plans`, and `activity_plans` tables use JSONB for flexible LLM output schema
- `node-cache` (TTL: 1 hour) serves cached plans without DB queries
- `intensity_level` is a PostgreSQL ENUM: `'light'`, `'moderate'`, `'vigorous'`
- Rate limiters (Weekly Plans): 5 req/15 min for generate, separate limiter for regenerate-day
- Rate limiters (Daily Meal Plans): 5 req/15 min for generate
- Rate limiters (Activity Plans): 5 req/15 min for generate
- LLM uses triple fallback chain: primary → fallback → openrouter/free
- Correction loop: 2 max LLM attempts before template fallback (prevents runaway API costs)
- Fuzzy matching cascade: exact → case-insensitive/substring → Levenshtein ≤ 3
- `levenshteinDistance` and `getMonday` shared from `backend/src/utils/string.js`
- `fuzzyMatchFoodName` and `recalculateDayCalories` in `backend/src/utils/food.js`
- Batch log uses `clientOverride` pattern — repositories accept optional `client` parameter for transaction-aware queries
- Legacy `meal_plans` table remains for read-compatible archive; all new writes go to `daily_meal_plans`
