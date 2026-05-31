# Requirements: Fitness_App

**Defined:** 2026-05-31
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.7 Requirements

Requirements for milestone v1.7 Calendar-Based Plan UI. Each maps to roadmap phases.

### Calendar Foundation

- [ ] **CAL-FND-01**: Month calendar grid renders using CSS Grid with day cells for all days in the current month
- [ ] **CAL-FND-02**: Day cells are color-coded: blue for incomplete/planned, green for all completed, grey for past incomplete days
- [ ] **CAL-FND-03**: Month navigation with prev/next month arrow buttons
- [ ] **CAL-FND-04**: Clicking a day cell selects it and populates the detail panel below
- [ ] **CAL-FND-05**: Calendar defaults to showing today's date on page load
- [ ] **CAL-FND-06**: Calendar utility functions compute day status client-side from existing plan endpoints (5-6 weekly plan fetches per month range)
- [ ] **CAL-FND-07**: "Today" visual indicator on the current day cell
- [ ] **CAL-FND-08**: CalendarPageLayout component wraps CalendarGrid + DayDetailPanel

### Activity Calendar

- [ ] **CAL-ACT-01**: Activity Calendar page at `/activity-calendar` route with CalendarGrid and ActivityDayDetail panel
- [ ] **CAL-ACT-02**: Day detail panel shows planned activities for selected day using existing DayActivityRow components
- [ ] **CAL-ACT-03**: Per-activity swap button in day detail panel (existing LLM swap interaction preserved)
- [ ] **CAL-ACT-04**: Completion toggle on each activity item in the detail panel
- [ ] **CAL-ACT-05**: Generate Week button above the calendar generates a weekly activity plan
- [ ] **CAL-ACT-06**: Auto-generate weekly plan when viewing today if no plan exists (gated — does not fire on month navigation)
- [ ] **CAL-ACT-07**: Past day detail panel is read-only (grey, no interactions)

### Meal Calendar

- [ ] **CAL-MEA-01**: Meal Calendar page at `/meal-calendar` route with CalendarGrid and MealDayDetail panel
- [ ] **CAL-MEA-02**: Day detail panel shows planned meals for selected day using existing MealRow components
- [ ] **CAL-MEA-03**: One-click log meal action in day detail panel (existing interaction preserved)
- [ ] **CAL-MEA-04**: Generate Day button above the calendar generates a daily meal plan
- [ ] **CAL-MEA-05**: Auto-generate daily meal plan when viewing today if no plan exists (gated — does not fire on month navigation)
- [ ] **CAL-MEA-06**: Past day detail panel is read-only (grey, no interactions)

### Cleanup

- [ ] **CAL-CLN-01**: Remove old ActivityPlanSection and WeeklyPlanPage component
- [ ] **CAL-CLN-02**: Remove old DailyMealPlanSection and MealPlanPage component
- [ ] **CAL-CLN-03**: Remove old DayCard, DayMealCard, and deprecated interaction components
- [ ] **CAL-CLN-04**: Update dashboard navigation links to point to new calendar pages
- [ ] **CAL-CLN-05**: Remove old page tests; add equivalent calendar tests matching coverage
- [ ] **CAL-CLN-06**: Verify all CAL requirements are met end-to-end

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Calendar Enhancements

- **CAL-ENH-01**: Week view toggle alongside month view
- **CAL-ENH-02**: Drag-and-drop activity/meal planning
- **CAL-ENH-03**: Activity/meal history export from calendar view

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend API changes | All data fetched from existing endpoints |
| Third-party calendar library | Custom CSS Grid + date-fns is sufficient for day-status model |
| Custom activity entry in calendar | Existing pages handle this |
| Edit past logged activities | Past days are read-only by design |
| Week view | Only month view for this milestone |
| Combined activity+meal calendar | Two separate pages as specified |
| Notifications/reminders | Out of scope for calendar UI milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAL-FND-01 | | Pending |
| CAL-FND-02 | | Pending |
| CAL-FND-03 | | Pending |
| CAL-FND-04 | | Pending |
| CAL-FND-05 | | Pending |
| CAL-FND-06 | | Pending |
| CAL-FND-07 | | Pending |
| CAL-FND-08 | | Pending |
| CAL-ACT-01 | | Pending |
| CAL-ACT-02 | | Pending |
| CAL-ACT-03 | | Pending |
| CAL-ACT-04 | | Pending |
| CAL-ACT-05 | | Pending |
| CAL-ACT-06 | | Pending |
| CAL-ACT-07 | | Pending |
| CAL-MEA-01 | | Pending |
| CAL-MEA-02 | | Pending |
| CAL-MEA-03 | | Pending |
| CAL-MEA-04 | | Pending |
| CAL-MEA-05 | | Pending |
| CAL-MEA-06 | | Pending |
| CAL-CLN-01 | | Pending |
| CAL-CLN-02 | | Pending |
| CAL-CLN-03 | | Pending |
| CAL-CLN-04 | | Pending |
| CAL-CLN-05 | | Pending |
| CAL-CLN-06 | | Pending |

**Coverage:**
- v1.7 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after initial definition*
