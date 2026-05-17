---
phase: 03-tdee-calculator-goals
plan: 01
subsystem: backend
tags: [tdee, mifflin-st-jeor, activity-level, calorie-target]
requires: [02-01]
provides: [TDEE-01, TDEE-02, TDEE-03]
affects: [03-02]
tech-stack:
  added: [Mifflin-St Jeor formula, activity multipliers]
  patterns: [pure functions, parameterized queries]
key-files:
  created: []
  modified:
    - backend/db/init.sql
    - backend/src/repositories/profile.repository.js
    - backend/src/services/profile.service.js
    - backend/src/controllers/profile.controller.js
decisions:
  - "D-22: No separate /api/tdee endpoint — extends existing profile endpoint"
  - "D-23: activity_level column ENUM('low','medium','high'), nullable"
  - "D-29: Mifflin-St Jeor formula with gender-based BMR"
metrics:
  duration: "~15 min"
  completed: "2026-05-17"
---

# Phase 03 Plan 01: Backend TDEE Calculator Summary

**One-liner:** Extended profile backend with activity_level storage, Mifflin-St Jeor TDEE calculation, range computation, and goal-based calorie adjustments — all returned via existing profile endpoint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add activity_level column to schema and repository | `8b7279b` | init.sql, profile.repository.js |
| 2 | Add TDEE calculation functions to profile service | `a741dce` | profile.service.js |
| 3 | Extend profile controller to return TDEE fields | `751bc91` | profile.controller.js |

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| *(none)* | | No new threat surface beyond plan's threat model |

## Self-Check: PASSED

- Service module imports successfully
- TDEE calculation verified: 70kg, 170cm, 25yo male, medium → 2546 kcal
- All 3 commits present in git log
- init.sql has activity_level ENUM column
- Repository queries include activity_level parameter
- Service exports calculateBmr, calculateTdee, getTdeeRange, getCalorieTarget
- Controller returns tdee, tdeeRange, calorieTarget in response
