# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-31 (v1.7 planning)
**Phases:** 33 complete, 4 planned
**Milestones:** 6 shipped, 1 in progress

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-05-17)
- ✅ **v1.1 International Ingredient Logging** — Phases 6-8 (shipped 2026-05-18)
- ✅ **v1.2 Supabase Migration** — Phases 9-12 (shipped 2026-05-28)
- ✅ **v1.3 Activity Tracking & Smart Suggestions** — Phases 13-17 (shipped 2026-05-31)
- ✅ **v1.4 LLM Food Recommendations** — Phases 18-23 (shipped 2026-05-31)
- ✅ **v1.5 Smart Auto-Logging** — Phases 24-29 (shipped 2026-05-31)
- ✅ **v1.6 Activity Planner Rework** — Phases 30-33 (shipped 2026-05-31)
- 🔄 **v1.7 Calendar-Based Plan UI** — Phases 34-37 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-05-17</summary>

- [x] Phase 1: Foundation & Authentication (3/3 plans) — completed 2026-05-17
- [x] Phase 2: Profile & BMI Calculator (2/2 plans) — completed 2026-05-17
- [x] Phase 3: TDEE Calculator & Goals (2/2 plans) — completed 2026-05-17
- [x] Phase 4: Food Database & Calorie Logging (3/3 plans) — completed 2026-05-17
- [x] Phase 5: Activity Recommendations & Polish (4/4 plans) — completed 2026-05-17

</details>

<details>
<summary>✅ v1.1 International Ingredient Logging (Phases 6-8) — SHIPPED 2026-05-18</summary>

- [x] Phase 6: International Ingredient Database (3/3 plans) — completed 2026-05-18
- [x] Phase 7: Ingredient Logging & Calorie Calculation (3/3 plans) — completed 2026-05-18
- [x] Phase 8: English UI Migration (3/3 plans) — completed 2026-05-18

</details>

<details>
<summary>✅ v1.2 Supabase Migration (Phases 9-12) — SHIPPED 2026-05-28</summary>

- [x] Phase 9: Supabase Setup & Schema Migration — completed 2026-05-27
- [x] Phase 10: Backend Query Rewrite — completed 2026-05-28
- [x] Phase 11: Docker Restructure — completed 2026-05-28
- [x] Phase 12: Testing & Validation — completed 2026-05-28

</details>

<details>
<summary>✅ v1.3 Activity Tracking & Smart Suggestions (Phases 13-17) — SHIPPED 2026-05-31</summary>

- [x] Phase 13: Database Schema & Foundation (1/1 plan) — completed 2026-05-29
- [x] Phase 14: Activity Logger (1/1 plan) — completed 2026-05-29
- [x] Phase 15: LLM Backend Integration (3/3 plans) — completed 2026-05-29
- [x] Phase 16: Weekly Plan Frontend (3/3 plans) — completed 2026-05-30
- [x] Phase 17: Testing & Polish (1/1 plan) — completed 2026-05-31

</details>

<details>
<summary>✅ v1.4 LLM Food Recommendations (Phases 18-23) — SHIPPED 2026-05-31</summary>

- [x] Phase 18: Database & Prompt Foundation (1/1 plan) — completed 2026-05-31
- [x] Phase 19: Core Meal Plan Service (1/1 plan) — completed 2026-05-31
- [x] Phase 20: Batch Log Integration (1/1 plan) — completed 2026-05-31
- [x] Phase 21: Backend API Layer (1/1 plan) — completed 2026-05-31
- [x] Phase 22: Meal Plan Frontend (1/1 plan) — completed 2026-05-31
- [x] Phase 23: Testing & Edge Cases (1/1 plan) — completed 2026-05-31

</details>

<details>
<summary>✅ v1.5 Smart Auto-Logging (Phases 24-29) — SHIPPED 2026-05-31</summary>

- [x] Phase 24: Activity Plan Backend (2/2 plans) — completed 2026-05-31
- [x] Phase 25: Activity Plan Logging (1/1 plan) — completed 2026-05-31
- [x] Phase 26: 3-Day Meal Plan Backend (1/1 plan) — completed 2026-05-31
- [x] Phase 27: Meal Plan Logging (1/1 plan) — completed 2026-05-31
- [x] Phase 28: Auto-Generation & Inline Management (1/1 plan) — completed 2026-05-31
- [x] Phase 29: UI Consolidation (1/1 plan) — completed 2026-05-31

