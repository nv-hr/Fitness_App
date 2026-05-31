# Project Research Summary

**Project:** Fitness_App — v1.4 LLM-Powered Daily Meal Recommendations
**Domain:** Health & Fitness — AI-Assisted Meal Planning with Calorie Tracking
**Researched:** 2026-05-31
**Confidence:** HIGH

## Executive Summary

This research confirms that Fitness_App's v1.4 LLM meal recommendation feature can be built **with zero net-new technology additions** — the existing React + Express + Supabase PostgreSQL + OpenRouter LLM stack handles everything. The feature follows the exact architectural pattern established in v1.3's activity planning (weeklyPlan controller → llm.service → prompt files → caching → rate limiting) with three additions: a new `meal_plans` database table mirroring `weekly_plans`, a batch food-logging endpoint for one-click log, and domain-specific prompt engineering constraining the LLM to ingredients from the existing 200+ food database.

**The key technical challenge is not the stack — it's prompt reliability.** Free-tier LLMs hallucinate food names, miscalculate calories, and can overflow context windows with 200 ingredients. The research recommends a layered defense: (1) aggressive prompt constraints with few-shot examples, (2) a validation pipeline that fuzzy-matches LLM output against the database and removes unmatchable items rather than failing the whole plan, (3) server-authoritative calorie recalculation that overrides LLM arithmetic, and (4) a template-based fallback plan for when the LLM fails entirely. The batch logging endpoint must use explicit PostgreSQL transactions (BEGIN/COMMIT/ROLLBACK) to prevent partial logs from corrupting the food diary.

**The primary risk is that free-tier OpenRouter models produce low-quality plans, making the feature appear broken.** Mitigations include a 2-attempt correction loop, always showing something via fallback, and documenting that paid models (configurable via `LLM_MODEL` env var) dramatically improve quality. Scope is tightly constrained: ingredient-level recommendations only (no recipes), calories-only display (no macros), no dietary restriction tracking, and no meal plan favorites or editing.

## Key Findings

### Recommended Stack

**No new technologies or packages are required.** The v1.4 feature extends the existing stack exactly as configured. All changes are new files following established patterns (weeklyPlan feature) or minor method additions to existing repositories.

**Core stack (unchanged):**

| Technology | Version | Purpose | Why Correct |
|------------|---------|---------|-------------|
| React | 19 | Frontend | Meal plan components follow same patterns |
| Vite | 8 | Build tool | Already configured |
| TanStack React Query | latest | Data fetching | Already in project |
| Express | 5 | Backend API | New routes follow weeklyPlan pattern |
| Supabase PostgreSQL | 17 | Database | New `meal_plans` table matches existing pattern |
| pg | latest | DB driver | Repository pattern continues |
| OpenRouter (OpenAI SDK) | latest | LLM provider | Already integrated, meal plans use same client |
| node-cache | latest | In-memory caching | Same cache instance, separate keys for meal plans |
| express-rate-limit | latest | Rate limiting | New limiter follows same pattern |

