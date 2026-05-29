---
phase: 15-llm-backend-integration
reviewed: 2026-05-29T12:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - backend/.env.example
  - backend/prompts/correction-prompt.md
  - backend/prompts/system-prompt.md
  - backend/src/app.js
  - backend/src/controllers/weeklyPlan.controller.js
  - backend/src/middlewares/weeklyPlanRateLimiter.js
  - backend/src/repositories/activity.repository.js
  - backend/src/routes/weeklyPlan.routes.js
  - backend/src/services/llm.service.js
findings:
  critical: 4
  warning: 3
  info: 3
  total: 10
status: issues_found
---

# Phase 15: Code Review Report — LLM Backend Integration

**Reviewed:** 2026-05-29T12:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase implements the OpenRouter LLM integration for weekly plan generation, including:
- An LLM service with prompt building, API calls, response validation, fuzzy name matching, and caching
- A weekly plan generation API endpoint with rate limiting, controller, and routes

The review found **4 critical** issues, **3 warnings**, and **3 info** items. The most severe issues are:

1. **The plan cache key omits the user ID**, causing cross-user data leakage — User A sees User B's plan.
2. **The correction retry loop discards the successfully corrected plan** — the `continue` after a correction call sends the loop back to the original prompt, wasting API calls and never returning the corrected output.
3. **`getAllActivities()` is called without `goalTags`** in the controller, causing the SQL `WHERE goal_tags ?| NULL` to return zero rows, making the LLM generate plans from thin air and always degrade to the template fallback.
4. **The rate limiter test-mode mutations are inert** — mutating `.max` and `.windowMs` on the middleware returned by `express-rate-limit` does not change behavior after construction.

---

## Critical Issues

### CR-01: Cache key missing userId causes cross-user plan leakage

**File:** `backend/src/services/llm.service.js:230-236` (used at lines 299, 374)

**Issue:** Both `getCachedPlan()` (line 230) and `setCachedPlan()` (line 234) use `plan_${weekStart}` as the cache key, with **no user ID component**. When User A generates a plan for the week starting `2026-05-25`, their plan is stored at key `plan_2026-05-25`. When User B requests a plan for the same week, they receive User A's cached plan. This is a data leakage and correctness bug.

**Evidence:**
- Line 230-231: `planCache.get(`plan_${weekStart}`)` — no `userId`
- Line 234-235: `planCache.set(`plan_${weekStart}`, plan)` — no `userId`
- Line 299: `const cached = getCachedPlan(deps.weekStart);` — caller has `deps.userId` but doesn't use it
- Line 374: `setCachedPlan(deps.weekStart, plan);` — caller has `deps.userId` but doesn't use it

**Fix:**
```javascript
// llm.service.js — update cache functions to accept and use userId
export function getCachedPlan(userId, weekStart) {
  return planCache.get(`plan_${userId}_${weekStart}`);
}

export function setCachedPlan(userId, weekStart, plan) {
  planCache.set(`plan_${userId}_${weekStart}`, plan);
}

// In generateWeeklyPlan:
const cached = getCachedPlan(deps.userId, deps.weekStart);
// ...
setCachedPlan(deps.userId, deps.weekStart, plan);
```

---

### CR-02: Correction retry loop discards successfully corrected plan

**File:** `backend/src/services/llm.service.js:344-351` (same pattern at lines 360-367)

**Issue:** When the initial LLM plan fails structural or name validation, a correction prompt is built and sent to the LLM. If the correction call succeeds, the `continue` statement on line 351 sends execution back to the top of the `while` loop, where `attempt` is incremented and **the original prompt is used again**, completely discarding the corrected plan. The correction API call is wasted, and the corrected output is never used.

**Detailed trace of the buggy flow:**
1. `attempt` (now 1): call LLM with original prompt → plan fails validation
2. Correction: call LLM with `correctionPrompt` → plan **passes validation**
3. `continue` → loop restart, `attempt` becomes 2
4. Call LLM with **original prompt** again (corrected output from step 2 is discarded)
5. The new result might pass or fail, but the working corrected result from step 2 was thrown away

The `continue` on line 351 (and line 367) must be replaced with logic that keeps the successful correction result and validates it, rather than restarting the loop from scratch.

**Fix:**
Remove the unconditional `continue` after the correction call. Instead, after a successful correction, let the loop fall through to re-validate the corrected plan (not re-call the LLM):

