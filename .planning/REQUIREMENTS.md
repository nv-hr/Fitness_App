# Requirements

> Milestone: v1.4 LLM Food Recommendations
> Last updated: 2026-05-31

## REQ-MEAL-GENERATE — Full-week meal plan generation
LLM generates a full week of simple meals (breakfast, lunch, dinner, snacks) using ONLY ingredients from the existing food database. Portions are auto-calculated to meet the user's daily calorie target (80-120% tolerance). User triggers generation, gets 7 days at once.

## REQ-MEAL-VIEW — Day-by-day meal plan view
Users can view their generated meal plan day-by-day. Each day shows 3-4 meal rows with ingredient name, portion (grams), and calories. Current day is expanded by default. Uses the same page/state-machine pattern as activity plans.

## REQ-MEAL-LOG — One-click food diary logging
Users can log all recommended ingredients for a day (or a single meal) to their food diary with one click. Runs as an atomic PostgreSQL transaction to prevent partial commits. Server recalculates calories from stored `calories_per_100g × portion / 100` — never trusts LLM-computed values.

## REQ-MEAL-REGENERATE — Regenerate a single day
Users can replace any single day's meal suggestions without regenerating the whole week. Rate-limited separately from full generation (3/30min).

## REQ-MEAL-FALLBACK — Template-based fallback plan
When the LLM is unreachable or fails, the system generates a template-based fallback: 6-8 random diverse ingredients (2 proteins, 2 carbs, 2 vegetables, 1 fruit, 1 dairy) distributed across 4 meals. Portions are calculated to hit the calorie target. Always returns something, never shows an error to the user.

## REQ-MEAL-PERMEAL — Per-meal partial logging
Users can log a single meal (e.g., just "breakfast") without committing the entire day. The same atomic transaction pattern applies to the subset of items.

## REQ-MEAL-INDICATORS — Already-logged visual indicators
Food items already logged to today's food diary show a visual checkmark in the meal plan view. Color-coded: green for logged, gray for not logged.

## REQ-MEAL-RATELIMIT — Rate limiting
Meal plan generation is rate-limited to 5 requests per 15 minutes per user (matching activity plans). Day regeneration: 3 per 30 minutes. Log-day: 30 per 15 minutes.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-MEAL-GENERATE | Phase 19: Core Meal Plan Service | Pending |
| REQ-MEAL-VIEW | Phase 22: Meal Plan Frontend | Pending |
| REQ-MEAL-LOG | Phase 20: Batch Log Integration | Pending |
| REQ-MEAL-REGENERATE | Phase 19: Core Meal Plan Service | Pending |
| REQ-MEAL-FALLBACK | Phase 19: Core Meal Plan Service | Pending |
| REQ-MEAL-PERMEAL | Phase 20: Batch Log Integration | Pending |
| REQ-MEAL-INDICATORS | Phase 22: Meal Plan Frontend | Pending |
| REQ-MEAL-RATELIMIT | Phase 21: Backend API Layer | Pending |
