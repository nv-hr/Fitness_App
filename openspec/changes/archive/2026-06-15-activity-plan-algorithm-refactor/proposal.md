## Why

The current weekly activity plan generation relies on an LLM API call, introducing latency, non-determinism, and an external dependency that can fail silently — causing fallback plans that do not respect the user's actual fitness profile. Replacing the LLM with a deterministic algorithm makes plan generation fast, reliable, and fully auditable.

## What Changes

- Remove LLM-based weekly plan generation from `POST /api/weekly-plans/generate` and `POST /api/weekly-plans/generate-stream`
- Introduce a new deterministic algorithm service (`activityPlan/weeklyPlanAlgorithm.js`) that:
  - Maps `activity_level` from profile to a **base calorie ceiling** (e.g. sedentary → max 80 cal/activity)
  - Queries the `activities` table filtered by `fitness_goal` tags **and** the calorie ceiling
  - Builds a randomized weekly schedule with **2 rest days** and **5 active days**
  - Assigns daily workout duration tiers per intensity level: 20 / 40 / 60 / 80 / 100 minutes
  - Packages 3–4 activity sets per active day within the tier's total minute budget
- Remove LLM fallback paths specific to weekly plan generation (the separate `activityPlan/generator.js` LLM flow for daily plans is unaffected for now)
- All existing plan operations (toggle-complete, swap, regenerate-day, get) remain unchanged

## Capabilities

### New Capabilities
- `activity-plan-algorithm`: Deterministic weekly plan generation using profile-based activity level, calorie ceiling filtering, goal-tag matching, randomized set building, and fixed 2-rest-day weekly structure

### Modified Capabilities
- `manual-plan-generation`: The trigger and persistence contract stays the same, but the generation engine changes from LLM to the new algorithm; the requirement that plan generation is user-triggered and read operations are side-effect-free is preserved

## Impact

- **Backend**: `backend/src/services/activityPlan/weeklyPlanAlgorithm.js` (new), `backend/src/controllers/weeklyPlan.controller.js` (replace `generateWeeklyPlan` calls), `backend/src/services/llm.service.js` (no longer called for weekly plans)
- **API contracts**: No change — `POST /api/weekly-plans/generate` and SSE `/generate-stream` keep the same request/response shape
- **Database**: No schema changes; queries are added against the existing `activities` table using `goal_tags` JSONB and `estimated_calories`
- **Tests**: Existing weekly plan controller tests will need updated mocks; new unit tests for the algorithm service
