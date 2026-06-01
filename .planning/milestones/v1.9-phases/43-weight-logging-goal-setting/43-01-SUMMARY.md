# Plan 43-01: Backend Weight Logging & Goal Fields - Summary

**Status:** Complete
**Requirements:** WLOG-01 through WLOG-07, GOAL-01, GOAL-02, GOAL-03

## What Was Built

| File | Purpose |
|------|---------|
| `backend/src/repositories/weightLog.repository.js` | Weight log CRUD with UPSERT (ON CONFLICT DO UPDATE), history query (DESC), user-scoped delete |
| `backend/src/services/weightLog.service.js` | Business logic: logWeight, getHistory, deleteEntry with validation |
| `backend/src/controllers/weightLog.controller.js` | HTTP handlers: postWeight (201), getWeightHistory (200), deleteWeight (200/404) |
| `backend/src/routes/progress.routes.js` | REST routes at /api/progress/weight (POST, GET, DELETE) |
| `backend/src/repositories/profile.repository.js` | Updated: target_weight_kg, target_date in INSERT and UPDATE queries |
| `backend/src/services/profile.service.js` | Updated: goal validation, auto-log on update (WLOG-01), seed on create (WLOG-07) |
| `backend/src/controllers/profile.controller.js` | Updated: targetWeightKg/targetDate passthrough |
| `backend/src/app.js` | Updated: /api/progress routes registered |

## Key Design Points
- UPSERT via `ON CONFLICT (user_id, logged_date) DO UPDATE` (WLOG-03)
- Dynamic `import()` for weightLog.repository to avoid circular deps
- Auto-log: non-blocking try/catch after profile update succeeds (WLOG-01/02)
- Goal validation: weight 2-300kg, date >= today, direction vs fitness_goal (GOAL-03)
