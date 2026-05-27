# Domain Pitfalls: Supabase Migration & Single-Container Deployment

**Domain:** Database migration (MySQL→PostgreSQL) + Infrastructure consolidation
**Researched:** 2026-05-27

## Critical Pitfalls

Mistakes that cause runtime failures or data loss.

### Pitfall 1: Uncaught MySQL-Specific Query Patterns in Repository Files

**What goes wrong:** A query written in MySQL syntax runs against PostgreSQL and throws a database error, or silently returns wrong results.

**Why it happens:** The 4 repository files use MySQL-specific functions and syntax. A developer may miss some during translation.

**Consequences:** Runtime errors in production; certain API endpoints fail intermittently.

**Prevention — Comprehensive grep for these patterns BEFORE rewriting:**

| Pattern | Files to Check | MySQL | PostgreSQL |
|---------|---------------|-------|-----------|
| `?` placeholders | All 4 repos + tests | `WHERE id = ?` | `WHERE id = $1` |
| `[rows]` destructuring | All 4 repos | `const [rows] = ...` | `const result = ...; result.rows` |
| `LAST_INSERT_ID()` | user, profile, food repos | Two-query pattern | Single query with `RETURNING *` |
| `ER_DUP_ENTRY` | user, profile, food repos | MySQL error code | PostgreSQL error code `'23505'` |
| `DATE_SUB(CURDATE(), INTERVAL ? DAY)` | food.repository.js | Date subtraction | `CURRENT_DATE - $1::INTERVAL` |
| `JSON_OVERLAPS(...)` | activity.repository.js | JSON array overlap | `?|` operator or `&&` on text array |
| `NOW()` | profile, user repos | Same | Same (survives unchanged) |
| `CURDATE()` | food.repository.js | Current date | `CURRENT_DATE` |
| `ORDER BY RAND()` | activity.repository.js | Random sort | `ORDER BY RANDOM()` |
| `LIMIT 1` | All repos | Same | Same (identical syntax) |

**Detection:** Run `rg "INTERVAL|LAST_INSERT_ID|JSON_OVERLAPS|CURDATE|ORDER BY RAND|ER_DUP_ENTRY" backend/src/` before migration.

### Pitfall 2: Supabase Free Tier Connection Pool Exhaustion

**What goes wrong:** Application gets "too many connections" errors and stops working.

**Why it happens:** Supabase free tier limits Supavisor to 15 pooled connections. The pg Pool default (`max: 10`) may not exhaust it with a single Express instance, but if multiple app instances run (or if connections leak), the limit is hit quickly.

**Consequences:** Complete application outage until connections are recycled. New users cannot log in or use features.

**Prevention:**
- Set pg Pool `max: 5` — more than enough for an Express app with ~1 RPS
- Set `idleTimeoutMillis: 30000` — release idle connections after 30s
- Set `connectionTimeoutMillis: 5000` — fail fast if pool is exhausted
- Monitor via Supabase dashboard → Database → `pg_stat_activity`

**Detection:** `SELECT * FROM pg_stat_activity WHERE state = 'idle';` — if this shows many connections, pool is too large or connections leak.

### Pitfall 3: pg Returns Numeric Values as Strings

**What goes wrong:** Sum, count, or decimal values come back as strings instead of numbers. Frontend that expects `total: 1200` gets `total: "1200"`.

**Why it happens:** PostgreSQL's binary protocol returns numeric types (DECIMAL, NUMERIC, BIGINT) as strings by default in `pg` to avoid precision loss. MySQL's client library returns them as numbers.

**Consequences:** Type errors in frontend; progress bars showing wrong values; comparing `total < 1200` returning `true` for `"900" < 1200` (string comparison).

**Affected queries in food.repository.js:**
```javascript
// Line 116 — SUM(calories)
const result = await pool.query(
  'SELECT COALESCE(SUM(calories), 0) as total FROM food_logs WHERE ...'
);
// result.rows[0].total is a STRING like "1200"
```

**Prevention:** Wrap all aggregate values with `Number()`:
```javascript
const totalCalories = Number(result.rows[0].total);
```