</details>

<details>
<summary>✅ v1.6 Activity Planner Rework (Phases 30-33) — SHIPPED 2026-05-31</summary>

- [x] Phase 30: Prompt & Validation Rework (2/2 plans) — completed 2026-05-31
- [x] Phase 31: Activity Swap Endpoint (2/2 plans) — completed 2026-05-31
- [x] Phase 32: Frontend — Days Selector & Swap UI (2/2 plans) — completed 2026-05-31
- [x] Phase 33: Plan Migration & Edge Cases (2/2 plans) — completed 2026-05-31

</details>

<details open>
<summary>🔄 v1.7 Calendar-Based Plan UI (Phases 34-37) — IN PROGRESS</summary>

- [x] Phase 34: Calendar Shared Components — 2/2 plans (33 tests)
- [ ] Phase 35: Activity Calendar Page — 0/0 plans
- [ ] Phase 36: Meal Calendar Page — 0/0 plans
- [ ] Phase 37: Cleanup — Remove Old Components & Update Nav — 0/0 plans

</details>

### Next Milestone: v1.7 Calendar-Based Plan UI

### Phase 30: Prompt & Validation Rework
**Goal**: LLM generates variable-day plans with profile-driven activity selection and rest days
**Depends on**: Phase 29
**Requirements**: SCHD-02, PROF-01, PROF-02, PROF-03, MIGR-02
**Success Criteria** (what must be TRUE):
  1. Generated plans respect the availableDays parameter — exactly N activity days (4-6) with remaining days as rest
  2. Plan activities reflect the user's fitness goal (lose weight / maintain / build muscle)
  3. Activity duration and intensity scale with user's activity level
  4. Multiple activities per day are assigned when user profile supports it
  5. All plan_data includes format_version field distinguishing old vs new format
**Plans**: 2 plans

Plans:
- [x] 30-01-PLAN.md — Core prompts & service (weekly-plan-prompt.md, llm.service.js validation/generation) — completed 2026-05-31
- [x] 30-02-PLAN.md — Controller wiring & tests (availableDays passthrough, test coverage) — completed 2026-05-31

### Phase 31: Activity Swap Endpoint
**Goal**: Users can swap a single activity via dedicated backend endpoint with rate limiting
**Depends on**: Phase 30
**Requirements**: SWAP-02, SWAP-03, SWAP-04
**Success Criteria** (what must be TRUE):
  1. User can request a swap for a specific activity via API and receive a replacement
  2. LLM returns a contextually appropriate replacement activity
  3. Swapped activity merges into the cached plan in-place without full regeneration
  4. Swap requests are rate-limited independently from generate/regenerate
**Plans**: 2 plans

Plans:
- [x] 31-01-PLAN.md — Core service & prompt (activity-swap-prompt.md, swapActivity(), swapLimiter) — completed 2026-05-31
- [x] 31-02-PLAN.md — Controller, route, DB persistence & tests (swapHandler, POST /swap, upsertPlan, E2E) — completed 2026-05-31

### Phase 32: Frontend — Days Selector & Swap UI
**Goal**: Users can configure available days before generating and swap activities from the plan view
**Depends on**: Phase 31
**Requirements**: SCHD-01, SCHD-03, SWAP-01
**Success Criteria** (what must be TRUE):
  1. User can select 4-6 available days from a visual selector in the plan generation form
  2. Rest days display as dedicated rest day cards in the weekly plan view
  3. Each activity has a visible Swap button
  4. Swap initiates a mutation with loading state and updates the activity in-place on success
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 32-01-PLAN.md — Toast component & API layer (swapActivity, availableDays in generateWeeklyPlan) — completed 2026-05-31
- [x] 32-02-PLAN.md — Days selector panel, rest day cards, swap button, WeeklyPlanPage wiring — completed 2026-05-31

### Phase 33: Plan Migration & Edge Cases
**Goal**: Existing old-format plans migrate seamlessly; edge cases handled gracefully
**Depends on**: Phase 32
**Requirements**: MIGR-01
**Success Criteria** (what must be TRUE):
   1. Old-format 7-day plans automatically regenerate with variable-day format on user's next visit
   2. Migration is transparent — no data loss, no visible errors
   3. Swap edge cases (nonexistent activity ID, already-swapped activity) display appropriate error messages
