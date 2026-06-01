# Codebase Concerns

**Analysis Date:** 2026-06-01

## Tech Debt

### Critical: Migration to npm Workspaces — Implementation Files Empty

**Issue:** The repository was restructured from a flat `backend/` layout into npm workspaces (`backend/` root → `backend/backend/` + `backend/frontend/`), but the file contents were not migrated. 32 of 45 backend source files and 42 of 72 frontend source files are **0 bytes (empty)**.

**Files (empty in `backend/backend/src/`):**
- **All utilities:** `backend/backend/src/utils/errors.js`, `response.js`, `string.js`, `dbErrors.js`, `food.js`
- **Auth middleware:** `backend/backend/src/middlewares/auth.middleware.js`
- **All repositories:** `backend/backend/src/repositories/activity.repository.js`, `dailyMealPlan.repository.js`, `food.repository.js`, `mealPlan.repository.js`, `profile.repository.js`, `user.repository.js`, `weeklyPlan.repository.js`, `weightLog.repository.js`
- **Most services:** `backend/backend/src/services/activity.service.js`, `activityLog.service.js`, `food.service.js`, `mealPlan.service.js`, `profile.service.js`, `weightLog.service.js`
- **Most controllers:** `backend/backend/src/controllers/food.controller.js`, `profile.controller.js`, `weeklyPlan.controller.js`, `weightLog.controller.js`
- **Most routes:** `backend/backend/src/routes/auth.routes.js`, `docs.routes.js`, `food.routes.js`, `profile.routes.js`, `progress.routes.js`, `weeklyPlan.routes.js`
- **Passport config:** `backend/backend/src/config/passport.js`
- **Test file:** `backend/backend/src/__tests__/food.utils.test.js`
- **Most test suites:** 7 of 10 test files in `backend/backend/tests/` are empty (only `remaining-endpoints.test.js` and `llm.service.test.js` have content)

**Impact:** The app will crash at startup when importing from these files. For example:
- `backend/backend/src/services/auth.service.js` (line 8) imports `ValidationError` and `AuthenticationError` from `../utils/errors.js` — empty file → import fails at module evaluation
- `backend/backend/src/services/llm.service.js` (line 6) imports `AppError`, `ValidationError`, `NotFoundError` from `../utils/errors.js` — empty → crash
- `backend/backend/src/controllers/auth.controller.js` (line 3) imports from `../utils/response.js` and `../utils/errors.js` — both empty → crash
- `backend/backend/src/routes/activity.routes.js` (line 3) imports `authenticateToken` from `../middlewares/auth.middleware.js` — empty → crash
- All route files import empty middleware → every endpoint broken

**Fix approach:** Restore the file contents from git history (old `backend/src/` files at HEAD commit). The old implementations exist in the git working tree as deleted files and can be recovered by copying from `HEAD:backend/src/` to `backend/backend/src/`.

### Critical: Frontend Workspace Also Empty

**Issue:** The `backend/frontend/` workspace (the npm workspace for the frontend) has 42 of 72 source files at 0 bytes. This includes all React components, hooks, API modules, test files, and App-level files.

**Key empty files:**
- `backend/frontend/src/app/App.jsx` — App entry point (app in `backend/frontend/vite.config.js` references `src/main.jsx` which is missing)
- `backend/frontend/src/app/Router.jsx` — Router for all features
- `backend/frontend/src/main.jsx` — Main entry point
- All feature components across `activities/`, `auth/`, `food-log/`, `profile/`, `progress/` directories
- All `shared/` UI components (CalendarGrid, DayDetailPanel, etc.)
- All API modules (`authApi.js`, `foodLogApi.js`, `profileApi.js`, etc.)
- All test files

**Impact:** The frontend cannot build or run. `vite build` and `npm run dev` will fail to resolve imports.

**Fix approach:** Restore from the old `frontend/` source files at HEAD commit (they were removed in the restructuring).

### Critical: ActivityPlan Feature in Wrong Location

**Issue:** Activity plan files exist at `backend/src/` (the old source root, outside the workspace) and are not integrated into the Express app at `backend/backend/src/app.js`.

**Files stuck outside workspace:**
- `backend/src/services/activityPlan.service.js` (7627 bytes — has content)
- `backend/src/controllers/activityPlan.controller.js` (4864 bytes)
- `backend/src/repositories/activityPlan.repository.js` (1986 bytes)
- `backend/src/routes/activityPlan.routes.js` (543 bytes)
- `backend/src/middlewares/activityPlanRateLimiter.js` (804 bytes)

