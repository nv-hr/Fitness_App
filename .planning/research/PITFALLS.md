# Domain Pitfalls — v1.5 Smart Auto-Logging

**Domain:** Fitness App — Auto-Logging, Page Merging, Daily Meal Generation
**Researched:** 2026-05-31
**Milestone:** v1.5 Smart Auto-Logging

---

## Critical Pitfalls

Mistakes that cause data corruption, infinite loops, or rewrites.

---

### Pitfall 1: Double-Logging on Every Page Visit / Refresh

**What goes wrong:** The "auto-generate plan on page visit if none exists" feature triggers generation every time the page loads. After generation succeeds, a naive auto-log implementation immediately logs all items to the activity log / food log. But generation is not the same as user intent — the user may not want today's generated plan auto-logged. Worse: on page refresh, the plan already exists (so generation doesn't retrigger) but there's no idempotency check on the auto-log. Result: every visit logs the same items again.

**Why it happens:** The v1.5 spec says "auto-save generated activity plan to activity log" and "auto-save generated meals to food log." It's ambiguous whether this means:
- (A) Auto-save automatically as part of generation → logs every time generation runs
- (B) Auto-save into the log area for user review before committing → pre-fills log UI
- (C) Generation auto-logs to DB but marks as "suggested" not "confirmed"

If the implementation picks (A) without idempotency, every generation → DB insert duplicate entries.

**Existing patterns that help:** The `mealPlan.controller.js` `logDay` handler already skips items where `item.logged === true`. The `markItemsLogged` function flips this flag after a successful transaction. BUT — if auto-log happens during generation (not via `logDay`), the `logged` flag never gets checked because there's no plan to check against yet.

**Consequences:** Food log / activity log fills with duplicates. Calorie summary inflates. User loses trust.

**Prevention:**
1. **Separate generation from logging** — generation creates plan data in `plan_data` JSONB with `logged: false` on every item. Logging is a separate explicit action (user clicks "Accept" or "Log"). Never auto-log to the actual `food_logs` / `activity_logs` tables during generation.
2. **"Auto-save" means pre-fill log UI, not insert DB rows** — the generated items appear in the merged Food Log page as pending/suggested entries with a "Log" toggle. User confirms before they become real DB entries.
3. **If true auto-log is required** (spec says "auto-save generated activity plan to activity log"), use a one-time flag: stamp a `logged_at` timestamp on the plan record. On subsequent page visits/refreshes, check if `plan.logged_at` exists before re-logging. Never re-log a plan that was already logged.
4. **Plan versioning** — bump a `plan_version` counter on regeneration. Logged items reference the plan version they came from. Prevents stale/duplicate logging of regenerated plans.

**Detection:** Monitor `activity_logs` and `food_logs` for duplicate entries with same `user_id`, same `activity_id`/`food_id`, same `logged_date`. Alert if >1 identical entry per user per day.

---

### Pitfall 2: Infinite Regeneration Loop When LLM Fails

**What goes wrong:** The "auto-generate plan on page visit if none exists" feature triggers `POST /api/weekly-plans/generate` on mount. If the LLM returns an error (rate-limited, quota exceeded, model down), the generation fails. The state remains "no plan exists." The component re-renders and triggers generation again. Repeat until rate limiter kicks in — but the rate limiter catches it after N requests, which might already be exhausted.

**Existing code:** `WeeklyPlanPage.jsx` lines 28-47 — the `loadPlan` effect runs on mount. If `plan` is null after load, the empty state renders with a manual "Generate" button (lines 148-158). That's good — but v1.5 changes this to auto-generate, which means the `handleGenerate` call moves into `loadPlan` or a separate effect. Now every mount triggers generation.

**Why it happens:** React's `useEffect` with missing/incorrect dependencies. If `loadPlan` → discovers no plan → calls `handleGenerate` → fails → state is still "no plan" → component re-renders → same effect fires again.

**Consequences:** Non-stop API calls. Rate limit quota exhausted in seconds. User sees blank page with spin-locked loading. Backend may crash under load if rate limiter is bypassed by many concurrent users.

**Prevention:**
1. **Add a "tried auto-generate" flag** to component state. Only auto-generate once per mount:
   ```jsx
   const [autoGenAttempted, setAutoGenAttempted] = useState(false);
   
   useEffect(() => {
     if (!plan && !autoGenAttempted && !loading) {
       setAutoGenAttempted(true);
       handleGenerate();
     }
   }, [plan, autoGenAttempted, loading]);
   ```
