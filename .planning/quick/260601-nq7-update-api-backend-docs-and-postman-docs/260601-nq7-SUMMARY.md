---
phase: quick
plan: 260601-nq7
subsystem: docs
tags: [api-docs, postman, openapi, rate-limits, progress-tracker]
requires: []
provides: []
affects: [backend/docs/API.md, docs/Fitness_App_API.postman_collection.json]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - backend/docs/API.md
    - docs/Fitness_App_API.postman_collection.json
decisions:
  - "Progress/Weight endpoints documented under Section 10 with 50/15 rate limit"
  - "Postman test scripts follow existing pm.test patterns for consistency"
metrics:
  duration: ~15 min
  completed: "2026-06-01"
---

# Phase Quick Plan 260601-nq7: Update API backend docs and Postman docs Summary

**One-liner:** Fixed 6 inaccurate rate limits, added Section 10 (Progress/Weight) to API.md, and added 21 missing endpoint requests to Postman collection across 5 groups.

## Tasks Executed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Section 10 (Progress) to API.md and fix rate limits | `772c9d8` | `backend/docs/API.md` |
| 2 | Add all missing endpoint groups to Postman collection | `1fc97c6` | `docs/Fitness_App_API.postman_collection.json` |

## Changes

### Task 1 — API.md Updates

**Rate limit table fixes:**
- Weekly Plans Generate: **5 → 50 per 15** min (from `weeklyPlanRateLimiter.js`)
- Weekly Plans Regenerate-Day: **added row at 30 per 30** min (from code)
- Weekly Plans Swap: **added row at 10 per 5** min (from code)
- Weekly Plans Toggle-Complete: **added row at 60 per 1** min (from code)
- Daily Meal Plans Generate: **5 → 50 per 15** min (from `dailyMealPlanRateLimiter.js`)
- Activity Plans Generate: **5 → 50 per 15** min (from `activityPlanRateLimiter.js`)
- **Added Progress row**: 50 per 15 min

**Section 10 (Progress) added:**
- `POST /api/progress/weight` — upsert weight entry with notes support, syncs to profile
- `GET /api/progress/weight?limit=N` — sorted desc, default 50 limit
- `DELETE /api/progress/weight/:id` — ownership-gated deletion

**Verification:**
- Section 10 exists at line 1261 ✓
- `weight_kg` documented 3 times ✓
- All old "5 per 15" rate limit mentions removed ✓
- File: 1308 lines (≥ 1300 target ✓)

### Task 2 — Postman Collection Updates

**Added 5 Activity endpoints** to existing Activity group:
- `POST /api/activities/log` — Status 201, calories_burned > 0
- `GET /api/activities/logs?date=` — Status 200, returns array
- `GET /api/activities/history?days=` — Status 200, returns array
- `DELETE /api/activities/log/:id` — Status 200
- `GET /api/activities/summary?date=` — Status 200, netCalories check

**Added 5 Weekly Plans endpoints** (new top-level group):
- `POST /api/weekly-plans/generate`
- `GET /api/weekly-plans?weekStart=`
- `POST /api/weekly-plans/regenerate-day`
- `POST /api/weekly-plans/swap`
- `POST /api/weekly-plans/toggle-complete`

**Added 5 Daily Meal Plans endpoints** (new top-level group):
- `GET /api/daily-meal-plans?date=`
- `POST /api/daily-meal-plans/generate`
- `POST /api/daily-meal-plans/log`
- `POST /api/daily-meal-plans/toggle-item`
- `POST /api/daily-meal-plans/swap-item`

**Added 3 Activity Plans endpoints** (new top-level group):
- `GET /api/activity-plans?date=`
- `POST /api/activity-plans/generate`
- `POST /api/activity-plans/log`

**Added 3 Progress/Weight endpoints** (new top-level group):
- `POST /api/progress/weight`
- `GET /api/progress/weight?limit=`
- `DELETE /api/progress/weight/:id`

**`week_start` variable** added to collection variables array.

**Total:** 9 groups, 40 items (21 new), 1281 lines
**JSON valid:** ✓
**All test scripts** follow existing `pm.test` patterns with property assertions.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `### 10. Progress` in API.md | ✓ Found at line 1261 |
| `weight_kg` documented | ✓ 3 occurrences |
| Progress/Weight group in Postman | ✓ |
| Postman JSON valid | ✓ |
| `week_start` variable | ✓ |
| Commit 1 (`772c9d8`) | ✓ API.md updates |
| Commit 2 (`1fc97c6`) | ✓ Postman collection updates |

## Known Stubs

None.

## Threat Flags

None — no new security-relevant surface introduced (documentation-only changes).

## Self-Check: PASSED

All plan success criteria met:
- API.md: Section 10 with 3 weight tracking endpoints ✓
- Rate limit table: accurate values for all LLM generation limits ✓
- Postman collection: all 21 missing endpoints across 5 new groups ✓
- Both files valid (markdown renders, JSON parses) ✓
