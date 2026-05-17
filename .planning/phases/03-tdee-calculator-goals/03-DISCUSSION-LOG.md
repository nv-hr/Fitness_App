# Phase 3: TDEE Calculator & Goals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 03-TDEE Calculator & Goals
**Areas discussed:** TDEE endpoint design, Activity level storage, TDEE UI placement, Goal calorie adjustments, Range display format, Activity levels

---

## TDEE Endpoint Design

| Option | Description | Selected |
|--------|-------------|----------|
| Extend profile endpoint (Recommended) | Add activity_level to profile save, return { profile, bmi, bmiCategory, tdee, tdeeRange, calorieTarget } in one response. Simple, single call. | ✓ |
| Separate endpoint | Separate POST /api/tdee/calculate endpoint. User can calculate TDEE without updating profile. | |

**User's choice:** Extend profile endpoint (Recommended)
**Notes:** No separate endpoint needed. Profile save returns all calculated values.

---

## Activity Level Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Store in profiles table (Recommended) | Add activity_level column to profiles table. User selects once, TDEE auto-calculates. Can update later. | ✓ |
| Pass only, don't store | User selects activity level each time they want TDEE. Not stored, just used for calculation. | |

**User's choice:** Store in profiles table (Recommended)
**Notes:** activity_level enum: low/medium/high. Part of profile data.

---

## TDEE UI Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below BMI on profile page (Recommended) | Add TDEE section below BMI result on /profile page. Activity level selector + TDEE range + calorie target. One page for all body metrics. | ✓ |
| Separate /tdee page | Separate /tdee page. Profile page stays focused on body metrics, TDEE page for calorie planning. | |

**User's choice:** Below BMI on profile page (Recommended)
**Notes:** Single page experience. TDEE section appears below BMI result after profile save.

---

## Goal Calorie Adjustments

| Option | Description | Selected |
|--------|-------------|----------|
| -500 / 0 / +300 (Recommended) | lose_weight: -500 kcal/day, maintain: 0, gain_weight: +300 kcal/day. Standard recommendations. | ✓ |
| -300 / 0 / +500 | lose_weight: -300 kcal/day (gentler), maintain: 0, gain_weight: +500 kcal/day. | |
| -500 / 0 / +500 | lose_weight: -500, maintain: 0, gain_weight: +500. Symmetric adjustments. | |

**User's choice:** -500 / 0 / +300 (Recommended)
**Notes:** Standard recommendations. Weight loss deficit larger than gain surplus.

---

## Range Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| ±10% of TDEE (Recommended) | TDEE ±10% (e.g., BMR×1.55 = 2000 → range 1800-2200). Research-backed, accounts for formula inaccuracy. | ✓ |
| ±200 kcal fixed | Fixed ±200 kcal range (e.g., 1800-2200). Simple, easy to understand. | |
| Number + range text | Display as 'sekitar X kalori (Y-Z)' in Indonesian. Both number and range shown. | |

**User's choice:** ±10% of TDEE (Recommended)
**Notes:** Range accounts for Mifflin-St Jeor formula inaccuracy. Same disclaimer as BMI.

---

## Activity Levels

| Option | Description | Selected |
|--------|-------------|----------|
| 5 standard levels (Recommended) | Sedentary (1.2), Light (1.375), Moderate (1.55), Active (1.725), Very Active (1.9). Standard 5 levels with Mifflin-St Jeor multipliers. | |
| 3 simplified levels | Low (1.2), Medium (1.55), High (1.9). Simplified 3 levels for easier user choice. | ✓ |

**User's choice:** 3 simplified levels
**Notes:**
- low: 1.2 — "Jarang berolahraga, pekerjaan duduk"
- medium: 1.55 — "Olahraga 3-5x per minggu"
- high: 1.9 — "Olahraga intensif setiap hari"

---

## the agent's Discretion

- Exact Indonesian text for activity level descriptions
- Whether to recalculate TDEE on profile update (recommendation: yes, auto-recalculate)
- Exact UI layout for TDEE section (follows BMI section pattern)
- Whether to show BMR separately or only TDEE (recommendation: show both for transparency)

## Deferred Ideas

- TDEE history tracking — belongs in future phase
- Custom activity multiplier input — not in v1 requirements
- Macro-based calorie splitting (protein/carbs/fat) — v2 feature (NUTR-01, NUTR-02)
- Meal plan generation based on calorie target — future phase
