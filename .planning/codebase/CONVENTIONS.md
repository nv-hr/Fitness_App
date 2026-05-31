---
title: "Conventions"
last_updated: "2026-05-31"
focus: quality
---

# CONVENTIONS.md — Coding Conventions

## Overview

Coding conventions derived from the existing codebase (React 19 + Express 5 + Supabase PostgreSQL).

## Code Style

- **No automatic semicolons** — ASI style (no `;` terminators)
- **ESM modules** — `import`/`export` throughout (both backend and frontend)
- **Async/await** — Preferred over raw promises; `try/catch` with `next(err)` in Express controllers
- **JSDoc** — Public functions documented with `/** ... */` blocks
- **String quotes** — Single quotes preferred
- **Trailing commas** — Used in multiline objects/arrays
- **Indentation** — 2 spaces

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Repositories | camelCase, `.repository.js` suffix | `activity.repository.js` |
| Controllers | camelCase, `.controller.js` suffix | `weeklyPlan.controller.js` |
| Routes | camelCase, `.routes.js` suffix | `activity.routes.js` |
| Services | camelCase, `.service.js` suffix | `llm.service.js` |
| Middlewares | camelCase, `.middleware.js` suffix | `auth.middleware.js` |
| Components | PascalCase filenames and exports | `FoodLogForm.jsx` |
| Functions/Variables | camelCase | `getActivityHistory` |
| DB Columns | snake_case | `calories_per_hour`, `logged_date` |
| JSON response keys | camelCase | `calorieTarget`, `activityId` |
| DB column results | snake_case | `calories_burned`, `duration_min` |
| Git commits | Conventional Commits | `feat(api): add activity log endpoints` |
| Route files | export default Router | `export default router` |

## Frontend Conventions

- **Feature modules** under `src/features/` (auth, food-log, activities, profile)
- **Shared components** under `src/shared/`
- **TanStack React Query** for server state (no Redux)
- **React Hook Form + Zod** for form validation
- **Zod schemas** co-located with feature or in shared
- **CSS modules** for component-level styling
- **Relative imports** within the same feature

## Backend Conventions

- **Layered clean architecture**: Route → Controller → Service → Repository
- **Controllers**: Thin — extract params, call service, format response via `successResponse`/`errorResponse`
- **Services**: Business logic, validation, LLM prompt building, calculations
- **Repositories**: Database queries only (raw SQL with `$1` parameterized placeholders)
- **Middlewares**: Auth, validation (Zod), rate limiting — mounted at route level
- **Error handling**: `AppError` class for known errors with status code + error code; `next(err)` to Express error handler
- **Response format**: `{ success: true, data: ... }` or `{ success: false, error: { message, code } }`
- **Rate limiting**: Per-route-group limiters (auth, food, activities, weekly-plans, meal-plans) — meal plans have 3 separate limiters: generate (5/15min), regenerate-day (3/30min), log-day (30/15min)

## Database Conventions

- **Migrations**: `node-pg-migrate` with sequential timestamps
- **No ORM** — Raw SQL via `pg` driver
- **UUIDs** for primary keys (users, profiles, foods, activity_logs)
- **ENUM types** for constrained string fields (`intensity_level`, `meal_type`, `fitness_goal`, etc.)
- **JSONB** for flexible schema data (`weekly_plans.plan_data`)
- **Timestamps**: `created_at`, `updated_at` with `DEFAULT NOW()`

## Error Handling

- **Controllers**: `try/catch` with `next(err)` — errors propagate to Express error middleware
- **Known errors**: `AppError` with status code (400/401/404/429) and error code (VALIDATION_ERROR, AUTHENTICATION_ERROR, NOT_FOUND, RATE_LIMITED)
- **Unknown errors**: Caught by Express error handler, logged server-side, returned as 500 `HTTP_SERVER_ERROR`
- **Validation**: Zod schemas validate at middleware layer before controller
- **Rate limiting**: `express-rate-limit` returns 429 with `RATE_LIMITED` code

## Testing Conventions

