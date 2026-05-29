---
phase: 15-llm-backend-integration
reviewed: 2026-05-29T14:30:00Z
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
  critical: 0
  warning: 12
  info: 5
  total: 17
status: issues_found
---

# Phase 15: Code Review Report — LLM Backend Integration

**Reviewed:** 2026-05-29T14:30:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed 9 source files comprising the OpenRouter LLM integration for weekly workout plan generation. The architecture is well-structured with clear separation of concerns (controller → service → repository) and sensible retry/caching/fallback patterns. However, several substantive issues were found: date formatting that produces unusable LLM prompt text, cache unboundedness, a general-vs-specific rate limiter conflict, a missing API timeout, improper use of `console.warn` on module import, and a shared-reference cache mutation risk. No CRITICAL (security/data-loss) issues were found, but 12 WARNING-level and 5 INFO-level issues should be addressed before shipping.

---

## Warnings

### WR-01: Date objects rendered as full toString() in LLM prompt — produces garbled history

**File:** `backend/src/services/llm.service.js:58`
**Issue:** `buildSystemPrompt()` accesses `a.logged_date` (a JavaScript `Date` object from `pg`'s default type parser) inside a template literal. `Date.prototype.toString()` is invoked implicitly, producing output like `Fri May 29 2026 00:00:00 GMT+0000` instead of the expected `2026-05-29`. This pollutes the LLM prompt with verbose, locale-dependent date strings that the model must parse.

The upstream `getActivityHistoryWithEntries()` (activity.repository.js:226) returns `pg` rows as-is, and the database config uses `pg`'s default type parsers (database.js:10-16), so DATE columns arrive as Date objects.

**Contrast:** `getActivityHistory()` (activity.repository.js:129) explicitly formats via `.toLocaleDateString('en-CA')` — this inconsistency confirms the bug.

**Fix:** Format dates in `buildSystemPrompt()` or upstream in `getActivityHistoryWithEntries()`:
```js
// Option A: format in buildSystemPrompt (llm.service.js:56-58)
const historyText = activityHistory.length > 0
  ? activityHistory.map(a => {
      const dateStr = a.logged_date
        ? (typeof a.logged_date === 'string' ? a.logged_date : a.logged_date.toISOString().split('T')[0])
        : a.loggedDate;
      return `- ${dateStr}: ${a.activity_name} (${a.duration_min}min, ${a.intensity})`;
    }).join('\n')
  : 'No recent activity history.';

// Option B: format in repository (activity.repository.js:240)
return rows.map(r => ({
  ...r,
  logged_date: r.logged_date instanceof Date
    ? r.logged_date.toISOString().split('T')[0]
    : r.logged_date,
}));
```

---

### WR-02: General `/api/` rate limiter (100) preempts food-specific limiter (200)

**File:** `backend/src/app.js:83-84`, `backend/src/app.js:110-112`
**Issue:** The general rate limiter at line 83 (`max: 100`) is mounted on `/api/` and evaluated BEFORE the food route limiter at line 110 (`max: 200`). Since `express-rate-limit` creates independent counters but evaluates middleware in order, the general limiter blocks all `/api/` requests at 100 per window, making the food limiter's `max: 200` unreachable. The effective food limit is 100, not 200.

This also silently undermines the activity limiter (`max: 60`) — though 60 < 100 so it's unaffected — and the weekly plan limiter (5 requests/15min at route level) is unaffected since it uses a per-user key.

**Fix:** Increase the general limiter's ceiling to be safely above the highest specific limiter, or restructure so specific limiters apply before the general one:
```js
// Option A: Raise general ceiling (app.js:83)
const limiter = createRateLimiter({ max: 500, message: 'Too many requests' });
//          or { max: 1000 }

// Option B: Mount specific route limiters before general (restructure needed)
```

---

### WR-03: NodeCache has no `maxKeys` — unbounded memory growth

**File:** `backend/src/services/llm.service.js:43`
**Issue:** `new NodeCache({ stdTTL: 3600, checkperiod: 600 })` stores every user's weekly plan indefinitely (up to 1-hour TTL) with no cap on total entries. With thousands of users generating plans each hour, memory grows without bound. The `checkperiod: 600` only evicts expired entries; active entries accumulate linearly.

**Fix:** Add a `maxKeys` limit:
```js
const planCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  maxKeys: 1000,     // ← add this — evicts oldest when full
});
```

---

### WR-04: `retryDelayMs` configured but never used — retries are immediate

**File:** `backend/src/services/llm.service.js:38`
**File:** `backend/src/services/llm.service.js:337-351`
**Issue:** `CONFIG.retryDelayMs` is set to `1000` but is never referenced anywhere. When the LLM API call fails (line 343) or returns invalid results, the retry loop at lines 337-395 retries immediately with no delay. If the failure was a transient rate-limit or server error, an immediate retry will likely fail again, wasting both attempts.

**Fix:** Add a delay before retry:
```js
// After the `continue` in the catch blocks (e.g., after line 350, 367, 384):
await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
```

---

### WR-05: No explicit timeout on LLM API calls — request can hang indefinitely

**File:** `backend/src/services/llm.service.js:76-98`
**Issue:** The `OpenAI` client is instantiated with no `timeout` option (line 22-31). While the OpenAI Node.js SDK v4+ has a default timeout of ~10 minutes, this is far too long for an HTTP request-response cycle. A hanging request ties up a connection pool slot and a server worker thread for minutes.

**Fix:** Add a timeout to the OpenAI client constructor:
```js
openaiClient = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: API_KEY,
  timeout: 30000,         // ← 30 second timeout
  maxRetries: 0,          // ← handle retries ourselves
  defaultHeaders: {
    'HTTP-Referer': APP_URL,
    'X-OpenRouter-Title': 'Fitness_App',
  },
});
```

---

### WR-06: Cached plan object shares reference with returned plan — mutation risk

**File:** `backend/src/services/llm.service.js:390-394`
**Issue:** After validation, the plan object is stored in cache via `setCachedPlan(...)` and then returned in the response object. Both the cache entry and the response reference the **same** JavaScript object. If a future caller mutates the returned plan (e.g., during serialization or error processing), the cached version is also mutated — potentially returning corrupted data on cache hits.

While the current architecture serializes with `res.json()` (creating a deep copy for the response), the cached reference remains exposed to any future code path that touches the returned object.

**Fix:** Deep-clone before caching:
```js
setCachedPlan(deps.userId, deps.weekStart, JSON.parse(JSON.stringify(plan)));
// or use structuredClone if available:
setCachedPlan(deps.userId, deps.weekStart, structuredClone(plan));
return { plan, fromCache: false, status: 'active' };
```

---

### WR-07: User-provided `weekStart` not normalized to Monday — LLM prompt incoherent

**File:** `backend/src/controllers/weeklyPlan.controller.js:27-33`
**File:** `backend/prompts/system-prompt.md:41`

**Issue:** The controller only calls `getMonday()` when `weekStart` is absent. If a user provides a valid non-Monday date (e.g., `"2026-05-27"` — a Wednesday), the system prompt receives `weekStartDate = "2026-05-27"` but instructs the LLM to "start from Monday of" that date. The LLM will be confused: it's told to start from a Monday but given a Wednesday as the reference.

**Fix:** Always normalize `weekStart` to the Monday of its week:
```js
if (weekStart && !isValidDateString(weekStart)) {
  return errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR');
}
weekStart = getMonday(weekStart ? new Date(weekStart) : new Date());
```

---

### WR-08: LLM response cleaning doesn't remove text before/after JSON — causes parse failure

**File:** `backend/src/services/llm.service.js:97-98`
**Issue:** The regex cleanup only strips ` ```json ` and ` ``` ` markers. If the LLM returns explanatory text before or after the JSON block (despite prompt instructions), `JSON.parse()` throws a `SyntaxError`. The error is caught by the retry loop, but it wastes a full API call and one of the two retry attempts.

Example of a response that fails: `"Here is your plan:\n{\"days\":[...]}"` — the text before `{` causes `JSON.parse` to throw.

**Fix:** Extract JSON object from the response more robustly:
```js
const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new AppError('LlmParseError', 'No JSON object found in LLM response', 502);
}
return JSON.parse(jsonMatch[0]);
```

---

### WR-09: Off-by-one in `getActivityHistory` / `getActivityHistoryWithEntries` — returns N+1 days

**File:** `backend/src/repositories/activity.repository.js:118-119`, lines 229-230
**Issue:** The cutoff calculation `setDate(getDate() - days)` and then `logged_date >= cutoff` includes `days + 1` days of data. For example, when `days = 14` (as called from `generateWeeklyPlan`), the query returns 15 days (today + 14 prior days). The system prompt says "last 14 days" but gets 15.

**Fix:** Subtract `(days - 1)` to include exactly `days` days (today through `days - 1` days ago):
```js
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - (days - 1));  // ← was: - days
```

---

### WR-10: `parseFrontendUrl` declares unused parameter

**File:** `backend/src/app.js:22`
**Issue:** The function signature `const parseFrontendUrl = (url) => {` declares a parameter `url` that is never used. The function reads `process.env.FRONTEND_URL` directly and is called with no argument (`parseFrontendUrl()`). This is dead code — the parameter is misleading and could confuse maintainers.

**Fix:** Remove the unused parameter:
```js
const parseFrontendUrl = () => {
```

---

### WR-11: `validateAndFixPlan` mutates plan in-place with side effects

**File:** `backend/src/services/llm.service.js:204-231`
**Issue:** `validateAndFixPlan` mutates the plan object passed to it: `act.name = result.activity.name; act.activity_id = result.activity.id;`. This is a side-effect function that both validates AND mutates its argument. The caller (`generateWeeklyPlan`) correctly stores the mutated result (`plan = nameCheck.plan`), but the mutation pattern makes it harder to reason about control flow — especially since the `plan` object was previously parsed from an API response and manipulated in the validation loop.

Consider making the function immutable (return a new plan object) or renaming to `validateAndMutatePlan` to clarify the side effect.

**Fix:** Rename or document the mutation:
```js
// Either make it return a new object:
export function validateAndFixPlan(plan, dbActivities) {
  const newPlan = JSON.parse(JSON.stringify(plan));
  // ... mutate newPlan ...
  return { valid: errors.length === 0, fixed, plan: newPlan, errors };
}
// Or rename to clarify side effects:
export function validateAndFixPlanInPlace(plan, dbActivities) { ... }
```

---

### WR-12: `LLM_FALLBACK_MODEL` documented in `.env.example` but never read by code

**File:** `backend/.env.example:29`
**File:** `backend/src/services/llm.service.js:34-39`

**Issue:** The `.env.example` documents `LLM_FALLBACK_MODEL=gpt-4o-mini` as a suggested fallback, but the LLM service only ever reads `LLM_MODEL` (line 35) and has no fallback model logic. If the primary model (default `nvidia/nemotron-nano-30b-a3b`) fails with a model-specific error, there's no automatic fallback to a different model.

**Fix either:** Remove the misleading comment from `.env.example`, or implement model fallback:
```js
const PRIMARY_MODEL = process.env.LLM_MODEL || 'nvidia/nemotron-nano-30b-a3b';
const FALLBACK_MODEL = process.env.LLM_FALLBACK_MODEL || 'gpt-4o-mini';

// In callLlmApi, try primary, catch and retry with fallback:
try {
  response = await attemptModel(PRIMARY_MODEL);
} catch (err) {
  console.warn(`[LLM] Primary model failed, trying fallback:`, err.message);
  response = await attemptModel(FALLBACK_MODEL);
}
```

---

## Info

### IN-01: `console.warn` used for informational model notification on module import

**File:** `backend/src/services/llm.service.js:41`
**Issue:** `console.warn('[LLM] Using model:...')` fires every time the module is imported. This is a log-level misuse — it's informational, not a warning. It also fires during test imports, producing noisy output.

**Fix:** Use `console.log` or `console.info`, and consider deferring to first use:
```js
// Either:
console.log('[LLM] Using model: ' + CONFIG.model);

// Or lazy-log on first call:
let _modelLogged = false;
function getClient() {
  if (!openaiClient && API_KEY) {
    if (!_modelLogged) {
      console.log('[LLM] Using model: ' + CONFIG.model);
      _modelLogged = true;
    }
    // ...
  }
}
```

---

### IN-02: `ValidationError` imported but never used in `llm.service.js`

**File:** `backend/src/services/llm.service.js:6`
**Issue:** `ValidationError` is imported from `../utils/errors.js` but never referenced in this module. `AppError` is used throughout; `ValidationError` is unused dead code.

**Fix:** Remove the unused import:
```js
import { AppError } from '../utils/errors.js';
```

---

### IN-03: `fixed` tracking variable in `validateAndFixPlan` is never consumed by caller

**File:** `backend/src/services/llm.service.js:205`, 230
**Issue:** The `let fixed = false` variable is set to `true` when a fuzzy match occurs (line 222), but the caller (`generateWeeklyPlan`) only checks `nameCheck.valid`. The `fixed` flag is returned but never read. This is dead logic.

**Fix either:** Remove `fixed` from the return, or log it in the caller for observability:
```js
// If not needed:
return { valid: errors.length === 0, plan, errors };

// Or consume it for observability:
if (nameCheck.fixed) {
  console.log(`[LLM] Plan had ${nameCheck.errors.length} name corrections applied`);
}
```

---

### IN-04: `getActivityHistoryWithEntries` returns Date objects that downstream must reformat

**File:** `backend/src/repositories/activity.repository.js:226-240`
**Issue:** This function returns raw `pg` rows with `logged_date` as a JavaScript `Date` object. Every downstream consumer must reformat it (as `getActivityHistory` does at line 129 with `toLocaleDateString`). Currently `buildSystemPrompt` in `llm.service.js` mishandles it (see WR-01). Normalizing the date format at the repository boundary would prevent this class of bugs.

**Fix:** Format `logged_date` in the repository, matching `getActivityHistory`'s pattern:
```js
return rows.map(r => ({
  ...r,
  logged_date: r.logged_date instanceof Date
    ? r.logged_date.toISOString().split('T')[0]
    : r.logged_date,
}));
```

---

### IN-05: `app.js` line 17: `errorResponse` imported but could also be used in 404 handler to match other error responses

**File:** `backend/src/app.js:158-160`
**Note:** The 404 handler correctly uses `errorResponse`. No issue here — this is a style note: the global error handler (lines 163-173) and the 404 handler use the same utility, which is good. No action needed; included for completeness.

---

_Reviewed: 2026-05-29T14:30:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
_Depth: standard_
