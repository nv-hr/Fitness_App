---
phase: 11-docker-restructure-single-container
plan: 02
subsystem: infra
tags: [express, static-serving, spa, docker]
requires:
  - phase: 11-docker-restructure-single-container
    provides: Dockerfile multi-stage build that copies frontend/dist/ to ./public/
provides:
  - Express static file middleware (express.static('public'))
  - SPA catch-all app.get('*') route for client-side routing
affects: []

tech-stack:
  added: []
patterns:
     - Static file serving with express.static before 404 handler
     - SPA catch-all middleware (app.use) with method + /api prefix guard to prevent HTML responses for unknown API routes

key-files:
  created: []
  modified:
    - backend/src/app.js (added 14 lines: static middleware + SPA catch-all; then revised to use middleware for Express 5 compat)
    - frontend/Dockerfile (deleted)

key-decisions:
  - D-02 honored: Frontend build is served from public/ directory via express.static('public')
  - D-05 honored: frontend/Dockerfile deleted (no longer a separate service)
  - D-07 honored: CORS config unchanged (FRONTEND_URL || 'http://localhost:5173' stays)

patterns-established:
   - "SPA catch-all middleware: app.use() after API routes, before 404 handler, with GET method check + /api prefix guard (Express 5 compatible)"

requirements-completed:
  - DKR-02

duration: 3min
completed: 2026-05-28
---

# Phase 11 Plan 02: SPA Catch-all & Static Serving Summary

**Express serves React's production build via express.static('public') and an SPA catch-all route for client-side routing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-28T04:35:00Z
- **Completed:** 2026-05-28T04:38:13Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `express.static('public')` middleware after all API routes to serve React's production build artifacts
- Added SPA catch-all middleware (`app.use()`) that returns `index.html` for non-API GET requests (client-side routing support)
- SPA catch-all guards against `/api` prefix — unknown API paths still reach the JSON 404 handler
- Removed obsolete `frontend/Dockerfile` (frontend is no longer a standalone service)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SPA catch-all and static serving to app.js** - `0213213` (feat)
2. **Task 2: Remove obsolete frontend/Dockerfile** - `d6bfac8` (chore)
3. **Express 5 compat fix: use middleware instead of app.get('*')** - `704b6b2` (fix)

**Plan metadata:** *(pending)*

## Files Created/Modified

- `backend/src/app.js` - Added 14 lines: `express.static('public')` middleware and SPA catch-all `app.get('*')` with `/api` prefix guard
- `frontend/Dockerfile` - Deleted (obsolete — frontend build handled by repo-root Dockerfile multi-stage)

## Decisions Made

- SPA catch-all uses `app.use()` middleware (not `app.get('*')`) — Express 5/path-to-regexp v8 compatibility; same behavior with GET method check
- `/api` prefix check in SPA catch-all prevents unknown API routes from returning HTML (research pitfall 4 prevention)
- No `import path` added — relative path approach matches container WORKDIR, consistent with D-02

## Deviations from Plan

- SPA catch-all uses `app.use()` (middleware) instead of `app.get('*')` (route) — required for Express 5 / path-to-regexp v8 compatibility. Behavior is identical: only intercepts GET requests, passes through `/api` paths.

## Issues Encountered

### Express 5 path-to-regexp v8 incompatibility
- **Issue:** `app.get('*', ...)` fails with `TypeError: Missing parameter name at index 1: *` on Express 5.2.0 (uses path-to-regexp v8)
- **Fix:** Changed to `app.use()` middleware with GET method + `/api` prefix guard — avoids route pattern parsing entirely
- **Commit:** `704b6b2`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Express is now configured to serve both the API and the frontend's production build
- The middleware stack order is: security → CORS → compression → logging → body parsing → cookie → passport → rate limiters → API routes → Google OAuth → express.static → SPA catch-all → 404 handler → global error handler
- Ready for Plan 03 (or phase-level verification) to test the combined container build

## Self-Check: PASSED

- [x] `[ -f "backend/src/app.js" ]` — file exists with `express.static('public')` (line 122) and SPA catch-all middleware (line 126)
- [x] `[ ! -f "frontend/Dockerfile" ]` — file deleted
- [x] `0213213` — feat(11-02): add Express static serving and SPA catch-all route
- [x] `d6bfac8` — chore(11-02): remove obsolete frontend/Dockerfile
- [x] `704b6b2` — fix(11-02): use middleware-based SPA catch-all for Express 5 compatibility
- [x] Test suite no longer crashes from path-to-regexp error (pre-existing MySQL test failures unrelated)

---
*Phase: 11-docker-restructure-single-container*
*Completed: 2026-05-28*