**Impact:** These files exist but are unreferenced by the new app. They're not copied into the workspace structure. The activity plan feature is effectively inaccessible.

### No Logging Library

**Issue:** The codebase uses raw `console.log()`, `console.error()`, `console.warn()` throughout instead of a structured logging library.

**Files:**
- `backend/backend/src/services/llm.service.js` — 17 console.* calls
- `backend/backend/src/services/dailyMealPlan.service.js` — 8 console.* calls
- `backend/backend/src/controllers/activity.controller.js` — 2 console.* calls
- `backend/backend/src/config/database.js` — 4 console.* calls
- `backend/backend/src/server.js` — 6 console.* calls
- `backend/backend/src/app.js` — 2 console.* calls

**Impact:** No structured log format, no log levels (debug/info/warn/error), no log routing, no searchability. Production debugging and monitoring depend on unstructured stdout.

**Fix approach:** Integrate a logging library like `pino` or `winston`, replace console.* calls, and configure log levels via env var.

## Known Bugs

### `errors.js` Empty — AppError Classes Missing at Import Time

**Symptoms:** Any route or service that imports from `../utils/errors.js` will crash on import. Affected files:
- `backend/backend/src/services/auth.service.js` (imports ValidationError, AuthenticationError)
- `backend/backend/src/services/llm.service.js` (imports AppError, ValidationError, NotFoundError)
- `backend/backend/src/services/dailyMealPlan.service.js` (imports AppError)
- `backend/backend/src/controllers/auth.controller.js` (imports ValidationError, AuthenticationError)

**Trigger:** Any HTTP request hitting auth routes, activity routes, daily meal plan routes, or any route requiring the error classes.

**Fix:** Restore error class definitions from old `backend/src/utils/errors.js` at HEAD commit.

### `response.js` Empty — `successResponse`/`errorResponse` Missing

**Symptoms:** `backend/backend/src/controllers/auth.controller.js` imports `successResponse` and `errorResponse` from `../utils/response.js`. Module will fail to load.

**Trigger:** Starting the server. `app.js` (line 23) also imports `errorResponse` from this file.

**Fix:** Restore response utility functions from old `backend/src/utils/response.js`.

### `auth.middleware.js` Empty — Authentication Middleware Missing

**Symptoms:** `backend/backend/src/routes/activity.routes.js` (line 3), `dailyMealPlan.routes.js` (line 3) import `authenticateToken`. All protected routes will fail.

**Trigger:** Any request to `/api/activities/*` or `/api/daily-meal-plans/*`.

**Fix:** Restore `authenticateToken` from old `backend/src/middlewares/auth.middleware.js`.

### `string.js` Empty — `levenshteinDistance` Missing

**Symptoms:** `backend/backend/src/services/llm.service.js` (line 7) imports `levenshteinDistance`. LLM activity matching will crash.

**Trigger:** An LLM prompt response that requires fuzzy-matching activity names (happens on every weekly plan generation that finds non-exact matches).

**Fix:** Restore `levenshteinDistance` from old `backend/src/utils/string.js`.

### `food.service.js` Empty — Food Service Missing

**Symptoms:** `backend/backend/src/app.js` (line 17) imports `foodRoutes` from `./routes/food.routes.js` which is empty. Routes to food endpoints will not exist.

**Trigger:** Any request to `/api/food/*`.

**Fix:** Restore from old `backend/src/services/food.service.js`.

### `passport.js` Empty — Google OAuth Config Missing

**Symptoms:** `backend/backend/src/app.js` (line 13) imports passport from `./config/passport.js`, which is empty. Google OAuth `/api/auth/google` and `/api/auth/google/callback` will fail.

**Trigger:** Google OAuth login attempts.

**Fix:** Restore Passport configuration from old `backend/src/config/passport.js`.

### Dockerfile References Old Structure

**Symptoms:** The `Dockerfile` at repo root copies from `frontend/` and `backend/` directories, but the new structure nests these under `backend/backend/` and `backend/frontend/`. Multi-stage build will fail with missing files.

**Fix:** Update Dockerfile paths to match the new workspace layout (`backend/backend/` for server, `backend/frontend/` for frontend source).

## Security Considerations

