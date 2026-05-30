# Phase 16: Weekly Plan Frontend - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the frontend UI for viewing and managing the LLM-generated weekly activity plan. Users see day-by-day plan cards (Mon-Sun), can regenerate individual days, and see clear rate-limit and loading states.

**Requirements covered:** LLM-02, LLM-03

**Success criteria (from ROADMAP.md):**
1. User can view their weekly plan as day-by-day cards (Mon-Sun) showing suggested activities with name, duration, and intensity for each day
2. User can request to regenerate a single day/card from the weekly plan
3. Frontend displays clear rate-limit messaging with countdown when regeneration limit (5/15min) is hit
4. Frontend shows appropriate loading states during generation and graceful fallback display when no plan exists or plan generation fails

**In scope (LLM-02, LLM-03):**
- New `/weekly-plan` page with day-by-day plan cards
- GET endpoint for read-only plan retrieval (no rate-limit cost)
- Single-day regeneration (expand card + regenerate button)
- Rate-limit countdown UX on regenerate buttons
- Loading states during generation, empty state on first visit, fallback display

**Out of scope:**
- Backend LLM logic or prompt changes (Phase 15)
- Activity logging or history (Phase 14)
- Full week regeneration (not needed — single-day only)
- Cost monitoring dashboards
- One-click plan-to-log (deferred to v2, ACT-06)
</domain>

<decisions>
## Implementation Decisions

### Plan Display Location
- **D-01:** New `/weekly-plan` route — separate page from `/activities`. Clean separation with its own orchestrator component. No tabs or sections added to the existing ActivitiesPage.

### Plan Retrieval
- **D-02:** Add a GET endpoint `GET /api/weekly-plans?weekStart=YYYY-MM-DD` for read-only plan viewing. This endpoint reads from cache/DB and does NOT consume the 5/15min rate-limit quota.
- **D-03:** The existing `POST /api/weekly-plans/generate` is used only for actual generation (first-time generation and single-day regeneration). Rate-limit only applies to POST, not GET.
- **D-04:** Implementation note: This requires a backend change — add a `get` controller function and a GET route in `weeklyPlan.routes.js`. The rate limiter middleware should NOT apply to the GET endpoint.

### Day Card Layout
- **D-05:** Vertical scrolling layout — one day block below another (Mon-Sun). Each day card shows activities with name, duration, and intensity. Matches the app's existing vertical layout pattern.

### Regeneration UX
- **D-06:** Single-day regeneration only — no "Regenerate All" option.
- **D-07:** Day cards show a collapsed summary by default (day name + brief overview). User clicks to expand, then sees the "Regenerate Day" button inside the expanded view.
- **D-08:** Each day card manages its own expand/collapse state independently.
- **D-09:** Implementation note: Single-day regeneration requires either a new endpoint (e.g., `POST /api/weekly-plans/regenerate-day` with `{ weekStart, dayIndex }`) or modifying the generate endpoint to accept a `dayIndex` parameter. The planner/researcher should determine the best backend approach.

### Rate-limit Countdown
- **D-10:** Button-level countdown timer — disabled regenerate button shows "Wait X:XX" ticking down in real time.
- **D-11:** The countdown uses the `retryAfter` field (seconds) from the 429 response.
- **D-12:** No separate banner notification — the button's disabled state + countdown text is sufficient.
- **D-13:** Once countdown hits 0, the button re-enables automatically without page reload.

### the agent's Discretion
- Exact GET endpoint path and response format for plan retrieval
- Whether single-day regeneration uses a new endpoint or a modified existing endpoint
- Component file structure within `features/activities/components/` for the new page
- Whether to reuse or adapt the existing `ActivityCard` component for day card activities
- Color/symbol indicators for intensity levels on day cards
- Expand/collapse animation style (none vs simple CSS transition)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 16 — Success criteria, LLM-02, LLM-03
- `.planning/REQUIREMENTS.md` — LLM-02 (view weekly plan), LLM-03 (regenerate single day with rate-limit UX)

### Prior Phase Context
- `.planning/phases/15-llm-backend-integration/15-CONTEXT.md` — D-20 (rate limit 5/15min), D-21 (429 + fallback in body), D-22 (retryAfter field), rate-limiter middleware approach
- `.planning/phases/13-database-schema-foundation/13-CONTEXT.md` — D-03 (JSONB plan_data schema: days[].activities[].{activity_id, name, duration_min, intensity}), D-04 (status column: active/generating/fallback/unavailable)

