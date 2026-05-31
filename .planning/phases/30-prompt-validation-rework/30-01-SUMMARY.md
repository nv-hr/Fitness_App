---
phase: 30-prompt-validation-rework
plan: 01
subsystem: llm-prompts-validation
tags: [prompts, validation, llm, weekly-plan, rest-day, format-versioning]
requires: [phase-29]
provides: [weekly-plan-prompt, rest-day-validation, availableDays-threading]
affects: [backend/prompts/, backend/src/services/llm.service.js]
tech-stack:
  added: []
  patterns:
    - "rest_day: boolean flag on each plan day entry"
    - "format_version: 1 at plan root level"
    - "availableDays parameter threading through prompt→validation→fallback"
    - "Profile-driven activity selection via goal-specific prompt sections"
key-files:
  created:
    - backend/prompts/weekly-plan-prompt.md
  modified:
    - backend/prompts/system-prompt.md
    - backend/prompts/correction-prompt.md
    - backend/src/services/llm.service.js
decisions:
  - "Weekly plans always 7 days with rest_day boolean flag on each day"
  - "availableDays controls activity/rest day distribution (4-6 range)"
  - "validatePlanStructure validates rest_day only when availableDays is provided (backward compat)"
  - "buildSystemPrompt() switches to weekly-plan-prompt.md for weekly plans"
  - "Error messages preserve '1-4' format for backward compat with existing tests"
metrics:
  duration_minutes: 3
  completed_date: 2026-05-31
  tasks_completed: 3
  files_created: 1
  files_modified: 3
  commits: 2
---

# Phase 30 Prompt & Validation Rework Plan 01: Core prompt files + LLM service validation/generation overhaul Summary

**One-liner:** Weekly plan prompt with rest_day flags, profile-driven activity selection, and format_version: 1, backed by LLM service validation for variable-day (4-6) generation.

## Objective

Update prompts and LLM service to support variable-day (4-6) weekly plans with rest_day flags, profile-driven activity selection, and format_version. The LLM now generates a fixed 7-day template where some days are marked as rest days (`rest_day: true`) and the remaining days contain activities. Activity types align with the user's fitness goal. Validation enforces the activity day count and the rest_day contract.

## Tasks Executed

### Task 1: Create weekly-plan-prompt.md & update system-prompt.md & correction-prompt.md

**Commit:** `3691ddc`

**Created:**
- `backend/prompts/weekly-plan-prompt.md` (90 lines) — New 7-day weekly plan prompt with:
  - All required variables: weightKg, heightCm, age, gender, fitnessGoal, activityLevel, calorieTarget, BMR, availableDays, weekStartDate, activityHistory, topActivityNames, availableActivities
  - Available Activity Days section with rest_day instructions
  - Goal-Specific Activity Selection section (lose weight / maintain / build muscle)
  - Activity Level Guidance section (sedentary through very_active)
  - Response format with `format_version: 1` at root and `rest_day: true|false` per day
  - 7-day example for availableDays=5 scenario
  - Constraints enforcing exact activity day count and rest day structure

- `backend/prompts/system-prompt.md` (updated) — Added Goal-Specific Activity Selection and Activity Level Guidance sections. No weekly-only fields (rest_day/format_version/availableDays) added — backward compatible for daily plans.

- `backend/prompts/correction-prompt.md` (updated) — Added rest_day validation rules: activity days must have rest_day=false with 1-4 activities, rest days must have rest_day=true with empty activities array.

### Task 2: Update validatePlanStructure, validateActivities, validateAndFixPlan

**Commit:** `ac7406d` (combined with Task 3)

- `validateActivities()` — Added `allowEmpty` parameter (default false). When true, skips minimum-count check, enabling rest days with empty activities array.
- `validatePlanStructure()` — Added `availableDays` parameter (default null). When provided, validates rest_day boolean on every day, enforces rest day empty activities contract, counts activity days (rest_day=false) against availableDays. Checks format_version is integer if present. Backward compatible when availableDays is null (legacy mode).
- `validateAndFixPlan()` — Skip rest days (rest_day === true) during activity name matching. Ensure rest day activities array is always initialized.

