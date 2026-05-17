# Phase 5: Activity Recommendations & Polish - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

## Phase Boundary

Users receive goal-based activity recommendations appropriate for their fitness goal; application is fully responsive and usable on both mobile and desktop screens. This phase delivers a dedicated /activities page with daily randomized recommendations from a pre-seeded pool of home-suitable activities, plus mobile-first responsive design across all pages. All UI in Bahasa Indonesia. This is the final phase — polish and completion.

## Implementation Decisions

### Recommendation Display
- **D-39:** Dedicated `/activities` page — separate from other pages. Clean navigation, familiar pattern. Page shows daily recommendations, activity pool browser, and simple tracking.
- **D-40:** Show 3-5 recommendations at a time on the /activities page.

### Activity Pool & Categorization
- **D-41:** Activities tagged by fitness goal (lose_weight: cardio-focused, maintain: balanced, gain_weight: strength-focused). Each activity has: `name, description, duration_min, estimated_calories, goal_tags[], equipment_needed[]`.
- **D-42:** ~30-40 pre-seeded activities total, all suitable for home use without gym equipment.
- **D-43:** New `activities` table: `id, name, description, duration_min, estimated_calories, goal_tags JSON, equipment_needed JSON, created_at`. JSON columns for tags allow flexible querying.
- **D-44:** Optional `user_activity_log` table for tracking completed activities: `id, user_id, activity_id, completed_date, notes NULL, created_at`. Simple tracking, not required for v1 recommendations to work.

### Recommendation Logic
- **D-45:** Goal-filtered daily shuffle — filter activities by user's `fitness_goal`, shuffle, pick 3-5. Reshuffle daily (based on date) or on button click. Simple, effective, no state needed.
- **D-46:** No tracking of shown/completed activities required for v1 — pure randomization from goal-filtered pool.

### Responsive & Polish Scope
- **D-47:** Mobile-first responsive breakpoints: `<768px` mobile, `>=768px` desktop. Stack form fields vertically on mobile, side-by-side on desktop.
- **D-48:** Test all pages for responsive: auth (login/register), /profile, /food-log, /activities.
- **D-49:** Cleanup: spacing, button sizes, font scaling. Clean, minimal styling consistent across the application.
- **D-50:** No horizontal scrolling on any page. Forms usable on mobile touch screens.

### the agent's Discretion
- Exact Indonesian activity list for seeding (agent should research common home exercises)
- Exact UI layout for /activities page (follows established patterns from other pages)
- Shuffle algorithm implementation (recommendation: Fisher-Yates or simple ORDER BY RAND())
- Whether to show estimated calories burned per activity (recommendation: yes, for motivation)
- Exact responsive CSS approach (inline styles, CSS modules, or Tailwind — follow existing pattern)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, key decisions (dummy AI/ML for activities, rule-based randomization)
- `.planning/REQUIREMENTS.md` — v1 requirements (ACT-01, ACT-02, UI-02, UI-03)
- `.planning/ROADMAP.md` — Phase 5 goal and success criteria

### Prior Phase Context
- `.planning/phases/04-food-database-calorie-logging/04-CONTEXT.md` — Phase 4 decisions (D-30 through D-38), food database, logging
- `.planning/phases/03-tdee-calculator-goals/03-CONTEXT.md` — Phase 3 decisions (D-22 through D-29), TDEE calculation, fitness_goal enum
- `.planning/phases/02-profile-bmi-calculator/02-CONTEXT.md` — Phase 2 decisions (D-10 through D-21), profile table schema
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
- `backend/db/init.sql` — Add `activities` and `user_activity_log` tables here
- `backend/src/services/profile.service.js` — Has user profile with fitness_goal, needed for filtering
- `backend/src/controllers/profile.controller.js` — Returns profile data including fitness_goal
- `frontend/src/shared/i18n/translations.js` — Add activity recommendations translation strings
- `frontend/src/shared/lib/http.js` — apiFetch, apiGet, apiPost (reuse for activity API calls)
- `frontend/src/app/Router.jsx` — Add /activities route
- `frontend/src/features/food-log/components/CalorieSummary.jsx` — Pattern for summary display components
- `frontend/src/features/profile/components/ProfileForm.jsx` — Pattern for responsive form layout

### Established Patterns
- Controller-Service-Repository pattern (backend)
- Feature-first organization (frontend): `src/features/{feature}/`
- React Hook Form + Zod validation
- Indonesian i18n via t() function
- Color-coded result badges
- Combined form + result UI patterns

### Integration Points
- `backend/db/init.sql` — New tables: activities, user_activity_log (optional)
- `backend/src/routes/` — New route file: activity.routes.js
- `backend/src/controllers/` — New controller: activity.controller.js
- `backend/src/services/` — New service: activity.service.js
- `backend/src/repositories/` — New repository: activity.repository.js
- `frontend/src/features/` — New feature directory: activities/
- `frontend/src/shared/i18n/translations.js` — Add activity translations
- `frontend/src/app/Router.jsx` — Add /activities route
- All existing pages — responsive CSS updates

## Specific Ideas

No specific requirements beyond decisions above — open to standard approaches for activity seeding and responsive design.

## Deferred Ideas

- Activity completion tracking with streaks — belongs in future phase (v2)
- Video demonstrations for exercises — not in v1 requirements
- Custom activity creation by users — future phase
- AI-powered personalized recommendations — out of scope per PROJECT.md (v1 uses rule-based)
- Social activity sharing — out of scope per PROJECT.md
- Wearable device integration — not in v1 requirements

---

*Phase: 05-Activity Recommendations & Polish*
*Context gathered: 2026-05-18*
