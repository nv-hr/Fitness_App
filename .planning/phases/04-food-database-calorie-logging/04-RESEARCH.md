# Phase 4 Research: Food Database & Calorie Logging

**Researched:** 2026-05-18
**Confidence:** HIGH

## Indonesian Food Database (TKPI)

### Official Data Source
- **TKPI 2019** (Tabel Komposisi Pangan Indonesia) — Official Kemenkes database with **1,148 food items**
- **panganku.org** — Web interface for TKPI data, supported by GAIN (Global Alliance for Improved Nutrition)
- Data is **publicly available** — no licensing restrictions for non-commercial use
- Each entry includes: food name, category, energy (kcal/100g BDD), protein, carbs, fat, vitamins, minerals

### Seeding Strategy (per D-31: 100+ foods)
For v1, seed a curated subset covering 7 categories (D-32):
- `makanan_pokok` — rice, noodles, bread, tubers
- `lauk` — meat, fish, chicken, tempe, tofu, eggs
- `sayur` — vegetables and vegetable dishes
- `buah` — fruits
- `minuman` — beverages
- `snack` — snacks, traditional cakes
- `lainnya` — condiments, oils, spices

### Calorie Data (per 100g BDD — Berat Dapat Dimakan)
Key Indonesian foods with verified calorie values:

| Food | Category | kcal/100g |
|------|----------|-----------|
| Nasi putih | makanan_pokok | 180 |
| Nasi goreng | makanan_pokok | 220 |
| Mie goreng | makanan_pokok | 190 |
| Roti putih | makanan_pokok | 248 |
| Kentang rebus | makanan_pokok | 87 |
| Ubi jalar | makanan_pokok | 123 |
| Bubur ayam | makanan_pokok | 99 |
| Lontong | makanan_pokok | 129 |
| Rendang sapi | lauk | 193 |
| Ayam goreng | lauk | 260 |
| Ayam bakar | lauk | 180 |
| Sate ayam | lauk | 180 |
| Soto ayam | lauk | 80 |
| Ikan goreng | lauk | 210 |
| Ikan bakar | lauk | 150 |
| Tempe goreng | lauk | 170 |
| Tempe bacem | lauk | 150 |
| Tahu goreng | lauk | 160 |
| Telur dadar | lauk | 180 |
| Telur rebus | lauk | 155 |
| Gado-gado | sayur | 120 |
| Sayur bayam | sayur | 30 |
| Sayur sop | sayur | 45 |
| Urap sayuran | sayur | 85 |
| Lalapan | sayur | 25 |
| Pisang | buah | 100 |
| Jeruk | buah | 47 |
| Mangga | buah | 60 |
| Pepaya | buah | 39 |
| Semangka | buah | 30 |
| Apel | buah | 52 |
| Teh manis | minuman | 40 |
| Kopi susu | minuman | 55 |
| Es jeruk | minuman | 45 |
| Jus alpukat | minuman | 90 |
| Kue lapis | snack | 220 |
| Risol | snack | 200 |
| Martabak manis | snack | 300 |
| Klepon | snack | 180 |
| Kerupuk | snack | 450 |

## Architecture Patterns

### Existing Backend Pattern (Controller-Service-Repository)
- Repository: `mysql2/promise` with parameterized queries, AppError wrapping
- Service: Business logic, validation, pure functions where possible
- Controller: Request/response handling, successResponse/errorResponse utilities
- Routes: Express Router with authenticateToken middleware

### Existing Frontend Pattern
- Feature-first: `src/features/{feature}/` with api/, components/, index.js
- API adapter: `apiFetch`, `apiGet`, `apiPost` from `shared/lib/http.js`
- Forms: React Hook Form + Zod validation
- i18n: `t()` function from `shared/i18n/translations.js`
- Routing: React Router with ProtectedRoute wrapper

## Integration Points

### Database (init.sql)
- Add `foods` table per D-30: `id, user_id NULL, name, calories_per_100g, category, is_custom BOOLEAN, created_at`
- Add `food_logs` table per D-33: `id, user_id, food_id NULL, custom_food_name NULL, calories, portion_grams, log_date, meal_type ENUM, created_at`
- Seed INSERT statements for 100+ foods

### Backend API
- New route file: `backend/src/routes/food.routes.js`
- New controller: `backend/src/controllers/food.controller.js`
- New service: `backend/src/services/food.service.js`
- New repository: `backend/src/repositories/food.repository.js`
- Register in `app.js`: `app.use('/api/food', foodRoutes)` and `app.use('/api/food-log', foodLogRoutes)`

### Frontend
- New feature directory: `frontend/src/features/food-log/`
- Components: FoodSearch, FoodLogTable, CalorieSummary, CustomFoodForm, CalorieHistory
- API adapter: `frontend/src/features/food-log/api/foodLogApi.js`
- Route: `/food-log` in Router.jsx (per D-34)

## Common Pitfalls

### Search Performance
- Use `LIKE '%query%'` with LIMIT for search-as-you-type (D-35)
- Add debounce (300ms) on frontend to reduce API calls
- Index the `name` column for faster LIKE queries

### Calorie Calculation
- Store `calories_per_100g` in foods table, calculate actual calories from `portion_grams`
- Formula: `calories = (calories_per_100g * portion_grams) / 100`
- For custom foods, store total calories directly (user defines their own portion)

### Date Handling
- Use `DATE` type for `log_date` (not DATETIME)
- Default to today's date when logging
- History queries group by `log_date`

### TDEE Target Lookup
- Call existing `/api/profile` endpoint to get `calorieTarget` for balance calculation
- Or add a lightweight `/api/food-log/summary` endpoint that joins profile + food_logs

## Security Considerations

- Food search: rate limit to prevent abuse (existing /api/ limiter applies)
- Custom food creation: validate name length, calorie range (0-5000 kcal/100g)
- Food logs: user-scoped queries only (WHERE user_id = ?)
- No PII in food tables — low-risk data
