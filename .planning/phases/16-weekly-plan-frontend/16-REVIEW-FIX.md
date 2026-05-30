---
phase: 16-weekly-plan-frontend
fixed_at: 2026-05-30T16:00:00Z
review_path: .planning/phases/16-weekly-plan-frontend/16-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-05-30T16:00:00Z
**Source review:** `.planning/phases/16-weekly-plan-frontend/16-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 8
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: `regenerateDay` silently returns cached data — never regenerates

**Files modified:** `backend/src/services/llm.service.js`
**Commit:** `bef24ac`
**Applied fix:** Added `clearCachedPlan(deps.userId, deps.weekStart)` before `generateWeeklyPlan(deps)` call in `regenerateDay`, ensuring the cache is cleared and a fresh LLM call is made instead of returning the stale cached plan.

### CR-02: Frontend rate-limit error handling completely broken — error shape mismatch

**Files modified:** `frontend/src/shared/lib/http.js`
**Commit:** `97d50a5`
**Applied fix:** Changed `apiFetch`'s error throw to preserve the structured error data from the JSON response body. The `Error` object now has `.retryAfter` and `.code` properties set from `data.error`, allowing the frontend's `RATE_LIMITED` check (`err.retryAfter || err.message?.includes('RATE_LIMITED')`) to correctly detect rate-limit responses.

### CR-03: Timezone mismatch in `getMonday` between frontend and backend causes weekStart drift

**Files modified:** `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx`
**Commit:** `63cb537`
**Applied fix:** Changed the frontend's `getMonday` function to use UTC methods (`getUTCDay()`, `getUTCDate()`, `setUTCDate()`) instead of local-time methods, matching the backend's `getMonday` implementation exactly.

### CR-04: `get` and `generate` endpoints handle `weekStart` inconsistently — plans become unfindable

**Files modified:** `backend/src/controllers/weeklyPlan.controller.js`
**Commit:** `90959db`
**Applied fix:** Changed the `get` handler to always normalize `weekStart` through `getMonday(new Date(weekStart))` (matching the `generate` handler's normalization), and applied the same fix to `regenerateDayHandler`. Both now parse the provided `weekStart` through `getMonday` instead of using it raw.

### WR-01: Debug log shows overwritten value — original name lost

**Files modified:** `backend/src/services/llm.service.js`
**Commit:** `70df46d`
**Applied fix:** Captured `const originalName = act.name` before overwriting, and used it in the `console.warn` log so both the original (incorrect) and corrected names are visible for debugging.

### WR-02: `String.replace` in `buildPrompt` interprets `$` groups in activity names — template injection risk

**Files modified:** `backend/src/services/llm.service.js`
**Commit:** `9da2777`
**Applied fix:** Changed `String.replace(placeholder, String(value))` to `String.replace(placeholder, () => String(value))`. Using a replacer function instead of a string disables JavaScript's `$1`, `$&`, `` $` ``, `$'` special pattern interpretation.

### WR-03: `plan_data` null dereference in `get` controller

**Files modified:** `backend/src/controllers/weeklyPlan.controller.js`
**Commit:** `f5a3fbe`
**Applied fix:** Added optional chaining (`?.`) to `row.plan_data` accesses: `row.plan_data?.days` and `row.plan_data?.generated_at`, preventing `TypeError: Cannot read properties of null` when the database row has a NULL `plan_data` column.

### WR-04: `WeeklyPlanPage` missing `ProfileGuard` — users without profiles reach the page

**Files modified:** `frontend/src/app/Router.jsx`
**Commit:** `c02e3db`
**Applied fix:** Wrapped `<WeeklyPlanPage />` in `<ProfileGuard>` on the `/weekly-plan` route, ensuring users without a profile are redirected to the profile creation page instead of seeing "No activity history available".

---

_Fixed: 2026-05-30T16:00:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
