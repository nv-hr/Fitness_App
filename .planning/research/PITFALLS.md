# Pitfalls: Weight Logging, Goal Setting, Weight Chart & Progress Dashboard

**Domain:** Fitness app progress tracking — adding weight history, goal targets, trend visualization to existing profile system
**Researched:** 2026-06-01
**Confidence:** HIGH (verified against existing codebase patterns)
**Codebase basis:** Profiles table (single `weight_kg` column, destructive PUT update), no charting library, TanStack React Query + React Hook Form

---

## CRITICAL PITFALLS

These will cause data loss, inconsistent state, or user-facing errors if not addressed.

### P-01: Weight Log Inserted Before Profile Update Succeeds (Inconsistent State)

**What goes wrong:**
The frontend or service creates a `weight_log` entry *before* the `UPDATE profiles SET weight_kg = ...` succeeds. If the profile update fails mid-flight (DB constraint violation, connection drop, server crash), the weight_log already exists but the profile still shows the old weight. The weight history is now inconsistent — it records a weight that was never actually applied, or timestamps don't match actual profile state.

**Why it happens:**
In the current codebase, `profile.service.js:updateProfile()` (line 179-187) calls `updateByUserId` then `getProfile` — two separate operations with no transaction. When adding weight_log insertion, the natural (wrong) instinct is:

```js
// WRONG — weight_log before profile update
await createWeightLog(userId, weightKg);   // Succeeds
await updateByUserId(userId, data);         // Fails → profile unchanged, log exists
```

Or worse, the frontend calls two separate API endpoints in sequence:
```js
// WRONG — frontend orchestrates two calls
await fetch('/api/weight-logs', { method: 'POST', body: { weightKg } });   // Succeeds
await fetch('/api/profile', { method: 'PUT', body: { ... } });             // Fails
```

**How to avoid:**
- **Insert weight_log AFTER the profile UPDATE succeeds**, within the same service function.
- Use a **database transaction** (`BEGIN/COMMIT/ROLLBACK`) wrapping both the profile UPDATE and the weight_log INSERT. If either fails, both roll back.
- Keep it in the **service layer** — the controller calls `profileService.updateProfile(userId, data)` which internally handles both profile update AND weight log insertion in one atomic operation.
- The current `updateProfile` in `profile.service.js` already follows a service-calls-repository pattern. Extend it:

