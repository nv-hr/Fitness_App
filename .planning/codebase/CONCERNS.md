# Codebase Concerns

**Analysis Date:** 2026-06-02

## CRITICAL: 279 Files Deleted from Working Tree

**Issue:** A massive number of files — 279 total — have been deleted from the working tree (`git status` shows `D` for them) but still exist in git HEAD. This includes 47+ essential backend source files and 20+ essential frontend source files that are imported by existing code.

**Impact:** The codebase is in a non-functional state. Any attempt to run the application will produce dozens of `ERR_MODULE_NOT_FOUND` import errors. The application cannot start, build, or run tests without restoring these files.

**Fix approach:** Run `git checkout HEAD -- <file>` for each deleted source file, or `git restore .` (caution — also restores .planning/ files). Alternatively, review the diff to determine intentional deletions vs. accidental ones.

### Backend source files deleted from working tree (47 files)

**Config:**
- `backend/src/config/passport.js`

**Controllers:**
- `backend/src/controllers/activityPlan.controller.js`
- `backend/src/controllers/food.controller.js`
- `backend/src/controllers/profile.controller.js`
- `backend/src/controllers/weeklyPlan.controller.js`
- `backend/src/controllers/weightLog.controller.js`

**Middleware:**
- `backend/src/middlewares/activityPlanRateLimiter.js`
- `backend/src/middlewares/auth.middleware.js`

**Repositories (all deleted):**
- `backend/src/repositories/activity.repository.js`
- `backend/src/repositories/activityPlan.repository.js`
- `backend/src/repositories/dailyMealPlan.repository.js`
- `backend/src/repositories/food.repository.js`
- `backend/src/repositories/mealPlan.repository.js`
- `backend/src/repositories/profile.repository.js`
- `backend/src/repositories/user.repository.js`
- `backend/src/repositories/weeklyPlan.repository.js`
- `backend/src/repositories/weightLog.repository.js`

**Routes:**
- `backend/src/routes/activityPlan.routes.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/routes/docs.routes.js`
- `backend/src/routes/food.routes.js`
- `backend/src/routes/profile.routes.js`
- `backend/src/routes/progress.routes.js`
- `backend/src/routes/weeklyPlan.routes.js`

**Services:**
- `backend/src/services/activity.service.js`
- `backend/src/services/activityLog.service.js`
- `backend/src/services/activityPlan.service.js`
- `backend/src/services/food.service.js`
- `backend/src/services/mealPlan.service.js`
- `backend/src/services/profile.service.js`
- `backend/src/services/weightLog.service.js`

**Utils (all deleted):**
- `backend/src/utils/dbErrors.js`
- `backend/src/utils/errors.js`
- `backend/src/utils/food.js`
- `backend/src/utils/response.js`
- `backend/src/utils/string.js`

**Database SQL:**
- `backend/db/schema.sql`
- `backend/db/seed.sql`
- `backend/db/drop_user_activity_log.sql`
- `backend/db/add_activity_logs.sql`
- `backend/db/add_activity_plans.sql`
- `backend/db/add_daily_meal_plans.sql`
- `backend/db/add_meal_plans.sql`
- `backend/db/add_weight_logs.sql`
- `backend/db/init.sql`
- `backend/db/run_migration.js`

**Tests:**
- `backend/src/__tests__/food.utils.test.js`

### Frontend source files deleted from working tree (20+ files)

**App:**
- `frontend/src/app/Providers.jsx`

**Auth:**
- `frontend/src/features/auth/hooks/useAuth.jsx`
- `frontend/src/features/auth/api/authApi.js`
- `frontend/src/features/auth/index.js`

**Food Log:**
- `frontend/src/features/food-log/api/foodLogApi.js`
- `frontend/src/features/food-log/components/previewCalories.js`
- `frontend/src/features/food-log/index.js`

**Activities:**
- `frontend/src/features/activities/api/activityPlanApi.js`
- `frontend/src/features/activities/components/previewCalories.js`
- `frontend/src/features/activities/index.js`

