# Domain Pitfalls — LLM Food Recommendations

**Domain:** Fitness App — LLM-Powered Meal Planning & Logging
**Researched:** 2026-05-31

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: LLM Hallucinates Food Names Not in Database

**What goes wrong:** The LLM generates meal items with ingredient names that don't exist in the `foods` table. "Grilled chicken breast with quinoa and roasted vegetables" — quinoa is not in the seeded DB. The validation rejects these, the correction prompt may fail too, and the fallback fires unnecessarily.

**Why it happens:** Free-tier LLMs have strong culinary training. When you say "use ONLY these 202 ingredients," the model still wants to suggest complete recipes. It's fighting its training.

**Consequences:** High rejection rate → constant fallback plans → users never see real LLM-generated plans. Feature appears broken.

**Prevention:**
1. **Prompt engineering:** Put the constraint early and aggressively. Use delimiters:
   ```
   CRITICAL: You MUST select ingredients ONLY from the list below.
   Any ingredient not in this list will be REJECTED.
   ```
2. **Few-shot examples** in the prompt showing the exact input→output mapping
3. **Fuzzy matching post-processing** — the `validateAndFixMealPlan()` function must handle:
   - Exact match → ✓
   - Case-insensitive match → ✓  
   - Substring match (LLM says "chicken" but DB has "chicken breast") → fix with warning
   - Levenshtein distance ≤ 3 → fix with warning
   - No match → REMOVE the item, don't fail the whole plan
4. **Graceful degradation:** If 10% of items don't match, remove them and recalculate daily total. Return the plan with warnings rather than falling back entirely.

**Detection:**
- Monitor `fuzzyMatchFoodName()` logs for match type distribution
- Track percentage of LLM-suggested items that require fuzzy matching vs exact match

### Pitfall 2: Calorie Miscalculation From LLM vs Server

**What goes wrong:** The LLM computes calories incorrectly. It might: (a) calculate `(cal_per_100g × portion) / 100` wrong, (b) use wrong cal_per_100g value, (c) forget to round.

**Why it happens:** LLMs are bad at arithmetic, especially with many items across 7 days.

**Consequences:** Daily totals displayed to users don't match what gets logged. One-click log inserts wrong calorie values into food_logs.

**Prevention:**
1. **Server-authoritative calorie calculation** — LLM suggests portions, server recalculates calories:
   ```javascript
   // In validateAndFixMealPlan, for each item:
   const food = dbFoods.find(f => f.id === item.food_id);
   const serverCalories = Math.round((food.calories_per_100g * item.portion_grams) / 100);
   // If discrepancy > 10%, log warning and use server value
   if (Math.abs(item.calories - serverCalories) > 20) {
     item.calories = serverCalories;
   }
   ```
2. **Prompt the LLM to include calories as guidance only** — tell it the server will recalculate
3. **Validate total daily calories against target** — use server recalculated values, not LLM values

### Pitfall 3: Transaction Failure Mid-Batch Log

**What goes wrong:** The one-click log endpoint inserts 8 food_log rows. Row 5 fails (FK constraint). Rows 1-4 are already committed. User sees partial log and inconsistent state.

**Why it happens:** Without transaction wrapping, each INSERT is auto-committed by PostgreSQL.

**Consequences:** Corrupted food log — some meals logged, some not. Calorie summary wrong.

**Prevention:**
1. **Always use BEGIN/COMMIT/ROLLBACK** for batch logging:
   ```javascript
   const client = await pool.connect();
   try {
     await client.query('BEGIN');
     // ... all inserts ...
     await client.query('COMMIT');
   } catch (err) {
     await client.query('ROLLBACK');
     throw err;
   } finally {
     client.release();
   }
   ```
2. **Don't mark items as "logged" in plan_data until after COMMIT**
3. **Idempotency**: If the same request is sent twice (frontend retry), skip already-logged items

### Pitfall 4: Prompt Token Overflow With 200+ Ingredients

**What goes wrong:** The full food list + user profile + instructions + few-shot examples exceeds the free-tier model's context window. The LLM truncates the input silently, losing ingredients or instructions.

**Why it happens:** 200 foods × ~60 chars each = ~12K chars. Plus profile (500), instructions (2K), format spec (1K), correction history (1K) = ~17K chars ≈ 4-5K tokens. Free models like `nvidia/nemotron-3-nano` may have 4K-8K context limits.

**Consequences:** LLM doesn't see all ingredients, recommends from partial list. Or ignores constraints.

**Prevention:**
1. **Check model context limits** via OpenRouter model API before sending
2. **Truncate food list** — don't send 200 ingredients. Strategy:
   - Send ALL seeded foods by category, but limit to longest 150 if needed
   - Always include user's custom foods (they added them, likely to use them)
   - Track token count of prompt, truncate food list if over threshold
