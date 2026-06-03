<!-- refreshed: 2026-06-02 -->
# Architecture

**Analysis Date:** 2026-06-02

## System Overview

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19 SPA + Vite 8)                   │
│                                                                           │
│  ┌─────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │
│  │  Auth        │  │  Profile   │  │  Food Log  │  │  Activities  │      │
│  │  features/   │  │  features/ │  │  features/ │  │  features/   │      │
│  │  auth/       │  │  profile/  │  │  food-log/ │  │  activities/ │      │
│  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘  └──────┬────────┘      │
│         │                │               │               │               │
│         └────────────────┴───────┬───────┴───────────────┘               │
│                                  │                                       │
│                     ┌────────────┴────────────┐                          │
│                     │       Shared Layer       │                          │
│                     │  shared/lib/http.js      │                          │
│                     │  shared/hooks/           │                          │
│                     │  shared/calendar/        │                          │
│                     └────────────┬────────────┘                          │
│                                  │                                       │
│                    Vite Dev Proxy: /api → localhost:3001                  │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │ HTTP (JSON + httpOnly JWT cookie)
                                   ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Express 5 ESM Server)                       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  app.js — Middleware Chain                                 │             │
│  │  Helmet → CORS → Compression → Morgan → JSON Body Parse   │             │
│  │  → Cookie Parse → Passport Init → Rate Limiters → Routes  │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  Routes (express.Router)  —  backend/src/routes/          │             │
│  │  auth.routes.js  profile.routes.js  food.routes.js        │             │
│  │  activity.routes.js  weeklyPlan.routes.js                 │             │
│  │  dailyMealPlan.routes.js  progress.routes.js              │             │
│  │  docs.routes.js  activityPlan.routes.js                   │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  Middlewares  —  backend/src/middlewares/                  │             │
│  │  auth.middleware.js (JWT verification from httpOnly cookie)│             │
│  │  *RateLimiter.js (per-endpoint rate limiters)             │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  Controllers  —  backend/src/controllers/                 │             │
│  │  (Request handling, response formatting, validation)      │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  Services  —  backend/src/services/                       │             │
│  │  (Business logic, LLM orchestration, calculation)         │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  Repositories  —  backend/src/repositories/               │             │
│  │  (Raw SQL via `pg` Pool — parameterized queries)          │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  Config + Utils                                           │             │
│  │  config/database.js (pg Pool)  config/passport.js         │             │
│  │  utils/response.js  utils/errors.js  utils/dbErrors.js    │             │
│  │  utils/food.js  utils/string.js                           │             │
│  └────────────────────────┬──────────────────────────────────┘             │
│                           │                                              │
└───────────────────────────┼───────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │     PostgreSQL Database      │
              │  (Supabase, pg driver)       │
              │  Tables: users, profiles,    │
              │  foods, food_logs,           │
              │  activities, activity_logs,  │
              │  weekly_plans, daily_meal_   │
              │  plans, weight_logs          │
              └─────────────────────────────┘
