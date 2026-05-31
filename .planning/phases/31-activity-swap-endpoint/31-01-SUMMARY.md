---
phase: 31-activity-swap-endpoint
plan: 01
subsystem: llm-service-prompt-rate-limiter
tags: [swap, prompts, llm, rate-limiter, weekly-plan]
requires: [phase-30]
provides: [activity-swap-prompt, swapActivity, swapLimiter]
affects:
  - backend/prompts/activity-swap-prompt.md
  - backend/src/services/llm.service.js
  - backend/src/middlewares/weeklyPlanRateLimiter.js
tech-stack:
  added: []
  patterns:
    - "Single-activity replacement via dedicated LLM prompt"
    - "Swap-specific rate limiter (10 req / 5 min) independent from generate/regenerate"
    - "LLM failure falls back to random database activity"
    - "In-place merge into cached plan without full regeneration"
key-files:
  created:
    - backend/prompts/activity-swap-prompt.md
  modified:
    - backend/src/services/llm.service.js
    - backend/src/middlewares/weeklyPlanRateLimiter.js
decisions:
  - "Swap prompt is self-contained (doesn't reference weekly-plan-prompt content)"
  - "swapLimiter follows exact same pattern as regenerateLimiter"
  - "swapActivity() used callLlmApi() for consistent model fallback chain"
  - "validateActivities + fuzzyMatchActivityName used to validate LLM replacement"
  - "format_version: 1 added to old-format plans during swap merge"
  - "Goal tags derived from fitness_goal for fallback random activity selection"
metrics:
  duration_minutes: 2
  completed_date: 2026-05-31
  tasks_completed: 3
  files_created: 1
  files_modified: 2
  commits: 3
---

# Phase 31 Activity Swap Endpoint Plan 01: Core Service & Prompt Summary

**One-liner:** Prompt template for single activity replacement + swapActivity() orchestration + dedicated swapLimiter (10 req/5 min)

## Objective

Create the core service infrastructure for activity swapping: the swap-specific LLM prompt (activity-swap-prompt.md), the `swapActivity()` function in `llm.service.js` that performs single-activity replacement with LLM call, validation, fuzzy name matching, cache merge, and fallback to random DB activity, and the dedicated `swapLimiter` rate limiter (10 req / 5 min per user) independent from generate/regenerate.

## Tasks Executed

### Task 1: Create activity-swap-prompt.md — single activity swap prompt

**Commit:** `31aeb3d`

**Created:** `backend/prompts/activity-swap-prompt.md` (66 lines)

A new self-contained LLM prompt template for generating ONE replacement activity when a user swaps out an existing activity in their weekly plan. Template variables:

- `{{fitnessGoal}}` — user's goal (lose weight / maintain / build muscle)
- `{{activityLevel}}` — user's activity level
- `{{swappedActivity}}` — formatted as `"Walking (30 min, moderate, 120 cal)"`
- `{{dayContext}}` — `"Day 2 (2026-06-02)"`
- `{{weekContext}}` — `"4 activity days, 3 rest days"`
- `{{availableActivities}}` — formatted activity list

Includes goal-specific selection rules (lose weight → cardio, build muscle → strength, maintain → balanced), activity level duration/intensity guidance, and single-activity JSON response format.

### Task 2: Add swapLimiter to weeklyPlanRateLimiter.js

**Commit:** `300affc`

**Modified:** `backend/src/middlewares/weeklyPlanRateLimiter.js`

Added `swapLimiter` (10 requests / 5 minutes per user) alongside existing `weeklyPlanLimiter` and `regenerateLimiter`. Test mode override (1000 req / 1s window). Error response matches existing pattern with `RATE_LIMITED` code and `retryAfter` field. Exported as `export { weeklyPlanLimiter, regenerateLimiter, swapLimiter }`.

### Task 3: Add swapActivity() to llm.service.js — core swap logic

**Commit:** `e963c5b`

**Modified:** `backend/src/services/llm.service.js`

Added `export async function swapActivity(deps, activityId, dayIndex)` with full implementation:

