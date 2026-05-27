# Requirements: Fitness_App

**Defined:** 2026-05-27
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.2 Requirements

Requirements for v1.2 milestone. Each maps to roadmap phases.

### Docker Service Separation

- [ ] **DOCK-01**: User can start MySQL database + Adminer independently via `docker-compose.db.yml`
- [ ] **DOCK-02**: User can start backend independently via `docker-compose.backend.yml` with dependency on db service
- [ ] **DOCK-03**: User can start backend in dev mode via `docker-compose.backend.dev.yml` with nodemon hot-reload
- [ ] **DOCK-04**: User can start frontend independently via `docker-compose.frontend.yml` with dependency on backend service
- [ ] **DOCK-05**: User can start frontend in dev mode via `docker-compose.frontend.dev.yml` with Vite HMR
- [ ] **DOCK-06**: User can start all services together via root `docker-compose.yml` that references or includes all service files
- [ ] **DOCK-07**: Each compose file has clear header documentation describing its purpose, usage, and dependencies

## v2 Requirements

Deferred to future release.

### Advanced Nutrition

- **NUTR-01**: User can view macro breakdown (protein, carbs, fat) for logged food
- **NUTR-02**: User can set daily macro targets (protein, carbs, fat goals)
- **NUTR-03**: User can view macro progress against targets

### Progress Charts

- **PROG-01**: User can view weight history chart
- **PROG-02**: User can view daily calorie trend chart (7/30 day)
- **PROG-03**: User can view BMI history over time

### Notifications

- **NOTF-01**: User receives daily meal reminders
- **NOTF-02**: User receives weekly progress summary

## Out of Scope

| Feature | Reason |
|---------|--------|
| Production deployment config (nginx, SSL) | Not needed yet — focus on dev flexibility |
| Kubernetes manifests | Overkill for current scale, Docker Compose sufficient |
| CI/CD pipeline | Defer to deployment milestone |
| Monitoring/logging stack | Not needed for dev workflow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCK-01 | Phase 9 | Pending |
| DOCK-02 | Phase 10 | Pending |
| DOCK-03 | Phase 10 | Pending |
| DOCK-04 | Phase 11 | Pending |
| DOCK-05 | Phase 11 | Pending |
| DOCK-06 | Phase 12 | Pending |
| DOCK-07 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after initial definition*
