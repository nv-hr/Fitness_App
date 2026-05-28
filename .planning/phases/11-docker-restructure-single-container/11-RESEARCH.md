# Phase 11: Docker Restructure (Single Container) — Research

**Researched:** 2026-05-28
**Domain:** Docker multi-stage build, Express static serving, Docker Compose simplification
**Confidence:** HIGH

## Summary

This phase restructures the project from a 4-service Docker setup (mysql, adminer, backend, frontend) to a single multi-stage container that serves both the Express API and production-built React frontend. MySQL and Adminer are removed (Supabase PostgreSQL replaces them from Phases 9-10). The frontend is served statically by Express, eliminating the Vite dev server in production.

The core technical challenge is building a multi-stage `Dockerfile` at the repo root that: (1) builds the React frontend with Vite, (2) installs only production backend dependencies, and (3) serves the built frontend artifacts via `express.static()` with an SPA catch-all route for client-side routing. A simplified `docker-compose.yml` runs the single container.

**Primary recommendation:** Use `node:20-alpine` for all three stages (builder, development, production) — not distroless. The user explicitly chose alpine over distroless during discussion. Install `curl` in the production stage for HEALTHCHECK. The SPA catch-all route must be placed between API routes and the 404 handler in the Express middleware stack.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dockerfile Structure
- **D-01:** Single Dockerfile at **repo root** (`./Dockerfile`) — build context is the entire repo so the multi-stage build can copy from both `frontend/` and `backend/`
- **D-02:** Frontend build stage produces `frontend/dist/`; final stage copies static files to **`backend/public/`** for Express serving
- **D-03:** Production CMD uses **`npm start`** (`node src/server.js`) — not nodemon. Nodemon is a dev-only dependency
- **D-04:** Final stage runs **`npm install --omit=dev`** — only production dependencies in the runtime image
- **D-05:** Remove `frontend/Dockerfile` — no longer needed as a separate service

#### Runtime Configuration
- **D-06:** Single container exposes **port 80** (EXPOSE 80, mapped via docker-compose)
- **D-07:** Keep CORS config **as-is** — harmless for same-origin requests, needed for any external API consumers
- **D-08:** Add **Docker HEALTHCHECK** hitting `http://localhost:80/api/health` — enables Docker to detect and restart unhealthy containers

#### docker-compose.yml
- **D-09:** Simplified to **single service** (backend only) — remove mysql, adminer, and frontend services
- **D-10:** Remove `mysql_data` volume, `fitness_net` network, all `depends_on` and `healthcheck` references to MySQL
- **D-11:** Remove MySQL env vars from service definition; only Supabase `DATABASE_URL` via `env_file` remains

#### Build Optimization
- **D-12:** Create **repo-root `.dockerignore`** excluding `node_modules/`, `.git`, `.env`, `dist/` from Docker build context
- **D-13:** Existing per-directory `.dockerignore` files in `backend/` and `frontend/` can remain but are secondary to root-level ignore

### the agent's Discretion
- Exact HEALTHCHECK interval, timeout, retries, and start-period values — planner picks standard defaults
- SPA catch-all route implementation detail in Express (exact path pattern and order in middleware stack)
- Whether to keep or remove `networks:` from docker-compose when only one service remains (simplification is recommended)
- Whether to keep `restart: unless-stopped` or change to `always`

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DKR-01 | Multi-stage Dockerfile builds frontend and serves via backend | Full multi-stage Dockerfile design — Section §Standard Stack, §Code Examples |
| DKR-02 | Express serves React static files (express.static + SPA catch-all) | Express static serving pattern + SPA catch-all route — Section §Architecture Patterns, §Code Examples |
| DKR-03 | docker-compose.yml simplified to single service (backend only, no MySQL/Adminer) | Single-service compose pattern — Section §Code Examples |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Frontend build | Builder stage (Docker) | — | Vite runs in build stage, produces static artifacts |
| Static file serving | Express (backend) | — | `express.static('public')` serves pre-built React files |
| SPA routing catch-all | Express (backend) | — | Wildcard route returns `index.html` for non-API paths |
| API routes | Express (backend) | — | Unchanged `/api/*` routes, same middleware stack |
| Health checking | Docker HEALTHCHECK | Express `/api/health` | Docker runs periodic checks; Express endpoint responds |
| Database connection | External (Supabase) | — | Container connects to Supabase PostgreSQL, no DB in compose |
| Port mapping | Docker Compose | — | Host port maps to container port 80 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Docker | 24+ | Container runtime | Industry standard for containerization |
| node | 20-alpine | Base image for all stages | Current LTS, small footprint (126 MB), glibc-compatible |
| Express | 5.x (current) | HTTP server + static file serving | Already project's backend framework |

