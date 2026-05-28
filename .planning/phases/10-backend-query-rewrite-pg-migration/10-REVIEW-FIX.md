---
phase: 10-backend-query-rewrite-pg-migration
fixed_at: 2026-05-28T12:00:00Z
review_path: .planning/phases/10-backend-query-rewrite-pg-migration/10-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 11
skipped: 0
status: all_fixed
---

# Phase 10: Code Review Fix Report

**Fixed at:** 2026-05-28T12:00:00Z
**Source review:** .planning/phases/10-backend-query-rewrite-pg-migration/10-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11
- Fixed: 11
- Skipped: 0

## Fixed Issues

### CR-01: `getLogHistory` interval unit is seconds, not days

**Files modified:** `backend/src/repositories/food.repository.js`
**Commit:** `e59adad`
**Applied fix:** Changed `CURRENT_DATE - $2::interval` to `CURRENT_DATE - $2`. PostgreSQL treats `DATE - integer` as subtracting days, so the `::interval` cast (which defaults to seconds) was incorrect. A request for 7 days was returning only 1 day of data.

### CR-02: OAuth-registered user crashes on email/password login

**Files modified:** `backend/src/services/auth.service.js`
**Commit:** `76d393e`
**Applied fix:** Added null guard for `user.password_hash` before `bcrypt.compare()`. OAuth users have `null` password_hash, which would throw a `TypeError` in `bcrypt.compare()`. Now throws `AuthenticationError` with the same message as other login failures.

### WR-01: `searchFoods` bypasses Express error middleware

**Files modified:** `backend/src/controllers/food.controller.js`
**Commit:** `57d43c2`
**Applied fix:** Added `next` parameter to function signature. Replaced `res.status(500).json(...)` with `next(err)` to route errors through Express error middleware, consistent with all other controller handlers in the file.

### WR-02: `normalizeDbError` imported but never used

**Files modified:** `backend/src/controllers/food.controller.js`
**Commit:** `795d242`
**Applied fix:** Removed the unused `normalizeDbError` import from `../utils/dbErrors.js`.

### WR-03: `userId` parameter silently ignored in activity repository

**Files modified:** `backend/src/repositories/activity.repository.js`, `backend/src/services/activity.service.js`
**Commit:** `df32801`
**Applied fix:** Removed `userId` parameter from `getRandomActivities()` and `getAllActivities()` function signatures and JSDoc. Updated callers in `activity.service.js` to drop the `userId` argument. The repository queries never used `userId` for filtering.

### WR-04: `updateByUserId` returns success for non-existent rows

**Files modified:** `backend/src/repositories/profile.repository.js`
**Commit:** `870e9f8`
**Applied fix:** Changed from returning `{success: true, profile: null}` to checking for `rows[0]`. Returns `{success: false, profile: null}` when no profile matches `userId`, allowing callers to distinguish between "profile was updated" and "profile does not exist".

### WR-05: `updatePdpConsent` returns success for non-existent rows

**Files modified:** `backend/src/repositories/user.repository.js`
**Commit:** `ecf15e5`
**Applied fix:** Changed from `return { success: true }` to `return { success: rows.length > 0 }` so callers can detect when no user was matched by the update query.

### WR-06: No upper bound on `getLogHistory` `days` parameter

**Files modified:** `backend/src/repositories/food.repository.js`
**Commit:** `76e1c6c`
**Applied fix:** Added `Math.min(Math.max(1, Math.floor(days)), 365)` to cap the days parameter to a maximum of 365 (1 year), preventing unbounded queries that could scan the entire `food_logs` table.

### WR-07: PDP consent key naming inconsistency across endpoints

**Files modified:** `backend/src/services/auth.service.js`
**Commit:** `ad1ea49`
**Applied fix:** Changed `pdpConsent` to `pdp_consent` in the response objects of `register()`, `login()`, and `handleGoogleOAuth()` to match the `getMe` endpoint convention. All PDP consent response keys now use snake_case consistently.

### WR-08: Login timing side-channel allows email enumeration

**Files modified:** `backend/src/services/auth.service.js`
**Commit:** `e91fb50`
**Applied fix:** Added a dummy `bcrypt.compare()` call with a fixed hash when the user is not found. This eliminates the timing difference between "user not found" (fast) and "wrong password" (slow due to bcrypt work), preventing attackers from enumerating valid emails via response timing.

### WR-09: Missing `NODE_ENV` and `FRONTEND_URL` in `.env`

**Files modified:** `backend/.env.example` (created), `backend/.env` (local)
**Commit:** `74285dd`
**Applied fix:** Created `backend/.env.example` documenting all required environment variables including `NODE_ENV=development` and `FRONTEND_URL=http://localhost:5173` which the auth controller depends on. The `.env` file (gitignored) was also updated locally with the same values.

---

_Fixed: 2026-05-28T12:00:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
