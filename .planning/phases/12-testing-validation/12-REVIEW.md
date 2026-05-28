---
phase: 12-testing-validation
reviewed: 2026-05-28T12:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - backend/tests/integration/helpers.js
  - backend/tests/integration/api.test.js
  - backend/src/config/database.js
  - backend/tests/unit/food.service.test.js
  - frontend/src/__tests__/api-integration.test.js
  - backend/scripts/smoke-test.js
  - backend/tests/unit/dbErrors.test.js
  - backend/tests/unit/profile.service.test.js
  - backend/tests/unit/auth.service.test.js
  - backend/tests/unit/activity.service.test.js
findings:
  critical: 1
  warning: 5
  info: 6
  total: 12
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-28T12:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed 10 files from Phase 12 (Testing & Validation). Found **1 BLOCKER**, **5 WARNINGs**, and **6 INFOs**.

The most critical issue is a **fundamental design flaw in the integration test schema isolation**: the ES module import order causes both the `DATABASE_URL` override and `NODE_ENV=test` to take effect *after* the app's database pool and rate limiters have already been configured. This means integration tests query the production database (not the test schema) and run with production rate limits.

The 4 new unit test files (food.service, dbErrors, profile.service, activity.service) are clean. The smoke-test script and frontend API integration tests contain several correctness bugs.

---

## Critical Issues

### CR-01: Import order defeats integration test schema isolation and rate limiting

**Files:**
- `backend/tests/integration/helpers.js:12-17`
- `backend/src/config/database.js:10-16`
- `backend/src/app.js:43-48`
- `backend/src/repositories/user.repository.js:8`
- `backend/src/repositories/profile.repository.js:20`

**Issue:** The ES module evaluation order makes the schema isolation strategy ineffective. In `api.test.js`, the import of `app` (which transitively imports `database.js`) is resolved and *evaluated* before `helpers.js`. 

The evaluation order (depth-first post-order traversal) is:
1. `database.js` evaluated — creates `new Pool({ connectionString: process.env.DATABASE_URL })`
2. `app.js` evaluated — calls `createRateLimiter()` which reads `process.env.NODE_ENV`
3. `helpers.js` evaluated — sets `process.env.DATABASE_URL = DATABASE_URL_TEST` and `process.env.NODE_ENV = 'test'` — **too late**

**Consequences:**
- **Wrong database**: The app's main `pool` was already created at step 1 with the original `DATABASE_URL`. All API calls through `supertest` hit the production database, not the test database. The `withTempPool` helper correctly connects to the test database (it reads `DATABASE_URL_TEST` directly), but that pool is only used for schema setup/teardown — the actual API calls use the main pool.
- **Broken schema isolation**: Repositories use unqualified table names (`users`, `profiles`, `food_logs` — see `user.repository.js:8`, `profile.repository.js:20`). Without `SET search_path TO fitness_test` on the main pool's connections, the app queries the `public` schema where no test data exists.
- **Production rate limits**: `createRateLimiter()` at `app.js:43-48` reads `process.env.NODE_ENV` during module evaluation. Since `helpers.js` hasn't run yet, rate limiters are created with production settings (auth: 10 req / 15 min). Integration tests with ~11 auth requests may get 429 responses.

**Fix:** The pool must be created *after* the environment is configured. Options:

**Option A: Lazy pool initialization** (recommended)
```javascript
// backend/src/config/database.js
let _pool = null;

export function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    _pool.on('error', (err) => {
      console.error('Database pool error:', err.message);
    });
  }
  return _pool;
}
```

Then in `helpers.js`, remove lines 12-17 — the `DATABASE_URL_TEST` and `NODE_ENV` should be set in the shell before Jest runs, or in a Jest `setupFiles` script that runs *before any imports*.

**Option B: Jest setup file** (move env config earlier)
```javascript
// backend/jest.setup.js — runs before any test modules are imported
process.env.NODE_ENV = 'test';
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
```
Add to Jest config:
```json
"setupFiles": ["../jest.setup.js"]
```

