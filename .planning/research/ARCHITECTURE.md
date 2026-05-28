# Architecture Research: Supabase Migration & Single-Container Deployment

**Domain:** Full-stack Express + React monorepo migration (MySQL → Supabase PostgreSQL, dual-container → single-container)
**Researched:** 2026-05-27
**Confidence:** HIGH

## Current Architecture

### System Overview (v1.1 — As-Is)

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Host                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐    │
│  │  MySQL   │  │  Adminer │  │ Backend  │  │ Frontend│    │
│  │  8.4     │  │ (admin)  │  │ Express  │  │  Vite   │    │
│  │ :3306    │  │ :8080    │  │ :3001    │  │ :5173   │    │
│  └────┬─────┘  └──────────┘  └────┬─────┘  └────┬─────┘   │
│       │                           │              │          │
│       └───────────────────────────┼──────────────┘          │
│                                   │  API calls              │
│                                   │  (JSON, httpOnly JWT)   │
│                              ┌────┴─────┐                   │
│                              │   Vite   │                   │
│                              │  Proxy   │                   │
│                              │ /api →    │                  │
│                              │ :3001     │                  │
│                              └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Current Stack (Layer by Layer)

| Layer | Technology | Details |
|-------|-----------|---------|
| **Database** | MySQL 8.4 | Docker container with `init.sql` schema + seed data |
| **Backend** | Express 5 + ESM | `mysql2/promise` Pool, repository pattern, 4 repositories |
| **Frontend** | React 19 + Vite 8 | TanStack Query, Vite proxy for `/api`, dev server |
| **Auth** | JWT (httpOnly cookies) | Passport.js + Google OAuth2, bcrypt for passwords |
| **Infrastructure** | Docker Compose | 4 services on shared `fitness_net` bridge network |
| **Deployment** | Cloudflare Tunnel | Exposes `localhost:3001` (backend) and `localhost:5173` (frontend) |

### Current Data Flow (Request Lifecycle)

```
Browser ──GET /api/food/search?q=chicken──→ Vite Proxy ──→ Express
                                                              │
                                              auth.middleware ←── httpOnly cookie JWT
                                                              │
                                                    food.controller.js
                                                              │
                                                    food.service.js
                                                              │
                                                    food.repository.js
                                                              │
                                              pool.query('SELECT ... LIKE ?', [query])
                                                              │
                                                         MySQL 8.4
                                                              │
                                              result rows ──→ controller ──→ response JSON
```

### Repository Pattern (Current)

Each repository file:
1. Imports `pool` from `../config/database.js` (mysql2/promise Pool singleton)
2. Exports async functions that call `pool.query(sql, params)`
3. Destructures result as `const [rows] = await pool.query(...)`
4. Uses `?` positional placeholders
5. Returns `rows[0]` for single-row queries, `rows` for multi-row
6. Handles MySQL-specific errors like `ER_DUP_ENTRY`
7. Uses MySQL functions: `LAST_INSERT_ID()`, `NOW()`, `CURDATE()`, `DATE_SUB()`, `JSON_OVERLAPS()`

### Current Docker Configuration

- **Backend Dockerfile**: Single-stage, `node:20-alpine`, runs `npm run dev` (nodemon)
- **Frontend Dockerfile**: Single-stage, `node:20-alpine`, runs `npm run dev` (Vite dev server)
- **docker-compose.yml**: 4 services, 1 named volume (`mysql_data`), 1 bridge network

---

