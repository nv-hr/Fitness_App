---
phase: 15-llm-backend-integration
plan: 03
subsystem: llm-backend
tags: [api, rate-limiting, controller, routes]
key-files:
  created:
    - backend/src/middlewares/weeklyPlanRateLimiter.js
    - backend/src/controllers/weeklyPlan.controller.js
    - backend/src/routes/weeklyPlan.routes.js
  modified:
    - backend/src/repositories/activity.repository.js
    - backend/src/app.js
metrics:
  files_created: 3
  files_modified: 2
---

## Summary

Created the API endpoint for weekly plan generation with per-user rate limiting (5 req/15 min), controller delegating to LLM service, route registration with JWT auth, and `getTopActivities` repository function for fallback plans.

### Key Decisions
- Rate limiter keyed by `req.user.userId` from JWT (D-20)
- 429 response includes `retryAfter` field for frontend countdown (D-21/D-22)
- Rate limiter applied at route level (not app level) — scoped to `/generate` only
- `getMonday()` helper in controller for default week start calculation

### Deviations
None.

## Commits

| # | Description | Hash |
|---|-------------|------|
| 1 | Create rate limiter middleware | PENDING |
| 2 | Create controller, routes, add getTopActivities to repository | PENDING |
| 3 | Register weekly plan routes in app.js | PENDING |

## Self-Check: PASSED

- All 3 new files created and verified
- `app.js` imports and registers weekly plan routes
- `activity.repository.js` exports `getTopActivities`
- Rate limiter uses `keyGenerator` for per-user keying
- Controller follows existing async handler pattern
