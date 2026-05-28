---
phase: 05
plan: 03
subsystem: frontend
tags: [react, components, i18n, routing]
dependency_graph:
  requires: [05-02]
  provides: [activities_page, activity_card, activity_pool, indonesian_translations]
  affects: [05-04]
tech_stack:
  added: [React hooks, Promise.all for parallel fetching]
  patterns: [Feature-first organization, inline styles, t() i18n]
key_files:
  created: [frontend/src/features/activities/api/activityApi.js, frontend/src/features/activities/components/ActivitiesPage.jsx, frontend/src/features/activities/components/ActivityCard.jsx, frontend/src/features/activities/components/ActivityPool.jsx, frontend/src/features/activities/index.js]
  modified: [frontend/src/shared/i18n/translations.js, frontend/src/app/Router.jsx]
decisions:
  - Used Promise.all for parallel recommendations + pool fetch on mount
  - ActivityPool uses maxHeight: 400px with overflowY: auto for scrollable list
  - Reshuffle button disabled during loading to prevent double-fetch
  - Dashboard nav uses flexWrap: wrap for mobile responsiveness
metrics:
  duration: 15min
  completed_date: 2026-05-18
---

# Phase 05 Plan 03: Frontend /activities Page Summary

**One-liner:** Built /activities page with daily randomized recommendations, reshuffle capability, activity pool browser, and Indonesian translations.

## Objective

Build the frontend /activities page with daily randomized recommendations, reshuffle capability, activity pool browser, and Indonesian translations.

## What Was Built

### Files Created (5)

1. **activityApi.js** — API adapter:
   - `getRecommendations()` → GET /api/activities/recommendations
   - `getAllActivities()` → GET /api/activities

2. **ActivityCard.jsx** — Reusable card component showing:
   - Activity name (bold), description (gray text)
   - Duration and estimated calories (flex row)
   - Equipment needed (or "Tanpa alat")
   - Inline styles matching existing app pattern

3. **ActivityPool.jsx** — Full activity pool browser:
   - Header with activity count
   - Scrollable list (maxHeight: 400px) of ActivityCard components

4. **ActivitiesPage.jsx** — Main page component:
   - Fetches recommendations + allActivities on mount (Promise.all)
   - Loading state, error state (red text)
   - Recommendations section with 3-5 ActivityCards
   - Reshuffle button (disabled during loading)
   - ActivityPool section below
   - Container: maxWidth: 600px, margin: 2rem auto, padding: 1rem

5. **index.js** — Barrel export for ActivitiesPage

### Files Modified (2)

- **translations.js** — Added `activities` namespace with 15+ Indonesian keys
- **Router.jsx** — Added /activities route with ProtectedRoute, nav link in dashboard

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] activityApi.js exports getRecommendations and getAllActivities using apiGet
- [x] index.js exports ActivitiesPage from components
- [x] translations.js has activities namespace with all 15+ keys
- [x] ActivityCard renders name, description, duration, calories, equipment
- [x] ActivityCard uses t() for all text labels
- [x] ActivityPool renders list of ActivityCard components
- [x] ActivityPool shows activity count header
- [x] ActivitiesPage fetches recommendations and allActivities on mount
- [x] ActivitiesPage has reshuffle button that calls getRecommendations
- [x] ActivitiesPage shows loading state, error state, recommendations, and pool
- [x] Router.jsx has /activities route with ProtectedRoute wrapper
- [x] Router.jsx imports ActivitiesPage from features/activities/index.js
- [x] DashboardPlaceholder has nav link to /activities
- [x] All text uses t() function (no hardcoded English)
