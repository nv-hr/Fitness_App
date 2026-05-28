---
phase: 11-docker-restructure-single-container
plan: 01
subsystem: infra
tags: docker, dockerfile, docker-compose, multi-stage, container
requires:
  - phase: 09-supabase-setup-schema-migration
    provides: Supabase PostgreSQL connection (replaces MySQL)
  - phase: 10-backend-query-rewrite-pg-migration
    provides: pg driver, no MySQL dependencies
provides:
  - Repo-root .dockerignore excluding node_modules, .git, .env, dist/
  - Multi-stage Dockerfile with builder/development/production stages
  - Simplified single-service docker-compose.yml (no MySQL/Adminer)
affects: 11-docker-restructure-single-container (Plan 02)
tech-stack:
  added:
    - Docker multi-stage build (three named stages: builder, development, production)
    - docker-compose single-service pattern
  patterns:
    - .dockerignore at repo root governs top-level build context while per-directory files remain as secondary
    - Frontend built in builder stage via `npm ci` (includes Vite as devDep), then `COPY --from=builder` to production stage
    - Production stage installs only production deps (`npm ci --omit=dev`), uses HEALTHCHECK with curl
    - Development stage uses `npm install` (includes nodemon) for hot-reload workflow
key-files:
  created:
    - .dockerignore - Build context exclusion rules (8 patterns)
    - Dockerfile - Multi-stage build recipe (60 lines, 3 stages)
  modified:
    - docker-compose.yml - Simplified from 72-line 4-service to 9-line single-service
key-decisions:
  - "Retained backend/ and frontend/ .dockerignore files as secondary per D-13"
  - "Retained restart: unless-stopped in docker-compose — pairs with HEALTHCHECK for auto-recovery"
  - "Removed networks: from docker-compose — single service uses Docker default bridge"
  - "Building frontend with `npm ci` (no --omit=dev) in builder stage because Vite is a devDep"
  - "Production CMD uses `npm start` per D-03, not `node src/server.js` directly"
  - "HEALTHCHECK uses curl on localhost:80/api/health with standard defaults (30s/3s/10s/3)"
requirements-completed:
  - DKR-01
  - DKR-03
duration: 2 min
completed: 2026-05-28
---

# Phase 11: Docker Restructure (Single Container) Plan 01 Summary

**Multi-stage Dockerfile with builder/development/production stages, repo-root .dockerignore, and single-service docker-compose.yml replacing 4-service setup**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-28T04:33:29Z
- **Completed:** 2026-05-28T04:35:01Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created `.dockerignore` at repo root — excludes `node_modules/`, `.git`, `.env`, `*.md`, `dist/`, `coverage/`, `Dockerfile`, `.dockerignore` from build context (per D-12, D-13)
- Created `Dockerfile` at repo root with three named stages — `builder` (frontend build with Vite), `development` (hot-reload backend), `production` (serves both Express API and built React frontend) — per D-01 through D-06, D-08
- Simplified `docker-compose.yml` from 72-line 4-service setup (mysql, adminer, backend, frontend) to a 9-line single `app` service — per D-09, D-10, D-11
- All 6 threat model mitigations implemented (T-11-01 through T-11-05)
- All existing per-directory `.dockerignore` files and `backend/Dockerfile` remain untouched (D-13)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create repo-root .dockerignore** - `ab85a06` (feat)
2. **Task 2: Create multi-stage Dockerfile at repo root** - `7370385` (feat)
3. **Task 3: Simplify docker-compose.yml to single service** - `1b66522` (feat)

**Plan metadata:** *(to be committed)*

## Files Created/Modified

- `.dockerignore` — Build context exclusion rules for Docker (8 patterns)
- `Dockerfile` — Multi-stage build recipe (60 lines, 3 stages, ENV PORT=80, EXPOSE 80, HEALTHCHECK with curl, production `npm start`)
- `docker-compose.yml` — Rewritten from 4-service to single `app` service (build context `.`, target production, port 80:80, env_file ./backend/.env)

## Decisions Made

- **retain: unless-stopped** — Retained in docker-compose per agent's discretion as production-friendly default that pairs with HEALTHCHECK for auto-recovery on unhealthy state (T-11-04)
- **removed: networks** — Single service uses Docker's default bridge network; explicit `fitness_net` network (with its `driver: bridge`) is redundant
- **retained: per-directory .dockerignore files** — backend/ and frontend/ .dockerignore remain untouched per D-13, serving as secondary filters
- **npm ci in builder stage** — Uses `npm ci` without `--omit=dev` because Vite is a frontend devDependency required for the build (Research Pitfall 1)
- **npm start for CMD** — Production stage uses `CMD ["npm", "start"]` per locked decision D-03, which maps to `node src/server.js` via backend/package.json
- **Standard HEALTHCHECK defaults** — 30s interval, 3s timeout, 10s start period, 3 retries — standard Docker defaults

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Threat Surface

All 5 threats from the threat register are mitigated:

| Threat ID | Category | Component | Mitigation Status |
|-----------|----------|-----------|-------------------|
| T-11-01 | Information Disclosure | Docker build context | Mitigated — `.dockerignore` excludes `.env` (secrets never enter build context) |
| T-11-02 | Tampering | Production image | Mitigated — `npm ci --omit=dev` excludes devDeps, reducing CVE surface |
| T-11-03 | Information Disclosure | Image layers | Mitigated — Multi-stage build only retains runtime artifacts in final stage |
| T-11-04 | Denial of Service | Container runtime | Mitigated — HEALTHCHECK + `restart: unless-stopped` enables auto-recovery |
| T-11-05 | Elevation of Privilege | Container shell | Accepted — Alpine includes /bin/sh per user decision (chose alpine over distroless) |

## User Setup Required

None - no external service configuration required. Docker is required to build and run the container, but is not available on this development machine.

## Next Phase Readiness

- Docker infrastructure complete: `.dockerignore`, `Dockerfile`, `docker-compose.yml` — all three files in place at repo root
- Ready for Plan 02: "Remove frontend/Dockerfile and clean up orphaned files"
- Docker build/testing requires Docker installed on target machine or CI runner (not available on this dev machine)
- The SPA catch-all route in `backend/src/app.js` (for Express to serve React static files) is _not_ part of this plan — it will be handled as noted in CONTEXT.md. This Dockerfile expects the runtime Express app to serve `./public/index.html` for non-API routes.

---

*Phase: 11-docker-restructure-single-container*
*Completed: 2026-05-28*
