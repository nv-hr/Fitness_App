---
phase: 15-llm-backend-integration
fixed_at: 2026-05-29T12:45:00Z
review_path: .planning/phases/15-llm-backend-integration/15-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 1
skipped: 6
status: partial
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-05-29T12:45:00Z
**Source review:** .planning/phases/15-llm-backend-integration/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (4 critical + 3 warning)
- Fixed: 1
- Skipped: 6

## Fixed Issues

### CR-02: Correction retry loop discards successfully corrected plan

**Files modified:** `backend/src/services/llm.service.js`
**Commit:** Not committed (orchestrator handles commit)

**Applied fix:**
Restructured the `generateWeeklyPlan` retry loop in `llm.service.js` so that after a successful correction API call, the corrected plan is re-validated instead of discarded:

1. Added a `skipInitialCall` flag to the while loop. When `true`, the loop skips re-calling the LLM with the original prompt and goes directly to re-validation, preserving the corrected plan from the previous iteration.

2. In the **structure validation correction block**: After a successful correction, `skipInitialCall` is set to `true` and `continue` brings the loop back to re-validate the corrected plan. If structure now passes, name validation runs on the corrected plan. If both pass, the plan reaches the success path.

3. In the **name validation correction block**: After a successful correction, `skipInitialCall` is set to `true` and `continue` brings the loop back to re-validate. `validateAndFixPlan` re-matches activity names on the corrected plan. If validation passes, the plan reaches the success path.

**Before (buggy):**
- `plan = await callLlmApi(correctionPrompt)` → `break` → exits loop → fallback (discarded corrected plan)

**After (fixed):**
- `plan = await callLlmApi(correctionPrompt)` → `skipInitialCall = true; continue;` → re-validate corrected plan → success path

## Skipped Issues

### CR-01: Cache key missing userId causes cross-user plan leakage

**File:** `backend/src/services/llm.service.js`
**Reason:** Already fixed in source code. `getCachedPlan(userId, weekStart)` and `setCachedPlan(userId, weekStart, plan)` already accept and use `userId` in the cache key (`plan_${userId}_${weekStart}`). All callers already pass `deps.userId`.
**Original issue:** Cache key `plan_${weekStart}` caused cross-user data leakage.

### CR-03: `getAllActivities()` called without `goalTags` returns zero rows

**File:** `backend/src/repositories/activity.repository.js`
**Reason:** Already fixed in source code. `getAllActivities(goalTags = [])` defaults to empty array and conditionally applies the `WHERE goal_tags ?| $1` clause only when `goalTags.length > 0`. When called with no arguments, it returns all activities.
**Original issue:** `WHERE goal_tags ?| NULL` returned zero rows.

### CR-04: Rate limiter test-mode mutations are inert

**File:** `backend/src/middlewares/weeklyPlanRateLimiter.js`
**Reason:** Already fixed in source code. `isTest` is checked at construction time: `windowMs: isTest ? 1000 : 15 * 60 * 1000, max: isTest ? 1000 : 5`. No post-construction mutations.
**Original issue:** Mutating `.max` and `.windowMs` after `rateLimit()` factory did not change behavior.

### WR-01: `getMonday` timezone inconsistency causes wrong start date

**File:** `backend/src/controllers/weeklyPlan.controller.js`
**Reason:** Already fixed in source code. `getMonday` uses UTC methods consistently: `getUTCDay()`, `getUTCDate()`, `setUTCDate()`, and `toISOString().split('T')[0]`.
**Original issue:** Local timezone methods caused Tuesday dates for late-hour requests in negative UTC offsets.

### WR-02: Missing `weekStart` input validation

**File:** `backend/src/controllers/weeklyPlan.controller.js`
**Reason:** Already fixed in source code. `isValidDateString` helper validates `weekStart` from `req.body`. Returns 400 with `VALIDATION_ERROR` code on invalid input.
**Original issue:** Invalid date strings propagated to downstream date operations, producing NaN/Invalid Date errors.

### WR-03: LLM API call sends only system message, no user message

**File:** `backend/src/services/llm.service.js`
**Reason:** Already fixed in source code. The `messages` array in `callLlmApi` already includes both `{ role: 'system', content: systemPrompt }` and `{ role: 'user', content: 'Generate my weekly fitness plan based on my profile and history.' }`.
**Original issue:** Many LLMs tuned for chat completion may return empty or unpredictable responses without a user message frame.

---

_Fixed: 2026-05-29T12:45:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