```

## Pattern Overview

**Overall:** Monorepo with npm workspaces — a backend-first layered architecture where the Express 5 server serves as both the API backend and static file server for the production-built React SPA.

**Key Characteristics:**
- **Backend Layered Architecture**: Routes → Controllers → Services → Repositories — a strict unidirectional dependency chain (`backend/src/routes/` → `backend/src/controllers/` → `backend/src/services/` → `backend/src/repositories/`) with `config/`, `middlewares/`, and `utils/` as horizontal support layers.
- **Feature-Colocated Frontend**: Each feature (auth, profile, food-log, activities, progress) encapsulates its own `api/`, `components/`, `hooks/`, and an `index.js` barrel. Shared code lives in `frontend/src/shared/`.
- **LLM Orchestration via Services**: The `services/llm.service.js` layer handles all LLM interactions — prompt building, OpenRouter API calls, plan validation, fuzzy matching, and in-memory plan caching (`node-cache`). Specific LLM-driven features (weekly plans, daily meal plans) orchestrate LLM calls through the shared `llm.service.js`.
- **JWT Auth via httpOnly Cookies**: Authentication token is stored in an httpOnly, secure, SameSite=None cookie (`D-01`). The `auth.middleware.js` reads it from `req.cookies.token`, never from the `Authorization` header.
- **Multi-Layer Rate Limiting**: Global limiter (600 req/min) → per-route limiters → per-endpoint limiters with custom 429 responses. Rate limiters detect `NODE_ENV=test` to use relaxed limits.
- **Git tag-driven versioning**: The project uses git tags (v1.0 through v1.9) to mark milestones.

## Layers

### Backend Layers

**Route Layer:**
- Purpose: Define URL-to-controller mappings and attach middlewares
- Location: `backend/src/routes/`
- Contains: 9 Express Router modules — `auth.routes.js`, `profile.routes.js`, `food.routes.js`, `activity.routes.js`, `weeklyPlan.routes.js`, `dailyMealPlan.routes.js`, `activityPlan.routes.js`, `progress.routes.js`, `docs.routes.js`
- Depends on: Controllers, Middlewares
- Used by: `app.js` (Express app instance)

**Controller Layer:**
- Purpose: Handle HTTP requests — parse input, call services, format responses using `successResponse`/`errorResponse` utilities
- Location: `backend/src/controllers/`
- Contains: 8 controller modules — `auth.controller.js`, `profile.controller.js`, `food.controller.js`, `activity.controller.js`, `weeklyPlan.controller.js`, `dailyMealPlan.controller.js`, `activityPlan.controller.js`, `weightLog.controller.js`
- Pattern: Each controller function is an `async (req, res, next) => {...}` Express handler with `try/catch` blocks that forward errors to `next(err)`
- Used by: Routes

**Service Layer:**
- Purpose: All business logic — calculations (BMI/TDEE), LLM orchestration, plan generation, data validation
- Location: `backend/src/services/`
- Contains: 9 service modules — `auth.service.js`, `profile.service.js`, `food.service.js`, `activity.service.js`, `activityLog.service.js`, `llm.service.js`, `activityPlan.service.js`, `mealPlan.service.js`, `dailyMealPlan.service.js`, `weightLog.service.js`
- Key patterns:
  - `auth.service.js` handles password hashing, JWT signing, email/password and Google OAuth registration
  - `profile.service.js` implements Mifflin-St Jeor BMR formula, TDEE calculation, BMI classification
  - `llm.service.js` manages OpenRouter client, prompt caching, plan caching (node-cache), per-user mutex locks, LLM swap/regenerate operations
  - `activityPlan.service.js` and `dailyMealPlan.service.js` each call `llm.service.js` for generation and have their own structure validation
- Depends on: Repositories, Utils

**Repository Layer:**
- Purpose: Direct database access via raw parameterized SQL through the `pg` Pool
- Location: `backend/src/repositories/`
- Contains: 9 repository modules — `user.repository.js`, `profile.repository.js`, `food.repository.js`, `activity.repository.js`, `weeklyPlan.repository.js`, `dailyMealPlan.repository.js`, `activityPlan.repository.js`, `weightLog.repository.js`, `mealPlan.repository.js`
- Pattern: Each function is `async` with `try/catch` wrapping `pool.query(...)`. Errors are wrapped in `AppError` with prefix "DatabaseError". Some repositories accept an optional `clientOverride` parameter for transactional queries.
- Used by: Services, Controllers (occasionally directly for simple lookups)

**Middleware Layer:**
- Purpose: Authentication, authorization, rate limiting, request preprocessing
- Location: `backend/src/middlewares/`
- Contains: `auth.middleware.js`, `weeklyPlanRateLimiter.js`, `dailyMealPlanRateLimiter.js`, `activityPlanRateLimiter.js`

**Config Layer:**
- Purpose: Service initialization and configuration
- Location: `backend/src/config/`
- Contains: `database.js` (pg Pool creation), `passport.js` (Google OAuth strategy)

**Utils Layer:**
- Purpose: Shared helpers used across all layers
- Location: `backend/src/utils/`
- Contains:
  - `response.js` — `successResponse(res, data, statusCode)` and `errorResponse(res, message, statusCode, code)`
  - `errors.js` — `AppError`, `ValidationError`, `AuthenticationError`, `NotFoundError` class hierarchy
  - `dbErrors.js` — PostgreSQL error code to human-readable mapping
  - `string.js` — `getMonday()`, `levenshteinDistance()`
  - `food.js` — `fuzzyMatchFoodName()`, `recalculateDayCalories()`

**Prompts Layer (LLM):**
- Purpose: Static prompt templates for LLM interactions (stored as Markdown files with `{{variable}}` placeholders)
- Location: `backend/prompts/`
- Contains: `system-prompt.md`, `weekly-plan-prompt.md`, `meal-plan-prompt.md`, `daily-meal-plan-prompt.md`, `correction-prompt.md`, `meal-correction-prompt.md`, `activity-swap-prompt.md`
- Used by: `services/llm.service.js`

### Frontend Layers

**App Layer:**
- Purpose: Application root, providers, and routing
- Location: `frontend/src/app/`
- Contains: `App.jsx` (root component), `Providers.jsx` (TanStack Query + AuthProvider), `Router.jsx` (all routes, layout, protected/public guards, profile guard)
- Key patterns: `Providers.jsx` wraps children in `QueryClientProvider` (TanStack React Query) then `AuthProvider`. `Router.jsx` uses `BrowserRouter` with `ResponsiveLayout` wrapper.

**Feature Modules:**
- Purpose: Self-contained feature logic with colocated API, components, hooks
- Location: `frontend/src/features/`
- Modules:
  - `auth/` — `useAuth.jsx` (AuthContext provider + hook), `LoginForm.jsx`, `RegisterForm.jsx`, `authApi.js`, `index.js` (barrel)
  - `profile/` — `ProfileForm.jsx`, `BmiResult.jsx`, `TdeeResult.jsx`, `profileApi.js`, `index.js`
  - `food-log/` — `FoodLogPage.jsx`, `FoodLogForm.jsx`, `FoodSearch.jsx`, `FoodLogTable.jsx`, `CalorieSummary.jsx`, `CalorieHistory.jsx`, `CustomFoodForm.jsx`, `MealCalendarSection.jsx`, `previewCalories.js`, `useMonthMealData.js`, `foodLogApi.js`, `dailyMealPlanApi.js`, `index.js`
  - `activities/` — `ActivityPage.jsx`, `ActivityLogForm.jsx`, `ActivityHistory.jsx`, `ActivitySummary.jsx`, `ActivityPool.jsx`, `ActivityCalendarSection.jsx`, `ActivityLogSection.jsx`, `ActivityCard.jsx`, `DayActivityRow.jsx`, `previewCalories.js`, `activityApi.js`, `activityPlanApi.js`, `activityCalendarApi.js`, `index.js`
  - `progress/` — `ProgressPage.jsx`, `WeightEntryCard.jsx`, `WeightHistoryTable.jsx`, `WeightTrendChart.jsx`, `TrendPredictionCard.jsx`, `useTrendPrediction.js`, `weightApi.js`, `index.js`
- Pattern: Each feature has an `index.js` barrel file that re-exports public components/APIs

**Shared Layer:**
- Purpose: Cross-feature reusable code
- Location: `frontend/src/shared/`
- Contains: `lib/http.js` (apiFetch, apiGet, apiPost, apiDelete with `credentials: 'include'`), `hooks/useResponsive.js`, `calendar/` (CalendarGrid, MonthNav, DayDetailPanel, CalendarPageLayout, calendarUtils, useMonthData)

## Data Flow

### Primary Request Path (Authenticated API Call)

1. **Entry Point** — HTTP request arrives at Express 5 server (`backend/src/server.js:9`)
2. **Middleware Chain** (order matters per `backend/src/app.js:76-101`):
   - `helmet()` — Security headers
   - `cors()` — CORS with credentials allowed for `FRONTEND_URL`
   - `compression()` — Gzip
   - `morgan('dev')` — Request logging
   - `express.json()` — Body parsing
   - `cookieParser()` — Cookie parsing (reads JWT from `req.cookies.token`)
   - `passport.initialize()` — Passport init
   - `globalLimiter` — Aggregate rate limiter
   - Per-route rate limiters applied in `app.js`
3. **Route Resolution** — `app.use('/api/profile', profileLimiter, profileRoutes)` → routes in `backend/src/routes/profile.routes.js`
4. **Auth Middleware** — `authenticateToken` (`backend/src/middlewares/auth.middleware.js:11-41`) verifies JWT from httpOnly cookie, attaches `req.user = { userId, email }`
5. **Controller** — `profileController.getProfile` (`backend/src/controllers/profile.controller.js:37-52`) calls service, catches known errors, formats response via `successResponse`/`errorResponse`
6. **Service** — `profileService.getProfile` (`backend/src/services/profile.service.js:191-203`) fetches profile, calculates BMI/TDEE, returns enriched data
7. **Repository** — `profileRepository.findByUserId` (`backend/src/repositories/profile.repository.js:36-46`) executes parameterized SQL query against `pg` pool
8. **Response** — Controller returns JSON response `{ success: true, data: {...} }` to client

### LLM Plan Generation Flow

1. **Client** sends POST to `/api/weekly-plans/generate` (or daily-meal-plans/generate)
2. **Route + Auth** → rate limiter → controller
3. **Controller** (`weeklyPlan.controller.js:133-179`) checks DB for existing plan, then calls service
4. **Service** (`llm.service.js:433-533`) fetches user data in parallel, builds prompt from template with `buildPrompt()`, calls OpenRouter via `callLlmApi()`, validates response structure, fuzzy-matches activity names, stores in `node-cache` and returns
5. **Controller** persists plan to DB and returns response

### Auth Flow (Login)

1. **POST** `/api/auth/login` → `authLimiter` (10 req/15min) → `authController.login`
2. **Controller** calls `authService.login()` which checks email, compares bcrypt hash, generates JWT (`HS256`, 7-day expiry)
3. **Controller** sets `res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' })` and returns `{ success: true, data: { user, token } }`
4. **Frontend** `useAuth.jsx`'s `login()` function stores user in state, reacts to auth context change

