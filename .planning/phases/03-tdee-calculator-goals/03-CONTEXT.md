# Phase 3: TDEE Calculator & Goals - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

## Phase Boundary

Users can calculate their daily calorie target based on activity level and fitness goals. This phase extends the profile system with activity level selection, TDEE calculation using Mifflin-St Jeor formula, range display (±10%), and goal-based calorie target adjustments. All delivered on the existing /profile page below the BMI section.

## Implementation Decisions

### TDEE Endpoint Design
- **D-22:** Extend existing profile endpoint to include TDEE — no separate /api/tdee endpoint. Profile save returns { profile, bmi, bmiCategory, tdee, tdeeRange, calorieTarget } in one response.

### Activity Level Storage
- **D-23:** Add `activity_level` column to profiles table (enum: low/medium/high). User selects once, TDEE auto-calculates. Can update later from profile page.

### TDEE UI Placement
- **D-24:** TDEE section below BMI result on existing /profile page. Activity level selector + TDEE range + calorie target displayed after profile save. No separate page.

### Goal Calorie Adjustments
- **D-25:** lose_weight: -500 kcal/day, maintain: 0, gain_weight: +300 kcal/day. Standard recommendations applied to TDEE result.

### Range Display Format
- **D-26:** TDEE ±10% range (e.g., TDEE = 2000 → range 1800-2200). Research-backed, accounts for Mifflin-St Jeor formula inaccuracy.
- **D-27:** Disclaimer text in Indonesian: "Hasil ini adalah estimasi dan bukan diagnosis medis." (same as BMI disclaimer)

### Activity Level Options
- **D-28:** 3 simplified levels:
  - **low** (sedentary): multiplier 1.2 — "Jarang berolahraga, pekerjaan duduk"
  - **medium** (moderate): multiplier 1.55 — "Olahraga 3-5x per minggu"
  - **high** (very active): multiplier 1.9 — "Olahraga intensif setiap hari"

### TDEE Formula
- **D-29:** Mifflin-St Jeor formula:
  - Male: BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age + 5
  - Female: BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age - 161
  - Other: use male formula
  - TDEE = BMR × activity_multiplier
  - tdeeRange: [TDEE × 0.9, TDEE × 1.1]
  - calorieTarget = TDEE + goal_adjustment

### the agent's Discretion
- Exact Indonesian text for activity level descriptions
- Whether to recalculate TDEE on profile update (recommendation: yes, auto-recalculate)
- Exact UI layout for TDEE section (follows BMI section pattern)
- Whether to show BMR separately or only TDEE (recommendation: show both for transparency)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements (TDEE-01 through TDEE-03)
- `.planning/ROADMAP.md` — Phase 3 goal and success criteria

### Prior Phase Context
- `.planning/phases/02-profile-bmi-calculator/02-CONTEXT.md` — Phase 2 decisions (D-10 through D-21), profile table schema
- `.planning/phases/02-profile-bmi-calculator/02-01-SUMMARY.md` — Profile repository, service with BMI calculation, controller, routes
- `.planning/phases/02-profile-bmi-calculator/02-02-SUMMARY.md` — ProfileForm, BmiResult components, profile API adapter, translations

### Research
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Controller-Service-Repository pattern
- `.planning/research/PITFALLS.md` — TDEE precision illusion pitfall (display ranges, not exact numbers)

### Codebase
- `.planning/codebase/STACK.md` — Current tech state
- `.planning/codebase/ARCHITECTURE.md` — Current architecture state

No external specs — requirements fully captured in decisions above.

## Existing Code Insights

### Reusable Assets
- `backend/src/services/profile.service.js` — Has BMI calculation, add TDEE calculation here
- `backend/src/controllers/profile.controller.js` — Returns { profile, bmi, bmiCategory }, extend to include TDEE fields
- `backend/src/repositories/profile.repository.js` — Has create/update, needs activity_level column support
- `backend/init.sql` — Has profiles table schema, needs ALTER TABLE for activity_level
- `frontend/src/features/profile/components/BmiResult.jsx` — Pattern for TdeeResult component
- `frontend/src/features/profile/components/ProfileForm.jsx` — Add activity_level field
- `frontend/src/shared/i18n/translations.js` — Add TDEE/activity level translation strings
- `frontend/src/shared/lib/http.js` — apiFetch, apiGet, apiPost (reuse for profile updates)
- `frontend/src/features/profile/api/profileApi.js` — Add TDEE-related API calls if needed

### Established Patterns
- Controller-Service-Repository pattern (backend)
- Feature-first organization (frontend): `src/features/{feature}/`
- Combined form + result UI (profile page)
- Color-coded result badges (BMI: blue/green/yellow/red)
- React Hook Form + Zod validation
- Indonesian i18n via t() function

### Integration Points
- `backend/src/services/profile.service.js` — Add calculateTdee() method
- `backend/init.sql` — ALTER TABLE profiles ADD activity_level
- `frontend/src/features/profile/components/ProfileForm.jsx` — Add activity_level selector
- `frontend/src/features/profile/components/BmiResult.jsx` — Add TDEE display below BMI
- `frontend/src/shared/i18n/translations.js` — Add tdee/activity translations

## Specific Ideas

No specific requirements — open to standard approaches for TDEE implementation.

## Deferred Ideas

- TDEE history tracking — belongs in future phase
- Custom activity multiplier input — not in v1 requirements
- Macro-based calorie splitting (protein/carbs/fat) — v2 feature (NUTR-01, NUTR-02)
- Meal plan generation based on calorie target — future phase

---

*Phase: 03-TDEE Calculator & Goals*
*Context gathered: 2026-05-17*
