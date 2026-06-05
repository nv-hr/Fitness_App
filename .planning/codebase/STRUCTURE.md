<!-- refreshed: 2026-06-02 -->
# Codebase Structure

**Analysis Date:** 2026-06-02

## Directory Layout

```
fitness-app/
│
├── backend/                          # Express 5 API server (ESM)
│   ├── src/
│   │   ├── app.js                    # Express app setup — middleware chain, route mounting, error handling
│   │   ├── server.js                 # Server entry — loads .env, starts listening, DB connection check
│   │   │
│   │   ├── config/                   # Service initialization and configuration
│   │   │   ├── database.js           # pg Pool creation (Supabase PostgreSQL)
│   │   │   └── passport.js           # Passport strategies (Google OAuth 2.0)
│   │   │
│   │   ├── routes/                   # Express Router definitions (9 modules)
│   │   │   ├── auth.routes.js        # POST register/login/logout, GET me
│   │   │   ├── profile.routes.js     # POST/GET/PUT profile
│   │   │   ├── food.routes.js        # GET search, POST create/log, GET summary/logs/history/recent
│   │   │   ├── activity.routes.js    # GET activities/logs/history/summary, POST log, DELETE log/:id
│   │   │   ├── weeklyPlan.routes.js  # GET plan, POST generate/regenerate-day/swap/toggle-complete
│   │   │   ├── dailyMealPlan.routes.js  # GET plan, POST generate/log/toggle-item/regenerate-category
│   │   │   ├── activityPlan.routes.js   # GET plan, POST generate/log-activities
│   │   │   ├── progress.routes.js    # POST/GET weight, DELETE weight/:id
│   │   │   └── docs.routes.js        # GET API documentation JSON
│   │   │
│   │   ├── controllers/              # Request handlers (8 modules)
│   │   │   ├── auth.controller.js    # register, login, logout, getMe, googleCallback
│   │   │   ├── profile.controller.js # createProfile, getProfile, updateProfile
│   │   │   ├── food.controller.js    # searchFoods, createCustomFood, logFood, getDailySummary, getDailyLogs, getLogHistory, getRecentFoods
│   │   │   ├── activity.controller.js # getAllActivities, logActivity, getActivityLogs, getActivityHistory, deleteActivityLog, getActivitySummary
│   │   │   ├── weeklyPlan.controller.js  # get, generate, regenerateDay, swap, toggleComplete
│   │   │   ├── dailyMealPlan.controller.js  # get, generate, logMeals, toggleItemLogged, regenerateCategory
│   │   │   ├── activityPlan.controller.js   # get, generate, logActivities
│   │   │   └── weightLog.controller.js  # postWeight, getWeightHistory, deleteWeight
│   │   │
│   │   ├── services/                 # Business logic (9 modules)
│   │   │   ├── auth.service.js       # Registration, login, google OAuth, JWT token generation
│   │   │   ├── profile.service.js    # BMI calculation, TDEE calculation (Mifflin-St Jeor), goal-adjusted calorie targets
│   │   │   ├── food.service.js       # Food validation, calorie calculation, custom food validation
│   │   │   ├── activity.service.js   # Goal-filtered activity selection
│   │   │   ├── activityLog.service.js  # Activity log validation, calorie burn calculation, net calorie calculation
│   │   │   ├── weightLog.service.js  # Weight entry validation, upsert, history
│   │   │   ├── llm.service.js        # LLM orchestration — OpenRouter client, prompt building, plan validation, fuzzy matching, cache management, per-user mutex locks
│   │   │   ├── activityPlan.service.js   # Activity plan generation via LLM, structure validation, fallback plans
│   │   │   ├── mealPlan.service.js       # Meal plan prompt building and LLM orchestration
│   │   │   └── dailyMealPlan.service.js  # Daily meal plan LLM generation, structure validation, fuzzy food matching
│   │   │
│   │   ├── repositories/             # Database access — raw SQL via pg Pool (9 modules)
│   │   │   ├── user.repository.js          # create, findByEmail, findById, findByGoogleId, updatePdpConsent
│   │   │   ├── profile.repository.js       # create, findByUserId, updateWeightKg, updateByUserId
│   │   │   ├── food.repository.js          # searchFoods, createCustomFood, createFoodLog, getDailyTotal, getDailyLogs, getLogHistory, getRecentFoods, batchLogItems, getFoodById, getFoodsByCategory, deleteFoodLogByPlan
│   │   │   ├── activity.repository.js      # getRandomActivities, getAllActivities, getActivityById, createActivityLog, getActivityLogsByDate, getActivityHistory, getActivityHistoryWithEntries, getDailyActivityTotal, deleteActivityLog, getActivityLogById, batchLogActivities, upsertActivityLogFromPlan, deleteActivityLogByPlan, getTopActivities
│   │   │   ├── weeklyPlan.repository.js    # findByUserAndWeek, upsertPlan
│   │   │   ├── dailyMealPlan.repository.js # findByUserAndDate, upsertPlan, markItemLogged, markMealsLogged
│   │   │   ├── activityPlan.repository.js  # findByUserAndDate, upsertPlan, markActivitiesLogged
│   │   │   ├── weightLog.repository.js     # upsertWeightLog, findByUserId, findByUserIdWithLimit, deleteById
│   │   │   └── mealPlan.repository.js      # findByUserAndWeek, upsertPlan
│   │   │
│   │   ├── middlewares/              # Express middleware (4 modules)
│   │   │   ├── auth.middleware.js        # JWT verification from httpOnly cookie
│   │   │   ├── weeklyPlanRateLimiter.js  # Per-endpoint rate limiters for weekly plans (generate, regenerate-day, swap, toggle-complete)
│   │   │   ├── dailyMealPlanRateLimiter.js  # Rate limiter for daily meal plan generation
│   │   │   └── activityPlanRateLimiter.js   # Rate limiter for activity plan generation
│   │   │
│   │   └── utils/                    # Shared helpers (5 modules)
│   │       ├── response.js           # successResponse, errorResponse — standardized API response format
│   │       ├── errors.js             # AppError, ValidationError, AuthenticationError, NotFoundError class hierarchy
│   │       ├── dbErrors.js           # PostgreSQL error code normalization
│   │       ├── string.js             # getMonday, levenshteinDistance
│   │       └── food.js               # fuzzyMatchFoodName, recalculateDayCalories
│   │
│   ├── prompts/                      # LLM prompt templates (Markdown + {{variable}} placeholders)
│   │   ├── system-prompt.md          # Daily activity plan prompt
│   │   ├── weekly-plan-prompt.md     # Weekly activity plan prompt
│   │   ├── meal-plan-prompt.md       # Meal plan prompt
│   │   ├── daily-meal-plan-prompt.md # Daily meal plan prompt
│   │   ├── correction-prompt.md      # Plan validation correction prompt
│   │   ├── meal-correction-prompt.md # Meal plan correction prompt
│   │   └── activity-swap-prompt.md   # Activity swap replacement prompt
│   │
│   ├── tests/                        # Jest test suites
│   │   ├── unit/
│   │   │   └── llm.service.test.js
│   │   └── integration/
│   │       ├── helpers.js
│   │       └── remaining-endpoints.test.js
│   │
│   ├── docs/
│   │   ├── API.md                    # Full REST API documentation
│   │   └── Fitness_App_API.postman_collection.json  # Postman collection
│   │
│   ├── package.json                  # Backend dependencies (ESM, type: "module")
│   └── jest.setup.js                 # Jest test setup
│
├── frontend/                         # React 19 SPA + Vite 8
│   ├── src/
│   │   ├── main.jsx                  # React DOM mount — entry point
│   │   ├── index.css                 # Global styles — Tailwind CSS v4, custom fonts, theme tokens
│   │   │
│   │   ├── app/                      # Application shell
│   │   │   ├── App.jsx               # Root component — Providers + Router
│   │   │   ├── Providers.jsx         # TanStack Query client + AuthProvider wrapper
│   │   │   └── Router.jsx            # BrowserRouter, route definitions, ResponsiveLayout, ProtectedRoute, PublicRoute, ProfileGuard
│   │   │
│   │   ├── features/                 # Feature modules (5 features)
│   │   │   ├── auth/                 # Authentication feature
│   │   │   │   ├── hooks/useAuth.jsx      # AuthContext + Provider + useAuth hook
│   │   │   │   ├── components/LoginForm.jsx    # Login form with Zod validation
│   │   │   │   ├── components/RegisterForm.jsx # Registration form with Zod validation
│   │   │   │   ├── api/authApi.js            # API functions: register, login, logout, getMe
│   │   │   │   └── index.js                  # Barrel file: re-exports
│   │   │   │
│   │   │   ├── profile/              # Profile & biometrics feature
│   │   │   │   ├── components/ProfileForm.jsx  # Full profile creation/editing form
│   │   │   │   ├── components/BmiResult.jsx     # BMI display component
│   │   │   │   ├── components/TdeeResult.jsx    # TDEE display component
│   │   │   │   ├── api/profileApi.js            # API: create, get, update profile
│   │   │   │   └── index.js                    # Barrel file
│   │   │   │
│   │   │   ├── food-log/             # Food logging & calorie tracking feature
│   │   │   │   ├── hooks/useMonthMealData.js    # Monthly meal data hook
│   │   │   │   ├── components/FoodLogPage.jsx    # Main food log page
│   │   │   │   ├── components/FoodLogForm.jsx    # Food entry form
│   │   │   │   ├── components/FoodSearch.jsx     # Food search with autocomplete
│   │   │   │   ├── components/FoodLogTable.jsx   # Logged foods table
│   │   │   │   ├── components/CalorieSummary.jsx # Daily calorie summary card
│   │   │   │   ├── components/CalorieHistory.jsx # Historical calorie chart
│   │   │   │   ├── components/CustomFoodForm.jsx # Custom food creation form
│   │   │   │   ├── components/MealCalendarSection.jsx  # Monthly meal calendar
│   │   │   │   ├── components/previewCalories.js # Calorie preview utility
│   │   │   │   ├── api/foodLogApi.js             # API: search, log, create custom food
│   │   │   │   ├── api/dailyMealPlanApi.js       # API: daily meal plans
│   │   │   │   └── index.js                     # Barrel file
│   │   │   │
│   │   │   ├── activities/            # Activity logging & workout tracking feature
│   │   │   │   ├── ActivityPage.jsx            # Main activity page
│   │   │   │   ├── components/ActivityLogForm.jsx      # Manual activity log form
│   │   │   │   ├── components/ActivityHistory.jsx      # Activity history view
│   │   │   │   ├── components/ActivitySummary.jsx      # Daily activity summary
│   │   │   │   ├── components/ActivityPool.jsx         # Available activities browser
│   │   │   │   ├── components/ActivityCalendarSection.jsx  # Monthly activity calendar
│   │   │   │   ├── components/ActivityLogSection.jsx      # Activity log section
│   │   │   │   ├── components/ActivityCard.jsx           # Individual activity card
│   │   │   │   ├── components/DayActivityRow.jsx         # Day activity row
│   │   │   │   ├── components/previewCalories.js         # Calorie preview utility
│   │   │   │   ├── api/activityApi.js              # API: activities CRUD
│   │   │   │   ├── api/activityPlanApi.js          # API: activity plans
│   │   │   │   ├── api/activityCalendarApi.js      # API: activity calendar
│   │   │   │   └── index.js                       # Barrel file
│   │   │   │
│   │   │   └── progress/             # Weight tracking & progress feature
│   │   │       ├── hooks/useTrendPrediction.js       # OLS linear regression for goal prediction
│   │   │       ├── components/ProgressPage.jsx       # Main progress dashboard
│   │   │       ├── components/WeightEntryCard.jsx    # Weight log form
│   │   │       ├── components/WeightHistoryTable.jsx # Weight history table
│   │   │       ├── components/WeightTrendChart.jsx   # Recharts line chart
│   │   │       ├── components/TrendPredictionCard.jsx  # Goal target prediction
│   │   │       ├── api/weightApi.js                  # API: weight CRUD
│   │   │       └── index.js                         # Barrel file
│   │   │
│   │   └── shared/                   # Shared utilities and components
│   │       ├── lib/http.js           # apiFetch, apiGet, apiPost, apiDelete — base HTTP client
│   │       ├── hooks/useResponsive.js # Responsive design hook (mobile/desktop detection)
│   │       └── calendar/             # Reusable calendar component system
│   │           ├── CalendarGrid.jsx        # Month grid component
│   │           ├── CalendarPageLayout.jsx  # Calendar page container
│   │           ├── MonthNav.jsx            # Month navigation
│   │           ├── DayDetailPanel.jsx      # Day detail overlay
│   │           ├── calendarUtils.js        # Calendar date utilities
│   │           ├── hooks/useMonthData.js   # Month data fetching hook
│   │           ├── index.js               # Calendar barrel file
│   │           └── __tests__/             # Calendar component tests
│   │
│   ├── vite.config.js                 # Vite config — plugins, dev proxy (/api → :3001)
│   └── package.json                   # Frontend dependencies
│
├── scripts/                           # Utility scripts
│   ├── start-all.sh                   # Dev startup script
│   ├── db-init.js                     # Database initialization (schema + seed)
│   └── remove_postman_folder.js       # Cleanup script
│
├── package.json                       # Root workspace config (npm workspaces)
├── tsconfig.json                      # TypeScript config (type checking only, no emit)
├── .gitignore                         # Git ignore rules
├── .dockerignore                      # Docker ignore rules
├── .env.example                       # Environment variable template
├── .env                               # Environment variables (not committed)
├── metadata.json                      # Project metadata
└── README.md                          # Project documentation
```

