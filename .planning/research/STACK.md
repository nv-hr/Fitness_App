# Technology Stack: Supabase Migration

**Project:** Fitness_App v1.2
**Researched:** 2026-05-27

## Current Stack (v1.1)

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Database | MySQL | 8.4 | **TO BE REMOVED** |
| Database Driver | mysql2 | ^3.22.0 | **TO BE REPLACED** |
| DB Admin | Adminer | latest | **TO BE REMOVED** |
| Backend | Express | ^5.2.0 | Keep |
| Frontend | React | ^19.2.0 | Keep |
| Frontend Build | Vite | ^8.0.0 | Keep |
| Auth | Passport + JWT + bcrypt | various | Keep |
| Containerization | Docker Compose | 4 services | **TO BE SIMPLIFIED** |

## Target Stack (v1.2)

### Core Framework (Unchanged)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express | ^5.2.0 | HTTP server framework | Already in use; no reason to change |
| React | ^19.2.0 | UI framework | Already in use; no reason to change |
| Vite | ^8.0.0 | Frontend build tool | Already in use; multi-stage build uses `npm run build` |

### Database (Replacement)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Supabase PostgreSQL** | 15.x (managed) | Primary database | Managed PostgreSQL; built-in connection pooling (Supavisor); free tier available |
| **pg (node-postgres)** | ^8.13.0 | PostgreSQL driver for Node.js | Closest API to mysql2/promise; Pool-based; well-maintained; ESM support |

**Why not alternatives:**
- **Prisma**: Overkill for 4 simple repository files; would require learning new query API
- **pg-promise**: Extra abstraction layer not needed; pg is sufficient
- **Supabase JS client**: Designed for browser/client-side with RLS; not appropriate for server-side raw SQL
- **Drizzle**: Same argument as Prisma — unnecessary ORM for this scale
- **postgres.js**: Tagged template DSL is different from current pattern; more mental overhead to migrate

### Database Driver Comparison

| Feature | mysql2 (current) | pg (target) |
|---------|-----------------|-------------|
| Pool creation | `createPool({...})` | `new Pool({...})` |
| Query execution | `pool.query(sql, params)` | `pool.query(sql, params)` |
| Placeholders | `?` (positional) | `$1, $2, ...` (numbered) |
| Result shape | `[rows, fields]` | `{ rows, fields, rowCount }` |
| Single row | `rows[0]` | `result.rows[0]` |
| Insert + return | `LAST_INSERT_ID()` then SELECT | `RETURNING *` |
| Boolean values | `1` / `0` (TINYINT) | `true` / `false` (BOOLEAN) |
| Unique violation | `'ER_DUP_ENTRY'` | `'23505'` |
| SSL | Not used (local MySQL) | Required (Supabase enforced) |
| Connection string | Not used (separate params) | `DATABASE_URL` support built-in |

**Verdict:** pg is the right choice. The migration cost is mechanical, not conceptual — same programming pattern, different SQL syntax.

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | 24+ | Container runtime | Already in use |
| Docker Compose | v2 | Multi-container orchestration | Already in use; simplified to 1 service |
| Supavisor | managed | Connection pooler | Built into Supabase; handles multiplexing |
| Cloudflare Tunnel | managed | Network exposure | Already in use; unchanged |

### Dependencies (package.json Changes)

**backend/package.json — Changes:**

```json
{
  "dependencies": {
    "mysql2": "^3.22.0",          // REMOVE
    "pg": "^8.13.0",              // ADD
    // Everything else stays
  }
}
```

**Install command:**
```bash
cd backend
npm uninstall mysql2
npm install pg
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| DB Driver | pg | pg-promise | Extra abstraction not needed; pg is simpler |
| DB Driver | pg | Supabase JS client | Client-side API doesn't map to repository pattern; RLS not needed for server-side |
| DB Driver | pg | Prisma | ORM overhead for 4 simple repos; would double migration work |
| Static Serving | Express.static() | nginx reverse proxy | nginx adds process manager complexity; Express is adequate for low traffic |
| Static Serving | Express.static() | Caddy | Same argument as nginx — unnecessary complexity |
| Container Setup | Single container | Keep 2 containers | Extra complexity for deployment; no benefit at this scale |
| Connection Pooling | Supavisor (managed) | PgBouncer (self-hosted) | Supavisor is built into Supabase; no extra infrastructure to manage |

## Package Installation

```bash
# Backend — replace mysql2 with pg
cd backend
npm uninstall mysql2
npm install pg

# No changes needed to frontend
```

## Environment Variables (New)

```bash
# Supabase connection (via Supavisor pooler — port 6543)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Direct connection for migrations (port 5432)
SUPABASE_DIRECT_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres

# Supabase project meta (optional, for future use)
SUPABASE_URL=https://[ref].supabase.co

# Removed
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (all replaced by DATABASE_URL)
```

## Sources

- **pg (node-postgres) docs**: https://node-postgres.com/ — Pool API, query syntax, SSL — **HIGH confidence**
- **Supabase connection docs**: https://supabase.com/docs/guides/database/connecting-to-postgres — Connection string formats, port selection — **HIGH confidence**
- **Supabase SSL enforcement**: https://supabase.com/docs/guides/platform/ssl-enforcement — SSL modes, CA cert — **HIGH confidence**
- **Supavisor (Supabase pooler)**: https://supabase.com/docs/guides/database/supavisor — Transaction vs session mode — **HIGH confidence**
- **PostgreSQL error codes**: https://www.postgresql.org/docs/current/errcodes-appendix.html — Official error code reference — **HIGH confidence**
