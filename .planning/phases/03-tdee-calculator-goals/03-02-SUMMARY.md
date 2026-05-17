---
phase: 03-tdee-calculator-goals
plan: 02
subsystem: frontend
tags: [tdee-ui, activity-selector, indonesian-translations]
requires: [03-01]
provides: [TDEE-01, TDEE-02, TDEE-03]
affects: []
tech-stack:
  added: [TdeeResult component, activity level selector]
  patterns: [following BmiResult pattern, Zod validation]
key-files:
  created:
    - frontend/src/features/profile/components/TdeeResult.jsx
  modified:
    - frontend/src/features/profile/components/ProfileForm.jsx
    - frontend/src/features/profile/api/profileApi.js
    - frontend/src/shared/i18n/translations.js
decisions:
  - "D-24: TDEE section below BMI on existing /profile page"
  - "D-25: Goal adjustments: lose_weight=-500, maintain=0, gain_weight=+300"
  - "D-26: TDEE ±10% range display"
  - "D-27: Indonesian disclaimer (same as BMI)"
  - "D-28: 3 simplified activity levels with concrete Indonesian descriptions"
metrics:
  duration: "~10 min"
  completed: "2026-05-17"
---

# Phase 03 Plan 02: Frontend TDEE UI Summary

**One-liner:** Added TDEE UI to profile page with activity level selector, TdeeResult component displaying range and calorie target, Indonesian translations, and API adapter updates.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TdeeResult component and add translations | `defd969` | TdeeResult.jsx, translations.js |
| 2 | Update ProfileForm with activity selector and TDEE display | `865987c` | ProfileForm.jsx |
| 3 | Update API adapter to send activityLevel | `c881e6c` | profileApi.js |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All TDEE data is wired from the backend API response.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| *(none)* | | No new threat surface beyond plan's threat model |

## Self-Check: PASSED

- TdeeResult.jsx created with tdeeRange, calorieTarget, activityLevel, fitnessGoal props
- ProfileForm has activityLevel in Zod schema, defaultValues, state, selector, and submission
- API adapter sends activityLevel in createProfile and updateProfile
- All UI text uses t() translation keys
- Profile title updated to 'Profil, BMI & TDEE'
- TDEE section only renders when tdee value is non-null