## Directory Purposes

**`backend/` — Express 5 API Server:**
- Purpose: REST API backend with Postgres persistence, LLM-powered plan generation, and JWT auth
- Contains: Express app, controllers, services, repositories, middleware, config, utils, prompt templates
- Key files: `backend/src/app.js` (middleware chain), `backend/src/server.js` (entry point), `backend/src/services/llm.service.js` (LLM orchestration)

**`backend/src/` — Application Source:**
- Purpose: All application source code organized in a 4-layer pattern
- Contains: config, controllers, middlewares, repositories, routes, services, utils

**`backend/prompts/` — LLM Prompt Templates:**
- Purpose: Static markdown templates with `{{variable}}` placeholders for LLM interactions
- Contains: 7 prompt files covering weekly plans, daily plans, meal plans, corrections, activity swaps

**`backend/tests/` — Backend Test Suites:**
- Purpose: Jest tests for unit and integration testing
- Contains: Unit tests in `tests/unit/`, Integration tests in `tests/integration/`

**`frontend/` — React 19 SPA:**
- Purpose: Single-page application with Vite 8 build tooling
- Contains: React components organized by feature, shared utilities, Tailwind CSS v4 styles

**`frontend/src/app/` — Application Shell:**
- Purpose: Root component setup — providers, routing, layout
- Contains: App.jsx, Providers.jsx, Router.jsx (includes all route definitions, responsive layout, protected/public route guards, dashboard placeholder)

