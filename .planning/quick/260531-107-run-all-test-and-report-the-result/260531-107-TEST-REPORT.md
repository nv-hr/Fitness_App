# Test Report — 2026-05-30

## Summary

| Suite | Total | Passed | Failed | Skipped | Duration |
|-------|-------|--------|--------|---------|----------|
| Backend (Jest) | 134 | 134 | 0 | 0 | ~10.3s |
| Frontend (Vitest) | 126 | 101 | 0 | 25 | 1.04s |
| **Total** | **260** | **235** | **0** | **25** | **~11.3s** |

## Backend — Per-file Breakdown

| File | Result | Tests |
|------|--------|-------|
| tests/unit/auth.service.test.js | PASS | 10 |
| tests/unit/profile.service.test.js | PASS | 7 |
| tests/unit/food.service.test.js | PASS | 17 |
| tests/unit/activity.service.test.js | PASS | 32 |
| tests/unit/llm.service.test.js | PASS | 11 |
| tests/unit/dbErrors.test.js | PASS | 12 |
| tests/integration/api.test.js | PASS | 45 |
| **Total** | **7/7 passed** | **134** |

## Frontend — Per-file Breakdown

| File | Result | Tests | Skipped |
|------|--------|-------|---------|
| RateLimitedButton.test.jsx | PASS | 8 | 0 |
| ActivityLogForm.test.jsx | PASS | 12 | 0 |
| DayActivityRow.test.jsx | PASS | 6 | 0 |
| FallbackBanner.test.jsx | PASS | 6 | 0 |
| ActivitiesPage.test.jsx | PASS | 10 | 0 |
| WeeklyPlanPage.test.jsx | PASS | 10 | 0 |
| previewCalories.test.js | PASS | 12 | 0 |
| ActivityHistory.test.jsx | PASS | 7 | 0 |
| CustomFoodForm.test.js | PASS | 7 | 0 |
| DayCard.test.jsx | PASS | 7 | 0 |
| ActivitySummary.test.jsx | PASS | 9 | 0 |
| EmptyStatePlan.test.jsx | PASS | 7 | 0 |
| api-integration.test.js | SKIPPED | 0 | 25 |
| **Total** | **12 passed, 1 skipped** | **101** | **25** |

## Failures

**None.** All 235 executed tests passed. The 25 skipped tests in `api-integration.test.js` are intentionally disabled (integration tests skipped with `.skip`).

## Verdict

**ALL PASSED ✓** — 235 tests passed, 0 failures, 25 intentionally skipped across 20 test files (7 backend + 13 frontend).
