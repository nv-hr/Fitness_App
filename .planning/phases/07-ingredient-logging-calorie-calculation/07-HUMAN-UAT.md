---
status: partial
phase: 07-Ingredient Logging & Calorie Calculation
source: [07-VERIFICATION.md]
started: 2026-05-18T16:34:51.000Z
updated: 2026-05-18T16:34:51.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Live calorie preview UI
expected: User selects ingredient, types weight, sees "{portion}g = {calories} kkal" preview update in real-time below weight input. Preview hides when weight is empty or invalid.
result: [pending]

### 2. End-to-end server calculation
expected: After logging food with weight, database stores correct server-calculated calories (not client value). Verify via API response or database query.
result: [pending]

### 3. Custom ingredient creation flow
expected: Form renders with only name + calories per 100g fields (no category dropdown). After submission, custom ingredient appears in search results for that user.
result: [pending]

### 4. Quick-add portion pre-fill
expected: Recent foods list shows "Food name — terakhir: {portion}g". Clicking quick-add pre-fills weight with last logged portion (or 100g fallback).
result: [pending]

### 5. Daily calorie summary with TDEE
expected: Summary bar shows total consumed, calorie target from TDEE, remaining balance. Progress bar reflects consumed/target ratio. Extreme deficit warning shows below 1200 kcal.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