**`frontend/src/features/` — Feature Modules:**
- Purpose: Self-contained feature modules with colocated API, hooks, components
- Contains: 5 features — auth, profile, food-log, activities, progress
- Pattern: Each feature has `index.js` (barrel), `api/` (API functions), `components/` (React components), `hooks/` (React hooks)

**`frontend/src/shared/` — Shared Code:**
- Purpose: Cross-feature reusable code
- Contains: HTTP client (`lib/http.js`), responsive hook (`hooks/useResponsive.js`), calendar component system (`calendar/`)

**`scripts/` — Utility Scripts:**
- Purpose: Database initialization, dev startup, cleanup
- Contains: `db-init.js`, `start-all.sh`, `remove_postman_folder.js`

## Naming Conventions

**Files:**
- Backend JS files: `snake-case.name.js` — e.g., `auth.service.js`, `user.repository.js`, `activity.routes.js`, `auth.middleware.js`
- Frontend JSX files: `PascalCase.jsx` — e.g., `LoginForm.jsx`, `ProfileForm.jsx`, `WeightTrendChart.jsx`
- Frontend non-component JS files: `camelCase.js` — e.g., `authApi.js`, `http.js`, `calendarUtils.js`
- SQL files: `snake_case.sql` — e.g., `schema.sql`, `seed.sql`
- Prompt templates: `kebab-case.md` — e.g., `weekly-plan-prompt.md`, `daily-meal-plan-prompt.md`
- Test files: `*.test.js` or `*.test.jsx` — colocated in `__tests__/` or `tests/`

