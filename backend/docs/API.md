# Fitness App API Documentation

> Base URL: `http://localhost:3001`

## Overview

The Fitness App API provides endpoints for BMI calculation, TDEE estimation, food logging and calorie tracking, and physical activity recommendations. All responses follow a standard format with `success` boolean and `data` or `error` payload.

### Documentation & Specifications Maintenance
- Any changes to endpoints, request payloads, or response structures MUST be documented in this `API.md` file immediately.
- Correlating feature specifications and requirements MUST be updated in the `openspec/specs/` directory as part of any pull request.
- Unused dependencies or dead code identified by `Fallow` should be removed, and their removal documented in the `code-health` spec.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "UPPER_SNAKE_CASE"
  }
}
```

## Authentication

The API uses httpOnly JWT cookie authentication (per D-01).

- **Mechanism:** A JWT token is set as an httpOnly cookie named `token` after successful registration or login.
- **Algorithm:** HS256 (HMAC with SHA-256).
- **Cookie config:** `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`, max age 7 days.
- **Usage:** The token is automatically sent by the browser on every request. No `Authorization` header is needed.
- **Protected endpoints:** All endpoints except Health check, Auth register/login, and Google OAuth routes require a valid token cookie. If missing or invalid, the API returns a 401 `AUTHENTICATION_ERROR`.

### Google OAuth

- **GET /api/auth/google** — Redirects the browser to Google's consent screen.
- **GET /api/auth/google/callback** — Handles the OAuth callback from Google. On success, sets the JWT cookie and redirects to the frontend. On failure, redirects to the frontend login page.

## Rate Limiting

| Group      | Limit              | Applied To                          |
|-----------|-------------------|-------------------------------------|
| Global    | 100 per 15 minutes | All `/api/` routes                  |
| Auth      | 10 per 15 minutes  | `/api/auth/login`, `/api/auth/register` |
| Profile   | 15 per 15 minutes  | All `/api/profile` routes           |
| Food      | 200 per 15 minutes | All `/api/food` routes              |
| Activities| 60 per 15 minutes  | All `/api/activities` routes        |
| Progress  | 50 per 15 minutes  | All `/api/progress/` routes         |
| Weekly Plans Generate | 50 per 1 minute | POST /api/weekly-plans/generate, POST /api/weekly-plans/generate-stream |
| Weekly Plans Regenerate-Day | 30 per 1 minute | POST /api/weekly-plans/regenerate-day, POST /api/weekly-plans/regenerate-day-stream |
| Weekly Plans Swap | 10 per 1 minute | POST /api/weekly-plans/swap, POST /api/weekly-plans/swap-stream |
| Weekly Plans Toggle-Complete | 60 per 1 minute | POST /api/weekly-plans/toggle-complete |
| Daily Meal Plans | 20 per 1 minute | All `/api/daily-meal-plans` LLM routes (/generate, /generate-stream, /regenerate-category, /regenerate-category-stream) |
| Activity Plans | 50 per 15 minutes | All `/api/activity-plans` routes |

Rate-limited requests return a 429 status with `RATE_LIMITED` error code.

## Error Codes

| HTTP Status | Code                  | Description                          |
|-------------|-----------------------|--------------------------------------|
| 400         | `VALIDATION_ERROR`    | Invalid request body or parameters   |
| 401         | `AUTHENTICATION_ERROR`| Missing, invalid, or expired token   |
| 404         | `NOT_FOUND`           | Resource not found                   |
| 429         | `RATE_LIMITED`        | Too many requests (rate limit hit)   |
| 404         | `NOT_FOUND`           | Route not found (generic 404)        |
| 500         | `HTTP_SERVER_ERROR`   | Internal server error                |

---

## Endpoints

### 1. Health

#### GET /api/health

- **Auth:** No
- **Rate Limit:** Global
- **Description:** Health check endpoint to verify the server is running.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "timestamp": "2026-05-28T15:00:00.000Z"
    }
  }
  ```

---

### 2. Auth — `/api/auth`

#### POST /api/auth/register

- **Auth:** No
- **Rate Limit:** Auth (10 per 15 minutes)
- **Description:** Register a new user account.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePass123!",
    "pdpConsent": true
  }
  ```
- **Constraints:**
  - `email`: Valid email format.
  - `password`: Minimum 8 characters.
  - `pdpConsent`: Must be `true` (PDP consent required).
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com"
      }
    }
  }
  ```
