# Project Research Summary

**Project:** Fitness_App
**Domain:** Fitness/Health Tracking Web App (Indonesian market)
**Researched:** 2026-05-17
**Confidence:** HIGH

## Executive Summary

This is a calorie-tracking web app targeting Indonesian users, combining BMI/TDEE calculators with a pre-seeded Indonesian food database and daily calorie logging. The core competitive moat is the curated Indonesian food coverage — competitors like MyFitnessPal and Cronometer have poor local food representation. Experts build these products by prioritizing logging speed over completeness, presenting calculator results as estimates (not precise values), and designing for mobile-first markets (Indonesia is 80%+ mobile web).

The recommended approach is a React 19 + Vite frontend with an Express 5 + MySQL backend, containerized with Docker and exposed via Cloudflare Tunnel. The architecture follows a strict controller-service-repository pattern on the backend and feature-first organization on the frontend. Auth uses JWT with httpOnly cookies (not localStorage) and bcrypt for password hashing. The Indonesian food database should be seeded from authoritative sources (TKPI, Kaggle dataset) with source attribution and a verification flag system.

Key risks center on three areas: (1) Indonesia's PDP Law classifies all collected health data as sensitive — explicit consent, encryption, and data deletion capabilities are legally required; (2) presenting TDEE/BMI as precise numbers drives user abandonment when results don't match reality — always show ranges and disclaimers; (3) high-friction food logging is the #1 cause of tracking abandonment (80% quit within 3 months) — quick-add, recent foods, and minimal UI are essential.

## Key Findings

### Recommended Stack

All versions verified via npm registry + Context7 official docs. Confidence: HIGH.

**Core technologies:**
- **React 19.2.x + Vite 8.0.x**: UI layer — CRA is deprecated; Vite is the official React recommendation with instant HMR and optimized builds
- **Express 5.2.x**: API server — stable release with native async/await in route handlers and improved error handling
- **mysql2 3.22.x**: Database driver — promise-based API, connection pooling; no ORM needed for v1's simple CRUD
- **bcrypt 6.0.x**: Password hashing — native C++ bindings (~3x faster than bcryptjs); 10 salt rounds
- **Passport 0.7.x + JWT 9.0.x**: Authentication — Passport for Google OAuth2, jsonwebtoken (HS256) for stateless auth
- **MySQL 8.4 LTS (Docker)**: Database — pinned version for reproducible builds, utf8mb4 for Indonesian characters
- **Cloudflare Tunnel**: Public exposure — no port forwarding, outbound-only, free tier with automatic TLS

### Expected Features

**Must have (table stakes):**
- User registration & login (email/password + Google OAuth) — foundation for everything
- BMI Calculator — quick win, builds trust, low complexity
- TDEE Calculator — establishes daily calorie target using Mifflin-St Jeor equation
- Calorie logging with food search — primary daily-use feature
- Pre-seeded Indonesian food database — the core differentiator
- Daily calorie balance view — consumed vs TDEE target at a glance
- Custom food entry — handles database gaps
- Responsive web UI in Bahasa Indonesia — 80%+ mobile market

**Should have (competitive):**
- Integrated BMI + TDEE + Calorie Tracking in one flow — complete "know your numbers → track against them" loop
- Weight goal selection — maps to calorie adjustments (lose/maintain/gain)
- Rule-based activity recommendations — adds engagement without ML complexity
- Calorie deficit/surplus guidance — educational value using 7,700 kcal/kg heuristic

**Defer (v2+):**
- Macro display (data stored but not shown) — adds UI complexity without validated demand
- Barcode scanning — Indonesian barcode coverage is poor
- Weight history tracking — useful but not blocking
- Photo food logging — requires AI infrastructure
- Social features, wearable integration, meal planning — not core to individual tracking

### Architecture Approach

The backend follows a strict **controller-service-repository** pattern with unidirectional dependencies (routes → controllers → services → repositories → MySQL). Controllers are thin HTTP handlers, services contain pure business logic, and repositories handle only database queries. The frontend uses **feature-first organization** (auth/, bmi/, tdee/, food-log/, activity/) with a shared layer for UI primitives, HTTP client, and i18n. TanStack Query manages all server state, React Hook Form + Zod handles forms, and only auth session is globalized via Context.

