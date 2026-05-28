# Phase 11: Docker Restructure (Single Container) - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure Docker setup from 4 services (mysql, adminer, backend, frontend) to a single container that serves both the Express API and the production-built React frontend. MySQL and Adminer services are removed entirely — the app now uses Supabase PostgreSQL (Phases 9-10). Frontend is served statically by Express, eliminating the Vite dev server in production.

**Requirements:** DKR-01, DKR-02, DKR-03

</domain>

<decisions>
## Implementation Decisions

### Dockerfile Structure
- **D-01:** Single Dockerfile at **repo root** (`./Dockerfile`) — build context is the entire repo so the multi-stage build can copy from both `frontend/` and `backend/`
- **D-02:** Frontend build stage produces `frontend/dist/`; final stage copies static files to **`backend/public/`** for Express serving
- **D-03:** Production CMD uses **`npm start`** (`node src/server.js`) — not nodemon. Nodemon is a dev-only dependency
- **D-04:** Final stage runs **`npm install --omit=dev`** — only production dependencies in the runtime image
- **D-05:** Remove `frontend/Dockerfile` — no longer needed as a separate service

### Runtime Configuration
- **D-06:** Single container exposes **port 80** (EXPOSE 80, mapped via docker-compose)
- **D-07:** Keep CORS config **as-is** — harmless for same-origin requests, needed for any external API consumers
- **D-08:** Add **Docker HEALTHCHECK** hitting `http://localhost:80/api/health` — enables Docker to detect and restart unhealthy containers

### docker-compose.yml
- **D-09:** Simplified to **single service** (backend only) — remove mysql, adminer, and frontend services
- **D-10:** Remove `mysql_data` volume, `fitness_net` network, all `depends_on` and `healthcheck` references to MySQL
- **D-11:** Remove MySQL env vars from service definition; only Supabase `DATABASE_URL` via `env_file` remains

### Build Optimization
- **D-12:** Create **repo-root `.dockerignore`** excluding `node_modules/`, `.git`, `.env`, `dist/` from Docker build context
- **D-13:** Existing per-directory `.dockerignore` files in `backend/` and `frontend/` can remain but are secondary to root-level ignore

### the agent's Discretion
- Exact HEALTHCHECK interval, timeout, retries, and start-period values — planner picks standard defaults
- SPA catch-all route implementation detail in Express (exact path pattern and order in middleware stack)
- Whether to keep or remove `networks:` from docker-compose when only one service remains (simplification is recommended)
- Whether to keep `restart: unless-stopped` or change to `always`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 11 — Goal, success criteria, requirements (DKR-01 to DKR-03)
- `.planning/REQUIREMENTS.md` §v1.2 — Requirements with traceability (DKR-01 to DKR-03), Out of Scope items
- `.planning/STATE.md` — Current project state

### Project Decisions
- `.planning/PROJECT.md` §Key Decisions — Single container approach, No nginx/Caddy (Express.static() adequate)

### Existing Docker Infrastructure (to be restructured)
- `docker-compose.yml` — Current 4-service setup (mysql, adminer, backend on :3001, frontend on :5173)
- `backend/Dockerfile` — Current single-stage Node image (to be replaced by repo-root multi-stage Dockerfile)
- `frontend/Dockerfile` — Current single-stage Vite dev server (to be removed)
- `backend/.dockerignore` — Existing per-directory ignore (node_modules, .env)
- `frontend/.dockerignore` — Existing per-directory ignore (node_modules, dist, .env)
- `.gitignore` — Excludes node_modules/, dist/, .env — informs .dockerignore contents

### Backend Files (need static serving + SPA catch-all)
- `backend/src/app.js` — Express app with middleware stack and routes; SPA catch-all route must be added
- `backend/src/server.js` — Server startup with DB health check; no Docker-level health check exists yet
- `backend/src/config/database.js` — pg Pool config (connection to Supabase, not MySQL)

### Frontend Build Config
- `frontend/vite.config.js` — Vite config with dev server proxy to backend:3001 (irrelevant for production — Express serves static files directly)
- `frontend/package.json` — Build script: `vite build` (used in Docker multi-stage build)

### Prior Phase Context
- `.planning/phases/10-backend-query-rewrite-pg-migration/10-CONTEXT.md` — MySQL removed, pg driver in place, CORS config unchanged
- `.planning/phases/09-supabase-setup-schema-migration/09-CONTEXT.md` — Supabase setup, no nginx/Caddy decision

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docker-compose.yml` (72 lines) — Current 4-service config with mysql, adminer, backend, frontend. Directly informs what to remove and simplify to single service.
- `backend/Dockerfile` (7 lines) — Single-stage Node alpine image. Replaced by multi-stage at repo root.
- `frontend/Dockerfile` (7 lines) — Single-stage Node alpine for Vite dev server. Removed.
- `backend/src/app.js` (137 lines) — Express app with full middleware stack. SPA catch-all route must be added after API routes, before the 404 handler.
- `backend/src/server.js` (32 lines) — Server startup with app.listen() and DB health check. Docker HEALTHCHECK added externally.

### Established Patterns
- Express middleware ordering: security → CORS → compression → logging → body parsing → cookie → passport → rate limiters → routes → error handling. SPA catch-all fits between API routes and 404 handler.
- Backend runs on port 3001 in current setup. New container uses port 80 internally (mapped to whatever host port suits the user).
- Frontend proxy in Vite dev server (`/api` → `http://backend:3001`) is irrelevant for production — Express serves both.

### Integration Points
- `backend/src/app.js:122-124` — 404 handler. SPA catch-all must be placed BEFORE this (after all /api/ routes, before the 404 handler).
- `backend/src/app.js:24-29` — CORS with `FRONTEND_URL` env var. Stays as-is (D-07). `FRONTEND_URL` may need updating if origin changes.
- `docker-compose.yml` — Complete rewrite to single service. Remove MySQL env references, healthcheck depends, volumes, networks.
- `backend/.env.example` — Already shows only Supabase DATABASE_URL (MySQL vars cleaned in Phase 10). No change needed.

</code_context>

<specifics>
## Specific Ideas

- Multi-stage Dockerfile structure: Stage 1 (builder) = `node:20-alpine`, install frontend deps, `npm run build`. Stage 2 (runner) = `node:20-alpine`, copy backend source, `npm install --omit=dev`, copy `frontend/dist/` to `backend/public/`, CMD `npm start`
- SPA catch-all: `app.get('*', (req, res) => res.sendFile('index.html', { root: 'public' }))` placed after API routes and before the 404 handler
- Docker health check: `HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD curl -f http://localhost/api/health || exit 1`
- Static serving: `app.use(express.static('public'))` — backend/public/ is relative to `backend/` directory where server.js runs
- FRONTEND_URL in .env may need to change from `http://localhost:5173` to the actual deployment URL — but since frontend is now same-origin, this could also be the backend's own URL

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-Docker Restructure (Single Container)*
*Context gathered: 2026-05-28*
