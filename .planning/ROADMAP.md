# ROADMAP: Fitness_App

**Created:** 2026-05-17
**Updated:** 2026-05-27 (v1.2 Docker Service Separation phases added)
**Phases:** 12 planned (8 complete, 4 pending)
**Milestones:** 1 shipped (v1.1), 1 active (v1.2)

## Milestones

- ✅ **v1.1 International Ingredient Logging** — Phases 1-8 (shipped 2026-05-18)
- 🚧 **v1.2 Docker Service Separation** — Phases 9-12 (active)

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

<details open>
<summary>🚧 v1.2 Docker Service Separation (Phases 9-12) — PLANNED</summary>

- [ ] **Phase 9: Database Service** — MySQL 8.4 + Adminer via docker-compose.db.yml
- [ ] **Phase 10: Backend Service** — Backend production + dev (nodemon) via compose files
- [ ] **Phase 11: Frontend Service** — Frontend production + dev (HMR) via compose files
- [ ] **Phase 12: Root Orchestration & Documentation** — Root docker-compose.yml + header docs

</details>

## Phase Details

### Phase 9: Database Service
**Goal**: Users can start MySQL database and Adminer independently for development
**Depends on**: Nothing (first phase of v1.2)
**Requirements**: DOCK-01
**Success Criteria** (what must be TRUE):
   1. User can run `docker compose -f docker-compose.db.yml up` and MySQL 8.4 starts successfully with the correct database and user
   2. User can access Adminer at port 8080 to browse, query, and manage the fitness_app database
   3. User can connect to the MySQL database from the backend application using the configured credentials and hostname
   4. User can stop the database service independently via `docker compose -f docker-compose.db.yml down` without affecting any other services
**Plans**: 1 plan

Plans:
- [ ] 09-01-PLAN.md — Create docker-compose.db.yml with MySQL 8.4 + Adminer 5.4.2

### Phase 10: Backend Service
**Goal**: Users can start backend in production or development (hot-reload) mode independently
**Depends on**: Phase 9 (backend service depends on database)
**Requirements**: DOCK-02, DOCK-03
**Success Criteria** (what must be TRUE):
  1. User can start backend in production mode via `docker compose -f docker-compose.backend.yml up` and the API is accessible at port 3001
  2. User can start backend in dev mode via `docker compose -f docker-compose.backend.dev.yml up` with nodemon auto-restart on file changes
  3. Backend API endpoints (auth, profile, BMI, TDEE, food) respond correctly when accessed through Docker networking
  4. Backend service correctly waits for db service to be healthy before starting (dependency + healthcheck)
**Plans**: TBD

### Phase 11: Frontend Service
**Goal**: Users can start frontend in production or development (HMR) mode independently
**Depends on**: Phase 10 (frontend proxies API requests to backend)
**Requirements**: DOCK-04, DOCK-05
**Success Criteria** (what must be TRUE):
  1. User can start frontend in production mode via `docker compose -f docker-compose.frontend.yml up` and the app is accessible from the browser
  2. User can start frontend in dev mode via `docker compose -f docker-compose.frontend.dev.yml up` with Vite HMR active for instant code updates
  3. Frontend correctly proxies API requests to backend service through Docker networking
  4. Changing frontend source code in dev mode triggers automatic browser refresh without manual restart
**Plans**: TBD

### Phase 12: Root Orchestration & Documentation
**Goal**: Users can start all services together with a single command and understand each component's purpose
**Depends on**: Phase 11 (all service files must exist before orchestration)
**Requirements**: DOCK-06, DOCK-07
**Success Criteria** (what must be TRUE):
  1. User can run `docker compose up` from project root and all services (db, adminer, backend, frontend) start correctly
  2. Full stack works end-to-end when started via root compose — user can log in, calculate BMI/TDEE, and log food
  3. User can stop all services cleanly with `docker compose down`
  4. Each compose file (db, backend, backend.dev, frontend, frontend.dev, root) has header documentation describing its purpose, usage, and service dependencies
**Plans**: TBD

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
| 9. Database Service | v1.2 | 0/1 | Planning | - |
| 10. Backend Service | v1.2 | 0/0 | Not started | - |
| 11. Frontend Service | v1.2 | 0/0 | Not started | - |
| 12. Root Orchestration & Documentation | v1.2 | 0/0 | Not started | - |

---
*Roadmap created: 2026-05-17*
*Last updated: 2026-05-27 (v1.2 Docker Service Separation phases added)*