### Backend API (existing)
- `backend/src/routes/weeklyPlan.routes.js` — Existing POST /generate route; target for adding GET route
- `backend/src/controllers/weeklyPlan.controller.js` — Existing controller; add `get` handler
- `backend/src/services/llm.service.js` — `generateWeeklyPlan` returns `{ plan: { days[], status, generated_at }, fromCache, status }`; `getCachedPlan`/`setCachedPlan` for in-memory cache
- `backend/src/middlewares/weeklyPlanRateLimiter.js` — Returns 429 with `{ error: { retryAfter: N } }` structure

### Frontend Patterns (reference)
- `frontend/src/features/activities/api/activityApi.js` — API module pattern for adding weekly plan API functions
- `frontend/src/features/activities/components/ActivitiesPage.jsx` — Orchestrator pattern: useState/useEffect, calls APIs, passes props
- `frontend/src/features/activities/components/ActivityCard.jsx` — Card component with inline styles, button action pattern
- `frontend/src/features/activities/components/ActivityHistory.jsx` — Grouped-by-date display pattern (reference for day card layout)
- `frontend/src/shared/lib/http.js` — Shared HTTP client (apiGet, apiPost)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActivityCard.jsx` — Existing card with name, description, duration, calories, equipment. Can be adapted for displaying activities within day plan cards.
- `frontend/src/features/activities/api/activityApi.js` — Existing API module; extend with `getWeeklyPlan()` and `regenerateDay()` functions.
- `frontend/src/shared/lib/http.js` — `apiGet` and `apiPost` helpers already available.
- `backend/src/services/llm.service.js` — `getCachedPlan(userId, weekStart)` returns plan from in-memory cache; usable by GET handler.

### Established Patterns
- Feature-based file organization: `api/` for HTTP calls, `components/` for UI, one page component per feature/directory
- Page orchestrator pattern: `ActivitiesPage.jsx` manages state, calls APIs, passes props to child components
- Inline styles throughout (no CSS framework)
- Rate-limited endpoints signal via 429 with `retryAfter` in response
- `authenticateToken` middleware on all protected routes

### Integration Points
- New GET route in `backend/src/routes/weeklyPlan.routes.js` (no rate-limiter middleware)
- New controller handler in `backend/src/controllers/weeklyPlan.controller.js`
- New `frontend/src/features/weekly-plan/` directory (or extend `activities/` feature with weekly plan API + components)
- Nav entry for the new `/weekly-plan` route (check existing nav component)
- Rate-limiter 429 response is the source of truth for countdown values — not client-side timers

### Creative Options
- The `weekly_plans` table has a `status` column (Phase 13 D-04) with values: active, generating, fallback, unavailable — the frontend can use these for conditional rendering
- The fallback plan structure is identical to LLM-generated plans (`days[].activities[]`), so the same DayCard component can render both — only the status display differs
- Plan data includes `generated_at` timestamp — useful for showing "Generated X minutes ago" text
</code_context>

<specifics>
## Specific Ideas

- Day card component needs expand/collapse state management — each card handles its own state
- Collapsed state: day name + short summary (e.g., "3 activities, 45min total")
- Expanded state: full activity list with name, duration, intensity + "Regenerate Day" button
- Regenerating a single day shows a loading spinner on that day's card only (not full page)
- Empty state (no plan exists): show a "Generate My Weekly Plan" button that calls POST /generate
- Fallback/unavailable plan: same visual layout as active plan but with a subtle warning banner or muted styling
- Countdown text format: "Wait 2:30" — minutes:seconds format, ticking every second
- Intensity display: show as label ("light", "moderate", "vigorous") — could use text with subtle color coding
</specifics>

<deferred>
## Deferred Ideas

- One-click plan-to-log (ACT-06) — belongs in v2; requires deeper UX work
- Full week regeneration — not needed; single-day is sufficient and saves rate-limit quota
- Plan history, version comparison — beyond current scope

</deferred>

---

*Phase: 16-Weekly Plan Frontend*
*Context gathered: 2026-05-30*
