# Phase 10: Backend Query Rewrite (pg migration) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 10-Backend Query Rewrite (pg migration)
**Areas discussed:** Rewrite approach, Error handling migration, Pool configuration, Testing during rewrite, MySQL pattern translation sweep

---

## Rewrite Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Big bang | Rewrite all files in parallel, test at end | |
| File-by-file | Rewrite one file at a time, verify each against Supabase before moving on | ✓ |

**User's choice:** File-by-file
**Follow-up Q1 — Rewrite order:**

| Option | Description | Selected |
|--------|-------------|----------|
| database.js first | Rewrite connection layer first, then repos | ✓ |
| database.js last | Rewrite repos first with new query syntax, swap connection at end | |
| You decide | Let the planner determine optimal order | |

**User's choice:** database.js first

**Follow-up Q2 — mysql2 removal timing:**

| Option | Description | Selected |
|--------|-------------|----------|
| Remove early | Remove mysql2 from package.json immediately after database.js rewrite | ✓ |
| Keep until done | Keep mysql2 until all 4 repos confirmed working | |

**User's choice:** Remove early

**Follow-up Q3 — Verification method:**

| Option | Description | Selected |
|--------|-------------|----------|
| Manual API calls | After each repo rewrite, restart server and test API endpoints | ✓ |
| Inline smoke script | Create a quick script per repo that runs queries against Supabase | |
| Both | Smoke script + manual API check | |

**User's choice:** Manual API calls

**Notes:** Clean break approach — mysql2 removed early, database.js first, verify manually after each file.

---

## Error Handling Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Direct code swap | Replace ER_DUP_ENTRY checks with PG code 23505 | |
| Abstracted mapper | Create normalizeDbError() mapping PG codes to meaningful error names | ✓ |
| Restructure handling | Decouple from DB-specific codes entirely | |

**User's choice:** Abstracted mapper

**Follow-up Q1 — Mapper location:**

| Option | Description | Selected |
|--------|-------------|----------|
| New utility module | Create backend/src/utils/dbErrors.js | ✓ |
| Part of database.js | Export error mapping from database.js alongside pool | |

**User's choice:** New utility module

**Follow-up Q2 — Error code coverage:**

| Option | Description | Selected |
|--------|-------------|----------|
| Just unique_violation | Map only 23505 (the one currently used) | |
| Expand to common codes | Map unique_violation, foreign_key_violation, not_null_violation, check_violation | ✓ |
| All constraint violations | Map all 23xxx PostgreSQL error codes | |

**User's choice:** Expand to common codes (23505, 23503, 23502, 23514)

**Notes:** Decouple controllers from DB-specific error codes via a dedicated utility module.

---

## Pool Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative (5) | Max 5 connections | |
| Default pg (10) | Max 10 connections | ✓ |
| Minimal (2) | Max 2 connections | |

**User's choice:** Default pg (10)

**Follow-up Q1 — SSL setting:**

| Option | Description | Selected |
|--------|-------------|----------|
| Strict SSL | require: true, rejectUnauthorized: true | ✓ |
| Relaxed SSL | require: true, rejectUnauthorized: false | |
| Environment-aware | Strict in production, relaxed in development | |

**User's choice:** Strict SSL

**Follow-up Q2 — Timeout settings:**

| Option | Description | Selected |
|--------|-------------|----------|
| Default pg timeouts | Use pg defaults | |
| Configure timeouts | Explicit connectionTimeoutMillis (5s) and idleTimeoutMillis (30s) | ✓ |

**User's choice:** Configure timeouts (5s connection, 30s idle)

**Notes:** Default pool of 10, strict SSL, explicit timeouts. Standard Supabase-safe configuration.

---

## Testing During Rewrite

| Option | Description | Selected |
|--------|-------------|----------|
| Against live Supabase | Use the actual Supabase instance for verification | ✓ |
| Against local PostgreSQL | Set up local PG for isolated testing | |

**User's choice:** Against live Supabase

**Follow-up Q1 — Testing cadence:**

| Option | Description | Selected |
|--------|-------------|----------|
| After each file | Test immediately after each repository rewrite | ✓ |
| After all files | Test everything at the end | |
| Per natural batch | Test database.js, then food repo, then remaining 3 together | |

**User's choice:** After each file

**Follow-up Q2 — Rollback strategy:**

| Option | Description | Selected |
|--------|-------------|----------|
| Git revert per file | Revert broken file via git, fix, re-attempt | ✓ |
| Keep old file as backup | Rename old file as fallback before rewriting | |

**User's choice:** Git revert per file

**Notes:** Live Supabase verification, after each file rewrite, git-based rollback.

---

## MySQL Pattern Translation Sweep

| Option | Description | Selected |
|--------|-------------|----------|
| Systematic grep checklist | Create rg patterns for every MySQL construct, document and fix | ✓ |
| As-you-go during rewrite | Find and fix MySQL patterns as each file is rewritten | |

**User's choice:** Systematic grep checklist

**Follow-up Q1 — Artifact permanence:**

| Option | Description | Selected |
|--------|-------------|----------|
| One-time checklist | Create, run, fix, discard | ✓ |
| Reusable script | Keep as check-mysql-patterns.sh for CI | |

**User's choice:** One-time checklist

**Follow-up Q2 — Scan scope:**

| Option | Description | Selected |
|--------|-------------|----------|
| Backend only | Scan only backend/src/ | |
| Full codebase | Scan everything including config, scripts, docs | ✓ |

**User's choice:** Full codebase

**Notes:** One-time systematic rg checklist scanning entire repo. After mysql2 is gone, no need to keep MySQL patterns.

---

## the agent's Discretion

- Exact grep patterns and order for the MySQL checklist
- Which specific API endpoints to hit for manual verification per repository
- Error mapper function signature and return format
- Whether to create a single smoke script for database.js verification

## Deferred Ideas

None — discussion stayed within phase scope.
