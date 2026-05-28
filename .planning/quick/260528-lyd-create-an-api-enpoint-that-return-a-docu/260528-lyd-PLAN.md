---
id: 260528-lyd
description: Create API docs endpoint and comprehensive backend documentation
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/app.js
  - backend/src/routes/docs.routes.js
autonomous: true
requirements: []
must_haves:
  truths:
    - "Developer can GET /api/docs and receive a complete JSON description of all API endpoints"
    - "Developer can read backend/docs/API.md for human-readable comprehensive API reference"
    - "The docs endpoint requires no authentication (like health check)"
    - "Every route defined in auth, profile, food, and activity modules is documented"
  artifacts:
    - path: backend/src/routes/docs.routes.js
      provides: "GET /api/docs route returning complete JSON API documentation"
      exports: ["default router"]
    - path: backend/docs/API.md
      provides: "Comprehensive human-readable API documentation"
      contains: "All endpoints with request/response schemas and examples"
  key_links:
    - from: backend/src/app.js
      to: backend/src/routes/docs.routes.js
      via: "import and app.use('/api/docs', docsRoutes)"
      pattern: "import.*docsRoutes"
    - from: backend/src/app.js
      to: backend/src/routes/docs.routes.js
      via: "app.use('/api/docs', docsRoutes) before 404 handler"
      pattern: "app\\.use.*/api/docs"

---

<objective>
Create a programmatic API documentation endpoint and a comprehensive human-readable API reference.

Purpose: Enable other developers (frontend, third-party, or new team members) to understand the full backend API surface without reading source code. The JSON endpoint supports tooling/automation; the markdown doc supports human reference.
Output: `backend/src/routes/docs.routes.js` (JSON endpoint), `backend/docs/API.md` (human reference), `backend/src/app.js` (import + mount the new route)
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/app.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/routes/auth.routes.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/routes/profile.routes.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/routes/food.routes.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/routes/activity.routes.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/controllers/auth.controller.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/controllers/profile.controller.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/controllers/food.controller.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/controllers/activity.controller.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/middlewares/auth.middleware.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/utils/response.js
@C:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/utils/errors.js

<interfaces>

Response format (from backend/src/utils/response.js):
```javascript
// Success response shape:
{ success: true, data: { ... } }
// Error response shape:
{ success: false, error: { message: string, code: string } }
```

Auth middleware (from backend/src/middlewares/auth.middleware.js):
- Reads JWT from `req.cookies.token` (httpOnly cookie, per D-01)
- Verifies with `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })`
- Sets `req.user = { userId, email }` on success
- Throws `AuthenticationError` (401) if missing/invalid

Error classes (from backend/src/utils/errors.js):
- `AppError(name, message, statusCode)`
- `ValidationError(message)` → 400
- `AuthenticationError(message)` → 401
- `NotFoundError(message)` → 404

Rate limiter pattern (from app.js `createRateLimiter`):
- General: 100 req/15min
- Auth: 10 req/15min
- Profile: 15 req/15min
- Food: 200 req/15min
- Activities: 60 req/15min

</interfaces>

</context>

<tasks>

