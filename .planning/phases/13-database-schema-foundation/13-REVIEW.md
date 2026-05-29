---
phase: 13-database-schema-foundation
reviewed: 2026-05-29T16:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - Dockerfile
  - backend/db/drop_user_activity_log.sql
  - backend/db/schema.sql
  - backend/package.json
  - backend/scripts/verify-schema.js
findings:
  critical: 0
  warning: 6
  info: 2
  total: 8
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-05-29T16:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed 5 files spanning the Docker deployment configuration, PostgreSQL schema migration, npm package configuration, and a schema verification script. The schema and migrations are structurally sound, but several issues were found: the migration script's file paths break inside Docker containers, the Dockerfile runs containers as root (a security concern), the `npm ci` command in the builder stage will fail if lockfiles are absent, the database schema lacks CHECK constraints for data integrity, the verification script only checks one of six ENUM types, and its error output truncates debugging information.

## Warnings

### WR-01: Migration script paths break inside Docker containers

**File:** `backend/package.json:13`
**Issue:** The `db:migrate` script references files with the `backend/` directory prefix:
```
"db:migrate": "psql \"$DATABASE_URL\" -f backend/db/drop_user_activity_log.sql -f backend/db/schema.sql -f backend/db/seed.sql"
```
However, inside the Docker container (both development and production stages), the Dockerfile runs `COPY backend/ ./` with `WORKDIR /app`, placing the schema files directly at `/app/db/schema.sql` — not at `/app/backend/db/schema.sql`. Running `npm run db:migrate` inside the container will fail because `psql` cannot find `backend/db/schema.sql` relative to `/app`.

This script works correctly from the repo root for local development, but will fail in any Docker-based workflow (docker-compose, CI/CD pipeline that runs inside the container).

**Fix:** Change the `db:migrate` script to use paths without the `backend/` prefix, matching the container's filesystem layout:
```json
"db:migrate": "psql \"$DATABASE_URL\" -f db/drop_user_activity_log.sql -f db/schema.sql -f db/seed.sql"
```
Alternatively, if the script is only intended for local (non-Docker) use, add a comment clarifying this and/or add a separate Docker-appropriate migration command.

---

### WR-02: Docker containers run as root (security concern)

**File:** `Dockerfile:2`
**Issue:** All three stages (builder, development, production) run as the root user. No `USER` directive is set anywhere in the Dockerfile. This means if the application process is compromised (e.g., via RCE, SSRF, or path traversal), an attacker gains root access within the container, increasing the risk of container escape attacks.

**Fix:** Add a non-root user in both the development and production stages:
```dockerfile
# After WORKDIR /app in development stage (line 23)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

```dockerfile
# After COPY --from=builder in production stage (line 50)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser
```

Note: The builder stage does not need this change since it only produces build artifacts.

---

### WR-03: `npm ci` in builder stage requires lockfile — silent build failure risk

**File:** `Dockerfile:8`
**Issue:** The builder stage runs `npm ci` without a preceding check for `package-lock.json`. If `frontend/package-lock.json` does not exist (e.g., the frontend directory was initialized but `npm install` was never run), `npm ci` will exit with a hard error, causing the Docker build to fail. This is a
fragile point in the build pipeline that depends on developer discipline rather than automation.

**Fix:** Add a defensive check or use `npm install` instead of `npm ci` in the builder stage (accepting the reproducibility trade-off):
```dockerfile
# Option A: Defensive install (reproducibility sacrificed for reliability)
RUN npm install
RUN npm run build

