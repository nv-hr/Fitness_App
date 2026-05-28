---
phase: 05
plan: 02
subsystem: backend-api
tags: [repository, service, controller, routes, express]
dependency_graph:
  requires: [05-01]
  provides: [activity_recommendations_api, activity_pool_api]
  affects: [05-03]
tech_stack:
  added: [MySQL JSON_OVERLAPS, ORDER BY RAND()]
  patterns: [Controller-Service-Repository, rate limiting, authenticateToken middleware]
key_files:
  created: [backend/src/repositories/activity.repository.js, backend/src/services/activity.service.js, backend/src/controllers/activity.controller.js, backend/src/routes/activity.routes.js]
  modified: [backend/src/app.js]
decisions:
  - Used JSON_OVERLAPS for goal_tags array intersection (MySQL 8.4)
  - ORDER BY RAND() for simple randomization (D-45, no state tracking)
  - Fallback to all activities if no profile exists
  - Rate limiter at 60 req/15min (expensive ORDER BY RAND() queries)
metrics:
  duration: 15min
  completed_date: 2026-05-18
---

# Phase 05 Plan 02: Backend API for Activity Recommendations Summary

**One-liner:** Built full backend API for goal-filtered activity recommendations with repository, service, controller, routes, and rate-limited registration.

## Objective

Build the backend API for activity recommendations: repository for goal-filtered random selection, service for recommendation logic, controller and routes for HTTP endpoints.

## What Was Built

### Files Created (4)

1. **activity.repository.js** — 3 query functions:
   - `getRandomActivities(userId, goalTags, count=5)` — JSON_OVERLAPS + ORDER BY RAND()
   - `getAllActivities(userId, goalTags)` — Goal-filtered list ordered by name
   - `getActivityById(activityId)` — Single activity lookup

2. **activity.service.js** — Business logic:
   - `mapFitnessGoalToTags(fitnessGoal)` — Maps profile goal to activity tags
   - `getRecommendations(userId, fitnessGoal, count=5)` — Randomized recommendations with fallback
   - `getAllActivitiesByGoal(userId, fitnessGoal)` — Full goal-filtered pool

3. **activity.controller.js** — HTTP handlers:
   - `getRecommendations` — Fetches profile fitness_goal, returns 3-5 randomized activities
   - `getAllActivities` — Returns full activity pool filtered by goal

4. **activity.routes.js** — Express router with authenticateToken middleware:
   - `GET /recommendations` → Randomized recommendations
   - `GET /` → Full activity pool

### Files Modified (1)

- **app.js** — Added activityRoutes import, activityLimiter (60 req/15min), registered at `/api/activities`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] Repository exports 3 async functions (getRandomActivities, getAllActivities, getActivityById)
- [x] getRandomActivities uses JSON_OVERLAPS for goal_tags filtering
- [x] getRandomActivities uses ORDER BY RAND() for shuffle
- [x] Service maps fitness_goal to goal_tags for all 3 values
- [x] Controller fetches user profile for fitness_goal
- [x] Controller handles missing profile (fallback)
- [x] Routes have GET /recommendations and GET / behind authenticateToken
- [x] app.js imports activityRoutes
- [x] app.js has activityLimiter with max: 60
- [x] All files follow exact patterns from food module