**Functions:**
- Backend: `camelCase` for all functions — e.g., `findByEmail()`, `generateWeeklyPlan()`, `calculateBmi()`
- Frontend: `camelCase` for functions, `PascalCase` for React components
- Express handlers: `async (req, res, next) =>` pattern

**Variables:**
- JavaScript: `camelCase` throughout — e.g., `isMatch`, `hashedPassword`, `calorieTarget`
- SQL parameters: lowercase with snake_case — e.g., `$1, $2` in queries
- Database columns: `snake_case` — e.g., `password_hash`, `fitness_goal`, `pdp_consent`
- Database-to-JS conversion: snake_case DB column names are used as-is in responses (see `profile.controller.js` returning `fitness_goal`, `calorie_rate`)

**Types:**
- No TypeScript — all JS files with JSDoc comments for parameter and return type documentation
- JSDoc `@param {Object} params` and `@returns {Promise<Object>}` patterns used in services and repositories

**Directories:**
- `kebab-case` for directories — e.g., `food-log/`, `daily-meal-plans/`, `weekly-plan/`, `__tests__/`
- Backend source directories: `config/`, `controllers/`, `middlewares/`, `repositories/`, `routes/`, `services/`, `utils/`
- Frontend feature directories: lowercase with hyphen — `food-log/`, `activities/`, `progress/`

