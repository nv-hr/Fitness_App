# Phase 9: Database Service - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 9-Database Service
**Areas discussed:** Adminer placement, Volume/network naming, Image version pinning

---

## Adminer Placement

| Option | Description | Selected |
|--------|-------------|----------|
| In docker-compose.db.yml (Recommended) | Adminer stays with MySQL in the same db.yml file | ✓ |
| Separate docker-compose.adminer.yml | Adminer becomes its own isolated service | |

**User's choice:** In docker-compose.db.yml (Recommended)
**Notes:** Simplifies user experience — one file to start DB stack. Phase 12 will reference this single file.

| Option | Description | Selected |
|--------|-------------|----------|
| Default config (Recommended) | Plain Adminer, default theme, no plugins | ✓ |
| Custom theme or login pre-fill | Convenience but couples config to Adminer internals | |

**User's choice:** Default config (Recommended)
**Notes:** Aligns with project's minimal styling constraint.

---

## Volume/Network Naming

| Option | Description | Selected |
|--------|-------------|----------|
| Shared names (Recommended) | mysql_data and fitness_net (same as root compose) | ✓ |
| Isolated names | fitness_mysql_data and fitness_db_net | |

**User's choice:** Shared names (Recommended)
**Notes:** Ensures data portability between db.yml and root compose. Avoids duplicate resource creation.

---

## Image Version Pinning

| Option | Description | Selected |
|--------|-------------|----------|
| Keep mysql:8.4 (Recommended) | Minor version tag, gets patch updates | ✓ |
| Pin to mysql:8.4.3 (exact) | Maximum reproducibility, no auto-patches | |

**User's choice:** Keep mysql:8.4 (Recommended)
**Notes:** Good balance of stability and security updates.

| Option | Description | Selected |
|--------|-------------|----------|
| Pin to specific version (Recommended) | Use adminer:4.8.1 or similar stable tag | ✓ |
| Keep adminer:latest | Always get newest Adminer on rebuild | |

**User's choice:** Pin to specific version (Recommended)
**Notes:** Avoids unexpected UI changes in development tooling.

---

## the agent's Discretion

- Port selection (3306 MySQL, 8080 Adminer) — carry forward from existing compose
- Healthcheck configuration — follow existing pattern
- Environment variable naming — continue DB_* prefix from .env
- Init SQL mount — continue mounting ./backend/db/init.sql

## Deferred Ideas

None — discussion stayed within phase scope.