**Progress:**
- `frontend/src/features/progress/api/weightApi.js`
- `frontend/src/features/progress/components/WeightEntryCard.jsx`
- `frontend/src/features/progress/components/WeightHistoryTable.jsx`
- `frontend/src/features/progress/hooks/useTrendPrediction.js`
- `frontend/src/features/progress/index.js`

**Profile:**
- `frontend/src/features/profile/api/profileApi.js`
- `frontend/src/features/profile/index.js`

**Shared (all deleted):**
- `frontend/src/shared/lib/http.js`
- `frontend/src/shared/hooks/useResponsive.js`
- `frontend/src/shared/calendar/index.js`
- `frontend/src/shared/calendar/CalendarGrid.jsx`
- `frontend/src/shared/calendar/CalendarPageLayout.jsx`
- `frontend/src/shared/calendar/DayDetailPanel.jsx`
- `frontend/src/shared/calendar/MonthNav.jsx`
- `frontend/src/shared/calendar/calendarUtils.js`
- `frontend/src/shared/calendar/hooks/useMonthData.js`
- `frontend/src/shared/calendar/__tests__/*.test.jsx` (4 test files)

## Incomplete Import Chains / Circular Dependencies

**Issue:** Missing `jest.setup.js` — `backend/package.json` references `jest.setup.js` but the file does not exist in the repository (deleted or never created):
```json
"setupFiles": ["./jest.setup.js"]
```

**Files:** `backend/package.json` (line 43-45)

**Impact:** Jest tests fail to run due to missing setup file.

---

**Issue:** `dailyMealPlan.service.js` imports `fuzzyMatchFoodName` and `recalculateDayCalories` from `'./mealPlan.service.js'` which has been deleted from the working tree.

**Files:** `backend/src/services/dailyMealPlan.service.js` (line 4)

**Impact:** Any call to `generateDailyMealPlan` or `regenerateCategory` will fail at runtime with import error.

---

**Issue:** `backend/src/routes/__tests__/` test directories referenced in integration tests may reference test helpers that have been deleted.

**Files:** `backend/tests/integration/remaining-endpoints.test.js` (line 25: imports `from './helpers.js'`)

**Impact:** Integration tests fail to run.

## Missing Configuration Files

**Issue:** Database SQL migration files are deleted. The `scripts/db-init.js` script references:
- `backend/db/schema.sql`
- `backend/db/seed.sql`
- `backend/db/drop_user_activity_log.sql`

None of these files exist in the working tree.

**Impact:** Cannot initialize or migrate the database from scratch.

---

**Issue:** `jest.setup.js` file missing (referenced in `backend/package.json`).

**Impact:** Jest cannot run — all test suites fail immediately with setup file not found.

---

**Issue:** `.env` file present in working tree. The `.env.example` shows required env vars. The file contains sensitive credentials and should not be committed.

**Files:** `.env`

**Risk:** Credential leak if committed to git.

---

**Issue:** Duplicate file path in git HEAD: `backend/backend/` directory contains a second copy of many source files (created by git restore in commit `d1ce6ec`). These include:
- `backend/backend/.env`
- `backend/backend/src/app.js`
- `backend/backend/src/config/passport.js`
- `backend/backend/src/repositories/*.js`
- `backend/backend/src/services/*.js`
- `backend/backend/src/utils/*.js`
- `backend/backend/src/middlewares/*.js`
- `backend/backend/src/routes/*.js`
- `backend/backend/src/controllers/*.js`

These are in git HEAD but not in the working tree.

**Impact:** Source of confusion — these duplicate files should be removed from git history.

## Tech Debt

### Lock Implementation Uses Busy-Waiting

**Issue:** The per-user mutex for cache TOCTOU race prevention uses a spinlock with 100ms polling:
```javascript
while (locks.get(key)) {
    if (Date.now() - start > timeout) throw new AppError('LockTimeout', 'Could not acquire lock', 429);
    await new Promise(r => setTimeout(r, 100));
}
```

**Files:** `backend/src/services/llm.service.js` (lines 54-62)

