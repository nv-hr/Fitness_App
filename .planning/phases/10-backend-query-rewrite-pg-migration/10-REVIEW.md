---
phase: 10-backend-query-rewrite-pg-migration
reviewed: 2026-05-28T12:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - backend/.env
  - backend/package.json
  - backend/src/config/database.js
  - backend/src/controllers/auth.controller.js
  - backend/src/controllers/food.controller.js
  - backend/src/repositories/activity.repository.js
  - backend/src/repositories/food.repository.js
  - backend/src/repositories/profile.repository.js
  - backend/src/repositories/user.repository.js
  - backend/src/services/auth.service.js
  - backend/src/utils/dbErrors.js
findings:
  critical: 2
  warning: 9
  info: 4
  total: 15
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-05-28T12:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed 11 files from the PostgreSQL migration phase. Two critical bugs were found: the `getLogHistory` interval query uses seconds instead of days (returning only 1 day of data instead of N days), and OAuth-registered users crash on email/password login. Nine warnings cover error handling inconsistencies, silent false-success returns, missing configuration, timing side-channels, and unused parameters. The `.env` file is properly gitignored but missing `NODE_ENV` and `FRONTEND_URL` entries that the code depends on.

---

## Critical Issues

### CR-01: `getLogHistory` interval unit is seconds, not days

**File:** `backend/src/repositories/food.repository.js:128`
**Issue:** The query uses `$2::interval` where `$2` is an integer representing days. PostgreSQL interprets bare integer-to-interval casts as **seconds** (`'7'::interval` = 7 seconds), not days. This means `CURRENT_DATE - 7::interval` evaluates to only ~1 second before midnight, causing the filter to return only today's data regardless of the `days` parameter. The `getLogHistory` feature is effectively broken: a request for 7 days of history returns 1 day.

**Fix:** Use explicit interval syntax. Either subtract an integer from the date (PostgreSQL treats `DATE - integer` as subtracting days):
```sql
... AND log_date >= CURRENT_DATE - $2
```
Or use proper interval units:
```sql
... AND log_date >= CURRENT_DATE - ($2 || ' days')::interval
```

### CR-02: OAuth-registered user crashes on email/password login

**File:** `backend/src/services/auth.service.js:79`
**Issue:** When a user registers via Google OAuth, `password_hash` is stored as `null`. If that user later attempts email/password login, `findByEmail` (line 72) returns the user, and `bcrypt.compare(password, user.password_hash)` (line 79) receives `null` as the hash argument. `bcrypt.compare()` will throw a `TypeError` (e.g., `"data and hash must be strings"`) rather than returning `false`. This bypasses the `AuthenticationError` path, propagates to `next(err)` as an unhandled 500, and could leak stack traces in development.

**Fix:** Validate the hash exists before calling `bcrypt.compare`:
```js
if (!user.password_hash) {
  throw new AuthenticationError('Invalid email or password');
}
const isMatch = await bcrypt.compare(password, user.password_hash);
```

---

## Warnings

### WR-01: `searchFoods` bypasses Express error middleware

**File:** `backend/src/controllers/food.controller.js:27`
**Issue:** The `catch` block in `searchFoods` sends a raw 500 JSON response (`res.status(500).json(...)`) instead of calling `next(err)`. This is inconsistent with every other controller handler in the file (cf. `logFood`, `getDailySummary`, etc.), and prevents centralized error logging, sanitization, and consistent response serialization. The function signature also lacks the `next` parameter, so errors cannot be forwarded to Express error middleware.

**Fix:** Add `next` parameter to the function signature and replace the direct 500 response with `next(err)`:
```js
export async function searchFoods(req, res, next) {
  // ...
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(res, err.message, 400, 'VALIDATION_ERROR');
    }
    next(err);
  }
}
```

### WR-02: `normalizeDbError` imported but never used

**File:** `backend/src/controllers/food.controller.js:3`
**Issue:** `normalizeDbError` is imported from `../utils/dbErrors.js` but never called anywhere in the file. All database error handling in this controller passes raw errors directly to `next(err)` or `res.status(500).json(...)`. This is dead code that increases maintenance surface.

**Fix:** Either use `normalizeDbError` in error handling paths or remove the import.

### WR-03: `userId` parameter silently ignored in activity repository

**File:** `backend/src/repositories/activity.repository.js:12,34`
**Issue:** Both `getRandomActivities(userId, goalTags, count)` and `getAllActivities(userId, goalTags)` accept a `userId` parameter, but neither query uses it. The queries filter exclusively on `goal_tags` with no user-id scoping. If per-user activity filtering is intended, this silently returns wrong results. If `userId` was kept for API compatibility with other repositories, it should be documented or removed.

**Fix:** Either:
- Remove the `userId` parameter if not needed: `export async function getRandomActivities(goalTags, count = 5)`
- Or add user scoping to queries if intended

### WR-04: `updateByUserId` returns success for non-existent rows

**File:** `backend/src/repositories/profile.repository.js:65`
**Issue:** The function returns `{ success: true, profile: null }` when no profile row matches `userId`. There is no way for the caller to distinguish between "profile was updated" and "profile does not exist". This hides bugs where a caller tries to update a non-existent profile.