2. **Backend should return proper 429 with Retry-After** (already done in existing rate limiters). Frontend MUST respect Retry-After and not retry within the window.
3. **Distinguish "no plan exists" from "generation failed"** — after a failed auto-generation, show a manual "Retry" button, don't auto-retry.
4. **Use `useRef` for the auto-gen attempt** to avoid it being reset by re-renders (not just `useState`).

---

### Pitfall 3: LLM Slow Generation Blocks Page Rendering

**What goes wrong:** Auto-generate on page visit fires on mount. The LLM takes 10-30 seconds (free-tier models). The entire page is blocked in a loading state because generation hasn't resolved. User sees a spinner, can't interact with anything. The manual regenerate button (which should always be available) is blocked because the component is in a "generating" state.

**Existing patterns:** `WeeklyPlanPage.jsx` has `loading` (fetch plan) and `generating` (generation) as separate booleans. But when auto-generation fires on mount, both might be true. The component renders "Loading..." for the full duration.

**Why it happens:** The auto-generation sequence is: load plan (no plan found) → auto-generate → wait for LLM → render result. The "no plan yet" states don't differentiate between "we're generating" and "we're stuck."

**Consequences:** Users navigate away from the page thinking it's broken. High bounce rate. Mobile users kill the tab.

**Prevention:**
1. **Show the page shell immediately** — the auto-generation spinner should be inline (e.g., a banner: "Generating your plan...") not a full-page loader.
2. **Render the activity log/food log sections that don't depend on the plan** — in the merged page, the log history and manual entry form should render immediately while the plan section shows generating state.
3. **Set a generation timeout** (e.g., 30 seconds). If LLM hasn't responded, show the manual "Generate" button with a message: "Generation is taking longer than usual. Try again."
4. **Lazy-generate** — don't block the page. Fire generation in the background (`Promise` without `await` on render), update state when it resolves.

---

### Pitfall 4: Page Merge Breaks Existing Routing & Navigation

**What goes wrong:** Merging `/weekly-plan` into `/activities` and `/meal-plan` into `/food-log` means:
- Old routes must redirect (or 404 silently)
- Existing nav links on dashboard must change
- Backend routes may need consolidation
- Deep links from history/bookmarks break

**Existing routes (Router.jsx):**
```jsx
<Route path="/food-log" element={<FoodLogPage />} />     // stays
<Route path="/activities" element={<ActivitiesPage />} />  // stays
<Route path="/weekly-plan" element={<WeeklyPlanPage />} /> // removes
<Route path="/meal-plan" element={<MealPlanPage />} />     // removes
```

**Why it happens:** Simple deletion of routes without redirects. Users who bookmarked `/weekly-plan` get a blank 404. Old nav components still reference the removed routes.

**Consequences:** Navigation feels broken. Users lose access to plan features they rely on. Confusion because the plan functionality is now inside a different page with different UX.

**Prevention:**
1. **Add catch-all redirects** for removed routes:
   ```jsx
   <Route path="/weekly-plan" element={<Navigate to="/activities" replace />} />
   <Route path="/meal-plan" element={<Navigate to="/food-log" replace />} />
   ```
2. **Update ALL nav links** — check `Router.jsx` DashboardPlaceholder (lines 58-84). Both `/weekly-plan` and `/meal-plan` links must be removed/updated.
3. **Update any auth guard logic** — `ProfileGuard` is used on `/weekly-plan` and `/meal-plan` but not on `/activities` or `/food-log`. The merged page on `/activities` may need `ProfileGuard` if plan generation requires a profile.
4. **Check for stale imports** — `WeeklyPlanPage` and `MealPlanPage` components might be imported elsewhere (tests, feature index files). Clean up or they'll cause build errors.
5. **Test deep links** — manually verify that `example.com/activities?showPlan=true` or similar fragment-based navigation works.

---

### Pitfall 5: State Management Explosion in Merged Pages

**What goes wrong:** The Activities page currently has 6 state variables (recommendations, allActivities, summary, history, loading, error, successMsg, reshuffling, loggingActivity). The Weekly Plan page has 7 (plan, status, loading, error, generating, regeneratingDayIndex, genRetryAfter, dayRetryAfters). Merging gives 15+ state variables in one component. Adding inline "completed" toggle per activity adds more. The component becomes unmaintainable.