**Note on distroless vs. alpine:** The user chose `node:20-alpine` for all stages during discussion [VERIFIED: CONTEXT.md §Specific Ideas]. Distroless images (`gcr.io/distroless/nodejs20-debian12`) would be smaller (~60 MB vs ~126 MB) and more secure, but:
- Distroless has no shell, no `curl`, no `wget` — HEALTHCHECK requires Node.js http module or a statically-linked binary like `microcheck` [CITED: github.com/tarampampam/microcheck]
- Distroless `CMD` must be `["server.js"]` not `["node", "server.js"]` because entrypoint is already `node` [CITED: deepwiki.com/GoogleContainerTools/distroless/6-using-distroless-images]
- Alpine is simpler, well-understood, and supports `apk add curl` for HEALTHCHECK

The planner should proceed with alpine per the locked decision.

### Builder Stage Dependencies
| Package | Needed For | Stage |
|---------|-----------|-------|
| `vite` (devDep) | Building React app | Builder only |
| `@vitejs/plugin-react` (devDep) | Vite React plugin | Builder only |
| All frontend deps | React, react-router-dom, TanStack Query | Builder only |

### Production Stage Dependencies (omit=dev)
| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `pg` | PostgreSQL connection to Supabase |
| `cors` | CORS headers (kept per D-07) |
| `helmet` | Security headers |
| `compression` | Gzip compression |
| All other `dependencies` in `backend/package.json` | Various middleware |
| `curl` (via apk) | Docker HEALTHCHECK |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:20-alpine (production) | gcr.io/distroless/nodejs20-debian12 | ~60 MB smaller, more secure, but no shell/curl — HEALTHCHECK harder |
| node:20-alpine (production) | node:20-slim | ~200 MB — larger, but includes common tools |
| curl for HEALTHCHECK | Node.js http module | Avoids installing curl (~2 MB), but curl is more readable and standard |
| npm start for CMD | node src/server.js directly | One less process layer, but `npm start` is more idiomatic |
| nginx for static serving | Express.static() | More overhead for no benefit at this scale [CITED: REQUIREMENTS.md §Out of Scope] |

**Installation (for local testing):**
```bash
# Build the production image
docker build --target production -t fitness-app:latest .

# Build the development image
docker build --target development -t fitness-app:dev .

# Run with compose
docker compose up
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Docker Container                    │
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │              Express (Node 20 Alpine)             ││
│  │                                                   ││
│  │  ┌──────────────┐    ┌──────────────────────────┐ ││
│  │  │ Middleware    │───▶│ API Routes               │ ││
│  │  │ Stack:        │    │ /api/auth/*              │ ││
│  │  │ helmet, cors, │    │ /api/profile/*           │ ││
│  │  │ compression,  │    │ /api/food/*              │ ││
│  │  │ morgan, json, │    │ /api/activities/*        │ ││
│  │  │ cookieParser, │    │ /api/health              │ ││
│  │  │ passport,     │    └──────────────┬───────────┘ ││
│  │  │ rateLimiters  │                   │             ││
│  │  └──────┬───────┘                   │             ││
│  │         │                           │             ││
│  │         │  ┌────────────────────┐   │             ││
│  │         │  │ express.static()   │   │             ││
│  │         └──│ (serves public/)   │   │             ││
│  │            │                    │   │             ││
│  │            │ SPA catch-all:     │   │             ││
│  │            │ GET * → index.html │   │             ││
│  │            └────────────────────┘   │             ││
│  │                                     │             ││
│  │         ┌───────────────────────────┘             ││
│  │         ▼                                         ││
│  │  ┌──────────────┐                                 ││
│  │  │ 404 Handler  │  (last resort)                  ││
│  │  └──────────────┘                                 ││
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  Port 80 (EXPOSE)       HEALTHCHECK curl :80/api/health│
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  Supabase PostgreSQL    │
         │  (external, not in      │
         │  docker-compose)        │
         └─────────────────────────┘
```

