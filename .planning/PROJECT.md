# Fitness_App

## What This Is

A web-based health application that helps users monitor their body condition through BMI calculation and daily calorie estimation (TDEE), track food consumption by ingredient and weight, and receive simple physical activity recommendations. It's designed for both general public and fitness enthusiasts who want to build healthier habits through digital tools.

## Core Value

Users can accurately calculate their BMI and TDEE, log daily food intake by selecting ingredients and entering weight in grams, and understand their calorie balance — all in one integrated, easy-to-use English-language health tool.

## Current State

**Shipped:** v1.1 International Ingredient Logging (2026-05-18)
**Phases:** 8 complete | **Plans:** 23 | **Tasks:** 28
**LOC:** ~1,228 insertions across 18 files in v1.1

### Next Milestone Goals

- Plan v1.2 scope — what comes after ingredient logging?
- Potential areas: data persistence improvements, advanced nutrition tracking (macros), meal planning, progress charts, export functionality

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

### Active

(None — all v1.1 requirements shipped)

### Out of Scope

- Real AI/ML activity recommendations — use rule-based randomization for v1
- Mobile app — web-first, responsive design
- Social features (sharing, community) — not core to individual health tracking
- Advanced nutrition data (macros, vitamins) — calories only
- Meal/recipe logging — ingredient-level only for now

## Context

- **Language**: All UI text in English (switched from Bahasa Indonesia in v1.1)
- **Target users**: International users tracking food intake by ingredients
- **Architecture**: Monorepo with separate `frontend/` and `backend/` directories
- **Frontend**: React + JavaScript + NPM
- **Backend**: Express.js + JavaScript
- **Database**: MySQL (RDBMS)
- **Auth**: Google OAuth2 + JWT + crypto module
- **Infrastructure**: Docker containerization, Cloudflare Tunnel for secure network exposure
- **Version control**: Git
- **Activity recommendations**: Dummy/randomized logic (no real ML for v1)
- **Food database**: 201 international ingredients across 8 English categories + custom ingredient entry
- **v1.0 shipped**: 5 phases complete, 38/38 UAT tests passed, backend live-tested
- **v1.1 shipped**: 3 phases complete (6-8), 23 total plans, 1,228 insertions across 18 files

## Constraints

- **Quality**: Build it right — proper code structure, error handling, and testing over speed
- **Styling**: Minimal — function over form, clean but not elaborate
- **Tech stack**: React + Express + MySQL (already decided)
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
*Last updated: 2026-05-18 after v1.1 milestone complete*
