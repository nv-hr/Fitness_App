# KalaFit

## What This Is

KalaFit is a fitness tracking web app that lets users track biometrics (weight), manage a daily calorie budget, log workouts and meals, and receive personalized AI-generated weekly workout plans and daily meal plans. Built as a React SPA with an Express.js REST API backend and PostgreSQL (Supabase) database.

## Core Value

Users can track their fitness metrics and get personalized AI-generated workout and meal plans tailored to their goals.

## Requirements

### Validated

- ✓ Biometric tracking (weight logging with trend view) — existing
- ✓ Calorie budget management with daily allowance calculation — existing
- ✓ Calorie and macro tracking per meal — existing
- ✓ Food logging with search and custom entries — existing
- ✓ Workout/activity logging — existing
- ✓ AI-generated weekly workout plans (via OpenRouter/LLM) — existing
- ✓ AI-generated daily meal plans — existing
- ✓ Activity swap/regeneration in plans — existing
- ✓ JWT-based authentication (login, register, session) — existing
- ✓ Google OAuth authentication — existing
- ✓ User profile management — existing
- ✓ Exercise library with CRUD — existing
- ✓ Progress dashboard with visualizations — existing
- ✓ PostgreSQL database with migrations and seed data — existing
- ✓ Rate limiting on AI plan endpoints — existing

### Active

- [ ] Run project locally and fix any startup issues
- [ ] Ensure all tests pass
- [ ] Documentation updates

### Out of Scope

- Mobile native apps — web-only for now
- Real-time collaboration — single-user fitness tracking
- Payment/subscription system — not planned

## Context

KalaFit is a brownfield project with an existing codebase. The backend uses Express.js with a layered architecture (Routes → Controllers → Services → Repositories → DB), and the frontend uses React 19 with Vite and Tailwind CSS. AI features use OpenRouter API with OpenAI-compatible SDK. The database is PostgreSQL hosted on Supabase.

The codebase currently has deleted files from the working tree that need restoration before the app can run.

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

*Last updated: 2026-06-02 after initialization*