**Plans**: 2 plans

Plans:
- [x] 33-01-PLAN.md — Lazy migration (GET + swapHandler) + 404 fix for nonexistent activityId — completed 2026-05-31
- [x] 33-02-PLAN.md — Unit + E2E tests for migration flows and swap edge cases — completed 2026-05-31

### Phase 34: Calendar Shared Components
**Goal**: Shared month-grid calendar foundation — CalendarGrid, DayCell, MonthNav, CalendarPageLayout, DayDetailPanel, and calendar utility functions
**Depends on**: Phase 33
**Requirements**: CAL-FND-01, CAL-FND-02, CAL-FND-03, CAL-FND-04, CAL-FND-05, CAL-FND-06, CAL-FND-07, CAL-FND-08
**Success Criteria** (what must be TRUE):
   1. CalendarGrid renders a 7-column CSS grid showing all days of the current month with correct day numbers and weekday headers
   2. Day cells display color coding: blue for incomplete/planned, green for completed, grey for past incomplete days, with a "Today" visual indicator on the current day
   3. Users can navigate between months using prev/next arrow buttons, and CalendarGrid renders the correct month after navigation
   4. Clicking any day cell selects it and populates the CalendarPageLayout's detail panel slot with day information
   5. calendarUtils correctly compute day status from plan data via getWeekStartsForMonth(), buildMonthGrid(), and computeDayStatus() — verified by unit tests
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 34-01-PLAN.md — Calendar utilities + CalendarGrid + MonthNav — completed 2026-05-31
- [x] 34-02-PLAN.md — CalendarPageLayout + DayDetailPanel + useMonthData hook + tests — completed 2026-05-31

### Phase 35: Activity Calendar Page
**Goal**: Users can browse, generate, and manage weekly activity plans through a calendar-driven interface
**Depends on**: Phase 34
**Requirements**: CAL-ACT-01, CAL-ACT-02, CAL-ACT-03, CAL-ACT-04, CAL-ACT-05, CAL-ACT-06, CAL-ACT-07
**Success Criteria** (what must be TRUE):
   1. Activity Calendar page at `/activity-calendar` renders CalendarGrid with activity completion status per day using the shared calendar components
   2. Clicking a day opens the detail panel showing planned activities using DayActivityRow — each with swap button and completion toggle
   3. Generate Week button above the calendar generates a weekly activity plan with loading state feedback
   4. Auto-generate creates a weekly plan when viewing today with no existing plan (gated — does not fire on month navigation, uses ref guard)
   5. Past days show grey detail panel with read-only display (no swap, no toggle, no clickable interactions)
**Plans**: TBD
**UI hint**: yes

### Phase 36: Meal Calendar Page
**Goal**: Users can browse, generate, and log daily meal plans through a calendar-driven interface
**Depends on**: Phase 35
**Requirements**: CAL-MEA-01, CAL-MEA-02, CAL-MEA-03, CAL-MEA-04, CAL-MEA-05, CAL-MEA-06
**Success Criteria** (what must be TRUE):
   1. Meal Calendar page at `/meal-calendar` renders CalendarGrid with meal logging status per day using the shared calendar components
   2. Clicking a day opens the detail panel showing planned meals using MealRow — each with one-click log action
   3. Generate Day button above the calendar generates a daily meal plan with loading state feedback
   4. Auto-generate creates a daily meal plan when viewing today with no existing plan (gated — does not fire on month navigation, uses ref guard)
   5. Past days show grey detail panel with read-only display (no log actions, no clickable interactions)
**Plans**: TBD
**UI hint**: yes