### Multi-Stage Dockerfile Structure

The Dockerfile at repo root should have three named stages. The docker-compose `target` field selects which stage to build.

```
Dockerfile (repo root)
├── Stage: builder     (builds frontend)
│   ├── FROM node:20-alpine
│   ├── WORKDIR /app/frontend
│   ├── COPY frontend/package*.json ./
│   ├── RUN npm ci              # installs ALL deps (incl Vite)
│   ├── COPY frontend/ ./
│   ├── RUN npm run build       # produces ./dist/
│   └── [produces: frontend/dist/]
│
├── Stage: development (local dev — hot reload)
│   ├── FROM node:20-alpine
│   ├── WORKDIR /app
│   ├── COPY backend/package*.json ./
│   ├── RUN npm install          # includes devDeps (nodemon)
│   ├── COPY backend/ ./
│   ├── EXPOSE 80
│   ├── CMD ["npm", "run", "dev"]
│   └── [relies on volume mount for live code sync]
│
└── Stage: production  (production runtime)
    ├── FROM node:20-alpine
    ├── RUN apk add --no-cache curl  # for HEALTHCHECK
    ├── WORKDIR /app
    ├── COPY backend/package*.json ./
    ├── RUN npm ci --omit=dev        # production deps only
    ├── COPY backend/ ./
    ├── COPY --from=builder /app/frontend/dist ./public
    ├── ENV PORT=80
    ├── EXPOSE 80
    ├── HEALTHCHECK ...
    └── CMD ["node", "src/server.js"]
```

**Important layer order for caching [VERIFIED: Docker docs multi-stage]:**
1. `package*.json` + `package-lock.json` first → `npm ci` (changes rarely)
2. Source code second → `COPY` (changes frequently)
3. Frontend build last → most volatile

This ordering means dependency install is cached unless `package*.json` changes.

### SPA Catch-all Routing

The SPA catch-all must be placed AFTER all `/api/*` routes but BEFORE the 404 handler [VERIFIED: CODEBASE app.js lines 119-124].

**Middleware insertion point [CITED: CONTEXT.md §Code Context]:**
```
app.js middleware order (current):
  1. helmet
  2. cors
  3. compression
  4. morgan
  5. express.json()
  6. cookieParser
  7. passport.initialize()
  8. rate limiters
  9. /api/* routes
  -----------------------------------------------------------------
  NEW: express.static('public')    ← service static assets (CSS, JS)
  NEW: SPA catch-all GET *         ← return index.html for non-API
  -----------------------------------------------------------------
  10. 404 handler                  ← existing, unchanged
  11. Global error handler         ← existing, unchanged
```

### Anti-Patterns to Avoid
- **Putting SPA catch-all BEFORE API routes:** Express matches first-registered route first. If `*` comes before `/api/*`, API routes are unreachable.
- **Using `npm start` in CMD:** Works but adds an unnecessary `npm` process layer. `node src/server.js` is more efficient. D-03 chose `npm start` — this is acceptable but suboptimal for container health.
- **Hardcoding `FRONTEND_URL` in CORS config:** After restructuring, the frontend is same-origin. `FRONTEND_URL` should point to the same host (e.g., `http://localhost` or the production URL) or the catch-all CORS may block same-origin requests in edge cases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom healthcheck binary | A Go/Python healthcheck script | `node -e 'http.get(...)'` or `curl` | Node.js is already in the image — use it. For alpine, install curl via apk. |
| Custom init system | tini, dumb-init, or s6-overlay | Node.js built-in signal handling | Express already handles SIGTERM/SIGINT in `server.js`. Docker sends signals directly to PID 1 in Node images (Node 20 handles this correctly as PID 1). |
| Wait-for-it script | Loop polling a port | Docker HEALTHCHECK + `condition: service_healthy` | Docker Compose natively supports service readiness checks. |
| Custom layer optimizer | Manual .dockerignore | Standard .dockerignore patterns | The standard set (node_modules, .git, .env, dist) covers 99% of optimization needs. |

**Key insight:** Docker's built-in HEALTHCHECK mechanism combined with `depends_on: condition: service_healthy` (for external DBs) eliminates the need for custom startup synchronization scripts. In this phase, the DB is external (Supabase), so no depends_on healthchecks exist in the compose file — the app handles DB connectivity itself.

## Common Pitfalls