### Caching Strategy

- **In-memory plan cache**: `node-cache` (TTL: 1 hour, max keys: 1000) in `backend/src/services/llm.service.js:48` — caches weekly and daily plans by `plan_{type}_{userId}_{date}` key
- **Database persistence**: Plans are also upserted to PostgreSQL tables for persistence across server restarts
- **Cache-first, DB-fallback**: Plan GET endpoints check in-memory cache first, then fall back to database queries
- **Per-user mutex locks**: `llm.service.js:54-62` implements a Map-based mutex system to prevent TOCTOU race conditions on cache read-modify-write operations

## Key Abstractions

**Error Class Hierarchy (`backend/src/utils/errors.js`):**
- `AppError` (extends `Error`) — base with `name`, `message`, `statusCode`, `isOperational`
- `ValidationError` → 400 Bad Request
- `AuthenticationError` → 401 Unauthorized
- `NotFoundError` → 404 Not Found

**Response Helpers (`backend/src/utils/response.js`):**
- `successResponse(res, data, statusCode=200)` — `{ success: true, data }`
- `errorResponse(res, message, statusCode=500, code)` — `{ success: false, error: { message, code } }`

**HTTP Client (`frontend/src/shared/lib/http.js`):**
- `apiFetch(path, options)` — base fetch wrapper with `credentials: 'include'`, JSON parsing, error normalization
- `apiGet(path)`, `apiPost(path, body)`, `apiDelete(path)` — convenience wrappers