### JWT Secret — No Default Validation

**Issue:** `backend/backend/src/services/auth.service.js` reads `process.env.JWT_SECRET` with no fallback or runtime validation. If unset, `jwt.sign()` with an undefined/empty key produces a trivially forged token.

- File: `backend/backend/src/services/auth.service.js`, line 148
- Risk: Authentication bypass if env var is missing
- Current mitigation: `.env.example` documents it as required
- Recommendation: Add runtime check at server startup (fail if `JWT_SECRET` is missing or too short)

### Database SSL — `rejectUnauthorized: false`

**Issue:** `backend/backend/src/config/database.js` (line 24) sets `ssl: { rejectUnauthorized: false }`. This disables TLS certificate verification for the PostgreSQL connection.

- Risk: Man-in-the-middle attacks on database connections
- Current mitigation: Uses Supabase connection pooler with session mode (port 6543)
- Recommendation: Set `rejectUnauthorized: true` for production, configure proper CA certificate

### OpenRouter API Key — Module-Level Check

**Issue:** `backend/backend/src/services/llm.service.js` (lines 15-18) checks `OPENROUTER_API_KEY` at module load time. The module is imported at app startup, so a missing key causes early console.error but does NOT prevent app startup.

- Risk: LLM features silently fail if key is missing; `getClient()` returns `null`, subsequent calls throw `LlmConfigError`
- Recommendation: Add a boot-time health check that verifies all required env vars

### Cookie Security — SameSite None Over HTTP

**Issue:** `backend/backend/src/controllers/auth.controller.js` (line 12) sets `sameSite: 'none'` and `secure: true` on JWT cookies. This is correct for HTTPS but the app also runs locally on HTTP.

- Risk: If deployed without HTTPS or behind a proxy that terminates SSL, the cookie won't be set
- Recommendation: Conditionally set `secure` based on `NODE_ENV` (true for production, false for local dev)

### Password Stub for Timing Attack Prevention

**Issue:** `backend/backend/src/services/auth.service.js` (line 76) uses `'$2b$10$' + 'a'.repeat(53)` as a dummy bcrypt hash for timing side-channel protection. This is a valid approach but the hardcoded string format could break if bcryptjs changes its hash format.

- File: `backend/backend/src/services/auth.service.js`
- Risk: Low — approach is standard, but the hardcoded string is brittle
- Recommendation: Extract to a named constant with comment

### `.env` File Present

**Issue:** A `.env` file exists at `backend/.env` (1237 bytes). Contains environment configuration.

- Risk: Standard — `.env` is in `.gitignore` but should be double-checked for accidental commits
- Recommendation: Ensure `.gitignore` excludes `.env` and audit git history for any committed secrets

## Performance Bottlenecks

### LLM Plan Generation — Blocking Synchronous Cache

**Issue:** `backend/backend/src/services/llm.service.js` (line 52) uses a per-user in-memory mutex (`locks` Map) that spins with `setTimeout(100ms)` busy-waiting. During high concurrency, this adds latency and wastes event loop cycles.

- Files: `backend/backend/src/services/llm.service.js`, lines 54-62
- Cause: `acquireLock()` does a 100ms polling loop for up to 15 seconds
- Impact: Under concurrent requests for the same user+week, requests queue serially
- Improvement path: Use an async semaphore library or a dedicated locking mechanism

### In-Memory Plan Cache — No Distributed Invalidation

**Issue:** `backend/backend/src/services/llm.service.js` (line 48) uses `node-cache` with 1-hour TTL. In multi-instance deployments, cache is per-process and not shared.

- File: `backend/backend/src/services/llm.service.js` (NodeCache)
- Impact: Stale data on one instance, inconsistent user experience across instances
- Recommendation: Replace with Redis or Supabase-based caching for production

### ORDER BY RAND() Queries

**Issue:** Rate limiter comment in `backend/backend/src/app.js` (line 136) references "ORDER BY RAND() queries" as the reason for stricter rate limiting on activity endpoints.

- Risk: `ORDER BY RAND()` scans the entire table, generates a random value for every row, sorts, then returns a small result. On large activity tables, this becomes extremely slow.
- Recommendation: Use a `TABLESAMPLE` or application-level random offset approach

### Deep Clone Patterns (JSON.parse/stringify)