### Task 3: Update buildSystemPrompt, generateFallbackPlan, generateWeeklyPlan

**Commit:** `ac7406d` (combined with Task 2)

- `buildSystemPrompt()` — Changed to load `weekly-plan-prompt.md` instead of `system-prompt.md`. Accepts `availableDays` parameter, passes it to template.
- `generateFallbackPlan()` — Creates 7-day format with rest_day flags, format_version: 1. Uses `availableDays` to distribute activity days vs rest days. Updated early return for "no history" to include format_version.
- `generateWeeklyPlan()` — Threads `availableDays` through buildSystemPrompt, validatePlanStructure, and generateFallbackPlan call sites.
- `regenerateDay()` — Forwards availableDays from deps object (via spread in existing code).

## Deviations from Plan

None — plan executed exactly as written. The `rest_day` validation was made conditional on `availableDays !== null` to maintain backward compatibility with existing tests (the plan's verification requirement of "all existing tests still pass").

## Known Stubs

None detected.

## Threat Flags

Omitted — no new security-relevant surface introduced beyond what was already in the threat model.

## Verification

| Check | Status |
|-------|--------|
| weekly-plan-prompt.md exists with required variables, rest_day, format_version | ✅ |
| system-prompt.md has goal-specific + activity-level sections, no weekly-only fields | ✅ |
| correction-prompt.md references rest_day and variable-day constraints | ✅ |
| validatePlanStructure validates rest_day field when availableDays provided | ✅ |
| validatePlanStructure counts rest_day=false entries vs availableDays | ✅ |
| validateActivities allows empty array when allowEmpty=true | ✅ |
| validateAndFixPlan skips rest day activity name matching | ✅ |
| buildSystemPrompt loads weekly-plan-prompt.md with availableDays | ✅ |
| generateFallbackPlan creates 7-day format with rest_day flags | ✅ |
| generateWeeklyPlan threads availableDays through pipeline | ✅ |
| All existing unit tests pass (42/42) | ✅ |
| Full test suite: 144/146 pass (2 pre-existing DB schema E2E failures) | ✅ |

## Test Results

```
Test Suites: 1 failed (pre-existing E2E), 8 passed
Tests:       2 failed (pre-existing E2E), 144 passed
```

The 2 E2E failures (`weeklyPlan.e2e.test.js`) are pre-existing database schema creation issues (`pg_namespace_nspname_index` constraint violation) — unrelated to this plan's changes.

## Key Decisions

1. **rest_day validation conditional on availableDays**: When `availableDays` is not provided (backward compat), `validatePlanStructure` skips rest_day checks and validates activities using legacy logic. This ensures existing daily plan generation and cached weekly plans (pre-format_version) continue to work.

2. **Error message backward compatibility**: `validateActivities` preserves "expected 1-4 activities but got N" format error messages to avoid breaking existing test expectations.

3. **Prompt loading switch**: `buildSystemPrompt()` now loads `weekly-plan-prompt.md` for weekly plan generation. The `system-prompt.md` file is retained for daily activity plan generation (used by `activityPlan.service.js`).

## Metrics

- **Duration:** ~3 minutes
- **Commits:** 2 (3691ddc, ac7406d)
- **Files created:** 1 (weekly-plan-prompt.md)
- **Files modified:** 3 (system-prompt.md, correction-prompt.md, llm.service.js)
- **Lines added:** 206
- **Lines removed:** 31

## Self-Check: PASSED

- Plan file: `.planning/phases/30-prompt-validation-rework/30-01-PLAN.md` — exists
- Commit 1: `3691ddc` — exists (prompt files)
- Commit 2: `ac7406d` — exists (service file)
- SUMMARY: `.planning/phases/30-prompt-validation-rework/30-01-SUMMARY.md` — exists
- Tests: 42/42 unit tests pass