- **Cookies Set:** `token` (httpOnly JWT, 7 days)
- **Error Codes:** `VALIDATION_ERROR` (400) — duplicate email, invalid input

#### POST /api/auth/login

- **Auth:** No
- **Rate Limit:** Auth (10 per 15 minutes)
- **Description:** Login with email and password.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePass123!"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com"
      }
    }
  }
  ```
- **Cookies Set:** `token` (httpOnly JWT, 7 days)
- **Error Codes:** `AUTHENTICATION_ERROR` (401) — invalid credentials

#### POST /api/auth/logout

- **Auth:** No
- **Rate Limit:** Auth (10 per 15 minutes)
- **Description:** Logout by clearing the session cookie.
- **Request Body:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    }
  }
  ```
- **Cookies Cleared:** `token`

#### GET /api/auth/me

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Get the currently authenticated user's profile information.
- **Query Parameters:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "pdp_consent": true,
      "created_at": "2026-05-28T15:00:00.000Z"
    }
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401), `NOT_FOUND` (404)

#### GET /api/auth/google

- **Auth:** No
- **Rate Limit:** None
- **Description:** Initiate Google OAuth login flow. Redirects the browser to Google's consent screen.
- **Query Parameters:**
  - `redirect` (optional): Frontend URL to redirect to after login.
- **Response:** 302 redirect to Google OAuth consent screen.

#### GET /api/auth/google/callback

- **Auth:** No
- **Rate Limit:** None
- **Description:** Google OAuth callback handler. On success, sets the JWT cookie and redirects to the frontend. On failure, redirects to the frontend login page with an error.
- **Query Parameters:** `code` (set by Google), `state` (optional)
- **Response:** 302 redirect to frontend URL. Sets `token` cookie on success.

---

### 3. Profile — `/api/profile`

All profile endpoints require authentication. Rate limit: Profile (15 per 15 minutes).

#### POST /api/profile

- **Auth:** Required
- **Rate Limit:** Profile
- **Description:** Create a user profile (first-time setup). Calculates BMI, TDEE, and calorie target.
- **Field Constraints:**
  - `gender`: `'male'` or `'female'`
  - `fitnessGoal`: `'lose_weight'`, `'maintain'`, or `'gain_weight'`
  - `activityLevel`: `'sedentary'`, `'light'`, `'moderate'`, `'active'`, or `'extra_active'`
  - `calorieRate`: `'slow'`, `'moderate'`, `'high'`, or `null`
  - `weightKg`, `heightCm`, `age`: Must be positive numbers.
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
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "id": "uuid",
        "user_id": "uuid",
        "weight_kg": 70.5,
        "height_cm": 175,
        "age": 30,
        "gender": "male",
        "fitness_goal": "lose_weight",
        "activity_level": "moderate",
        "calorie_rate": "slow"
      },
      "bmi": 23.0,
      "bmiCategory": "Normal weight",
      "tdee": 2200,
      "tdeeRange": {
        "min": 1980,
        "max": 2420
      },
      "calorieTarget": 1700
    }
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401)

#### GET /api/profile

- **Auth:** Required
- **Rate Limit:** Profile
- **Description:** Get the existing profile with calculated BMI, TDEE, and calorie target.
- **Query Parameters:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "profile": { ... },
      "bmi": 23.0,
      "bmiCategory": "Normal weight",
      "tdee": 2200,
      "tdeeRange": {
        "min": 1980,
        "max": 2420
      },
      "calorieTarget": 1700
    }
  }
  ```
- **Error Codes:** `NOT_FOUND` (404) — no profile exists yet, `AUTHENTICATION_ERROR` (401)

#### PUT /api/profile

- **Auth:** Required
- **Rate Limit:** Profile
- **Description:** Update the existing profile. Recalculates BMI, TDEE, and calorie target. Accepts partial or full profile data.
- **Field Constraints:** Same as POST /api/profile.
- **Request Body:**
  ```json
  {
    "weightKg": 72.0,
    "activityLevel": "active",
    "calorieRate": "moderate"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "profile": { ... },
      "bmi": 23.5,
      "bmiCategory": "Normal weight",
      "tdee": 2500,
      "tdeeRange": {
        "min": 2250,
        "max": 2750
      },
      "calorieTarget": 2000
    }
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `AUTHENTICATION_ERROR` (401)

---

### 4. Food — `/api/food`

All food endpoints require authentication. Rate limit: Food (200 per 15 minutes).