**Impact:** Busy-waiting wastes CPU cycles and adds latency under contention. 100ms polling means minimum 100ms delay even if lock is released immediately.

**Fix approach:** Use a proper async mutex library (e.g., `async-mutex`) or a callback-based queue.

---

### Excessive JSON Serialization for Deep Cloning

**Issue:** `JSON.parse(JSON.stringify(obj))` is used 10+ times for object cloning instead of `structuredClone` (available in Node 17+).

**Files:** `backend/src/services/llm.service.js` (lines 320, 525, 571, 577, 755, 766), `backend/src/services/dailyMealPlan.service.js` (lines 48, 217, 308)

**Impact:** Performance overhead — JSON serialization is slower than `structuredClone`. Breaks on objects with `undefined`, `Date`, `Map`, `Set`, or circular references.

**Fix approach:** Replace all instances with `structuredClone(obj)`.

---

### Global Rate Limiter Key

**Issue:** The global rate limiter uses a static key `'global'` (line 69 of app.js):
```javascript
keyGenerator: () => 'global',
```

**Files:** `backend/src/app.js` (line 69)

**Impact:** ALL requests across all users share one rate limit bucket. A single user or IP can exhaust the global limit for everyone. This is an anti-pattern for rate limiting.

**Fix approach:** Remove the global limiter and rely on per-route limiters, or use a per-IP key.

---

### getMonday Function Logic Error

**Issue:** The `getMonday` function in `activity.controller.js` has non-standard week calculation:
```javascript
const day = d.getUTCDay();
const diff = day === 0 ? -6 : 1;
d.setUTCDate(d.getUTCDate() - day + diff);
```

**Files:** `backend/src/controllers/activity.controller.js` (lines 158-165)

**Impact:** When day is Monday (1): `1 - 1 + 1 = 1` — stays on Monday, correct. But when day is Sunday (0): `0 - 0 + (-6) = -6` — goes to previous Monday. The `+1` offset when day !== 0 means Tuesday (2): `2 - 2 + 1 = 1` — goes BACK to Monday. This actually works but the logic is confusing and fragile.

**Fix approach:** Use standard `d.setDate(d.getDate() - ((d.getDay() + 6) % 7))` pattern.

---

### LLM Rate Limiting Doubled via Nested Middleware

**Issue:** The `dailyMealPlan.controller.js`'s `generate` handler goes through:
1. Global rate limiter (600 req/min global wall)
2. `dailyMealPlanLimiter` (20 req/min per user) applied in route
3. Inside the handler, `generateDailyMealPlan()` calls `callLlmApi()` which is itself an external API call with its own rate limits

The middleware limits apply to the HTTP endpoint, but the controller can also be triggered by the `regenerateCategoryHandler` which also applies the same limiter. This means a user can be rate limited on generate but still call regenerate-category.

**Files:** `backend/src/controllers/dailyMealPlan.controller.js`, `backend/src/middlewares/dailyMealPlanRateLimiter.js`

**Impact:** Rate limiting architecture is confusing and may not properly protect the LLM API from excessive calls.

---

### Cache Invalidation Strategy Risks

**Issue:** The plan cache in `llm.service.js` uses a 1-hour TTL with 1000 max keys and no explicit invalidation on plan mutation except `clearCachedPlan`. However, the `setCachedPlan` function writes to cache without verifying the caller has the latest version:

```javascript
export function setCachedPlan(userId, weekStart, plan, planType = 'activity') {
  planCache.set(`plan_${planType}_${userId}_${weekStart}`, plan);
}
```

**Files:** `backend/src/services/llm.service.js` (line 360-362)

**Impact:** Stale cache reads possible if two concurrent requests generate a plan at the same time. The TOCTOU lock in `swapActivity` mitigates this for swaps but the basic generate path is still vulnerable.

---

### Profile Nested Object Access Assumption

**Issue:** In `dailyMealPlan.service.js`, line 259:
```javascript
if (!profile || !profile.profile) {
```