**Major components:**
1. **Frontend App Shell** — routing, auth provider, query client, error boundaries
2. **Frontend Feature Modules** — domain-specific UI, hooks, and API adapters per feature
3. **Backend Controllers** — HTTP parsing, service invocation, response formatting
4. **Backend Services** — business rules (BMI formula, TDEE calculation, calorie balance, activity randomization)
5. **Backend Repositories** — MySQL queries only (CRUD, seeding, aggregation)
6. **MySQL Database** — users, profiles, foods, food logs with utf8mb4 encoding

### Critical Pitfalls

1. **TDEE presented as precise instead of estimate** — Display as a range (e.g., "2,000-2,400 cal/day"), add explicit disclaimer, show all activity levels side-by-side for self-calibration
2. **Unverified food database entries** — Seed from authoritative sources (TKPI, USDA), mark every entry with its source, flag user-submitted foods as "unverified", limit v1 to 200-300 well-curated items
3. **High-friction food logging drives abandonment** — Implement quick-add ("Add 300 cal" in one tap), show recent foods/favorites, limit search results to 5-10 items, support meal templates
4. **Indonesia PDP Law non-compliance** — Health data is classified as sensitive; requires explicit consent, AES-256 encryption, data export/deletion capabilities, privacy policy in Bahasa Indonesia
5. **BMI without context or Asian-Pacific cutoffs** — Use WHO Asian-Pacific cutoffs (normal: 18.5-22.9, overweight: 23.0-24.9), add disclaimer that BMI is a screening tool not a diagnosis

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation — Infrastructure + Authentication
**Rationale:** Every feature requires a logged-in user. Auth establishes the user data model, security layer, and PDP Law compliance baseline for all subsequent phases.
**Delivers:** Monorepo structure, Docker Compose (MySQL + backend + frontend), user table schema, email/password + Google OAuth login, JWT auth middleware, httpOnly cookie storage, explicit health data consent flow, frontend app shell with router and auth context.
**Addresses:** User registration & login (table stakes)
**Avoids:** Pitfall 4 (PDP Law non-compliance), Pitfall 7 (JWT in localStorage), Pitfall 8 (weak password hashing)

### Phase 2: User Profile + BMI Calculator
**Rationale:** BMI requires user profile data (weight, height, age, gender). Establishes the profile data model that TDEE will extend. Low complexity, quick win that builds user trust.
**Delivers:** User profile table, BMI calculation service with WHO Asian-Pacific cutoffs, BMI result display with context/disclaimer, metric-only input validation, BMI history (optional).
**Addresses:** BMI Calculator (table stakes)
**Avoids:** Pitfall 5 (BMI without context), Pitfall 11 (unit confusion)

### Phase 3: TDEE Calculator + Weight Goals
**Rationale:** TDEE extends the profile model with activity level and goal selection. Uses the same input pattern as BMI but adds the activity multiplier. Establishes the daily calorie target needed for Phase 4's balance view.
**Delivers:** Activity level field in profile, TDEE calculation service (Mifflin-St Jeor), result displayed as range with disclaimer, weight goal selection (lose/maintain/gain) with calorie adjustments, concrete activity level descriptions in Bahasa Indonesia.
**Addresses:** TDEE Calculator, Weight Goal Selection (table stakes + differentiator)
**Avoids:** Pitfall 1 (TDEE as precise number), Pitfall 12 (misleading activity labels)

### Phase 4: Food Database + Calorie Logging
**Rationale:** The most complex feature and core value proposition. Requires TDEE target from Phase 3 for calorie balance calculation. This is where the product's competitive moat (Indonesian food coverage) is realized.
**Deliverables:** Foods table with 200-300 curated Indonesian items (source-attributed), food logs table, food search with deduplication and recent/favorites, quick-add calorie entry, custom food creation, daily summary endpoint, calorie balance display (consumed vs TDEE), deficit safety warnings.
**Addresses:** Food database search, calorie logging, daily balance view, custom food entry (table stakes)
**Avoids:** Pitfall 2 (unverified food data), Pitfall 3 (high-friction logging), Pitfall 6 (no deficit warnings), Pitfall 9 (search duplicates)

### Phase 5: Activity Recommendations + Polish
**Rationale:** Least complex feature, depends on TDEE goal context from Phase 3. Good final phase for i18n polish and responsive design across all features.
**Delivers:** Activity recommendations table (seed data), rule-based recommendation service (filtered by goal and activity level), activity suggestion cards, full Bahasa Indonesia i18n, responsive design polish, offline food database caching (IndexedDB).
**Addresses:** Activity recommendations (differentiator)
**Avoids:** Pitfall 13 (irrelevant random suggestions), Pitfall 10 (no offline mode)

