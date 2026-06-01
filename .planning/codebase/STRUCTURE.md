# Codebase Structure

**Analysis Date:** 2026-06-02

## Directory Layout

```
fitness-app/
├── backend/                         # Express.js REST API server
│   ├── src/                         # Source code (some files missing from working tree, in git)
│   │   ├── app.js                   # Express app setup & middleware stack
│   │   ├── server.js                # Entry point, starts HTTP server
│   │   ├── config/
│   │   │   ├── database.js          # pg Pool configuration
│   │   │   └── passport.js          # Passport strategies (local, Google OAuth)
│   │   ├── controllers/             # Request handlers (validation + orchestration)
│   │   │   ├── auth.controller.js
│   │   │   ├── activity.controller.js
│   │   │   ├── dailyMealPlan.controller.js
│   │   │   ├── food.controller.js
│   │   │   ├── profile.controller.js
│   │   │   ├── weeklyPlan.controller.js
│   │   │   ├── weightLog.controller.js
│   │   │   └── activityPlan.controller.js
│   │   ├── middlewares/             # Auth & rate-limiting middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── dailyMealPlanRateLimiter.js
│   │   │   ├── weeklyPlanRateLimiter.js
│   │   │   └── activityPlanRateLimiter.js
│   │   ├── routes/                  # HTTP path → controller mapping
│   │   │   ├── auth.routes.js
│   │   │   ├── activity.routes.js
│   │   │   ├── dailyMealPlan.routes.js
│   │   │   ├── food.routes.js
│   │   │   ├── profile.routes.js
│   │   │   ├── weeklyPlan.routes.js
│   │   │   ├── progress.routes.js
│   │   │   ├── activityPlan.routes.js
│   │   │   └── docs.routes.js
│   │   ├── services/                # Business logic layer
│   │   │   ├── auth.service.js
│   │   │   ├── llm.service.js       # OpenRouter integration + plan caching
│   │   │   ├── dailyMealPlan.service.js
│   │   │   ├── profile.service.js
│   │   │   ├── activity.service.js
│   │   │   ├── activityLog.service.js
│   │   │   ├── food.service.js
│   │   │   ├── mealPlan.service.js
│   │   │   ├── weightLog.service.js
│   │   │   └── activityPlan.service.js
│   │   ├── repositories/            # Data access (raw SQL via pg)
│   │   │   ├── user.repository.js
│   │   │   ├── food.repository.js
│   │   │   ├── profile.repository.js
│   │   │   ├── activity.repository.js
│   │   │   ├── weeklyPlan.repository.js
│   │   │   ├── dailyMealPlan.repository.js
│   │   │   ├── weightLog.repository.js
│   │   │   ├── mealPlan.repository.js
│   │   │   └── activityPlan.repository.js
│   │   └── utils/                   # Shared helpers
│   │       ├── response.js          # successResponse / errorResponse
│   │       ├── errors.js            # AppError, ValidationError, etc.
│   │       ├── string.js            # String utilities (e.g., levenshteinDistance)
│   │       ├── dbErrors.js          # Database error mapping
│   │       └── food.js              # Food-related utilities
│   ├── prompts/                     # LLM prompt templates (Markdown)
│   │   ├── system-prompt.md
│   │   ├── weekly-plan-prompt.md
│   │   ├── correction-prompt.md
│   │   ├── activity-swap-prompt.md
│   │   └── daily-meal-plan-prompt.md
│   ├── db/                          # SQL migrations & seed data
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   ├── init.sql
│   │   ├── add_*.sql               # Migration scripts for incremental schema changes
│   │   └── run_migration.js
│   ├── scripts/                     # Utility scripts (smoke tests, DB verification)
│   ├── tests/                       # Automated tests
│   │   ├── unit/                    # Unit tests (llm.service, auth.service, etc.)
│   │   └── integration/             # Integration tests (API endpoints, helpers)
│   ├── docs/                        # API documentation & Postman collection
│   │   ├── API.md
│   │   └── Fitness_App_API.postman_collection.json
│   └── package.json
│
├── frontend/                        # React SPA (Vite + TailwindCSS)
│   ├── src/
│   │   ├── main.jsx                 # Entry point (DOM mount)
│   │   ├── index.css                # Global styles + Tailwind imports
│   │   ├── app/                     # Application shell
│   │   │   ├── App.jsx              # Root component (Providers + Router)
│   │   │   ├── Providers.jsx        # React Query + Auth providers
│   │   │   └── Router.jsx           # Client routing, layout, guards
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/                # Login, register, auth API, useAuth hook
│   │   │   │   ├── api/authApi.js
│   │   │   │   ├── hooks/useAuth.jsx
│   │   │   │   ├── components/LoginForm.jsx
│   │   │   │   ├── components/RegisterForm.jsx
│   │   │   │   └── index.js
│   │   │   ├── activities/          # Activity tracking + AI workout plans
│   │   │   │   ├── ActivityPage.jsx
│   │   │   │   ├── api/activityApi.js
│   │   │   │   ├── api/activityCalendarApi.js
│   │   │   │   ├── api/activityPlanApi.js
│   │   │   │   ├── components/ (many)
│   │   │   │   └── index.js
│   │   │   ├── food-log/            # Food logging + daily meal plans
│   │   │   │   ├── api/foodLogApi.js
│   │   │   │   ├── api/dailyMealPlanApi.js
│   │   │   │   ├── components/ (many)
│   │   │   │   └── index.js
│   │   │   ├── profile/             # User profile, BMI, TDEE
│   │   │   │   ├── api/profileApi.js
│   │   │   │   ├── components/ProfileForm.jsx
│   │   │   │   ├── components/BmiResult.jsx
│   │   │   │   ├── components/TdeeResult.jsx
│   │   │   │   └── index.js
│   │   │   ├── progress/            # Weight tracking + trends
│   │   │   │   ├── api/weightApi.js
│   │   │   │   ├── components/ProgressPage.jsx
│   │   │   │   ├── components/WeightTrendChart.jsx
│   │   │   │   ├── components/TrendPredictionCard.jsx
│   │   │   │   ├── hooks/useTrendPrediction.js
│   │   │   │   └── index.js
│   │   │   └── weekly-plan/         # Weekly plan UI components
│   │   │       ├── api/weeklyPlanApi.js
│   │   │       └── components/
│   │   ├── shared/                  # Shared/reusable modules
│   │   │   ├── lib/http.js          # HTTP client (fetch wrapper)
│   │   │   ├── hooks/useResponsive.js
│   │   │   └── calendar/            # Calendar UI kit
│   │   │       ├── CalendarGrid.jsx
│   │   │       ├── CalendarPageLayout.jsx
│   │   │       ├── DayDetailPanel.jsx
│   │   │       ├── MonthNav.jsx
│   │   │       ├── calendarUtils.js
│   │   │       └── hooks/useMonthData.js
│   │   └── __tests__/               # Frontend API integration tests
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── vitest.setup.js
│   └── package.json
│
├── scripts/                         # Root-level utility scripts
│   ├── start-all.sh
│   ├── start-dev.ps1
│   ├── db-init.js
│   ├── db-inspect.js
│   └── verify-supabase-connection.js
│
├── assets/                          # Design assets (AI Studio config)
│   └── .aistudio/
├── supabase/                        # Supabase local config
│   └── config.toml
├── .env.example                     # Environment variable template
├── metadata.json                    # KalaFit app metadata
├── .dockerignore
├── package.json                     # Root workspace config
├── tsconfig.json                    # TypeScript config (for linting only)
├── AGENTS.md                        # OpenCode agent configuration
├── README.md
└── LICENSE
```