**Existing code:**
- `ActivitiesPage.jsx` — 9 state variables + 4 handlers + 3 effects (186 lines)
- `WeeklyPlanPage.jsx` — 7 state variables + 3 handlers + 1 effect (192 lines)
- Combined estimate: ~15-20 state variables, 7+ handlers, 400+ lines

**Why it happens:** Two full-page components are being merged into one. Each has its own data-fetching lifecycle, loading states, error handling, and user interactions. Naively combining them creates a God component.

**Consequences:** Hard to test. Easy to introduce state conflict (e.g., `loading` from activity fetch conflicts with `loading` from plan fetch). Both sections use `error` state — overwrites each other. Performance degradation from unnecessary re-renders.

**Prevention:**
1. **Keep them as separate sub-components** — don't merge the state. ActivitiesPage becomes a container that renders `<ActivityLogSection />` and `<ActivityPlanSection />` side by side. Each sub-component manages its own state independently.
2. **Use a dedicated section context** or lift minimal shared state (like `selectedDate`) to the parent. Keep data-fetching inside each section.
3. **Rename state variables to avoid collisions** — even with sub-components, be explicit: `planLoading` vs `logLoading`, `planError` vs `logError`.
4. **Consider a custom hook** — extract plan logic into `useActivityPlan()` and log logic into `useActivityLog()`. The container just composes the hooks.
5. **Same strategy for Food Log + Meal Plan merge** — `FoodLogPage` has 10+ state variables. `MealPlanPage` has 8+. Create `useMealPlan()` hook to keep the merged page clean.

---

### Pitfall 6: Partial-Log + Regenerate Creates Orphaned Data

