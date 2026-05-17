# Fitness_App

## What This Is

A web-based health application that helps Indonesian users monitor their body condition through BMI calculation and daily calorie estimation (TDEE), track food consumption, and receive simple physical activity recommendations. It's designed for both general public and fitness enthusiasts who want to build healthier habits through digital tools.

## Core Value

Users can accurately calculate their BMI and TDEE, log daily food intake, and understand their calorie balance — all in one integrated, easy-to-use Indonesian-language health tool.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can register and login with email/password and Google OAuth
- [ ] User session persists via JWT across page refreshes
- [ ] User can input weight, height, age, and gender to calculate BMI
- [ ] User can view BMI result with category (underweight, normal, overweight, obese)
- [ ] User can input weight, height, age, gender, and activity level to calculate TDEE
- [ ] User can view TDEE result with daily calorie target
- [ ] User can manually log daily calorie intake (food name + calories)
- [ ] User can view daily calorie balance (consumed vs TDEE target)
- [ ] User can search pre-seeded Indonesian food database for calorie info
- [ ] User can add custom foods not in the database
- [ ] User receives randomized simple activity recommendations based on their goal
- [ ] UI is in Bahasa Indonesia

### Out of Scope

- Real AI/ML activity recommendations — use rule-based randomization for v1
- Mobile app — web-first, responsive design
- Social features (sharing, community) — not core to individual health tracking
- Advanced nutrition data (macros, vitamins) — calories only for v1

## Context

- **Language**: All UI text in Bahasa Indonesia
- **Target users**: Indonesian general public and fitness enthusiasts
- **Architecture**: Monorepo with separate `frontend/` and `backend/` directories
- **Frontend**: React + JavaScript + NPM
- **Backend**: Express.js + JavaScript
- **Database**: MySQL (RDBMS)
- **Auth**: Google OAuth2 + JWT + crypto module
- **Infrastructure**: Docker containerization, Cloudflare Tunnel for secure network exposure
- **Version control**: Git
- **Activity recommendations**: Dummy/randomized logic (no real ML for v1)
- **Food database**: Pre-seeded with common Indonesian foods + custom food entry

## Constraints

- **Quality**: Build it right — proper code structure, error handling, and testing over speed
- **Styling**: Minimal — function over form, clean but not elaborate
- **Tech stack**: React + Express + MySQL (already decided)
- **Language**: Indonesian UI required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Monorepo structure | Keep frontend/backend in same repo for easier development | ✓ Good |
| Minimal styling | Focus on functionality and quality first | ✓ Good |
| Dummy AI/ML for activities | Avoid ML complexity in v1, use randomized suggestions | ✓ Good |
| Pre-seeded + custom food database | Best of both worlds — common foods available, custom entry for anything else | ✓ Good |
| All 5 features in MVP | User wants complete health tracking from day one | ✓ Good |

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
*Last updated: 2026-05-17 after initialization*
