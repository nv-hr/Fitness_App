# Phase 15: LLM Backend Integration - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend service layer that integrates with OpenRouter to auto-generate personalized weekly activity plans. Uses user profile data, activity history, and the available activities database as prompt context. Includes output validation, caching, rate limiting, and graceful fallback when the LLM is unavailable.

**In scope:**
- LLM service (`llm.service.js`) — prompt building, OpenRouter API call, JSON parsing
- Prompt template files in `backend/prompts/`
- Output validation — structural checks + fuzzy-match activity name resolution
- Rate limiting (per-user, 5 req/15 min via express-rate-limit)
- LLM response caching per week-range (node-cache, 1-hour TTL)
- Fallback plan generation (template-based from most-used activities)
- Weekly plan generation triggers: new week starts, user manually requests
- Single retry on validation failure before falling back

**Out of scope:**
- Frontend UI for viewing/regenerating plans (Phase 16)
- Profile CRUD or user settings changes (Phase 12)
- Activity logging or activity history queries (Phase 14)
- Cost monitoring dashboards
- Multi-model routing or A/B testing
</domain>

<decisions>
## Implementation Decisions

### LLM Model Selection
- **D-01:** Primary model — NVIDIA Nemotron 3 Nano 30B A3B via OpenRouter (cost-driven choice)
- **D-02:** Temperature 0.2 — deterministic, reliable JSON output
- **D-03:** Max output tokens 2000 — comfortable margin for full week plan
- **D-04:** Cache LLM responses by week range (start_date key) — avoids redundant API calls
- **D-05:** Fallback model (deferred to implementer) — gpt-4o-mini recommended as reliable affordable fallback

### Prompt Design
- **D-06:** System prompt includes user profile, activity history (last 14 days), and full available activities list
- **D-07:** JSON-only output — system prompt instructs "Return ONLY valid JSON, no markdown, no explanation"
- **D-08:** Strict JSON schema template in system prompt (follows Phase 13 D-03 weekly_plans JSONB format)
- **D-09:** Explicit variety constraints in system prompt — min/max per activity type, rest day spacing
- **D-10:** Activity matching by name — prompt uses exact DB names; post-validation does fuzzy-match on unknown names
- **D-11:** Prompt templates live in `backend/prompts/` directory as separate markdown files

### Output Validation
- **D-12:** Unknown activity names → fuzzy-match to closest DB name, log mismatch, proceed
- **D-13:** Structural validation checks: day coverage (7 consecutive days) + duration bounds (no negative, no >180 min per activity)
- **D-14:** On validation failure → one retry with correction prompt, then fall back to template plan
- **D-15:** Validation logic lives inside `llm.service.js`

### Caching & Fallback
- **D-16:** Generation triggers: new week starts (auto), user manually requests regenerate
- **D-17:** Profile changes do NOT auto-trigger regeneration
- **D-18:** In-memory cache (node-cache) TTL: 3600 seconds (1 hour, matches Phase 13 D-05)
- **D-19:** Fallback plan: template-based using user's most-used activities from history (no LLM call)

### Rate Limiting
- **D-20:** Per-user rate limit — 5 requests per 15 minutes, keyed by user ID
- **D-21:** Rate-limited response: HTTP 429 + fallback plan in body (user sees a plan with warning, not an error)
- **D-22:** Response body includes `retryAfter` field (seconds) for frontend countdown timer

### Service Architecture
- **D-23:** Single `llm.service.js` in `backend/services/` — follows existing pattern (food.service.js, activityLog.service.js)
- **D-24:** Prompt template files in `backend/prompts/` — at backend root, parallel to `services/` and `routes/`

### The Agent's Discretion
- Fallback model choice (gpt-4o-mini recommended)
- Exact fuzzy-matching algorithm for activity names
- Internal structure within `llm.service.js` (helper functions, class, module pattern)
- File name and organization within `backend/prompts/`
- Error logging detail level
- Exact OpenRouter API endpoint configuration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Data
- `backend/db/schema.sql` — weekly_plans table definition (JSONB plan_data, status column: active/generating/fallback/unavailable)

### Prior Phase Context
- `.planning/phases/13-database-schema-foundation/13-CONTEXT.md` — weekly_plans schema (D-03), status column (D-04), node-cache TTL (D-05), service pattern (D-08), archiving old plans (D-09), LLM module location (D-10)
- `.planning/phases/14-activity-logger/14-CONTEXT.md` — activity_logs table, activity history queries, existing service pattern

### Requirements
- `.planning/REQUIREMENTS.md` — LLM-01 (auto-generate weekly plan), LLM-04 (graceful fallback), LLM-05 (OpenRouter, rate limiting, output validation)

### Project State
- `.planning/STATE.md` — rate limit 5/15 min (per-user), OpenRouter as provider, prompt prototyping pending, cost monitoring not planned

### Existing Code Patterns
- `backend/services/food.service.js` — reference for single-file service pattern
- `backend/services/activityLog.service.js` — reference for single-file service pattern with validation
- `backend/app.js` — existing express-rate-limit usage pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `openai@^6.39.1` npm package — already installed; used as OpenRouter client via base URL override
- `node-cache@^5.1.2` — already installed; for in-memory LLM response caching
- `express-rate-limit@^8.5.0` — already installed; existing usage in `app.js` as reference
- `backend/services/activityLog.service.js` — pattern for service with DB queries and aggregation
- `backend/routes/` — existing route structure for adding new `/api/weekly-plans/generate` endpoint

### Established Patterns
- Single-file service pattern: `services/*.service.js` with exported async functions
- Route files in `routes/` that call service functions and return HTTP responses
- Error handling via catch blocks returning appropriate HTTP status codes
- DB queries using `db.query()` from `db/pool.js`

### Integration Points
- New `POST /api/weekly-plans/generate` route (or add to existing weeklyPlans route)
- Query `user_profiles` for weight, height, age, goals, activity_level
- Query `activity_logs` for last 14 days of logged activities
- Query `activities` for full list of available activities
- Write generated plan to `weekly_plans` table (JSONB)
- Read from `weekly_plans` for cached/fallback plans
- Rate limiter middleware on generate endpoint

</code_context>

<specifics>
## Specific Ideas

- Fallback plan should return a functional week with the user's top 3-5 most-frequent activities distributed across days
- Day coverage validation: exactly 7 consecutive days starting from Monday of the target week
- Prompt file should be a Mustache-like template with `{{variable}}` placeholders substituted at runtime
- Rate-limit "fallback" plan should be clearly marked as rate-limited (status: 'fallback', not 'active')

</specifics>

<deferred>
## Deferred Ideas

- LLM cost monitoring dashboard — belongs in a future maintenance/ops phase
- Multi-model routing or A/B testing — belongs in a future optimization phase
- Prompt versioning or iteration history — beyond current scope

</deferred>

---

*Phase: 15-LLM-Backend-Integration*
*Context gathered: 2026-05-29*
