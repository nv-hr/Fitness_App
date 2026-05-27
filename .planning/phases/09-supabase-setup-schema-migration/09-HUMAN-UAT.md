---
status: partial
phase: 09-supabase-setup-schema-migration
source: [09-VERIFICATION.md]
started: 2026-05-27
updated: 2026-05-27
---

## Current Test

awaiting human testing

## Tests

### 1. Verify schema.sql applied to Supabase without errors
expected: "Run `psql $DATABASE_URL -f backend/db/schema.sql` — no ERROR lines in output. All 6 tables (users, profiles, foods, food_logs, activities, user_activity_log) exist."
result: [pending]

### 2. Verify seed.sql applied to Supabase without errors
expected: "Run `psql $DATABASE_URL -f backend/db/seed.sql` — no ERROR lines. `SELECT COUNT(*) FROM activities` returns 35. `SELECT COUNT(*) FROM foods` returns >= 201."
result: [pending]

### 3. Verify Supabase connectivity via node script
expected: "Run `node scripts/verify-supabase-connection.js` from project root — outputs 'Supabase connected successfully' and exits with code 0."
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