This assumes the profile response has a nested `.profile` property, which suggests either a wrapped API response format or an inconsistent data shape. The `buildDailyMealPlanPrompt` at line 101 receives `profile` directly as `userProfile`:
```javascript
const userProfile = profile.profile;
```

**Files:** `backend/src/services/dailyMealPlan.service.js` (lines 259, 264)

**Impact:** If the profile service returns the profile object directly (not wrapped), this check will always throw and fall back to a generic 2000-calorie fallback plan.

---

### OpenRouter API Key Check at Module Load

**Issue:** The LLM service checks `OPENROUTER_API_KEY` at module import time and logs a fatally-worded error to the console:

```javascript
if (!API_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY is not set. LLM features will not work.');
}
```

**Files:** `backend/src/services/llm.service.js` (lines 15-18)

**Impact:** The "FATAL" message appears on every server start even if the user doesn't plan to use LLM features. Not actually fatal — the server still starts and non-LLM routes work fine.

---

### Duplicate Environment Variable Configuration

**Issue:** `dotenv.config()` is called in both `server.js` (line 1-2) and `database.js` (line 7):

```javascript
// server.js
import dotenv from 'dotenv';
dotenv.config();

// database.js
dotenv.config({ path: resolve(__dirname, '../../.env'), override: true });
```

**Files:** `backend/src/server.js` (lines 1-2), `backend/src/config/database.js` (line 7)

**Impact:** The database module loads `.env` with `override: true` which could inadvertently override environment variables already set by the runtime. The path also assumes a specific project structure.

---

### Error Code Conversion Logic

**Issue:** The global error handler in `app.js` attempts to convert camelCase error codes to UPPER_SNAKE_CASE using regex, which may produce unexpected results for edge cases:

```javascript
const errorCode = (err.code || err.name || 'INTERNAL_ERROR')
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
  .toUpperCase();
```

**Files:** `backend/src/app.js` (lines 202-208)

**Impact:** Acronym-heavy names (e.g., "HTTPServerError" → "HTTP_SERVER_ERROR") work but "NotFoundError" becomes "NOT_FOUND_ERROR" — acceptable but inconsistent with the manual "NOT_FOUND" code used elsewhere.

---

### Hardcoded Activity Level Default

**Issue:** The `buildSystemPrompt` function uses a hardcoded fallback for `activity_level`:
```javascript
activityLevel: profile.activity_level || 'sedentary',
```

But the `swapActivity` function in the same file has a different default:
```javascript
const activityLevel = profile?.activity_level || 'sedentary'
```

**Files:** `backend/src/services/llm.service.js` (lines 100, 696)

**Impact:** Inconsistent defaults — both default to 'sedentary' but use different patterns (first uses `||` on potentially empty string, second uses nullish coalescing via `?.` and `||`).

## Security Considerations

### SSL Certificate Validation Disabled for Database

**Issue:** The PostgreSQL database connection disables SSL certificate validation:

```javascript
ssl: { rejectUnauthorized: false },
```

**Files:** `backend/src/config/database.js` (line 24)

**Risk:** Man-in-the-middle attack on database connections. An attacker on the network can intercept all traffic to/from the database, including user credentials, health data, and JWT secrets.

**Recommendation:** Enable `rejectUnauthorized: true` and configure proper CA certificates. The comment in the file notes "Session mode (port 6543) works when ssl.rejectUnauthorized is disabled" — investigate proper Supabase SSL configuration instead.

---

### SameSite Cookie Setting Without HTTPS Check

**Issue:** The auth cookie is set with `sameSite: 'none'` and `secure: true` unconditionally:

```javascript
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
```

**Files:** `backend/src/controllers/auth.controller.js` (lines 9-14)

**Risk:** If the app is served over HTTP in development, cookies won't be sent because `secure: true` requires HTTPS. The `sameSite: 'none'` setting requires `secure: true` per browser spec, but in local development without HTTPS, the cookie may fail to set or the browser may reject it.

---

### JWT Secret Not Validated at Startup

**Issue:** The `JWT_SECRET` environment variable is used directly without validation:
```javascript
export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}
```

