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

### Meal Plan Generation (LLM)
1. User POSTs to `/api/meal-plans/generate` with optional `weekStart`
2. Controller fetches user profile (calorie target), food database (up to 200 ingredients), and food log history (7 days) via injected dependencies
3. `mealPlan.service.js` builds a meal-specific prompt via `buildPrompt('meal-plan-prompt.md')`
4. OpenAI SDK sends chat completion to OpenRouter API with correction loop:
   - Attempt 1: Generate → validate structure (7 days × 4 meals, dates, 1-4 items/meal) → validate food names → if either fails, send correction prompt
   - Attempt 2: Correction prompt with specific errors → validate again → if still fails, fall back to template
   - Max 2 LLM attempts before `generateFallbackMealPlan()` is used
5. Fuzzy matching cascade (in `validateAndFixMealPlan`): exact match → case-insensitive/substring → Levenshtein distance ≤ 3. Unmatchable items are removed with warnings (plan continues without them)
6. Server-authoritative calorie recalculation: overrides LLM-computed values with `(calories_per_100g × portion_grams / 100)` when deviation > 20 cal
7. Valid plan is upserted to `meal_plans` table (JSONB) AND cached in-memory via node-cache with `planType='meal'` namespace
8. GET `/api/meal-plans` reads from cache first (with `planType='meal'` to prevent activity plan collision), then falls back to DB
9. POST `/api/meal-plans/regenerate-day` clears cache, regenerates entire plan, merges only specified day into existing cached plan
10. POST `/api/meal-plans/log-day` uses explicit BEGIN/COMMIT/ROLLBACK transaction with `clientOverride` pattern for atomic batch logging

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

- `weekly_plans` table uses JSONB for flexible LLM output schema
- `node-cache` (TTL: 1 hour) serves cached plans without DB queries
- `intensity_level` is a PostgreSQL ENUM: `'light'`, `'moderate'`, `'vigorous'`
- Rate limiters (Weekly Plans): 5 req/15 min for generate, separate limiter for regenerate-day
- Rate limiters (Meal Plans): 5 req/15 min for generate, 3 req/30 min for regenerate-day, 30 req/15 min for log-day
- LLM uses triple fallback chain: primary → fallback → openrouter/free
- `meal_plans` table mirrors `weekly_plans` exactly — JSONB `plan_data`, unique on `(user_id, week_start)` — separate concern isolation
- Correction loop: 2 max LLM attempts before template fallback (prevents runaway API costs)
- Fuzzy matching cascade: exact → case-insensitive/substring → Levenshtein ≤ 3
- Template fallback (`generateFallbackMealPlan`): 6-8 diverse ingredients across 4 meals (protein, carbs, vegetables, fruit, dairy), pro-rated to calorie target
- Cache key `planType` parameter (`'meal'` vs `'activity'`) prevents plan type collision in shared cache
- `levenshteinDistance` and `getMonday` shared from `backend/src/utils/string.js`
- Batch log uses `clientOverride` pattern — repositories accept optional `client` parameter for transaction-aware queries