**Exports:**
- Backend modules use `export default {...}` for composite controller/service exports, or `export async function` for individual functions
- Frontend features use default exports for components and named exports for hooks/utilities
- Barrel files (`index.js`) consolidate public API of each feature

**Constants:**
- `SCREAMING_SNAKE_CASE` for environment variables and configuration constants — e.g., `JWT_SECRET`, `OPENROUTER_API_KEY`, `VALID_CATEGORIES`, `VALID_MEAL_TYPES`
- `CONFIG` object pattern used in `llm.service.js:37-44` for grouped configuration

## Where to Add New Code

**New API Endpoint:**
1. Add route definition in `backend/src/routes/<domain>.routes.js`
2. Add controller handler in `backend/src/controllers/<domain>.controller.js`
3. Add business logic in `backend/src/services/<domain>.service.js`
4. Add database query in `backend/src/repositories/<domain>.repository.js`
5. Add rate limiter in `backend/src/middlewares/` if needed
6. Mount route in `backend/src/app.js`
7. Add tests in `backend/tests/`

**New Frontend Feature:**
1. Create directory `frontend/src/features/<feature-name>/`
2. Add `index.js` barrel file
3. Create `api/<feature>Api.js` with API functions
4. Create `components/` with React components
5. Create `hooks/` with any custom hooks
6. Add route in `frontend/src/app/Router.jsx`
7. Add tests in `__tests__/` directories

**New LLM Prompt:**
1. Add markdown template file in `backend/prompts/<prompt-name>.md`
2. Use `{{variableName}}` placeholders for dynamic content
3. Reference from `backend/src/services/llm.service.js` using `buildPrompt('<prompt-name>.md', variables)`

**New Shared Component:**
1. Add component in `frontend/src/shared/<module>/`
2. Export from `frontend/src/shared/<module>/index.js`
3. Import via path alias or relative import

## Test File Organization

**Backend Tests:**
- Unit tests: `backend/tests/unit/*.test.js`
- Integration tests: `backend/tests/integration/*.test.js`
- Co-located tests: `backend/src/__tests__/food.utils.test.js`
- Test setup: `backend/jest.setup.js`

**Frontend Tests:**
- Co-located in `__tests__/` directories within each module:
  - `frontend/src/shared/calendar/__tests__/`
  - `frontend/src/features/weekly-plan/components/__tests__/`
  - `frontend/src/features/progress/components/__tests__/`
  - `frontend/src/features/food-log/components/__tests__/`
  - `frontend/src/features/activities/components/__tests__/`

**Integration Tests:**
- `frontend/src/__tests__/api-integration.test.js` — Frontend-to-backend API integration

## Special Directories

**`backend/prompts/`:**
- Purpose: LLM system prompt templates
- Generated: No — manually authored
- Committed: Yes
- Format: Markdown with `{{variable}}` interpolation placeholders
- Used by: `llm.service.js` which caches parsed prompts in a Map and substitutes variables at runtime

**`node_modules/`:**
- Purpose: npm dependencies for npm workspaces
- Generated: Yes (`npm install`)
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: GSD workflow planning artifacts
- Generated: Yes (by GSD tools)
- Committed: Yes
- Contains: PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, milestones/, codebase/ (architecture docs)

---

*Structure analysis: 2026-06-02*