**Files:** `backend/src/services/auth.service.js` (lines 145-151)

**Risk:** If `JWT_SECRET` is empty or set to a weak default, all JWT tokens can be forged.

---

### Env File Present in Working Tree

**Issue:** `.env` file exists in the working directory with actual credentials.

**Files:** `.env`

**Risk:** Environment credentials could be accidentally committed or leaked through the working tree.

## Performance Bottlenecks

### ORDER BY RAND() Query Pattern

**Issue:** The comment in `app.js` line 136 mentions "ORDER BY RAND() queries" as a concern for the activity rate limiter:
```javascript
// Activity API routes — rate limiter for ORDER BY RAND() queries (T-05-07)
const activityLimiter = createRateLimiter({ max: 20, message: 'Too many activity requests' });
```

**Files:** `backend/src/app.js` (lines 136-138)

**Impact:** `ORDER BY RAND()` is notoriously slow on large tables because it sorts every row with a random value. If the activity repository uses this pattern, it will degrade significantly as the activity table grows.

---

### 200-Food Search Result Limit

**Issue:** The daily meal plan controller passes `200` as the search limit when fetching all foods:
```javascript
getAllFoods: (id) => searchFoods(id, '', 200),
```

**Files:** `backend/src/controllers/dailyMealPlan.controller.js` (line 57)

**Impact:** Fetching 200 foods on every meal plan generation request creates unnecessary database load. If the prompt building truncates to ~150 items anyway, this should be reduced.

---

### LLM Prompt Truncation Logic

**Issue:** The `buildDailyMealPlanPrompt` function has a food text truncation mechanism that kicks in at 12000 characters. The per-category budget is calculated as `Math.ceil(150 / categories.length)` which could waste space if categories are unevenly distributed.

**Files:** `backend/src/services/dailyMealPlan.service.js` (lines 81-95)

**Impact:** Uneven category distribution means popular categories get underrepresented while sparse categories waste budget.

## Fragile Areas

### LLM Service — Critical Business Logic

**Issue:** The `llm.service.js` file (782 lines) is the largest source file in the project and contains the most complex logic including:
- The entire OpenRouter/LLM integration
- Prompt building and caching
- Plan validation logic (both structural and name-based)
- Fallback plan generation
- Activity swapping with TOCTOU lock
- Day regeneration

**Files:** `backend/src/services/llm.service.js`

**Why fragile:** Every downstream feature (weekly plans, day regeneration, activity swapping) depends on this file. Any regression here breaks the app's core value proposition. The lock mechanism, retry logic, and fallback chains make the execution flow hard to trace.

**Test coverage:** Unit tests exist in `backend/tests/unit/llm.service.test.js` but:
- The test file also imports from deleted files (`activityLog.service.js`, `utils/errors.js`)
- Tests cover isolated validation functions but not the full LLM call flow
- No integration tests exist that validate the actual API call + response flow

---

### Activity Controller — Plan Sync Logic

**Issue:** The `logActivity` handler in `activity.controller.js` has best-effort sync logic that silently swallows errors:
```javascript
try {
  // ... complex plan sync with upsert and cache update
} catch (err) {
  console.error('Failed to sync activity log to weekly plan:', err.message);
}
```

**Files:** `backend/src/controllers/activity.controller.js` (lines 68-87, 193-234)

**Why fragile:** The activity log and weekly plan are two separate data stores that are manually synced. The sync is best-effort only — if it fails, the plan's `completed` flag becomes stale. The `deleteActivityLog` handler has the same pattern.

---

### Daily Meal Plan Service — Multiple Fallback Paths

**Issue:** The `generateDailyMealPlan` function has multiple fallback paths: if the profile is missing, if the LLM call fails, if validation fails. Each path falls back to `generateFallbackDailyMealPlan(2000, dbFoods)` with a hardcoded 2000-calorie target.

**Files:** `backend/src/services/dailyMealPlan.service.js` (lines 240-328)