**What goes wrong:** User has a generated meal plan for today. They "Log" breakfast (3 items → inserted into `food_logs`, marked `logged: true` in `plan_data`). Then they regenerate today's day (new LLM call). The regenerated day replaces the old day's items in `plan_data`. The previously logged breakfast items persist in `food_logs` (good — they're committed). But the regenerated day doesn't include lunch/dinner items that were in the old plan — the LLM generates a completely new set. User expected the logged breakfast to stay and the rest to be replaced, but now they see a new full day with breakfast/lunch/dinner regenerated. They might re-log breakfast items, creating duplicates.

**Existing patterns:** `regenerateDay` in `mealPlan.controller.js` calls the LLM service which returns a fresh day. The `mealPlan.service.js` replaces the day at `dayIndex`. The current implementation regenerates ALL meals for that day — it doesn't preserve logged meals.

**Why it happens:** The regenerate-day flow replaces the entire day's JSONB plan data. It doesn't check which items were already logged. The LLM generates a new, independent day.

**Consequences:**
- Logged items that were marked `logged: true` are wiped by the regenerated day (no longer showing as logged)
- User re-logs the same breakfast items → duplicates in `food_logs`
- Calorie counts inflate

**Prevention:**
1. **Preserve logged items across regeneration** — after the LLM returns a new day's plan, merge it: keep items with `logged: true` from the old day, add new items from the regenerated day, deduplicate by `food_id`.
2. **Flag regenerated items differently** — mark regenerated items as `regenerated: true` so the UI can show what's new vs previously logged.
3. **Warn users before day regeneration** — "You've already logged meals on this day. Regenerating will add NEW meal suggestions alongside your logged items." Or offer "Replace all" vs "Keep logged."
4. **Backend merge logic in `regenerateDay()`**:
   ```javascript
   // Pseudo-code for the merge
   const oldDay = plan.days[dayIndex];
   const newDay = await llmGenerateDay(userId, weekStart, dayIndex);
   // Preserve logged items from old day
   const loggedItems = oldDay.meals.flatMap(m =>
     m.items.filter(i => i.logged)
   );
   // Merge: new items + preserved logged items
   // Mark collisions where food_id exists in both
   ```

---

### Pitfall 7: Daily Meal Generation — Weekly-to-Daily Migration Gap

**What goes wrong:** v1.4 generates weekly meal plans (7 days in one LLM call, stored under a `weekStart` key). v1.5 changes meal recommendations to generate for 1 day at a time. The DB schema uses `(user_id, week_start)` as the unique constraint. A daily approach needs a new lookup key — `(user_id, date)` — or it reuses `week_start` but only stores today's data. Both approaches conflict with existing data.

**Existing schema (add_meal_plans.sql):**
```sql
CREATE TABLE IF NOT EXISTS meal_plans (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    week_start DATE NOT NULL,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ...
    UNIQUE(user_id, week_start)
);
```

**Why it happens:** The `UNIQUE(user_id, week_start)` constraint means there's exactly one row per user per week. If you switch to daily generation but still use `week_start` as the key, you can only store one day's worth of data per week. If you change the key to `date`, you break backward compatibility with existing weekly meal plans.

**Migration scenarios and problems:**
- **Option A:** Keep `week_start`, store only today's data → breaks if user wants to look ahead. Existing weekly plan data from v1.4 becomes orphaned (was 7 days, now 1 day overwrites it).
- **Option B:** Add a new `meal_plans_daily` table → two tables to maintain. Old weekly data lives in `meal_plans`, new daily data in `meal_plans_daily`. Query logic branches everywhere.
- **Option C:** Change the unique constraint to `(user_id, date)` — requires a migration that drops the old constraint and adds a new one. All existing weekly data with `week_start` as the key would violate the new constraint.

**Prevention:**
1. **ALWAYS add a new table, don't modify the existing one.** Create `meal_plans_daily` (or `daily_meal_plans`) with `UNIQUE(user_id, date)`. The old `meal_plans` table remains for backward compatibility / archive.
2. **Or, reuse the existing table but change the approach:** Keep `week_start` as the weekly grouping column but add a `target_date` column that indicates which day this plan is for. Make `UNIQUE(user_id, target_date)` the constraint. Migration: backfill `target_date = week_start` for existing weekly plans (they all target the week start). Then new daily inserts use the specific date.
3. **Update the service layer** (`mealPlan.service.js`) to handle both old weekly plans and new daily plans transparently.
4. **Frontend's `getMonday()` function must change** — meal plans no longer keyed by Monday. Use today's date directly.
5. **Rate limiters may need adjustment** — generating 1 day instead of 7 means users might generate more frequently. The existing `mealPlanLimiter` (50/15min) might still be fine, but review.

---

### Pitfall 8: "Completed" Toggle Causes Activity Log Duplicates

**What goes wrong:** In the merged Activities page, each generated activity plan item has a "completed" checkbox/toggle. Toggling "completed" logs the activity to `activity_logs`. User clicks toggle → API call succeeds → UI shows checkmark. User refreshes page → plan is loaded from DB → `logged: false` because only food plans track `logged` flags in `plan_data`, not activity plans.

**Existing behavior:** `WeeklyPlanPage` has **no** `logged` tracking. The `weekly_plans` table's `plan_data` JSONB stores `days[].activities[]` with `activity_id, name, duration, intensity, estimated_calories` but NO `logged` flag. The `mealPlan.repository.js` has `markItemsLogged()` — but there's no equivalent for activity plans.

**Why it happens:** Activity plans don't have a `logged` flag in their plan data yet. The "completed" toggle is new for v1.5. Without persisting the logged state back to `plan_data`, the toggle is ephemeral — it disappears on refresh.

**Consequences:**
- User marks activity as completed → it disappears on refresh → user clicks again → duplicate activity log entry
- User can't distinguish "already logged" from "generated but not done"
- Calorie summary double-counts

**Prevention:**
1. **Add `logged: boolean` to each activity plan item in `plan_data` JSONB**, mirroring the meal plan pattern:
   ```json
   {
     "days": [{
       "date": "2026-06-01",
       "activities": [
         { "activity_id": 5, "name": "Running", "duration": 30, "logged": false }
       ]
     }]
   }
   ```
2. **Create `markActivityItemsLogged()` in `weeklyPlan.repository.js`** — same pattern as `markItemsLogged()` in `mealPlan.repository.js`.
3. **After inserting into `activity_logs`, update the plan_data `logged` flag** in the same transaction (BEGIN/COMMIT/ROLLBACK).
4. **Frontend: use optimistic UI update** — toggle immediately, revert if API fails. Query plan data on mount to restore correct logged state.

---

### Pitfall 9: Rate Limiter Stacks — Auto-Gen + Manual Regenerate Exhaust Quota

**What goes wrong:** The auto-generate on page visit fires immediately, consuming the rate limit quota. The user waits, sees the generated plan, wants to regenerate a specific day — but now the per-day regeneration limiter counts against a separate bucket. However, the **generate** limiter (50/15min) is consumed. If the user also wants to manually regenerate the whole plan (triggering another `POST /generate`), they can't — the quota was consumed by the auto-gen.

**Existing rate limits:**
- `weeklyPlanLimiter`: 50/15min (used by both auto-gen and manual regenerate)
- `regenerateLimiter`: 30/30min (used by single-day regenerate)
- These are separate `express-rate-limit` instances, each with their own counter

**Why it happens:** The auto-gen on mount calls the same `/generate` endpoint as the manual button. The rate limiter can't distinguish "user-requested" from "auto-triggered." They share the same quota.

**Consequences:** User can't manually regenerate because the auto-gen already used the quota. This is user-hostile — the app consumed their quota without asking.

**Prevention:**
1. **Separate rate limiters** for auto-gen vs manual gen — but this is complex because `express-rate-limit` keys by user ID, not by trigger type.
2. **Better approach: auto-gen uses a STRICTER limiter** (e.g. 3/15min for auto-triggered, 50/15min for manual). The backend checks `x-auto-gen: true` header and applies the appropriate limiter.
3. **Best approach: Don't auto-consume the generation quota.** Instead, auto-trigger only if the user hasn't manually generated in the last N hours. Check `plan_data.generated_at` timestamp. If a plan was generated <4 hours ago, don't auto-generate — the existing plan is fresh enough.
4. **Frontend: Don't auto-gen at all on page visit** if a plan already exists (even a stale one). Auto-gen only when there is **zero plan data** — i.e., first visit ever. This is safer and avoids quota issues.

---

### Pitfall 10: "Select Alternatives" Duplicates or Creates Inconsistent State

**What goes wrong:** The spec says meal recommendations should support "select alternatives" — user can swap a generated meal item for an alternative. The alternatives must come from the same food category to maintain nutritional balance. If the user selects an alternative that was part of a different meal, that alternative now appears in two places. If the alternative uses a different portion size, calorie calculations become inconsistent.

**Why it happens:** "Alternatives" implies generating N options per slot (e.g., "pick one of three breakfast proteins"). The LLM generates these alternatives, but they're scoped to the current meal and don't consider whether the alternative was already selected elsewhere in the same day.

**Consequences:**
- User picks chicken for lunch (already had chicken for breakfast) → duplicate food in same day
- User swaps in an ingredient with very different calories → daily total drifts from target
- The "alternative" wasn't validated against the food database → same hallucination problem as v1.4

**Prevention:**
1. **Include category diversity in the alternative generation prompt** — "Alternatives MUST be from a different subcategory than the primary choice."
2. **Store alternatives in a separate `alternatives` array** in `plan_data`, not inline:
   ```json
   {
     "meal": {
       "meal_type": "breakfast",
       "items": [{ "food_id": 42, "logged": false }],
       "alternatives": [
         { "food_id": 17, "portion_grams": 100, "calories": 65 }
       ]
     }
   }
   ```
3. **When user selects an alternative, recalculate calories server-side** — same pattern as `batchLogItems`: server determines calories, never trust client.
4. **Deduplicate across meals** — before accepting an alternative, check if that `food_id` exists in any other meal for the same day. Warn the user: "You already have this item in your lunch."

---

## Moderate Pitfalls

---

### Pitfall 11: Merged Page Loses `ProfileGuard`

**What goes wrong:** Currently, `/weekly-plan` and `/meal-plan` are wrapped in `ProfileGuard` (Router.jsx lines 95-96). The `/activities` and `/food-log` routes are **not** — they only use `ProtectedRoute`. When merging, if the plan components are rendered inside the activities/food-log pages without ProfileGuard, users without a profile will see plan generation errors instead of being redirected to the profile form.

**Existing Router.jsx:**
```jsx
<Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
<Route path="/weekly-plan" element={<ProtectedRoute><ProfileGuard><WeeklyPlanPage /></ProfileGuard></ProtectedRoute>} />
<Route path="/food-log" element={<ProtectedRoute><FoodLogPage /></ProtectedRoute>} />
<Route path="/meal-plan" element={<ProtectedRoute><ProfileGuard><MealPlanPage /></ProfileGuard></ProtectedRoute>} />
```

**Prevention:** If the plan section is embedded in the merged page but non-critical (log still works without profile), show a "Create your profile to get personalized plans" banner instead of ProfileGuard redirect. If profile is required for the entire merged page (e.g., Activities page shows activity summary which needs profile), add ProfileGuard to the merged route.

---

### Pitfall 12: Inline Completed Toggle Conflicts With Manual Activity Logging

**What goes wrong:** The merged Activities page has both:
- Manual activity logging (existing — select activity, enter duration, click Log)
- Plan-suggested activities with a "completed" toggle (new — click checkbox to auto-log)

If a user manually logs the same activity that's already in their plan (e.g., sees "Running" in the plan, then manually logs it from the activity pool), both entries appear in `activity_logs`. The plan's completed toggle also triggers a log. Duplicate.

**Why it happens:** No cross-referencing between the manual log form and the plan's completed toggle. They're independent UI sections.

**Prevention:**
1. **After manual logging, update the plan's `logged` flag for matching items** — if the user logged "Running" manually, mark any plan activity with the same `activity_id` and same date as `logged: true`.
2. **Show visual indicator** on plan activities when they've been logged (even manually) — green checkmark.
3. **Disable the completed toggle** for already-logged plan activities.

---

### Pitfall 13: "Always Available Regenerate" Buttons Interact Badly With Auto-Gen

**What goes wrong:** The spec says "Manual regenerate button always available." But if auto-gen fires on page load and is in progress, the manual regenerate button should be disabled (to prevent double-generation). But the user wants to regenerate a different day — the auto-gen might be for today, the user wants to change tomorrow. The "always available" contradicts the "generating state blocks buttons" pattern.

**Existing code:** `WeeklyPlanPage.jsx` — when `generating` is true, the EmptyStatePlan shows a disabled "Generate" button. The DayCard's regenerate button is disabled when `regeneratingDayIndex` is set. These are per-operation locks.

**Prevention:**
1. **Use per-day/per-operation locks, not a global `generating` flag.** The auto-gen locks today's generation. Other days remain available for manual regeneration.
2. **If a day is being regenerated, only that day's button is disabled** — other days' buttons stay active.
3. **The global "Regenerate All" button (if it exists)**: disabled during any regeneration operation.
4. **Graceful rejection** — if user clicks regenerate while auto-gen is in progress, show a message: "Plan is being updated. Please wait a moment."

---

### Pitfall 14: Data Inconsistency When Single Meal Is Logged Mid-Generation

**What goes wrong:** User is viewing their food log (merged with meal plan). The meal plan is displayed as suggested items with "Log" buttons per meal. User clicks "Log Breakfast" → API call in progress (200-500ms). Meanwhile, auto-gen finishes and replaces `plan_data`. The log request references the old plan's breakfast items. By the time the log request resolves, `plan_data` has been overwritten. The `markItemsLogged()` function tries to mark items in the new plan — but those items don't exist (different `food_id`s from the new generation). The DB write to `food_logs` succeeds, but the `logged` flag never gets set in `plan_data`. On refresh, the items appear unlogged.

**Why it happens:** Race condition between auto-gen (which can be triggered by any page interaction) and the log-day action. Express handles requests concurrently. Both auto-gen and log-day read `plan_data`, modify it, and write it back. Last write wins, potentially losing the `logged` flags.

**Prevention:**
1. **Serialise plan mutations in a database transaction with row-level locking** — use `SELECT ... FOR UPDATE` when reading the plan row that will be modified. This forces auto-gen and log-day to execute sequentially.
2. **Use optimistic concurrency** — add a `version` column to `meal_plans`/`weekly_plans`. On write, check `WHERE version = old_version`. If mismatched, retry the operation with fresh data.
3. **Atomic JSONB path updates** — instead of read-modify-write the entire `plan_data`, use PostgreSQL JSONB path operators to update specific items:
   ```sql
   UPDATE meal_plans
   SET plan_data = jsonb_set(plan_data, '{days,0,meals,0,items,0,logged}', 'true')
   WHERE user_id = $1 AND week_start = $2;
   ```
   But this requires knowing exact array indices — fragile. Consider a compromise: read-for-update with transaction.

---

### Pitfall 15: LLM Generates Different Meal Structure for Daily vs Weekly

**What goes wrong:** The v1.4 weekly meal plan prompt generates 7 days × 4 meals. The v1.5 daily prompt generates 1 day × 4 meals. But the `plan_data` JSONB structure is the same — an array of days. The daily generation only produces 1 day, which gets inserted into `plan_data.days`. However, if the frontend still expects 7 days (e.g., render loops `plan.days.map(...)`), the newly generated single-day plan looks incomplete. Other days may be undefined or from a stale previous generation.

**Why it happens:** Monday's daily generation creates `plan_data.days = [day0]`. Tuesday's generation might overwrite or append, depending on implementation. If auto-gen always writes to index 0 (today's day), days from earlier in the week vanish.

**Existing pattern:** `upsertPlan()` does `ON CONFLICT (user_id, week_start) DO UPDATE SET plan_data = $3`. This replaces the ENTIRE `plan_data`. A 1-day plan overwrites a previous week's 7-day plan entirely.

**Prevention:**
1. **Merge, don't replace** — when storing a daily plan, merge it into the week's plan data:
   ```javascript
   // In mealPlan.service.js upsert:
   const existing = await findByUserAndWeek(userId, weekStart);
   const newDays = existing?.plan_data?.days || [];
   const dayIndex = newDays.findIndex(d => d.date === newDay.date);
   if (dayIndex >= 0) {
     newDays[dayIndex] = { ...newDays[dayIndex], ...newDay, meals: mergeMeals(newDays[dayIndex].meals, newDay.meals) };
   } else {
     newDays.push(newDay);
   }
   ```
2. **Or, use a separate `daily_meal_plans` table** (see Pitfall 7) to avoid the collision entirely. The weekly aggregation happens at query time.
3. **Frontend render safety** — always check `plan.days?.length` before mapping. Show empty state for missing days instead of broken UI.

---

## Minor Pitfalls

---

### Pitfall 16: "Regenerate" Button Resets Completed Toggles

**What goes wrong:** User marks 3 of 5 activities as completed in today's plan. Then clicks "Regenerate Today" (available because "always available"). The regeneration replaces today's activities with new ones. The 3 completed items are now gone from the plan view but still exist in `activity_logs`. But the user can't tell — they see the new plan without checkmarks. They might re-log similar activities.

**Prevention:** When regenerating a day, show a confirmation: "You have 3 logged activities today. Regenerating will add NEW suggestions alongside your logged items." Or: merge strategy (see Pitfall 6) that preserves the logged items in the UI but dimmed/archived.

---

### Pitfall 17: Meal Type Mismatch When Using "Select Alternatives"

**What goes wrong:** The "select alternatives" feature offers the user a different food item for their breakfast slot. But the alternative might belong to a different meal type category (snack → breakfast). The `meal_type` field in the JSONB is used for display and logging. If the alternative's meal_type doesn't match the target slot, it renders in the wrong section.

**Prevention:** Always assign the alternative to the same `meal_type` as the slot it replaces, regardless of what the LLM suggests. The UI/DB cares about the slot's meal type, not the food's "natural" meal type.

---

### Pitfall 18: Test Coverage Debt — New Endpoints Missing Tests

**What goes wrong:** v1.5 introduces new API endpoints (or modifies existing ones) for:
- Activity plan auto-log (`POST /api/weekly-plans/log-day` — new)
- Daily meal plan generation (modified from weekly)
- Merged page frontend components
- Rate limiter interactions

Existing test setup has 260 tests (backend 134 + frontend 126). Adding auto-logging, daily generation, and page merging without equivalent test coverage creates regression risk.

**Prevention:**
- Add tests for new `log-day` endpoint: idempotency, transaction rollback, duplicate prevention
- Add tests for daily generation flow: merge behavior, single-day overwrite protection
- Add frontend tests for merged page: both sections render, state isolation, sub-component interactions
- Minimum target: 20-30 new backend tests, 15-20 new frontend tests

---

### Pitfall 19: LLM Context Window Shrinkage With Daily Prompts

**What goes wrong:** Switching from weekly (7-day) to daily (1-day) prompts seems like it would reduce token usage — and it does, for the food list and instructions. But the daily prompt now includes "today's logged foods so far" as context so the LLM doesn't recommend breakfast items the user already ate. If the user has 15+ logged items across multiple meals, the context could be larger than expected. Plus the instruction to "provide alternatives for each slot" doubles the output tokens.

**Prevention:** Monitor `prompt_tokens` and `completion_tokens` from OpenRouter responses. Compare weekly vs daily token usage. If daily prompts end up being similar size, consider whether the switch is worth it for quality alone.

---

### Pitfall 20: Autogeneration Triggers for Users Who Don't Want It

**What goes wrong:** "Auto-generate plan on page visit if none exists" sounds user-friendly but can be surprising. User navigates to the Activities page to manually log a quick activity. Suddenly, the app fires an LLM request (5-15 seconds), uses their rate limit quota, and shows them a flash of "Generating..." before they can interact. The user didn't ask for a plan — they just wanted to log a workout.

**Why it happens:** The auto-gen doesn't distinguish "first visit (wants plan)" from "regular visit (wants to log)."

**Prevention:**
1. **Auto-gen only on first-ever visit** — check localStorage flag: `localStorage.getItem('plan_auto_gen_shown')`. Only auto-gen on the very first visit. For subsequent visits, show an empty state with a manual "Generate Plan" button.
2. **Auto-gen with a delay** — wait 2 seconds after page load before firing. If the user interacts with the log section during that window, cancel the auto-gen.
3. **Prefer a passive "Generate?" prompt** over automatic generation: "You don't have a plan for today. Would you like to generate one?" with a subtle banner (not a modal). User can accept or dismiss.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Activity plan auto-log | Duplicate on refresh (#1) | Separate generation from logging; add `logged` flag to weekly_plans plan_data; use one-time `logged_at` timestamp |
| Meal plan daily generation | Weekly-to-daily schema collision (#7) | Use new `daily_meal_plans` table; don't overwrite weekly data |
| Page merging (Activities + WeeklyPlan) | State explosion (#5), routing breakage (#4) | Keep sub-components independent with custom hooks; add route redirects |
| Page merging (FoodLog + MealPlan) | `ProfileGuard` mismatch (#11) | Add ProfileGuard to merged route; or show prompt banner without blocking |
| Auto-generate on visit | Infinite loop on failure (#2), quota exhaustion (#9) | `useRef` one-shot guard; show manual retry on failure; don't auto-gen if rate-limited |
| Inline completed toggle | Double-log from manual + toggle (#12) | Cross-reference plan items with activity_logs; update plan `logged` flag |
| Select alternatives | Duplicate meals (#10), category mismatch (#17) | Deduplicate across meals; enforce meal_type matching |
| Partial-log + regenerate | Orphaned data (#6), race condition (#14) | Merge strategy preserves logged items; SELECT FOR UPDATE for serialised mutations |
| Daily generation storage | Single-day overwrites full week (#15) | Merge into week's plan_data; don't replace entire JSONB |
| Always-available regenerate | Interacts with auto-gen state (#13) | Per-day locks not global; graceful rejection messages |
| Testing | Incomplete coverage (#18) | Target 20-30 backend + 15-20 frontend tests for new endpoints |
| UX surprise | Auto-gen on unintended visit (#20) | Debounce auto-gen; show prompt before consuming quota |

---

## Sources

- **Existing `weeklyPlan.controller.js`** — Current plan generation/retrieval patterns — HIGH confidence
- **Existing `mealPlan.controller.js`** — Current meal plan + logDay patterns — HIGH confidence
- **Existing `mealPlan.repository.js`** — `markItemsLogged()` idempotency — HIGH confidence
- **Existing `mealPlanRateLimiter.js`** — Rate limiting patterns — HIGH confidence
- **Existing `WeeklyPlanPage.jsx`** — Frontend state machine for plan generation — HIGH confidence
- **Existing `MealPlanPage.jsx`** — Frontend logging + regenerate UX — HIGH confidence
- **Existing `ActivitiesPage.jsx`** — Activity logging with history and summary — HIGH confidence
- **Existing `FoodLogPage.jsx`** — Food logging with ingredient search — HIGH confidence
- **Existing `Router.jsx`** — Current routing, ProfileGuard placement — HIGH confidence
- **Existing schema (`add_meal_plans.sql`, `schema.sql`)** — DB constraints — HIGH confidence
- **Existing `activity.repository.js`** — Activity log CRUD patterns — HIGH confidence