```js
// CORRECT — weight_log after profile update, in same transaction
export async function updateProfile(userId, profileData) {
  validateProfileData(profileData);
  const { weightKg, ...rest } = profileData;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const profile = await updateByUserId(client, userId, profileData);
    await createWeightLog(client, userId, weightKg);
    await client.query('COMMIT');
    return getProfile(userId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

- **Never let the frontend orchestrate** the profile update + weight log creation as separate API calls. The backend must handle both atomically.

**Warning signs:**
- Frontend code that calls `/api/weight-logs` and `/api/profile` in sequence from the same handler
- Service functions that `await` two repository calls without a transaction wrapper
- Tests that create weight_logs without verifying the corresponding profile state

**Phase to address:** Phase 1 (backend service + repository for weight log) must enforce atomicity. The `profile.service.js` `updateProfile` function is the integration point.

---

### P-02: No Migration for Existing Users — Weight History Starts Empty

**What goes wrong:**
When the `weight_logs` table goes live, existing users who have been using the app for days/weeks have a weight in `profiles.weight_kg` but zero entries in `weight_logs`. Their weight chart shows a flat line starting from today, and progress calculations (% complete, rate of change) are wrong because there's no baseline.

**Why it happens:**
The `weight_logs` table is new. No code creates entries retroactively from existing profile data. Developers focus on the happy path ("new users set up weight tracking") and forget existing users who already have a profile with weight.

**How to avoid:**
- **Seed initial weight_log entry on migration.** The database migration creating the `weight_logs` table should also INSERT a row for every existing user using their current `profiles.weight_kg`:

```sql
INSERT INTO weight_logs (user_id, weight_kg, logged_date, source)
SELECT user_id, weight_kg, updated_at::date, 'migration'
FROM profiles
WHERE weight_kg IS NOT NULL;
```

- **Handle the "update-only" user**: When an existing user first visits the profile page and clicks "Update Profile" without changing weight, a weight_log entry should still be created (to establish a trend baseline). But only if one doesn't exist for today — guard against duplicates with `ON CONFLICT (user_id, logged_date) DO NOTHING` or check first.

- **Profile page should auto-log weight on first visit after migration**: When `GET /api/profile` returns data but weight_logs are empty, the frontend could prompt "Let's set your starting weight for tracking" — or the backend silently seeds a baseline entry on the first profile fetch.

**Warning signs:**
- Migration plan that creates the `weight_logs` table but has no INSERT from existing profiles
- All test cases use fresh users with no pre-existing profile
- QA testing only with new accounts, never with accounts that have weeks of history

**Phase to address:** Phase 1 (DB schema + seed migration). Must include both the CREATE TABLE and the data backfill.

---

### P-03: Duplicate Weight Entries for Same Day — Over-Reporting

**What goes wrong:**
A user updates their profile weight multiple times in one day (e.g., morning weigh-in, then again after noticing a typo). Each update creates a new `weight_log` row for the same `logged_date`. The chart shows multiple points for the same day, progress calculations use an arbitrary entry (first? last? average?), and the UI is confusing.

**Why it happens:**
The natural schema design is `INSERT INTO weight_logs (user_id, weight_kg, logged_date)` with no uniqueness constraint. Every profile update → new log entry. Multiple updates per day → multiple entries per day.

**How to avoid:**
- **UPSERT pattern**: Use `ON CONFLICT (user_id, logged_date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, updated_at = NOW()`. This requires a UNIQUE constraint on `(user_id, logged_date)`:

```sql
CREATE TABLE weight_logs (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'profile_update', 'migration')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, logged_date)
);
```

- **One entry per user per day.** If the user updates weight twice on the same day, the second update overwrites the first in `weight_logs` (same behavior as `profiles.weight_kg` — last write wins).

- **Decision to make:** Is it one-entry-per-day (UPSERT) or multi-entry-per-day (INSERT with time precision)? For a BMI/TDEE app where daily weigh-in is the norm, one-entry-per-day is the right choice. Multi-entry creates chart noise and calculation ambiguity.

**Warning signs:**
- Schema with no UNIQUE constraint on `(user_id, logged_date)`
- Repository method named `createWeightLog` that does a plain INSERT without checking for existing entries
- Tests that insert multiple weight entries for the same date without verifying which one "wins"

**Phase to address:** Phase 1 (schema design). Must decide UPSERT vs INSERT upfront — changing later requires a migration.

---

### P-04: Chart Loading All History on Every Page Visit

**What goes wrong:**
The weight chart page fetches ALL weight_log entries for the user (`SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY logged_date`) on every page visit. As months pass, the dataset grows. A user who logs weight daily for a year has 365 entries. For two years, 730+. This is a small dataset by DB standards, but combined with React re-renders, chart library computation, and repeated fetches on every navigation, it creates unnecessary load.

At the frontend, re-rendering the chart component with 365+ data points on every state change incurs chart library layout computation (especially SVG-based charts), which can cause jank on mid-range devices.

**Why it happens:**
Developers default to "fetch all" because the dataset seems small. The existing pattern in the codebase (`useMonthData` fetching 5-6 parallel weekly plans) reinforces this habit. Without lazy loading or pagination, the endpoint returns everything.

**How to avoid:**
- **Do NOT paginate weight history at MVP stage** — it adds complexity for no benefit at expected scale (<1K entries per user). Instead:
  - **Set TanStack Query `staleTime` to 5+ minutes** so repeatedly visiting the page doesn't re-fetch. The existing pattern already uses `staleTime: 1000 * 60 * 5` in some queries.
  - **Use `gcTime` (formerly `cacheTime`) to keep chart data cached** even after navigating away and back.
  - **Backend: LIMIT the query** to a sensible window (e.g., last 12 months, ~365 entries max). Most users don't need to see weight from 2+ years ago on a trend chart.
  - **Backend: offer a `?months=N` query parameter** for "last N months" filtering.
- **Only force-refetch on manual refresh** or when the user explicitly updates their weight.
- **Chart rendering optimization**: Memoize chart data transformation with `useMemo` so re-renders don't recompute chart layout.

```js
// Good backend query
const MONTHS_DEFAULT = 12;
SELECT * FROM weight_logs 
WHERE user_id = $1 AND logged_date >= $2 
ORDER BY logged_date;
// $2 = startOfMonth(subMonths(new Date(), months))
```

**Warning signs:**
- `weightLogs` query with no `staleTime` or `gcTime` configuration
- No `.limit()` or date range on the backend SQL query
- Chart component re-renders on unrelated state changes (profiling shows layout recalc)
- Weight history API returns 500+ rows with no pagination or filter

**Phase to address:** Phase 2 (backend API + frontend chart). Design the API with default limits from day one.

---

### P-05: Empty Chart UX — User Has No Weight Logs Yet

**What goes wrong:**
The progress dashboard shows a completely empty chart area with no message, or worse, a chart library error (react-day-picker doesn't do charts, so a new library will be introduced — likely recharts or chart.js). The empty state might render as "No data" or a broken SVG, leaving users confused about what they should do.

For new users who just created a profile: they have `profiles.weight_kg` set (from onboarding) but zero `weight_logs` entries. The chart is empty despite the user having a weight on record.

**Why it happens:**
Developers build the chart assuming data exists. The onboarding flow sets the profile weight but doesn't seed a weight_log entry. The chart queries `weight_logs` only, finds nothing, and either breaks or shows nothing useful.

**How to avoid:**
- **Seed weight_log on profile creation**: When a user creates a profile (POST /api/profile), also insert a weight_log entry with their initial weight and `source: 'manual'`. The frontend already calls `createProfile` — extend it in the service layer.
- **Show a helpful empty state**: If weight_logs is empty but profile exists, show a message like "Log your first weight to start tracking" with a button/modal that lets them enter a starting weight.
- **Don't show the chart at all if <2 entries**: A trend line with one data point is meaningless. Show a "Start tracking" prompt instead.
- **Use the profile weight as fallback**: If weight_logs is empty, show "Your current weight: X kg. Log again tomorrow to start seeing your trend."

**Warning signs:**
- Chart component renders before checking data length
- No `if (data.length < 2) return <EmptyState />` guard in chart component
- `createProfile` in `profile.service.js` doesn't also create a weight_log entry
- No loading/empty/error state differentiation in the chart component

**Phase to address:** Phase 1 (seed on profile creation) + Phase 2 (chart empty state).

---

### P-06: Goal Setting Friction — Target Date + Weight Not Integrated with Profile

**What goes wrong:**
Goal setting is bolted on as a separate feature with its own form, its own API endpoint, and its own database table. The user sets a target in one place, but the profile form doesn't show it. When editing their profile, they can't see/change their goal. The experience feels disjointed.

**Why it happens:**
The existing `profiles` table has `fitness_goal` (lose_weight/maintain/gain_weight) and `calorie_rate` (low/medium/high) but no numeric target. Adding `target_weight_kg` and `target_date` to the existing `profiles` table is simpler than creating a separate `goals` table, but developers often err on the side of "normalization" and create a new table unnecessarily.

**How to avoid:**
- **Add columns to the existing `profiles` table**, not a new table:
  ```sql
  ALTER TABLE profiles ADD COLUMN target_weight_kg DECIMAL(5,2) NULL;
  ALTER TABLE profiles ADD COLUMN target_date DATE NULL;
  ```
- **Include goal fields in the existing ProfileForm**: The existing `ProfileForm.jsx` already handles create + update. Add target weight and target date as optional fields in the same Zod schema.
- **Include goal data in the existing `/api/profile` response**: The `getProfile` service already returns a rich response object. Add `targetWeightKg` and `targetDate` to it.
- **Don't create a separate `/api/goals` endpoint** — it adds complexity, requires auth middleware duplication, and forces the frontend to manage two API calls for what is logically one screen.

**Exception:** If the goal system needs its own lifecycle (multiple goals over time, goal history, superseded goals), a separate `goals` table with `status` column makes sense. But for v1.9 "set a target and track against it", adding columns to `profiles` is correct.

**Warning signs:**
- Plan that creates a separate `goals` table with a single row per user
- Separate `/api/goals` route with no existing pattern match
- ProfileForm not updated to include goal fields
- Frontend fetches profile from one endpoint and goals from another

**Phase to address:** Phase 1 (schema change — add columns to profiles table, NOT a new table).

---

## MODERATE PITFALLS

### P-07: Weight Chart Library Decision Paralysis

**What goes wrong:**
The team spends too much time evaluating chart libraries (recharts vs chart.js vs visx vs nivo vs d3) instead of building the feature. Or picks a library that's overkill for a simple line chart with a goal line.

**Current project state:** No charting library in use. `react-day-picker` is the only UI library beyond base React. The project philosophy is "minimal dependencies."

**How to avoid:**
- **Use `recharts`** (React-native, composable, good defaults for line charts). It's the simplest path to a line chart with:
  - A `<LineChart>` with `<Line>` for weight data
  - A `<ReferenceLine>` for the goal weight line
  - Simple responsive container: `<ResponsiveContainer width="100%" height={300}>`
- **Do NOT use raw D3.js** — it's powerful but the learning curve isn't justified for one line chart.
- **Do NOT use Chart.js** — the imperative API fights React patterns. Recharts is declarative and fits the React data flow.
- **Do NOT build a custom SVG chart** — the project philosophy of "minimal styling" doesn't mean "no dependencies for core features." A chart is a core feature of progress tracking.

**Recharts install:**
```bash
npm install recharts
```

The bundle size impact is ~150KB gzipped, which is acceptable for a feature page.

**Warning signs:**
- Spending >30 minutes evaluating chart libraries for this feature
- Writing raw SVG `<path>` elements for the trend line
- Importing 500KB+ of D3.js modules for a single line chart
- Chart library chosen doesn't support ReferenceLine out of the box

**Phase to address:** Phase 2 (frontend chart component). Install recharts during this phase.

---

### P-08: Progress Metrics Calculated Incorrectly — Wrong Direction

**What goes wrong:**
Progress percentage and "kg to goal" are calculated with the wrong sign or reference point. For a user trying to lose weight:
- "80% complete" when they've only lost 20% of what's needed
- "2 kg to goal" shown as "-2 kg to goal"
- Progress bar fills in the wrong direction (from right to left)
- A user who overshoots their goal shows negative progress

**Why it happens:**
Progress math is simple but easy to get wrong:

```
START_WEIGHT = first weight_log entry (or profile weight)
CURRENT_WEIGHT = most recent weight_log entry
GOAL_WEIGHT = target_weight_kg

