# Technology Stack — LLM Food Recommendations

**Project:** Fitness_App — v1.4 LLM Food Recommendations
**Researched:** 2026-05-31

## Stack Decision: No New Technology Added

The v1.4 feature uses the **existing stack** exclusively. No new languages, databases, or external services are introduced.

## Current Stack (Unchanged)

| Technology | Version | Purpose | Why Still Correct |
|------------|---------|---------|-------------------|
| React | 19 | Frontend UI | Meal plan components follow same patterns |
| Vite | 8 | Build tool | Already configured, no changes needed |
| TanStack React Query | latest | Data fetching | Already in project |
| Express | 5 | Backend API | New routes follow weeklyPlan pattern |
| Supabase PostgreSQL | 17 | Database | New `meal_plans` table schema matches existing |
| pg | latest | DB driver | Repository pattern continues |
| OpenRouter (OpenAI SDK) | latest | LLM provider | Already integrated, meal plans use same client |
| node-cache | latest | In-memory caching | Same cache as activity plans, separate keys |
| express-rate-limit | latest | Rate limiting | New limiter follows same pattern |
| Helmet | latest | Security headers | Unchanged |
| morgan | latest | Request logging | Unchanged |
| compression | latest | Gzip | Unchanged |
| Jest | latest | Backend testing | Tests follow existing patterns |
| Vitest | latest | Frontend testing | Tests follow existing patterns |

## What Changes

| Component | Change | Rationale |
|-----------|--------|-----------|
| `backend/src/services/` | NEW: `mealPlan.service.js` | Keeps food LLM logic separate from activity LLM logic |
| `backend/src/repositories/` | NEW: `mealPlan.repository.js` | CRUD for new `meal_plans` table |
| `backend/src/repositories/food.repository.js` | MODIFIED: add `batchLogItems()` | One new method for batch logging |
| `backend/src/controllers/` | NEW: `mealPlan.controller.js` | Follows `weeklyPlan.controller.js` |
| `backend/src/routes/` | NEW: `mealPlan.routes.js` | Follows `weeklyPlan.routes.js` |
| `backend/src/middlewares/` | NEW: `mealPlanRateLimiter.js` | Follows `weeklyPlanRateLimiter.js` |
| `backend/src/app.js` | MODIFIED: add meal-plans route | One line |
| `backend/prompts/` | NEW: `meal-plan-prompt.md`, `meal-correction-prompt.md` | Domain-specific prompts |
| `backend/db/` | NEW: `add_meal_plans.sql` | Migration |
| `frontend/src/features/` | NEW: `meal-plan/` | Follows `weekly-plan/` structure |
| `frontend/src/app/Router.jsx` | MODIFIED: add meal-plan route | One route entry |

## LLM Model Selection

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Primary model | Same as `LLM_MODEL` env var | No change — free-tier model |
| Fallback model | Same as `LLM_FALLBACK_MODEL` env var | No change |
| Temperature | 0.2 | Same as activity plans — low temp for deterministic JSON |
| Max tokens | 2000 | Sufficient for 7-day meal plan (4 meals × 7 days) |

**Key difference from activity plans:** Meal plan generation requires the LLM to process the full ingredient database (200+ items) as context, which increases prompt token count. At ~200 foods × ~50 chars each = ~10K chars of ingredients alone, plus profile and instructions. Free-tier models with small context windows may struggle — but this is already the existing constraint.

## Alternatives Considered

| Approach | Why Not | What We Do Instead |
|----------|---------|-------------------|
| Recipe generation (complex dishes) | Out of scope — ingredient-level only | Recommend individual ingredient items, not recipes |
| Vector search for food retrieval | Overengineering at 200 ingredients | Pass full list in prompt context |
| External meal API (Spoonacular, Edamam) | Would require API key, cost, and integration | Use existing OpenRouter + food DB |
| Separate LLM microservice | Added deployment complexity | Extend llm.service.js patterns |
| Prisma/Drizzle ORM | Would require migration from raw SQL | Continue repository pattern |
| Supabase RLS | Server-side-only architecture | No change needed |

## Installation

No new npm packages. The batch log endpoint uses the existing `pg` connection via `pool.query()` inside a transaction:

```javascript
// Inside food.repository.js — new method
export async function batchLogItems(userId, items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const logged = [];
    for (const item of items) {
      const { rows } = await client.query(
        `INSERT INTO food_logs (...)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, ...]
      );
      logged.push(rows[0]);
    }
    await client.query('COMMIT');
    return logged;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

## Sources

- **Existing codebase files** — HIGH confidence
- **OpenRouter structured outputs docs** — https://openrouter.ai/docs/guides/features/structured-outputs — HIGH confidence
- **OpenRouter rate limiting** — https://openrouter.ai/docs/guides/limits — HIGH confidence
