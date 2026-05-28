---
phase: 11-docker-restructure-single-container
fixed_at: 2026-05-28T12:00:00Z
review_path: .planning/phases/11-docker-restructure-single-container/11-REVIEW.md
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report — Docker Restructure (Single Container)

**Fixed at:** 2026-05-28T12:00:00Z
**Source review:** .planning/phases/11-docker-restructure-single-container/11-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 1
- Fixed: 1
- Skipped: 0

## Fixed Issues

### IN-01: Rate limiter construction pattern repeated 5 times

**Files modified:** `backend/src/app.js`
**Commit:** `bcb07ed`
**Applied fix:** Extracted a `createRateLimiter` helper function that centralizes the test-mode detection and `rateLimit()` configuration. The helper accepts overridable options (`max`, `windowMs`, `message`, `testMax`, `testWindowMs`) and defaults to the general API limits (100 req / 15 min). All 5 rate limiter blocks (general API, auth, profile, food, activity) were replaced with single-line calls using their respective thresholds.

## Previous Fixes (Iteration 1)

The following findings were fixed in iteration 1:

### CR-01: Docker HEALTHCHECK targets non-existent endpoint

**Files modified:** `backend/src/app.js`
**Commit:** `2459c6d`
**Applied fix:** Added `/api/health` GET route handler that returns `{ status: 'ok', timestamp: <ISO string> }`. Placed immediately before the `// === Routes ===` comment to ensure it registers before the SPA catch-all and 404 handler. The Dockerfile HEALTHCHECK curl command was already correct — only the missing route needed to be added.

### WR-01: Error code conversion regex produces malformed codes

**Files modified:** `backend/src/app.js`
**Commit:** `35bb708`
**Applied fix:** Replaced the single naive regex `/([A-Z])/g` (which inserted an underscore before every uppercase letter) with a two-pass conversion:
1. `.replace(/([a-z0-9])([A-Z])/g, '$1_$2')` — inserts underscore between lowercase/number and following uppercase
2. `.replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')` — inserts underscore between consecutive uppercase and following lowercase

This correctly handles all cases:
- `INTERNAL_ERROR` → `INTERNAL_ERROR` (unchanged)
- `HTTPServerError` → `HTTP_SERVER_ERROR`
- `AuthenticationError` → `AUTHENTICATION_ERROR`
- `ValidationError` → `VALIDATION_ERROR`
- `NotFoundError` → `NOT_FOUND_ERROR`
- `JSONParseError` → `JSON_PARSE_ERROR`

### WR-02: Missing input validation for FRONTEND_URL

**Files modified:** `backend/src/app.js`
**Commit:** `6f8ff32`
**Applied fix:** Added a `parseFrontendUrl()` validation function that:
1. Reads `process.env.FRONTEND_URL` with fallback to `http://localhost:5173`
2. Validates that the URL has an `http:` or `https:` protocol
3. Returns the original URL if valid, or the safe fallback if invalid/malformed
4. Logs a console error when falling back to help with debugging

The validated `FRONTEND_URL` constant is used for both CORS origin configuration and the OAuth failure redirect URL.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-05-28T12:00:00Z_
_Fixer: gsd-code-fixer (agent)_
_Iteration: 2_