# Option B: Install and then ci (extra step but ensures lockfile exists)
RUN npm install
RUN npm ci
```

---

### WR-04: Database schema lacks CHECK constraints on numeric columns

**File:** `backend/db/schema.sql` (lines 43-148)
**Issue:** Multiple numeric columns throughout the schema allow negative or zero values that are physically impossible or logically invalid for a fitness application:

| Table | Column | Type | Missing constraint |
|-------|--------|------|--------------------|
| `profiles` | `weight_kg` | DECIMAL(5,2) | `CHECK (weight_kg > 0)` |
| `profiles` | `height_cm` | DECIMAL(5,2) | `CHECK (height_cm > 0)` |
| `profiles` | `age` | INT | `CHECK (age > 0 AND age < 150)` |
| `foods` | `calories_per_100g` | INT | `CHECK (calories_per_100g >= 0)` |
| `food_logs` | `calories` | INT | `CHECK (calories >= 0)` |
| `food_logs` | `portion_grams` | INT | `CHECK (portion_grams > 0)` |
| `activities` | `duration_min` | INT | `CHECK (duration_min > 0)` |
| `activities` | `estimated_calories` | INT | `CHECK (estimated_calories >= 0)` |
| `activity_logs` | `duration_min` | INT | `CHECK (duration_min > 0)` |
| `activity_logs` | `calories_burned` | INT | `CHECK (calories_burned >= 0)` |

Without these constraints, application bugs or client-side validation bypasses can store non-sensical data (e.g., `age = -5`, `weight_kg = 0`, `calories_burned = -100`), which will silently corrupt analytics, BMI calculations, and calorie tracking.

**Fix:** Add CHECK constraints inline with column definitions. Example for `profiles`:
```sql
weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
height_cm DECIMAL(5,2) NOT NULL CHECK (height_cm > 0),
age INT NOT NULL CHECK (age > 0 AND age < 150),
```
Example for `food_logs`:
```sql
calories INT NOT NULL CHECK (calories >= 0),
portion_grams INT NOT NULL CHECK (portion_grams > 0),
```

---

### WR-05: Schema verification script only checks one of six required ENUM types

**File:** `backend/scripts/verify-schema.js:50-55`
**Issue:** The verification script queries `pg_type` only for `intensity_level` but does not verify the other five ENUM types defined in `schema.sql`:
- `gender`
- `fitness_goal`
- `activity_level`
- `food_category`
- `meal_type`

The overall pass/fail summary on lines 87-91 includes `hasIntensityEnum` but has no checks for the other enums. If any of those five enums are missing (e.g., due to a partial migration failure), the script would pass and report success even though the schema is incomplete.

**Fix:** Add checks for all six ENUM types. The enum types defined in the DO block must all be verified:
```javascript
const enumNames = ['intensity_level', 'gender', 'fitness_goal', 'activity_level', 'food_category', 'meal_type'];
const enumResult = await pool.query(
  `SELECT typname FROM pg_type WHERE typname = ANY($1)`,
  [enumNames]
);
const foundEnums = enumResult.rows.map(r => r.typname);
let allEnumsPass = true;
for (const name of enumNames) {
  const ok = foundEnums.includes(name);
  console.log(`  ${name} ENUM: ${ok ? '✓ EXISTS' : '✗ MISSING'}`);
  if (!ok) allEnumsPass = false;
}
```

Then update `allPass` to include `allEnumsPass`.

---

### WR-06: Error handler truncates stack trace and error context

**File:** `backend/scripts/verify-schema.js:96`
**Issue:** The catch block only logs `err.message`, discarding the full error object including the stack trace:
```javascript
console.error(`FATAL: ${err.message}`);
```
If a database query fails (e.g., connection timeout, authentication failure, query syntax error), the stack trace identifies which line triggered the error. Losing this information makes debugging in CI/CD environments unnecessarily difficult. Additionally, if `err` is somehow not an Error object (e.g., a string was thrown), `err.message` will be `undefined`.

**Fix:** Log the full error or at minimum include stack trace:
```javascript
console.error('FATAL:', err);
// or for more structured output:
console.error(`FATAL: ${err.message}\n${err.stack || '(no stack trace)'}`);
```

---

## Info

### IN-01: Index on deprecated `user_activity_log` table creates confusion

**File:** `backend/db/schema.sql:163`
**Issue:** An index `idx_user_date` is created on the `user_activity_log` table (line 163), which is itself being phased out in favor of the new `activity_logs` table (line 124). The table is recreated by `schema.sql` (line 112) for backward compatibility, but the index on a deprecated table adds maintenance overhead and could mislead developers into thinking this table is still actively used.

**Fix:** Add an inline comment clarifying whether the index is needed for backward-compatible queries or can be removed:
```sql
-- REMOVE AFTER MIGRATION: index on deprecated user_activity_log (kept for backward compat until phase 14 cleanup)
CREATE INDEX IF NOT EXISTS idx_user_date ON user_activity_log(user_id, completed_date);
```

---

### IN-02: Ambiguous `calorie_rate` column definition

**File:** `backend/db/schema.sql:63`
**Issue:** The `profiles` table defines `calorie_rate VARCHAR(10) NULL` with no comment or CHECK constraint clarifying what values it stores. Without context, it is unclear whether this stores a numeric rate (e.g., `"2000"` cal/day), a qualitative rate (e.g., `"slow"`, `"fast"`), or a percentage (e.g., `"20%"`). This ambiguity could lead to inconsistent usage across the application codebase.

**Fix:** Add a COMMENT on the column to document its purpose:
```sql
COMMENT ON COLUMN profiles.calorie_rate IS 'Recommended daily calorie intake rate string (e.g., "2000" kcal/day). Populated by application logic.';
```
Alternatively, if this column is not yet used by any code, consider replacing it with a properly-typed `INT` column or removing it until needed.

---

_Reviewed: 2026-05-29T16:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