#### GET /api/food/search

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Search for foods by name. Returns matching foods from the user's custom foods and seeded database.
- **Query Parameters:**
  - `q` (required): Search query, minimum 2 characters.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Chicken Breast",
        "calories_per_100g": 165,
        "category": "Meat",
        "is_custom": false
      },
      {
        "id": "uuid",
        "name": "Chicken Thigh",
        "calories_per_100g": 209,
        "category": "Meat",
        "is_custom": false
      }
    ]
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400) — query too short, `AUTHENTICATION_ERROR` (401)

#### POST /api/food

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Create a custom food entry for the authenticated user.
- **Request Body:**
  ```json
  {
    "name": "My Protein Shake",
    "calories_per_100g": 85,
    "category": "Beverages"
  }
  ```
- **Constraints:**
  - `name`: Required, non-empty string.
  - `calories_per_100g`: Required, non-negative number.
  - `category`: Optional, string or null.
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "user_id": "uuid",
      "name": "My Protein Shake",
      "calories_per_100g": 85,
      "category": "Beverages",
      "is_custom": true
    }
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401)

#### POST /api/food/log

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Log a food entry for a specific date and meal type.
- **Field Constraints:**
  - `portionGrams`: Number between 1 and 5000 (inclusive).
  - `mealType`: One of `'breakfast'`, `'lunch'`, `'dinner'`, `'snack'`.
  - `logDate`: Optional. Format `YYYY-MM-DD`. Defaults to today if omitted.
  - `foodId` or `customFoodName` is required (not both).
  - `calories`: Required if `customFoodName` is provided. Optional (calculated server-side) if `foodId` is provided.
- **Request Body (seeded food):**
  ```json
  {
    "foodId": "550e8400-e29b-41d4-a716-446655440000",
    "portionGrams": 200,
    "logDate": "2026-05-28",
    "mealType": "lunch"
  }
  ```
- **Request Body (custom food):**
  ```json
  {
    "customFoodName": "Homemade Soup",
    "portionGrams": 300,
    "calories": 250,
    "logDate": "2026-05-28",
    "mealType": "dinner"
  }
  ```
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "user_id": "uuid",
      "food_id": "uuid",
      "custom_food_name": null,
      "calories": 330,
      "portion_grams": 200,
      "log_date": "2026-05-28",
      "meal_type": "lunch"
    }
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400) — invalid portion, meal type, missing fields, `NOT_FOUND` (404) — foodId not found, `AUTHENTICATION_ERROR` (401)