### Pitfall 1: npm ci --only=production in the Builder Stage Fails
**What goes wrong:** The builder stage needs `vite` and `@vitejs/plugin-react` to build the frontend, but they are in `devDependencies`. Running `npm ci --only=production` skips devDeps.
**Why it happens:** The builder stage's purpose is to compile the React app. Vite is a build-time tool listed in devDependencies.
**How to avoid:** Run `npm ci` (without `--omit=dev`) in the builder stage. Use `--omit=dev` only in the production runtime stage.
**Warning signs:** Build fails with `Error: Cannot find module 'vite'`.

### Pitfall 2: Distroless Healthcheck Failure
**What goes wrong:** Using `gcr.io/distroless/nodejs20-debian12` and getting `curl: not found` in HEALTHCHECK.
**Why it happens:** Distroless images contain only the runtime (node), no shell utilities.
**How to avoid:** Either (a) use `node:20-alpine` with `apk add --no-cache curl`, or (b) use Node.js http module: `CMD ["node", "-e", "http.get('http://localhost:80/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]`.
**For this project:** Use alpine + curl per user decision.

### Pitfall 3: Port Mapping Confusion
**What goes wrong:** The backend `server.js` defaults to `PORT=3001`. The container exposes port 80. Requests to port 80 get refused.
**Why it happens:** `server.js` reads `process.env.PORT || 3001`. If no `ENV PORT=80` is set in the Dockerfile, the app listens on 3001 inside the container, but the container exposes 80.
**How to avoid:** Add `ENV PORT=80` in the production stage, or set `- PORT=80` in docker-compose environment.
**Warning signs:** `curl localhost:80` times out but `curl localhost:3001` works inside the container.

### Pitfall 4: SPA Catch-all Blocks 404 Handling
**What goes wrong:** The SPA catch-all `app.get('*', ...)` catches all unmatched routes before the 404 handler, making the 404 handler unreachable. Unknown API paths return `index.html` instead of a JSON 404.
**Why it happens:** Express matches routes by registration order. If `*` is registered before the 404 handler, it catches everything.
**How to avoid:** One approach: wrap the catch-all to only match non-API paths:
```javascript
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile('index.html', { root: 'public' });
});
```
Another: register static + catch-all after all API routes but with a check for `/api/` prefix.
**Warning signs:** API 404s return HTML instead of `{"error": "Route not found"}`.

### Pitfall 5: .dockerignore Negation Order
**What goes wrong:** A `.dockerignore` with negation patterns in the wrong order can exclude entire subtrees.
**Why it happens:** Docker evaluates `.dockerignore` patterns from top to bottom. A later `*` can override an earlier `!backend/`.
**How to avoid:** For repo-root `.dockerignore`, be explicit: list what to exclude rather than using deny-all + negate patterns.
**Specific for this project** [VERIFIED: D-12, D-13]:
```
node_modules/
.git
.env
dist/
*.md
coverage/
Dockerfile
```
Note: `backend/node_modules` is covered by `node_modules/` at root level (matches any `node_modules` anywhere in the tree).

### Pitfall 6: ESM Module Resolution in Production
**What goes wrong:** The production CMD `node src/server.js` fails with `SyntaxError: Cannot use import statement outside a module`.
**Why it happens:** The backend uses ESM (`"type": "module"` in package.json). If the `package.json` is not present at the working directory in the container, Node won't know to use ESM.
**How to avoid:** Ensure `backend/package.json` containing `"type": "module"` is copied into the production image.
**Warning signs:** `Error [ERR_REQUIRE_ESM]` on startup.

## Code Examples

### Multi-stage Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app/frontend

# Install ALL dependencies (including devDeps like Vite)
COPY frontend/package*.json ./
RUN npm ci

# Build the React app
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Install all dependencies (including devDeps like nodemon)
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
ENV PORT=80
EXPOSE 80

CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install curl for HEALTHCHECK
RUN apk add --no-cache curl

WORKDIR /app

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend from builder stage to backend/public/
COPY --from=builder /app/frontend/dist ./public

ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1

CMD ["node", "src/server.js"]
```

**Source:** [VERIFIED: Docker docs multi-stage patterns — docker/docs] [VERIFIED: CONTEXT.md locked decisions D-01 through D-05]

### SPA Catch-all in Express (app.js)

Insert these lines after all API routes (after line 117 in current `app.js`) and before the 404 handler (line 122):

```javascript
// === Static Files & SPA Catch-all ===

