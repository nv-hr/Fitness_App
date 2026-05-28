# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-27 (v1.2 Supabase Migration roadmap created)
**Phases:** 12 complete (v1.1 + v1.2)
**Milestones:** 1 shipped (v1.1), 1 active (v1.2)

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

### ✅ v1.2 Supabase Migration (Shipped 2026-05-28)

- [x] **Phase 9: Supabase Setup & Schema Migration** — Create Supabase project, migrate schema and seed data from MySQL to PostgreSQL (completed 2026-05-27)
- [x] **Phase 10: Backend Query Rewrite** — Replace mysql2 with pg driver, translate all queries to PostgreSQL syntax (completed 2026-05-28)
- [x] **Phase 11: Docker Restructure** — Single multi-stage container serving both frontend and backend (completed 2026-05-28)
- [x] **Phase 12: Testing & Validation** — Integration tests and full-stack smoke tests against Supabase (completed 2026-05-28)

## Phase Details

### Phase 9: Supabase Setup & Schema Migration
**Goal**: Supabase PostgreSQL database is ready with migrated schema, seed data, and verified connectivity
**Depends on**: Nothing (first v1.2 phase)
**Requirements**: SUP-01, SUP-02, SUP-03, SUP-04
**Success Criteria** (what must be TRUE):
  1. Supabase project is created and its PostgreSQL connection string (with password) is obtainable and working
  2. All MySQL tables (users, profiles, foods, food_logs, activities, activity_logs, custom_foods) are recreated in PostgreSQL with matching ENUMs, constraints, and indexes
  3. 201 food ingredients and 35 activities are seeded into the PostgreSQL database via SQL script or Supabase SQL Editor
  4. Backend can establish an SSL-encrypted connection to Supabase on startup and logs success/failure to the console
**Plans**: 3 plans

**Wave 1** *(parallel — no dependencies)*:
- [x] 09-01-PLAN.md — PostgreSQL Schema & Seed Translation (SUP-02, SUP-03)
- [x] 09-02-PLAN.md — Supabase CLI Setup & Connection Verify (SUP-01, SUP-04)

**Wave 2** *(blocked on Wave 1 completion)*:
- [x] 09-03-PLAN.md — Apply Migration & Verify Connectivity (SUP-02, SUP-03, SUP-04)

**Cross-cutting constraints:**
- SUP-02 (schema) and SUP-03 (seed) are split across Wave 1 (file creation) and Wave 2 (execution)
- SUP-04 (connection verify) is split across Wave 1 (script creation) and Wave 2 (execution)

### Phase 10: Backend Query Rewrite (pg migration)
**Goal**: All database queries use pg (node-postgres) driver with PostgreSQL-compatible syntax; no mysql2 dependency remains
**Depends on**: Phase 9 (Supabase must be accessible for testing)
**Requirements**: QRY-01, QRY-02, QRY-03, QRY-04, QRY-05
**Success Criteria** (what must be TRUE):
  1. mysql2 package is removed from package.json; pg is the only database driver
  2. database.js is rewritten with pg Pool using Supabase connection string (SSL-enabled)
  3. Food repository queries use $1 placeholders, RETURNING * for INSERT/UPDATE, and PostgreSQL-compatible JSON operators
  4. Profile and user repository queries use $1 placeholders and RETURNING * where applicable
  5. Activity repository JSON_OVERLAPS is replaced with ?| operator; all DATE_SUB and INTERVAL patterns are translated to PostgreSQL syntax
  6. No mysql2 imports, mysql error codes (ER_DUP_ENTRY), or ? placeholders remain anywhere in the codebase
**Plans**: 4 plans

**Wave 1** *(no dependencies)*:
- [x] 10-01-PLAN.md — Connection layer rewrite: pg Pool, error mapper, mysql2 removal (QRY-01, QRY-05)

**Wave 2** *(blocked on Wave 1 completion — parallel)*:
- [x] 10-02-PLAN.md — Food repository + controller error handling (QRY-02)
- [x] 10-03-PLAN.md — Profile + user repository rewrite (QRY-03)
- [x] 10-04-PLAN.md — Activity repository rewrite + full grep sweep (QRY-04, QRY-05)

