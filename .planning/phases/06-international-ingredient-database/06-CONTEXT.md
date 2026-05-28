# Phase 6: International Ingredient Database - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Task Boundary

Replace the Indonesian meal database with a comprehensive international ingredient database. Users browse/search ingredients organized by category, each with calories per 100g. This is Phase 6 of v1.1 — the database foundation that Phase 7 (ingredient logging) depends on.

</domain>

<decisions>
## Implementation Decisions

### Database Migration Strategy
- **Truncate + reseed** the existing `foods` table
- Delete all Indonesian meal rows, replace with international ingredients
- Existing `food_logs` keep their `calories` values but `food_id` becomes NULL (SET NULL on delete)
- No new table needed — reuse existing `foods` schema

### Ingredient Categories
- 8 simple categories: **proteins, carbs, vegetables, fruits, dairy, fats, drinks, other**
- Change `category` ENUM in `foods` table from Indonesian values to English values
- Current ENUM: `('makanan_pokok', 'lauk', 'sayur', 'buah', 'minuman', 'snack', 'lainnya')`
- New ENUM: `('proteins', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'drinks', 'other')`

### Ingredient Data Source
- **USDA FoodData Central** — free, authoritative, 300,000+ foods
- Download CSV/JSON dataset (not live API calls at runtime)
- Seed the database at startup from USDA data
- Extract: ingredient name, calories per 100g, category mapping

### Ingredient Name Format
- **With descriptors** — "chicken breast", "brown rice", "whole egg"
- More specific entries, not generic "chicken" or "rice"
- Users get exactly what they're looking for

### Search Behavior
- **Keep search-first pattern** — same as current `FoodSearch.jsx`
- Type to search, click to select
- Debounced search-as-you-type (300ms delay already implemented)
- No category browsing UI — search is the primary interaction

### Reusable Assets (from codebase)
- `food.repository.js` — `searchFoods()`, `createCustomFood()`, `getFoodById()` all work as-is
- `food_logs` table structure unchanged — supports both seeded and custom entries
- `FoodSearch.jsx` — debounced search, dropdown results, touch-friendly (44px min height)
- `calories_per_100g` model already exists — no schema change needed for this field
- `is_custom` boolean pattern stays — seeded ingredients vs user-added custom ingredients

</decisions>

<specifics>
## Specific Ideas

- User wants comprehensive coverage — "as much as possible covering every possible food"
- USDA dataset should be filtered to common ingredients (not all 300,000 items)
- Category mapping from USDA categories to our 8 simple categories will need a translation layer
- Existing `food_logs` table `meal_type` ENUM still uses Indonesian values (`sarapan`, `makan_siang`, `makan_malam`, `camilan`) — this will be changed in Phase 8 (English UI), not here

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 6 goal and requirements (INGR-01 to INGR-04)
- `.planning/REQUIREMENTS.md` — v1.1 requirements with traceability
- `backend/db/init.sql` — Current `foods` table schema (lines 39-50), needs ENUM update
- `backend/src/repositories/food.repository.js` — Existing food repository (reuse searchFoods, createCustomFood)
- `frontend/src/features/food-log/components/FoodSearch.jsx` — Existing search component (reuse pattern)

</canonical_refs>
