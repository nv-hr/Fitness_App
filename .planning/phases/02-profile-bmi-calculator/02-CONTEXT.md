# Phase 2: Profile & BMI Calculator - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

## Phase Boundary

Users can set their body metrics (weight, height, age, gender, fitness goal) and view their BMI with proper regional context (Asian-Pacific cutoffs). This phase delivers profile management (separate profiles table), BMI calculation on profile save, combined form+result UI, and mandatory profile setup on first login.

## Implementation Decisions

### Profile Data Storage
- **D-10:** Separate `profiles` table with `user_id` FK to `users` table. Allows profile history tracking later (weight changes over time).
- **D-11:** Profiles table columns: id, user_id (FK), weight_kg (decimal), height_cm (decimal), age (int), gender (enum: male/female/other), fitness_goal (enum: lose_weight/maintain/gain_weight), created_at, updated_at.

### BMI Calculation
- **D-12:** BMI computed automatically on profile save — backend calculates and returns BMI with the save response. No separate endpoint needed for v1.
- **D-13:** BMI formula: weight_kg / (height_m)² where height_m = height_cm / 100.
- **D-14:** Asian-Pacific cutoffs: underweight <18.5, normal 18.5-22.9, overweight 23-24.9, obese >=25.

### Profile UI
- **D-15:** Combined form + result page — profile form at top, BMI result appears below after save.
- **D-16:** BMI display: large number + color-coded category badge (green=normal, yellow=overweight, red=obese/blue=underweight) + disclaimer text below.
- **D-17:** Disclaimer text in Indonesian: "Hasil ini adalah estimasi dan bukan diagnosis medis."

### Profile Flow
- **D-18:** Mandatory profile setup on first login — redirect to profile page after first authentication. Must complete before accessing other features.
- **D-19:** Profile can be updated later from dashboard (edit existing profile).

### Units & Options
- **D-20:** Weight in kg, height in cm (standard in Indonesia).
- **D-21:** Fitness goal: 3 options — lose_weight, maintain, gain_weight.

### the agent's Discretion
- Profile validation rules (min/max weight, height ranges)
- Exact color values for BMI category badges
- Whether to store BMI in database or compute on-the-fly (recommendation: compute on-the-fly, no BMI column needed)
- Exact Indonesian text for form labels and validation messages

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements (PROF-01 through PROF-03, BMI-01 through BMI-03)
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria

### Prior Phase Context
- `.planning/phases/01-foundation-authentication/01-CONTEXT.md` — Phase 1 decisions (D-01 through D-09), patterns established
- `.planning/phases/01-foundation-authentication/01-01-SUMMARY.md` — Infrastructure: user.repository.js, database.js, init.sql schema
- `.planning/phases/01-foundation-authentication/01-02-SUMMARY.md` — Auth backend: auth.middleware.js, auth.service.js, Controller-Service-Repository pattern

### Research
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Controller-Service-Repository pattern, feature-first frontend
- `.planning/research/PITFALLS.md` — BMI accuracy pitfalls (Asian-Pacific cutoffs, precision illusion)

### Codebase
- `.planning/codebase/STACK.md` — Current tech state
- `.planning/codebase/ARCHITECTURE.md` — Current architecture state

No external specs — requirements fully captured in decisions above.

## Existing Code Insights

### Reusable Assets
- `backend/src/repositories/user.repository.js` — Pattern for new profile.repository.js
- `backend/src/services/auth.service.js` — Pattern for new profile.service.js and bmi.service.js
- `backend/src/controllers/auth.controller.js` — Pattern for new profile.controller.js
- `backend/src/middlewares/auth.middleware.js` — authenticateToken middleware for protected profile routes
- `backend/src/utils/response.js` — Standard response format
- `backend/src/utils/errors.js` — Standard error format
- `backend/src/app.js` — Express app setup, add profile routes here
- `frontend/src/shared/lib/http.js` — apiFetch, apiGet, apiPost with credentials:include
- `frontend/src/shared/i18n/translations.js` — t() function for Indonesian translations
- `frontend/src/features/auth/hooks/useAuth.js` — AuthProvider pattern for ProfileProvider if needed
- `frontend/src/app/Router.jsx` — Add profile route with ProtectedRoute guard
- `frontend/src/app/Providers.jsx` — Add new providers here

### Established Patterns
- Controller-Service-Repository pattern (backend)
- Feature-first organization (frontend): `src/features/{feature}/`
- HTTP client with cookie auth (credentials:include)
- React Hook Form + Zod validation
- TanStack Query for server state

### Integration Points
- `backend/src/routes/` — New profile.routes.js
- `backend/init.sql` — Add profiles table schema
- `frontend/src/app/Router.jsx` — Add /profile route with ProtectedRoute
- `frontend/src/shared/i18n/translations.js` — Add profile/BMI translation strings
- `frontend/src/app/Providers.jsx` — May need ProfileProvider

## Specific Ideas

No specific requirements — open to standard approaches for profile/BMI implementation.

## Deferred Ideas

- BMI history tracking — belongs in future phase (Track BMI over time)
- Profile photo upload — not in v1 requirements
- Multiple profile presets (e.g., different goals) — out of scope
- BMI comparison with ideal weight range — could be Phase 3 (TDEE) feature

---

*Phase: 02-Profile & BMI Calculator*
*Context gathered: 2026-05-17*