## Target Architecture (v1.2 — To-Be)

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Docker Host                              │
│  ┌─────────────────────────────────────────────┐             │
│  │         Single Container (full-stack)         │             │
│  │  ┌───────────────────────────────────────┐   │             │
│  │  │       Express (port 3001)              │   │             │
│  │  │  ┌─────────────────────────────────┐   │   │             │
│  │  │  │  API Routes (/api/*)             │   │   │             │
│  │  │  │  ┌──────────┐ ┌──────────┐      │   │   │             │
│  │  │  │  │  Auth    │ │  Food    │      │   │   │             │
│  │  │  │  │  routes  │ │  routes  │      │   │   │             │
│  │  │  │  └──────────┘ └──────────┘      │   │   │             │
│  │  │  │  ┌──────────┐ ┌──────────┐      │   │   │             │
│  │  │  │  │ Activity │ │ Profile  │      │   │   │             │
│  │  │  │  │ routes   │ │ routes   │      │   │   │             │
│  │  │  │  └──────────┘ └──────────┘      │   │   │             │
│  │  │  └─────────────────────────────────┘   │   │             │
│  │  │  ┌─────────────────────────────────┐   │   │             │
│  │  │  │  Static File Serving            │   │   │             │
│  │  │  │  express.static('dist')          │   │   │             │
│  │  │  │  (React build output from        │   │   │             │
│  │  │  │   ./frontend/dist)               │   │   │             │
│  │  │  └─────────────────────────────────┘   │   │             │
│  │  └───────────────────────────────────────┘   │             │
│  └─────────────────────────────────────────────┘             │
│                                                              │
│       ┌──────────────────┐    ┌──────────────────┐           │
│       │   Supabase        │    │   Supavisor      │           │
│       │   PostgreSQL      │◄───│   Pooler          │           │
│       │   (managed)       │    │   port 6543       │           │
│       │   db.xxxx.supabase│    │   (transaction    │           │
│       │   .co:5432        │    │    mode)          │           │
│       └──────────────────┘    └──────────────────┘           │
│                                                              │
│       ════════════════════════════════════════════════════    │
│       NOT in Docker — managed by Supabase cloud               │
│       ════════════════════════════════════════════════════    │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **DB Driver** | `pg` (node-postgres) | Same Pool-based API as mysql2/promise; minimal refactor; widely adopted; high-quality TypeScript support optional |
| **Supabase connection** | Supavisor pooler (port 6543) | Transaction-mode pooling handles Express long-running connections efficiently; SSL enforced |
| **Application pool size** | `max: 5` | Free tier Supavisor limit is 15 pooled connections; one Express instance needs very few |
| **Static file serving** | Express `express.static()` | Adequate for low-traffic health app; avoids nginx complexity; no extra process to manage |
| **Single container** | Multi-stage Docker build | Stage 1: build React in node:20-alpine; Stage 2: copy build output into Express image |
| **Schema migration** | Supabase SQL Editor + manual migration | Direct SQL via Supabase dashboard; one-time migration script mapping MySQL→PG types |
| **No ORM** | Keep raw SQL / repository pattern | Avoid Prisma/Drizzle overhead; migration cost of rewriting 4 simple repository files is low |

---

## Component Changes

### New Components

| Component | Location | Purpose | Implementation |
|-----------|----------|---------|----------------|
| `src/config/database.pg.js` | `/backend/src/config/` | pg Pool wrapper for Supabase | Replaces `database.js`; same singleton export pattern; SSL enabled |
| `backend/migrations/supabase.sql` | `/backend/migrations/` | PostgreSQL schema + seed data | Translated from `init.sql`; MySQL→PG type mapping |

### Modified Components

| Component | Change Type | What Changes |
|-----------|-------------|--------------|
| `src/config/database.js` | **REPLACED** | Removed; replaced by `database.pg.js` (or renamed in-place) |
| `src/repositories/*.js` (4 files) | Moderate rewrite | Placeholder syntax (`?` → `$1`), result destructuring (`[rows]` → `result.rows`), MySQL functions → PG equivalents |
| `src/server.js` | Minor change | Pool query check uses `SELECT 1` (same SQL, different driver) |
| `docker-compose.yml` | Major restructure | Remove `mysql`, `adminer`, `frontend` services; single `app` service; add `SUPABASE_URL` env vars |
| `backend/Dockerfile` | Major rewrite | Multi-stage build including frontend compilation |
| `Backend .env` | Minor change | Replace `DB_HOST/USER/PASSWORD/NAME` with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (optional) |
| `frontend/vite.config.js` | Minor change | Remove Vite proxy; API calls go directly to same origin in production |
| `frontend/src/shared/lib/http.js` | Minor change | `VITE_API_URL` becomes empty string (same origin) or base path |

### Removed Components

| Component | Reason |
|-----------|--------|
| `mysql` service (docker-compose) | Supabase is managed, not local |
| `adminer` service | Database managed via Supabase dashboard |
| `frontend` service (docker-compose) | Frontend built into backend image |
| `backend/db/init.sql` | Replaced by `backend/migrations/supabase.sql` |
| `mysql_data` volume | No local MySQL data |
| `fitness_net` network | Single container doesn't need inter-service networking |

---

## Data Flow (Target)

### Request Lifecycle (After Migration)

```
Browser ──── GET /api/food/search?q=chicken ────→ Express (same origin)
                                                    │
                                    auth.middleware ←── httpOnly cookie JWT
                                                    │
                                          food.controller.js
                                                    │
                                          food.service.js
                                                    │
                                          food.repository.js
                                                    │
                        pool.query('SELECT ... LIKE $1', [query])
                                                    │
                          ┌─────────────────────────┘
                          │  SSL/TLS (Supavisor port 6543)
                          ▼
                    Supavisor Pooler
                          │
                          ▼
                    Supabase PostgreSQL
                          │
                    result.rows ──→ response JSON
```

### Static File Serving Flow

```
Browser ──── GET / ────────→ Express
                                │
              express.static('./dist')
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              index.html              /assets/*.js
              (SPA entry)             (React build)
                    │                       │
              React Router            Long-term cache
              handles /profile,       (Cache-Control:
              /food-log, etc.         public, immutable)
```

### Database Connection Flow

```
Server Start
    ↓
pg Pool created:
  new Pool({
    connectionString: DATABASE_URL,  // Supavisor pooled:6543
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
    ↓
await pool.query('SELECT 1')  // health check on startup
    ↓
  On each request:
    pool.query(sql, params)
      → acquires connection from pool
      → executes via Supavisor
      → connection returned to pool
    ↓
  On shutdown:
    await pool.end()
```

---

## MySQL → PostgreSQL Query Translation

### Placeholder Syntax

```javascript
// MySQL (mysql2) — BEFORE
await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

// PostgreSQL (pg) — AFTER
await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
```

### Result Destructuring

```javascript
// MySQL — BEFORE
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
return rows[0] || null;

// PostgreSQL — AFTER
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
return result.rows[0] || null;
```

### Last Insert ID

```javascript
// MySQL — BEFORE (two queries)
await pool.query('INSERT INTO users (email) VALUES (?)', [email]);
const [rows] = await pool.query('SELECT * FROM users WHERE id = LAST_INSERT_ID()');
return rows[0] || null;

// PostgreSQL — AFTER (single query with RETURNING)
const result = await pool.query(
  'INSERT INTO users (email) VALUES ($1) RETURNING *',
  [email]
);
return result.rows[0] || null;
```

### Boolean Handling

```javascript
// MySQL — BEFORE (TINYINT(1) → 0/1)
await pool.query(
  'INSERT INTO users (email, pdp_consent) VALUES (?, ?)',
  [email, pdpConsent ? 1 : 0]
);

// PostgreSQL — AFTER (BOOLEAN → true/false)
await pool.query(
  'INSERT INTO users (email, pdp_consent) VALUES ($1, $2)',
  [email, pdpConsent]  // true/false directly
);
```

### Date Functions

```sql
-- MySQL
DATE_SUB(CURDATE(), INTERVAL ? DAY)
NOW()

-- PostgreSQL
CURRENT_DATE - INTERVAL '$1 days'  -- Note: interval value with $ placeholder
-- or more safely:
CURRENT_DATE - ($1 || ' days')::INTERVAL
NOW()  -- same!
```

### JSON Operations

```sql
-- MySQL: JSON_OVERLAPS for array intersection
SELECT * FROM activities WHERE JSON_OVERLAPS(goal_tags, CAST(? AS JSON))

-- PostgreSQL: JSONB overlap operator
SELECT * FROM activities WHERE goal_tags::jsonb ?| ARRAY[$1, $2]
-- OR simpler: use text array column instead of JSON
SELECT * FROM activities WHERE goal_tags && ARRAY[$1, $2]
```

---

## Schema Migration: MySQL → PostgreSQL

### Type Mapping

| MySQL Type | PostgreSQL Type | Notes |
|-----------|----------------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` or `INT GENERATED BY DEFAULT AS IDENTITY` | Serial is simpler for migration |
| `TINYINT(1)` | `BOOLEAN` | Direct mapping |
| `DECIMAL(5,2)` | `DECIMAL(5,2)` or `NUMERIC(5,2)` | Compatible |
| `ENUM('a','b','c')` | `VARCHAR(20) CHECK (...)` or `CREATE TYPE ... AS ENUM` | CHECK constraint is simpler; avoids dependency on custom type |
| `JSON` | `JSONB` | Binary JSON, more efficient |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMPTZ DEFAULT NOW()` | Same behavior |
| `DATETIME` | `TIMESTAMP` or `TIMESTAMPTZ` | MySQL DATETIME → PG TIMESTAMP |
| `VARCHAR(255)` | `VARCHAR(255)` | Compatible |
| `TEXT` | `TEXT` | Compatible |

### Migration SQL Strategy

Instead of a single `init.sql`, split into:

1. **`migrations/001_schema.sql`** — CREATE TABLE statements (PostgreSQL syntax)
2. **`migrations/002_seed_foods.sql`** — INSERT seed data for foods
3. **`migrations/003_seed_activities.sql`** — INSERT seed data for activities

This separation mirrors the existing structure and makes it easier to run via Supabase SQL Editor (which has a 1MB size limit per query).

### Key Schema Changes

```sql
-- PostgreSQL equivalent of MySQL schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  pdp_consent BOOLEAN DEFAULT FALSE,
  pdp_consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  fitness_goal VARCHAR(20) NOT NULL CHECK (fitness_goal IN ('lose_weight', 'maintain', 'gain_weight')),
  activity_level VARCHAR(10) CHECK (activity_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at (PG equivalent of MySQL's ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### FOOD ENUM → CHECK Constraint

```sql
-- Instead of ENUM, use VARCHAR with CHECK:
category VARCHAR(20) NOT NULL CHECK (
  category IN ('proteins', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'drinks', 'other')
)
```

### GOAL_TAGS JSON → TEXT Array (Alternative)

```sql
-- Option A: Keep as JSONB (fewer code changes to activity.repository.js)
goal_tags JSONB NOT NULL

-- Option B: TEXT[] (more PostgreSQL idiomatic, simpler operators)
-- Query becomes: SELECT * FROM activities WHERE goal_tags && ARRAY['lose_weight'];
-- But requires changing repository.js to use array syntax
goal_tags TEXT[] NOT NULL DEFAULT '{}'

-- Recommendation: Use TEXT[] for simplicity with PostgreSQL operators
-- $1 placeholder replaces JSON.stringify(goalTags)
```

---

## Docker Multi-Stage Build

### Strategy: Build Frontend, Serve All via Express

```
┌──────────────────────────────────────────────────────────┐
│                   Multi-Stage Dockerfile                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Stage 1: node:20-alpine (build)                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  COPY frontend/package*.json ./frontend/            │   │
│  │  RUN cd frontend && npm ci                          │   │
│  │  COPY frontend/ ./frontend/                         │   │
│  │  RUN cd frontend && npm run build                   │   │
│  │  # Output: ./frontend/dist/                         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                           │
│  Stage 2: node:20-alpine (runtime)                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │  COPY backend/package*.json ./                      │   │
│  │  RUN npm ci --omit=dev                              │   │
│  │  COPY backend/src/ ./src/                           │   │
│  │  COPY --from=builder /app/frontend/dist ./dist      │   │
│  │  EXPOSE 3001                                        │   │
│  │  CMD ["npm", "start"]  # production mode            │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Express Static File Serving Configuration

```javascript
// In app.js — add AFTER API routes, BEFORE 404 handler
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../../dist');

// Serve static files in production only
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));

  // SPA fallback: all non-API routes → index.html
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
```

### Updated docker-compose.yml

```yaml
services:
  app:
    build: .
    container_name: fitness_app
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=3001
      - SUPABASE_URL=${SUPABASE_URL}
      - DATABASE_URL=${DATABASE_URL}  # Supavisor pooled connection
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      # Google OAuth
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
```

### Simplified Directory Structure (After Migration)

```
Fitness_App/
├── backend/
│   ├── src/
│   │   ├── app.js              # MODIFIED: added express.static for production
│   │   ├── server.js           # MODIFIED: pg pool health check
│   │   ├── config/
│   │   │   ├── database.js     # REPLACED: mysql2 → pg Pool
│   │   │   └── passport.js     # UNCHANGED
│   │   ├── repositories/
│   │   │   ├── user.repository.js    # MODIFIED: $1 placeholders
│   │   │   ├── food.repository.js    # MODIFIED: $1, RETURNING
│   │   │   ├── profile.repository.js # MODIFIED: $1, RETURNING
│   │   │   └── activity.repository.js# MODIFIED: $1, jsonb/TEXT[] ops
│   │   ├── controllers/        # UNCHANGED (4 files)
│   │   ├── services/           # UNCHANGED (4 files)
│   │   ├── routes/             # UNCHANGED (4 files)
│   │   ├── middlewares/        # UNCHANGED (1 file)
│   │   └── utils/              # UNCHANGED (2 files)
│   ├── migrations/             # NEW: PostgreSQL schema + seed data
│   │   ├── 001_schema.sql
│   │   ├── 002_seed_foods.sql
│   │   └── 003_seed_activities.sql
│   ├── tests/                  # UNCHANGED
│   └── package.json            # MODIFIED: mysql2 → pg
├── frontend/                   # UNCHANGED source
│   ├── src/                    # UNCHANGED
│   ├── vite.config.js          # MINOR: proxy only needed for dev
│   └── package.json            # UNCHANGED
├── Dockerfile                  # NEW: Multi-stage (replaces backend/ + frontend/ Dockerfiles)
├── .dockerignore               # NEW: exclude node_modules, src for stage 1
├── docker-compose.yml          # RESTRUCTURED: single service
└── .env                        # RESTRUCTURED: Supabase connection vars
```

---

## Repository Rewrite Map

### user.repository.js — Changes

| Line | MySQL (BEFORE) | PostgreSQL (AFTER) |
|------|----------------|-------------------|
| Import | `import { pool } from '../config/database.js'` | Same import (rewritten database.js) |
| Placeholder | `VALUES (?, ?, ?, ?)` | `VALUES ($1, $2, $3, $4)` |
| LAST_INSERT_ID | Two queries: INSERT + SELECT via `LAST_INSERT_ID()` | Single query: `INSERT ... RETURNING *` |
| Error code | `err.code === 'ER_DUP_ENTRY'` | `err.code === '23505'` (PostgreSQL unique violation) |
| Boolean values | `pdpConsent ? 1 : 0` | `pdpConsent` (boolean directly) |
| Destructuring | `const [rows] = await pool.query(...)` | `const result = await pool.query(...)` then `result.rows[0]` |

### food.repository.js — Changes

| MySQL | PostgreSQL |
|-------|-----------|
| `?` → `$1, $2, $3` | All parameter placeholders |
| `LAST_INSERT_ID()` | `RETURNING *` |
| `ER_DUP_ENTRY` | `'23505'` |
| `DATE_SUB(CURDATE(), INTERVAL ? DAY)` | `CURRENT_DATE - $1::INTERVAL` or `CURRENT_DATE - MAKE_INTERVAL(days => $1)` |
| `[rows]` destructuring | `result.rows` |
| `rows[0].total \|\| 0` | `parseInt(result.rows[0].total) \|\| 0` (pg returns strings for numeric types) |

### activity.repository.js — Changes

| MySQL | PostgreSQL |
|-------|-----------|
| `JSON_OVERLAPS(goal_tags, CAST(? AS JSON))` | `goal_tags::jsonb ?\| $1::text[]` if keeping JSONB, or `goal_tags && $1::text[]` if using TEXT[] |
| `ORDER BY RAND()` | `ORDER BY RANDOM()` |
| `[rows]` destructuring | `result.rows` |

### profile.repository.js — Changes

| MySQL | PostgreSQL |
|-------|-----------|
| `?` → `$1, $2, ...` | All parameter placeholders |
| `LAST_INSERT_ID()` | `RETURNING *` |
| `ER_DUP_ENTRY` | `'23505'` |
| `[rows]` destructuring | `result.rows` |
| `NOW()` | `NOW()` (same) |

---

## Environment Variable Changes

### Current (.env)

```env
# Database (MySQL)
DB_HOST=mysql
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=admin1234
DB_NAME=fitness_app
DB_ROOT_PASSWORD=niliterna86gt
```

### Target (.env)

```env
# Supabase PostgreSQL (pooled via Supavisor — port 6543)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Direct connection for migrations only (port 5432)
SUPABASE_DIRECT_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres

# Supabase project reference (used for Supabase JS client if needed later)
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # Only if admin operations needed

# Application
JWT_SECRET=8f3d2b7c1a9e4f6d... (same as before)
FRONTEND_URL=http://localhost:3001  # Updated: same origin now

# Google OAuth2 (unchanged)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# SSL (Supabase SSL CA cert — optional, for verify-full mode)
# SSL_CA_PATH=/app/certs/supabase-ca.crt
```

---

## Migration Path & Build Order

```
Phase 1: Supabase Setup
  1. Create Supabase project (via dashboard)
  2. Get connection strings (pooler + direct)
  3. Run migration scripts via Supabase SQL Editor
  4. Verify schema + seed data with psql / Supabase dashboard

Phase 2: Backend Query Rewrite
  1. Add `pg` dependency to backend/package.json
  2. Rewrite database.js: mysql2 Pool → pg Pool (SSL enabled)
  3. Rewrite user.repository.js: $1, RETURNING, error codes
  4. Rewrite profile.repository.js: $1, RETURNING, error codes
  5. Rewrite food.repository.js: $1, RETURNING, date functions
  6. Rewrite activity.repository.js: $1, JSONB/text operators
  7. Update server.js health check (pg syntax)

Phase 3: Docker Restructure
  1. Create root-level Dockerfile (multi-stage)
  2. Remove mysql + adminer + frontend services from docker-compose.yml
  3. Add static file serving in app.js (production check)
  4. Update .env with Supabase connection vars
  5. Create .dockerignore for optimal build caching
  6. Remove old frontend/ Dockerfile (no longer needed)
  7. Remove old backend/ Dockerfile (no longer needed)

Phase 4: Testing & Validation
  1. Run integration tests against Supabase
  2. Run unit tests (unchanged — they mock the pool)
  3. Verify static file serving in single container
  4. Smoke test all 4 API domains
```

---

## Pitfalls & Mitigations

| Pitfall | Risk | Mitigation |
|---------|------|-----------|
| **Connection pool exhaustion** on Supabase free tier (15 pooled connections) | MEDIUM | Set pg Pool `max: 5`; monitor `pg_stat_activity`; upgrade to Pro if needed |
| **MySQL-specific SQL patterns** missed during rewrite (e.g., `DATE_SUB` with `INTERVAL ? DAY`) | HIGH | Comprehensive grep for `INTERVAL`, `LAST_INSERT_ID`, `JSON_OVERLAPS`, `NOW()`, `CURDATE()` before any rewrite |
| **pg returns numeric as string** in `result.rows` | MEDIUM | Check all `SUM`, `COUNT`, `DECIMAL` query results; wrap with `Number()` |
| **Supavisor doesn't support prepared statements** in transaction mode | LOW | `pg` uses unnamed (simple) queries by default with `pool.query(text, values)`; no prepared statement usage in current code |
| **IPv6-only direct host** on Supabase | MEDIUM | Use Supavisor pooler (dual-stack, port 6543) for all application connections |
| **Seed data SQL size** exceeds Supabase SQL Editor limits | LOW | Split seed data into separate files per category/table |
| **Google OAuth redirect URI mismatch** after single-container deployment | LOW | Update Google Cloud Console redirect URI to match new origin (e.g., `http://localhost:3001/api/auth/google/callback`) |
| **CORS configuration** changes with same-origin deployment | LOW | Remove or update CORS `origin` when frontend/backend are same origin; keep for development |
| **`updated_at` trigger** missing in PostgreSQL | MEDIUM | Add PL/pgSQL trigger function for all tables that use `ON UPDATE CURRENT_TIMESTAMP` in MySQL |
| **ESM compatibility** with `pg` module | NONE | `pg` v8.x supports ESM imports: `import pg from 'pg'; const { Pool } = pg;` |

---

## Integration Points

### Supabase ↔ Express (Database)

| Integration | Pattern | Details |
|------------|---------|---------|
| **Connection** | pg Pool with connection string | `new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })` |
| **Health check** | `pool.query('SELECT 1')` on server startup | Same pattern as MySQL; exits on failure |
| **Migration** | Supabase SQL Editor (manual) | One-time; run SQL via dashboard SQL Editor |
| **Secrets** | Environment variables | `DATABASE_URL` is the connection string with embedded credentials |

### Express Backend ↔ Frontend (Static Files)

| Integration | Pattern | Details |
|------------|---------|---------|
| **Development** | Vite dev server with proxy | `vite.config.js` proxies `/api` to `localhost:3001` (unchanged) |
| **Production** | Express `express.static()` | Serves built files from `./dist/` after multi-stage build |
| **SPA routing** | Catch-all route `app.get('*')` | Returns `index.html` for all non-API paths |

### Authentication Flow (Same-Origin)

```
Production:
  Browser → http://localhost:3001/ → Express serves index.html
  Browser → POST http://localhost:3001/api/auth/login → same origin → cookie set for same domain

Development:
  Browser → http://localhost:5173/ → Vite dev server
  Browser → POST http://localhost:5173/api/auth/login → Vite proxy → http://localhost:3001/api/auth/login
  Cookie set for localhost:3001 — need proxy to forward cookies or use different strategy
```

**Important:** In development, the Vite proxy on port 5173 means the JWT cookie is set from `localhost:3001` (backend) but the browser sees `localhost:5173`. For development, either:
1. Add `"proxy"` in `vite.config.js` to also handle cookie domain (works with `changeOrigin: true`)
2. OR use a separate dev login flow

Current Vite config already sets `changeOrigin: true`, so cookies from the backend (localhost:3001) are forwarded to the frontend (localhost:5173) correctly.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users | Single container + Supabase free tier (15 pooled conns); Express static serving is fine |
| 100-1K users | Supabase Pro tier (60 pooled conns); increase pg Pool `max` to 10-15; add nginx in front for static file caching |
| 1K-10K users | Split into separate containers; add nginx reverse proxy; add read replica on Supabase; increase compute add-on |

### Bottleneck Analysis

1. **First bottleneck:** Supabase free tier connection limit (15 pooled). Mitigation: pool size of 5 on Express, upgrade to Pro ($25/mo) for 60 connections.
2. **Second bottleneck:** Express single-threaded serving static files under load. Mitigation: add nginx sidecar to serve static files directly, or split into two containers.
3. **Third bottleneck:** Database query throughput. Mitigation: add PgBouncer dedicated pooler (Pro+), add read replicas for reporting queries.

---

## Sources

- **node-postgres (pg) official docs**: https://node-postgres.com/ — Pool API, query syntax, SSL configuration — **HIGH confidence**
- **Supabase SSL Enforcement docs**: https://supabase.com/docs/guides/platform/ssl-enforcement — SSL modes, CA cert download — **HIGH confidence**
- **Supabase Connection Pooling (Supavisor)**: https://supabase.com/docs/guides/database/connecting-to-postgres — Connection string formats, port 5432 vs 6543 — **HIGH confidence**
- **Docker multi-stage build for Node.js**: https://docs.docker.com/guides/nodejs/containerize/ — Official Docker guide — **HIGH confidence**
- **PostgreSQL trigger for updated_at**: https://x-team.com/blog/automatic-timestamps-with-postgresql/ — PL/pgSQL trigger pattern — **MEDIUM confidence**
- **PostgreSQL error codes**: https://www.postgresql.org/docs/current/errcodes-appendix.html — `23505` for unique violation — **HIGH confidence**
- **Stack Overflow: Express + React single container**: https://stackoverflow.com/questions/63784949/ — Validates feasibility for low-traffic apps — **LOW confidence** (single source)

---

*Architecture research for: Fitness_App v1.2 Supabase Migration & Single-Container Deployment*
*Researched: 2026-05-27*
