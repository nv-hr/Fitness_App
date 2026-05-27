---
phase: 09-supabase-setup-schema-migration
reviewed: 2026-05-27T20:55:00Z
depth: quick
files_reviewed: 1
files_reviewed_list:
  - backend/db/schema.sql
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-05-27T20:55:00Z
**Depth:** quick
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `backend/db/schema.sql` (129 lines, PostgreSQL schema with 6 tables, 5 ENUM types, foreign keys, indexes). The only change in this phase was replacing `CREATE TYPE IF NOT EXISTS` (PG 14+ syntax) with a `DO $$` block for cross-version compatibility — this change is correctly implemented.

No hardcoded secrets, debug artifacts, commented-out code, or dangerous functions were found. However, the schema has significant data integrity gaps (missing CHECK constraints on numeric columns, a redundant index, and a schema-qualification edge case in the `DO $$` block).

## Warnings

### WR-01: Missing CHECK constraints on numeric columns allow invalid data

**File:** `backend/db/schema.sql:36-114`
**Issue:** Eight numeric columns across multiple tables lack CHECK constraints, allowing negative values, zero values, or physiologically impossible data to be stored. This shifts data validation entirely to the application layer with no database-level enforcement.

Affected columns and suggested constraints:

| Table | Column | Missing Constraint |
|-------|--------|--------------------|
| `profiles` | `weight_kg DECIMAL(5,2)` | `CHECK (weight_kg > 0 AND weight_kg < 500)` |
| `profiles` | `height_cm DECIMAL(5,2)` | `CHECK (height_cm > 0 AND height_cm < 300)` |
| `profiles` | `age INT` | `CHECK (age > 0 AND age < 150)` |
| `foods` | `calories_per_100g INT` | `CHECK (calories_per_100g >= 0)` |
| `food_logs` | `calories INT` | `CHECK (calories >= 0)` |
| `food_logs` | `portion_grams INT` | `CHECK (portion_grams > 0)` |
| `activities` | `duration_min INT` | `CHECK (duration_min > 0)` |
| `activities` | `estimated_calories INT` | `CHECK (estimated_calories >= 0)` |

**Fix:** Add CHECK constraints to each column at table creation time. Example for `profiles`:

```sql
CREATE TABLE IF NOT EXISTS profiles (
    ...
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
    height_cm DECIMAL(5,2) NOT NULL CHECK (height_cm > 0 AND height_cm < 300),
    age INT NOT NULL CHECK (age > 0 AND age < 150),
    ...
);
```

If CHECK constraints can't be added inline (to avoid a full table re-creation), use a follow-up migration:

```sql
ALTER TABLE profiles ADD CONSTRAINT weight_kg_positive CHECK (weight_kg > 0 AND weight_kg < 500);
ALTER TABLE profiles ADD CONSTRAINT height_cm_positive CHECK (height_cm > 0 AND height_cm < 300);
ALTER TABLE profiles ADD CONSTRAINT age_range CHECK (age > 0 AND age < 150);
ALTER TABLE foods ADD CONSTRAINT calories_per_100g_non_negative CHECK (calories_per_100g >= 0);
ALTER TABLE food_logs ADD CONSTRAINT calories_non_negative CHECK (calories >= 0);
ALTER TABLE food_logs ADD CONSTRAINT portion_grams_positive CHECK (portion_grams > 0);
ALTER TABLE activities ADD CONSTRAINT duration_min_positive CHECK (duration_min > 0);
ALTER TABLE activities ADD CONSTRAINT estimated_calories_non_negative CHECK (estimated_calories >= 0);
```

### WR-02: DO $$ block does not schema-qualify the pg_type lookup

**File:** `backend/db/schema.sql:13-26`
**Issue:** The `DO $$` block checks `pg_type` by `typname` alone without joining `pg_namespace` to restrict the lookup to the current schema. The `typname` column is only unique per namespace (schema), so if a type with the same name (e.g., `gender`) exists in a different schema — for example, installed by an extension or created in a previous migration in a non-public schema — the `IF NOT EXISTS` check would skip creation in the current schema entirely. The `CREATE TYPE` command (without schema qualification) would then fail at table-creation time when tables reference the missing type.

While unlikely in a standard Supabase project (everything lives in `public`), this is a correctness gap that could surface during schema reorganization, blue/green deployments, or when sharing a database instance.

**Fix:** Join with `pg_namespace` to scope the check to the current schema:

```sql
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = 'gender'
          AND n.nspname = current_schema()
    ) THEN
        CREATE TYPE gender AS ENUM ('male', 'female', 'other');
    END IF;
    -- ... repeat for all types ...
END $$;
```

## Info

### IN-01: Redundant index `idx_user_recent` on food_logs

**File:** `backend/db/schema.sql:126`
**Issue:** The index `idx_user_recent` on `food_logs(user_id, log_date DESC)` is functionally redundant with `idx_user_date` on `food_logs(user_id, log_date)` (line 125). PostgreSQL can scan a B-tree index backward, so the ASC index already satisfies `ORDER BY log_date DESC` queries. The duplicate index wastes storage and adds write overhead on every INSERT/UPDATE/DELETE to `food_logs`.

**Fix:** Remove the redundant index or merge the two definitions into one covering both access patterns. If the DESC index was intentionally created for performance (e.g., to avoid backward scan in query plans), add a comment documenting the rationale. Otherwise:

```sql
-- Remove this line:
-- CREATE INDEX IF NOT EXISTS idx_user_recent ON food_logs(user_id, log_date DESC);
```

### IN-02: DO $$ block missing explicit LANGUAGE clause

**File:** `backend/db/schema.sql:12`
**Issue:** The `DO $$ ... END $$` block omits `LANGUAGE plpgsql`. PostgreSQL defaults to `plpgsql` for anonymous blocks, so this works in all standard configurations. However, the explicit clause is a best-practice convention for readability and avoids ambiguity in restrictive configurations or when `default_with_oids` or other settings might affect block parsing.

**Fix:**

```sql
DO $$ BEGIN
    ...
END $$;
-- ↓ becomes
DO $$
BEGIN
    ...
END;
$$ LANGUAGE plpgsql;
```

### IN-03: No NOT NULL constraint on `email` or guarantee of at least one auth method

**File:** `backend/db/schema.sql:38-40`
**Issue:** Both `email` and `google_id` are nullable (`VARCHAR(255) NULL`). This creates the possibility of a row in `users` where both are NULL, making that user permanently unauthenticatable — a ghost user. A CHECK constraint ensuring at least one of `email` or `google_id` is NOT NULL would prevent this degenerate state at the schema level.

**Fix:**

```sql
CREATE TABLE IF NOT EXISTS users (
    ...
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NULL,
    google_id VARCHAR(255) UNIQUE NULL,
    ...
    CONSTRAINT at_least_one_auth CHECK (
        email IS NOT NULL OR google_id IS NOT NULL
    )
);
```

---

_Reviewed: 2026-05-27T20:55:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: quick_