```javascript
// Replace lines 344-354 with:
const correctionPrompt = prompt + '\n\n' + buildCorrectionPrompt(structureCheck.errors);
try {
  plan = await callLlmApi(correctionPrompt);
} catch {
  // Correction API call failed — continue to next attempt
  continue;
}
// Correction succeeded — DO NOT continue; fall through to re-validate
// The corrected plan is still in `plan`, re-validate below
```

This fix also applies to the same pattern in the name validation block (lines 359-367).

---

### CR-03: `getAllActivities()` called without `goalTags` returns zero rows

**File:** `backend/src/controllers/weeklyPlan.controller.js:18` → `backend/src/repositories/activity.repository.js:32-44`

**Issue:** The controller's `getActivities` function (line 18) calls `getAllActivities()` with no arguments. The repository function `getAllActivities(goalTags)` expects an array of goal tags and applies `WHERE goal_tags ?| $1` to filter activities. When `goalTags` is `undefined`, the `pg` driver converts it to `NULL`, and PostgreSQL evaluates `jsonb ?| NULL` as NULL. `WHERE NULL` returns zero rows. The LLM prompt therefore contains **zero available activities**, causing the LLM to hallucinate activity names from training data, which always fail fuzzy matching and degrade to the template-based fallback.

**Evidence:**
- `activity.repository.js:32`: `export async function getAllActivities(goalTags)` — expects array param
- `activity.repository.js:35-36`: `WHERE goal_tags ?| $1` — filters by the parameter; with `$1=NULL`, returns no rows
- `weeklyPlan.controller.js:18`: `getActivities: () => getAllActivities()` — passes no arguments

**Fix:** Either pass an empty array (which may also be problematic with `?|`) or modify the query to skip filtering when no goal tags are provided:

Option A — Pass all activities (no goal filter):
```javascript
// activity.repository.js — skip WHERE clause when no goalTags
export async function getAllActivities(goalTags = []) {
  const query = goalTags.length > 0
    ? `SELECT * FROM activities WHERE goal_tags ?| $1 ORDER BY name ASC`
    : `SELECT * FROM activities ORDER BY name ASC`;
  const params = goalTags.length > 0 ? [goalTags] : [];
  const { rows } = await pool.query(query, params);
  return rows;
}
```

Option B — Pass goal tags from the profile in the controller:
```javascript
// weeklyPlan.controller.js — derive goal tags from profile
// This requires fetching the profile first to get fitness_goal
```

---

### CR-04: Rate limiter test-mode mutations are inert

**File:** `backend/src/middlewares/weeklyPlanRateLimiter.js:33-37`

**Issue:** After the `rateLimit()` factory creates the middleware, mutating `.max` and `.windowMs` on the returned function **does not change the rate limiter's behavior**. `express-rate-limit` v7 captures configuration during construction; late property mutations have no effect. This means test mode never actually relaxes the rate limits, causing tests to hit the 5-request-per-15-minute cap and fail unpredictably.

**Evidence:**
- Line 4-5: `rateLimit({ windowMs: 15 * 60 * 1000, max: 5, ... })` — config captured at construction
- Line 33-37: `weeklyPlanLimiter.max = 1000; weeklyPlanLimiter.windowMs = 1000;` — inert mutations

**Fix:** Apply test configuration during construction, not after:

```javascript
// weekLimitRateLimiter.js — pass config at construction time
const isTest = process.env.NODE_ENV === 'test';

const weeklyPlanLimiter = rateLimit({
  windowMs: isTest ? 1000 : 15 * 60 * 1000,
  max: isTest ? 1000 : 5,
  keyGenerator: (req) => {
    return `user_${req.user?.userId || 'anonymous'}`;
  },
  handler: (req, res) => { /* ... */ },
  standardHeaders: true,
  legacyHeaders: false,
});

export default weeklyPlanLimiter;
```

---

## Warnings

### WR-01: `getMonday` timezone inconsistency causes wrong start date

**File:** `backend/src/controllers/weeklyPlan.controller.js:30-36`

**Issue:** The `getMonday` function uses local timezone methods (`getDay()`, `getDate()`, `setDate()`) to compute "this Monday" but returns a UTC date string via `toISOString()`. When the server is in a negative UTC offset (e.g., UTC-5) and runs at a late hour:

1. Local Monday 23:00 UTC-5 = Tuesday 04:00 UTC
2. `getDay()` returns 1 (Monday) ✓
3. `new Date()` says it's Monday, `setDate()` keeps it Monday
4. `toISOString()` returns Tuesday's date because UTC has already rolled over
5. The plan week starts on Tuesday instead of Monday

