<!-- refreshed: 2026-06-02 -->
# Architecture

**Analysis Date:** 2026-06-02

## System Overview

The codebase follows a **two-tier monorepo architecture** with a React SPA frontend and Express.js REST API backend, communicating over HTTP. A PostgreSQL database (Supabase-hosted) stores all persistent data. The backend integrates with OpenRouter (LLM API) for AI-generated workout and meal plans.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                         │
│  `frontend/src/`                                                     │
├──────────────────────┬──────────────────────┬───────────────────────┤
│    App Entry          │   Feature Pages       │   Shared Components    │
│  `main.jsx`           │  `features/*/`        │  `shared/`             │
│  `app/App.jsx`       │  (auth, activities,   │  (http.js, calendar)   │
│  `app/Router.jsx`    │   food-log, profile,  │                       │
│                       │   progress)           │                       │
└──────────┬────────────┴───────────┬──────────┴──────────┬────────────┘
           │  HTTP (fetch)          │  Vite Proxy          │
           │  credentials: include  │  /api → localhost:3001│
           ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js REST API)                     │
│  `backend/src/`                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  server.js → app.js                                                   │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│   │Routes    │→│Controllers│→│Services  │→│Repositories│→ Postgres  │
│   │`routes/` │ │`controllers/`│`services/`│  │`repositories/`│ │  DB    │
│   └──────────┘ └──────────┘ └─────┬────┘ └──────────┘ └────────┤     │
│                                    │                              │     │
│                                    ▼                              │     │
│                            ┌──────────────┐                      │     │
│                            │ LLM Service   │──→ OpenRouter API    │     │
│                            │ (OpenAI compat)│                     │     │
│                            └──────────────┘                      │     │
│                                    │                              │     │
│                                    ▼                              │     │
│                            ┌──────────────┐                      │     │
│                            │ node-cache    │ (in-memory plan cache)│    │
│                            └──────────────┘                      │     │
│                                                                      │
│  Cross-cutting: auth.middleware, rate-limiters, error handlers,      │
│  Passport.js (local + Google OAuth), helmet, cors, compression      │
└──────────────────────────────────────────────────────────────────────┘
```

**Project Name:** KalaFit — Track biometrics, calorie budget, and get personalized AI workout/food recommendations.

## Component Responsibilities

| Component | Responsibility | File(s) |
|-----------|----------------|---------|
| `server.js` | Entrypoint — loads env, starts Express on PORT, connects DB pool | `backend/src/server.js` |
| `app.js` | Express app setup — middleware stack, route mounting, error handling, SPA catch-all | `backend/src/app.js` |
| Routes | Map HTTP paths to controller functions; apply auth and rate-limit middleware | `backend/src/routes/*.js` |
| Controllers | Request handling — validate input, call services, format response | `backend/src/controllers/*.js` |
| Services | Business logic — auth, LLM plan generation, meal plan logic, profile calculations | `backend/src/services/*.js` |
| Repositories | Data access layer — raw SQL queries via `pg.Pool` | `backend/src/repositories/*.js` |
| LLM Service | OpenRouter API integration — prompt building, model calling, plan validation, caching | `backend/src/services/llm.service.js` |
| Middlewares | Auth token verification (JWT), per-endpoint rate limiters | `backend/src/middlewares/*.js` |
| Utils | Shared helpers — response format, error classes, string utilities | `backend/src/utils/*.js` |
| Config | Database pool config, Passport.js strategies | `backend/src/config/*.js` |
| Prompts | LLM prompt templates (Markdown with `{{variables}}`) | `backend/prompts/*.md` |
| DB | SQL schema, seed data, migration scripts | `backend/db/*.sql` |
| `App.jsx` | React root — renders Providers + Router | `frontend/src/app/App.jsx` |
| `Router.jsx` | Client-side routing, auth guards, layout, navigation | `frontend/src/app/Router.jsx` |
| Features | Feature-sliced modules (auth, activities, food-log, profile, progress) | `frontend/src/features/*/` |
| `http.js` | Shared HTTP client — `apiFetch`, `apiGet`, `apiPost`, `apiDelete` with credentials | `frontend/src/shared/lib/http.js` |
| `useAuth.jsx` | Auth context provider — login, register, logout, session check | `frontend/src/features/auth/hooks/useAuth.jsx` |

## Pattern Overview

**Overall:** Layered architecture (Route → Controller → Service → Repository → DB) with cross-cutting middleware.

**Key Characteristics:**
- **ESM throughout** — both backend and frontend use `"type": "module"` with `import`/`export`
- **Monorepo with npm workspaces** — root `package.json` orchestrates `frontend/` and `backend/`
- **Layered backend** — strict separation: routes handle HTTP, controllers orchestrate, services house business logic, repositories own data access
- **Feature-based frontend** — each domain (auth, activities, food-log, profile, progress) is a self-contained directory
- **LLM-first planning** — AI generates weekly workout plans and daily meal plans via LLM, with template-based fallback when AI is unavailable
- **Cache-aside for LLM** — generated plans cached in-memory via `node-cache` to reduce API calls and latency
- **Multi-layer rate limiting** — global, per-route, per-user rate limiters protect API resources
- **JWT in httpOnly cookies** — tokens stored in httpOnly cookies (not localStorage), verified using HS256

## Layers

### Frontend Layers

**App Layer:**
- Purpose: Root component, providers, routing, global layout
- Location: `frontend/src/app/`
- Contains: `App.jsx`, `Router.jsx`, `Providers.jsx`
- Depends on: React Router, @tanstack/react-query, useAuth context
- Used by: `main.jsx` entry point

**Feature Layer:**
- Purpose: Domain-specific pages, components, and API clients
- Location: `frontend/src/features/`
- Contains: `activities/`, `auth/`, `food-log/`, `profile/`, `progress/`
- Depends on: Shared library, app layer
- Used by: Router

**Shared Layer:**
- Purpose: Reusable utilities, HTTP client, calendar components, hooks
- Location: `frontend/src/shared/`
- Contains: `lib/http.js`, `calendar/`, `hooks/`
- Depends on: Nothing internal
- Used by: All feature modules

### Backend Layers

**Entry Layer:**
- Purpose: Server bootstrap, env loading, DB connection
- Location: `backend/src/server.js`
- Depends on: `app.js`, `config/database.js`
- Used by: Runtime

**Middleware Layer:**
- Purpose: Request preprocessing (auth verification, rate limiting)
- Location: `backend/src/middlewares/`
- Contains: `auth.middleware.js`, `dailyMealPlanRateLimiter.js`, `weeklyPlanRateLimiter.js`, `activityPlanRateLimiter.js`
- Depends on: `utils/errors.js`, `jsonwebtoken`
- Applied by: `app.js` and individual route files

**Route Layer:**
- Purpose: HTTP method + path mapping to controllers, middleware binding
- Location: `backend/src/routes/`
- Contains: `auth.routes.js`, `activity.routes.js`, `dailyMealPlan.routes.js`, `food.routes.js`, `profile.routes.js`, `weeklyPlan.routes.js`, `progress.routes.js`, `docs.routes.js`, `activityPlan.routes.js`
- Depends on: Controllers, middleware
- Used by: `app.js` via `app.use('/api/...', routes)`

**Controller Layer:**
- Purpose: Request validation, service orchestration, response formatting
- Location: `backend/src/controllers/`
- Contains: `auth.controller.js`, `activity.controller.js`, `dailyMealPlan.controller.js`, `food.controller.js`, `profile.controller.js`, `weeklyPlan.controller.js`, `weightLog.controller.js`, `activityPlan.controller.js`
- Depends on: Services, utils (`response.js`, `errors.js`)
- Used by: Routes

**Service Layer:**
- Purpose: Business logic, LLM integration, calculations
- Location: `backend/src/services/`
- Contains: `auth.service.js`, `llm.service.js`, `dailyMealPlan.service.js`, `profile.service.js`, `activity.service.js`, `activityLog.service.js`, `food.service.js`, `mealPlan.service.js`, `weightLog.service.js`, `activityPlan.service.js`
- Depends on: Repositories, utils, LLM client
- Used by: Controllers

**Repository Layer:**
- Purpose: Data access — raw SQL queries against PostgreSQL via `pg.Pool`
- Location: `backend/src/repositories/`
- Contains: `user.repository.js`, `food.repository.js`, `profile.repository.js`, `activity.repository.js`, `weeklyPlan.repository.js`, `dailyMealPlan.repository.js`, `weightLog.repository.js`, `mealPlan.repository.js`, `activityPlan.repository.js`
- Depends on: `config/database.js` (pool)
- Used by: Services

**Config Layer:**
- Purpose: Database connection pool, Passport strategies
- Location: `backend/src/config/`
- Contains: `database.js`, `passport.js`
- Depends on: `pg`, `passport`, `dotenv`
- Used by: Server bootstrap, auth middleware

## Data Flow

### Primary Request Path (API Request → Response)

1. **HTTP Request arrives** at Express server (`backend/src/server.js:9`)
2. **Middleware stack** processes request in order (`backend/src/app.js:78-101`):
   - `helmet()` → security headers
   - `cors(origin: FRONTEND_URL, credentials: true)` → CORS
   - `compression()` → gzip
   - `morgan('dev')` → request logging
   - `express.json()` → body parsing
   - `cookieParser()` → cookie parsing
   - `passport.initialize()` → Passport init
   - Global rate limiter
3. **Route-level rate limiter** applied per-route group
4. **Auth middleware** (`authenticateToken`) verifies JWT from httpOnly cookie (`backend/src/middlewares/auth.middleware.js`)
5. **Route handler** calls controller function with `(req, res, next)`
6. **Controller** extracts/validates input, calls service(s), formats response
7. **Service** executes business logic, calls repositories for data
8. **Repository** runs SQL query against PostgreSQL pool
9. **Response** flows back as `{ success: true, data: {...} }` or `{ success: false, error: { message, code } }`

### LLM Plan Generation Flow (Weekly Activity Plan)

1. **Client** calls `POST /api/weekly-plans/generate` with `{ weekStart }`
2. **Controller** calls `generateWeeklyPlan(deps)` in `llm.service.js`
3. **Service** checks `getCachedPlan()` — returns cached plan if fresh
4. **Service** fetches profile, activity history, DB activities in parallel via `Promise.all()`
5. **Service** builds system prompt from template (`backend/prompts/weekly-plan-prompt.md`)
6. **Service** calls OpenRouter API with model chain (primary → fallback1 → fallback2)
7. **Service** validates LLM response structure via `validatePlanStructure()`
8. **Service** fuzzy-matches activity names via `validateAndFixPlan()` (exact → contains → Levenshtein)
9. **Service** retries with correction prompt if validation fails (up to 2 attempts)
10. **Service** caches result via `setCachedPlan()` and returns to controller
11. **Fallback** — if all LLM attempts fail, `generateFallbackPlan()` creates template-based plan from recent history

### Auth Flow (Login → Session)

1. **POST /api/auth/login** with `{ email, password }`
2. **Controller** calls `loginUser()` in `auth.service.js`
3. **Service** finds user by email, compares bcrypt hash, generates JWT (HS256, 7d expiry)
4. **Response** sets httpOnly `token` cookie + returns user object
5. **Frontend** `useAuth` context calls `/api/auth/me` to verify session on mount
6. **Subsequent requests** browser automatically sends `token` cookie

**State Management:**
- **Server side:** No global state beyond `node-cache` for LLM plans and Passport session (sessionless — JWT, no server-side session store)
- **Client side:** React local state (`useState`/`useEffect`), `useAuth` React context for user session, `@tanstack/react-query` for server state (API data caching/refetching)

## Key Abstractions

**Express Router (backend):**
- Purpose: Define route handlers with chained middleware
- Examples: `backend/src/routes/activity.routes.js`, `backend/src/routes/dailyMealPlan.routes.js`
- Pattern: `Router()` → `router.use(authMiddleware)` → `router.get('/path', controller.handler)` → `export default router`

**Standard Response Format:**
- Purpose: Consistent API response envelope
- Tools: `backend/src/utils/response.js`
- Pattern: `successResponse(res, data, statusCode)` → `{ success: true, data }` / `errorResponse(res, message, statusCode, code)` → `{ success: false, error: { message, code } }`

**Custom Error Classes:**
- Purpose: Typed errors with HTTP status codes
- Examples: `ValidationError` (400), `AuthenticationError` (401), `NotFoundError` (404), `AppError` (generic)
- Location: `backend/src/utils/errors.js`
- Pattern: Extends `AppError` which extends `Error`, sets `statusCode` and `name`

**LLM Service Dependency Injection:**
- Purpose: Decouple LLM service from data fetching — callers pass getter functions
- Pattern: `generateWeeklyPlan({ getProfile, getActivityHistory, getActivities, getTopActivities, ... })`
- Examples: `backend/src/services/llm.service.js:433`

**Feature Module Index (frontend):**
- Purpose: Barrel file for consumption by Router
- Examples: `frontend/src/features/activities/index.js`, `frontend/src/features/food-log/index.js`
- Pattern: Re-exports main page component and/or API functions

**HTTP Client (frontend):**
- Purpose: Centralized fetch wrapper with `credentials: 'include'` for httpOnly cookies
- Location: `frontend/src/shared/lib/http.js`
- Pattern: `apiGet(path)`, `apiPost(path, body)`, `apiDelete(path)` — all return parsed JSON

## Entry Points

**Backend Server:**
- Location: `backend/src/server.js`
- Triggers: `node src/server.js`, `npm run dev` (backend workspace)
- Responsibilities: Loads env, creates Express app, starts HTTP listener on `PORT` (default 3001), connects DB pool, registers global error handlers

**Backend App:**
- Location: `backend/src/app.js`
- Triggers: Imported by `server.js`, exported for testing (used by supertest)
- Responsibilities: Configures Express with middleware stack, mounts all route groups, serves SPA static files, SPA catch-all, 404 handler, global error handler

**Frontend Entry:**
- Location: `frontend/src/main.jsx`
- Triggers: Vite dev server, `index.html`
- Responsibilities: DOM mounting of React app, StrictMode wrapper

**Frontend App:**
- Location: `frontend/src/app/App.jsx`
- Responsibilities: Renders `<Providers>` (QueryClient + AuthProvider) and `<Router>` children

**Frontend Router:**
- Location: `frontend/src/app/Router.jsx`
- Responsibilities: Client-side routing with `react-router-dom`, auth guards (`ProtectedRoute`, `PublicRoute`), profile guard, responsive layout with navigation, dashboard overview page

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. All async I/O uses async/await with Promises.
- **Global state:** `node-cache` instance in `backend/src/services/llm.service.js:48` — single in-memory cache shared across all users. Per-user mutex (`locks` Map at line 52) prevents TOCTOU race on cache read-modify-write for swap/regenerate operations.
- **ESM modules:** All source files use ES module syntax (`import`/`export`). CommonJS (`require`) not used.
- **Database connections:** Single `pg.Pool` (max 10 connections) created at startup in `backend/src/config/database.js`. No connection pooling per request.
- **No TypeScript in source:** Backend is pure JavaScript (`.js`). Frontend uses `.jsx` and optional `@ts-check`. TypeScript config exists for linting only (`tsconfig.json`).
- **Missing files on disk (git-only):** Many backend files exist in git history but are not present in the working directory. They were restored as empty stubs in commit `d1ce6ec`. The working tree only has 13 `backend/src/` files vs 40+ in git.

## Anti-Patterns

### Missing Repository/Utils/Middleware files on disk

**What happens:** The working directory (`backend/src/`) is missing entire subdirectories (`repositories/`, `utils/`) and multiple files (`config/passport.js`, `middlewares/auth.middleware.js`, multiple controllers, routes, services). These files exist in git history but are absent from the working tree. The `Routes` in `app.js` reference routes that have no corresponding file on disk (e.g., `auth.routes.js`, `profile.routes.js`, `food.routes.js`).

**Why it's wrong:** Any attempt to start the backend with `npm run dev` will fail with `ERR_MODULE_NOT_FOUND` because import paths referenced in `app.js` resolve to files that don't exist on disk.

**Do this instead:** Run `git checkout` to restore the missing files. The backend requires all files tracked in git to function. Alternatively, update the working tree to match the committed state.

### Duplicate nested backend directory in git

**What happens:** The git tree has duplicate backend source under `backend/backend/src/` (e.g., `backend/backend/src/utils/errors.js`) alongside `backend/src/utils/errors.js`. This happened during prior restores/snapshots.

**Why it's wrong:** Confuses the source of truth. The `backend/backend/` path is a historical artifact, not the intended source location.

**Do this instead:** Only use `backend/src/` as the source. The nested path should be removed from git or ignored.

### In-memory cache without persistence

**What happens:** `node-cache` in `llm.service.js` caches generated plans with a 1-hour TTL. Cache is lost on server restart.

**Why it's wrong:** Plans regenerated on every server restart (until DB cache fallback was added in commit `ea67d0a`).

**Do this instead:** The current approach uses DB as persistent cache, which mitigates this. Keep the in-memory cache as a hot cache layer.

## Error Handling

**Strategy:** Centralized error handler with custom error classes and consistent response format.

**Patterns:**
- Controllers wrap logic in `try/catch`, calling `next(err)` to delegate to global error handler (`backend/src/app.js:200-210`)
- Specific error classes (`ValidationError`, `AuthenticationError`, `NotFoundError`) are caught in controllers and returned directly with status codes
- Global error handler converts unknown errors to `500 HTTP_SERVER_ERROR` responses, converting camelCase error names to UPPER_SNAKE_CASE
- LLM service has its own error types (`LlmEmptyResponse`, `LlmParseError`, `LlmConfigError`, `LlmAllFailed`, `SwapFallbackError`)
- Rate limiters return 429 with `RATE_LIMITED` code and structured response body

**Error response format:**
```json
{ "success": false, "error": { "message": "...", "code": "UPPER_SNAKE_CASE" } }
```

## Cross-Cutting Concerns

**Logging:**
- HTTP request logging via `morgan('dev')` middleware (`backend/src/app.js:92`)
- Service-level logging via `console.log`/`console.error` throughout
- Database pool errors logged via pool `error` event (`backend/src/config/database.js:30-37`)
- LLM service logs model failures, validation errors, and fallback triggers

**Validation:**
- Input validation at controller level (`express-validator` in routes, manual checks in controllers)
- LLM output validated structurally (`validatePlanStructure`) and semantically (`validateAndFixPlan` with fuzzy matching)
- Rate limiters validate request headers (`validate: { xForwardedForHeader: false }`)

**Authentication:**
- JWT-based authentication via httpOnly cookies (not localStorage/headers)
- Google OAuth as secondary auth option via Passport.js
- Auth middleware (`authenticateToken`) applied per-route-group in route files
- Rate limiting specifically on login/register endpoints (10/min)

**Rate Limiting:**
- Global: 600/min across all requests (`backend/src/app.js:66-72`)
- Per-route: Auth (10/min), Profile (60/min), Food (60/min), Activities (20/min), Weekly Plans (50/min generate, 30/min regenerate, 10/min swap, 60/min toggle), Daily Meal Plans (20/min)
- Per-user: Weekly plan and meal plan limiters keyed by `req.user.userId`
- Test mode: All limits raised to ~1000/min and windows shortened to 1s for test speed

---

*Architecture analysis: 2026-06-02*
