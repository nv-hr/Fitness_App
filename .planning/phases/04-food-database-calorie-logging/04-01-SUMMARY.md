---
phase: 04-food-database-calorie-logging
plan: 01
subsystem: database
tags: [schema, seeding, food-database]
dependency_graph:
  requires: []
  provides: [foods table, food_logs table, 105 seed foods, food service]
  affects: [04-02, 04-03]
tech_stack:
  added: [MySQL 8.4, Node.js service layer]
  patterns: [Controller-Service-Repository]
key_files:
  created:
    - backend/src/services/food.service.js
  modified:
    - backend/db/init.sql
decisions:
  - "Used 7 INSERT statements (one per category) for readability and maintainability"
  - "Seeded 105 foods across all 7 categories exceeding the 100+ requirement"
  - "Food service uses dependency injection for repository functions (testable)"
metrics:
  duration: ~15min
  completed_date: "2026-05-18"
---

# Phase 04 Plan 01: Database Schema + Food Seeding Summary

**One-liner:** MySQL schema for foods + food_logs tables with 105 pre-seeded Indonesian foods across 7 categories, plus food service module with validation and calorie calculation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add foods and food_logs tables to init.sql with seed data | `d5a6a98` | backend/db/init.sql |
| 2 | Create food service with seeding verification | `315da90` | backend/src/services/food.service.js |

## What Was Built

### Database Schema (init.sql)
- **foods table**: Single table for seeded + custom foods (D-30). Columns: `id, user_id (NULL for seeded), name, calories_per_100g, category (7-value ENUM), is_custom (BOOLEAN), created_at`. Indexes on `name` and `user_id+category`.
- **food_logs table**: Daily food logging (D-33). Columns: `id, user_id, food_id (NULL for custom), custom_food_name (NULL for seeded), calories, portion_grams, log_date, meal_type (4-value ENUM), created_at`. Indexes on `user_id+log_date` and `user_id+log_date DESC`. Foreign keys to `users` and `foods`.

### Seed Data: 105 Indonesian Foods (D-31, D-32)
| Category | Count | Examples |
|----------|-------|---------|
| makanan_pokok | 18 | Nasi putih, Nasi goreng, Mie goreng, Bubur ayam |
| lauk | 25 | Rendang sapi, Ayam goreng, Tempe goreng, Bakso |
| sayur | 11 | Gado-gado, Sayur bayam, Sayur sop, Capcay |
| buah | 12 | Pisang, Jeruk, Mangga, Durian, Rambutan |
| minuman | 11 | Teh manis, Kopi susu, Es jeruk, Wedang jahe |
| snack | 17 | Kue lapis, Martabak manis, Klepon, Risol |
| lainnya | 11 | Kecap manis, Sambal, Minyak goreng, Serundeng |

All seeded foods have `is_custom=FALSE, user_id=NULL`.

### Food Service (food.service.js)
- `getSeededFoodCount(countFoods)` — verify seed data integrity
- `getFoodsByCategory(findByCategory)` — category distribution check
- `validateFoodData(data)` — validates name (1-100 chars), calories (0-5000), valid category; throws ValidationError with Indonesian messages
- `calculateCalories(caloriesPer100g, portionGrams)` — pure function: `Math.round((caloriesPer100g * portionGrams) / 100)`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] init.sql has CREATE TABLE foods with correct schema
- [x] init.sql has CREATE TABLE food_logs with correct schema
- [x] 105 INSERT INTO foods rows (exceeds 100+ requirement)
- [x] All 7 categories have at least one food
- [x] All seeded foods have is_custom=FALSE
- [x] food.service.js exports all 4 required functions
- [x] calculateCalories(180, 200) = 360 ✓

## Self-Check: PASSED
