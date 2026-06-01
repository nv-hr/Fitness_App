# Requirements: Fitness_App

**Defined:** 2026-06-01
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.8 Requirements

### UI Consolidation — Activity Page

- [ ] **UI-ACT-01**: Activity page has "Plan" and "Log" tabs; Plan tab shows month calendar with color-coded days, Generate Week, per-day swap, completion toggle
- [ ] **UI-ACT-02**: Log tab shows manual activity entry form (type + duration + intensity), activity history list, and activity summary
- [ ] **UI-ACT-03**: Daily summary bar (active minutes, calories burned, net calories) displayed on both Plan and Log tabs
- [ ] **UI-ACT-04**: Auto-generation only fires when Plan tab is active; switching tabs does not re-trigger generation

### UI Consolidation — Food Log Page

- [ ] **UI-FOOD-01**: Food Log page has "Plan" and "Log" tabs; Plan tab shows month calendar with color-coded days, Generate Day, per-meal-type Log buttons
- [ ] **UI-FOOD-02**: Log tab shows ingredient search, weight input, manual log form with per-meal-type sections (breakfast, lunch, dinner, snack), and quick-add with last-portion pre-fill
- [ ] **UI-FOOD-03**: Daily summary bar (consumed vs TDEE target with progress bar) displayed on both Plan and Log tabs
- [ ] **UI-FOOD-04**: Auto-generation only fires when Plan tab is active; FoodLogPage becomes date-aware (selectedDate state, initializes to today)

### Route Cleanup

- [ ] **UI-ROUTE-01**: `/meal-calendar` route removed; navigates to `/food-log` redirect
- [ ] **UI-ROUTE-02**: Navigation links updated (DashboardPlaceholder, any sidebar/nav references)
- [ ] **UI-ROUTE-03**: PROJECT.md corrected — references `/activities` not `/activity-calendar`

### Test Restructuring

- [ ] **UI-TEST-01**: `MealCalendarPage.test.jsx` tests updated or replaced to reflect merged FoodLogPage structure
- [ ] **UI-TEST-02**: `ActivityCalendarPage.test.jsx` tests updated or replaced to reflect merged Activity page structure
- [ ] **UI-TEST-03**: All 33 shared calendar component tests continue to pass
- [ ] **UI-TEST-04**: Run full test suite (frontend + backend) with 0 failures before merge

## Future Requirements

Deferred to future milestone.

### Shared Date State

- **UI-FUTR-01**: Global "selected date" shared across Activity and Food Log pages (URL param or context)
- **UI-FUTR-02**: Swipe-between-days navigation gesture
- **UI-FUTR-03**: "Copy from yesterday" quick-entry for food log

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile-native gestures (swipe) | Web-first, adds complexity beyond "minimal" |
| Shared global date across pages | Deferred — out of scope for simple consolidation |
| One-click plan-to-log | Deferred from v1.7 — out of scope for consolidation |
| New backend endpoints | No backend changes needed — all APIs already accept date params |
| React 19 `<Activity>` component | Not verified against project's React version; tabs use display:none instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-ACT-01 | | Pending |
| UI-ACT-02 | | Pending |
| UI-ACT-03 | | Pending |
| UI-ACT-04 | | Pending |
| UI-FOOD-01 | | Pending |
| UI-FOOD-02 | | Pending |
| UI-FOOD-03 | | Pending |
| UI-FOOD-04 | | Pending |
| UI-ROUTE-01 | | Pending |
| UI-ROUTE-02 | | Pending |
| UI-ROUTE-03 | | Pending |
| UI-TEST-01 | | Pending |
| UI-TEST-02 | | Pending |
| UI-TEST-03 | | Pending |
| UI-TEST-04 | | Pending |

**Coverage:**
- v1.8 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-06-01*
*Last updated: 2026-06-01 after initial definition*