3. **Consider using `openai/gpt-4o-mini`** (128K context) for meal plans specifically, falling back to free model for regular use
4. **Fewer examples** — use one example day instead of a full week
5. **Monitor token usage** — log prompt_tokens and completion_tokens from OpenRouter response

## Moderate Pitfalls

### Pitfall 5: Rate Limiting Blocks Legitimate Use

**What goes wrong:** User generates a meal plan for the week, then wants to change one day. The regenerate-day rate limiter (3/30min) counts against the same user. But the user also wants to log meals — the log-day endpoint hits a different limiter (30/15min).

**Why it happens:** Multiple rate limiters per user without coordination.

**Prevention:**
- Keep rate limiters separate (generate: 5/15min, regenerate: 3/30min, log-day: 30/15min)
- Clear cache on rate limit hit so next valid request works fresh
- Frontend shows clear countdown timers (reuse RateLimitedButton)

### Pitfall 6: "Log This Day" Duplicates Entries

**What goes wrong:** User clicks "Log This Day," it succeeds but the UI doesn't update. User clicks again. Now food_logs has duplicate entries for the same meal items.

**Why it happens:** Race condition between UI update and server-side idempotency check.

**Prevention:**
1. **Mark items as `logged: true` in plan_data immediately after successful COMMIT**
2. **Server-side idempotency check** — skip items where `logged = true` in plan_data
3. **Return `already_logged` count** in response so frontend can show "3 items already logged"
4. **Frontend disables the button after first successful click** (immediate state update before server response)

### Pitfall 7: Dietary Restriction Blindness

**What goes wrong:** The LLM recommends steak for a vegetarian user, or milk for a lactose-intolerant user. The app has no data about dietary restrictions so it can't prevent this.

**Why it happens:** The `profiles` table has `fitness_goal` but no dietary restrictions field. The app doesn't track allergies or preferences.

**Prevention:**
- Document this as a known limitation in the feature
- The prompt can instruct meal diversity (different proteins each day) to avoid monotony
- Don't add dietary restriction fields to profiles in this milestone — scope creep
- If user custom-foods are all vegetables, the LLM will naturally select from their available pool

### Pitfall 8: Free-Tier Model Quality Degradation

**What goes wrong:** The free-tier OpenRouter model (`nvidia/nemotron-3-nano-30b-a3b:free`) generates low-quality meal plans — same meals every day, unrealistic combinations, ignores constraints.

**Why it happens:** Free models have reduced capability. This is the existing constraint (same model used for activity plans).

**Prevention:**
- The correction prompt loop catches structural issues (wrong dates, wrong meal types) but cannot fix "tastyness"
- Document model limitation — users can set `LLM_MODEL` env var to a paid model for better quality
- Fallback plan is at least nutritionally reasonable (template-based category distribution)

## Minor Pitfalls

### Pitfall 9: Timezone Mismatch on Meal Dates

Meal dates are stored as `DATE` (no timezone). User in UTC+14 generates a plan on their Monday. Server in UTC sees Sunday. The `getMonday()` function uses local time.

**Prevention:** Use the same `getMonday()` pattern from weeklyPlan.controller.js. All date logic is server-side. The weekStart is passed explicitly by the frontend or computed server-side.

### Pitfall 10: Large Plan Data in JSONB

7 days × 4 meals × up to 4 items + metadata = ~200+ JSON nodes stored per week. Over years of regeneration, the DB stores many rows. But at 1 plan/user/week, this is 52 rows/year/user. At 1000 users = 52K rows. JSONB handles this fine — no migration needed.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Prompt engineering | Hallucinated food names (#1) | Aggressive constraint language + fuzzy matching with item removal (not plan failure) |
| Meal plan generation | Token overflow with food list (#4) | Measure + truncate food list if needed; prefer models with 8K+ context |
| Calorie calculation | LLM arithmetic errors (#2) | Server-authoritative recalculation always overrides LLM values |
| Batch log endpoint | Transaction failures (#3) | Explicit BEGIN/COMMIT/ROLLBACK with client connection |
| One-click log UX | Double-logging (#6) | Server-side idempotency + immediate frontend state update |
| Model quality | Low-quality free-tier output (#8) | Document limitation; correction loop; template fallback |
| Rate limiting | Legitimate use blocked (#5) | Separate limiters per endpoint; clear countdown UX |

## Sources

- **Existing llm.service.js:** Fuzzy matching, fallback, retry patterns — HIGH confidence
- **Existing weeklyPlanRateLimiter.js:** Rate limiting patterns — HIGH confidence
- **Existing food.controller.js:** Validation, calorie calculation patterns — HIGH confidence
- **OpenRouter context limits:** https://openrouter.ai/docs/models — MEDIUM confidence (model-specific)
- **PostgreSQL transaction docs:** https://www.postgresql.org/docs/17/tutorial-transactions.html — HIGH confidence
- **NutriGen CALCULATION approach:** https://arxiv.org/html/2502.20601v1 — MEDIUM confidence