**Detection:** Check all queries that use `SUM()`, `COUNT()`, or return `DECIMAL` columns. In the current schema: `weight_kg`, `height_cm` (DECIMAL), `SUM(calories)`, `COUNT(*)`.

### Pitfall 4: Google OAuth Redirect URI Mismatch After Single-Container Deployment

**What goes wrong:** Google OAuth login flow breaks with "redirect_uri_mismatch" error.

**Why it happens:** The backend's Google OAuth callback is at `/api/auth/google/callback`. When frontend and backend are on the same origin (port 3001), the callback URL changes from `http://localhost:5173/api/auth/google/callback` (via Vite proxy) to `http://localhost:3001/api/auth/google/callback` (direct). Google Cloud Console has the old URI registered.

**Consequences:** Users cannot log in with Google OAuth. Regular email/password login still works.

**Prevention:** Update the Google Cloud Console → APIs & Services → Credentials → Authorized redirect URIs to include the new callback URL.

**Current redirect URI:** `http://localhost:5173/api/auth/google/callback`
**New redirect URI:** `http://localhost:3001/api/auth/google/callback`

(Or just add both during transition.)

### Pitfall 5: Supavisor Transaction Mode Limitation with Session-Level Features

**What goes wrong:** Prepared statements or session variables fail silently or throw errors.

**Why it happens:** Supavisor (port 6543) operates in transaction mode by default. This means connections are released back to the pool after each transaction. Features that require session persistence (prepared statements, `LISTEN/NOTIFY`, session variables, advisory locks) don't work in this mode.

**Consequences:** Runtime errors if code uses prepared statements. The current codebase uses `pool.query(text, values)` — which sends unnamed queries (not prepared statements) — so this should NOT be affected. But if future code adds prepared statements, they will fail.

**Prevention:** 
- Continue using `pool.query(text, values)` (unnamed queries) — **no change needed**
- NEVER add `pool.connect()` + `client.query()` pattern for prepared statements
- If prepared statements are absolutely needed, use direct connection (port 5432) instead of pooled (port 6543)

**Detection:** Any code that uses `{ name: 'myQuery', text: '...' }` pattern with `pg` will break.

---

## Moderate Pitfalls

### Pitfall 1: `updated_at` Column Not Auto-Updating

**What goes wrong:** The `updated_at` column in `users` and `profiles` tables stops updating on row modification.

**Why it happens:** MySQL's `ON UPDATE CURRENT_TIMESTAMP` is a column-level feature. PostgreSQL has no equivalent — it requires a trigger function.

**Prevention:** Create a PL/pgSQL trigger:
```sql
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
```

**Detection:** After migration, check if `updated_at` changes after an UPDATE query.

### Pitfall 2: CORS Configuration Breaking After Same-Origin Deployment

**What goes wrong:** Frontend running on same origin as backend still has restrictive CORS settings that block requests.

**Why it happens:** Production uses same-origin (port 3001 serves both frontend and backend), so CORS is not needed. But if CORS middleware is still configured with a specific origin (e.g., `http://localhost:5173`), it shouldn't cause issues for same-origin requests (same-origin bypasses CORS entirely). However, the configuration may be confusing.

**Prevention:** In production mode (`NODE_ENV=production`), either:
- Set `origin: true` (echo request origin) — safe for same-origin
- Or set `origin: process.env.FRONTEND_URL || 'http://localhost:3001'`
- Keep existing config for development (Vite proxy handles cross-origin)

**No action strictly required** — existing CORS config will work for same-origin. Just ensure `FRONTEND_URL` env var points to the correct origin.

### Pitfall 3: Docker Image Size Bloat

**What goes wrong:** Final Docker image is 1.5+ GB instead of ~200MB.

**Why it happens:** Without multi-stage build, the production image includes Node.js build toolchain, dev dependencies, and source files.

**Prevention:** Use multi-stage build:
- Stage 1 (builder): `node:20-alpine`, install all deps, build frontend via Vite
- Stage 2 (runtime): `node:20-alpine`, install only production deps, copy built assets

Expected sizes: ~180MB (multi-stage) vs ~1.2GB (single-stage).