**Cross-cutting constraints:**
- QRY-05 (mysql2 pattern sweep) is split across Wave 1 (error mapper + .env cleanup), Wave 2 per-repo (syntax translation), and Wave 2 final sweep (Activity plan grep verification)
- All Wave 2 plans depend on 10-01 completing first (database.js must use pg before any repo can query)
- No file conflicts between Wave 2 plans — they can execute in parallel

### Phase 11: Docker Restructure (Single Container)
**Goal**: Single multi-stage Docker container serves both the Express backend and React frontend
**Depends on**: Phase 10 (code must be querying Supabase correctly)
**Requirements**: DKR-01, DKR-02, DKR-03
**Success Criteria** (what must be TRUE):
  1. Multi-stage Dockerfile builds frontend (npm run build) in a build stage and copies the output to the backend's public directory in the final stage
  2. Express serves React static files via express.static() with an SPA catch-all route for client-side routing
  3. docker-compose.yml contains only one service (backend) — no MySQL, no Adminer
   4. Single container starts on one port and both API routes (e.g., /api/health) and frontend (e.g., /login) are accessible
**Plans**: 2 plans

**Wave 1** *(parallel — no dependencies)*:
- [x] 11-01-PLAN.md — Container infrastructure: .dockerignore, multi-stage Dockerfile, simplified compose (DKR-01, DKR-03) — completed 2026-05-28
- [x] 11-02-PLAN.md — Application integration: Express static serving + SPA catch-all, remove frontend/Dockerfile (DKR-02) — completed 2026-05-28

### Phase 12: Testing & Validation
**Goal**: Migration is validated through automated integration tests and manual full-stack smoke tests
**Depends on**: Phase 11 (Docker image must be buildable and runnable)
**Requirements**: TST-01, TST-02
**Success Criteria** (what must be TRUE):
  1. All backend integration tests pass against Supabase PostgreSQL (not MySQL) — covering food, profile, user, and activity repositories
  2. Full Docker image builds successfully with zero errors
  3. Container starts, /api/health returns 200, and the frontend landing page loads in the browser
  4. End-to-end smoke test verifies: user registration, profile creation, BMI calculation, food logging, and calorie summary display all work against Supabase
**Plans**: 4 plans

**Wave 1** *(all parallel — no file conflicts)*:
- [x] 12-01-PLAN.md — Backend integration test helpers rewrite + assertion fixes (TST-01) — completed 2026-05-28
- [x] 12-02-PLAN.md — Frontend test fixes + DATABASE_URL_TEST config (TST-01) — completed 2026-05-28
- [x] 12-03-PLAN.md — Unit test expansion: dbErrors, profile, auth, activity (TST-01) — completed 2026-05-28
- [x] 12-04-PLAN.md — Docker smoke test script (TST-02) — completed 2026-05-28

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Authentication | v1.1 | 3/3 | Complete | 2026-05-17 |
| 2. Profile & BMI Calculator | v1.1 | 2/2 | Complete | 2026-05-17 |
| 3. TDEE Calculator & Goals | v1.1 | 2/2 | Complete | 2026-05-17 |
| 4. Food Database & Calorie Logging | v1.1 | 3/3 | Complete | 2026-05-17 |
| 5. Activity Recommendations & Polish | v1.1 | 4/4 | Complete | 2026-05-17 |
| 6. International Ingredient Database | v1.1 | 3/3 | Complete | 2026-05-18 |
| 7. Ingredient Logging & Calorie Calculation | v1.1 | 3/3 | Complete | 2026-05-18 |
| 8. English UI Migration | v1.1 | 3/3 | Complete | 2026-05-18 |
| 9. Supabase Setup & Schema Migration | v1.2 | 3/3 | Complete   | 2026-05-27 |
| 10. Backend Query Rewrite | v1.2 | 4/4 | Complete    | 2026-05-28 |
| 11. Docker Restructure | v1.2 | 2/2 | Complete   | 2026-05-28 |
| 12. Testing & Validation | v1.2 | 4/4 | Complete | 2026-05-28 |

---
*Roadmap created: 2026-05-17*
*Last updated: 2026-05-28 (v1.2 Supabase Migration shipped)*
