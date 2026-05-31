# Fitness_App

## What This Is

A web-based health application that helps users monitor their body condition through BMI calculation and daily calorie estimation (TDEE), track food consumption by ingredient and weight, log physical activities with calorie burn, and receive AI-generated weekly activity plans. It's designed for both general public and fitness enthusiasts who want to build healthier habits through digital tools.

## Core Value

Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, log physical activities with intensity-based calorie tracking, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## Current State

**Shipped:** v1.4 LLM Food Recommendations (2026-05-31)
**Phases:** 23 complete (v1.0: 5, v1.1: 3, v1.2: 4, v1.3: 5, v1.4: 6) | **Plans:** 62 | **Commits:** 220+

### v1.3 shipped:
- **Activity Logger** — Log activity type + duration + intensity with server-authoritative calorie calculation (light/moderate/vigorous multipliers)
- **LLM Weekly Activity Plans** — AI-generated 7-day personalized plans via OpenRouter with day-by-day cards, single-day regeneration, and rate-limit UX
- **260/260 tests passing** — backend 134 + frontend 126

## Current Milestone: v1.5 Smart Auto-Logging

**Goal:** Auto-save generated activity/meal plans to logs, inline management (complete/regenerate), daily meal generation, auto-generation on page visit, and unified UI merging plan pages with log pages.

**Target features:**
- Generated activities auto-save to activity log with completed toggle
- Generated meals auto-save to food log with completed/regenerate actions
- Meal recommendations generate for 1 day (not weekly)
- Auto-generate plan when visiting page if none exists
- Manual regenerate button always available
- Activity Plan UI merged into Activities page
- Meal Plan UI merged into Food Log page

## Requirements

### Validated

#### v1.0 MVP
- ✓ User can register and login with email/password and Google OAuth — v1.0
- ✓ User session persists via JWT across page refreshes — v1.0
- ✓ User can input weight, height, age, and gender to calculate BMI — v1.0
- ✓ User can view BMI result with category (underweight, normal, overweight, obese) — v1.0
- ✓ User can input weight, height, age, gender, and activity level to calculate TDEE — v1.0
- ✓ User can view TDEE result with daily calorie target — v1.0
- ✓ User can manually log daily calorie intake — v1.0
- ✓ User can view daily calorie balance (consumed vs TDEE target) — v1.0
- ✓ User can search pre-seeded food database for calorie info — v1.0
- ✓ User can add custom foods not in the database — v1.0
- ✓ User receives randomized simple activity recommendations based on their goal — v1.0
- ✓ UI is in Bahasa Indonesia — v1.0 (replaced by English in v1.1)

#### v1.1 International Ingredient Logging
- ✓ Ingredient database with 200+ international items organized by 8 English categories — v1.1
- ✓ User can log food by selecting ingredient + entering weight in grams — v1.1
- ✓ System calculates calories server-side (weight × calories per 100g) — v1.1
- ✓ User can add custom ingredients with name + calories per 100g — v1.1
- ✓ Quick-add pre-fills weight from last logged portion — v1.1
- ✓ Daily calorie summary shows consumed vs TDEE target with progress bar — v1.1
- ✓ All UI text, category names, and meal labels in English — v1.1
- ✓ Database meal_type ENUM migrated from Indonesian to English — v1.1

#### v1.2 Supabase Migration
- ✓ Supabase project initialized with PostgreSQL 17, config.toml, and .gitignore — v1.2
- ✓ PostgreSQL schema with 6 tables, 5 ENUMs, 4 FK constraints, 5 indexes migrated from MySQL — v1.2
- ✓ 201 food ingredients and 35 activities seeded into Supabase via re-runnable SQL — v1.2
- ✓ Node.js establishes SSL-encrypted connection to Supabase via pg driver — v1.2
- ✓ Backend database.js rewritten from mysql2/promise to pg Pool with Supabase SSL config — v1.2
- ✓ normalizeDbError() maps PostgreSQL SQLSTATE codes — v1.2
- ✓ mysql2 dependency removed; pg is the only database driver — v1.2
- ✓ All repositories use PostgreSQL syntax ($1 placeholders, RETURNING *, RANDOM()) — v1.2
- ✓ Zero MySQL patterns remain in backend/src/ — v1.2
- ✓ Docker: single multi-stage container, Express serves React — v1.2
- ✓ Integration tests pass against Supabase PostgreSQL — v1.2
- ✓ Full-stack smoke test validates build + API + frontend — v1.2

#### v1.3 Activity Tracking & Smart Suggestions
- ✓ User can log an activity with duration and intensity (light/moderate/vigorous) — v1.3
- ✓ User can view activity history with date, name, duration, intensity, calories — v1.3
- ✓ User can delete logged activities from history — v1.3
- ✓ Daily activity summary shows active minutes, calories burned, net calories — v1.3
- ✓ LLM auto-generates personalized weekly activity plan from database activities — v1.3
- ✓ User can view weekly plan as day-by-day cards — v1.3
- ✓ User can regenerate a single day/card (rate-limited) — v1.3
- ✓ System falls back to cached plan when LLM unavailable — v1.3
- ✓ OpenRouter integration with rate limiting and output validation — v1.3

#### v1.4 LLM Food Recommendations
- ✓ LLM generates daily meal recommendations from 200+ ingredient database — v1.4
- ✓ Portions auto-calculated to meet user's calorie target — v1.4
- ✓ One-click log recommended meals to food diary — v1.4
- ✓ Weekly meal plan caching with namespace isolation — v1.4
- ✓ Fuzzy ingredient matching (exact → substring → Levenshtein) — v1.4
- ✓ Correction loop with 2 max attempts before template fallback — v1.4
- ✓ Rate-limited: generate 5/15min, regenerate 3/30min, log-day 30/15min — v1.4
- ✓ Batch log with atomic transaction — v1.4