## Directory Purposes

**`backend/src/`:**
- Purpose: All backend application source code
- Contains: Express.js server entry, middleware, routes, controllers, services, repositories, utilities
- Key files: `server.js` (entry), `app.js` (app config), `services/llm.service.js` (LLM orchestration)

**`backend/src/routes/`:**
- Purpose: Express Router definitions (HTTP path → controller mapping + middleware binding)
- Contains: One route file per API resource
- Key files: `activity.routes.js`, `dailyMealPlan.routes.js`
- Pattern: `router.use(authenticateToken)` then `.get('/path', ctrl.handler)`

**`backend/src/controllers/`:**
- Purpose: Request handling — input validation, service orchestration, response formatting
- Contains: One controller file per resource (exported as object of handler functions)
- Key files: `auth.controller.js`, `activity.controller.js`, `dailyMealPlan.controller.js`

**`backend/src/services/`:**
- Purpose: Business logic layer — all domain logic lives here
- Contains: Auth, LLM integration, activity, food, profile, weight log services
- Key files: `llm.service.js` (782 lines — largest file, OpenRouter client + plan generation + validation + caching + swap logic)

**`backend/src/repositories/`:**
- Purpose: Data access — raw SQL queries using `pg.Pool`
- Contains: One repository per DB table/domain with CRUD functions
- Pattern: Named exports per SQL operation (e.g., `findByEmail`, `create`, `getActivityLogsByDate`)

