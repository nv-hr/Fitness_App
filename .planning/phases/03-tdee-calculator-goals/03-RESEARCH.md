# Phase 3 Research: TDEE Calculator & Goals

**Phase:** 03-tdee-calculator-goals
**Researched:** 2026-05-17
**Confidence:** HIGH

---

## Overview

This phase extends the existing profile system with TDEE (Total Daily Energy Expenditure) calculation using the Mifflin-St Jeor formula, activity level selection, range display (±10%), and goal-based calorie target adjustments. All delivered on the existing /profile page below the BMI section.

## Technical Approach

### Mifflin-St Jeor Formula

The Mifflin-St Jeor equation is the most accurate TDEE formula for the general population (per Academy of Nutrition and Dietetics):

**Male:** BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age + 5
**Female:** BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age - 161
**Other:** Use male formula

**TDEE = BMR × activity_multiplier**

### Activity Level Multipliers (Simplified to 3 levels per D-28)

| Level | Multiplier | Description (Indonesian) |
|-------|-----------|------------------------|
| low | 1.2 | Jarang berolahraga, pekerjaan duduk |
| medium | 1.55 | Olahraga 3-5x per minggu |
| high | 1.9 | Olahraga intensif setiap hari |

### Goal-Based Calorie Adjustments (per D-25)

| Goal | Adjustment |
|------|-----------|
| lose_weight | -500 kcal/day |
| maintain | 0 kcal/day |
| gain_weight | +300 kcal/day |

### Range Display (per D-26)

TDEE ±10%: [TDEE × 0.9, TDEE × 1.1]
Example: TDEE = 2000 → range 1800-2200

## Implementation Plan

### Database Changes
- ALTER TABLE profiles ADD activity_level ENUM('low', 'medium', 'high') NULL
- Activity level is nullable initially (existing profiles don't have it)
- TDEE calculated on-the-fly (no column stored), same pattern as BMI

### Backend Changes
- Add `calculateTdee()` function to profile.service.js
- Extend profile controller to return TDEE fields when activity_level is set
- No new endpoint needed (per D-22) — extend existing /api/profile

### Frontend Changes
- Add activity level selector to ProfileForm.jsx
- Create TdeeResult component (follows BmiResult pattern)
- Display TDEE section below BMI result
- Add Indonesian translations for TDEE/activity strings

## Key Patterns from Phase 2

- BMI is computed on-the-fly in service layer, not stored — follow same pattern for TDEE
- ProfileForm combines form + result display — add TDEE section below BMI
- Controller returns { profile, bmi, bmiCategory } — extend to { profile, bmi, bmiCategory, tdee, tdeeRange, calorieTarget }
- Repository pattern with parameterized queries — add activity_level to update queries
- Color-coded result badges — use same pattern for TDEE display

## Pitfalls to Avoid

1. **Precision illusion** (PITFALL-1): Display TDEE as range, not exact number
2. **Activity level overestimation** (PITFALL-12): Use concrete Indonesian descriptions
3. **No disclaimer** (PITFALL-1): Add Indonesian disclaimer for TDEE estimate

## Files to Modify

| File | Change |
|------|--------|
| `backend/db/init.sql` | ALTER TABLE profiles ADD activity_level |
| `backend/src/repositories/profile.repository.js` | Add activity_level to create/update queries |
| `backend/src/services/profile.service.js` | Add calculateTdee(), extend create/get/update |
| `backend/src/controllers/profile.controller.js` | Return TDEE fields in response |
| `frontend/src/features/profile/components/ProfileForm.jsx` | Add activity_level selector, TdeeResult display |
| `frontend/src/features/profile/components/TdeeResult.jsx` | New component (follows BmiResult pattern) |
| `frontend/src/features/profile/api/profileApi.js` | Add activityLevel to request payloads |
| `frontend/src/shared/i18n/translations.js` | Add tdee/activity translations |