### Active

(TBD — define during milestone scoping)

### Out of Scope

- Real AI/ML activity recommendations — use LLM-powered generation for v1.3
- Mobile app — web-first, responsive design
- Social features (sharing, community) — not core to individual health tracking
- Advanced nutrition data (macros, vitamins) — calories only
- Meal/recipe logging — ingredient-level only for now
- Supabase Auth (replacing JWT) — current auth works, migration adds risk
- Supabase Realtime subscriptions — no real-time features needed
- Row Level Security (RLS) — server-side-only architecture
- ORM (Prisma/Drizzle) — repository pattern with raw SQL is sufficient
- nginx/Caddy reverse proxy — unnecessary at this scale
- Zero-downtime migration — fresh Supabase start assumed
- Custom activity entry — deferred to future milestone
- One-click plan-to-log — deferred to v2
- Edit logged activities — delete-and-recreate sufficient
- Notifications (email/push) — out of scope for activity tracking
- Real-time activity sync — no wearable integration

## Context

- **Language**: All UI text in English (switched from Bahasa Indonesia in v1.1)
- **Target users**: International users tracking food intake and physical activity
- **Architecture**: Monorepo with separate `frontend/` and `backend/` directories
- **Frontend**: React 19 + Vite 8 + TanStack React Query + React Hook Form + Zod
- **Backend**: Express 5 (ESM) + Passport (JWT + Google OAuth) + Helmet + express-rate-limit
- **Database**: Supabase PostgreSQL 17 (pg driver, no ORM)
- **Auth**: Email/password + Google OAuth, httpOnly JWT cookies (7-day expiry)
- **LLM**: OpenRouter API (OpenAI SDK), node-cache for in-memory plan caching
- **Infrastructure**: Docker multi-stage build (single container, Express serves built frontend)
- **Testing**: Jest (backend) + Vitest (frontend) — 260 tests total
- **Activity recommendations**: LLM-powered weekly plans (OpenRouter) + rule-based pool recommendations
- **Food database**: 201 international ingredients across 8 English categories + custom ingredient entry
- **Activity database**: 35 seeded activities with calorie-per-hour values and goal tags
- **v1.0 shipped**: 5 phases, 12 plans
- **v1.1 shipped**: 3 phases (6-8), 9 plans, English UI, ingredient-based logging
- **v1.2 shipped**: 4 phases (9-12), 13 plans, 87 commits, Supabase PostgreSQL migration
- **v1.3 shipped**: 5 phases (13-17), 9 plans, 110 commits, +13,786 LOC

## Constraints

- **Quality**: Build it right — proper code structure, error handling, and testing over speed
- **Styling**: Minimal — function over form, clean but not elaborate
- **Tech stack**: React 19 + Express 5 + Supabase PostgreSQL
- **Language**: English UI only
- **LLM**: OpenRouter with free-tier models (rate-limited to 5 req/15 min)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo structure | Keep frontend/backend in same repo for easier development | ✓ Good |
| Minimal styling | Focus on functionality and quality first | ✓ Good |
| Dummy AI/ML for activities (v1.0) | Avoid ML complexity in v1, use randomized suggestions | ✓ Good (superseded by LLM in v1.3) |
| Pre-seeded + custom food database | Best of both worlds — common foods available, custom entry for anything else | ✓ Good |
| All 5 features in MVP | User wants complete health tracking from day one | ✓ Good |
| Switch to ingredient-based logging | Users want granular control over what they eat | ✓ Good — v1.1 |
| English UI for international audience | Broader user base beyond Indonesia | ✓ Good — v1.1 |
| In-place translation replacement | Simpler, faster migration for single-language switch | ✓ Good — v1.1 |
| meal_type ENUM migration via UPDATE→ALTER | Preserve historical data during migration | ✓ Good — v1.1 |
| Supabase PostgreSQL migration (v1.2) | Move from local MySQL to managed Supabase | ✓ Good — v1.2 |
| No ORM — raw SQL with pg driver | Continue repository pattern; no Prisma/Knex overhead | ✓ Good — v1.2 |
| No Supabase Auth | Keep existing JWT + Google OAuth | ✓ Good — v1.2 |
| pg Pool with connectionString and strict SSL | Supabase requires SSL connection | ✓ Good — v1.2 |
| Multi-stage Dockerfile | Single container reduces infra complexity | ✓ Good — v1.2 |
| Express.static() + SPA catch-all | No separate frontend server needed | ✓ Good — v1.2 |
| DATABASE_URL_TEST for test isolation | No collision with dev/prod data | ✓ Good — v1.2 |
| Intensity multipliers server-authoritative | Prevent client-side manipulation of calorie calculations | ✓ Good — v1.3 |
| GET endpoint returns cached plan (fromCache flag) | Avoid DB hit and rate-limit quota for read-only requests | ✓ Good — v1.3 |
| LLM triple fallback chain | Primary → fallback → openrouter/free for resilience | ✓ Good — v1.3 |
| node-cache with 1-hour TTL, maxKeys: 1000 | Memory-safe caching with bounded growth | ✓ Good — v1.3 |
| Single-day regeneration (merge-only) | Avoids regenerating entire plan for one changed day | ✓ Good — v1.3 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-31 after starting v1.5 milestone*