**`backend/prompts/`:**
- Purpose: LLM prompt templates in Markdown with `{{variable}}` placeholders
- Contains: System prompt, weekly plan prompt, correction prompt, activity swap prompt, daily meal plan prompt
- Used by: `llm.service.js` via `buildPrompt(filename, variables)`

**`backend/tests/`:**
- Purpose: Unit and integration tests using Jest + supertest
- Contains: Unit tests in `tests/unit/`, integration tests in `tests/integration/`
- Config: Jest configured in `backend/package.json` with `jest.setup.js`

**`frontend/src/app/`:**
- Purpose: Application shell — providers, routing, global layout, navigation
- Contains: Root component (`App.jsx`), providers (`Providers.jsx`), router + layout + dashboard (`Router.jsx`)

**`frontend/src/features/`:**
- Purpose: Feature-sliced modules, each containing `api/`, `components/`, and optional `hooks/` directories
- Contains: Five feature modules (auth, activities, food-log, profile, progress) plus weekly-plan
- Pattern: Feature module re-exports its main page component via `index.js` barrel file

**`frontend/src/shared/`:**
- Purpose: Reusable utilities, HTTP client, calendar UI components, hooks
- Contains: `lib/http.js`, `calendar/` (full calendar UI kit with grid, layout, navigation, day detail), `hooks/`
- Used by: Multiple feature modules

## Key File Locations

**Entry Points:**
- `backend/src/server.js`: Backend HTTP server entry (listens on port 3001)
- `frontend/src/main.jsx`: Frontend React DOM mount point
- `frontend/src/app/App.jsx`: React root component
- `package.json` (root): Monorepo workspace orchestration, `npm run dev` starts both

**Configuration:**
- `backend/src/config/database.js`: PostgreSQL pool configuration (SSL, connection string)
- `backend/src/config/passport.js`: Passport.js strategies (local + Google OAuth)
- `frontend/vite.config.js`: Vite config (plugins, proxy, optimization)
- `.env.example`: Required environment variables template
- `tsconfig.json`: TypeScript config (noEmit, for linting only)
- `supabase/config.toml`: Supabase local development config

**Core Logic:**
- `backend/src/app.js`: Express app setup — 212 lines, all middleware/route mounting
- `backend/src/services/llm.service.js`: LLM orchestration — 782 lines, the project's most complex module
- `backend/src/services/auth.service.js`: User auth business logic — registration, login, JWT generation
- `backend/src/services/dailyMealPlan.service.js`: Daily meal plan generation — 328 lines
- `frontend/src/app/Router.jsx`: Client routing, auth guards, layout, dashboard — 374 lines
- `frontend/src/features/activities/ActivityPage.jsx`: Activity tracker top-level page

**Testing:**
- `backend/tests/unit/llm.service.test.js`: LLM service unit tests
- `backend/tests/integration/remaining-endpoints.test.js`: Integration tests for endpoints
- `frontend/src/features/activities/components/__tests__/`: Activity component tests
- `frontend/src/features/progress/components/__tests__/`: Progress component tests
- `frontend/src/features/progress/hooks/__tests__/useTrendPrediction.test.js`: Hook test

## Naming Conventions