#### GET /api/food/summary

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Get the daily calorie summary with total consumed, calorie target, remaining calories, and deficit indicator.
- **Query Parameters:**
  - `date` (optional): Format `YYYY-MM-DD`. Defaults to today if omitted.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-05-28",
      "totalConsumed": 1850,
      "calorieTarget": 2000,
      "remaining": 150,
      "isExtremeDeficit": false
    }
  }
  ```
- **Notes:**
  - `calorieTarget` is `null` if no profile exists.
  - `remaining` is `null` if `calorieTarget` is `null`.
  - `isExtremeDeficit` is `true` when `totalConsumed < 1200` calories.
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### GET /api/food/logs

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Get individual food log entries for a specific date.
- **Query Parameters:**
  - `date` (optional): Format `YYYY-MM-DD`. Defaults to today if omitted.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "food_id": "uuid",
        "custom_food_name": null,
        "calories": 330,
        "portion_grams": 200,
        "log_date": "2026-05-28",
        "meal_type": "lunch",
        "food_name": "Chicken Breast"
      },
      {
        "id": "uuid",
        "food_id": null,
        "custom_food_name": "Homemade Soup",
        "calories": 250,
        "portion_grams": 300,
        "log_date": "2026-05-28",
        "meal_type": "dinner",
        "food_name": "Homemade Soup"
      }
    ]
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### GET /api/food/history

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Get calorie history (daily totals) for the past N days.
- **Query Parameters:**
  - `days` (optional): Number of days to look back. Defaults to 7 if omitted.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      { "log_date": "2026-05-28", "total_calories": 1850 },
      { "log_date": "2026-05-27", "total_calories": 2100 },
      { "log_date": "2026-05-26", "total_calories": 1650 }
    ]
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### GET /api/food/recent

- **Auth:** Required
- **Rate Limit:** Food
- **Description:** Get recently logged foods for quick-add functionality.
- **Query Parameters:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "food_id": "uuid",
        "food_name": "Chicken Breast",
        "calories_per_100g": 165,
        "category": "Meat",
        "last_logged": "2026-05-28"
      },
      {
        "food_id": "uuid",
        "food_name": "Brown Rice",
        "calories_per_100g": 111,
        "category": "Grains",
        "last_logged": "2026-05-27"
      }
    ]
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

---

### 5. Activities — `/api/activities`

All activity endpoints require authentication. Rate limit: Activities (60 per 15 minutes).

#### 5.1 GET /api/activities/recommendations

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Get randomized activity recommendations based on the user's fitness goal. Uses `ORDER BY RAND()` for variety. Falls back to `'maintain'` goal if no profile exists.
- **Query Parameters:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "activities": [
        {
          "id": "uuid",
          "name": "Brisk Walking",
          "description": "Walk at a fast pace for 30 minutes",
          "category": "Cardio",
          "calories_per_hour": 280,
          "difficulty": "easy",
          "goals": ["lose_weight", "maintain"]
        },
        {
          "id": "uuid",
          "name": "Cycling",
          "description": "Moderate pace cycling for 45 minutes",
          "category": "Cardio",
          "calories_per_hour": 400,
          "difficulty": "medium",
          "goals": ["lose_weight", "maintain", "gain_weight"]
        }
      ],
      "count": 2
    }
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### 5.2 GET /api/activities

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Get the full activity pool filtered by the user's fitness goal. Falls back to all activities if no profile exists.
- **Query Parameters:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "activities": [
        {
          "id": "uuid",
          "name": "Brisk Walking",
          "description": "Walk at a fast pace for 30 minutes",
          "category": "Cardio",
          "calories_per_hour": 280,
          "difficulty": "easy",
          "goals": ["lose_weight", "maintain"]
        },
        {
          "id": "uuid",
          "name": "Weight Training",
          "description": "Full body strength workout",
          "category": "Strength",
          "calories_per_hour": 350,
          "difficulty": "medium",
          "goals": ["maintain", "gain_weight"]
        }
      ],
      "total": 2
    }
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### 5.3 POST /api/activities/log

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Log a completed activity with duration and intensity. Calories burned calculated server-side using intensity multiplier.
- **Field Constraints:**
  - `activityId`: Required integer. Must reference an existing activity.
  - `durationMin`: Required integer, minimum 1, maximum 1440.
  - `intensity`: Required. One of `'light'`, `'moderate'`, `'vigorous'`.
  - `loggedDate`: Optional. Format `YYYY-MM-DD`. Defaults to today if omitted.
- **Intensity Multipliers (server-authoritative):**
  - `light`: 0.7
  - `moderate`: 1.0
  - `vigorous`: 1.3
- **Calorie Formula:** `calories_per_hour x (durationMin / 60) x intensity_multiplier`
- **Request Body:**
  ```json
  {
    "activityId": 1,
    "durationMin": 30,
    "intensity": "moderate",
    "loggedDate": "2026-05-28"
  }
  ```
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "id": 42,
      "user_id": "uuid",
      "activity_id": 1,
      "duration_min": 30,
      "intensity": "moderate",
      "calories_burned": 165,
      "logged_date": "2026-05-28"
    }
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `AUTHENTICATION_ERROR` (401)

#### 5.4 GET /api/activities/logs

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Get activity log entries for a specific date.
- **Query Parameters:**
  - `date` (optional): Format `YYYY-MM-DD`. Defaults to today.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 42,
        "user_id": "uuid",
        "activity_id": 1,
        "activity_name": "Brisk Walking",
        "duration_min": 30,
        "intensity": "moderate",
        "calories_burned": 165,
        "logged_date": "2026-05-28"
      }
    ]
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### 5.5 GET /api/activities/history

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Get grouped activity history for the past N days. Optionally includes detailed entries per day.
- **Query Parameters:**
  - `days` (optional): Number of days to look back. Defaults to 7.
  - `includeEntries` (optional): `'true'` to include per-entry details. Defaults to `'false'`.
- **Response 200 (without entries):**
  ```json
  {
    "success": true,
    "data": [
      {
        "logged_date": "2026-05-28",
        "total_minutes": 60,
        "total_burned": 330
      }
    ]
  }
  ```
- **Response 200 (with entries):**
  ```json
  {
    "success": true,
    "data": [
      {
        "logged_date": "2026-05-28",
        "total_minutes": 60,
        "total_burned": 330,
        "entries": [
          {
            "id": 42,
            "activity_name": "Brisk Walking",
            "duration_min": 30,
            "intensity": "moderate",
            "calories_burned": 165
          }
        ]
      }
    ]
  }
  ```
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

#### 5.6 DELETE /api/activities/log/:id

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Delete a specific activity log entry. Only the owning user can delete their own logs.
- **Path Parameters:**
  - `id`: Integer log entry ID.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": null
  }
  ```