For weight loss (goal < start):
  kgLost = startWeight - currentWeight       // positive number
  totalToLose = startWeight - goalWeight      // positive number
  percentComplete = (kgLost / totalToLose) * 100
  kgToGo = currentWeight - goalWeight         // positive number (if haven't reached goal)

For weight gain (goal > start):
  kgGained = currentWeight - startWeight      // positive number
  totalToGain = goalWeight - startWeight      // positive number
  percentComplete = (kgGained / totalToGain) * 100
  kgToGo = goalWeight - currentWeight         // positive number

For maintain (goal ≈ start):
  percentComplete is always 100% if within maintenance range
  Show deviation instead: kgAway = Math.abs(currentWeight - goalWeight)
```

**The common mistakes:**
1. Using absolute values instead of direction-aware math
2. Assuming weight loss direction (reverse the signs for weight gain)
3. Division by zero when startWeight === goalWeight (maintain goal)
4. Percentages > 100% when user overshoots (cap at 100% or show "Goal exceeded!")
5. Negative "kg to go" when goal is reached (show "Goal reached! 🎉" instead)

**How to avoid:**
- Write a pure function `calculateProgress(startKg, currentKg, goalKg)` with direction-aware logic
- Unit test ALL combinations: lose weight (in progress, completed, overshot), gain weight (in progress, completed, overshot), maintain (on track, deviated)
- Handle division by zero explicitly
- Cap percentComplete at 0-100 for display (but keep raw value for "overshoot" detection)
- Show `kgToGo` as absolute value with direction label ("2 kg to lose" vs "1 kg to gain")

**Warning signs:**
- Inline progress math in a React component instead of a pure utility function
- No tests for progress calculations
- Progress values that can go negative without being handled
- Using `Math.abs()` on everything (losing direction information)

**Phase to address:** Phase 2 (progress dashboard). Extract progress calculation to a pure utility with tests.

---

### P-09: Weight Trend Chart Not Connected to Profile Updates

**What goes wrong:**
A user updates their weight in the profile form, sees the new BMI/TDEE recalculate correctly, but the weight chart doesn't update because the chart query is stale or the weight log wasn't created. The user sees old data and thinks the feature is broken.

**Why it happens:**
The profile update (`PUT /api/profile`) and weight log creation are in separate service calls, or the chart uses a separate TanStack Query key that isn't invalidated when the profile is updated.

Currently, `profile.service.js:updateProfile()` only calls `updateByUserId` + `getProfile`. Adding weight log creation inside this function is necessary, but the frontend also needs to know that the chart data is stale.

**How to avoid:**
- **Invalidate the weight_logs query key when profile is updated**. In the frontend's `useMutation` for profile update:
  ```js
  // In the mutation's onSuccess:
  queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  ```
- **OR: After profile update, refetch weight_logs** by returning the latest entry in the profile update response, so the chart can update immediately without a second fetch:
  ```js
  // Backend response includes latest weight_log
  { profile, bmi, tdee, ..., latestWeightLog }
  ```
- **Update the TanStack Query cache optimistically** if the mutation is fast enough:
  ```js
  queryClient.setQueryData(['weightLogs'], (old) => [...old, newEntry]);
  ```
- **Don't make the user refresh the page** to see chart updates. The chart must update automatically when weight is logged.

**Warning signs:**
- Profile update mutation has no `onSuccess` that touches weightLogs query cache
- Chart component uses a separate `useQuery` with no relation to profile mutations
- User reports "I updated my weight but the chart doesn't show it"

**Phase to address:** Phase 2 (frontend chart + API integration). The TanStack Query invalidation must be wired up.

---

### P-10: Estimated Completion Date Ignoring Rate of Change

**What goes wrong:**
The "estimated completion date" is calculated using a flat rate assumption (e.g., "losing 0.5 kg/week" from the calorieRate setting) instead of the user's actual weight trend. A user losing 0.2 kg/week sees "Estimated completion: 4 weeks" when their actual rate will take 10 weeks. The estimate is misleading and erodes trust.

**Why it happens:**
Using the `calorie_rate` profile field (low/medium/high) to estimate completion is tempting because it's already in the database. But `calorie_rate` is a *planning* value, not an *observed* value. Actual weight change depends on adherence, metabolism changes, and many other factors.

**How to avoid:**
- **Use actual trend data** from weight_logs to calculate rate of change:
  ```js
  function estimateCompletionDate(weightLogs, goalWeight) {
    if (weightLogs.length < 2) return null; // Not enough data

    const sorted = [...weightLogs].sort((a, b) => a.logged_date - b.logged_date);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const daysDiff = differenceInDays(last.logged_date, first.logged_date);
    const kgDiff = last.weight_kg - first.weight_kg;
    const dailyRate = kgDiff / daysDiff; // Can be negative (losing) or positive (gaining)

    if (Math.abs(dailyRate) < 0.001) return null; // Rate too slow to estimate

    const kgRemaining = goalWeight - last.weight_kg;
    const daysRemaining = kgRemaining / dailyRate;
    if (daysRemaining <= 0 || !isFinite(daysRemaining)) return null; // Already at goal

    return addDays(new Date(), Math.round(daysRemaining));
  }
  ```
- **Show trend-based estimates alongside a confidence indicator**: "At your current rate, you'll reach your goal by [date] (based on [N] weigh-ins)"
- **Require minimum data points**: Don't show estimates until the user has at least 3-4 weigh-ins over 2+ weeks
- **Always show the data range used for the estimate** so users understand it's based on actual trends, not promises

**Warning signs:**
- Estimated completion date uses `calorie_rate` or any profile setting instead of weight_log data
- Estimates displayed when user has only 1 weight entry
- No disclaimer that estimates are based on current trend
- Estimates don't update when new weight entries are added

**Phase to address:** Phase 2 (progress dashboard). The estimation function should be a pure utility with thorough tests.

---

### P-11: Edge Cases in Weight Log History Queries

**What goes wrong:**
The weight history API returns data in the wrong order, duplicates, or missing entries for specific user scenarios — particularly when users backfill entries, edit weights for past dates, or use the app across timezone boundaries.

**Common missed edge cases:**

| Scenario | Failure Mode |
|----------|-------------|
| User logs weight for yesterday (backfill) | Entry appears in wrong position if sorted by `created_at` instead of `logged_date` |
| User in UTC+14 timezone logs weight late at night | Entry recorded as tomorrow's date |
| User logs weight, then edits their profile weight on the same day | Two entries for same day if UPSERT not used, or overwrite with UPSERT — either case needs correct behavior defined |
| User deletes profile (CASCADE) | Cascade should delete weight_logs, but `source: 'migration'` entries might get orphaned if migration didn't set user_id correctly |
| User has a weight_log entry from the future (device date wrong) | Chart scale breaks, progress calculations produce negative days |

**How to avoid:**
- **Always sort by `logged_date ASC`** in the weight history query, never by `created_at` or `id`
- **Use `DATE` type for `logged_date`**, not `TIMESTAMPTZ` — timezone issues disappear
- **Clamp `logged_date` to `CURRENT_DATE`** on insert: `logged_date = LEAST(NEW.logged_date, CURRENT_DATE)` via CHECK constraint or application logic
- **Test the timezone scenario**: A user in UTC+14 logging at 11 PM local time (which is 9 AM next day UTC) — the DATE type stores what the user intended, not the server's interpretation
- **Backfill shouldn't update the UPSERT conflict**: `ON CONFLICT (user_id, logged_date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg` — this is correct behavior (last write wins per day)

**Warning signs:**
- Weight log query uses `ORDER BY created_at` or `ORDER BY id`
- `logged_date` column is `TIMESTAMPTZ` instead of `DATE`
- No index on `(user_id, logged_date)` for efficient range queries
- No test for backfilling weight entries

**Phase to address:** Phase 1 (schema + repository). Get the query right before building the API.

---

## MINOR PITFALLS

### P-12: Weight Log Source Tracking Omitted

**What goes wrong:**
When debugging a user issue ("my weight on [date] is wrong"), there's no way to tell if the entry came from a manual log, a profile update, or the initial migration. Every entry looks the same.

**How to avoid:**
Add a `source` column with enum values: `'manual'` (direct weight log entry), `'profile_update'` (weight changed via profile form), `'migration'` (seeded from existing profile data). This is forward-thinking without adding complexity.

### P-13: Weight Input Validation Mismatch

**What goes wrong:**
The profile form validates weight with `z.coerce.number().min(2).max(300)` but the weight_log API might use different validation. A user enters 75.5 kg in the profile form — valid. But the weight_log endpoint might reject decimals or have different limits.

**How to avoid:**
Share the same validation schema (Zod) between profile weight and weight_log. Extract weight validation to a shared schema file. Both the profile service and weight_log service should import and use the same `weightSchema`.

### P-14: Goal Line on Chart Not Customizable

**What goes wrong:**
The weight chart shows a goal line (horizontal reference line at the target weight), but users can't see how different goal dates affect the projection. The goal line is static, and the "projected trend" is missing.

**How to avoid:**
- Show the goal line (ReferenceLine at `target_weight_kg`)
- Optionally show a "target pace" trend line (theoretical line from current weight to goal weight over the time to target date) so users can see if they're ahead of or behind schedule
- The target pace line is calculated as: slope = (goalWeight - currentWeight) / daysToGoal
- Make goal line color green (destination), pace line dashed grey (if ahead/behind), and actual trend line blue (recharts `<Line>` default)

### P-15: Weight Log Form Duplicated from Profile Form

**What goes wrong:**
The progress dashboard has a "Log Weight" input, and the profile form also has a weight input. These are two different UI elements that do the same thing but might behave differently (one triggers a weight log POST, the other triggers a profile PUT). Users are confused about which to use.

**How to avoid:**
- **Make the profile weight update the canonical way to log weight** for most users. When they update their weight in the profile form, it also creates a weight_log entry (via the atomic service in P-01).
- **Add a quick "Log Weight" widget on the dashboard** that also calls the same profile update endpoint (with other fields defaulting to existing values). It's not a separate weight log endpoint — it's a shortcut to the profile update.
- OR: have a dedicated weight log endpoint that ONLY updates weight_logs and NOT the profile. But this means two sources of truth for "current weight" — the profile's `weight_kg` and the latest weight_log. Pick one and stick with it. **Recommended: weight_logs is the source of truth, profile.weight_kg is derived from the latest entry.**

---

## TECHNICAL DEBT PATTERNS

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Weight_log inserted outside transaction | Simpler service code | Orphaned entries if profile update fails | Never — data integrity is non-negotiable |
| No migration for existing users | Launch faster | All existing users start with empty charts | Only if communicated as "tracking starts now" but still seed baseline |
| Chart library chosen without evaluation | Saves 30min | Wrong abstraction for future features (e.g., bar charts for macros) | Acceptable for MVP if recharts is chosen (it handles most chart types) |
| Progress metrics calculated inline in component | Fast to implement | Untestable, easy to get direction wrong | Never — extract to pure function |
| Separate goals table with separate API | Feels "clean" | Extra endpoints, query invalidation complexity, form duplication | Only if multi-goal history is a confirmed requirement |
| No `source` column on weight_logs | Simpler schema | Can't diagnose data issues | Acceptable for MVP if migration is clean |

---

## INTEGRATION GOTCHAS

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Profile update → weight log | Create weight_log before profile update | After update succeeds, in same DB transaction |
| Profile form → weight chart | Forget to invalidate weightLogs query | In `onSuccess` of profile mutation: `invalidateQueries(['weightLogs'])` |
| Profile creation → weight log | No initial weight_log entry | Insert weight_log in `createProfile` service with `source: 'manual'` |
| TDEE calculation → weight chart | Using profile.weight_kg always | Use latest weight_log entry; or keep profile.weight_kg as cache of latest |
| Chart library → React state | Chart data transformation in render | `useMemo` with stable dependencies |
| Zod validation → profile vs weight | Different validation rules | Extract shared `weightSchema` |

---

## PERFORMANCE TRAPS

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching ALL weight history every page visit | Slow page load, unnecessary API calls | `staleTime: 5min`, server-side `LIMIT` to last 12 months | At any scale — prevented upfront |
| Chart re-render on every state change | Janky chart animation, high CPU | `React.memo` on chart, memoize data transformation | At any scale with active users |
| No index on weight_logs user_id+logged_date | Slow queries as data grows | `CREATE INDEX CONCURRENTLY idx_weight_logs_user_date ON weight_logs(user_id, logged_date)` | At ~1000+ entries per user |
| Weight log table growing unbounded | Storage costs, slow scans | No issue at expected scale (<1M rows total). Add cleanup after 5+ years of data | Never at this project's scale |

---

## UX PITFALLS

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty chart on first visit | User thinks feature is broken | Show "Log your first weight" prompt |
| Chart with one data point | Pointless trend line | Hide chart, show message until 2+ entries |
| Goal date in the past after missed deadline | User can't set past deadline, stuck | Allow re-setting target date (update, not lock) |
| Weight entry only from profile form | Users hunting for where to log weight | Add quick-log widget on dashboard too |
| No animation on weight update | User doesn't know action registered | Recharts animates by default — keep it |
| "kg to goal" shows negative when exceeding | Confusing math | Show "Goal exceeded by X kg" with celebration |
| Estimated completion uses flat rate | Unrealistic expectations | Use actual trend data, show data range |
| Chart Y-axis starts at 0 | Weight fluctuations look dramatic | Auto-scale Y-axis to weight range ±2kg padding |

---

## "LOOKS DONE BUT ISN'T" CHECKLIST

- [ ] **Weight log on profile update**: Weight_log INSERT is inside the same DB transaction as the profile UPDATE. Verify by checking the service method.
- [ ] **Migration for existing users**: `weight_logs` table creation includes INSERT FROM profiles for every existing user. Verify by running migration on a copy of production data.
- [ ] **One-entry-per-day constraint**: `UNIQUE(user_id, logged_date)` exists on the weight_logs table. Verify by inserting two entries for the same date and asserting the second overwrites.
- [ ] **Initial weight on profile creation**: When a new user sets up their profile, a weight_log entry is also created. Verify by creating a profile and checking weight_logs count = 1.
- [ ] **Chart empty state**: Chart component handles 0 entries (prompt), 1 entry (message, no trend), 2+ entries (trend line). Verify by mocking API responses.
- [ ] **Goal validation**: Target weight is on the correct side of current weight (cannot set gain target above current without changing fitness_goal). Verify by testing validation.
- [ ] **Progress calculation edge cases**: Handle division by zero (start === goal), overshoot (>100%), maintain goal (show deviation). Verify by unit testing the pure function.
- [ ] **Chart query invalidation**: Updating profile weight also refetches weight_logs. Verify by checking React Query DevTools or network tab.
- [ ] **Backend LIMIT on weight history**: API returns max 12 months by default. Verify by reading the SQL query.
- [ ] **Estimated completion uses trend**: Not calorie_rate or flat rate. Verify by inspecting the calculation function.

---

## RECOVERY STRATEGIES

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| P-01: Out-of-order weight log | HIGH | Delete orphaned weight_logs, re-run with correct order in transaction |
| P-02: No migration for existing users | MEDIUM | Run backfill SQL AFTER the feature ships (may cause a brief empty-chart window) |
| P-03: Duplicate daily entries | LOW | `DELETE FROM weight_logs WHERE id NOT IN (SELECT DISTINCT ON (user_id, logged_date) id FROM weight_logs ORDER BY user_id, logged_date, updated_at DESC)` — keeps the last entry per day |
| P-08: Wrong progress direction | MEDIUM | Fix the utility function, redeploy, all existing data recalculates correctly |
| P-09: Chart not updating after profile update | LOW | Fix query invalidation in frontend mutation handler |
| P-10: Wrong estimated completion date | MEDIUM | Switch from flat rate to trend-based calculation, re-deploy |
| P-14: Goal line missing from chart | LOW | Add ReferenceLine to recharts, data is already available |

---

## PITFALL-TO-PHASE MAPPING

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P-01: Weight log before profile update | Phase 1 (service layer) | Test: profile update failure doesn't create weight_log |
| P-02: No migration for existing users | Phase 1 (schema + migration) | Verify: seed SQL included in migration |
| P-03: Duplicate daily entries | Phase 1 (schema) | Verify: UNIQUE constraint exists |
| P-04: Chart loading all data | Phase 2 (backend API + frontend) | Verify: API has default LIMIT, query has staleTime |
| P-05: Empty chart | Phase 2 (frontend component) | Test: 0-entry and 1-entry states |
| P-06: Goal setting separated from profile | Phase 1 (schema) | Verify: columns added to profiles, not new table |
| P-07: Chart library decision | Phase 2 (frontend) | Decision made before coding starts |
| P-08: Wrong progress direction | Phase 2 (utility function) | Test: all direction combinations |
| P-09: Chart not updating | Phase 2 (frontend mutations) | Verify: queryClient.invalidateQueries wired up |
| P-10: Estimated completion wrong | Phase 2 (utility function) | Test: with real weight_log data |
| P-11: Weight history query edge cases | Phase 1 (repository) | Test: backfill, timezone, ordering |
| P-15: Duplicate weight input | Phase 2 (UI design) | Verify: single source of truth for weight entry |

---

## Sources

- Codebase analysis: `backend/src/services/profile.service.js` — no transaction wrapper around updates
- Codebase analysis: `backend/src/repositories/profile.repository.js` — single-table UPDATE, no weight_log
- Codebase analysis: `frontend/src/features/profile/components/ProfileForm.jsx` — create + update in one form
- Codebase analysis: `frontend/src/features/profile/api/profileApi.js` — PUT /api/profile for updates
- Codebase analysis: `backend/src/controllers/profile.controller.js` — delegates to service, no weight log awareness
- Codebase analysis: `backend/db/schema.sql` — profiles table has `weight_kg` only, no target columns
- Codebase analysis: `frontend/package.json` — no charting library present
- Codebase analysis: `.planning/PROJECT.md` lines 145-149 — target features for v1.9
- General fitness app post-mortems: weight tracking data integrity issues are well-documented in health app space
- Recharts documentation: `<ReferenceLine>` for goal line, `<LineChart>` for trend, auto-animation
- TanStack Query v5 docs: `staleTime`, `gcTime`, `invalidateQueries` for cache management

---

*Pitfalls research for: Weight Logging, Goal Setting, Weight Chart & Progress Dashboard (v1.9 Progress Tracking)*
*Researched: 2026-06-01*
