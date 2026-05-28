# Phase 10: Backend Query Rewrite (pg migration) - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all database queries from mysql2 driver + MySQL syntax to pg (node-postgres) driver + PostgreSQL syntax. No new features — the database access layer is replaced while keeping the same API contract. This is Phase 10 of v1.2 — the query layer that connects Phase 9's Supabase setup to the application.

**Requirements:** QRY-01, QRY-02, QRY-03, QRY-04, QRY-05

</domain>

<decisions>
## Implementation Decisions

### Rewrite Approach
- **D-01:** File-by-file rewrite — rewrite one file at a time, verify against Supabase before moving to the next
- **D-02:** database.js rewritten first (connection layer before repositories)
- **D-03:** mysql2 removed from package.json immediately after database.js rewrite — clean break, no fallback
- **D-04:** Manual API calls to verify each file after rewrite (smoke scripts optional but left to agent discretion)

### Error Handling Migration
- **D-05:** Create abstracted `normalizeDbError()` utility that maps PostgreSQL SQLSTATE codes to meaningful error names — decouples controllers from database-specific codes
- **D-06:** New utility module at `backend/src/utils/dbErrors.js` — standalone from database.js connection layer
- **D-07:** Map common constraint violation codes: unique_violation (23505), foreign_key_violation (23503), not_null_violation (23502), check_violation (23514)

### Pool Configuration
- **D-08:** pg Pool with default max size of 10 connections (Supabase free tier allows 15)
- **D-09:** Strict SSL — `require: true, rejectUnauthorized: true`
- **D-10:** Configure explicit timeouts: `connectionTimeoutMillis: 5000`, `idleTimeoutMillis: 30000`

### Testing During Rewrite
- **D-11:** Run verification against live Supabase instance (not local PostgreSQL)
- **D-12:** Test after each individual file rewrite (database.js, then each repo)
- **D-13:** Git revert per file for rollback (no backup copies kept)

### MySQL Pattern Translation Sweep
- **D-14:** Systematic grep checklist created upfront — run `rg` patterns for every MySQL construct across the codebase, document findings, then fix
- **D-15:** One-time checklist document — not a reusable script (mysql2 is being removed permanently)
- **D-16:** Full codebase scan — not limited to `backend/src/`; includes config files, env examples, docker files

### the agent's Discretion
- Exact grep patterns and order of patterns in the checklist — planner devises based on known MySQL-to-PostgreSQL translation patterns
- Which specific API endpoints to hit for manual verification of each repository — planner determines based on existing routes
- Error mapper function signature and return format — planner designs based on how controllers currently consume error data
- Whether to create a smoke script for database.js only (single-file, high-impact) — suggested but not required

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 10 — Goal, success criteria, requirements (QRY-01 to QRY-05)
- `.planning/REQUIREMENTS.md` §v1.2 — Requirements with traceability (QRY-01 to QRY-05), Out of Scope items
- `.planning/STATE.md` — Current project state, blockers (Supabase connection pool limits, MySQL pattern concerns)

### Project Decisions
- `.planning/PROJECT.md` §Key Decisions — No ORM (raw SQL with pg), No Supabase Auth, No RLS

### Prior Phase Context (Phase 9 — directly feeds into Phase 10)
- `.planning/phases/09-supabase-setup-schema-migration/09-CONTEXT.md` — D-05 (pg package installed), D-06 (verify script created, database.js rewrite deferred), D-07 (DATABASE_URL connection string), D-09 and D-10 (IDENTITY, TIMESTAMPTZ patterns)

### Backend Files to Rewrite
- `backend/src/config/database.js` — Existing mysql2/promise createPool config, the primary target for QRY-01
- `backend/src/repositories/food.repository.js` — Food queries: search, create, log, recent. MySQL `?` placeholders, need RETURNING *
- `backend/src/repositories/activity.repository.js` — Activity queries: get recommendations, log activities. JSON_OVERLAPS → `?|` operator
- `backend/src/repositories/profile.repository.js` — Profile queries: get, update profile. Need `$1` placeholders and RETURNING *
- `backend/src/repositories/user.repository.js` — User queries: create, find user, update. LAST_INSERT_ID → RETURNING id
- `backend/src/controllers/food.controller.js` — Catches ER_DUP_ENTRY (MySQL 1062), target for error mapper integration

### Supporting Files
- `backend/src/server.js` — Server startup with pool.query health check, may need pg adapter updates
- `backend/package.json` — mysql2 dependency to remove, pg already added in Phase 9
- `backend/.env.example` — May reference MySQL env vars (DB_HOST, DB_PORT) that should be cleaned up

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/config/database.js` — Existing mysql2 Pool pattern (env vars, connection config, error logging). Informs the pg Pool structure in the rewrite.
- `backend/src/server.js` pool startup query — Pattern for connection verification on server start.
- `backend/scripts/verify-supabase-connection.js` — Created in Phase 9, demonstrates pg Pool pattern with DATABASE_URL and SSL config.
- MySQL `?` → `$1` placeholder mapping is systematic — all 4 repositories use the same pattern, making the grep checklist highly effective.

### Established Patterns
- Repository pattern: each repo imports `pool` from `database.js` and exports query functions. Database access is centralized — rewrite happens in one file and one repo at a time.
- Controllers call repository functions, not database directly. Error handling in controllers catches mysql error codes — the error mapper bridges this gap.
- Application-managed `updated_at` (set from Node.js, no PostgreSQL triggers) — decided in Phase 9, preserves the existing pattern.
- All INSERT/UPDATE queries use `pool.query(sql, params)` with positional placeholders — direct translation from `?` to `$1`.

### Integration Points
- `database.js` — Single point of change for driver swap. All 4 repos depend on it. Must be rewritten first (D-02).
- `food.controller.js` lines referencing `ER_DUP_ENTRY` — Must be updated to use the new error mapper.
- `package.json` — mysql2 removed after database.js rewrite (D-03). Verify no remaining imports before removing.
- Docker configuration references to MySQL — Addressed in Phase 11, but grep sweep (D-16) should note any references.
- Supabase DATABASE_URL env var — Already configured, connection verified in Phase 9. The rewrite uses the same connection.

</code_context>

<specifics>
## Specific Ideas

- Error mapper should normalize pg error codes to human-readable names (e.g., `UNIQUE_VIOLATION`) that can be checked in controller catch blocks — similar to how `err.code === 'ER_DUP_ENTRY'` works today
- Pool config: `new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, max: 10 })`
- Grep checklist patterns: `\?` (placeholder), `LAST_INSERT_ID`, `DATE_SUB`/`DATE_ADD`, `JSON_OVERLAPS`, `LIMIT \? OFFSET \?`, `ER_DUP_ENTRY`, `mysql2`, `ON UPDATE CURRENT_TIMESTAMP`, `TINYINT`
- database.js rewrite should export `pool` (same API shape as current module) so all 4 repository imports work without change

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-Backend Query Rewrite (pg migration)*
*Context gathered: 2026-05-27*