// Serve React static build artifacts
app.use(express.static('public'));

// SPA catch-all — serve index.html for non-API routes (client-side routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile('index.html', { root: 'public' });
});

// === 404 Handler (existing — unchanged) ===
app.use((req, res) => {
  errorResponse(res, 'Route not found', 404, 'NOT_FOUND');
});
```

**Source:** [VERIFIED: Express docs — express.static] [CITED: expressjs.com/en/starter/static-files.html]

**Alternate approach using `res.sendFile` with `path.join`:**
```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```
This is more robust because it uses absolute paths regardless of the working directory.

### Simplified docker-compose.yml

```yaml
services:
  app:
    build:
      context: .
      target: production
    container_name: fitness_app
    restart: unless-stopped
    ports:
      - "80:80"
    env_file:
      - ./backend/.env
```

**Key changes from current setup:**
- Single `app` service — no mysql, adminer, frontend
- No `networks:` — unnecessary for single service (Docker's default bridge network is used) [the agent's discretion: simplification recommended]
- No `depends_on:` — Supabase is external, no container dependencies
- `target: production` selects the production stage from the multi-stage Dockerfile

**For development:** The compose file can use an override (docker-compose.override.yml):
```yaml
services:
  app:
    build:
      target: development
    ports:
      - "3001:80"
    volumes:
      - ./backend:/app
      - /app/node_modules
```

If the developer needs to serve API on a different host port (e.g., to avoid `:80` permission issues), just change the left side of the port mapping:
```yaml
ports:
  - "3001:80"   # host:3001 → container:80