**Auth Context (`frontend/src/features/auth/hooks/useAuth.jsx`):**
- `AuthProvider` — React context with `user`, `loading`, `login`, `register`, `logout`, `isAuthenticated`
- `useAuth()` — context consumer hook

**LLM Service Abstractions (`backend/src/services/llm.service.js`):**
- `buildPrompt(filename, variables)` — template variable substitution
- `callLlmApi(systemPrompt)` — OpenRouter call with 3-model fallback chain
- `validatePlanStructure(plan, weekStart, availableDays)` — response structure validation
- `validateAndFixPlan(plan, dbActivities)` — fuzzy name matching and correction
- `fuzzyMatchActivityName(name, dbActivities)` — exact → contains → Levenshtein matching
- `generateWeeklyPlan(deps)` — full generation with retry + correction loop
- `swapActivity(deps, activityId, dayIndex)` — per-activity replacement
- `getCachedPlan/setCachedPlan/clearCachedPlan` — cache management
- `acquireLock(key, timeout)` — per-user mutex for TOCTOU prevention

## Entry Points

**Backend Server:**
- Location: `backend/src/server.js`
- Triggers: `node src/server.js` (or `npm run dev`)
- Responsibilities: Load `.env`, create Express app, connect to PostgreSQL, handle uncaught exceptions/unhandled rejections

