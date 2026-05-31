# Feature Landscape — LLM Food Recommendations

**Domain:** Fitness App — LLM-Powered Meal Planning & Logging
**Researched:** 2026-05-31

## Table Stakes

Features users expect in any meal planning/calorie tracking app. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Calorie-targeted meals** | The whole point — meals should fit daily target | MEDIUM | Core LLM constraint in prompt. Must validate after generation |
| **Real ingredients** | Recommending "unicorn food" destroys trust | HIGH | LLM must be constrained to DB-only ingredients. Fuzzy matching is critical |
| **Reasonable portions** | "10000g of rice" is useless | MEDIUM | Validate portion_grams per category (carbs: 50-300g, proteins: 50-250g) |
| **Meal variety across week** | Same meals every day is boring | MEDIUM | Prompt constraint + category diversity check |
| **One-click log to tracker** | Without this, it's just a display feature | MEDIUM | Batch transaction endpoint. Mark items as logged |
| **View today's meals** | Quick glance at what to eat today | LOW | Day card default-expanded for current day |
| **Regenerate a day** | "I don't like this lunch suggestion" | MEDIUM | Same pattern as activity plan regeneration |

## Differentiators

Features that set this app apart. Built on top of existing functionality (200+ ingredient DB, accurate calorie tracking, existing profile).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Ingredient-exclusive generation** | Unlike generic meal planners that make up recipes, ours uses ONLY real tracked ingredients from the user's database | HIGH | Requires fuzzy matching post-processing. The 200+ seeded DB is the moat |
| **Existing calorie accuracy** | Recommendations integrate with existing TDEE calculation, not a separate calculator | LOW | Reuse `calculateTdee()` + `getCalorieTarget()` from profile.service.js |
| **Per-meal partial logging** | Log just the breakfast suggestions without committing to the whole day | MEDIUM | `logDay(mealType: "breakfast")` — logs only that meal's items |
| **Already-logged tracking** | Visual check marks on meal items that have been logged | LOW | `logged` boolean in plan_data JSONB |
| **Fallback plan** | Works without LLM (template-based distribution of ingredients) | MEDIUM | Same reliability pattern as activity plans |
| **Fitness-goal-aware portions** | Lose weight → carb portions restricted; Gain weight → more generous portions | LOW | Pass `fitnessGoal` into prompt + adjust validation thresholds |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Recipe generation (cooking steps, multi-ingredient dishes)** | Adds complexity (ingredient quantities in recipes), needs recipe DB, not core to calorie tracking | Recommend individual ingredient items (e.g., "chicken breast 200g" not "chicken stir fry recipe") |
| **Custom meal creation by LLM** | LLM could hallucinate ingredients or calorie values | Constrain to existing DB foods only. No free-text food creation |
| **Re-education / macro breakdowns** | Beyond calorie scope (PROJECT.md: "calories only" for v1.x) | Show calories only. Protein/carbs/fat tracking is v2+ |
| **Grocery list generation** | Not a shopping app — users track what they log | Defer to future milestone |
| **Auto-generated shopping list** | Same reason | Defer |
| **Dietary preference intake form** | Would require new profile fields and UI | Use existing `fitness_goal` (lose_weight/maintain/gain_weight) plus `calorie_rate` |
| **Recipe/meal sharing** | Social features out of scope | Core tracking only |
| **Meal plan favorites** | Adds DB + UI complexity for minimal value | Generate fresh weekly — regeneration handles "I want that again" |
| **Ingredient substitution suggestions** | Adds LLM calls for each swap, complex UX | Simple "regenerate day" replaces the meal entirely |

## Feature Dependencies

```
                    ┌──────────────────┐
                    │ User Profile     │── (fitness_goal, calorie_target)
                    │ Must exist       │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Food Database    │── (200+ seeded foods + custom)
                    │ Must be seeded   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ LLM Service      │── (OpenRouter key, prompt files)
                    │ Must be working  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐    ┌──────────────────┐
                    │ Generate Meal    │───►│ Validate + Fix    │
                    │ Plan (LLM)       │    │ (fuzzy match)     │
                    └────────┬─────────┘    └────────┬─────────┘
                             │                       │
                    ┌────────▼─────────┐    ┌────────▼─────────┐
                    │ Cache & Persist  │    │ Fallback Plan     │
                    │ (node-cache + DB)│    │ (template-based)  │
                    └────────┬─────────┘    └────────┬─────────┘
                             │                       │
                    ┌────────▼───────────────────────▼─────────┐
                    │ Display in UI (day cards with meals)     │
                    └────────┬─────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │ One-Click Log    │──► food_logs table
                    │ (batch insert)   │
                    └──────────────────┘
```

## MVP Recommendation

**Minimum shippable slice:** Generate, view, and log a single day's worth of meals.

### v1.4 MVP Scope

| Priority | Feature | Why MVP | Effort |
|----------|---------|---------|--------|
| 1 | **Generate 7-day meal plan** via LLM | Core functionality | High |
| 2 | **View plan as day cards** (expandable) | User can see suggestions | Medium |
| 3 | **One-click log day** (batch transaction) | Integration with existing food tracker | Medium |
| 4 | **Regenerate single day** | Accept/reject UX | Medium |
| 5 | **Fallback plan** (no-LLM mode) | Reliability | Medium |
| 6 | **Rate limiting + error states** | Production readiness | Low |
| 7 | **Per-meal partial logging** | Fine-grained control | Low |
| 8 | **Already-logged visual indicators** | UX polish | Low |

### Defer to v1.5+

| Feature | Reason |
|---------|--------|
| Favorite meals / meal templates | Not core, adds DB complexity |
| Manual meal plan editing | Would need custom UI, not just regenerate |
| Recipe-style multi-ingredient dishes | Scope expansion — ingredient level is the constraint |
| Shopping list | Different use case |

## Sources

- **PROJECT.md (existing):** Feature scope, "calories only", "ingredient-level" constraints — HIGH confidence
- **Existing weekly-plan feature (v1.3):** Regeneration, caching, rate-limit UX patterns — HIGH confidence
- **Existing food-log feature:** Logging validation, meal_type ENUM, portion limits — HIGH confidence
- **NutriGen research:** https://arxiv.org/html/2502.20601v1 — MEDIUM confidence on prompt patterns
- **CARE v2.0 constraint verification:** https://www.mdpi.com/2304-8158/15/10/1647 — MEDIUM confidence (validates the constraint-check-after-generation pattern)
