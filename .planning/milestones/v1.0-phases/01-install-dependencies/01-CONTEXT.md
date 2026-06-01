# Phase 1: Install Dependencies - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Codebase is restored to a runnable state with all dependencies installed and configured. This is a pure infrastructure/setup phase — no user-facing behavior changes.

Key tasks:
1. Restore ~200 deleted source files from git history (git checkout HEAD for deleted files, or restore from stash/previous commits)
2. Run `npm install` in both frontend and backend workspaces
3. Ensure `.env` exists with required configuration (DATABASE_URL, JWT_SECRET, OPENROUTER_API_KEY, etc.)
4. Apply database schema migrations
5. Verify `npm test` runs without import errors (tests may fail due to missing DB, but modules resolve)

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Structure
- Root `package.json` defines npm workspaces: `["frontend", "backend"]`
- Backend: Express.js ESM (`"type": "module"`) with layered architecture (Routes → Controllers → Services → Repositories → DB)
- Frontend: React 19 SPA with Vite, Tailwind CSS v4, React Router v7
- `.env` file exists with JWT_SECRET, DATABASE_URL, GOOGLE OAuth, and OPENROUTER_API_KEY

### Restore Strategy
- `git checkout HEAD -- <path>` for deleted files (staged deletions from `docs: initialize project` commit)
- OR `git restore --staged .` then `git restore .` to unstage all and restore working tree

### Dependencies
- npm workspaces monorepo — `npm install` at root installs all workspaces
- Lockfiles are gitignored — fresh install from package.json specs
- Backend uses pg, express, jsonwebtoken, bcryptjs, passport, openai SDK
- Frontend uses react, react-dom, react-router-dom, @tanstack/react-query, tailwindcss, recharts

### Database
- Supabase PostgreSQL with session pooler connection string (port 6543)
- DB init scripts in `backend/db/init.sql`, schema in `backend/db/schema.sql`, seed in `backend/db/seed.sql`
- Migration runner: `scripts/db-init.js` or `backend/db/run_migration.js`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Standard approach: restore files, install deps, verify config, apply migrations, run tests.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
