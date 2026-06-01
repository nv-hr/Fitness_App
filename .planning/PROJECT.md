# KalaFit

## What This Is

KalaFit is a fitness tracking web app that lets users track biometrics (weight), manage a daily calorie budget, log workouts and meals, and receive personalized AI-generated weekly workout plans and daily meal plans. Built as a React SPA with an Express.js REST API backend and PostgreSQL (Supabase) database.

## Current State (v1.0)

**Shipped:** 2026-06-02

All source files restored, dependencies installed, and application verified running:
- Frontend: React 19 + Vite 8 + Tailwind CSS 4 — runs on port 3000
- Backend: Express.js REST API — runs on port 3001
- Database: Supabase PostgreSQL — connected
- AI: OpenRouter (Owl Alpha model) — configured
- Auth: JWT cookies + Passport.js (email/password + Google OAuth)

69/92 tests pass. Integration tests require running server.

### Shipped Features

- ✓ Biometric tracking (weight logging with trend view)
- ✓ Calorie budget management with daily allowance calculation
- ✓ Calorie and macro tracking per meal
- ✓ Food logging with search and custom entries
- ✓ Workout/activity logging
- ✓ AI-generated weekly workout plans (via OpenRouter/LLM)
- ✓ AI-generated daily meal plans
- ✓ Activity swap/regeneration in plans
- ✓ JWT-based authentication (login, register, session)
- ✓ Google OAuth authentication
- ✓ User profile management
- ✓ Exercise library with CRUD
- ✓ Progress dashboard with visualizations
- ✓ PostgreSQL database with migrations and seed data
- ✓ Rate limiting on AI plan endpoints

## Requirements

See [milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md) for v1.0 archived requirements.

## Next Milestone Goals (v1.1)

To be defined. Potential areas:
- Integration test infrastructure
- E2E flow testing
- Additional features from backlog

## Context

KalaFit is a brownfield project with an existing codebase. The backend uses Express.js with a layered architecture (Routes → Controllers → Services → Repositories → DB), and the frontend uses React 19 with Vite and Tailwind CSS. AI features use OpenRouter API with OpenAI-compatible SDK. The database is PostgreSQL hosted on Supabase.

## Constraints

- **Platform**: Web only (React SPA + REST API)
- **Database**: PostgreSQL via Supabase
- **AI Provider**: OpenRouter (with Google Gemini SDK also installed)
- **Auth**: JWT cookies + Passport.js (local + Google OAuth)
- **Runtime**: Node.js >= 18, npm workspaces monorepo

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Express.js + React SPA | Simple, well-understood stack for a full-stack web app | — Existing (shipped) |
| PostgreSQL via Supabase | Managed Postgres with good free tier | — Existing (shipped) |
| OpenRouter for LLM | Access to multiple models via single API; fallback models configured | — Existing (shipped) |
| JWT cookies for auth | HttpOnly cookies for security, works with same-origin architecture | — Existing (shipped) |
| npm workspaces monorepo | Shared tooling, single `npm install` | — Existing (shipped) |

---

*Last updated: 2026-06-02 after v1.0 milestone completion*
