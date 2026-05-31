# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-31 (v1.6 Activity Planner Rework added)
**Phases:** 29 complete, 4 planned (v1.0-v1.6)
**Milestones:** 6 shipped

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-05-17)
- ✅ **v1.1 International Ingredient Logging** — Phases 6-8 (shipped 2026-05-18)
- ✅ **v1.2 Supabase Migration** — Phases 9-12 (shipped 2026-05-28)
- ✅ **v1.3 Activity Tracking & Smart Suggestions** — Phases 13-17 (shipped 2026-05-31)
- ✅ **v1.4 LLM Food Recommendations** — Phases 18-23 (shipped 2026-05-31)
- ✅ **v1.5 Smart Auto-Logging** — Phases 24-29 (shipped 2026-05-31)
- 🚧 **v1.6 Activity Planner Rework** — Phases 30-33 (in progress)

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

### 🚧 v1.6 Activity Planner Rework (In Progress)

**Milestone Goal:** Overhaul activity planning to support variable-day weekly schedules with rest days, LLM-driven activity selection based on user profile, and per-activity swapping.

- [ ] **Phase 30: Prompt & Validation Rework** — Update prompts and validation for variable-day plans, profile-driven selection, and format_version (2 plans)
- [ ] **Phase 31: Activity Swap Endpoint** — Backend swap endpoint with dedicated rate limiter and merge-into-cache logic
- [ ] **Phase 32: Frontend — Days Selector & Swap UI** — Days selector in plan generation form, swap buttons on activity cards
- [ ] **Phase 33: Plan Migration & Edge Cases** — Lazy regeneration of old-format plans, edge case handling

## Phase Details

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
- [ ] 30-01-PLAN.md — Core prompts & service (weekly-plan-prompt.md, llm.service.js validation/generation)
- [ ] 30-02-PLAN.md — Controller wiring & tests (availableDays passthrough, test coverage)

### Phase 31: Activity Swap Endpoint
**Goal**: Users can swap a single activity via dedicated backend endpoint with rate limiting
**Depends on**: Phase 30
**Requirements**: SWAP-02, SWAP-03, SWAP-04
**Success Criteria** (what must be TRUE):
  1. User can request a swap for a specific activity via API and receive a replacement
  2. LLM returns a contextually appropriate replacement activity
  3. Swapped activity merges into the cached plan in-place without full regeneration
  4. Swap requests are rate-limited independently from generate/regenerate
**Plans**: TBD

### Phase 32: Frontend — Days Selector & Swap UI
**Goal**: Users can configure available days before generating and swap activities from the plan view
**Depends on**: Phase 31
**Requirements**: SCHD-01, SCHD-03, SWAP-01
**Success Criteria** (what must be TRUE):
  1. User can select 4-6 available days from a visual selector in the plan generation form
  2. Rest days display as dedicated rest day cards in the weekly plan view
  3. Each activity has a visible Swap button
  4. Swap initiates a mutation with loading state and updates the activity in-place on success
**Plans**: TBD
**UI hint**: yes

### Phase 33: Plan Migration & Edge Cases
**Goal**: Existing old-format plans migrate seamlessly; edge cases handled gracefully
**Depends on**: Phase 32
**Requirements**: MIGR-01
**Success Criteria** (what must be TRUE):
  1. Old-format 7-day plans automatically regenerate with variable-day format on user's next visit
  2. Migration is transparent — no data loss, no visible errors
  3. Swap edge cases (nonexistent activity ID, already-swapped activity) display appropriate error messages
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
| 30. Prompt & Validation Rework | v1.6 | 0/2 | Not started | - |
| 31. Activity Swap Endpoint | v1.6 | 0/0 | Not started | - |
| 32. Frontend — Days Selector & Swap UI | v1.6 | 0/0 | Not started | - |
| 33. Plan Migration & Edge Cases | v1.6 | 0/0 | Not started | - |


---

*Roadmap created: 2026-05-17*
*Last updated: 2026-05-31 (v1.6 Activity Planner Rework added)*
