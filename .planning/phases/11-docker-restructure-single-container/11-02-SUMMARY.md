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
    - SPA catch-all with /api prefix guard to prevent HTML responses for unknown API routes

key-files:
  created: []
  modified:
    - backend/src/app.js (added 14 lines: static middleware + SPA catch-all)
    - frontend/Dockerfile (deleted)

key-decisions:
  - D-02 honored: Frontend build is served from public/ directory via express.static('public')
  - D-05 honored: frontend/Dockerfile deleted (no longer a separate service)
  - D-07 honored: CORS config unchanged (FRONTEND_URL || 'http://localhost:5173' stays)

patterns-established:
  - "SPA catch-all middleware: app.get('*') inserted after API routes, before 404 handler, with /api prefix guard"

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
- Added SPA catch-all `app.get('*')` that returns `index.html` for non-API routes (client-side routing support)
- SPA catch-all guards against `/api` prefix — unknown API paths still reach the JSON 404 handler
- Removed obsolete `frontend/Dockerfile` (frontend is no longer a standalone service)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SPA catch-all and static serving to app.js** - `0213213` (feat)
2. **Task 2: Remove obsolete frontend/Dockerfile** - `d6bfac8` (chore)

**Plan metadata:** *(pending)*

## Files Created/Modified

- `backend/src/app.js` - Added 14 lines: `express.static('public')` middleware and SPA catch-all `app.get('*')` with `/api` prefix guard
- `frontend/Dockerfile` - Deleted (obsolete — frontend build handled by repo-root Dockerfile multi-stage)

## Decisions Made

- SPA catch-all uses relative `root: 'public'` path — resolves against Docker WORKDIR `/app`
- `/api` prefix check in SPA catch-all prevents unknown API routes from returning HTML (research pitfall 4 prevention)
- No `import path` added — relative path approach matches container WORKDIR, consistent with D-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Express is now configured to serve both the API and the frontend's production build
- The middleware stack order is: security → CORS → compression → logging → body parsing → cookie → passport → rate limiters → API routes → Google OAuth → express.static → SPA catch-all → 404 handler → global error handler
- Ready for Plan 03 (or phase-level verification) to test the combined container build

---
*Phase: 11-docker-restructure-single-container*
*Completed: 2026-05-28*
