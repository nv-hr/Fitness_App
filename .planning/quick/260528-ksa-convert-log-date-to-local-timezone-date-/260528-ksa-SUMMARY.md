---
id: 260528-ksa
type: quick
status: complete
---

## Task Completion Summary

**Fix:** Replace `.toISOString().split('T')[0]` with `.toLocaleDateString('en-CA')` in `getLogHistory` to avoid UTC date shift.

**Root cause:** `.toISOString()` converts from local timezone to UTC. For UTC+7 (Indonesia), `2026-05-28` local midnight becomes `2026-05-27T17:00:00.000Z`, producing `2026-05-27` — a one-day shift. The previous fix (260528-kj4) introduced this regression.

**Fix:** `.toLocaleDateString('en-CA')` produces `YYYY-MM-DD` format in the server's local timezone, preserving the correct date for Indonesian users.

**Files modified:**
- `backend/src/repositories/food.repository.js` — line 137, one-line change

**Tests:** All 81 tests pass.
