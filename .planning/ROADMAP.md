# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-28 (v1.2 Supabase Migration shipped)
**Phases:** 12 complete (v1.1 + v1.2)
**Milestones:** 2 shipped (v1.1, v1.2)

## Milestones

- ✅ **v1.1 International Ingredient Logging** — Phases 1-8 (shipped 2026-05-18)
- ✅ **v1.2 Supabase Migration** — Phases 9-12 (shipped 2026-05-28)

## Phases

<details>
<summary>✅ v1.1 International Ingredient Logging (Phases 1-8) — SHIPPED 2026-05-18</summary>

- [x] Phase 1: Foundation & Authentication (3/3 plans) — completed 2026-05-17
- [x] Phase 2: Profile & BMI Calculator (2/2 plans) — completed 2026-05-17
- [x] Phase 3: TDEE Calculator & Goals (2/2 plans) — completed 2026-05-17
- [x] Phase 4: Food Database & Calorie Logging (3/3 plans) — completed 2026-05-17
- [x] Phase 5: Activity Recommendations & Polish (4/4 plans) — completed 2026-05-17
- [x] Phase 6: International Ingredient Database (3/3 plans) — completed 2026-05-18
- [x] Phase 7: Ingredient Logging & Calorie Calculation (3/3 plans) — completed 2026-05-18
- [x] Phase 8: English UI Migration (3/3 plans) — completed 2026-05-18

</details>

<details>
<summary>✅ v1.2 Supabase Migration (Phases 9-12) — SHIPPED 2026-05-28</summary>

- [x] **Phase 9: Supabase Setup & Schema Migration** — Create Supabase project, migrate schema and seed data from MySQL to PostgreSQL (completed 2026-05-27)
- [x] **Phase 10: Backend Query Rewrite** — Replace mysql2 with pg driver, translate all queries to PostgreSQL syntax (completed 2026-05-28)
- [x] **Phase 11: Docker Restructure** — Single multi-stage container serving both frontend and backend (completed 2026-05-28)
- [x] **Phase 12: Testing & Validation** — Integration tests and full-stack smoke tests against Supabase (completed 2026-05-28)

</details>

### 🚧 v1.3 Activity Tracking & Smart Suggestions (Phases 13-17)

**Milestone Goal:** Users can log physical activities with duration/intensity, view daily calorie balance including exercise, and receive personalized LLM-generated weekly activity plans.

- [x] **Phase 13: Database Schema & Foundation** — Create activity_logs and weekly_plans tables, install new npm packages (completed 2026-05-29)
- [x] **Phase 14: Activity Logger** — Full feature: log, view history, delete, daily net calorie summary (completed 2026-05-29)
- [ ] **Phase 15: LLM Backend Integration** — OpenRouter integration with caching, rate limiting, fallback, output validation
- [ ] **Phase 16: Weekly Plan Frontend** — Day-by-day plan cards, single-day regeneration with rate-limit UX
- [ ] **Phase 17: Testing & Polish** — Integration tests with mocks, edge case handling, UAT verification

## Phase Details

### Phase 13: Database Schema & Foundation
**Goal**: New database tables and npm packages are ready for activity tracking and LLM features
**Depends on**: Phase 12 (completed)
**Requirements**: (infrastructure — no direct user-facing requirements)
**Success Criteria** (what must be TRUE):
  1. `activity_logs` table exists with columns: id, user_id, activity_id, duration_min, intensity (ENUM), logged_date, created_at, with FK to activities and users
  2. `weekly_plans` table exists with JSONB `plan_data` column and UNIQUE constraint on (user_id, week_start)
  3. `intensity_level` ENUM exists with values: light, moderate, vigorous
  4. Old `user_activity_log` table is cleanly dropped (data loss acceptable — seed-only data)
  5. `openai@^6.1.0` and `node-cache@^5.1.2` install without dependency conflicts and are importable
**Plans**: TBD

### Phase 14: Activity Logger
**Goal**: Users can log activities, view history, delete entries, and see daily net calorie summary including exercise
**Depends on**: Phase 13
**Requirements**: ACT-01, ACT-02, ACT-03, ACT-04
**Success Criteria** (what must be TRUE):
   1. User can log an activity by selecting from the existing activity database, entering duration in minutes, and choosing intensity level (light/moderate/vigorous)
   2. User can view their activity history list showing date, activity name, duration, intensity, and calculated calories burned
   3. User can delete any logged activity from their history
   4. Daily summary shows total active minutes, total calories burned, and net calorie display (consumed − burned vs TDEE target)
**Plans**: 1 (12 tasks)
**UI hint**: yes

### Phase 15: LLM Backend Integration
**Goal**: System can generate personalized weekly activity plans via OpenRouter with caching, rate limiting, API key management, and graceful fallback
**Depends on**: Phase 14 (LLM needs recent activity history as context)
**Requirements**: LLM-01, LLM-04, LLM-05
**Success Criteria** (what must be TRUE):
   1. System generates a personalized weekly plan from OpenRouter using user's profile (weight, goals, activity level) and recent history, selecting only from existing database activities
  2. API keys are managed via environment variable with startup validation (missing key → clear error, not silent failure)
  3. Rate limiting enforced at 5 requests per 15 minutes with informative error responses including retry-after header
   4. System gracefully falls back to the most recent cached plan (from `weekly_plans` table) or returns a clear "plan unavailable" message when OpenRouter is unreachable or returns invalid responses
  5. Output validation ensures every suggested activity in the plan actually exists in the database — invalid entries are rejected and trigger a regeneration attempt (up to configured retries)
**Plans**: TBD

### Phase 16: Weekly Plan Frontend
**Goal**: Users can view their weekly plan as day-by-day cards and request regeneration of individual days
**Depends on**: Phase 15
**Requirements**: LLM-02, LLM-03
**Success Criteria** (what must be TRUE):
  1. User can view their weekly plan as day-by-day cards (Mon-Sun) showing suggested activities with name, duration, and intensity for each day
  2. User can request to regenerate a single day/card from the weekly plan
  3. Frontend displays clear rate-limit messaging with countdown when regeneration limit (5/15min) is hit
  4. Frontend shows appropriate loading states during generation and graceful fallback display when no plan exists or plan generation fails
**Plans**: TBD
**UI hint**: yes

### Phase 17: Testing & Polish
**Goal**: All v1.3 features are verified with integration tests, edge cases are handled, and UAT criteria confirmed
**Depends on**: Phase 14, Phase 16 (all features complete)
**Requirements**: (quality gate — no direct user-facing requirements)
**Success Criteria** (what must be TRUE):
  1. Activity Logger integration tests pass (log activity, list history, delete entry, daily summary with net calories)
   2. LLM integration tests pass with mocked OpenRouter responses (generation, caching, fallback, rate limiting, output validation)
  3. All new UI components render correctly in loading, empty, error, and success states
  4. Full-stack smoke test completes without errors, covering activity logging and weekly plan features
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Database Schema & Foundation | 1/1 | Complete   | 2026-05-29 |
| 14. Activity Logger | 1/1 | Complete   | 2026-05-29 |
| 15. LLM Backend Integration | 0/0 | Not started | - |
| 16. Weekly Plan Frontend | 0/0 | Not started | - |
| 17. Testing & Polish | 0/0 | Not started | - |

---
*Roadmap created: 2026-05-17*
*Last updated: 2026-05-29 (v1.3 Activity Tracking & Smart Suggestions phases defined)*