**Issue:** `backend/backend/src/services/llm.service.js` uses `JSON.parse(JSON.stringify(plan))` for deep cloning in multiple places (lines 320, 525, 571, 577, 755, 766). This is expensive on large plan objects and loses Date objects, undefined values, and prototypes.

- Impact: Performance overhead on every plan generation and swap operation
- Recommendation: Use a structuredClone() or a fast deep-clone library for large objects

### All-Generations-Failed Fallback Path

**Issue:** When all LLM calls fail (up to 2 attempts × 3 models × 2 validation stages), the `generateFallbackPlan()` still makes additional async calls to `getTopActivities()` and `getRandomActivity()`. The worst-case path can take 30+ seconds with 15+ HTTP calls to OpenRouter before returning a fallback.

- File: `backend/backend/src/services/llm.service.js`
- Recommendation: Add circuit breaker pattern; cache a simple fallback plan keyed by user profile

## Fragile Areas

### Activity Plan File Duplication

**Issue:** The activity plan feature has files in TWO locations:
1. `backend/src/` (old source root) — has actual implementation
2. `backend/backend/src/` (new workspace) — activity controller and related files DO exist here

The `backend/backend/src/controllers/activity.controller.js` (10338 bytes) references activity plan operations inline, while `backend/src/services/activityPlan.service.js` (7627 bytes) has a parallel implementation. It's unclear which is the primary implementation.

**Files:**
- `backend/backend/src/controllers/activity.controller.js` (has content — activity + activity plan logic mixed)
- `backend/src/services/activityPlan.service.js` (has content — separate activity plan service)
- `backend/src/controllers/activityPlan.controller.js` (has content)
- `backend/src/routes/activityPlan.routes.js` (has content)

**Why fragile:** Duplicate implementations will diverge over time. Mixed responsibilities in the activity controller make the file large (10338 bytes).

**Test coverage:** Only `llm.service.test.js` (23427 bytes) has substantial test content. Activity plan logic has no tests.

### Large File: `llm.service.js` (29305 bytes)

**File:** `backend/backend/src/services/llm.service.js`

**Why fragile:** This single file handles prompt building, multiple LLM API call strategies, model fallback logic (3-tier), response parsing, structure validation, name fuzzy matching (exact/contains/Levenshtein), plan caching with TTL, per-user mutex locking, day regeneration, activity swapping, fallback plan generation, and cache invalidation.

**Safe modification:** Changes to any one concern (e.g., prompt format) risk breaking other logic (e.g., cache key format, validation, swapping). Testing is essential.

**Test coverage:** `llm.service.test.js` exists (23427 bytes) but depends on empty `errors.js` and `string.js` — will not run until those are restored.

### Large File: `dailyMealPlan.service.js` (13311 bytes)

**File:** `backend/backend/src/services/dailyMealPlan.service.js`

**Why fragile:** Contains LLM call logic for meal plan generation, persistence, validation, meal logging, and regeneration. Similar to `llm.service.js` in complexity.

**Test coverage:** No test file exists specifically for this service.

### `activity.controller.js` (10338 bytes) — Mixed Concerns

**File:** `backend/backend/src/controllers/activity.controller.js`

**Why fragile:** Mixes activity CRUD, activity plan logic, and plan synchronization in a single controller. Has inline database access patterns that should be in repositories.

**Safe modification:** Each exported function has clear responsibility (log, getLogs, delete, getHistory, getSummary, syncToPlan) but the file is too large for a controller.

### Module-Level Module Instance (`openaiClient`)

**File:** `backend/backend/src/services/llm.service.js`, line 20

**Why fragile:** The `openaiClient` is a module-level singleton created lazily. If `API_KEY` changes at runtime (e.g., updated env var), the old client is still used. In tests, this state leaks between test suites unless explicitly reset.

### Test Files Empty — 80% Test Coverage Gap

**Files (empty):**
- `backend/backend/tests/unit/activity.service.test.js`
- `backend/backend/tests/unit/auth.service.test.js`
- `backend/backend/tests/unit/dbErrors.test.js`
- `backend/backend/tests/unit/food.service.test.js`
- `backend/backend/tests/unit/profile.service.test.js`
- `backend/backend/tests/integration/api.test.js`
- `backend/backend/tests/integration/helpers.js`
- `backend/backend/tests/integration/weeklyPlan.e2e.test.js`
- `backend/frontend/tests/CustomFoodForm.test.js`
- All `__tests__` directories in frontend features

