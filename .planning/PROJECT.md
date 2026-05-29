# Fitness_App

## What This Is

A web-based health application that helps users monitor their body condition through BMI calculation and daily calorie estimation (TDEE), track food consumption by ingredient and weight, and receive simple physical activity recommendations. It's designed for both general public and fitness enthusiasts who want to build healthier habits through digital tools.

## Core Value

Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## Current Milestone: v1.3 Activity Tracking & Smart Suggestions

**Goal:** Add activity logging and LLM-powered weekly activity planning to enhance the exercise recommendation system.

**Target features:**
- **Activity Logger** — Log activity type + duration + intensity with database persistence
- **LLM Weekly Activity Suggestions** — Personalized weekly plan considering user's activity level, goals, history, and weight; auto-generated weekly
- **LLM Integration** — API integration with an LLM provider for generating personalized suggestions

## Current State

**Shipped:** v1.2 Supabase Migration (2026-05-28)
**Phases:** 12 complete (v1.1: Phases 1-8, v1.2: Phases 9-12) | **Plans:** 39 | **Commits:** 87

## Requirements

### Validated

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
- ✓ Ingredient database with 200+ international items organized by 8 English categories — v1.1
- ✓ User can log food by selecting ingredient + entering weight in grams — v1.1
- ✓ System calculates calories server-side (weight × calories per 100g) — v1.1
- ✓ User can add custom ingredients with name + calories per 100g — v1.1
- ✓ Quick-add pre-fills weight from last logged portion — v1.1
- ✓ Daily calorie summary shows consumed vs TDEE target with progress bar — v1.1
- ✓ All UI text, category names, and meal labels in English — v1.1
- ✓ Database meal_type ENUM migrated from Indonesian to English — v1.1
- ✓ Supabase project initialized with PostgreSQL 17, config.toml, and .gitignore — v1.2 Phase 9
- ✓ PostgreSQL schema with 6 tables, 5 ENUMs, 4 FK constraints, 5 indexes migrated from MySQL — v1.2 Phase 9
- ✓ 201 food ingredients and 35 activities seeded into Supabase via re-runnable SQL — v1.2 Phase 9
- ✓ Node.js can establish SSL-encrypted connection to Supabase via pg driver — v1.2 Phase 9
- ✓ Backend database.js rewritten from mysql2/promise to pg Pool with Supabase SSL config — v1.2 Phase 10
- ✓ normalizeDbError() maps PostgreSQL SQLSTATE codes (23505, 23503, 23502, 23514) for controller error handling — v1.2 Phase 10
- ✓ mysql2 dependency removed from package.json; pg is the only database driver — v1.2 Phase 10
- ✓ Food, profile, user, and activity repositories use PostgreSQL syntax ($1 placeholders, RETURNING *, RANDOM(), ?| operator) — v1.2 Phase 10
- ✓ All pdp_consent boolean comparisons use `=== true` for PostgreSQL BOOLEAN type — v1.2 Phase 10
- ✓ Zero MySQL patterns remain in backend/src/ source files — v1.2 Phase 10
- ✓ Supabase PostgreSQL connection via pg Pool with SSL — v1.2 Phase 10
- ✓ normalizeDbError() maps PostgreSQL SQLSTATE (23505, 23503, 23502, 23514) — v1.2 Phase 10
- ✓ mysql2 dependency removed; pg is the only database driver — v1.2 Phase 10
- ✓ Docker: single multi-stage container, Express serves React — v1.2 Phase 11
- ✓ Integration tests pass against Supabase PostgreSQL — v1.2 Phase 12
- ✓ Full-stack smoke test script validates build + API + frontend — v1.2 Phase 12

### Active

(TBD — define during next milestone scoping)

### Out of Scope

- Real AI/ML activity recommendations — use rule-based randomization for v1
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

## Context

