---
id: 260528-kj4
type: quick
subsystem: food-log
tags: [date-format, backend, frontend, postgres, NaN-fix]
requires: []
provides:
  - Backend normalizes log_date to YYYY-MM-DD in getLogHistory response
  - Frontend formatDate tolerates both YYYY-MM-DD and ISO 8601 input
affects: [food-log-history, calorie-history-display]
key-files:
  modified:
    - backend/src/repositories/food.repository.js
    - frontend/src/features/food-log/components/CalorieHistory.jsx
key-decisions:
  - Bilateral fix: backend normalizes + frontend tolerates (defense-in-depth)
  - Minimal change — only the date format line changed in each file, no logic restructuring
duration: 2min
completed: 2026-05-28
---

# Quick Task 260528-kj4: Fix Calorie History Date Returning NaN

**Normalize log_date to YYYY-MM-DD in backend getLogHistory and make frontend formatDate tolerate ISO 8601 input — bilateral fix for NaN/NaN date display**

## Performance

- **Duration:** 2 min
- **Completed:** 2026-05-28
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Backend `getLogHistory` maps result rows to convert `log_date` Date objects to `YYYY-MM-DD` strings via `.toISOString().split('T')[0]`, ensuring the API always returns clean date strings
- Frontend `formatDate` now checks `dateStr.includes('T')` before deciding whether to append `T00:00:00`, preventing Invalid Date for full ISO 8601 strings
- Both fixes are minimal (1 line changed per file), no other logic affected

## Task Commits

1. **Task 1: Backend — normalize log_date to YYYY-MM-DD in getLogHistory** - `eee8d3a` (fix)
2. **Task 2: Frontend — make formatDate tolerate both YYYY-MM-DD and ISO 8601** - `7e8bd70` (fix)

## Files Modified

- `backend/src/repositories/food.repository.js` — Line 137: `return rows` → `return rows.map(...)` with date normalization
- `frontend/src/features/food-log/components/CalorieHistory.jsx` — Line 9: conditional `new Date()` based on `includes('T')`

## Decisions Made

- **Bilateral approach:** Both backend normalization and frontend tolerance prevent the NaN issue from reoccurring if any other code path injects ISO 8601 dates
- **Minimal change:** Only the return line in the backend and the `Date` constructor in the frontend changed — zero restructuring of surrounding logic

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

---

*Quick task: 260528-kj4*
*Completed: 2026-05-28*
