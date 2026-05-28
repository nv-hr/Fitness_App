# Feature Landscape: Supabase Migration & Single-Container Deployment

**Domain:** Database migration + infrastructure consolidation
**Researched:** 2026-05-27

## Table Stakes

Features a user/codebase expects. Missing = migration feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **All existing API endpoints work** | Zero behavioral change for frontend | High (requires careful query translation) | All 4 repositories must produce identical results |
| **Authentication works** | JWT login, Google OAuth redirect | Medium | OAuth redirect URI must match new origin; JWT cookies work same-origin or cross-origin |
| **Seed data present** | 200+ foods, 35 activities | Medium | Need PostgreSQL-compatible INSERT statements |
| **Database connection on startup** | Server must fail fast if DB unreachable | Low | `pool.query('SELECT 1')` health check — same pattern as MySQL |
| **Static files served** | React app loads in browser | Low | `express.static()` serves built frontend |
| **SPA routing works** | All routes load index.html | Low | Catch-all `app.get('*')` sends index.html for non-API paths |

## Differentiators

Features that make this migration better than a naive replacement.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Single Docker command to run** | `docker compose up` starts everything | Low | Replaces 4-service startup with 1 |
| **No local MySQL dependency** | No local database installation needed | Low | Devs no longer need MySQL running locally |
| **Managed database** | No backup/restore/health management | None | Supabase handles all DB ops |
| **Built-in connection pooling** | Supavisor handles connection multiplexing | None | Free with Supabase |
| **Built-in SSL** | Encrypted connections automatically | None | Supabase enforces SSL by default |
| **Web-based DB admin** | No Adminer container needed | None | Supabase dashboard has SQL Editor + Table Editor |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Supabase JS client in backend** | Client designed for browser RLS; server-side should use direct pg connection | Use `pg` Pool with raw SQL (current pattern) |
| **ORM (Prisma/Drizzle)** | Would require learning new API + double migration | Keep repository pattern with raw PostgreSQL queries |
| **nginx/Caddy reverse proxy** | Adds process to manage; unnecessary at this scale | Express.static() serves files directly |
| **Docker Compose with separate frontend/backend** | Extra complexity; more ports to manage; no benefit for single-machine deployment | Single multi-stage container |
| **Custom connection pooler** | Supavisor already handles this | Use Supavisor (port 6543) for all app traffic |
| **Prepared statements** | Incompatible with Supavisor transaction mode; not needed for simple queries | Use unnamed `pool.query(text, values)` — pg default |

## Feature Dependencies

```
Supabase project creation
    ↓
Schema migration SQL execution (via Supabase dashboard)
    ↓
Backend code: database.js (pg Pool replacement)
    ↓
Backend code: 4 repository rewrites
    ↓
Remove mysql2 dependency, add pg
    ↓
Backend tests pass against Supabase
    ↓
Multi-stage Dockerfile creation
    ↓
docker-compose.yml rewrite (1 service)
    ↓
Static file serving added to app.js
    ↓
Full integration test (backend API + frontend build)
```

## MVP Recommendation

Prioritize (order matters):

1. **Supabase project + schema** — Everything depends on this existing
2. **pg driver + database.js rewrite** — Foundation for all queries
3. **Repository rewrites (food → profile → user → activity)** — In order of complexity
4. **Docker multi-stage build** — Infrastructure wrapping

Defer:
- **Performance tuning** (connection pool size, query optimization): Not needed until traffic justifies it
- **Supabase Row Level Security**: Not needed for server-side-only architecture
- **Prepared statement support**: Incompatible with Supavisor transaction mode; not needed
- **Pgbouncer dedicated pooler**: Only needed on Pro+ tier if connection limits are hit

## Sources

- Current codebase analysis (4 repositories, 1 database.js config)
- Supabase docs: Connection pooling, SSL, free tier limits — **HIGH confidence**
- Docker docs: Multi-stage build patterns — **HIGH confidence**
- Express docs: Static file serving — **HIGH confidence**
