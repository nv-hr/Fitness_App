# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-31 (v1.3 Testing & Polish complete)
**Phases:** 17 complete (v1.1 + v1.2 + v1.3)
**Milestones:** 3 shipped (v1.1, v1.2, v1.3)

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

<details>
<summary>✅ v1.3 Activity Tracking & Smart Suggestions (Phases 13-17) — SHIPPED 2026-05-31</summary>

- [x] **Phase 13: Database Schema & Foundation** — Create activity_logs and weekly_plans tables, install new npm packages (completed 2026-05-29)
- [x] **Phase 14: Activity Logger** — Full feature: log, view history, delete, daily net calorie summary (completed 2026-05-29)
- [x] **Phase 15: LLM Backend Integration** — OpenRouter integration with caching, rate limiting, fallback, output validation (completed 2026-05-29)
- [x] **Phase 16: Weekly Plan Frontend** — Day-by-day plan cards, single-day regeneration with rate-limit UX (3/3 plans complete)
- [x] **Phase 17: Testing & Polish** — Integration tests with mocks, edge case handling, UAT verification (1/1 plan complete — Activity Logger 14 integ tests, LLM 39 unit tests, 10 frontend component tests)

</details>

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Database Schema & Foundation | 1/1 | Complete   | 2026-05-29 |
| 14. Activity Logger | 1/1 | Complete   | 2026-05-29 |
| 15. LLM Backend Integration | 3/3 | Complete   | 2026-05-29 |
| 16. Weekly Plan Frontend | 3/3 | Complete   | 2026-05-30 |
| 17. Testing & Polish | 1/1 | Complete   | 2026-05-31 |

---
*Roadmap created: 2026-05-17*
*Last updated: 2026-05-30 (Phase 16 Plans 01 + 02 complete)*
