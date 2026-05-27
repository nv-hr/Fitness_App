# Research Summary: Fitness_App v1.2 Supabase Migration

**Domain:** Full-stack health tracking app — database migration & infrastructure simplification
**Researched:** 2026-05-27
**Overall confidence:** HIGH

## Executive Summary

The Fitness_App is migrating from a 4-service Docker Compose setup (MySQL 8.4 + Adminer + Express backend + React frontend) to a 2-tier architecture: a single container serving both the Express API and React static files, backed by managed Supabase PostgreSQL. This research covers two interconnected changes: (1) replacing `mysql2/promise` with `pg` (node-postgres) for database access, while preserving the existing repository pattern, and (2) consolidating Docker infrastructure into a multi-stage build that compiles the frontend and serves it via `express.static()`.

The migration is straightforward because:
- The existing repository pattern maps cleanly to `pg` (both use Pool-based connection management)
- The app has only 4 repository files with simple SELECT/INSERT/UPDATE queries
- Express `express.static()` is adequate for the app's expected traffic volume
- Supabase provides a managed PostgreSQL with a Supavisor connection pooler that handles SSL and connection multiplexing

Key MySQL→PG translation differences: placeholder syntax (`?` → `$1`), result destructuring (`[rows]` → `result.rows`), `LAST_INSERT_ID()` → `RETURNING *`, boolean handling (`1/0` → `true/false`), date functions (`DATE_SUB` → `INTERVAL` syntax), and error codes (`ER_DUP_ENTRY` → `'23505'`).

## Key Findings

**Stack:** Replace `mysql2` with `pg`; add Supabase connection via handled connection string; no ORM needed.
**Architecture:** Single multi-stage Docker container for production; Vite proxy dev server for development.
**Critical pitfall:** MySQL-specific SQL patterns (`LAST_INSERT_ID`, `JSON_OVERLAPS`, `DATE_SUB`) must be comprehensively grepped and translated before deployment. Missed patterns cause silent runtime failures.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Supabase Setup & Schema Migration** — Foundation
   - Addresses: Create Supabase project, run migration SQL
   - Avoids: Trying to run code against a database that doesn't exist yet
   - Dependencies: None (can start immediately)

2. **Backend Query Rewrite (pg migration)** — Core work
   - Addresses: All 4 repository files rewritten, database.js replaced
   - Avoids: Building Docker image before code is ready
   - Dependencies: Supabase must exist (Phase 1)

3. **Docker Restructure (Single Container)** — Infrastructure
   - Addresses: Multi-stage Dockerfile, docker-compose.yml rewrite, static serving
   - Avoids: Shipping half-working container without testing
   - Dependencies: Backend must be querying Supabase successfully (Phase 2)

4. **Testing & Validation** — Quality gate
   - Addresses: Integration tests against Supabase, manual smoke tests
   - Avoids: Deploying broken queries or missing static file serving
   - Dependencies: Docker image must be buildable (Phase 3)

**Phase ordering rationale:**
- Database must exist before code can connect to it
- Code must be querying correctly before Docker can be tested
- Infrastructure depends on working code

**Research flags for phases:**
- Phase 1: LOW risk — standard Supabase project creation + SQL execution
- Phase 2: MEDIUM risk — MySQL-specific patterns potentially missed; need thorough search
- Phase 3: LOW risk — well-understood Docker pattern
- Phase 4: MEDIUM risk — connection pool limits on free tier could cause test flakiness

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | pg is mature, well-documented replacement for mysql2; both use Pool pattern |
| Architecture | HIGH | Single-container full-stack is well-documented pattern; multi-stage build is standard |
| Pitfalls | HIGH | Six MySQL-specific patterns identified; error codes, placeholders, result shapes all documented |
| Supabase specifics | HIGH | Connection pooling, SSL, port selection all verified against Supabase docs (May 2026) |

## Gaps to Address

- **Test database**: Integration tests currently use the MySQL database. Need a strategy for test isolation with Supabase (use a separate Supabase project or the `pg-mem` library for in-memory testing).
- **Seed data SQL size**: Supabase SQL Editor has a 1MB limit. The food seed data is ~400 lines of INSERT statements. May need to split or use `psql` for bulk insertion.
- **Google OAuth redirect URI**: When running on single container at port 3001, the Google OAuth callback URL changes. Must be updated in Google Cloud Console.
- **Zero-downtime migration**: If this app is already deployed, migrating from MySQL to PostgreSQL requires either an export/import process or running both databases temporarily. Determine current deployment status.
