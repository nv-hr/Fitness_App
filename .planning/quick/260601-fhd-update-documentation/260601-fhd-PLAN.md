---
id: 260601-fhd
description: Update Documentation
type: quick
wave: 1
files_modified:
  - README.md
  - AGENTS.md
  - backend/docs/API.md
autonomous: true
---

<objective>
Sync three project documentation files with the actual codebase state through v1.8.

**Purpose:** Eliminate stale/misleading documentation that could confuse new contributors, LLM agents, or the developer during future work.

**Files to update:**
- `README.md` — Feature list, project structure, and quick start
- `AGENTS.md` — Four stale GSD-generated sections (stack, conventions, architecture, project)
- `backend/docs/API.md` — Missing endpoints and wrong route paths
</objective>

<context>
@.planning/PROJECT.md  (authoritative reference for shipped features and tech stack)
@.planning/STATE.md    (v1.8 completion status)
@frontend/src/app/Router.jsx       (actual routes — /meal-calendar redirects to /food-log)
@backend/src/routes/*.routes.js    (actual endpoints)

## Gap Analysis

### README.md
- Feature list stops at v1.3 (no v1.6 activity plans, v1.7 calendars, v1.8 UI consolidation)
- Project structure omits `shared/calendar/` directory
- Tech stack table correct but LLM model info absent
- "Activity Recommendations" entry still describes v1.0 random suggestions, not LLM

### AGENTS.md
- `GSD:stack` says "No source code files exist" — completely wrong, project has 450+ commits
- `GSD:stack` says "Planned features are described in English in README.md"
- `GSD:stack` tech column says "Not applicable — No runtime configuration files"
- `GSD:conventions` says "No source code files to analyze"
- `GSD:architecture` says "No codebase to analyze" and "No abstractions"
- `GSD:project` constraint says "React + Express + MySQL" — should be Supabase PostgreSQL
- `GSD:architecture` still references old "Workout Planner", "Workout Progress" feature names

### backend/docs/API.md
- **Missing endpoints:**
  - `POST /api/weekly-plans/toggle-complete` (exists in weeklyPlan.routes.js line 14)
  - `POST /api/weekly-plans/swap` (exists in weeklyPlan.routes.js line 13)
  - `POST /api/daily-meal-plans/toggle-item` (exists in dailyMealPlan.routes.js line 13)
  - `POST /api/daily-meal-plans/swap-item` (exists in dailyMealPlan.routes.js line 14)
- **Wrong route:** Section 10 `POST /api/activity-plans/log-activities` should be `POST /api/activity-plans/log` (actual route at activityPlan.routes.js line 12)
- **Duplicated rate limiting:** Weekly Plans rate limit table in standalone section duplicates section 8
- **Section numbering:** Jumps from 5 (Activities) to 6 (Documentation) to 7 (Activity Log — still under `/api/activities`)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update README.md with v1.3-v1.8 features and current structure</name>
  <files>README.md</files>
  <action>
    Apply these changes to README.md:

    1. **Feature list** — Replace the 10 bullet features with an updated set reflecting all shipped functionality through v1.8:
       - BMI Calculator (no change)
       - TDEE Calculator (no change)
       - Ingredient-based Food Logging (keep, mention weight-in-grams)
       - Calorie Tracking with daily summary (keep)
       - Activity Logging with intensity tracking (v1.3, merge with old "Activity Recommendations")  
       - LLM Weekly Activity Plans (v1.3 OpenRouter-powered)
       - LLM Daily Meal Plans (v1.4)
       - Activity Calendar with month grid view (v1.7)
       - Meal Calendar with month grid view (v1.7)
       - Auto-Logging for both activity and meal plans (v1.6)
       - Per-activity swap and completion toggle (v1.6/v1.7)
       - AI-automated activity recommendations via profile-based fallback (v1.0-style randomized)

       Lead feature entry: "**Activity Calendar** — Month-grid view of your weekly activity plan with color-coded days, per-day detail panel, activity swap, and completion toggle. Past days read-only."
       Next: "**Meal Calendar** — Month-grid view of your daily meal plan with per-meal-type log buttons, auto-generation, and past-day read-only."

    2. **Tech Stack** — Add LLM row: `| LLM | OpenRouter API (free-tier models), node-cache |`
       Update Deployment to mention Docker health check more concisely.

    3. **Project Structure** — Add to the `frontend/` tree:
       ```
       │   ├── shared/
       │   │   ├── calendar/       # CalendarGrid, MonthNav, DayDetailPanel, hooks, utils
       │   │   └── hooks/          # useResponsive, etc.
       │   └── features/
       ```

    4. **Quick Start** — Update "Prerequisites" to say "Supabase PostgreSQL database" instead of generic.
       Add a brief note under 2. Install: "Backend (Express ESM) and frontend (Vite) each have their own package.json."

    5. **Keep all existing formatting, Docker, and license sections** unchanged.

    Do NOT change the overall structure, tone, or license section.
  </action>
  <verify>
    <automated>Select-String -Path "README.md" -Pattern "Activity Calendar|Meal Calendar|shared/calendar|LLM Weekly" | Measure-Object -Line</automated>
  </verify>
  <done>
    README.md features list covers v1.0 through v1.8, project structure includes shared/calendar/, LLM added to tech stack.
  </done>
</task>

<task type="auto">
  <name>Task 2: Refresh AGENTS.md GSD sections with current project state</name>
  <files>AGENTS.md</files>
  <action>
    Rewrite the four stale GSD-generated sections in AGENTS.md. Keep the `<!-- GSD:... -->` comment markers, the `<-- start-dev -->`/`<!-- end-dev -->` section, and the GSD Workflow Enforcement section intact. Only replace content between tags.

    **Section 1 — `GSD:project-start` (lines 1-16):**
    - Change constraint from "React + Express + MySQL" to "React 19 + Express 5 + Supabase PostgreSQL"
    - Update Core Value to match current PROJECT.md: "Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool."

    **Section 2 — `GSD:stack-start` (lines 18-44):**
    Complete rewrite. Replace the entire content with:

    ```
    <!-- GSD:stack-start source:codebase/STACK.md -->
    ## Technology Stack

    ## Languages
    - **JavaScript (ESM)** — Both frontend and backend use ES modules
    ## Runtime / Platform
    - **Node.js 20+** — Backend runtime
    - **Browser** — Frontend SPA served by Vite dev server or Express static
    ## Frameworks
    | Layer | Framework |
    |-------|-----------|
    | Frontend | React 19, Vite 8, React Router 7, TanStack React Query, React Hook Form, Zod |
    | Backend | Express 5 (ESM), Passport (JWT + Google OAuth), Helmet, express-rate-limit |
    | Database | Supabase PostgreSQL 17 (pg driver, no ORM) |
    ## Dependencies
    - **Root**: None (monorepo with separate package.json per directory)
    - **backend/**: express, passport, passport-jwt, passport-google-oauth20, bcryptjs, pg, openai, node-cache, cors, helmet, express-rate-limit, cookie-parser, zod, dotenv, date-fns
    - **frontend/**: react, react-dom, react-router-dom, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, date-fns
    ## Dev Dependencies
    - **Root**: None
    - **backend/**: jest, nodemon, eslint
    - **frontend/**: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, eslint, vite
    ## Configuration Files
    | File | Purpose |
    |------|---------|
    | `backend/.env` | Environment variables (DB URL, JWT secret, OAuth keys, LLM keys) |
    | `backend/.env.example` | Template for .env |
    | `frontend/vite.config.js` | Vite config with dev proxy to backend |
    | `Dockerfile` | Multi-stage production build |
    | `docker-compose.yml` | Production container setup |
    | `supabase/config.toml` | Supabase project configuration |
    ## Build / Tooling
    - **Vite 8** — Frontend build tool
    - **Docker** — Multi-stage production build
    - **Jest** (backend) + **Vitest** (frontend) — 141 frontend + backend tests
    <!-- GSD:stack-end -->
    ```

    **Section 3 — `GSD:conventions-start` (lines 46-75):**
    Replace the "Not applicable" lines with actual observations. Keep the existing commit style and naming conventions (those were good). Update:

    - **Code Style**: "React functional components with hooks, Express route-controller-service-repository pattern, ES modules throughout."
    - **Naming Conventions** — Add: `| Files (backend) | snake_case | weeklyPlan.routes.js |`, `| Files (frontend) | PascalCase.jsx | ActivityPage.jsx, FoodLogPage.jsx |`, `| API routes | kebab-case | /api/weekly-plans/toggle-complete |`
    - **Error Handling**: "Backend: try/catch in controllers → error middleware → standard JSON `{ success, error: { message, code } }` response. Frontend: TanStack Query error handling with toast notifications."
    - **Patterns**: "Route → Controller → Service → Repository → pg Pool. Controllers handle req/res, services contain business logic, repositories run SQL queries."
    - Remove the "Recommendations for Future Implementation" section.
    - Add: "## Notes: Codebase has 450+ commits across 41 phases. See .planning/PROJECT.md for full history."

    **Section 4 — `GSD:architecture-start` (lines 77-105):**
    Complete rewrite:

    ```
    ## Architecture

    ## Architectural Pattern
    - **Route-Controller-Service-Repository** — Layered architecture on the backend.
    - **Feature-based modules** on the frontend under `frontend/src/features/`.
    ## Layers
    | Layer | Technology | Location |
    |-------|-----------|----------|
    | UI (React) | React 19, React Router 7 | `frontend/src/features/*/components/` |
    | State | TanStack React Query | `frontend/src/features/*/api/` |
    | API (Express) | Express 5 routes + controllers | `backend/src/routes/`, `backend/src/controllers/` |
    | Business Logic | Service layer | `backend/src/services/` |
    | Data Access | Repository pattern (pg) | `backend/src/repositories/` |
    | Database | Supabase PostgreSQL 17 | `supabase/` migrations |
    ## Data Flow
    - Browser → (React Query) → Express API → Controller → Service → Repository → pg Pool → PostgreSQL
    - Auth: httpOnly JWT cookie set on login/register, verified by authenticateToken middleware
    - LLM: Service calls OpenRouter API, results cached with node-cache, persisted to DB
    ## Abstractions
    - `http.js` — Shared HTTP client wrapper for frontend API calls
    - `auth.middleware.js` — JWT verification guard for protected routes
    - `error.middleware.js` — Global Express error handler
    - `database.js` — pg Pool singleton with SSL config
    - Calendar shared components — CalendarGrid, MonthNav, DayDetailPanel, CalendarPageLayout, useMonthData, calendarUtils
    ## Entry Points
    - `backend/src/server.js` (development: nodemon, production: node)
    - `frontend/src/main.jsx` (Vite dev server entry)
    ## Key Formulas
    (keep existing BMI, TDEE, BMR formulas)
    ```

    Do NOT touch the GSD Workflow Enforcement section, the Developer Profile section, or the start-dev/end-dev section.
  </action>
  <verify>
    <automated>if ((Select-String -Path "AGENTS.md" -Pattern "Supabase PostgreSQL" | Measure-Object -Line).Lines -gt 0 -and (Select-String -Path "AGENTS.md" -Pattern "No source code files" | Measure-Object -Line).Lines -eq 0) { Write-Output "PASS" } else { Write-Output "FAIL" }</automated>
  </verify>
  <done>
    AGENTS.md no longer contains "No source code files", "MySQL", or "Not applicable" for codebase sections. All four GSD blocks reflect current project state.
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix backend/docs/API.md — add missing endpoints, fix route paths, clean section numbering</name>
  <files>backend/docs/API.md</files>
  <action>
    Apply the following fixes to `backend/docs/API.md`:

    1. **Section 8 (Weekly Plans) — Add two missing endpoints after `regenerate-day`:**
       Add `POST /api/weekly-plans/toggle-complete`:
       - Auth: Required
       - Rate Limit: Dedicated toggle-complete limiter
       - Description: Toggle the completion status of a weekly plan activity for a given day. Uses server-authoritative toggle to prevent race conditions. Returns updated plan with the toggled day's activities.
       - Request Body: `{ "weekStart": "2026-05-25", "dayIndex": 2, "activityName": "Brisk Walking" }`
       - Response 200: `{ success: true, data: { plan: { days: [...] } } }`
       - Error Codes: `VALIDATION_ERROR` (400), `RATE_LIMITED` (429), `AUTHENTICATION_ERROR` (401)

       Add `POST /api/weekly-plans/swap`:
       - Auth: Required
       - Rate Limit: Dedicated swap limiter
       - Description: Swap a single activity in a weekly plan day with an LLM-generated replacement. Replaces only the specified activity in-place without regenerating the full day. Has independent rate limit tracking.
       - Request Body: `{ "weekStart": "2026-05-25", "dayIndex": 2, "oldActivityName": "Brisk Walking", "intensity": "moderate" }`
       - Response 200: `{ success: true, data: { plan: { days: [...] } } }`
       - Error Codes: `VALIDATION_ERROR` (400), `RATE_LIMITED` (429), `AUTHENTICATION_ERROR` (401)

    2. **Section 8 — Fix the rate limit standalone section:**
       Remove the standalone "Rate Limiting (Weekly Plans)" section (lines 74-80) — it's redundant with the rate limit tables already in section 8.

    3. **Section 9 (Daily Meal Plans) — Add two missing endpoints after `log`:**
       Add `POST /api/daily-meal-plans/toggle-item`:
       - Auth: Required
       - Rate Limit: Global (no separate limiter)
       - Description: Toggle the logged status of an individual meal item. When toggled from false→true, the item is logged to the food log. When toggled from true→false, the food log entry is deleted. Idempotent.
       - Request Body: `{ "date": "2026-05-31", "mealType": "lunch", "itemIndex": 0 }`
       - Response 200: `{ success: true, data: { item: { ... }, logged: true/false } }`
       - Error Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `AUTHENTICATION_ERROR` (401)

       Add `POST /api/daily-meal-plans/swap-item`:
       - Auth: Required
       - Rate Limit: Global
       - Description: Swap a single meal item in a daily plan with an LLM-generated replacement. Replaces only the specified item without regenerating the full meal or day.
       - Request Body: `{ "date": "2026-05-31", "mealType": "lunch", "itemIndex": 0 }`
       - Response 200: `{ success: true, data: { plan: { meals: [...] } } }`
       - Error Codes: `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401)

    4. **Section 10 (Activity Plans) — Fix the wrong route path:**
       Change `POST /api/activity-plans/log-activities` to `POST /api/activity-plans/log` throughout (route path, description, request body examples).
       The actual route at activityPlan.routes.js line 12 registers `router.post('/log', ...)`.

    5. **Section numbering cleanup:**
       Current: Section 5 (Activities), 6 (Documentation), 7 (Activity Log — still under `/api/activities`)
       Fix: Renumber sections sequentially. Section 5 = Activities + Activity Log (currently split across 5 and 7). Merge the "Activity Log" section 7 into section 5 as sub-sections (5.1 POST /api/activities/log, 5.2 GET /api/activities/logs, etc.) to eliminate the jarring split.

    6. **Consolidate the duplicate "Rate Limiting (Weekly Plans)" block** — After adding the new endpoints, remove the standalone rate-limit table between sections 7 and 8 (lines 74-80). The rate limits for weekly plans are already documented in section 8's header tables.
  </action>
  <verify>
    <automated>if ((Select-String -Path "backend/docs/API.md" -Pattern "toggle-complete|swap-item|/api/activity-plans/log" | Measure-Object -Line).Lines -ge 3) { Write-Output "PASS" } else { Write-Output "FAIL" }</automated>
  </verify>
  <done>
    API.md documents all 5 missing endpoints, corrects activity-plans/log path, removes duplicate rate-limit section, and fixes section numbering.
  </done>
</task>

</tasks>

<verification>

### Pre-commit checklist

| Check | Method |
|-------|--------|
| README.md has Activity Calendar + Meal Calendar features | `grep -c "Activity Calendar" README.md` == 1 |
| README.md project structure includes shared/calendar/ | `grep -c "shared/calendar" README.md` == 1 |
| AGENTS.md no longer has "MySQL" in GSD:project | `grep "MySQL" AGENTS.md` == 0 |
| AGENTS.md has "Supabase PostgreSQL" in GSD:stack | `grep -c "Supabase PostgreSQL" AGENTS.md` >= 1 |
| AGENTS.md no longer has "No source code files" | `grep "No source code files" AGENTS.md` == 0 |
| API.md has toggle-complete endpoint | `grep -c "toggle-complete" backend/docs/API.md` == 1 |
| API.md has swap-item endpoint | `grep -c "swap-item" backend/docs/API.md` == 1 |
| API.md has /api/activity-plans/log (not log-activities) | `grep "/api/activity-plans/log" backend/docs/API.md | grep -v log-activities | grep -c "/log"` == 1 |
| API.md duplicate rate-limit block removed | `grep -c "Rate Limiting (Weekly Plans)" backend/docs/API.md` <= 1 (only remaining in section 8 header, not standalone) |
</verification>

<success_criteria>
1. README.md accurately describes all features through v1.8, including calendar views and UI consolidation
2. AGENTS.md GSD sections reflect actual codebase: proper tech stack, conventions, architecture
3. backend/docs/API.md documents all 22+ endpoints correctly (5 added, 1 fixed, dup removed)
</success_criteria>

<output>
After completion, the executor should report:
- Summary of changes made to each file
- Any discrepancies found between docs and codebase
</output>
