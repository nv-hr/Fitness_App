---
phase: 01-foundation-authentication
plan: 02
subsystem: auth
tags: [express, jwt, bcrypt, passport, google-oauth, cookie-parser, helmet, cors, rate-limit]

# Dependency graph
requires:
  - phase: 01-01
    provides: User repository, error classes, response utilities, database pool, ESM package.json
provides:
  - Auth service layer with register, login, Google OAuth, and JWT generation
  - JWT verification middleware reading from httpOnly cookie
  - Auth controller with httpOnly cookie setting on register/login/OAuth
  - Auth routes: POST /register, POST /login, POST /logout, GET /me (protected)
  - Passport Google OAuth strategy configuration
  - Express app with security middleware (helmet, cors, rate limiting, cookie parsing)
  - Server entry point with DB connection verification and error handling
affects: [01-03, 02-01]

# Tech tracking
tech-stack:
  added: [cookie-parser@1.4]
  patterns: [controller-service-repository pattern, thin controllers delegating to service layer, httpOnly JWT cookie strategy, Passport OAuth integration, Express middleware ordering, rate limiting per endpoint, global error handler]

key-files:
  created:
    - backend/src/services/auth.service.js
    - backend/src/middlewares/auth.middleware.js
    - backend/src/controllers/auth.controller.js
    - backend/src/routes/auth.routes.js
    - backend/src/config/passport.js
    - backend/src/app.js
    - backend/src/server.js
  modified:
    - backend/package.json
    - backend/package-lock.json

key-decisions:
  - "Used req.cookies.token (not Authorization header) for JWT extraction per D-01"
  - "Same error message 'Invalid email or password' for both user-not-found and wrong-password to prevent email enumeration (T-01-06)"
  - "OAuth registration implies PDP consent (D-02) — no separate consent step needed"
  - "Separate Google OAuth routes from authRoutes in app.js to allow Passport middleware injection"
  - "Graceful server shutdown on uncaughtException/unhandledRejection instead of immediate process.exit"

patterns-established:
  - "Controller-Service-Repository: controllers are thin, delegate to service layer, service uses repository"
  - "httpOnly cookie for JWT: server sets, browser sends automatically, JavaScript cannot access"
  - "Rate limiting: general (100/15min) + strict auth-specific (10/15min) on login/register"
  - "Global error handler catches all errors, formats via errorResponse utility"
  - "Cookie options centralized as constant for consistency across register/login/OAuth"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - AUTH-06

# Metrics
duration: 14min
completed: 2026-05-17
---

# Phase 01 Plan 02: Authentication Backend Summary

**Complete auth backend with email/password registration and login, Google OAuth via Passport, JWT session management using httpOnly cookies, PDP consent enforcement, and Express app with security middleware**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-17T14:19:00Z
- **Completed:** 2026-05-17T21:25:00Z
- **Tasks:** 3 completed
- **Files modified:** 7 created, 2 modified

## Accomplishments

- Auth service implements register (with PDP consent validation, bcrypt.hash round 10), login (with bcrypt.compare, non-enumerating errors), handleGoogleOAuth (findOrCreate with implicit consent), and generateToken (HS256, 7d expiry)
- JWT middleware reads token from httpOnly cookie (req.cookies.token), verifies with HS256 algorithm, prevents algorithm confusion attacks
- Auth controller sets httpOnly cookies on register/login/OAuth, clears cookie on logout, redirects OAuth callback to frontend
- Routes define POST /register, POST /login, POST /logout, GET /me (protected with authenticateToken middleware)
- Passport configures GoogleStrategy with profile+email scope, integrated with authService.handleGoogleOAuth
- Express app configured with helmet, cors(credentials:true), compression, morgan, cookieParser, rate limiting (10/15min on auth endpoints), Passport OAuth routes
- Server starts on port 3001, verifies database connection on startup, handles uncaught exceptions and unhandled rejections

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement auth service layer and JWT middleware** - `cfddfdc` (feat)
2. **Task 2: Implement auth controller, routes, and Passport OAuth config** - `53d6961` (feat)
3. **Task 3: Wire Express app and create server entry point** - `9f2f5ba` (feat)
4. **Deviation: Add cookie-parser dependency** - `89fa83f` (chore)

## Files Created/Modified

- `backend/src/services/auth.service.js` — Business logic: register (PDP validation, bcrypt), login (bcrypt.compare, non-enumerating), handleGoogleOAuth (findOrCreate), generateToken (HS256, 7d)
- `backend/src/middlewares/auth.middleware.js` — JWT verification: reads from req.cookies.token, verifies HS256, attaches decoded user to req.user
- `backend/src/controllers/auth.controller.js` — HTTP handlers: register/login set httpOnly cookies, logout clears cookie, getMe returns user, googleCallback redirects to frontend
- `backend/src/routes/auth.routes.js` — Route definitions: POST /register, POST /login, POST /logout, GET /me (protected)
- `backend/src/config/passport.js` — Google OAuth strategy: clientID, clientSecret, callbackURL, profile+email scope, integrated with authService
- `backend/src/app.js` — Express app: helmet, cors(credentials:true), compression, morgan, json, cookieParser, passport.init, rate limiting, auth routes, OAuth routes, error handlers
- `backend/src/server.js` — Server entry: listens on PORT 3001, verifies DB connection, handles uncaughtException/unhandledRejection
- `backend/package.json` — Added cookie-parser dependency
- `backend/package-lock.json` — Generated lockfile

## Decisions Made

- Used req.cookies.token (not Authorization header) for JWT extraction — per D-01 httpOnly cookie strategy
- Same error message "Invalid email or password" for both user-not-found and wrong-password — prevents email enumeration (T-01-06)
- OAuth registration implies PDP consent — no separate consent step needed for Google OAuth users (D-02)
- Separated Google OAuth routes from authRoutes in app.js — Passport middleware must be applied directly to the route, not through router
- Graceful server shutdown on uncaughtException/unhandledRejection — calls server.close() before process.exit to allow in-flight requests to complete

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added cookie-parser dependency**
- **Found during:** Task 1 (JWT middleware requires req.cookies)
- **Issue:** cookie-parser not in package.json — req.cookies would be undefined
- **Fix:** Ran `npm install cookie-parser` to add dependency
- **Files modified:** backend/package.json, backend/package-lock.json
- **Verification:** cookieParser import in app.js, req.cookies access in auth.middleware.js
- **Committed in:** 89fa83f (chore commit)

---

**Total deviations:** 1 auto-fixed (1 blocking missing dependency)
**Impact on plan:** Essential for JWT cookie reading functionality. No scope creep.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See user_setup in plan frontmatter for:
- Environment variables needed: JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, FRONTEND_URL
- Google Cloud Console: Create OAuth 2.0 Client ID with redirect URI http://localhost:3001/api/auth/google/callback
- Docker must be running for MySQL container: `docker compose up -d`

## Next Phase Readiness

- Auth backend complete — all 6 AUTH requirements fulfilled (AUTH-01 through AUTH-06)
- API endpoints ready for frontend integration: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- Google OAuth flow ready: GET /api/auth/google initiates flow, callback sets JWT cookie
- Rate limiting protects auth endpoints from brute force
- Ready for Plan 03: Frontend auth UI (login/register forms, OAuth button, protected dashboard)

## Self-Check: PASSED

All 7 created files verified on disk. All 4 commits verified in git log. All plan-level acceptance criteria pass.

---

*Phase: 01-foundation-authentication*
*Completed: 2026-05-17*