- **Error Codes:** `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `AUTHENTICATION_ERROR` (401)

#### 5.7 GET /api/activities/summary

- **Auth:** Required
- **Rate Limit:** Activities
- **Description:** Get a daily summary combining activity burn and food consumption, with net calorie calculation.
- **Query Parameters:**
  - `date` (optional): Format `YYYY-MM-DD`. Defaults to today.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-05-28",
      "totalActiveMinutes": 60,
      "totalCaloriesBurned": 330,
      "totalConsumed": 1850,
      "calorieTarget": 2000,
      "netCalories": 1520,
      "netVsTarget": -480
    }
  }
  ```
- **Notes:**
  - `calorieTarget` is `null` if no profile exists.
  - `netCalories = totalConsumed - totalCaloriesBurned`.
  - `netVsTarget = netCalories - calorieTarget` (negative = deficit).
- **Error Codes:** `AUTHENTICATION_ERROR` (401)

---

### 6. Documentation

#### GET /api/docs

- **Auth:** No
- **Rate Limit:** None
- **Description:** Returns the full API documentation in JSON format for programmatic consumption by tools and automation.
- **Query Parameters:** None
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "api": {
        "name": "Fitness App API",
        "description": "Backend API for Fitness App — BMI, TDEE, food logging, activity recommendations, activity logging, LLM weekly plans, LLM meal recommendations",
        "version": "1.0.0",
        "baseUrl": "http://localhost:3001",
        "endpoints": [ ... ]
      }
    }
  }
  ```

---

### 7. Weekly Plans (LLM) — `/api/weekly-plans`

All weekly plan endpoints require authentication. Rate limiters: Generate (50 per 1 minute), Regenerate-Day (30 per 1 minute), Swap (10 per 1 minute), Toggle-Complete (60 per 1 minute).

#### POST /api/weekly-plans/generate

- **Auth:** Required
- **Rate Limit:** Weekly Plans Generate (50 per 1 minute)
- **Description:** Generate a weekly activity plan using LLM (OpenRouter). Results are cached in-memory and persisted to the database.
- **Request Body:**
  ```json
  {
    "weekStart": "2026-05-25",
    "availableDays": 4
  }
  ```
- **Notes:** `weekStart` is optional. Defaults to the current ISO week's Monday. `availableDays` must be an integer between 4 and 6 (defaults to 4).
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": {
        "days": [
          {
            "day": 0,
            "label": "Monday",
            "date": "2026-05-25",
            "activities": [
              {
                "activity_id": 1,
                "name": "Brisk Walking",
                "durationMin": 30,
                "intensity": "moderate",
                "caloriesBurned": 165,
                "category": "Cardio",
                "completed": false
              }
            ],
            "totalCaloriesBurned": 165,
            "totalMinutes": 30
          }
        ],
        "weekStart": "2026-05-25",
        "weekLabel": "May 25 - May 31",
        "status": "active",
        "generated_at": "2026-05-31T12:00:00.000Z"
      },
      "fromCache": false
    }
  }
  ```

#### POST /api/weekly-plans/generate-stream

- **Auth:** Required
- **Rate Limit:** Weekly Plans Generate (50 per 1 minute)
- **Description:** Generate a weekly activity plan (Server-Sent Events stream).
- **Request Body:** Same as `POST /api/weekly-plans/generate`
- **Response:** `text/event-stream` returning Server-Sent Events in the format:
  ```
  data: {"type": "chunk", "content": "..."}
  
  data: {"type": "done", "plan": {...}}
  
  data: {"type": "error", "message": "..."}
  ```

---