<task type="auto">
  <name>Task 1: Create GET /api/docs JSON endpoint with full route documentation</name>
  <files>
    backend/src/routes/docs.routes.js
    backend/src/app.js
  </files>
  <action>
    Create a new file `backend/src/routes/docs.routes.js` that exports an Express Router with a single `GET /` handler.

    The handler must return a JSON object with this structure (all fields populated from actual codebase knowledge, NO hardcoded TODOs or placeholders):

    ```json
    {
      "api": {
        "name": "Fitness App API",
        "description": "Backend API for Fitness App — BMI, TDEE, food logging, activity recommendations",
        "version": "1.0.0",
        "baseUrl": "http://localhost:3001",
        "format": {
          "success": { "success": true, "data": "..." },
          "error": { "success": false, "error": { "message": "...", "code": "UPPER_SNAKE_CASE" } }
        },
        "authentication": {
          "method": "httpOnly cookie",
          "cookieName": "token",
          "algorithm": "HS256",
          "description": "Set by POST /api/auth/register and POST /api/auth/login. All endpoints except Health, Auth register/login, and Google OAuth require this cookie."
        },
        "rateLimiting": {
          "global": "100 requests per 15 minutes",
          "auth": "10 requests per 15 minutes",
          "profile": "15 requests per 15 minutes",
          "food": "200 requests per 15 minutes",
          "activities": "60 requests per 15 minutes"
        },
        "endpoints": [
          {
            "group": "Health",
            "description": "Server health check",
            "basePath": "/api/health",
            "items": [
              {
                "method": "GET",
                "path": "/api/health",
                "auth": false,
                "rateLimit": "global",
                "description": "Health check endpoint",
                "response": { "status": "ok", "timestamp": "ISO-8601 string" }
              }
            ]
          },
          {
            "group": "Auth",
            "description": "User registration, login, logout, and profile retrieval",
            "basePath": "/api/auth",
            "items": [
              {
                "method": "POST",
                "path": "/api/auth/register",
                "auth": false,
                "rateLimit": "auth",
                "description": "Register a new user",
                "requestBody": { "email": "string", "password": "string (min 8 chars)", "pdpConsent": "boolean" },
                "success": 201,
                "response": { "user": { "id": "uuid", "email": "string" } }
              },
              {
                "method": "POST",
                "path": "/api/auth/login",
                "auth": false,
                "rateLimit": "auth",
                "description": "Login with email and password",
                "requestBody": { "email": "string", "password": "string" },
                "success": 200,
                "response": { "user": { "id": "uuid", "email": "string" } }
              },
              {
                "method": "POST",
                "path": "/api/auth/logout",
                "auth": false,
                "rateLimit": "auth",
                "description": "Logout (clear session cookie)",
                "response": { "message": "Logged out successfully" }
              },
              {
                "method": "GET",
                "path": "/api/auth/me",
                "auth": true,
                "rateLimit": "global",
                "description": "Get current authenticated user",
                "response": { "user": { "id": "uuid", "email": "string", "pdp_consent": "boolean", "created_at": "ISO-8601" } }
              },
              {
                "method": "GET",
                "path": "/api/auth/google",
                "auth": false,
                "rateLimit": "none",
                "description": "Initiate Google OAuth login",
                "query": { "redirect": "Frontend URL after login" }
              },
              {
                "method": "GET",
                "path": "/api/auth/google/callback",
                "auth": false,
                "rateLimit": "none",
                "description": "Google OAuth callback handler — sets JWT cookie and redirects to frontend"
              }
            ]
          },
          {
            "group": "Profile",
            "description": "User profile with BMI, TDEE, and calorie target",
            "basePath": "/api/profile",
            "auth": "required",
            "items": [
              {
                "method": "POST",
                "path": "/api/profile",
                "auth": true,
                "rateLimit": "profile",
                "description": "Create profile (first-time setup)",
                "requestBody": { "weightKg": "number", "heightCm": "number", "age": "number", "gender": "('male'|'female')", "fitnessGoal": "('lose_weight'|'maintain'|'gain_weight')", "activityLevel": "('sedentary'|'light'|'moderate'|'active'|'extra_active')", "calorieRate": "'slow'|'moderate'|'high'|null" },
                "success": 201,
                "response": { "profile": {}, "bmi": "number", "bmiCategory": "string", "tdee": "number", "tdeeRange": {}, "calorieTarget": "number|null" }
              },
              {
                "method": "GET",
                "path": "/api/profile",
                "auth": true,
                "rateLimit": "profile",
                "description": "Get existing profile with calculated metrics",
                "response": { "profile": {}, "bmi": "number", "bmiCategory": "string", "tdee": "number", "tdeeRange": {}, "calorieTarget": "number|null" }
              },
              {
                "method": "PUT",
                "path": "/api/profile",
                "auth": true,
                "rateLimit": "profile",
                "description": "Update profile",
                "requestBody": { "weightKg": "number", "heightCm": "number", "age": "number", "gender": "('male'|'female')", "fitnessGoal": "('lose_weight'|'maintain'|'gain_weight')", "activityLevel": "('sedentary'|'light'|'moderate'|'active'|'extra_active')", "calorieRate": "'slow'|'moderate'|'high'|null" },
                "response": { "profile": {}, "bmi": "number", "bmiCategory": "string", "tdee": "number", "tdeeRange": {}, "calorieTarget": "number|null" }
              }
            ]
          },
          {
            "group": "Food",
            "description": "Food search, logging, and calorie tracking",
            "basePath": "/api/food",
            "auth": "required",
            "items": [
              {
                "method": "GET",
                "path": "/api/food/search",
                "auth": true,
                "rateLimit": "food",
                "query": { "q": "string (min 2 chars)" },
                "description": "Search foods by name",
                "response": "array of food objects"
              },
              {
                "method": "POST",
                "path": "/api/food",
                "auth": true,
                "rateLimit": "food",
                "description": "Create custom food",
                "requestBody": { "name": "string", "calories_per_100g": "number", "category": "string|null" },
                "success": 201,
                "response": "created food object"
              },
              {
                "method": "POST",
                "path": "/api/food/log",
                "auth": true,
                "rateLimit": "food",
                "description": "Log a food entry",
                "requestBody": { "foodId": "uuid|null", "customFoodName": "string|null", "portionGrams": "number (1-5000)", "logDate": "YYYY-MM-DD|null (defaults to today)", "mealType": "'breakfast'|'lunch'|'dinner'|'snack'", "calories": "number (required if customFoodName)" },
                "success": 201,
                "response": "created log entry"
              },
              {
                "method": "GET",
                "path": "/api/food/summary",
                "auth": true,
                "rateLimit": "food",
                "query": { "date": "YYYY-MM-DD (defaults to today)" },
                "description": "Daily calorie summary with balance",
                "response": { "date": "string", "totalConsumed": "number", "calorieTarget": "number|null", "remaining": "number|null", "isExtremeDeficit": "boolean" }
              },
              {
                "method": "GET",
                "path": "/api/food/logs",
                "auth": true,
                "rateLimit": "food",
                "query": { "date": "YYYY-MM-DD (defaults to today)" },
                "description": "Individual log entries for a date",
                "response": "array of log entries"
              },
              {
                "method": "GET",
                "path": "/api/food/history",
                "auth": true,
                "rateLimit": "food",
                "query": { "days": "number (defaults to 7)" },
                "description": "Calorie history for past N days",
                "response": "array of daily totals"
              },
              {
                "method": "GET",
                "path": "/api/food/recent",
                "auth": true,
                "rateLimit": "food",
                "description": "Recently logged foods for quick-add",
                "response": "array of recent food entries"
              }
            ]
          },
          {
            "group": "Activities",
            "description": "Physical activity recommendations and pool",
            "basePath": "/api/activities",
            "auth": "required",
            "items": [
              {
                "method": "GET",
                "path": "/api/activities/recommendations",
                "auth": true,
                "rateLimit": "activities",
                "description": "Randomized goal-based activity recommendations",
                "response": { "activities": [], "count": "number" }
              },
              {
                "method": "GET",
                "path": "/api/activities",
                "auth": true,
                "rateLimit": "activities",
                "description": "Full activity pool filtered by user's goal",
                "response": { "activities": [], "total": "number" }
              }
            ]
          }
        ]
      }
    }
    ```

    **Registration in app.js:**
    In `backend/src/app.js`:
    1. Add import: `import docsRoutes from './routes/docs.routes.js';` after the other route imports (line 14 area)
    2. Add mounting: `app.use('/api/docs', docsRoutes);` — place it right after the health check route (line 92 area, before the `// === Routes ===` comment), since it requires no rate limiting and no auth.
    3. The route should appear before the SPA catch-all and 404 handler (same as health check).

    Do NOT add any auth middleware or rate limiter to the docs route — it must be publicly accessible like health check.

    Do NOT use placeholders, "TBD", empty arrays, or stub data. Every endpoint must be fully documented from the actual route/controller code read in context.
  </action>
  <verify>
    <automated>node -e "
      import('./src/app.js').then(() => {});
      setTimeout(() => process.exit(0), 1000);
    " 2>&1 | Select-String -NotMatch "ExperimentalWarning|Warning:"
    </automated>
  </verify>
  <done>
    GET /api/docs returns a 200 JSON response with complete endpoint documentation covering all auth, profile, food, and activity routes. app.js imports and mounts the new route.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create comprehensive human-readable API documentation in backend/docs/API.md</name>
  <files>
    backend/docs/API.md
  </files>
  <action>
    Create `backend/docs/API.md` — a comprehensive, human-readable API reference markdown file.

    Structure the document with the following sections. Every endpoint list item must include: method, path, auth requirement, rate limit, description, request body (if applicable), query parameters (if applicable), success response shape, error codes.

    ## Document Outline:

    ```markdown
    # Fitness App API Documentation

    > Base URL: `http://localhost:3001`

    ## Overview

    Brief description of the API, what it does (BMI, TDEE, food logging, activity recommendations). State that all responses follow a standard format.

    ## Response Format

    - Success: `{ "success": true, "data": ... }`
    - Error: `{ "success": false, "error": { "message": "...", "code": "UPPER_SNAKE_CASE" } }`

    ## Authentication

    Explain httpOnly JWT cookie mechanism (per D-01). Token set by register/login, read from cookie, verified with HS256. List which endpoints require auth. Note Google OAuth flow.

    ## Rate Limiting

    Table: Global (100/15min), Auth (10/15min), Profile (15/15min), Food (200/15min), Activities (60/15min).

    ## Error Codes

    Table of error codes: VALIDATION_ERROR (400), AUTHENTICATION_ERROR (401), NOT_FOUND (404), RATE_LIMITED (429), NOT_FOUND route (404 — generic route-not-found).

    ## Endpoints

    ### 1. Health

    #### GET /api/health
    - **Auth:** No
    - **Rate Limit:** Global
    - **Description:** ...
    - **Response 200:**
      ```json
      { "success": true, "data": { "status": "ok", "timestamp": "2026-05-28T..." } }
      ```

    ### 2. Auth — `/api/auth`

    #### POST /api/auth/register
    - **Auth:** No
    - **Rate Limit:** Auth (10/15min)
    - **Description:** Register new user
    - **Request Body:**
      ```json
      { "email": "user@example.com", "password": "securePass123!", "pdpConsent": true }
      ```
    - **Response 201:**
      ```json
      { "success": true, "data": { "user": { "id": "uuid", "email": "user@example.com" } } }
      ```

    #### POST /api/auth/login
    (same level of detail)

    #### POST /api/auth/logout
    (same level of detail)

    #### GET /api/auth/me
    (same level of detail, note: requires auth)

    #### GET /api/auth/google
    #### GET /api/auth/google/callback

    ### 3. Profile — `/api/profile`

    All require auth. Rate limit: Profile (15/15min).

    #### POST /api/profile
    - **Auth:** Required
    - **Rate Limit:** Profile
    - **Description:** Create profile (first-time setup)
    - **Request Body:**
      ```json
      {
        "weightKg": 70.5,
        "heightCm": 175,
        "age": 30,
        "gender": "male",
        "fitnessGoal": "lose_weight",
        "activityLevel": "moderate",
        "calorieRate": "slow"
      }
      ```
    - **Success response 201:** Includes profile object, bmi, bmiCategory, tdee, tdeeRange, calorieTarget

    #### GET /api/profile
    #### PUT /api/profile

    ### 4. Food — `/api/food`

    All require auth. Rate limit: Food (200/15min).

    #### GET /api/food/search?q=
    #### POST /api/food
    #### POST /api/food/log
    #### GET /api/food/summary?date=
    #### GET /api/food/logs?date=
    #### GET /api/food/history?days=
    #### GET /api/food/recent

    ### 5. Activities — `/api/activities`

    All require auth. Rate limit: Activities (60/15min).

    #### GET /api/activities/recommendations
    #### GET /api/activities

    ### 6. Documentation

    #### GET /api/docs
    - **Auth:** No
    - **Rate Limit:** None
    - **Description:** Returns this API documentation in JSON format (programmatic consumption)

    ```

    **CRITICAL REQUIREMENTS:**
    - NO placeholders, "TBD", "WIP", empty arrays, or todo markers. Every section must be fully populated.
    - Field constraints must be documented exactly as enforced in the controllers (e.g., portionGrams 1-5000, search query min 2 chars, mealType enum values).
    - Include realistic example request/response JSON for every endpoint.
    - Gender values: 'male', 'female'
    - Fitness goal values: 'lose_weight', 'maintain', 'gain_weight'
    - Activity level values: 'sedentary', 'light', 'moderate', 'active', 'extra_active'
    - Calorie rate values: 'slow', 'moderate', 'high', null
    - Meal type values: 'breakfast', 'lunch', 'dinner', 'snack'
    - Use `backend/docs/` directory (it does not exist yet — create it).
  </action>
  <verify>
    <automated>
      Test-Path -LiteralPath "backend/docs/API.md"; if ($?) { $content = Get-Content -Raw "backend/docs/API.md"; $hasTbd = $content -match "TBD|TODO|todo|WIP|placeholder|FIXME"; if ($hasTbd) { Write-Error "Found placeholder content in API.md"; exit 1 } else { Write-Output "API.md exists and has no placeholders" } }
    </automated>
  </verify>
  <done>
    backend/docs/API.md exists with complete documentation for all 18+ endpoints, each with method, path, auth, rate limit, request body, query params, success response, and error codes. No placeholders or TODOs present.
  </done>
</task>

</tasks>

<verification>
1. Run `node backend/src/app.js` to verify no import/routing errors — app must start without crashing
2. Start the app, then `curl http://localhost:3001/api/docs` returns 200 with valid JSON containing all endpoint groups
3. `backend/docs/API.md` renders properly as markdown
4. Every endpoint in routes/ controllers is represented in both docs artifacts
</verification>

<success_criteria>
- `curl http://localhost:3001/api/docs` returns JSON with all endpoint groups: Health, Auth, Profile, Food, Activities
- `backend/docs/API.md` provides a complete reference readable by any developer
- The docs endpoint is unauthenticated and unmetered (no rate limiter)
- No TODO, TBD, placeholder, or stub content in either output
</success_criteria>

<output>
After completion, create `.planning/quick/260528-lyd-create-an-api-enpoint-that-return-a-docu/260528-lyd-SUMMARY.md`
</output>
