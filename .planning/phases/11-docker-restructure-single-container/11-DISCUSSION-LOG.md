# Phase 11: Docker Restructure (Single Container) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 11-docker-restructure-single-container
**Areas discussed:** Dockerfile location, Frontend static serving path, Production CMD, Port & CORS strategy, Health check & production readiness

---

## Dockerfile Location & Build Context

| Option | Description | Selected |
|--------|-------------|----------|
| Repo root (./Dockerfile) | Single Dockerfile at root, build context is the repo itself | ✓ |
| Backend dir (./backend/Dockerfile) | Keep existing location, build context set to repo root | (initial pick, then changed) |

**User's choice:** Repo root (./Dockerfile) — after initially picking backend dir then asking to revisit
**Notes:** User changed mind from backend dir to repo root on reconsideration

## Frontend Static Serving Path

| Option | Description | Selected |
|--------|-------------|----------|
| backend/public/ | Conventional Express static directory | ✓ |
| backend/src/public/ | Under src/ — less conventional | |

**User's choice:** backend/public/
**Notes:** Standard Express pattern with express.static('public')

## Production CMD

| Option | Description | Selected |
|--------|-------------|----------|
| npm start (node src/server.js) | Production uses node directly | ✓ |
| npm run dev (nodemon) | Keeps nodemon in production image | |

**User's choice:** npm start (node src/server.js)
**Notes:** Nodemon is dev-only

## Port & CORS Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| 3001 (keep current) | Keep existing backend port | |
| 80 (standard HTTP) | Standard HTTP port for production | ✓ |

**User's choice:** 80 (standard HTTP)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep CORS as-is | Harmless for same-origin, useful for external clients | ✓ |
| Remove CORS for production | Tighten — one less middleware in request path | |

**User's choice:** Keep CORS as-is

## Health Check & Production Readiness

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — HTTP health endpoint | HEALTHCHECK with curl to /api/health | ✓ |
| No — app-level check is enough | App already fails fast on DB failure | |

**User's choice:** Yes — HTTP health endpoint

---

| Option | Description | Selected |
|--------|-------------|----------|
| npm install --omit=dev | Smaller image, fewer vulnerabilities | ✓ |
| npm install (full) | Install everything, simpler | |

**User's choice:** npm install --omit=dev

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — repo-root .dockerignore | Excludes node_modules, .git, .env, dist | ✓ |
| No — existing per-dir ignores are enough | | |

**User's choice:** Yes — repo-root .dockerignore

## the agent's Discretion

- HEALTHCHECK interval/timeout/retries/start-period values — planner picks standard defaults
- SPA catch-all route exact implementation details in Express
- Whether to keep or remove networks from docker-compose when single service
- Whether to keep `restart: unless-stopped` or change

## Deferred Ideas

None — discussion stayed within phase scope.