- **Backend**: Jest (`.test.js` files, integration tests with real DB)
- **Frontend**: Vitest + Testing Library (`.test.jsx` files, component tests)
- **E2E**: Integration tests with real LLM calls (weeklyPlan.e2e.test.js)
- **Test DB**: Separate `fitness_test` schema via `DATABASE_URL_TEST`
- **Graceful skip**: Tests requiring external services use conditional `describeIf`

## Git Conventions

| Aspect | Convention |
|--------|-----------|
| Commit style | Conventional Commits (`type(scope): message`) |
| Types used | `feat`, `fix`, `test`, `refactor`, `docs`, `chore` |
| Branch naming | `features` (shared), topic branches for parallel work |
| PR style | Standard GitHub merge |
| Commits per phase | Atomic — each plan is 1+ commits |

## Meal Plan Naming Patterns

| Element | Convention | Example |
|---------|-----------|---------|
| Service | camelCase, `.service.js` suffix | `mealPlan.service.js` |
| Controller | camelCase, `.controller.js` suffix | `mealPlan.controller.js` |
| Repository | camelCase, `.repository.js` suffix | `mealPlan.repository.js` |
| Routes | camelCase, `.routes.js` suffix | `mealPlan.routes.js` |
| Rate Limiter | camelCase, dedicated file per feature | `mealPlanRateLimiter.js` |
| Prompt files | kebab-case, `.md` suffix | `meal-plan-prompt.md` |
| DB table | snake_case | `meal_plans` |
| DB migration | descriptive SQL file | `add_meal_plans.sql` |
| Frontend feature | kebab-case directory under `src/features/` | `meal-plan/` |
| Frontend API client | camelCase, `.js` suffix | `mealPlanApi.js` |

## Meal Plan Conventions

- **Prompt-driven generation**: LLM prompts live in `backend/prompts/` as standalone `.md` files (loaded by `llm.service.js` via `buildPrompt()`)
- **Correction loop**: After each LLM attempt, validate structure (7 days × 4 meals, portion ranges, calorie ranges), then validate food names via fuzzy matching. If either fails, send correction prompt with specific errors. Max 2 attempts before template fallback.
- **Fuzzy matching cascade**: exact match → case-insensitive/substring → Levenshtein distance ≤ 3. Unmatchable items are removed (plan continues). Matched items get server-authoritative calorie recalculation.
- **Server-authoritative calorie override**: LLM-computed calories are replaced with `(calories_per_100g × portion_grams / 100)`. Only used for calorie display; deviation threshold is 20 cal.
- **Template fallback**: `generateFallbackMealPlan()` distributes 6-8 diverse ingredients across 4 meal slots (22% breakfast, 33% lunch, 33% dinner, 12% snack), pro-rated to calorie target via `calcPortion()`. Same template repeated for all 7 days.

## Batch Transaction Pattern

Batch operations (e.g., `logDay` logging all meal items) use an explicit `BEGIN/COMMIT/ROLLBACK` transaction with the `clientOverride` pattern:

- Repository functions (`batchLogItems`, `markItemsLogged`) accept an optional `client` parameter (pg Pool client)
- When `client` is provided, queries run through the pooled client connection instead of the default pool — making them part of the active transaction
- Controller manages the lifecycle: `pool.connect()` → `client.query('BEGIN')` → repository calls with `client` → `COMMIT` on success / `ROLLBACK` on error → `client.release()` in `finally`
- This pattern avoids nested transaction issues (PostgreSQL does not allow nested `BEGIN`) by threading the connection explicitly

## Cache Key Namespace Convention

The shared `node-cache` instance in `llm.service.js` stores both activity plans and meal plans. To prevent collision:

- All `getCachedPlan()`, `setCachedPlan()`, and `clearCachedPlan()` calls accept a third parameter: `planType` (string)
- Activity plans use `planType='activity'`, meal plans use `planType='meal'`
- Cache key is constructed as `` `${planType}_${userId}_${weekStart}` ``
- GET endpoints must pass the correct `planType` to avoid returning an activity plan when a meal plan is requested (and vice versa)