**Files:**
- `kebab-case` for backend source files: `auth.controller.js`, `activity.routes.js`, `dailyMealPlanRateLimiter.js`, `llm.service.js`
- `PascalCase.jsx` for React components: `LoginForm.jsx`, `ActivityCard.jsx`, `FoodLogPage.jsx`, `TrendPredictionCard.jsx`
- `camelCase.js` for non-component modules: `authApi.js`, `activityApi.js`, `dailyMealPlanApi.js`, `previewCalories.js`, `http.js`
- `snake_case.sql` for database files: `schema.sql`, `seed.sql`, `add_weight_logs.sql`
- `kebab-case.md` for prompt templates: `system-prompt.md`, `weekly-plan-prompt.md`, `activity-swap-prompt.md`
- `UPPERCASE.md` for codebase map documents: `ARCHITECTURE.md`, `STRUCTURE.md`

**Directories:**
- `lowercase/` for all directories
- `kebab-case/` for most directories: `food-log/`, `weekly-plan/`, `daily-meal-plans/`
- Feature directories use singular names: `auth/`, `activities/`, `profile/`, `progress/`

**Functions:**
- `camelCase` for all functions and methods: `getAllActivitiesHandler`, `logActivity`, `validatePlanStructure`, `setCachedPlan`
- Named exports preferred over default exports for utility functions

**Classes:**
- `PascalCase` for error classes: `AppError`, `ValidationError`, `AuthenticationError`, `NotFoundError`

**Database:**
- `snake_case` for column names: `password_hash`, `logged_date`, `calories_burned`, `portion_grams`, `fitness_goal`

## Where to Add New Code

**New API Endpoint:**
1. Add route in `backend/src/routes/` (e.g., `newFeature.routes.js`)
2. Add controller in `backend/src/controllers/` (e.g., `newFeature.controller.js`)
3. Add service logic in `backend/src/services/` (e.g., `newFeature.service.js`)
4. Add repository queries in `backend/src/repositories/` (e.g., `newFeature.repository.js`)
5. Mount route in `backend/src/app.js` with `app.use('/api/new-feature', newFeatureRoutes)`
6. Add rate limiter middleware if needed in `backend/src/middlewares/`
7. Add tests in `backend/tests/unit/` and/or `backend/tests/integration/`

**New Frontend Page/Feature:**
1. Create directory `frontend/src/features/new-feature/`
2. Create `api/newFeatureApi.js` with API call functions
3. Create `components/NewFeaturePage.jsx` as main page component
4. Create `index.js` barrel file re-exporting the page component
5. Add route in `frontend/src/app/Router.jsx`
6. Add navigation entry in the `navItems` array in `Router.jsx`
7. Add tests in `frontend/src/features/new-feature/components/__tests__/`

**New Shared Component:**
- Add to `frontend/src/shared/` under appropriate subdirectory (e.g., `shared/calendar/`)
- Export from `frontend/src/shared/calendar/index.js` barrel file

**New Database Migration:**
- Add SQL script to `backend/db/` as `add_feature_name.sql`
- Update `scripts/db-init.js` if needed
- Use `npm run db:migrate` to apply

**New LLM Prompt:**
- Add `.md` file to `backend/prompts/` with `{{variable}}` placeholders
- Use `buildPrompt('filename.md', variables)` from `llm.service.js` to load it
- Add validation and fallback logic matching the pattern in `dailyMealPlan.service.js` or `llm.service.js`

## Special Directories

**`backend/backend/`:**
- Purpose: Historical artifact — duplicate of backend src in nested path
- Generated: Yes (from prior git snapshot operations)
- Committed: Yes (in git history)
- Status: Not the intended source location; use `backend/src/` instead

**`backend/prompts/`:**
- Purpose: LLM prompt templates, not application code
- Generated: No (handcrafted)
- Committed: Yes
- Contains: Markdown files with `{{variable}}` interpolation placeholders

**`backend/db/`:**
- Purpose: Database schema, seed data, and migration scripts
- Generated: No (manually maintained)
- Committed: Yes
- Contains: SQL DDL/DML files and migration runner script

**`assets/`:**
- Purpose: AI Studio design assets
- Generated: No
- Committed: Yes

**`supabase/`:**
- Purpose: Supabase local development configuration
- Generated: No
- Committed: Yes
- Contains: `config.toml` for Supabase CLI

---

*Structure analysis: 2026-06-02*