**What changes (files):** ~15 new files across backend (controller, service, repository, routes, middleware, prompts, migration) and frontend (feature directory with page, cards, meal rows, API client, empty/fallback states). Modifications to 2 existing files (`app.js` route registration, `food.repository.js` batch insert method). See [ARCHITECTURE.md](./ARCHITECTURE.md#new-components) for full inventory.

**LLM Model:**
- Primary: Existing `LLM_MODEL` env var (same free-tier model as activity plans)
- Fallback: Existing `LLM_FALLBACK_MODEL` env var
- Temperature: 0.2 (same as activity plans — deterministic JSON)
- Max tokens: 2000 (sufficient for 7 days × 4 meals)
- **Key difference:** Meal plan prompts carry ~200 food entries as context (~10K chars of ingredients alone), which may stress small-context free models

### Expected Features

**Must have (table stakes):**
- **Calorie-targeted meals** — whole point of the feature, meals must fit within daily target (80-120% tolerance)
- **Real ingredients only** — LLM constrained to 200+ DB foods, no hallucinated "unicorn" ingredients
- **Reasonable portions** — validate per food category (carbs 50-300g, proteins 50-250g, etc.)
- **Meal variety across week** — prompt constraint + category diversity check prevents same meals daily
- **One-click log to food tracker** — batch transaction endpoint that inserts 4-8 food_log entries atomically
- **View today's meals** — quick glance at what to eat, current day default-expanded
- **Regenerate a day** — user can replace any single day's suggestions

**Should have (differentiators):**
- **Ingredient-exclusive generation** — moat that no generic meal planner has; only uses REAL tracked ingredients from user's database
- **Fitness-goal-aware portions** — lose weight → restricted carb portions; gain weight → more generous
- **Per-meal partial logging** — log just breakfast without committing to whole day
- **Already-logged tracking** — visual check marks on items already in food_logs
- **Fallback plan (no-LLM mode)** — template-based ingredient distribution works even when API is down

**Defer (v1.5+):**
- Favorite meals / meal templates — not core, adds DB complexity
- Manual meal plan editing — would need custom UI, out of scope for v1.4
- Recipe-style multi-ingredient dishes — ingredient level is the constraint, scope expansion
- Grocery / shopping list generation — different use case, not a shopping app
- Macro breakdowns (protein/carbs/fat) — calories-only per PROJECT.md
- Dietary preference/allergy tracking — no profile fields exist, scope creep

### Architecture Approach

The architecture is a **direct copy of the v1.3 weeklyPlan pattern** with meal-specific adaptations. The feature is **not a new service** — it extends the existing `llm.service.js` primitives (prompt building, LLM calling, caching, Levenshtein matching) via a new `mealPlan.service.js` that orchestrates generation, validation, correction, and fallback.

**Major components:**

1. **Meal Plan Service** (`mealPlan.service.js`) — **Highest complexity.** Orchestrates entire generation pipeline: fetches user profile + food DB + recent eating history, builds prompt with full ingredient list, calls LLM with prompt, validates structural integrity (dates, meal types, portions), runs fuzzy-match post-processing against DB foods to fix hallucinated names, server-recalculates all calories, runs correction loop (max 2 attempts) on failures, and falls back to template-based plan if LLM fails entirely

2. **Validation Pipeline** (within mealPlan service) — Two-phase: `validateMealPlanStructure()` checks dates, meal types, portions, calorie ranges; `validateAndFixMealPlan()` fuzzy-matches each food name against DB (exact → case-insensitive → substring → Levenshtein ≤ 3 → remove if no match) and recalculates all calories server-side. **Crucial design choice: remove unmatchable items rather than failing the whole plan.**

3. **Batch Log Endpoint** (`POST /api/meal-plans/log-day`) — Takes `weekStart`, `dayIndex`, optional `mealType`. Runs inside explicit PostgreSQL transaction: insert 4-8 food_log rows, then mark items as `logged: true` in plan_data JSONB. Supports per-meal logging (`mealType: "lunch"`) and full-day logging (`mealType: null`). Skipping of already-logged items for idempotency.

4. **Template Fallback Generator** — When LLM fails, distributes 6-8 random diverse ingredients (2 proteins, 2 carbs, 2 vegetables, 1 fruit, 1 dairy) across 4 meals with portions calculated to hit calorie target. Always returns something.

5. **Rate Limiting Middleware** — Three separate limiters per user: generate (5/15min), regenerate (3/30min), log-day (30/15min). Reuses the existing `express-rate-limit` configuration pattern.

6. **Frontend Components** — Page with state machine (loading → empty → generating → active plan → fallback), day cards (expandable, current day default), meal rows, regenerate button, log-this-day / log-this-meal buttons. Empty state + fallback banner reuse v1.3 patterns.

### Critical Pitfalls

1. **LLM hallucinates food names not in database** — The #1 reliability issue. Free-tier LLMs ignore ingredient constraints and suggest quinoa, tofu, or "grilled chicken recipe" when the DB only has "chicken breast." **Prevention:** Aggressive prompt constraint language with delimiters, fuzzy-matching post-processing that removes (not fails) unmatchable items, Levenshtein distance matching up to 3 edits, and graceful degradation that returns a plan with warnings rather than falling back entirely.

2. **Calorie miscalculation from LLM arithmetic errors** — LLMs are notoriously bad at math. They miscalculate `(cal_per_100g × portion) / 100` consistently. **Prevention: Server-authoritative recalculation always wins.** The LLM suggests portions; the server recalculates every calorie using DB values. If discrepancy > 20kcal, the server value overrides. Total daily targets are validated against server-recalculated totals, not LLM values.

3. **Transaction failure during batch log** — Inserting 4-8 food_log rows without wrapping in a transaction risks partial commits if row 5 fails a FK constraint. **Prevention:** Explicit `BEGIN/COMMIT/ROLLBACK` with client connection. Mark items as logged in plan_data only after COMMIT succeeds. Idempotency check skips already-logged items on retry.

4. **Prompt token overflow with 200+ ingredients** — Free-tier models like `nvidia/nemotron-3-nano` may have 4K-8K context limits. 200 foods × ~60 chars + profile + instructions + format spec + examples ≈ 5K tokens. **Prevention:** Measure token count before sending, truncate food list to 150 items if over threshold (prioritize custom foods + seeded favorites), prefer models with 8K+ context for meal generation, use one example day instead of full week format.

5. **Free-tier model quality degradation** — Same constraint as activity plans. Free models produce repetitive menus and ignore nuance. **Prevention:** 2-attempt correction loop catches structural issues, template fallback is nutritionally reasonable, document that `LLM_MODEL` env var can be set to a paid model for better quality.

## Implications for Roadmap

Based on the architecture's dependency graph and risk profile, suggested phases:

### Phase 1: Infrastructure (DB Migration + Prompt Files)

**Rationale:** Zero dependency on other components. Must exist before any backend logic. Low risk — follows established patterns.

**Delivers:**
- `meal_plans` table (mirrors `weekly_plans`: user_id, week_start, plan_data JSONB, status, timestamps; UNIQUE(user_id, week_start))
- `backend/db/add_meal_plans.sql` migration (idempotent, follows existing format)
- `backend/prompts/meal-plan-prompt.md` — full system prompt with role, constraints, format, few-shot example
- `backend/prompts/meal-correction-prompt.md` — correction prompt for validation failures

**Avoids:** Token overflow (#4) — prompt engineering done early, iterated before code freeze.

### Phase 2: Core Meal Plan Service (Generation + Validation)

**Rationale:** Highest-risk item. Must be built and validated independently before controllers or frontend depend on it. This is where all the prompt engineering, fuzzy matching, calorie recalculation, and fallback logic lives.

**Delivers:**
- `mealPlan.service.js` — orchestrates: fetch profile + foods + eating history → build prompt → callLLM → validate structure → fuzzy-match foods → recalculate calories → correct or fallback
- Validation functions: `validateMealPlanStructure()`, `validateAndFixMealPlan()`, `fuzzyMatchFoodName()`, `generateFallbackMealPlan()`
- `mealPlan.repository.js` — CRUD for meal_plans table
- Independent CLI/script testing of LLM prompt quality (10+ test prompts before integration)

**Addresses FEATURES.md:** Calorie-targeted meals (#1), Real ingredients (#2), Meal variety (#3), Reasonable portions (#3), Fallback plan (#5)
**Avoids:** Food name hallucination (#1), Calorie miscalculation (#2), Token overflow (#4), Model quality (#8)

**Research flag:** Phase 2 needs a validation spike — run 20+ prompts against the free-tier model to measure hallucination rate and token consumption. Adjust prompt engineering accordingly before moving to Phase 3.

### Phase 3: Batch Log Integration (One-Click Log)

**Rationale:** Small scope, independent after Phase 1 and the food repository extension. Can be built in parallel with Phase 2 if desired, but sequenced here because the service layer comes first.

**Delivers:**
- `batchLogItems()` method in `food.repository.js` — transactional batch insert with BEGIN/COMMIT/ROLLBACK
- `markItemsLogged()` method in `mealPlan.repository.js` — updates plan_data JSONB
- `POST /api/meal-plans/log-day` endpoint logic (full-day and per-meal variants)

**Addresses FEATURES.md:** One-click log day (#5, table stakes), Per-meal partial logging (#4, differentiator), Already-logged tracking (#5, differentiator)
**Avoids:** Transaction failure (#3), Double-logging (#6)

### Phase 4: Backend API Layer (Controller + Routes + Rate Limiting)

**Rationale:** Thin layer after Phase 2 and Phase 3 are built. Mostly boilerplate — follows exact weeklyPlan pattern.

**Delivers:**
- `mealPlan.controller.js` — GET (fetch plan), POST (generate), POST (regenerate-day), POST (log-day)
- `mealPlan.routes.js` — route definitions with rate limiter attachment
- `mealPlanRateLimiter.js` — 3 separate limiters: generate (5/15min), regenerate (3/30min), log-day (30/15min)
- `app.js` update — `app.use('/api/meal-plans', mealPlanRoutes)` (one line)

**Avoids:** Rate limiting blocks legitimate use (#5)

**Research flag:** None — well-documented weeklyPlan pattern, skip research-phase.

### Phase 5: Frontend (Components + API + Integration)

**Rationale:** Depends on Phase 4 (backend routes must exist for the API client). Pure UI work following existing patterns.

**Delivers:**
- `frontend/src/features/meal-plan/` — full feature directory with barrel export
- `MealPlanPage.jsx` — main page with state machine (loading/empty/generating/active/fallback/error)
- `DayMealCard.jsx` — expandable day card, current day default-expanded
- `MealRow.jsx` — individual meal item with log status checkmarks
- `EmptyStateMealPlan.jsx` + `FallbackBanner.jsx` — reuse v1.3 patterns
- `mealPlanApi.js` — API client (fetch, generate, regenerate-day, log-day, log-meal)
- Reusable `RateLimitedButton.jsx` — extracted from weekly-plan to shared directory
- Router update — `/meal-plan` route added

**Addresses FEATURES.md:** View today's meals (#6), Regenerate a day (#7), Already-logged visual indicators (#8)
**Avoids:** Double-logging UI race (#6) — immediate state update before server response

### Phase 6: Testing & Edge Cases

**Rationale:** Validates everything from Phase 2-5. Can begin once backend API layer (Phase 4) is stable.

**Delivers:**
- Backend tests (Jest, ~20 tests): service validation, fuzzy matching edge cases, transaction rollback, calorie recalculation, fallback plan generation, rate limiter behavior
- Frontend tests (Vitest, ~10 tests): component rendering, state machine transitions, log-day button behavior, empty states
- Manual testing: 5-10 real LLM generations to verify prompt quality in production-like conditions

**Avoids:** All pitfalls — this is the safety net.

### Phase Ordering Rationale

- **Phase 1 → 2 → 4 → 5** is the dependency chain: infrastructure before logic, service before API, API before frontend
- **Phase 3 (batch log)** sequenced after Phase 1 but technically independent of Phase 2 — could start earlier if desired
- **Phase 2 (core service) is the riskiest and should be started first** — it has the most unknowns (prompt quality, token usage, fuzzy matching edge cases). Validating this early prevents wasted work on 5 other phases
- **Phase 6 (tests)** covers all previous phases; integration tests are most valuable for the batch transaction (Phase 3) and the service validation pipeline (Phase 2)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core service):** Needs a prompt QA spike — run 20+ prompts against current LLM model, measure hallucination rate, token consumption, and constraint adherence. Tune prompt delimiters and few-shot examples based on results. The fuzzy matching threshold (Levenshtein distance limit) needs empirical validation against food name diversity.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Infrastructure):** DB migration follows v1.3 pattern exactly; prompt files are new but the format is established
- **Phase 4 (API layer):** Direct copy of weeklyPlan controllers/routes/rate-limiters — well-documented pattern
- **Phase 5 (Frontend):** Direct copy of weekly-plan UI pattern with meal-specific content variants
- **Phase 6 (Testing):** Standard testing patterns already established in codebase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against existing codebase. Zero new packages needed. All technologies already in use. |
| Features | HIGH | Scoped tightly to PROJECT.md constraints ("calories only," "ingredient-level"). Validated against existing weekly-plan UX patterns. NutriGen academic research and CARE v2.0 paper provide medium-confidence validation of prompt patterns. |
| Architecture | HIGH | Direct copy of v1.3's weeklyPlan architecture — the most validated architectural pattern in the codebase. The one-click-log integration extends existing food.repository.js patterns. Prompt engineering follows established system-prompt.md structure. |
| Pitfalls | HIGH | Food hallucination, calorie miscalculation, and transaction failures are well-documented industry problems with clear mitigations. Token overflow is model-specific and measurable. Rate limiting and idempotency patterns are already battle-tested in v1.3. |

**Overall confidence:** HIGH

The research is based primarily on the existing codebase (HIGH confidence sources) rather than external conjecture. The feature's architecture is a deliberate pattern copy of a proven v1.3 implementation. The key risk — LLM output quality — is well-documented with layered mitigations.

### Gaps to Address

- **Prompt quality with the actual free-tier model:** The research assumes the v1.3 LLM model handles the larger prompt (200+ foods). This MUST be validated early in Phase 2 with real prompts. If rejection rate exceeds 30%, consider upgrading to `gpt-4o-mini` for meal plan generation only.
- **Fuzzy matching threshold:** Levenshtein distance of ≤ 3 is the starting recommendation but needs tuning against actual LLM output during Phase 2 development. Some food names differ by more than 3 characters (e.g., "chicken breast" vs "grilled chicken").
- **Token count measurement:** The research estimates ~5K tokens but this should be measured programmatically. If actual usage exceeds model limits, implement the food list truncation strategy (top 150 items, always include custom foods).
- **Dietary restrictions awareness:** Deliberately deferred from v1.4 scope. The feature should gracefully handle cases where a user's available foods are all vegetables (vegetarian by constraint) but cannot actively prevent meat recommendations for a vegetarian. Document this as a known limitation.

## Sources

### Primary (HIGH confidence)
- **Existing codebase:** weeklyPlan.controller.js, llm.service.js, food.repository.js, food.controller.js, weeklyPlanRateLimiter.js — all v1.3 patterns directly applicable
- **OpenRouter structured outputs docs:** https://openrouter.ai/docs/guides/features/structured-outputs — prompt engineering and JSON mode
- **OpenRouter rate limiting:** https://openrouter.ai/docs/guides/limits — rate limit pattern confirmation
- **PostgreSQL transaction docs:** https://www.postgresql.org/docs/17/tutorial-transactions.html — BEGIN/COMMIT/ROLLBACK patterns

### Secondary (MEDIUM confidence)
- **NutriGen (LLM meal plan research):** https://arxiv.org/html/2502.20601v1 — validates constraint-check-after-generation pattern and prompt engineering approach
- **CARE v2.0 constraint verification:** https://www.mdpi.com/2304-8158/15/10/1647 — validates the server-side validation-after-LLM-generation pattern
- **LangChain + Zod structured output pattern:** https://www.wellally.tech/blog/build-ai-meal-planner-nextjs-langchain — validates the approach of constraining LLM output to a fixed food list

### Tertiary (LOW confidence)
- **Meal.io architecture:** https://dev.to/youssef_ahmed/mealio-ai-weekly-meal-planner-2mab — single dev project but same stack (React + Express + LLM), confirms architecture direction

---
*Research completed: 2026-05-31*
*Ready for roadmap: yes*
