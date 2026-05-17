---
phase: 04-food-database-calorie-logging
plan: 02
subsystem: backend-api
tags: [api, food-search, food-logging, calorie-summary]
dependency_graph:
  requires: [04-01]
  provides: [food search API, custom food API, food logging API, daily summary API, history API, recent foods API]
  affects: [04-03]
tech_stack:
  added: [Express routes, MySQL repository]
  patterns: [Controller-Service-Repository, parameterized queries, rate limiting]
key_files:
  created:
    - backend/src/repositories/food.repository.js
    - backend/src/controllers/food.controller.js
    - backend/src/routes/food.routes.js
  modified:
    - backend/src/app.js
decisions:
  - "Added getFoodById() to repository for server-side calorie calculation (T-04-06)"
  - "logFood calculates calories server-side for seeded foods, accepts client calories for custom entries"
  - "getDailySummary joins with profile repository to compute calorieTarget from TDEE"
  - "Rate limiter set to 200 req/15min for search-as-you-type (T-04-08)"
metrics:
  duration: ~20min
  completed_date: "2026-05-18"
---

# Phase 04 Plan 02: Backend Food API Summary

**One-liner:** Full REST API for food search, custom food creation, food logging, daily calorie summary with deficit warning, history, and quick-add — all authenticated with rate limiting.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create food repository with search, logging, and summary queries | `1cdc5f5` | backend/src/repositories/food.repository.js |
| 2 | Create food controller and routes, register in app.js | `ee809a3` | backend/src/controllers/food.controller.js, backend/src/routes/food.routes.js, backend/src/app.js |

## What Was Built

### Repository (food.repository.js)
7 query functions, all user-scoped with parameterized inputs:
- `searchFoods(userId, query, limit=20)` — LIKE query, seeded + user's custom foods, seeded first
- `createCustomFood(userId, data)` — INSERT with is_custom=TRUE, handles ER_DUP_ENTRY → 409
- `createFoodLog(userId, data)` — supports seeded (food_id) and custom (custom_food_name) entries
- `getDailyLogs(userId, logDate)` — JOIN with foods for food names, ordered by meal_type
- `getDailyTotal(userId, logDate)` — COALESCE SUM for zero-safe totals
- `getLogHistory(userId, days=7)` — grouped daily totals, DESC order
- `getRecentFoods(userId, limit=10)` — DISTINCT recent foods for quick-add (LOG-05)
- Plus helpers: `countFoods`, `findByCategory`, `getFoodById`

### Controller (food.controller.js)
6 HTTP handlers:
- `searchFoods` — validates min 2 chars, returns matching foods
- `createCustomFood` — validates via food.service.js, returns 201
- `logFood` — validates portion (1-5000g), mealType; calculates calories server-side for seeded foods (T-04-06); defaults date to today
- `getDailySummary` — computes totalConsumed, calorieTarget (from profile TDEE), remaining, isExtremeDeficit (<1200)
- `getLogHistory` — returns past N days' grouped totals
- `getRecentFoods` — returns recently logged foods for quick-add

### Routes (food.routes.js)
6 endpoints, all behind `authenticateToken`:
- `GET /api/food/search?q=` — search foods
- `POST /api/food` — create custom food
- `POST /api/food/log` — log food entry
- `GET /api/food/summary?date=` — daily summary
- `GET /api/food/history?days=` — calorie history
- `GET /api/food/recent` — recent foods

### App Registration (app.js)
- Dedicated rate limiter: 200 req/15min (higher than general 100 for search-as-you-type)
- Registered at `/api/food` with foodLimiter prefix

## Requirements Covered

| ID | Requirement | Status |
|----|------------|--------|
| FOOD-01 | Search returns matching foods by name | ✓ |
| FOOD-02 | Search results include name + calories_per_100g | ✓ |
| FOOD-03 | POST creates custom food, user-scoped | ✓ |
| LOG-01 | POST creates food log with food/quantity/date/meal_type | ✓ |
| LOG-02 | GET summary returns totalConsumed | ✓ |
| LOG-03 | GET summary returns remaining calories | ✓ |
| LOG-04 | GET history returns past days' totals | ✓ |
| LOG-05 | GET recent returns recently logged foods | ✓ |
| LOG-06 | GET summary includes isExtremeDeficit flag | ✓ |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] Repository exports all 7 required functions + helpers
- [x] Controller exports all 6 required handlers
- [x] Routes file has 6 endpoints with authenticateToken
- [x] app.js imports and registers foodRoutes with rate limiter
- [x] All queries use parameterized inputs (no SQL injection)
- [x] getDailySummary calculates isExtremeDeficit when totalConsumed < 1200

## Self-Check: PASSED