**Option C: Schema search path on main pool** (alternative)
If keeping the two-pool approach, create the app's pool with an explicit schema:
```javascript
// database.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL + (process.env.NODE_ENV === 'test' ? '?options=--search_path%3Dfitness_test' : ''),
  // ...
});
```

---

## Warnings

### WR-01: Frontend test uses `require()` in ES module context

**File:** `frontend/src/__tests__/api-integration.test.js:71`

**Issue:** The `killPort` function uses `const { execSync } = require('child_process')` inside a function body. The project uses `"type": "module"` in `package.json`, making this an ES module. While Vitest provides CJS compatibility that makes this work at runtime, `execSync` is already imported at the top level (line 22 imports `fork` — `execSync` should be added there instead).

Mixing module systems and using function-level `require()` is fragile and breaks if tests are run outside Vitest (e.g., plain Node.js).

**Fix:**
```javascript
// Line 22 - add execSync to existing child_process import
import { fork, execSync } from 'child_process';
```
Then remove line 71's `require` call entirely. The function-scoped variable is no longer needed since `execSync` is available at module scope.

### WR-02: Smoke test port parsing can produce `NaN`

**File:** `backend/scripts/smoke-test.js:57-58`

**Issue:** When `docker port` returns unexpected output (empty string, error message, or whitespace-only), `split(':')[1]` is `undefined`, and `parseInt(undefined, 10)` evaluates to `NaN`. The resulting `API_BASE` becomes `http://localhost:NaN`, which silently fails on all subsequent requests with unhelpful fetch errors.

**Fix:**
```javascript
const portInfo = execSync(`docker port ${CONTAINER_NAME} 3001/tcp`, { encoding: 'utf8', timeout: 10000 }).trim();
const portMatch = portInfo.match(/:(\d+)$/);
if (!portMatch) throw new Error(`Could not parse port from docker port output: "${portInfo}"`);
actualPort = parseInt(portMatch[1], 10);
```

### WR-03: Smoke test falsy-zero bug on `totalConsumed`

**File:** `backend/scripts/smoke-test.js:136`

**Issue:** `!summaryData.data.totalConsumed` evaluates to `true` when `totalConsumed` is `0` (a valid value — the user consumed no calories today). This incorrectly throws "Summary data incomplete" for legitimate zero-calorie results.

**Fix:**
```javascript
if (summaryData.data.totalConsumed === undefined || summaryData.data.totalConsumed === null || !summaryData.data.calorieTarget) {
  throw new Error('Summary data incomplete');
}
```

### WR-04: Frontend tests pass Set-Cookie attributes as Cookie header

**Files:** `frontend/src/__tests__/api-integration.test.js:168,186-193`

**Issue:** The test stores the raw `Set-Cookie` response header (which includes cookie attributes like `HttpOnly`, `Path=/`, `Max-Age=3600`, `SameSite=Lax`) and passes it verbatim as the `Cookie` request header on subsequent requests.

```javascript
// Line 168
if (cookie) headers.Cookie = cookie;  // cookie = "token=abc123; HttpOnly; Path=/; Max-Age=3600"
```

HTTP `Cookie` headers should only contain `name=value` pairs, not cookie attributes. Cookie attributes (after the first semicolon) are **not valid** in `Cookie` headers per RFC 6265. Express's cookie parser is lenient and still extracts the `token` value, but:
1. It also tries to parse `HttpOnly`, `Path=/`, etc. as cookies with no values
2. If a future Express version or middleware validates cookie headers strictly, these tests will break
3. If the token value itself contains characters that interact badly with attribute parsing, it breaks

**Fix:** Extract only the `name=value` portion from the Set-Cookie header:
```javascript
function extractCookieValue(setCookieHeader) {
  if (!setCookieHeader) return null;
  return setCookieHeader.split(';')[0]; // "token=abc123"
}
```

### WR-05: `killPort` fragile `netstat` parsing without bounds checking

**File:** `frontend/src/__tests__/api-integration.test.js:79-80`

