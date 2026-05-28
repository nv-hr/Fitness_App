---
phase: 11-docker-restructure-single-container
reviewed: 2026-05-28T12:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .dockerignore
  - Dockerfile
  - docker-compose.yml
  - backend/src/app.js
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 11: Code Review Report — Docker Restructure (Single Container)

**Reviewed:** 2026-05-28T12:00:00Z
**Depth:** Standard
**Files Reviewed:** 4
**Status:** Issues found

## Summary

Reviewed 4 files covering Docker setup (`.dockerignore`, `Dockerfile`, `docker-compose.yml`) and the backend Express entry point (`backend/src/app.js`). The multi-stage Dockerfile structure is well-thought-out with clear stage separation. However, one **blocker** exists: the Docker HEALTHCHECK references a route (`/api/health`) that is never defined in the application, meaning the container will always be marked unhealthy. Additionally, two warnings were found: a broken error code conversion regex in the global error handler, and missing input validation for the `FRONTEND_URL` environment variable used in OAuth redirects. One info-level finding about code duplication is noted.

## Critical Issues

### CR-01: Docker HEALTHCHECK targets non-existent endpoint — container always unhealthy

**Files:** `Dockerfile:56-57`, `backend/src/app.js` (all route definitions)
**Issue:** The Dockerfile HEALTHCHECK on line 56-57 runs `curl -f http://localhost:80/api/health || exit 1`, but no route matching `/api/health` exists anywhere in the application. The four route modules (`auth.routes.js`, `profile.routes.js`, `food.routes.js`, `activity.routes.js`) each define only their domain-specific endpoints. None register a health check. The 404 handler at `app.js:136-138` will return a 404 JSON response, causing `curl -f` to exit with code 1. As a result, Docker will perpetually mark the container as **unhealthy**, and orchestration tools (Docker Compose, Swarm, Kubernetes) will interpret this as a failure — potentially restarting or killing the container.

**Fix:** Add a health-check route in `app.js` **before** the SPA catch-all and 404 handler. The `/api/health` endpoint should return a 200 status with a lightweight response that does not depend on the database (to avoid cascading failures). Example:

```javascript
// Health check — must be before SPA catch-all and 404 handler
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

Insert this block at `app.js` around line 67, just before the `// === Routes ===` comment.

---

## Warnings

### WR-01: Error code conversion regex produces malformed error codes for common error name formats

**File:** `backend/src/app.js:144-147`
**Issue:** The global error handler converts error names to UPPER_SNAKE_CASE error codes using the regex `/([A-Z])/g`, which inserts an underscore **before every uppercase letter**. This produces incorrect output for:

| Input (err.code or err.name) | Actual Output | Expected Output |
|---|---|---|
| `INTERNAL_ERROR` (the default fallback) | `I_N_T_E_R_N_A_L__E_R_R_O_R` | `INTERNAL_ERROR` |
| `HTTPServerError` | `H_T_T_P_S_ERVER_ERROR` | `HTTP_SERVER_ERROR` |
| `AuthenticationError` | `AUTHENTICATION_ERROR` *(correct by coincidence)* | `AUTHENTICATION_ERROR` |
| `ValidationError` | `VALIDATION_ERROR` *(correct by coincidence)* | `VALIDATION_ERROR` |

The default error code — which fires when neither `err.code` nor `err.name` is set — will always be mangled to the nonsensical `I_N_T_E_R_N_A_L__E_R_R_O_R`. This pollutes error responses sent to clients.

**Fix:** Replace the regex with a proper camelCase-to-snake_case conversion that handles consecutive uppercase letters and already-uppercase strings correctly. For example:

```javascript
const errorCode = (err.code || err.name || 'INTERNAL_ERROR')
  // Insert underscore between lowercase/number and uppercase letter
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  // Insert underscore between consecutive uppercase and lowercase (e.g., HTTPServer → HTTP_Server)
  .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
  .toUpperCase();
```

This correctly handles:
- `INTERNAL_ERROR` → `INTERNAL_ERROR` (unchanged, which is what we want)
- `AuthenticationError` → `AUTHENTICATION_ERROR`
- `HTTPServerError` → `HTTP_SERVER_ERROR`
- `ValidationError` → `VALIDATION_ERROR`

---

### WR-02: Missing input validation for `FRONTEND_URL` used in OAuth redirect — potential open redirect

**File:** `backend/src/app.js:114`
**Issue:** The Google OAuth callback failure redirect on line 113-114 constructs a redirect URL using `process.env.FRONTEND_URL` directly:

```javascript
failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login',
```

If `FRONTEND_URL` is set to a malicious value (e.g., `http://evil.com`), users whose OAuth login fails will be redirected to an attacker-controlled site. While this requires compromising the deployment environment (env vars), it is a defense-in-depth gap that turns a configuration mistake into an exploitable open redirect. The same env var is also passed to the CORS `origin` config (line 26), which would similarly allow a malicious origin if compromised.

**Fix:** Validate that `FRONTEND_URL` matches an expected pattern before using it in redirects and CORS configuration. At minimum, parse it and verify it is a well-formed URL with an expected scheme (http/https). For example:

```javascript
const parseFrontendUrl = (url) => {
  // Validate and sanitize FRONTEND_URL
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const parsed = new URL(FRONTEND_URL);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid FRONTEND_URL protocol');
    }
    return FRONTEND_URL;
  } catch {
    console.error('Invalid FRONTEND_URL:', FRONTEND_URL);
    return 'http://localhost:5173'; // safe fallback
  }
};
```

---

## Info

### IN-01: Rate limiter construction pattern repeated 5 times

**File:** `backend/src/app.js:47-103`
**Issue:** The `limiterConfig` + `rateLimit()` construction pattern is duplicated 5 times (general API limiter, auth limiter, profile limiter, food limiter, activity limiter). Each block is 7-8 lines of nearly identical boilerplate. This makes it easy to miss updates (e.g., changing the error response format requires editing all 5 blocks) and inflates the file by ~40 lines.

**Fix:** Extract a helper function:

```javascript
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests',
    testMax = 1000,
    testWindowMs = 1000,
  } = options;
  const isTest = process.env.NODE_ENV === 'test';
  return rateLimit({
    windowMs: isTest ? testWindowMs : windowMs,
    max: isTest ? testMax : max,
    message,
  });
};
```

Then usage becomes:

```javascript
const limiter = createRateLimiter();  // default: 100/15min
const authLimiter = createRateLimiter({ max: 10, message: 'Too many auth attempts', testMax: 100 });
const profileLimiter = createRateLimiter({ max: 15, message: 'Too many profile requests' });
const foodLimiter = createRateLimiter({ max: 200, message: 'Too many food requests' });
const activityLimiter = createRateLimiter({ max: 60, message: 'Too many activity requests' });
```

---

## Additional Observations (No Classification)

- **`.dockerignore` with `*.md`**: This is standard and intentional — markdown files are documentation, not build artifacts. No issue.
- **`docker-compose.yml` references `./backend/.env`**: The `.env` file is properly gitignored (confirmed). Docker Compose will inject variables from the host file into the container. This is the correct pattern. No issue.
- **`Dockerfile` builder stage `npm ci`**: Both `frontend/package.json` and `frontend/package-lock.json` exist, so `npm ci` will succeed. No issue.
- **Docker dev stage uses `npm install` vs builder `npm ci`**: `npm install` is acceptable for development where `package.json` may be modified. No issue.

---

_Reviewed: 2026-05-28T12:00:00Z_
_Reviewer: gsd-code-reviewer (agent)_
_Depth: standard_