**Fix:** Throw or return a distinct status when no row is updated:
```js
if (!rows[0]) {
  return { success: false, profile: null };
}
```

### WR-05: `updatePdpConsent` returns success for non-existent rows

**File:** `backend/src/repositories/user.repository.js:59`
**Issue:** Same pattern as WR-04. The query `RETURNs` row data but the function discards it and always returns `{ success: true }`. If no user matches `userId`, the caller receives a misleading success response.

**Fix:** Check returned rows and return a failure indicator:
```js
const { rows } = await pool.query(...);
return { success: rows.length > 0 };
```

### WR-06: No upper bound on `getLogHistory` `days` parameter

**File:** `backend/src/repositories/food.repository.js:123`
**Issue:** The `days` parameter accepts any positive integer with no upper bound. A request for `days=9999999` could scan the entire `food_logs` table, which may cause excessive data transfer and performance degradation as the table grows.

**Fix:** Cap the days parameter:
```js
export async function getLogHistory(userId, days = 7) {
  days = Math.min(Math.max(1, days), 365);  // cap at 1 year
  // ...
}
```

### WR-07: PDP consent key naming inconsistency across endpoints

**File:** `backend/src/controllers/auth.controller.js:80`
**Issue:** The `register` endpoint returns `pdpConsent` (camelCase, from `auth.service.js:57`), while `getMe` returns `pdp_consent` (snake_case, line 80). Consumers must handle two different key formats for the same field depending on which endpoint they call. This is an API contract inconsistency.

**Fix:** Pick one convention. Given the DB columns use snake_case and most API responses appear to map directly from DB, align `register`/`login` responses to snake_case:
```js
// In auth.service.js register/login/handleGoogleOAuth:
pdp_consent: user.pdp_consent === true,
```

### WR-08: Login timing side-channel allows email enumeration

**File:** `backend/src/services/auth.service.js:72-82`
**Issue:** The code has a timing side-channel: `findByEmail` takes measurable time, then user-not-found responds immediately while password comparison adds 200-300ms of bcrypt work. An attacker can distinguish "user exists" (slow response) from "user doesn't exist" (fast response) despite the identical error messages. The comment on line 74 claims to prevent email enumeration (T-01-06), but only addresses the message text, not the timing leak.

**Fix:** Always run `bcrypt.compare` against a dummy hash when user is not found:
```js
const user = await findByEmail(email);
if (!user) {
  await bcrypt.compare(password, '$2b$10$' + 'a'.repeat(53)); // dummy compare
  throw new AuthenticationError('Invalid email or password');
}
```

### WR-09: Missing `NODE_ENV` and `FRONTEND_URL` in `.env`

**Files:** `backend/.env` (implicit), `backend/src/controllers/auth.controller.js:11,101`
**Issue:** The code depends on two environment variables that are not present in `.env`:
1. `NODE_ENV` (line 11): Controls whether the JWT cookie `secure` flag is set. Without it, cookies are always insecure (`sameSite: 'lax'` + no Secure flag), even in production where HTTPS is assumed.
2. `FRONTEND_URL` (line 101): The `googleCallback` falls back to `http://localhost:5173`, but if deployed without this value, OAuth callbacks redirect to localhost in production.

**Fix:**
```dotenv
# In .env (or .env.example):
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Info

### IN-01: `searchFoods` `ValidationError` catch is dead code

**File:** `backend/src/controllers/food.controller.js:24-25`
**Issue:** The `catch` block checks for `ValidationError`, but `foodRepo.searchFoods()` only throws `AppError` (see `food.repository.js:25`). Since `searchFoods` doesn't call any service that throws `ValidationError`, this catch branch will never be taken. It's either leftover from a refactor or dead defensive code.

### IN-02: `getRecentFoods` GROUP BY includes `fl.calories` causing potential duplicates

**File:** `backend/src/repositories/food.repository.js:156`
**Issue:** The `GROUP BY` includes `fl.calories` alongside `COALESCE(f.name, fl.custom_food_name), fl.food_id`. This means if the same food is logged with different portion sizes (and therefore different calculated calorie values), it appears as multiple rows in the "recent foods" list — one per distinct calorie value. Also, `MAX(fl.portion_grams)` returns the maximum portion, not the most recent one as the alias `last_portion_grams` suggests.

**Fix:** Remove `fl.calories` from GROUP BY and use window functions or a subquery to get the most recent log per food.

### IN-03: `handleGoogleOAuth` `displayName` parameter unused

**File:** `backend/src/services/auth.service.js:106`
**Issue:** The `displayName` parameter is destructured from the input object but never referenced in the function body. If the schema ever adds a `display_name` column, this parameter could be forgotten. Remove it until needed.

### IN-04: Pool error handler logs but does not recover

**File:** `backend/src/config/database.js:14-16`
**Issue:** The `pool.on('error')` handler only logs to console. If the pool enters an error state (e.g., all connections lost), subsequent queries will fail with opaque errors. Consider adding health-check or reconnect logic, or at minimum a more descriptive log entry that includes the pool's current state.

---

_Reviewed: 2026-05-28T12:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
