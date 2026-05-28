# Milestones

## v1.1 International Ingredient Logging (Shipped: 2026-05-18)

**Phases completed:** 8 phases, 23 plans, 28 tasks

**Key accomplishments:**

- Docker Compose MySQL 8.4 infrastructure, user table with PDP consent, ESM backend with mysql2 connection pool, and repository pattern with parameterized queries
- Complete auth backend with email/password registration and login, Google OAuth via Passport, JWT session management using httpOnly cookies, PDP consent enforcement, and Express app with security middleware
- Plan:
- Profiles table with FK to users, profile CRUD repository, BMI calculation service using Asian-Pacific cutoffs, and /api/profile routes with auth + rate limiting
- Profile form with Zod validation, color-coded BMI result display, Indonesian translations, and first-login redirect guard
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Updated foods table ENUM to 8 English categories and replaced 105 Indonesian foods with 201 international ingredients across all categories
- Updated VALID_CATEGORIES constant from 7 Indonesian values to 8 English values matching the init.sql ENUM migration, while preserving Indonesian validation error messages for Phase 8 UI migration.
- FoodSearch component categoryLabels mapping updated from 7 Indonesian keys to 8 English keys matching the new ingredient database ENUM
- Live calorie preview on food logging page with real-time calculation as user enters weight, backed by 12 unit tests and verified end-to-end server-side calculation flow
- Custom ingredient form reduced to name + calories per 100g only, with backend auto-assigning 'other' category (LOG-09)
- Extended recent foods with last logged portion for quick-add pre-fill; verified daily calorie summary correctly aggregates ingredient-based entries (CALC-01, CALC-02)
- All 123 Indonesian translation values in translations.js replaced with English equivalents across 8 sections (app, auth, validation, profile, bmi, tdee, foodLog, activities), with 'kcal' replacing 'kkal' per D-21
- All hardcoded 'kkal' replaced with 'kcal', all hardcoded Indonesian strings replaced with English across 6 frontend components and 3 backend service files; VALID_MEAL_TYPES updated to English values per D-18
- food_logs.meal_type ENUM migrated from Indonesian (sarapan, makan_siang, makan_malam, camilan) to English (breakfast, lunch, dinner, snack) with 3-step migration script in init.sql

---
