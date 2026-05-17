# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

## Phase Boundary

Users can securely create accounts, authenticate, and access the application with proper data protection consent. This phase delivers the monorepo foundation, Docker infrastructure, user registration/login (email/password + Google OAuth), JWT session management, PDP consent capture, and Indonesian UI base.

## Implementation Decisions

### JWT Storage Strategy
- **D-01:** JWT stored in httpOnly cookies — server sets cookie, browser sends automatically. Most secure against XSS attacks. CSRF handling will be needed.

### PDP Consent Flow
- **D-02:** PDP consent captured via checkbox on registration form — "I agree to PDP terms" with link to terms page. Single consent point, not multi-step.

### Monorepo Structure
- **D-03:** `frontend/` and `backend/` at root level, each with own `package.json`. No `apps/` or `packages/` nesting.
- **D-04:** Vite dev server proxies `/api/*` requests to Express backend — single origin, no CORS issues during development.

### User Schema & Password Hashing
- **D-05:** Password hashing uses bcrypt (industry standard, bcrypt 6.0 available).
- **D-06:** Email verification skipped for v1 — account active immediately after registration. Can be added in v2.
- **D-07:** User table must include: id, email, password_hash, google_id (nullable), pdp_consent (boolean), pdp_consent_date, created_at, updated_at.

### Dev Environment
- **D-08:** Docker Compose for MySQL + adminer only. Frontend and backend run locally with `npm dev` (hot reload).
- **D-09:** Docker Compose includes MySQL 8.4 LTS container with persistent volume and adminer for database management.

### the agent's Discretion
- CSRF token implementation details (standard Express CSRF middleware)
- Exact Docker Compose configuration (ports, volumes, network setup)
- Database migration strategy (raw SQL scripts vs migration tool)
- Google OAuth client ID setup process (user must create Google Cloud project)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project goals, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements (AUTH-01 through AUTH-06, UI-01)
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Research
- `.planning/research/STACK.md` — Technology stack with versions (React 19, Vite 8, Express 5, MySQL 8.4, bcrypt 6, passport, jsonwebtoken)
- `.planning/research/ARCHITECTURE.md` — Controller-Service-Repository pattern, feature-first frontend
- `.planning/research/PITFALLS.md` — Security pitfalls (JWT storage, password hashing, PDP Law compliance)

### Codebase
- `.planning/codebase/STACK.md` — Current tech state (greenfield, no code yet)
- `.planning/codebase/ARCHITECTURE.md` — Current architecture state (none yet)

No external specs — requirements fully captured in decisions above.

## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code.

### Established Patterns
- None yet — this phase establishes the foundational patterns (monorepo structure, Docker setup, auth flow).

### Integration Points
- `frontend/` — React app entry point, Vite config, API client setup
- `backend/` — Express app entry point, middleware stack, auth routes
- `docker-compose.yml` — MySQL + adminer services
- MySQL database — users table creation, initial schema

## Specific Ideas

No specific requirements — open to standard approaches for auth implementation.

## Deferred Ideas

- Email verification flow — deferred to v2 (NOTF-01, NOTF-02)
- Password reset functionality — not in v1 requirements, belongs in v2
- Multi-device session management — out of scope for v1
- Cloudflare Tunnel setup for production — belongs in deployment phase

---

*Phase: 01-Foundation & Authentication*
*Context gathered: 2026-05-17*