#### GET /api/weekly-plans

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Retrieve the current weekly plan. Checks in-memory cache first, then falls back to the database.
- **Query Parameters:**
  - `weekStart` (optional): Format `YYYY-MM-DD`. Defaults to the current ISO week's Monday.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... },
      "fromCache": true
    }
  }
  ```

#### POST /api/weekly-plans/regenerate-day

- **Auth:** Required
- **Rate Limit:** Weekly Plans Regenerate-Day (30 per 1 minute)
- **Description:** Regenerate a single day within an existing weekly plan.
- **Request Body:**
  ```json
  {
    "weekStart": "2026-05-25",
    "dayIndex": 2,
    "availableDays": 4
  }
  ```
- **Constraints:**
  - `weekStart`: Optional.
  - `dayIndex`: Required. Integer between 0 (Monday) and 6 (Sunday).
  - `availableDays`: Optional. Integer between 4 and 6.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... },
      "regeneratedDay": 2,
      "fromCache": false
    }
  }
  ```

#### POST /api/weekly-plans/regenerate-day-stream

- **Auth:** Required
- **Rate Limit:** Weekly Plans Regenerate-Day (30 per 1 minute)
- **Description:** Regenerate a single day within an existing weekly plan (Server-Sent Events stream).
- **Request Body:** Same as `POST /api/weekly-plans/regenerate-day`
- **Response:** `text/event-stream` returning Server-Sent Events in the format:
  ```
  data: {"type": "chunk", "content": "..."}
  
  data: {"type": "done", "plan": {...}}
  
  data: {"type": "error", "message": "..."}
  ```

#### POST /api/weekly-plans/swap

- **Auth:** Required
- **Rate Limit:** Weekly Plans Swap (10 per 1 minute)
- **Description:** Swap a single activity in a weekly plan day with an LLM-generated replacement. Only works for the current day.
- **Request Body:**
  ```json
  {
    "weekStart": "2026-05-25",
    "dayIndex": 2,
    "oldActivityName": "Brisk Walking",
    "intensity": "moderate"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... }
    }
  }
  ```

#### POST /api/weekly-plans/swap-stream

- **Auth:** Required
- **Rate Limit:** Weekly Plans Swap (10 per 1 minute)
- **Description:** Swap a single activity in a weekly plan day with an LLM-generated replacement (Server-Sent Events stream). Only works for the current day.
- **Request Body:**
  ```json
  {
    "weekStart": "2026-05-25",
    "dayIndex": 2,
    "activityId": 1
  }
  ```
- **Response:** `text/event-stream` returning Server-Sent Events in the format:
  ```
  data: {"type": "chunk", "content": "..."}
  
  data: {"type": "done", "plan": {...}}
  
  data: {"type": "error", "message": "..."}
  ```

#### POST /api/weekly-plans/toggle-complete

- **Auth:** Required
- **Rate Limit:** Weekly Plans Toggle-Complete (60 per 1 minute)
- **Description:** Toggle the completion status of a weekly plan activity for a given day.
- **Request Body:**
  ```json
  {
    "weekStart": "2026-05-25",
    "dayIndex": 2,
    "activityName": "Brisk Walking"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... }
    }
  }
  ```

---

### 8. Daily Meal Plans — `/api/daily-meal-plans`

All daily meal plan endpoints require authentication. Rate limit: 20 per 1 minute for LLM routes.