- **Language**: All UI text in English (switched from Bahasa Indonesia in v1.1)
- **Target users**: International users tracking food intake by ingredients
- **Architecture**: Monorepo with separate `frontend/` and `backend/` directories
- **Frontend**: React + JavaScript + NPM
- **Backend**: Express.js + JavaScript
- **Database**: Supabase PostgreSQL (migrated from MySQL in v1.2 Phase 9)
- **Auth**: Google OAuth2 + JWT + crypto module
- **Infrastructure**: Docker containerization, Cloudflare Tunnel for secure network exposure
- **Version control**: Git
- **Activity recommendations**: Dummy/randomized logic (no real ML for v1)
- **Food database**: 201 international ingredients across 8 English categories + custom ingredient entry
- **v1.0 shipped**: 5 phases complete, 38/38 UAT tests passed, backend live-tested
- **v1.1 shipped**: 3 phases complete (6-8), 23 total plans, 1,228 insertions across 18 files
- **v1.2 shipped**: 4 phases complete (9-12), 13 plans, 87 commits, 62 files changed (+4419 / −428)

## Constraints

- **Quality**: Build it right — proper code structure, error handling, and testing over speed
- **Styling**: Minimal — function over form, clean but not elaborate
- **Tech stack**: React + Express + Supabase PostgreSQL (migrated from MySQL in v1.2)
- **Language**: English UI (switched from Indonesian in v1.1)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo structure | Keep frontend/backend in same repo for easier development | ✓ Good |
| Minimal styling | Focus on functionality and quality first | ✓ Good |
| Dummy AI/ML for activities | Avoid ML complexity in v1, use randomized suggestions | ✓ Good |
| Pre-seeded + custom food database | Best of both worlds — common foods available, custom entry for anything else | ✓ Good |
| All 5 features in MVP | User wants complete health tracking from day one | ✓ Good |
| Switch to ingredient-based logging | Users want granular control over what they eat, not pre-defined meals | ✓ Good — v1.1 |
| English UI for international audience | Broader user base beyond Indonesia | ✓ Good — v1.1 |
| In-place translation replacement (no i18n framework) | Simpler, faster migration for single-language switch | ✓ Good — v1.1 |
| meal_type ENUM migration via UPDATE→ALTER | Preserve historical data during migration | ✓ Good — v1.1 |
| Supabase PostgreSQL migration (v1.2) | Move from local MySQL to managed Supabase PostgreSQL for simplified deployment | ✓ Active — v1.2 |
| No ORM — raw SQL with pg driver | Continue with repository pattern from v1.0/v1.1; no Prisma/Knex overhead | ✓ Good — v1.2 Phase 9 |
| No Supabase Auth | Keep existing JWT + Google OAuth; skip Supabase Auth to avoid migration cost | ✓ Good — v1.2 Phase 9 |
| pg Pool with connectionString and strict SSL | Supabase requires SSL connection; connectionString simplifies config | ✓ Good — v1.2 Phase 10 |
| normalizeDbError utility (no AppError coupling) | Decouples error codes from controllers; keeps AppError as controller-level concern | ✓ Good — v1.2 Phase 10 |
| Sequential per-repository rewrite with file granularity | Each repository rewritten independently for targeted git revert per file (D-13) | ✓ Good — v1.2 Phase 10 |
| No RLS | Keep server-side-only auth; skip RLS complexity | ✓ Good — v1.2 Phase 9 |
| DO $$ blocks for portable ENUM creation | CREATE TYPE IF NOT EXISTS requires PG 14+; DO $$ block works on all versions | ✓ Good — v1.2 Phase 9 |
| psql for schema/seed execution | Avoids Supabase SQL Editor 1MB limit; preferred over supabase db push | ✓ Good — v1.2 Phase 9 |
| Multi-stage Dockerfile with final stage Node image | Single container reduces infra complexity; no nginx needed for SPA | ✓ Good — v1.2 Phase 11 |
| Express.static() + SPA catch-all for frontend serving | Keeps stack simple; no separate frontend server needed | ✓ Good — v1.2 Phase 11 |
| DATABASE_URL_TEST for integration test isolation | Tests use dedicated test schema; no collision with dev/prod data | ✓ Good — v1.2 Phase 12 |

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
*Last updated: 2026-05-28 after starting v1.3 Activity Tracking & Smart Suggestions*
