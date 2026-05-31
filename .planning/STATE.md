---
gsd_state_version: 1.0
milestone: v1.6
milestone_name: Activity Planner Rework
status: completed
stopped_at: Plan 32-02 complete — Days selector panel, rest day cards, swap buttons, WeeklyPlanPage fully wired — 2/2 plans done in Phase 32
last_updated: "2026-05-31T12:55:37.943Z"
last_activity: 2026-05-31 — Plan 32-02 executed (days selector, rest day cards, swap buttons, WeeklyPlanPage wiring)
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 8
  completed_plans: 7
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-31)

**Core value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

**Current focus:** v1.6 Activity Planner Rework

## Current Position

Phase: 30-prompt-validation-rework (complete)
Phase: 31-activity-swap-endpoint (plan 31-01 complete, 31-02 pending)
Phase: 32-frontend-days-selector-swap-ui (plans 32-01 and 32-02 complete)
Status: Plan 32-02 complete — Days selector panel, rest day cards, swap buttons, WeeklyPlanPage fully wired
Last activity: 2026-05-31 — Plan 32-02 executed (days selector, rest day cards, swap buttons, WeeklyPlanPage wiring)

Progress: [█████████░] 88%

## Performance Metrics

**Velocity:**

- Total plans completed: 68 (v1.0–v1.5)
- Average duration: N/A
- Total execution time: N/A

## Accumulated Context

### Decisions

- D-01: Weekly plans always 7 days with rest_day boolean flag on each day (true for rest, false for activity)
- D-02: Validation counts rest_day=false entries and verifies against availableDays (4-6 range)
- D-03: Prompt includes goal-specific activity selection instructions (lose weight/maintain/build muscle)
- D-04: Activity level guidance included in prompt for duration/intensity scaling
- D-05: format_version: 1 at plan root level for future migration detection (Phase 33)
- D-06: buildSystemPrompt() loads weekly-plan-prompt.md for weekly plans; system-prompt.md retained for daily plans
- D-07: Swap prompt is self-contained (no weekly-plan-prompt dependency) — single-activity replacement with own role, context, and constraints
- D-08: swapActivity() uses callLlmApi() for consistent model fallback chain rather than manual model iteration
- D-09: validateActivities + fuzzyMatchActivityName used to validate LLM replacement before cache merge
- D-10: format_version: 1 added to old-format plans during swap merge (lazy migration)
- D-11: Toast accepts `type` prop (success/error/info) for flexible reuse beyond swap errors
- D-12: Swap countdown managed at WeeklyPlanPage level via swapRetryAfter state + useEffect interval pattern
- D-13: Toast state uses single {message} object that replaces on new error; rendered in all 5 return branches
- [Phase ?]: availableDays default for migrated plans = 5 (CONTEXT.md discretion)

### Pending Todos

(none)

### Blockers/Concerns

- LLM reliability with variable-length output (4-6 days) — existing correction loop mitigates but untested at boundary conditions

## Deferred Items

Items acknowledged and carried forward from v1.5 milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |
| Phase 33-plan-migration-edge-cases P01 | 3min | - tasks | - files |

## Session Continuity

Last session: 2026-05-31T12:55:07.058Z
Stopped at: Plan 32-02 complete — Days selector panel, rest day cards, swap buttons, WeeklyPlanPage fully wired — 2/2 plans done in Phase 32
Resume file: None
