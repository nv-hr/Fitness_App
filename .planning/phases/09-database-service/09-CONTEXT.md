# Phase 9: Database Service - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Create `docker-compose.db.yml` — a standalone Docker Compose file for MySQL 8.4 + Adminer that works independently from the rest of the stack. This is the first split of the existing monolithic `docker-compose.yml`. Requirement: DOCK-01.

Users can start the database service independently for development without needing backend or frontend services running.

</domain>

<decisions>
## Implementation Decisions

### Adminer Placement
- **D-01:** Adminer stays in `docker-compose.db.yml` alongside MySQL. Not split into a separate file. Ensures a single-file DB experience. Phase 12 root orchestration will reference `docker-compose.db.yml` to include the DB service.
- **D-02:** Adminer uses default configuration. No custom themes, login pre-fill, or plugins. Plain Adminer as-is.

### Volume & Network Naming
- **D-03:** `docker-compose.db.yml` uses the same `mysql_data` volume name and `fitness_net` network name as the root compose. This ensures data persistence carries over whether the user starts via `db.yml` or the root `docker-compose.yml`, and prevents duplicate volume/network creation when both compose files are loaded together.

### Image Version Pinning
- **D-04:** MySQL uses `mysql:8.4` (minor version tag). Gets patch updates on rebuild while staying within the 8.4.x line.
- **D-05:** Adminer pins to a specific version tag (e.g., `adminer:4.8.1`), not `latest`. Prevents unexpected UI/behavior changes.

### the agent's Discretion
- Port selection (3306 for MySQL, 8080 for Adminer) — already established in existing compose, carry forward
- Healthcheck configuration — follow existing pattern from root compose
- Environment variable naming — continue using `DB_*` prefix from `.env`
- Init SQL mount — continue mounting `./backend/db/init.sql`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Infrastructure
- `docker-compose.yml` — Existing monolithic compose file to be split. Contains the MySQL + Adminer + Backend + Frontend configuration being decoupled.
- `backend/Dockerfile` — Existing backend Dockerfile (dev mode via nodemon).
- `frontend/Dockerfile` — Existing frontend Dockerfile (dev mode via Vite).
- `backend/db/init.sql` — Database initialization script mounted to MySQL's docker-entrypoint-initdb.d.
- `.env.example` — Environment variable template showing required variables.
- `backend/.env` — Runtime environment variables (credentials, secrets).

### Requirements & Roadmap
- `.planning/ROADMAP.md` §Phase 9 — Success criteria and phase goal.
- `.planning/REQUIREMENTS.md` §DOCK-01 — Requirement definition.
- `.planning/PROJECT.md` — Project context, constraints, key decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docker-compose.yml` — Full MySQL+Adminer config with healthcheck, volumes, networks, and env vars — can be extracted directly into `docker-compose.db.yml`.
- `backend/db/init.sql` — Already mounted in existing compose; same mount path works for db.yml.
- `backend/Dockerfile` — Not directly used by db.yml (backend is Phase 10), but confirms the backend expects `DB_HOST=mysql`.

### Established Patterns
- Healthcheck pattern: `mysqladmin ping -h localhost` with 10s interval, 5s timeout, 5 retries.
- Network: `fitness_net` bridge driver — all services share this network.
- Volume: named volume `mysql_data` for persistent MySQL storage.
- `.env` at project root for environment variable injection.

### Integration Points
- Phase 10 (Backend Service) and Phase 12 (Root Orchestration) will reference `docker-compose.db.yml` via `docker compose -f` or include mechanism.
- Backend expects MySQL at hostname `mysql`, port 3306, database `fitness_app`.
- Future compose files share `fitness_net` network for inter-service communication.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard Docker Compose practices. Follow the patterns already established in the existing `docker-compose.yml`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-Database Service*
*Context gathered: 2026-05-27*