1. **Input validation** — activityId must be positive integer, dayIndex 0-6
2. **Cache lookup** — getCachedPlan, 404 if not found
3. **Activity location** — find by activity_id within day, validate not rest day
4. **Data fetch** — Promise.all for profile, activities, history
5. **Context building** — swappedActivity string, dayContext, weekContext, activitiesText
6. **Prompt construction** — buildPrompt('activity-swap-prompt.md', {...})
7. **LLM call** — via callLlmApi() with primary/fallback model chain; fallback to random DB activity on failure
8. **Validation** — validateActivities() checks structure, fuzzyMatchActivityName() resolves name to DB activity
9. **Merge** — deep-clone plan, replace in-place, add format_version if missing
10. **Cache update** — setCachedPlan with deep-cloned merged plan
11. **Return** — `{ plan, day, dayIndex, activityIndex, replacement, fromCache: false, status: 'active' }`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None detected.

## Threat Flags

Omitted — no new security-relevant surface introduced beyond what was already in the threat model (T-31-01 through T-31-04 all handled by existing authentication middleware, swapLimiter, and parameterized DB queries in the next plan).

## Verification

| Check | Status |
|-------|--------|
| activity-swap-prompt.md exists with all template variables | ✅ |
| Template vars: fitnessGoal, activityLevel, swappedActivity, dayContext, weekContext, availableActivities | ✅ |
| Goal-specific selection guidance included (3 goals) | ✅ |
| Activity level guidance included (5 levels) | ✅ |
| Single-activity JSON response format specified | ✅ |
| swapLimiter exported and loads as function | ✅ |
| swapLimiter: 10 req / 5 min, test-mode override | ✅ |
| swapLimiter: error response with RATE_LIMITED code | ✅ |
| swapActivity() exported and loads as function | ✅ |
| swapActivity: validates activityId and dayIndex inputs | ✅ |
| swapActivity: caches plan lookup, 404 if missing | ✅ |
| swapActivity: locates activity by activity_id, 400 if not found | ✅ |
| swapActivity: LLM call with callLlmApi() | ✅ |
| swapActivity: fallback to random activity on LLM failure | ✅ |
| swapActivity: validates replacement via validateActivities | ✅ |
| swapActivity: fuzzy-matches replacement name to DB activities | ✅ |
| swapActivity: deep-clones plan, replaces in-place, updates cache | ✅ |
| swapActivity: adds format_version: 1 to old-format plans | ✅ |

## Key Decisions

1. **Swap prompt is self-contained**: The activity-swap-prompt.md does not reference or require the weekly-plan-prompt.md content. It's an independent prompt with its own role, context variables, and constraints. This makes it easier to maintain and evolve independently.

2. **swapActivity uses callLlmApi()**: Direct call to the existing `callLlmApi()` function provides consistent primary/fallback model chain behavior. The response is a single activity JSON object (not wrapped in a plan structure).

3. **validateActivities + fuzzyMatchActivityName**: The replacement from the LLM is validated for structural correctness (`duration_min`, `intensity`, etc.) via `validateActivities()`, then the activity name is resolved to a real DB entry via `fuzzyMatchActivityName()`. This ensures the replacement is both valid and linked to a real database activity.

4. **format_version added on merge**: If the plan being swapped doesn't have `format_version`, it's added as `format_version: 1` during the merge. This ensures old-format plans get format_version when the first swap occurs.

## Metrics

- **Duration:** ~2 minutes
- **Commits:** 3 (31aeb3d, 300affc, e963c5b)
- **Files created:** 1 (activity-swap-prompt.md)
- **Files modified:** 2 (weeklyPlanRateLimiter.js, llm.service.js)
- **Lines added:** 99 (prompt) + 33 (limiter) + net ~177 (service)
- **Requirements covered:** SWAP-02, SWAP-04

## Self-Check: PASSED

- Commit 31aeb3d (prompt): exists ✅
- Commit 300affc (limiter): exists ✅
- Commit e963c5b (service): exists ✅
- File `backend/prompts/activity-swap-prompt.md`: exists ✅
- File `backend/src/middlewares/weeklyPlanRateLimiter.js`: swapLimiter exported ✅
- File `backend/src/services/llm.service.js`: swapActivity exported ✅