**Issue:** The `killPort` function directly accesses `parts[3]` and `parts[4]` after splitting `netstat` output by whitespace. If the `netstat -ano` output format differs across Windows locales, versions, or if the output is truncated, these array accesses return `undefined`, and the comparisons silently no-op. This means a stale backend process could remain running and interfere with tests.

**Fix:** Add bounds checking and more robust parsing:
```javascript
for (const line of stdout.split('\n')) {
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 5) {
    const address = parts[1]; // Local address column
    const pid = parts[parts.length - 1]; // PID is last column
    if ((address === `0.0.0.0:${port}` || address === `127.0.0.1:${port}`) && pid && pid !== '0') {
      try { execSync(`taskkill /F /PID ${pid}`, { timeout: 2000 }); } catch { /* ok */ }
    }
  }
}
```
Note: `netstat -ano` columns are typically: Proto, Local Address, Foreign Address, State, PID. The original code uses `parts[3]` for address and `parts[4]` for PID, which is off by one — the first element `parts[0]` is the protocol.

---

## Info

### IN-01: Environment mutation at import time is an anti-pattern

**File:** `backend/tests/integration/helpers.js:12-17`

Mutating `process.env` at module evaluation time creates order-dependent behavior that is invisible to developers. The `helpers.js` comment says "Set test environment before app imports" but the ES module spec evaluates imports first, making this comment misleading. Use `setupFiles` in Jest config instead.

### IN-02: SQL template literal pattern with schema name

**File:** `backend/tests/integration/helpers.js:65-69`

```javascript
await pool.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
await pool.query(`CREATE SCHEMA ${TEST_SCHEMA}`);
```

Currently safe because `TEST_SCHEMA` is a hardcoded constant (`'fitness_test'`), but if anyone makes it dynamic (e.g., per-execution random schema name for parallel isolation), this becomes an SQL injection vector. Use `pool.query('DROP SCHEMA IF EXISTS ...', [schemaName])` style with `pg` parameterization, but note that PostgreSQL does not support parameterized identifiers — use `escapeIdentifier` from `pg` instead.

### IN-03: Synchronous file read in async test setup

**File:** `backend/tests/integration/helpers.js:53`

`readFileSync` is used inside `executeSqlFile`, which is called from the async `startDatabase`. Blocking the event loop during test setup is unnecessary and could delay other operations if the SQL files are large. Use `readFile` (async) instead:
```javascript
import { readFile } from 'fs/promises';

async function executeSqlFile(pool, filePath) {
  const sql = await readFile(filePath, 'utf8');
  await pool.query(sql);
}
```

### IN-04: auth.service.test.js has minimal coverage

**File:** `backend/tests/unit/auth.service.test.js:9-17`

The test file only has 2 assertions: token is a string, and token has 3 parts. It does not verify:
- Token contains the correct payload (`id`, `email`)
- Token expiration time
- Token can be verified with the secret
- Token with missing/invalid payload

These are important because JWT is the sole authentication mechanism. A token that is technically 3 dot-separated strings but has wrong claims would pass these tests.

### IN-05: Conditional assertion on null/undefined cookie

**File:** `frontend/src/__tests__/api-integration.test.js:290-292`

```javascript
if (setCookie) {
  expect(setCookie).toContain('token=');
  expect(setCookie).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i);
}
```

If `setCookie` is `null` or `undefined`, the test passes without asserting anything. The logout test would silently pass even if no `Set-Cookie` header was returned. Use `expect(setCookie).toBeTruthy()` before the if-block, or `expect(setCookie).not.toBeNull()`.

### IN-06: Pool error handler lacks recovery mechanism

**File:** `backend/src/config/database.js:18-19`

```javascript
pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});
```

The pool-level error handler only logs the error. If the pool encounters a fatal error (e.g., `ECONNREFUSED`, `ENOTFOUND`), all pending queries will hang indefinitely. For `server.js`'s `pool.query('SELECT 1')` startup check, this is handled. But for runtime queries, the error is swallowed and the application continues with a broken pool, leading to unhelpful "timeout" errors downstream. Consider at minimum logging with `console.error` + full error details.

---

_Reviewed: 2026-05-28T12:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