### Phase Ordering Rationale

- **Auth first** because every API endpoint requires user identification and PDP consent must be established before collecting any health data
- **BMI before TDEE** because both share the profile data model; BMI is simpler and establishes the pattern
- **TDEE before food logging** because the daily calorie balance view requires a TDEE target to compute against
- **Food logging last of core features** because it's the most complex (database, search, logging, aggregation) and depends on all prior phases
- **Activity recommendations + polish last** because it's the lowest-complexity feature and provides a natural landing zone for i18n and responsive design work

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Food Database):** Indonesian food data sourcing and curation strategy needs validation — verify TKPI reuse terms, assess Kaggle dataset quality, determine final seed item count
- **Phase 1 (Auth + PDP):** Indonesia PDP Law consent flow and data handling specifics may need legal review for production deployment

Phases with standard patterns (skip research-phase):
- **Phase 1 (Auth):** Email/password + Google OAuth + JWT is a well-documented, established pattern
- **Phase 2 (BMI):** Standard formula with regional cutoffs — straightforward implementation
- **Phase 3 (TDEE):** Mifflin-St Jeor equation is industry-standard with clear implementation references
- **Phase 5 (Activity Recommendations):** Rule-based filtering from a curated pool is simple and well-understood

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry + Context7 official docs; architecture decisions well-reasoned |
| Features | HIGH | Based on competitive analysis of MyFitnessPal/Cronometer, user retention studies, and Indonesian market data |
| Architecture | HIGH | Controller-service-repository and feature-first patterns are well-documented with multiple authoritative sources |
| Pitfalls | HIGH | Sourced from peer-reviewed studies, regulatory documents (PDP Law), and industry retention data |

**Overall confidence:** HIGH

### Gaps to Address

- **TKPI data licensing:** The Indonesian Ministry of Health's Tabel Komposisi Pangan Indonesia is the primary recommended data source, but its reuse terms need verification before seeding. Validate during Phase 4 planning.
- **PDP Law production compliance:** While the research outlines required measures (consent, encryption, data deletion), actual production deployment may need legal review to ensure full compliance. Flag for pre-launch audit.
- **Cloudflare Tunnel production readiness:** The research covers dev setup well, but production DNS configuration, ingress rules, and failover scenarios need validation during deployment planning.
- **Offline caching scope:** IndexedDB caching for offline food search is mentioned as a Phase 5 deliverable, but the sync strategy for queued food log entries needs design during planning.

## Sources

### Primary (HIGH confidence)
- **Context7 `/facebook/react/v19_2_0`** — React 19 changelog, breaking changes, TypeScript updates
- **Context7 `/expressjs/express`** — Express 5 stable versions (v5.1.0, v5.2.0)
- **Context7 `/sidorares/node-mysql2`** — Connection pool, promise API patterns
- **Context7 `/auth0/node-jsonwebtoken`** — HS256/RS256 signing, verification
- **Context7 `/jaredhanson/passport`** — Strategy registration, authenticate middleware
- **Context7 `/kelektiv/node.bcrypt.js`** — Async hash/compare, salt rounds
- **Context7 `/vitejs/vite`** — Proxy config, backend integration, versions up to v8.0.10
- **npm registry** — All package versions verified via `npm view <package> version` (2026-05-17)
- **WHO Expert Consultation on BMI for Asian populations (2004)** — Asian-Pacific BMI cutoffs
- **Indonesia PDP Law (Law No. 27 of 2022)** — Health data classification, consent requirements, penalties

### Secondary (MEDIUM confidence)
- **Legion Athletics / Kalo Health TDEE guides** — Mifflin-St Jeor equation, activity overestimation research
- **Nutrient Metrics AI Calorie Tracking Audit (2026)** — 10-30% database error variance
- **YOMP Blog / ProductGrowth.in** — 80% abandonment within 3 months, retention factors
- **Kaggle Indonesian Food & Drink Nutrition Dataset** — 1,346 items, seed database candidate
- **USDA FoodData Central** — Free, 400K+ food items, public domain

### Tertiary (LOW confidence)
- **FAO/INFOODS Indonesia historical tables** — Older data (1967-1995), supplementary use only
- **FTC Health App Best Practices** — US-focused but applicable principles for health data handling

---
*Research completed: 2026-05-17*
*Ready for roadmap: yes*
