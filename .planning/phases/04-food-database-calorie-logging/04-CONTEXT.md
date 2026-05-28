# Phase 4: Food Database & Calorie Logging - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

## Phase Boundary

Users can search Indonesian foods, log their daily meals, and understand their calorie balance against their TDEE target. This phase delivers a dedicated /food-log page with search-as-you-type food discovery, daily food logging, custom food creation, and a calorie balance summary bar showing consumed vs TDEE target. All UI in Bahasa Indonesia.

## Implementation Decisions

### Database Schema & Seeding
- **D-30:** Single `foods` table with `user_id` column (NULL for seeded foods, set for custom foods). Schema: `id, user_id NULL, name, calories_per_100g, category, is_custom BOOLEAN, created_at`. Seeded foods have `is_custom=false, user_id=NULL`. Custom foods have `is_custom=true, user_id=set`.
- **D-31:** Pre-seed 100+ comprehensive Indonesian foods covering categories: makanan pokok, lauk-pauk, sayur, buah, minuman, snack, makanan regional. Include calories per 100g.
- **D-32:** Food categories: `makanan_pokok`, `lauk`, `sayur`, `buah`, `minuman`, `snack`, `lainnya`. Used for filtering and organization.

### Food Logging Table
- **D-33:** New `food_logs` table: `id, user_id, food_id NULL (NULL for custom entries logged directly), custom_food_name NULL, calories, portion_grams, log_date, meal_type ENUM('sarapan', 'makan_siang', 'makan_malam', 'camilan'), created_at`. Supports both seeded foods (food_id set) and custom one-off entries (custom_food_name set).

### Logging Interface
- **D-34:** Dedicated `/food-log` page — separate from `/profile`. Clean separation of concerns. Page contains: search bar, food results, daily log table, and calorie summary bar.
- **D-35:** Search-as-you-type food search. As user types, show matching foods from database + custom foods. Click to add to today's log. Fast and familiar UX.

### Calorie Balance Display
- **D-36:** Summary bar at top of `/food-log` page: consumed / target with progress bar, remaining calories. Color-coded (green=under target, red=over). Simple daily view — no weekly trend for v1.

### Custom Food Entry
- **D-37:** Custom food entry form: name + calories per serving (required). Simple form, quick entry. User defines their own portion. Saved to `foods` table with `is_custom=true, user_id=set`.
- **D-38:** Custom foods are user-private — only visible to the creating user. Seeded foods are global.

### the agent's Discretion
- Exact Indonesian food list for seeding (agent should research common Indonesian foods)
- Exact UI layout for /food-log page (follows established patterns from profile page)
- Search debounce timing (recommendation: 300ms)
- Whether to allow editing/deleting logged entries (recommendation: yes, basic CRUD)
- Meal type defaults and ordering

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, key decisions (food database: pre-seeded + custom, calories only for v1)
- `.planning/REQUIREMENTS.md` — v1 requirements (FOOD-01 through FOOD-03)
- `.planning/ROADMAP.md` — Phase 4 goal and success criteria

### Prior Phase Context
- `.planning/phases/03-tdee-calculator-goals/03-CONTEXT.md` — Phase 3 decisions (D-22 through D-29), TDEE calculation, calorie target
- `.planning/phases/02-profile-bmi-calculator/02-CONTEXT.md` — Phase 2 decisions (D-10 through D-21), profile table schema, BMI calculation
- `.planning/phases/01-foundation-authentication/01-CONTEXT.md` — Phase 1 decisions, auth system, users table schema

### Research
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Controller-Service-Repository pattern
- `.planning/research/PITFALLS.md` — Known pitfalls

### Codebase
- `.planning/codebase/STACK.md` — Current tech state
- `.planning/codebase/ARCHITECTURE.md` — Current architecture state

No external specs — requirements fully captured in decisions above.

## Existing Code Insights

### Reusable Assets
- `backend/db/init.sql` — Add `foods` and `food_logs` tables here
- `backend/src/services/profile.service.js` — Has calculateTdee(), reuse for calorie target lookup
- `backend/src/controllers/profile.controller.js` — Returns calorieTarget, needed for balance calculation
- `frontend/src/shared/i18n/translations.js` — Add food logging translation strings
- `frontend/src/shared/lib/http.js` — apiFetch, apiGet, apiPost (reuse for food log API calls)
- `frontend/src/features/profile/components/TdeeResult.jsx` — Pattern for result display components
- `frontend/src/features/profile/components/ProfileForm.jsx` — Pattern for form components with React Hook Form + Zod

### Established Patterns
- Controller-Service-Repository pattern (backend)
- Feature-first organization (frontend): `src/features/{feature}/`
- React Hook Form + Zod validation
- Indonesian i18n via t() function
- Color-coded result badges
- Combined form + result UI patterns

### Integration Points
- `backend/db/init.sql` — New tables: foods, food_logs
- `backend/src/routes/` — New route file: food.routes.js
- `backend/src/controllers/` — New controller: food.controller.js
- `backend/src/services/` — New service: food.service.js
- `backend/src/repositories/` — New repository: food.repository.js
- `frontend/src/features/` — New feature directory: food-log/
- `frontend/src/shared/i18n/translations.js` — Add food logging translations
- `frontend/src/app/Router.jsx` — Add /food-log route

## Specific Ideas

No specific requirements beyond decisions above — open to standard approaches for food database seeding and logging interface.

## Deferred Ideas

- Weekly/monthly calorie trend charts — belongs in future phase
- Macro tracking (protein/carbs/fat) — v2 feature (out of scope per PROJECT.md)
- Barcode scanning for packaged foods — not in v1 requirements
- Meal plan generation based on calorie target — future phase
- Social food sharing — out of scope per PROJECT.md
- Photo-based food logging — AI/ML feature, not in v1

---

*Phase: 04-Food Database & Calorie Logging*
*Context gathered: 2026-05-18*
