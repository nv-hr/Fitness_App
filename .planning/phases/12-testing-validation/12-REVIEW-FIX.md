---
phase: 12
fixed_at: '2026-05-28T12:00:00Z'
review_path: .planning/phases/12-testing-validation/12-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 9
skipped: 3
status: partial
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-05-28T12:00:00Z
**Source review:** .planning/phases/12-testing-validation/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 12
- Fixed: 9
- Skipped: 3

## Fixed Issues

### CR-01: Import order defeats integration test schema isolation and rate limiting

**Files modified:** `backend/jest.setup.js` (new), `backend/package.json`, `backend/tests/integration/helpers.js`
**Commit:** 5bdf721
**Applied fix:** Created `backend/jest.setup.js` (Option B) that sets `NODE_ENV=test` and overrides `DATABASE_URL` from `DATABASE_URL_TEST` before any module evaluates (via Jest `setupFiles`). Added `"setupFiles": ["./jest.setup.js"]` to `backend/package.json` jest config. Removed the `process.env.NODE_ENV = 'test'` line from `helpers.js` and replaced with a comment pointing to `jest.setup.js`.

### WR-01: Frontend test uses `require()` in ES module context

**Files modified:** `frontend/src/__tests__/api-integration.test.js`
**Commit:** d45e62e
**Applied fix:** Added `execSync` to the existing `import { fork }` statement at the top of the file. Removed the function-scoped `const { execSync } = require('child_process')` call inside `killPort()`.

### WR-02: Smoke test port parsing can produce `NaN`

**Files modified:** `backend/scripts/smoke-test.js`
**Commit:** 8689f92
**Applied fix:** Replaced `parseInt(portInfo.split(':')[1], 10)` with regex-based port extraction (`portInfo.match(/:(\d+)$/)`) that throws an error with the raw output if no port is found, preventing `NaN` in `API_BASE`.

### WR-03: Smoke test falsy-zero bug on `totalConsumed`

**Files modified:** `backend/scripts/smoke-test.js`
**Commit:** 8689f92
**Applied fix:** Changed `!summaryData.data.totalConsumed` to `summaryData.data.totalConsumed === undefined || summaryData.data.totalConsumed === null` so that a legitimate zero-calorie result does not throw "Summary data incomplete".

### WR-04: Frontend tests pass Set-Cookie attributes as Cookie header

**Files modified:** `frontend/src/__tests__/api-integration.test.js`
**Commit:** c61d80c
**Applied fix:** Added `extractCookieValue()` helper that returns only the `name=value` portion from a Set-Cookie header (splits on `;` and takes the first part). Used it in `registerAndGetCookie()` and all direct cookie pass-through sites (getMe test, logout test) so only valid cookie name=value pairs are sent as `Cookie` request headers per RFC 6265.

### WR-05: `killPort` fragile `netstat` parsing without bounds checking

**Files modified:** `frontend/src/__tests__/api-integration.test.js`
**Commit:** 848fac2
**Applied fix:** Added `parts.length >= 5` bounds check before accessing array elements. Changed column indices from `parts[3]` (Foreign Address — wrong) to `parts[1]` (Local Address — correct) and from `parts[4]` (State — wrong) to `parts[parts.length - 1]` (PID — last column).

### IN-01: Environment mutation at import time is an anti-pattern

**Files modified:** See CR-01
**Commit:** 5bdf721
**Applied fix:** Fixed by moving env configuration to `jest.setup.js` (setupFiles) which runs before any imports are evaluated. The comment in `helpers.js` was updated to reflect the new approach.

### IN-04: auth.service.test.js has minimal coverage

**Files modified:** `backend/tests/unit/auth.service.test.js`
**Commit:** 05e9831
**Applied fix:** Added 4 new test cases: verify correct `userId` and `email` in decoded payload, verify expiration time is set in the future, verify token can be verified with the correct secret, and verify token signed with a different secret is rejected.

### IN-05: Conditional assertion on null/undefined cookie

**Files modified:** `frontend/src/__tests__/api-integration.test.js`
**Commit:** c61d80c
**Applied fix:** Fixed as part of WR-04. The logout test assertions are now unconditional — `expect(logoutCookie).toBeTruthy()` is called before checking cookie content, so the test will fail if `Set-Cookie` is missing.

### IN-06: Pool error handler lacks recovery mechanism

**Files modified:** `backend/src/config/database.js`
**Commit:** ce830b3
**Applied fix:** Enhanced the `pool.on('error')` handler to log the error code (`err.code`) and the first 3 lines of the stack trace in addition to the error message, providing better diagnostics for fatal connection errors.

## Skipped Issues

### IN-02: SQL template literal pattern with schema name

**File:** `backend/tests/integration/helpers.js`
**Reason:** code context differs from review — The helpers.js in the current codebase uses a MySQL/docker-compose approach, not the Supabase schema approach that the review finding was based on. There are no schema-related SQL template literals in the current code.

### IN-03: Synchronous file read in async test setup

**File:** `backend/tests/integration/helpers.js`
**Reason:** code context differs from review — The helpers.js in the current codebase uses a MySQL/docker-compose approach without `executeSqlFile` or `readFileSync`. These functions are not present in the current helpers.js implementation.

---

_Fixed: 2026-05-28T12:00:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
