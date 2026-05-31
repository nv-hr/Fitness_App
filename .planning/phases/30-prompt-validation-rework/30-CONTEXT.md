# Phase 30: Prompt & Validation Rework - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

LLM generates variable-day weekly plans with profile-driven activity selection and rest days. This phase modifies the system prompt structure, validation logic, and plan format to support:
- Variable-day plans (4-6 activity days/week, 7-day total with rest days)
- Profile-driven activity selection (fitness goal, activity level)
- Multiple activities per day based on user profile
- format_version field to distinguish old vs new format
- Correction loop adapted for variable-length validation

Dependencies: Phase 29 complete. Feeds into Phase 31 (swap endpoint) and Phase 32 (frontend).
</domain>

<decisions>
## Implementation Decisions

### Prompt Structure & Response Format
- Rest days are marked with a `rest_day: boolean` flag on each day entry (true for rest, false for activity days)
- The plan response always returns 7 days — a fixed 7-day template with `rest_day` flag on certain days
- LLM freely decides how many activities per day (within 1-4 constraint) based on profile context

### Validation Logic
- Validate availableDays by counting days where `rest_day=false` — must match requested availableDays count
- Day count mismatches are included in the correction prompt (not immediate template fallback)
- Every day entry MUST include `rest_day` field — strict contract for frontend consistency

### Profile-Driven Activity Selection
- Prompt includes goal-specific instructions (e.g., "For lose weight: prioritize cardio activities like walking, running, cycling")
- Activity level is included in profile context but LLM decides intensity/duration freely

### Format Versioning & Migration Support
- New plans include `format_version: 1` at the root level
- Old-format plans (absence of `format_version` field) are detected for lazy regeneration in Phase 33
- format_version is numeric for simple integer comparison

### the agent's Discretion
- Specific prompt wording and instruction details
- Validation error messages and correction prompt structure
- How to pass `availableDays` into the prompt
- Test strategy specifics

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `llm.service.js` — buildPrompt(), callLlmApi(), validatePlanStructure(), validateAndFixPlan(), buildCorrectionPrompt(), generateFallbackPlan(), generateWeeklyPlan(), regenerateDay()
- `activityPlan.service.js` — generateActivityPlan(), validateActivityPlanStructure(), generateFallbackActivityPlan()
- `system-prompt.md` — Current 7-day fixed prompt template
- `correction-prompt.md` — Existing correction prompt template
- Node-cache for plan caching with namespace ('activity' vs 'meal')

### Established Patterns
- Prompt-driven generation: prompts live in `backend/prompts/` as standalone .md files loaded via `buildPrompt()` with `{{variable}}` substitution
- Correction loop: validate structure → if fails, send correction prompt with specific errors → max 2 attempts → template fallback
- Plan structure is JSON from LLM stored as JSONB in PostgreSQL
- Weekly plans use `days[]` array with each day having `date` and `activities[]`
- Server-authoritative calorie override pattern
- Response format: `{ success: true, data: ... }` or `{ success: false, error: { message, code } }`
- Express clean architecture: Route → Controller → Service → Repository

### Integration Points
- `backend/prompts/system-prompt.md` — Must be updated with variable-day + profile-driven instructions
- `backend/src/services/llm.service.js` — validatePlanStructure() needs update for variable days + rest_day + format_version
- `backend/src/services/llm.service.js` — buildSystemPrompt() needs availableDays parameter
- `backend/src/services/llm.service.js` — validateActivities() may need update for rest_day days
- `backend/src/services/activityPlan.service.js` — validateActivityPlanStructure() similarly needs update
- `backend/src/services/activityPlan.service.js` — buildActivityPlanPrompt() needs profile-driven instructions
- `backend/prompts/correction-prompt.md` — May need updates for new validation errors
- Backend controllers that call generateWeeklyPlan() need to pass availableDays

</code_context>

<specifics>
## Specific Ideas

- profile.goal should map to specific activity type instructions in the prompt
- Rest days should display meaningful content in frontend (rest/recovery day messaging)
- The `format_version` field enables Phase 33 migration detection

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