**Files with content:**
- `backend/backend/tests/unit/llm.service.test.js` (23427 bytes)
- `backend/backend/tests/integration/remaining-endpoints.test.js` (14597 bytes)
- `backend/backend/src/__tests__/food.utils.test.js` (0 bytes)

**Impact:** Most test coverage is lost. Only LLM service and remaining-endpoint integration tests survive.

## Scaling Limits

### LLM Model Fallback (3-tier)

**Issue:** `backend/backend/src/services/llm.service.js` (lines 143-147) tries up to 3 models in sequence. Each model call has a 30-second timeout. In worst case, 3 timeouts = 90 seconds before falling back.

- Current capacity: ~3 concurrent LLM users before rate limits hit
- Limit: OpenRouter token limits and per-IP rate limits (shared across users)
- Scaling path: Queue-based LLM requests, use streaming responses, pre-generate plans on user profile creation

### Database Connection Pool

**Issue:** `backend/backend/src/config/database.js` (line 25) uses `max: 10` for the pg Pool.

- Current capacity: 10 concurrent database connections
- Limit: Supabase free tier connection limits (typically 15-30 simultaneous connections)
- Scaling path: Increase pool size proportionally to server instances, use connection pooling via PgBouncer (Supabase already provides this on port 6543)

### No Redis/Session Store

**Issue:** The app uses in-memory state for plan cache (NodeCache), rate limiting (express-rate-limit in-memory), and no session persistence beyond JWT cookies.

- Limit: Cannot scale to multiple instances without losing rate limit state and plan cache
- Scaling path: Use Redis or shared cache for rate limiting and plan caching

## Dependencies at Risk

### Express 5.x (Release Candidate)

**Issue:** `backend/backend/package.json` uses `"express": "^5.2.0"`. Express 5 is a newer major version with breaking changes from Express 4. Some middleware (morgan, express-rate-limit) has had compatibility issues with Express 5.

- Risk: Middleware incompatibility, unexpected breaking changes on minor updates
- Impact: If `^5.2.0` resolves to 5.3.x with breaking changes, the app could break
- Migration plan: Pin to exact version `5.2.0`, or analyze Express 5 compatibility matrix

### `tsx` for Dev Only

**Issue:** `backend/package.json` devDependencies includes `tsx` for running TypeScript files, but the actual backend uses plain JS (`.js` files). The need for tsx from the root workspace is unclear.

- Risk: Confusion about TypeScript usage — `tsconfig.json` exists at `backend/` but all source is `.js`
- Recommendation: Either adopt TypeScript for the `backend/backend/` workspace or remove tsconfig.json and tsx dependency

### `@google/genai` in Root Dependencies

**Issue:** `backend/package.json` includes `@google/genai` as a dependency, but the LLM service uses OpenRouter (OpenAI-compatible API, uses `openai` npm package in the `backend/backend/` workspace).

- Risk: Unused dependency at the workspace root adds bloat and potential confusion
- Recommendation: Move `@google/genai` to the correct workspace or remove if unused

### `motion` (Framer Motion) in Root Dependencies

**Issue:** `backend/package.json` includes `motion ^12.23.24` at the workspace root. If the frontend uses Framer Motion for animations, it should be in `backend/frontend/package.json`, not the root.

## Missing Critical Features

### Database Migration Strategy

**Issue:** The `backend/backend/db/` directory contains raw SQL files (`schema.sql`, `seed.sql`, etc.) but there is no migration runner or schema versioning. The `db:migrate` script in `backend/backend/package.json` manually pipes SQL files to `psql`.

- Problem: No up/down migrations, no version tracking, no automated rollback
- Blocks: Safe schema changes across environments (dev/staging/prod)

### No Input Validation Library Usage

**Issue:** `backend/backend/package.json` includes `express-validator` as a dependency, but it's unclear from the existing code whether validation middleware is consistently applied across all routes.

- Risk: Manual validation in controllers is error-prone and inconsistent

### Rate Limiter Config References Removed `activityPlan.routes.js`

**Issue:** The new `backend/backend/src/app.js` imports `weeklyPlanRoutes` and `dailyMealPlanRoutes` but NOT `activityPlanRoutes`. The old app.js referenced `activityPlanRoutes` from `./routes/activityPlan.routes.js`. The activity plan route integration is missing in the new app.

---

*Concerns audit: 2026-06-01*