#### GET /api/daily-meal-plans

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Retrieve the daily meal plan. Checks cache first, then the `daily_meal_plans` database table.
- **Query Parameters:**
  - `date` (optional): Format `YYYY-MM-DD`. Defaults to today.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": {
        "date": "2026-05-31",
        "meals": [
          {
            "meal_type": "breakfast",
            "items": [
              { "food_id": 1, "food_name": "Oatmeal", "portion_grams": 200, "calories": 190 }
            ],
            "total_calories": 190,
            "logged": false
          }
        ],
        "total_calories": 1950,
        "calorie_target": 2000,
        "generated_at": "2026-05-31T12:00:00.000Z"
      },
      "fromCache": true
    }
  }
  ```

#### POST /api/daily-meal-plans/generate

- **Auth:** Required
- **Rate Limit:** Daily Meal Plans (20 per 1 minute)
- **Description:** Generate a 1-day meal plan using LLM.
- **Request Body:**
  ```json
  {
    "date": "2026-05-31"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... },
      "fromCache": false
    }
  }
  ```

#### POST /api/daily-meal-plans/generate-stream

- **Auth:** Required
- **Rate Limit:** Daily Meal Plans (20 per 1 minute)
- **Description:** Generate a 1-day meal plan (Server-Sent Events stream).
- **Request Body:** Same as `POST /api/daily-meal-plans/generate`
- **Response:** `text/event-stream` returning Server-Sent Events in the format:
  ```
  data: {"type": "chunk", "content": "..."}
  
  data: {"type": "done", "plan": {...}}
  
  data: {"type": "error", "message": "..."}
  ```

#### POST /api/daily-meal-plans/regenerate-category

- **Auth:** Required
- **Rate Limit:** Daily Meal Plans (20 per 1 minute)
- **Description:** Regenerate a specific meal category in the current meal plan.
- **Request Body:**
  ```json
  {
    "date": "2026-05-31",
    "mealType": "lunch"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... }
    }
  }
  ```

#### POST /api/daily-meal-plans/regenerate-category-stream

- **Auth:** Required
- **Rate Limit:** Daily Meal Plans (20 per 1 minute)
- **Description:** Regenerate a specific meal category in the current meal plan (Server-Sent Events stream).
- **Request Body:** Same as `POST /api/daily-meal-plans/regenerate-category`
- **Response:** `text/event-stream` returning Server-Sent Events in the format:
  ```
  data: {"type": "chunk", "content": "..."}
  
  data: {"type": "done", "plan": {...}}
  
  data: {"type": "error", "message": "..."}
  ```

#### POST /api/daily-meal-plans/log

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Log all or specific meal items from the daily meal plan to the food log.
- **Request Body:**
  ```json
  {
    "date": "2026-05-31",
    "mealType": "lunch"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "logged": 3,
      "items": [ ... ]
    }
  }
  ```

#### POST /api/daily-meal-plans/toggle-item

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Toggle the logged status of a specific meal item.
- **Request Body:**
  ```json
  {
    "date": "2026-05-31",
    "mealType": "lunch",
    "itemIndex": 0
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "item": { ... },
      "logged": true
    }
  }
  ```

---

### 9. Progress — `/api/progress`

All progress endpoints require authentication. Rate limit: Progress (50 per 15 minutes).

#### POST /api/progress/weight

- **Auth:** Required
- **Rate Limit:** Progress
- **Description:** Log or update a weight entry for a specific date. Updates the user's profile weight too.
- **Request Body:**
  ```json
  {
    "weightKg": 70.5,
    "loggedDate": "2026-05-28",
    "notes": "Morning weigh-in"
  }
  ```
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "entry": {
        "id": "uuid",
        "weight_kg": 70.5,
        "logged_date": "2026-05-28",
        "notes": "Morning weigh-in"
      }
    }
  }
  ```

#### GET /api/progress/weight

- **Auth:** Required
- **Rate Limit:** Progress
- **Description:** Retrieve weight history entries sorted by date descending.
- **Query Parameters:**
  - `limit` (optional): Maximum entries to return. Defaults to 50.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "entries": [ ... ]
    }
  }
  ```

#### DELETE /api/progress/weight/:id

- **Auth:** Required
- **Rate Limit:** Progress
- **Description:** Delete a specific weight log entry.
- **Path Parameters:**
  - `id`: UUID of the entry.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "deleted": true
    }
  }
  ```

---

### 10. Activity Plans (LLM) — `/api/activity-plans`

All daily activity recommendation plan endpoints require authentication. Rate limit: Activity Plans (50 per 15 minutes).

#### GET /api/activity-plans

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Retrieve the daily activity recommendation plan for a date.
- **Query Parameters:**
  - `date` (optional): Format `YYYY-MM-DD`. Defaults to today.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": {
        "date": "2026-05-31",
        "activities": [
          {
            "activity_id": 1,
            "activity_name": "Brisk Walking",
            "duration_min": 30,
            "intensity": "moderate",
            "calories_burned": 165,
            "logged": false
          }
        ]
      },
      "fromCache": true
    }
  }
  ```

#### POST /api/activity-plans/generate

- **Auth:** Required
- **Rate Limit:** Activity Plans (50 per 15 minutes)
- **Description:** Generate daily activity recommendations.
- **Request Body:**
  ```json
  {
    "date": "2026-05-31"
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... },
      "fromCache": false
    }
  }
  ```

#### POST /api/activity-plans/log

- **Auth:** Required
- **Rate Limit:** Global
- **Description:** Batch-log selected activities from the daily plan to logs.
- **Request Body:**
  ```json
  {
    "date": "2026-05-31",
    "activityIndexes": [0]
  }
  ```
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "logged": 1,
      "activities": [ ... ]
    }
  }
  ```