**Backend App:**
- Location: `backend/src/app.js`
- Responsibilities: Configure all middleware (helmet, CORS, compression, morgan, body parser, cookie parser, passport), attach rate limiters, mount all route groups, serve React SPA static files, SPA catch-all, 404 handler, global error handler

**Frontend Entry:**
- Location: `frontend/src/main.jsx`
- Triggers: Vite dev server or production build
- Responsibilities: Mount React app to DOM

**Frontend App:**
- Location: `frontend/src/app/App.jsx`
- Responsibilities: Render `<Providers>` → `<Router>`

**Frontend Router:**
- Location: `frontend/src/app/Router.jsx`
- Responsibilities: Define all routes (login, register, profile, food-log, activities, progress, dashboard), implement `ProtectedRoute`, `PublicRoute`, `ProfileGuard` wrappers, render `ResponsiveLayout` with desktop and mobile navigation

## API Route Map

| Prefix | File | Auth | Rate Limit |
|--------|------|------|------------|
| `GET /api/health` | `app.js:113` | No | Global |
| `/api/docs` | `routes/docs.routes.js` | No | None |
| `/api/auth` | `routes/auth.routes.js` | Some | 10/15min (login/register) |
| `/api/auth/google` | `app.js:152-172` | No | None |
| `/api/profile` | `routes/profile.routes.js` | Required | 60/15min |
| `/api/food` | `routes/food.routes.js` | Required | 60/15min |
| `/api/activities` | `routes/activity.routes.js` | Required | 20/15min |
| `/api/weekly-plans` | `routes/weeklyPlan.routes.js` | Required | Per-endpoint |
| `/api/daily-meal-plans` | `routes/dailyMealPlan.routes.js` | Required | Per-endpoint |
| `/api/progress` | `routes/progress.routes.js` | Required | Global |

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js). No worker threads. Async I/O throughout.
- **Global state:** In-memory singletons in `llm.service.js`: `planCache` (NodeCache), `locks` (Map for mutexes), `promptCache` (Map), `openaiClient` (OpenAI SDK), `migrationFailCooldown` (Map in `weeklyPlan.controller.js`).
- **Circular imports:** Not detected. Dependency flows unidirectionally: routes → controllers → services → repositories.
- **LLM dependency:** Weekly plans, daily meal plans, and activity plans all depend on OpenRouter API availability. Fallback plans (`generateFallbackPlan`/`generateFallbackActivityPlan`) provide degraded functionality when LLM is unavailable.
- **Database dependency:** Every API route except health check and docs ultimately depends on PostgreSQL availability.