### Phase 37: Cleanup — Remove Old Components & Update Navigation
**Goal**: Old section-based plan components are removed, navigation updated to calendar pages, and test coverage validated
**Depends on**: Phase 36
**Requirements**: CAL-CLN-01, CAL-CLN-02, CAL-CLN-03, CAL-CLN-04, CAL-CLN-05, CAL-CLN-06
**Success Criteria** (what must be TRUE):
   1. Old ActivityPlanSection, WeeklyPlanPage, and DayCard components are removed with zero remaining import references (verified by glob search)
   2. Old DailyMealPlanSection, MealPlanPage, and DayMealCard components are removed with zero remaining import references (verified by glob search)
   3. Dashboard/menu navigation links point to `/activity-calendar` and `/meal-calendar` instead of old page routes
   4. Old page-specific tests are removed; equivalent calendar tests exist matching or exceeding previous coverage
   5. All 27 CAL requirements pass end-to-end verification — both calendar pages functional, no dead imports
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation & Authentication | v1.0 | 3/3 | Complete | 2026-05-17 |
| 2. Profile & BMI Calculator | v1.0 | 2/2 | Complete | 2026-05-17 |
| 3. TDEE Calculator & Goals | v1.0 | 2/2 | Complete | 2026-05-17 |
| 4. Food Database & Calorie Logging | v1.0 | 3/3 | Complete | 2026-05-17 |
| 5. Activity Recommendations & Polish | v1.0 | 4/4 | Complete | 2026-05-17 |
| 6. International Ingredient Database | v1.1 | 3/3 | Complete | 2026-05-18 |
| 7. Ingredient Logging & Calorie Calculation | v1.1 | 3/3 | Complete | 2026-05-18 |
| 8. English UI Migration | v1.1 | 3/3 | Complete | 2026-05-18 |
| 9. Supabase Setup & Schema Migration | v1.2 | 1/1 | Complete | 2026-05-27 |
| 10. Backend Query Rewrite | v1.2 | 1/1 | Complete | 2026-05-28 |
| 11. Docker Restructure | v1.2 | 1/1 | Complete | 2026-05-28 |
| 12. Testing & Validation | v1.2 | 1/1 | Complete | 2026-05-28 |
| 13. Database Schema & Foundation | v1.3 | 1/1 | Complete | 2026-05-29 |
| 14. Activity Logger | v1.3 | 1/1 | Complete | 2026-05-29 |
| 15. LLM Backend Integration | v1.3 | 3/3 | Complete | 2026-05-29 |
| 16. Weekly Plan Frontend | v1.3 | 3/3 | Complete | 2026-05-30 |
| 17. Testing & Polish | v1.3 | 1/1 | Complete | 2026-05-31 |
| 18. Database & Prompt Foundation | v1.4 | 1/1 | Complete | 2026-05-31 |
| 19. Core Meal Plan Service | v1.4 | 1/1 | Complete | 2026-05-31 |
| 20. Batch Log Integration | v1.4 | 1/1 | Complete | 2026-05-31 |
| 21. Backend API Layer | v1.4 | 1/1 | Complete | 2026-05-31 |
| 22. Meal Plan Frontend | v1.4 | 1/1 | Complete | 2026-05-31 |
| 23. Testing & Edge Cases | v1.4 | 1/1 | Complete | 2026-05-31 |
| 24. Activity Plan Backend | v1.5 | 2/2 | Complete | 2026-05-31 |
| 25. Activity Plan Logging | v1.5 | 1/1 | Complete | 2026-05-31 |
| 26. 3-Day Meal Plan Backend | v1.5 | 1/1 | Complete | 2026-05-31 |
| 27. Meal Plan Logging | v1.5 | 1/1 | Complete | 2026-05-31 |
| 28. Auto-Generation & Inline Management | v1.5 | 1/1 | Complete | 2026-05-31 |
| 29. UI Consolidation | v1.5 | 1/1 | Complete | 2026-05-31 |
| 30. Prompt & Validation Rework | v1.6 | 2/2 | Complete | 2026-05-31 |
| 31. Activity Swap Endpoint | v1.6 | 2/2 | Complete | 2026-05-31 |
| 32. Frontend — Days Selector & Swap UI | v1.6 | 2/2 | Complete | 2026-05-31 |
| 33. Plan Migration & Edge Cases | v1.6 | 2/2 | Complete | 2026-05-31 |
| 34. Calendar Shared Components | v1.7 | 2/2 | Complete | 2026-05-31 |
| 35. Activity Calendar Page | v1.7 | 0/0 | Not started | - |
| 36. Meal Calendar Page | v1.7 | 0/0 | Not started | - |
| 37. Cleanup — Remove Old Components & Update Nav | v1.7 | 0/0 | Not started | - |


---
*Roadmap created: 2026-05-17*
*Last updated: 2026-05-31 (v1.7 planning)*