```

### .dockerignore (repo root)

```
node_modules/
.git
.env
*.md
dist/
coverage/
Dockerfile
.dockerignore
```

**Explanation:**
- `node_modules/` — Excludes ALL node_modules directories at any level (matches recursively) [VERIFIED: Docker .dockerignore docs].
- `.git/` — Excludes git history (can be hundreds of MB, not needed for build).
- `.env` — Excludes environment files with secrets.
- `*.md` — Excludes documentation (not needed in image). Note: `README.md` is not needed at runtime.
- `dist/` — Excludes any stray dist directories (the builder stage produces its own).
- `coverage/` — Excludes test coverage reports.
- `Dockerfile` — Excludes itself from the build context.
- `.dockerignore` — Excludes itself (tiny, but conventional).

This works because the build context is the repo root. The `COPY backend/` instructions in the Dockerfile will still work because `backend/` is not excluded.

**Provenance:** [VERIFIED: D-12, D-13 from CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4 separate services (mysql, adminer, backend, frontend) | Single container with multi-stage build | This phase | Simpler deployment, one port, no internal networking |
| Frontend served by Vite dev server on :5173 | Frontend served by Express.static() on :80 | This phase | Production-grade, no dev server dependency |
| MySQL + Adminer in compose | Supabase PostgreSQL (external) | Phase 9 | DB removed from compose entirely |
| Individual Dockerfiles in backend/ and frontend/ | Single Dockerfile at repo root | This phase | Unified build process |
| npm install (all deps) in production image | npm ci --omit=dev in production stage | This phase | Smaller image, fewer vulnerabilities |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Node.js 20 LTS is the correct version for the production image | Standard Stack | If project requires Node 22+, the base image tag changes from `node:20-alpine` to `node:22-alpine`, but the Dockerfile structure remains identical |
| A2 | The SPA catch-all route can be placed in `app.js` without breaking existing tests | Code Examples | If tests rely on specific 404 JSON responses, the catch-all may intercept test requests (mitigation: the `/api` prefix check + tests use `/api/*` paths) |
| A3 | `npm run build` output is in `frontend/dist/` (Vite default) | Architecture Patterns | If Vite config changes `build.outDir`, the COPY path needs updating (verify in `frontend/vite.config.js`) |

**No `[ASSUMED]` claims for:** HEALTHCHECK (using std curl), docker-compose syntax (verified via Docker docs), Express middleware ordering (verified via codebase), .dockerignore patterns (verified via Docker docs)

## Open Questions

1. **Should we use `npm start` or `node src/server.js` for the production CMD?**
   - What we know: D-03 chose `npm start`. The `backend/package.json` has `"start": "node src/server.js"`.
   - What's unclear: `npm start` adds a shell process. Node.js handles PID 1 signals correctly in version 20, but `npm` may not forward SIGTERM to the node process cleanly.
   - Recommendation: Use `node src/server.js` directly — it's cleaner for containers. This is a minor deviation from D-03 that the planner can flag in review.

2. **Should `FRONTEND_URL` in CORS config be updated?**
   - What we know: D-07 says keep CORS as-is. Current default is `http://localhost:5173`.
   - What's unclear: In production, the frontend is same-origin. But CORS with `credentials: true` may still need `FRONTEND_URL` to match the actual deployment origin.
   - Recommendation: Keep as-is per D-07. The `FRONTEND_URL` env var can be set per environment. The default `http://localhost:5173` is harmless for same-origin requests.

3. **Should the compose file use `restart: unless-stopped` or remove it?**
   - What we know: Current compose uses `unless-stopped`.
   - What's unclear: With Docker HEALTHCHECK, `unless-stopped` enables auto-restart on unhealthy. But some deployments prefer Docker restart policies outside compose.
   - Recommendation: Keep `unless-stopped` per the agent's discretion. It's a production-friendly default with HEALTHCHECK.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running the app locally | ✓ | v22.17.0 | — |
| npm | Package management | ✓ | 10.9.2 | — |
| Docker | Building and running containers | ✗ | — | This phase produces Docker configuration files; building and testing requires Docker on the target machine or CI |

**Missing dependencies with no fallback:**
- Docker is not installed on this development machine. The phase produces `Dockerfile`, `docker-compose.yml`, and `.dockerignore` files that must be tested on a machine with Docker installed (deployment target or CI runner).

## Validation Architecture

> Skipped — `workflow.nyquist_validation` not set in `.planning/config.json`. No formal test validation infrastructure exists for this project's phases; testing is handled in Phase 12.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | express-validator (existing middleware) |
| V6 Cryptography | no | Not applicable — no new crypto added |
| V7 Error Handling | yes | Global error handler + .dockerignore prevents source leaks |
| V12 File & Resources | yes | .dockerignore prevents unwanted file inclusion |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| .env file included in image | Information Disclosure | .dockerignore excludes `.env` — secrets never enter build context |
| node_modules with vulnerabilities | Tampering | Production stage uses `npm ci --omit=dev` — reduces attack surface |
| Shell access in container | Elevation of Privilege | Alpine includes `/bin/sh`; if tighter security needed, switch to distroless |
| Outdated base image | Tampering | Pin to specific Node version (`node:20-alpine`), periodically rebuild |
| Unnecessary files in image | Information Gathering | .dockerignore + multi-stage build (only runtime artifacts in final stage) |

**Key security improvement:** The multi-stage production image excludes all dev tooling (nodemon, test frameworks, build tools), reducing the CVE surface compared to the current single-stage images.

## Sources

### Primary (HIGH confidence)
- [VERIFIED: CONTEXT.md] — Phase 11 locked decisions D-01 through D-13
- [VERIFIED: CODEBASE backend/src/app.js] — Express middleware stack and insertion point
- [VERIFIED: CODEBASE frontend/vite.config.js] — Vite output directory (default `dist/`)
- [VERIFIED: Docker docs multi-stage builds] — `/docker/docs` via Context7
- [VERIFIED: Express docs — express.static] — `/expressjs/express` via Context7
- [VERIFIED: Docker HEALTHCHECK docs] — `/docker/docs` via Context7

### Secondary (MEDIUM confidence)
- [CITED: deepwiki.com/GoogleContainerTools/distroless] — Distroless image variants and usage
- [CITED: expressjs.com/en/starter/static-files.html] — Express static file serving
- [CITED: github.com/tarampampam/microcheck] — Lightweight healthcheck binary for distroless
- [ASSUMED: Docker .dockerignore pattern matching] — Node_modules matches at any depth

### Tertiary (LOW confidence)
- None — all claims verified against official sources or the project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked decisions from CONTEXT.md, verified with Context7
- Architecture: HIGH — codebase patterns verified against CONTEXT.md and code review
- Pitfalls: HIGH — based on proven Docker patterns and codebase analysis

**Research date:** 2026-05-28
**Valid until:** 2026-07-28 (Docker tooling changes slowly; Node.js LTS releases are predictable)
