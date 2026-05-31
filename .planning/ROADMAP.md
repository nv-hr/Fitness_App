# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-31 (v1.6 shipped)
**Phases:** 33 complete
**Milestones:** 7 shipped

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-05-17)
- ✅ **v1.1 International Ingredient Logging** — Phases 6-8 (shipped 2026-05-18)
- ✅ **v1.2 Supabase Migration** — Phases 9-12 (shipped 2026-05-28)
- ✅ **v1.3 Activity Tracking & Smart Suggestions** — Phases 13-17 (shipped 2026-05-31)
- ✅ **v1.4 LLM Food Recommendations** — Phases 18-23 (shipped 2026-05-31)
- ✅ **v1.5 Smart Auto-Logging** — Phases 24-29 (shipped 2026-05-31)
- ✅ **v1.6 Activity Planner Rework** — Phases 30-33 (shipped 2026-05-31)

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

### Next Milestone: TBD

*Next milestone to be defined via `/gsd-new-milestone`.*

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


---

*Roadmap created: 2026-05-17*
*Last updated: 2026-05-31 (v1.6 shipped)*