**Why fragile:** Six different error scenarios all fall through different paths. Once a fallback plan is generated and persisted with status 'fallback', subsequent requests will return the cached fallback (line 243: `if (cached && cached.status !== 'fallback')`). This means a single transient error causes stale data until the cache TTL expires (1 hour) or the user explicitly regenerates.

## Test Coverage Gaps

### Missing Unit Tests

**Untested area:** All deleted source files (repositories, utils, services, middleware, routes, controllers) have no corresponding test files in the working tree. Their test files may have been deleted along with the source files.

**Risk:** High — the core infrastructure of the app has zero test coverage.

---

### Missing Integration Tests for Critical Flows

**Untested area:** The integration test `remaining-endpoints.test.js` only tests error paths (401, 400, 404) for daily meal plans and regenerate-day endpoints. Happy paths for LLM-based features (plan generation, activity swapping) are noted as requiring E2E tests:
```javascript
// NOTE: Happy path for regenerate-day requires an existing LLM-generated plan
// and is covered by the E2E test pattern in weeklyPlan.e2e.test.js
```

But `weeklyPlan.e2e.test.js` does not exist in the working tree.

**Files:** `backend/tests/integration/remaining-endpoints.test.js` (lines 245-247, 382-383)

**Risk:** High — the core LLM-based features have no automated happy-path testing.

---

**Untested area:** Frontend has zero tests. There are no test files, no test configuration, and no testing dependencies in `frontend/package.json`.

**Files:** `frontend/package.json`

**Risk:** Medium — frontend bugs can only be caught through manual testing.

---

### Deleted Test Files

**Issue:** Multiple test files have been deleted from the working tree:
- `backend/src/__tests__/food.utils.test.js`
- `frontend/src/__tests__/api-integration.test.js`
- `frontend/src/shared/calendar/__tests__/CalendarGrid.test.jsx`
- `frontend/src/shared/calendar/__tests__/CalendarPageLayout.test.jsx`
- `frontend/src/shared/calendar/__tests__/DayDetailPanel.test.jsx`
- `frontend/src/shared/calendar/__tests__/calendarUtils.test.js`
- `frontend/src/shared/calendar/__tests__/useMonthData.test.js`
- `frontend/src/features/activities/components/__tests__/ActivityHistory.test.jsx`
- `frontend/src/features/activities/components/__tests__/ActivityLogForm.test.jsx`
- `frontend/src/features/activities/components/__tests__/ActivitySummary.test.jsx`
- `frontend/src/features/food-log/components/__tests__/previewCalories.test.js`
- `frontend/src/features/progress/hooks/__tests__/useTrendPrediction.test.js`

**Impact:** Existing test coverage lost. These tests need to be restored from git history.

## Dependencies at Risk

**Package:** `openai` v6.39.1 (backend dependency)

**Risk:** The project uses OpenRouter as the LLM provider with the OpenAI-compatible SDK. OpenRouter is a third-party proxy layer — if OpenRouter changes its API or goes down, all LLM features (weekly plans, daily meal plans, activity swapping) break immediately. The `OPENROUTER_BASE_URL` environment variable allows switching to a different OpenAI-compatible provider, but this is not well-documented.

**Impact:** All AI-powered features (the app's differentiator) depend on a third-party API proxy.

**Migration plan:** Document the ability to switch `OPENROUTER_BASE_URL` to point directly to OpenAI, Anthropic, or any OpenAI-compatible endpoint. Add provider-specific documentation in INTEGRATIONS.md.

---

**Package:** `vite` v8.0.0 (frontend dependency via root package.json v6.2.3, but frontend/package.json specifies v8.0.0)

**Risk:** Version mismatch between root `package.json` (`vite: ^6.2.3`) and `frontend/package.json` (`vite: ^8.0.0`). The root `package.json` also specifies older versions of `@vitejs/plugin-react` (^5.0.4) vs `frontend/package.json` (^6.0.0).

**Impact:** Potential build conflicts when running `npm run build --workspace=frontend` from the root workspace.

---

*Concerns audit: 2026-06-02*
