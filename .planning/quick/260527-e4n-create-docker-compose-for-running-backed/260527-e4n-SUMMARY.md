---
phase: quick
plan: 260527-e4n
subsystem: docker
tags:
  - docker
  - docker-compose
  - dev-env
  - orchestration
requires: [phase-2]
affects:
  - backend/Dockerfile
  - frontend/Dockerfile
  - frontend/.dockerignore
  - frontend/vite.config.js
  - docker-compose.yml
tech-stack:
  added:
    - Docker (Node 20 Alpine images for backend + frontend)
  patterns:
    - Layer-cached npm install via package*.json copy
    - Vite proxy target configurable via env var
key-files:
  created:
    - backend/Dockerfile
    - frontend/Dockerfile
    - frontend/.dockerignore
  modified:
    - frontend/vite.config.js
    - docker-compose.yml
decisions:
  - npm install used instead of npm ci --only=production to ensure devDependencies (nodemon) are installed for dev mode
metrics:
  duration: 3 commits across ~5 min
  completed: 2024-05-27
---

# Quick Task 260527-e4n: Create Docker Compose for Backend + Frontend

Added Dockerfiles for the Express API server and Vite dev server, then wired both into docker-compose.yml alongside existing MySQL + Adminer services for one-command full-stack startup via `docker compose up`.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create `backend/Dockerfile` | `c2f9546` | `backend/Dockerfile` |
| 2 | Create `frontend/Dockerfile` + `.dockerignore` + update Vite proxy | `cd4604a` | `frontend/Dockerfile`, `frontend/.dockerignore`, `frontend/vite.config.js` |
| 3 | Wire backend + frontend into `docker-compose.yml` | `eae6a18` | `docker-compose.yml` |

## Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| `backend/Dockerfile` exists | ✅ | Node 20 Alpine, EXPOSE 3001, CMD npm run dev |
| `frontend/Dockerfile` exists | ✅ | Node 20 Alpine, EXPOSE 5173, CMD npm run dev |
| `frontend/.dockerignore` exists | ✅ | Excludes node_modules, dist, .env |
| Vite proxy target env-configurable | ✅ | `process.env.VITE_API_PROXY_TARGET \|\| 'http://localhost:3001'` |
| docker-compose.yml has 4 services | ✅ | mysql, adminer, backend, frontend on fitness_net |
| Backend depends_on mysql healthy | ✅ | `condition: service_healthy` |
| Frontend depends_on backend | ✅ | Simple depends_on |
| Docker build verification | ⚠️ Skipped | Docker CLI not available on this machine |

## Deviations from Plan

### Rule 2 — Missing critical functionality

**1. [Rule 2] Used `npm install` instead of `npm ci --only=production || npm install`**

- **Found during:** Task 1
- **Issue:** The plan's suggested `RUN npm ci --only=production` would install only production dependencies, missing devDependencies like nodemon that are required for `npm run dev` (the container's CMD). Since both `backend/package-lock.json` and `frontend/package-lock.json` exist, `npm ci --only=production` would succeed and skip devDeps, causing runtime failure.
- **Fix:** Changed to `RUN npm install` in both Dockerfiles, which installs all dependencies (prod + dev) as appropriate for a development-focused container.
- **Files modified:** `backend/Dockerfile`, `frontend/Dockerfile`
- **Commit:** `c2f9546`, `cd4604a`

## Environment Limitations

- **Docker CLI not available** on this machine. The `docker build` and `docker compose config` verification steps from the plan could not be executed. All files are syntactically correct per the plan's requirements.

## Self-Check: PASSED

- ✅ `backend/Dockerfile` — exists
- ✅ `frontend/Dockerfile` — exists
- ✅ `frontend/.dockerignore` — exists
- ✅ `frontend/vite.config.js` — contains `process.env.VITE_API_PROXY_TARGET`
- ✅ `docker-compose.yml` — all 4 services present, wired on `fitness_net`
- ✅ 3 atomic commits made (one per task)
