# Requirements: Fitness_App

**Defined:** 2026-05-27
**Core Value:** Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## v1.2 Requirements

Requirements for v1.2 Supabase Migration milestone.

### Supabase Setup & Schema Migration

- [x] **SUP-01**: Supabase project is created and accessible with PostgreSQL database
- [x] **SUP-02**: Database schema (tables, indexes, ENUMs, constraints) is migrated from MySQL to PostgreSQL
- [x] **SUP-03**: Seed data (200+ foods, 35 activities) is migrated to Supabase PostgreSQL
- [x] **SUP-04**: Backend can establish and verify a connection to Supabase on startup

### Backend Query Rewrite

- [ ] **QRY-01**: mysql2 driver replaced with pg (node-postgres) in database.js
- [ ] **QRY-02**: Food repository rewritten with PostgreSQL-compatible queries (RETURNING *, $1 placeholders)
- [ ] **QRY-03**: Profile and user repositories rewritten with PostgreSQL-compatible queries
- [ ] **QRY-04**: Activity repository rewritten with PostgreSQL-compatible queries (including JSON_OVERLAPS → ?| operator)
- [ ] **QRY-05**: All MySQL-specific SQL patterns grepped and translated ($1, RETURNING, boolean, error codes, date functions)

### Docker Restructure

- [ ] **DKR-01**: Multi-stage Dockerfile builds frontend and serves via backend
- [ ] **DKR-02**: Express serves React static files (express.static + SPA catch-all)
- [ ] **DKR-03**: docker-compose.yml simplified to single service (backend only, no MySQL/Adminer)

### Testing & Validation

- [ ] **TST-01**: Backend integration tests pass against Supabase PostgreSQL
- [ ] **TST-02**: Full-stack smoke test passes (docker build, container start, API responds, frontend loads)

## v2 Requirements

Deferred to future release.

### Advanced Nutrition

- **MACRO-01**: User can view macro breakdown (protein, carbs, fat) per meal
- **MACRO-02**: User can set macro targets

### Data Visualization

- **VIZ-01**: User can view weight progress over time on a chart
- **VIZ-02**: User can view calorie history as a timeline or graph

## Out of Scope

| Feature | Reason |
|---------|--------|
| Supabase Auth (replacing JWT) | Current JWT + Google OAuth works; auth migration would add risk with no user benefit |
| Supabase Realtime subscriptions | No real-time features needed; REST polling is sufficient |
| Row Level Security (RLS) | Server-side only architecture; no direct client-db access |
| ORM (Prisma/Drizzle) | Would require learning new API; repository pattern works fine with raw SQL |
| nginx/Caddy reverse proxy | Unnecessary complexity at this scale; Express.static() is adequate |
| Performance tuning | Not needed until traffic justifies it |
| Zero-downtime migration | App deployment status unknown; fresh Supabase start assumed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SUP-01 | Phase 9 | Complete |
| SUP-02 | Phase 9 | Complete |
| SUP-03 | Phase 9 | Complete |
| SUP-04 | Phase 9 | Complete |
| QRY-01 | Phase 10 | Pending |
| QRY-02 | Phase 10 | Pending |
| QRY-03 | Phase 10 | Pending |
| QRY-04 | Phase 10 | Pending |
| QRY-05 | Phase 10 | Pending |
| DKR-01 | Phase 11 | Pending |
| DKR-02 | Phase 11 | Pending |
| DKR-03 | Phase 11 | Pending |
| TST-01 | Phase 12 | Pending |
| TST-02 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 14 total
- Mapped to phases: 14 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after v1.2 milestone definition*
