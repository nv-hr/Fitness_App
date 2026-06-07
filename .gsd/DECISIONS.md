# Phase 3 Decisions

**Date:** 2026-06-07

### Scope
- **Fuzzy/Loose Syncing Integration**:
  - When syncing plan items with logged data:
    - **Food**: Sum up all logs for that `food_id`, `log_date`, and `meal_type`. If the total logged weight is `>=` the planned `portion_grams`, mark the planned item as checked (`logged = true`).
    - **Activities**: Sum up all logs for that `activity_id` and `logged_date`. If the total logged duration is `>=` the planned `duration_min`, mark the planned activity as checked (`completed = true`).
  - When unchecking a plan item in the UI:
    - **Food**: Restrict deletion (unchecking) to only delete a log with the exact planned `portion_grams` (i.e. do not delete other manual logs with different portion weights).
    - **Activities**: Restrict deletion (unchecking) to only delete a log with the exact planned `duration_min`.

### Approach
- **Chose**: Option B (Fuzzy/Loose Association with strict uncheck deletion)
- **Reason**: Users want manual logs that exceed the planned threshold to automatically satisfy the plan, but they don't want check/uncheck toggles in the UI to delete their unrelated manual logs.