This affects all users whose local time crosses midnight before UTC when they generate a plan.

**Fix:** Use UTC methods consistently, or compute the week start in the user's timezone:

```javascript
function getMonday(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}
```

---

### WR-02: Missing `weekStart` input validation

**File:** `backend/src/controllers/weeklyPlan.controller.js:13`

**Issue:** The `weekStart` value from `req.body` is used directly without any validation. If the client sends an invalid string (e.g., `"not-a-date"`, `"abc"`), it propagates through `generateWeeklyPlan` → `new Date(weekStart + 'T00:00:00Z')` creates an `Invalid Date`. All downstream date operations then produce `NaN` / `Invalid Date`, generating confusing error messages like `"Day 1: expected date Invalid Date but got 2026-05-25"` and forcing the system into fallback mode unnecessarily.

**Fix:** Add input validation in the controller before passing to the service:

```javascript
function isValidDateString(str) {
  if (typeof str !== 'string') return false;
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

async function generate(req, res, next) {
  try {
    const userId = req.user.userId;
    let weekStart = req.body.weekStart;
    
    if (weekStart && !isValidDateString(weekStart)) {
      return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
    }
    if (!weekStart) {
      weekStart = getMonday(new Date());
    }
    // ... rest of function
  }
}
```

---

### WR-03: LLM API call sends only system message, no user message

**File:** `backend/src/services/llm.service.js:80-87`

**Issue:** The `callLlmApi` function only includes a single `{ role: 'system', content: systemPrompt }` message in the API request. Many LLMs (especially through OpenRouter) are tuned for chat completion with alternating user/assistant turns. Without at least one user message, some models may:
- Return empty responses or refuse to respond
- Behave unpredictably (the system prompt may be interpreted differently without a user request frame)

**Fix:** Add a minimal user message that frames the task:

```javascript
const response = await client.chat.completions.create({
  model: CONFIG.model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Generate my weekly fitness plan based on my profile and history.' },
  ],
  temperature: CONFIG.temperature,
  max_tokens: CONFIG.maxTokens,
});
```

---

## Info

### IN-01: Anonymous key fallback in rate limiter is dead code

**File:** `backend/src/middlewares/weeklyPlanRateLimiter.js:7`

**Issue:** The `keyGenerator` function uses `req.user?.userId || 'anonymous'` as the rate limit key. However, `authenticateToken` middleware runs **before** the rate limiter in the route chain (see `weeklyPlan.routes.js:8-10`). Any request without a valid token is rejected before reaching the rate limiter, making the `'anonymous'` fallback unreachable.

No functional impact, but dead code adds noise.

**Fix:** Remove the fallback since it is never reached:
```javascript
keyGenerator: (req) => `user_${req.user.userId}`,
```

---

### IN-02: Empty activity name can produce false fuzzy-match

**File:** `backend/src/services/llm.service.js:149`

**Issue:** In `fuzzyMatchActivityName`, if `act.name` is an empty string after `trim()`, `normalized` becomes `""`. The Levenshtein distance between `""` and any activity name equals the length of that name. If the shortest activity name in the database has length < 4, the empty name would falsely match via Levenshtein. Though structural validation (`validatePlanStructure` line 133) catches empty names before this function is called, removing the implicit dependency between the two validators would be more robust.

**Fix:** Add a guard at the top of `fuzzyMatchActivityName`:
```javascript
export function fuzzyMatchActivityName(name, dbActivities) {
  const normalized = name.trim().toLowerCase();
  if (normalized.length === 0) {
    return { matched: false, activity: null, matchType: 'none' };
  }
  // ...
}
```

---

### IN-03: Default LLM model name may be invalid on OpenRouter

**File:** `backend/src/services/llm.service.js:35`

**Issue:** The default model `nvidia/nemotron-nano-30b-a3b` combines "nano" (typically very small) with "30b" (30 billion parameters), which is contradictory. This model identifier may not exist on OpenRouter. If it doesn't, every API call will fail with a model-not-found error, forcing the fallback path for every request until the operator sets `LLM_MODEL` to a valid model.

**Fix:** Verify the model identifier against OpenRouter's available models, or use a known-working default such as `"openai/gpt-4o-mini"` or the fallback already recommended in `.env.example` (line 29). At minimum, add a warning log at startup if the model cannot be verified:

```javascript
console.warn(`[LLM] Using model: ${CONFIG.model}. Verify this model is available on OpenRouter.`);
```

---

_Reviewed: 2026-05-29T12:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
