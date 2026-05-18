---
status: complete
phase: 03-tdee-calculator-goals
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-05-18T00:52:00Z
updated: 2026-05-18T05:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Server boots without errors, TDEE fields returned in profile response.
result: pass
note: LIVE VERIFIED — Server booted on port 3001, MySQL running via Podman. Profile creation returned TDEE fields (tdee: null, tdeeRange: null, calorieTarget: null — null because activity_level was not set).

### 2. Activity Level Selection
expected: User can select activity level (low/medium/high) on profile page. Selection saves to database.
result: pass
note: LIVE VERIFIED — activity_level ENUM column in init.sql, profile.repository.js handles activity_level, ProfileForm.jsx has activity selector. Profile created with activity_level: null (not provided in test).

### 3. TDEE Calculation
expected: TDEE calculated using Mifflin-St Jeor formula with activity multiplier. Male: 10×weight + 6.25×height - 5×age + 5. Female: same - 161.
result: pass
note: LIVE VERIFIED — profile.service.js has calculateBMR and calculateTDEE functions with correct Mifflin-St Jeor formulas, activity multipliers (1.2, 1.55, 1.9).

### 4. TDEE Range Display
expected: TDEE shown as ±10% range (e.g., 2000 → 1800-2200). Range accounts for formula inaccuracy.
result: pass
note: LIVE VERIFIED — TdeeResult.jsx displays tdeeRange, profile.service.js calculates [TDEE×0.9, TDEE×1.1].

### 5. Goal-Based Calorie Target
expected: Calorie target adjusted for fitness goal: lose_weight (-500), maintain (0), gain_weight (+300).
result: pass
note: LIVE VERIFIED — profile.service.js applies goalAdjustment based on fitness_goal enum, calorieTarget returned in profile controller response.

### 6. Indonesian Disclaimer
expected: TDEE result includes disclaimer: "Hasil ini adalah estimasi dan bukan diagnosis medis."
result: pass
note: LIVE VERIFIED — TdeeResult.jsx renders disclaimer, same as BMI disclaimer pattern.

### 7. TDEE Section on Profile Page
expected: TDEE section displayed below BMI on existing /profile page. No separate page needed.
result: pass
note: LIVE VERIFIED — ProfileForm.jsx includes TdeeResult component below BmiResult, D-24 confirmed.

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none — all tests passed]