## Anti-Patterns

### Service-to-Controller Dependency Inversion

**What happens:** `weeklyPlan.controller.js` directly imports repositories (`activity.repository.js`, `weeklyPlan.repository.js`, `profile.repository.js`) and the database pool instead of always going through services. Similarly, `dailyMealPlan.controller.js` and `activityPlan.controller.js` also import repositories directly for DB lookups.

**Why it's wrong:** Breaks the strict layer separation. Controllers should delegate complex data fetching to services.

**Do this instead:** Follow the `auth.controller.js` pattern — keep controllers focused on HTTP handling and delegate all data access to services. Multiple services can be composed if needed.

### Controllers with Heavy Business Logic

**What happens:** `weeklyPlan.controller.js` (507 lines) contains substantial business logic including `attemptMigration`, `inferAvailableDays`, and `toggleComplete` functions that would be more appropriate in a service layer.

**Why it's wrong:** Makes controllers harder to test and violates single responsibility.

**Do this instead:** Keep controllers to ~50 lines max by extracting business logic into services.

### Direct `pool.query` in Controllers

**What happens:** `weeklyPlan.controller.js:92-98` executes raw `pool.query()` directly instead of going through a repository, and `dailyMealPlan.controller.js:105-127` directly manages transactions.

**Why it's wrong:** Bypasses the repository abstraction, making the code harder to mock in tests and duplicating error handling.

**Do this instead:** Always use repository functions for database access. Repository methods already accept optional `clientOverride` for transaction support.

## Error Handling

**Strategy:** Centralized error handling via the global Express error handler at `backend/src/app.js:200-210`. Controllers use `try/catch` to translate known error types (`ValidationError` → 400, `AuthenticationError` → 401, `NotFoundError` → 404) and forward unknown errors to `next(err)`.

**Patterns:**
- Custom `AppError` class hierarchy with `name`, `message`, `statusCode`, `isOperational`
- Controller-level `try/catch` with specific error type checking
- Repository-level `try/catch` wrapping all DB errors in `AppError('DatabaseError', ...)`
- Global error handler converts camelCase error names to `UPPER_SNAKE_CASE` codes
- `errorResponse()` helper produces consistent JSON error format `{ success: false, error: { message, code } }`
- `dbErrors.normalizeDbError()` maps PostgreSQL error codes to human-readable codes

## Cross-Cutting Concerns

**Logging:**
- `morgan('dev')` middleware for HTTP request logging
- `console.log`/`console.warn`/`console.error` throughout services and controllers for debugging
- No structured logging library (e.g., winston, pino)
- Database pool errors logged in `config/database.js:28-35`

**Validation:**
- `express-validator` is listed as a dependency but **not currently used** — most validation is manual within controllers and services
- Business-logic validation in services (`profile.service.js:102-138`, `food.service.js:36-50`, `llm.service.js:162-191`)
- Zod schemas in frontend (`LoginForm.jsx:9-12`, `RegisterForm.jsx`)
- No shared validation schemas between frontend and backend

**Authentication:**
- JWT-based with httpOnly cookies (not `Authorization` header)
- `authenticateToken` middleware reads `req.cookies.token`, verifies with `HS256` algorithm
- Token includes `{ userId, email }`, expires in 7 days
- Google OAuth via Passport — also sets JWT cookie on successful callback
- Password hashing via `bcryptjs` with 10 salt rounds (D-05)
- Timing-safe login: dummy bcrypt compare on invalid emails to prevent email enumeration

---

*Architecture analysis: 2026-06-02*
