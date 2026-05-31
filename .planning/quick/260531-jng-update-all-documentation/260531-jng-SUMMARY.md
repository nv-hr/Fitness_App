---
type: quick
status: complete
description: Update all documentation to reflect completed cleanup of legacy meal_plans system and v1.5 state
date: 2026-05-31
quick_id: 260531-jng
---

# Summary: Update All Documentation

## Changes Made

### STATE.md
- Replaced stale note about old `/meal-plan` routes with accurate description of what was removed
- Added note about `/weekly-plan` still active for LLM activity plans
- Added note about `daily_meal_plans` and `activity_plans` handling all new plan generation

### PROJECT.md
- Updated "Shipped" from v1.4 to v1.5 Smart Auto-Logging
- Updated phase count from 23→29, plans from 62→68, commits from 220+→230+
- Added v1.5 shipped summary with all 6 features
- Added test status (127 tests passing)

### backend/docs/API.md
- Removed duplicate Section 6 (Documentation) - kept the more complete version
- Updated rate limit table: replaced "Meal Plans" reference with "Daily Meal Plans" and "Activity Plans" rows
- Removed old Section 9 (Meal Plans - `/api/meal-plans`) - entire 7-day meal plans API documentation
- Fixed orphaned Section 8 content: added `#### GET /api/weekly-plans` header to orphaned endpoint docs
- Added new Section 9: Daily Meal Plans (`/api/daily-meal-plans`) with GET, POST generate, POST log endpoints
- Added new Section 10: Activity Plans (`/api/activity-plans`) with GET, POST generate, POST log-activities endpoints

### codebase/ARCHITECTURE.md
- Replaced old "Meal Plan Generation (LLM)" section (referenced deleted `mealPlan.service.js`) with current "Daily Meal Plan Generation (LLM)" flow
- Added new "Activity Plan Generation (LLM)" section
- Updated Notes section: removed stale rate limiter/table references, added utility references (`fuzzyMatchFoodName`, `recalculateDayCalories`)
- Added note about legacy `meal_plans` table remaining for archive

### README.md
- Added 4 new feature entries: Daily Meal Plans, Activity Plan Auto-Logging, Meal Plan Auto-Logging