**Detection:** `docker images` — if image > 500MB, multi-stage is not working correctly.

### Pitfall 4: ENUM Column Behavior Difference

**What goes wrong:** MySQL ENUM columns store invalid values as `''` (empty string) silently. PostgreSQL rejects them with an error.

**Why it happens:** MySQL's ENUM is permissive by default; PostgreSQL's is strict. The CHECK constraint approach (recommended) will also reject invalid values.

**Prevention:** Use `VARCHAR` with `CHECK` constraint instead of native PostgreSQL ENUM. This preserves the validation behavior while being more flexible. Ensure all application code only sends valid enum values.

**Columns affected:** `gender`, `fitness_goal`, `activity_level`, `meal_type`, `category`

---

## Minor Pitfalls

### Pitfall 1: Case Sensitivity in Object Properties

**What goes wrong:** PostgreSQL returns column names as-is (lowercase by default), which matches MySQL behavior, so this should be fine. But if queries use mixed-case aliases, behavior differs.

**Prevention:** Keep column names lowercase with underscores (`snake_case`), matching current convention.

### Pitfall 2: Seed Data Execution Timeout in Supabase SQL Editor

**What goes wrong:** Inserting 200+ food rows in a single INSERT statement times out or exceeds the query size limit.

**Prevention:** Split seed data into batches of 25-50 rows per INSERT, or use the Supabase dashboard's "Import from CSV" feature.

### Pitfall 3: Docker Compose Named Volume for Database No Longer Needed

**What goes wrong:** The `mysql_data` volume definition remains in `docker-compose.yml` and creates an orphaned volume.

**Prevention:** Remove the `volumes:` section from `docker-compose.yml` entirely (or keep empty for future use). Remove dangling volume: `docker volume rm fitness_app_mysql_data`.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| **Phase 1: Supabase Setup** | Connection string port selection (5432 vs 6543) | Use 6543 (pooled) for app traffic; 5432 (direct) for migrations only |
| **Phase 1: Schema Migration** | PostgreSQL ENUM vs MySQL ENUM difference | Use VARCHAR + CHECK instead of native ENUM |
| **Phase 2: Query Rewrite** | Missed MySQL-specific patterns (`LAST_INSERT_ID`, `JSON_OVERLAPS`) | Run comprehensive grep BEFORE changing any file |
| **Phase 2: Query Rewrite** | `ER_DUP_ENTRY` error code not updated | Replace with `'23505'` in all repository files |
| **Phase 2: Query Rewrite** | `[rows]` destructuring still used with pg | All 4 repos must use `result.rows` pattern |
| **Phase 3: Docker Restructure** | `express.static()` path wrong in production | Use `path.join(__dirname, '../../dist')` from `backend/src/app.js` |
| **Phase 3: Docker Restructure** | Vite proxy still pointing to `localhost:3001` in production | Vite proxy is development-only; production uses same-origin |
| **Phase 4: Testing** | Integration tests fail because Supabase connection not configured for test env | Add `DATABASE_URL` to test env; or use `pg-mem` for in-memory testing |

## Sources

- **Supabase connection pool limits**: https://supabase.com/docs/guides/database/connection-pooling — Free tier: 15 pooled connections — **HIGH confidence**
- **PostgreSQL error codes**: https://www.postgresql.org/docs/current/errcodes-appendix.html — `23505` for unique_violation — **HIGH confidence**
- **pg numerics as strings**: https://github.com/brianc/node-postgres/issues/811 — Known behavior: DECIMAL/NUMERIC returned as strings — **HIGH confidence**
- **Supavisor transaction mode limitations**: https://supabase.com/docs/guides/database/supavisor — Prepared statements, LISTEN/NOTIFY limitations — **HIGH confidence**
- **PostgreSQL updated_at trigger pattern**: https://x-team.com/blog/automatic-timestamps-with-postgresql/ — Standard PL/pgSQL trigger — **MEDIUM confidence**
- **Docker multi-stage build best practices**: https://docs.docker.com/build/building/multi-stage/ — Official Docker guide — **HIGH confidence**
