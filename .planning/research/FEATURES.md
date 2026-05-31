# Feature Landscape — Smart Auto-Logging (v1.5)

**Domain:** Fitness App — Auto-Logging of Generated Plans, Page Merges, Inline Management
**Researched:** 2026-05-31
**Based on:** Existing v1.3 activity plan + v1.4 meal plan implementation analysis

---

## Overview

v1.5 bridges the gap between "see your plan" and "live your plan." Currently, generated plans (activity + meal) are read-only displays on dedicated pages. Users must manually log activities one-by-one from the Activities page, and while meal plans have a one-click "Log This Day" batch button, the UX is separate from the main Food Log page.

The core shift: **plans become actionable from the same page where you do the work.** This means:
- Merging two pairs of pages (Activities + Activity Plan → one Activities page; Food Log + Meal Plan → one Food Log page)
- Auto-saving plan items to actual logs when marked complete
- Auto-generating plans on visit (no empty-state wait)
- Changing meal plans from 7-day to 1-day for higher relevance
- Adding "select alternatives" for meal items to handle the "I don't have chicken today" scenario

---

## Feature Analysis by Category

### Category A: Page Merges (Targets 6 & 7)

These are structural changes that affect navigation, routing, and component layout.

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Merge Activity Plan → Activities page** | 6 | Two routes: `/activities` (logging, history, summary) and `/weekly-plan` (7-day plan cards) | Single `/activities` page containing both logging tools AND the weekly plan |
| **Merge Meal Plan → Food Log page** | 7 | Two routes: `/food-log` (search, log, history) and `/meal-plan` (7-day meal plan cards) | Single `/food-log` page containing both logging tools AND the meal plan |

#### Merge UX Patterns

**Option A — Section-based (recommended for mobile-first):**
```
Activities Page (scrollable)
├── Activity Summary (collapsible)
├── ──── divider ────
├── "Today's Plan" Section
│   ├── Auto-generated daily plan cards (collapsed/expanded)
│   ├── "Regenerate" button
│   └── "Mark All Complete" / individual complete toggles
├── ──── divider ────
├── Activity Logger (inline form)
├── Activity Pool (browse all)
└── Activity History (7-day)
```

```
Food Log Page (scrollable)
├── Calorie Summary (progress bar)
├── ──── divider ────
├── "Today's Meal Plan" Section
│   ├── Auto-generated 1-day meal plan (breakfast, lunch, dinner, snack)
│   ├── Per-meal "Log This" / "Select Alternatives"
│   └── "Regenerate" / "Complete All" buttons
├── ──── divider ────
├── Food Search + Manual Logging
├── Custom Food Entry
└── Calorie History
```

**Option B — Tab-based:**
```html
<div class="tabs">
  <button>Log Food</button>
  <button>Meal Plan</button>
  <button>History</button>
</div>
```

**Recommendation:** Option A (sections) because:
1. No tab state management needed — everything visible at once on mobile-friendly single scroll
2. The plan is contextual to logging — you see the suggestion AND the manual tool on same screen
3. Users can act on plan items inline (log/complete/regenerate) without switching views
4. Fewer React state complications than tabbed interfaces

#### Route Changes Required

| Current Route | Action | New Route |
|---------------|--------|-----------|
| `/weekly-plan` | Delete | — |
| `/meal-plan` | Delete | — |
| `/activities` | Keep, add plan section | `/activities` |
| `/food-log` | Keep, add plan section | `/food-log` |
| Dashboard links | Update | Remove `/weekly-plan` and `/meal-plan` links |

#### Component Restructuring

The current component hierarchy splits across feature directories:

```
src/features/
  activities/       → ActivitiesPage, ActivityLogForm, ActivityHistory, ActivitySummary, ActivityPool
  weekly-plan/      → WeeklyPlanPage, DayCard, DayActivityRow, RateLimitedButton, EmptyStatePlan, FallbackBanner
  food-log/         → FoodLogPage, FoodSearch, FoodLogTable, CalorieSummary, CalorieHistory, CustomFoodForm
  meal-plan/        → MealPlanPage, DayMealCard, MealRow, EmptyStateMealPlan, FallbackBanner
```

After merge:
```
src/features/
  activities/       → ActivitiesPage (unified)
                      ├── sections: ActivitySummarySection, TodayPlanSection
                      ├── components: ActivityLogForm, ActivityHistory, ActivityPool
                      └── plan components: DayCard, DayActivityRow, RateLimitedButton
  food-log/         → FoodLogPage (unified)
                      ├── sections: CalorieSummarySection, TodayMealPlanSection
                      ├── components: FoodSearch, FoodLogTable, CalorieHistory, CustomFoodForm
                      └── plan components: MealCard, MealRow, MealAlternativePicker
```

---

### Category B: Auto-Save & Completion Toggle (Targets 1 & 2)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Auto-save activity plan → activity log** | 1 | Activity plan is display-only. No way to save plan items to activity_logs table | Toggle "completed" on a day or individual activity → auto-logs to activity_logs table |
| **Auto-save meals → food log** | 2 | Meal plan has "Log This Day" batch button → logs to food_logs table | Add "completed" toggle + "select alternatives" for individual items |
| **Completed tracking** | 1, 2 | Meal plan has `logged: true` flag on items; activity plan has no completion tracking | Both plans track `completed` status per-day and/or per-item in plan_data JSONB |

#### UX Pattern: "Pending" → "Completed" Transition

**State machine per plan day:**

```
       visit page
           │
           ▼
   ┌───────────────┐
   │  PENDING      │  (plan generated but no items logged)
   │  (blue/gray)  │
   └───────┬───────┘
           │ toggle complete
           ▼
   ┌───────────────┐
   │  LOGGING      │  (API call in progress)
   │  (spinner)    │
   └───────┬───────┘
           │ success
           ▼
   ┌───────────────┐
   │  COMPLETED    │  (items saved to activity_logs / food_logs)
   │  (green ✓)    │
   └───────┬───────┘
           │ regenerate day
           ▼
   ┌───────────────┐
   │  PENDING      │  (fresh plan replaces logged items)
   │  (blue/gray)  │
   └───────────────┘
```

**Behavior rules:**
1. A day starts as **PENDING** when generated
2. User can toggle individual activities/meals as **COMPLETED** (partial completion)
3. OR click "Complete All" to bulk-mark
4. On toggle → API call logs items → server returns success → UI updates to green
5. Completed items can be "un-completed" but this deletes the log entry
6. Regenerating a completed day resets it to PENDING (existing log entries remain, new plan supersedes future suggestions)

#### "Select Alternatives" UX (Meal Plans only)

When logging a meal item, the user might want to substitute an ingredient:

```
Current flow:
  "Log This Day" → batch logs all items → done

New flow:
  "Log This Day" →
    Shows confirmation dialog listing all items with "Alternative" link next to each →
    User can click "Alternative" on "chicken breast 200g" →
    Food search popup (reuses FoodSearch component) →
    User picks "tofu 200g" instead →
    Original item replaced in plan → logged with new item
```

**Key constraints:**
- Alternative must be from the existing food database (same constraint as generation)
- Using alternative doesn't regenerate the whole day — just swaps the item
- Portion is auto-calculated to match original item's calories ±20%
- "Select alternatives" is OPTIONAL — "Log All" button still works as before

---

### Category C: 1-Day Meal Plans (Target 3)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Meal plan scope** | 3 | 7-day plan (Mon-Sun) | 1-day plan (today only) |
| **Plan key** | 3 | `(user_id, week_start)` composite key | `(user_id, date)` composite key |
| **View** | 3 | Expandable day cards for 7 days | Single today card, 4 meals visible |

#### Why 1-Day?

1. **Daily relevance** — A meal plan for "next Tuesday" is useless; "what should I eat today?" is actionable
2. **Simpler UX** — No day navigation, no default-expand logic, single card
3. **Faster generation** — LLM generates 1 day instead of 7; fewer tokens, lower cost, lower latency
4. **Easier merging** — Single card fits inline in Food Log page without vertical space issues
5. **Meal plans are less reusable** than activity plans — you don't "follow a meal plan" across the week the same way

#### Database Impact

The `meal_plans` table uses `(user_id, week_start)` UNIQUE constraint. This needs to change to `(user_id, date)`:

```sql
-- Current (v1.4)
UNIQUE(user_id, week_start)

-- New (v1.5) — migration required
UNIQUE(user_id, date)
-- where `date` is a single DATE column replacing `week_start`
```

Alternatively, keep `week_start` but change semantics to be the single day's date. Cleaner: rename to `plan_date`.

#### Backend Impact

Current validation expects 7 days:
```javascript
// mealPlan.service.js
if (plan.days.length !== 7) {
  errors.push(`Expected 7 days but got ${plan.days.length}`);
}
```

New validation for 1-day:
```javascript
if (plan.days.length !== 1) {
  errors.push(`Expected 1 day but got ${plan.days.length}`);
}
```

The `regenerateDay(dayIndex)` endpoint becomes degenerate (only day 0) but worth keeping for API consistency.

#### Frontend Impact

- Current: `DayMealCard` with 7 expanded card → Single `DayMealCard` showing all 4 meals on one card
- No day navigation needed
- `MealRow` items show: name, portion, calories, logged status, and "alternative" link

---

### Category D: Auto-Generate on Visit (Target 4)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Auto-generate on page load** | 4 | Shows empty state with "Generate" button → user clicks → generates | On page load: check if plan exists → if not → auto-trigger generation |

#### Expected Behavior

```
Page load
  │
  ├── Has cached/DB plan? ──→ Display plan (respect TTL)
  │
  └── No plan exists ──→ Auto-trigger generate API
          │
          ├── Success ──→ Display plan
          │
          ├── Rate-limited ──→ Show rate-limit countdown (no empty state)
          │
          └── Error ──→ Show fallback plan (same as current) or error with retry
```

**Key UX rules:**
1. Auto-generation fires silently — no "Generating..." full-page spinner. Instead, show a subtle inline indicator (e.g., "Finding today's meals..." text replacing the plan area)
2. If rate-limited on auto-gen (e.g., user refreshed page quickly), show countdown timer instead of blank/empty state
3. Manual "Regenerate" button always visible — doesn't wait for auto-gen to finish
4. If LLM is down, fallback plan auto-generates (same as current behavior)

#### Rate Limit Handling on Auto-Gen

This is the trickiest part. If auto-gen hits rate limit:

```
Auto-gen fires → 429 response
    → UI shows: "Plan generation is rate-limited. Please wait X:XX to auto-generate."
    → Countdown timer displayed
    → When countdown hits 0 → auto-retry generation
    → User can navigate away and come back — timer persists if we track last attempt time
```

**Edge case:** User closes page during countdown, returns later. Auto-gen should fire again if enough time has passed (API returns 429 again if not). This is acceptable — the rate limiter is authoritative.

#### Auto-Gen Trigger Conditions

| Condition | Behavior |
|-----------|----------|
| No plan exists | Auto-generate immediately |
| Plan exists but is stale (>12h old, next day) | Auto-regenerate (1-day meal plan, regenerate weekly activity if new week) |
| Plan exists and is fresh | Display as-is |
| User just regenerated (within rate limit window) | Don't auto-gen — show existing plan |
| Rate-limited from previous session | Show countdown, auto-retry when window passes |

---

### Category E: Always-Visible Regenerate Button (Target 5)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Regenerate visibility** | 5 | Hidden/shown based on state | Always visible, behavior changes based on rate-limit state |
| **Rate-limit UX** | 5 | Full-page rate-limit state replaces content | Inline countdown on the regenerate button |

#### Current vs Desired UX

**Current (v1.4):**
- No plan → EmptyState with generate button
- Generating → spinner/disabled button
- Rate-limited → Entire page replaced with countdown screen
- Active plan → regenerate button inside each day card

**Desired (v1.5):**
- No plan → Auto-gen fires, inline spinner
- Generating → Inline spinner on button
- Rate-limited → Button shows "Wait X:XX" countdown (still clickable → shows tooltip)
- Active plan → Regenerate button always visible in section header

**Button behavior:**

| State | Label | Clickable | Visual |
|-------|-------|-----------|--------|
| Idle | "Regenerate" | Yes | Normal |
| Generating | spinner + "Generating..." | No | Disabled, spinner |
| Rate-limited (not generating) | "Wait 2:30" | No | Disabled, countdown text |
| Rate-limited (can retry) | "Regenerate" | Yes | Normal (countdown expired) |

---

## UX Considerations

### Pending vs Completed Visual States

**For Activity Plan days:**

| State | Background | Border | Text | Actions |
|-------|------------|--------|------|---------|
| Pending (not completed) | `#f3f4f6` (gray) | `#e5e7eb` | Normal | Complete toggle, Regenerate |
| Partially completed | `#fefce8` (yellow) | `#fef08a` | "2/3 activities done" | Complete remaining, Regenerate |
| Fully completed | `#f0fdf4` (green) | `#bbf7d0` | "✓ Completed · 45 min" | Undo complete, Regenerate |
| Regenerating | Same as pending | Dashed | spinner | Disabled |

**For Meal Plan items:**

| State | Background | Text | Actions |
|-------|------------|------|---------|
| Pending (not logged) | White/gray | Normal | Log, Select Alternative, Regenerate |
| Logged (completed) | `#f0fdf4` (green) | "✓ Logged 420 kcal" | Unlog, Select Alternative |
| Partially logged (per-meal) | Per-meal: green for logged, gray for pending | Mixed | Log remaining meals |

### Inline Management Actions

Each plan day should expose these actions without leaving the page:

**Activity Plan section (in Activities page):**

```
┌──────────────────────────────────────────────┐
│  Today's Activity Plan          [Regenerate] │
├──────────────────────────────────────────────┤
│  ☐ Morning Walk    30min moderate     [Log]  │
│  ☐ Stretching      15min light        [Log]  │
│                                              │
│  [✓ Mark All Complete]    [Regenerate Day]   │
└──────────────────────────────────────────────┘
```

**Meal Plan section (in Food Log page):**

```
┌──────────────────────────────────────────────┐
│  Today's Meal Plan              [Regenerate] │
├──────────────────────────────────────────────┤
│  Breakfast  420 kcal              [Log All]  │
│  ├─ oatmeal 200g (180 kcal)     ✓ Logged    │
│  └─ milk 150ml (240 kcal)       ✓ Logged    │
│                                              │
│  Lunch 650 kcal                  [Log All]  │
│  ├─ chicken 200g (330 kcal)  [Log] [Alt]    │
│  └─ rice 200g (260 kcal)      [Log] [Alt]   │
│                                              │
│  Dinner 600 kcal                 [Log All]  │
│  ...                                         │
│                                              │
│  Snack 250 kcal                              │
│  ...                                         │
│                                              │
│  [✓ Complete All Meals]                      │
└──────────────────────────────────────────────┘
```

### "Select Alternative" UX

Clicking "Alt" next to a meal item opens an inline food picker:

```
  ├─ chicken 200g (330 kcal)  [Log] [Alt]
       └─ [Alternative: ──────────────────▼]
          [Search foods...                ]
          ┌────────────────────────────────┐
          │ ○ Tofu (90 kcal/100g)          │
          │ ○ Fish fillet (130 kcal/100g)  │
          │ ○ Seitan (120 kcal/100g)       │
          │ ○ Egg (155 kcal/100g)          │
          └────────────────────────────────┘
          [Confirm Alternative]
```

**Rules:**
- Picker filters to same category (protein → proteins, carb → carbs) when possible
- Portion auto-adjusted: `newPortion = round(oldCalories / newFood.calories_per_100g * 100)`
- Picker closes on selection, item updates in place
- `calories` recalculated server-side on log

### Page Merge — Navigation Impact

**Dashboard navigation links (current):**
```
[Profile, BMI & TDEE] [Log Food] [Activity Recommendations] [Activity Plan] [Meal Plan]
```

**Dashboard navigation links (v1.5):**
```
[Profile, BMI & TDEE] [Log Food] [Activities]
```

Where "Log Food" includes merged meal plan, and "Activities" includes merged activity plan.

---

## Dependencies & Complexity

### Dependency Graph

```
Feature                          Depends On                        Complexity
───────                          ──────────                        ──────────
1. Auto-save activity plans      v1.3 activity_logs table          MEDIUM
   to activity_logs              v1.3 WeeklyPlanPage components
                                 Backend: batchLog for activities

2. Auto-save meals to food log   v1.4 batchLogItems,               MEDIUM
   with alternatives              v1.4 markItemsLogged
                                 v1.4 MealPlanPage components
                                 NEW: alternative picker UI
                                 NEW: per-item log API

3. 1-day meal plans              v1.4 mealPlan service             HIGH
                                 Migration: meal_plans table key
                                 Frontend: DayMealCard -> single day
                                 Validation: 7-day -> 1-day check

4. Auto-generate on visit        Feature 3 (1-day plans)          MEDIUM
                                 Feature 5 (rate-limit UX)
                                 State management: auto-trigger logic

5. Always-visible regenerate     Existing rate-limited UX          LOW
                                 Minor button state changes

6. Merge Activity Plan page      Feature 1 (auto-save)             HIGH
   into Activities page          Activities page refactor
                                 Router changes
                                 Component reorganization

7. Merge Meal Plan page          Feature 3 (1-day)                 HIGH
   into Food Log page            Feature 2 (auto-save)
                                 FoodLogPage refactor
                                 Router changes
                                 Component reorganization
```

### Complexity Matrix

| Feature | Backend Changes | Frontend Changes | DB Changes | Test Changes | Overall |
|---------|----------------|------------------|------------|--------------|---------|
| 1 | Medium (batch activity log) | Medium (complete toggle) | None (use existing) | Medium | **Medium** |
| 2 | Medium (per-item log, alternative) | High (picker UI, state) | None | Medium | **Medium-High** |
| 3 | Medium (validation, key) | Low-Medium (single day card) | Medium (migration) | High (update tests) | **High** |
| 4 | None (reuse existing) | Medium (auto-trigger logic) | None | Low | **Medium** |
| 5 | None | Low (button states) | None | Low | **Low** |
| 6 | None (routes only) | High (refactor, components) | None | High | **High** |
| 7 | None (routes only) | High (refactor, components) | None | High | **High** |

### Phase Ordering Recommendation

```
Phase A: 1-Day Meal Plans (Feature 3)     — Foundation change, must come first
Phase B: Always-Visible Regenerate (5)     — Quick win, low risk
Phase C: Auto-Save Activity Plans (1)      — Builds on existing activity_logs
Phase D: Auto-Save Meals + Alternatives (2) — Builds on feature 3
Phase E: Auto-Generate on Visit (4)        — Depends on plans existing
Phase F: Merge Activity Plan (6)           — Depends on feature 1 working
Phase G: Merge Meal Plan (7)               — Depends on features 2, 3 working
```

### Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Meal plan DB migration breaks existing data | HIGH | LOW | Run migration with backfill, keep read-compatibility for old format |
| Auto-gen on visit consumes rate limit too fast | MEDIUM | MEDIUM | Server-side idempotency: only count auto-gen as separate rate limit bucket or exempt it |
| Page merges create large unwieldy components | MEDIUM | HIGH | Extract sections into separate sub-components, keep each focused |
| "Select alternatives" adds significant UI complexity | HIGH | MEDIUM | MVP: simple dropdown, no fuzzy search. Enhance later |
| Changing from 7-day to 1-day breaks existing UIs referencing week_start | MEDIUM | MEDIUM | Keep old API endpoint working during transition, deprecate after |
| Merge causes CSS conflicts between plan cards and log forms | LOW | MEDIUM | Use consistent spacing, section dividers, same card border radius |

### Table Stakes for v1.5

Features users would expect after merge:

| Feature | Why Expected | Complexity | Current Status |
|---------|--------------|------------|----------------|
| **Plans auto-appear on page load** | "Why do I have to click Generate?" — obvious UX gap | MEDIUM | ❌ Missing |
| **One-click log from plan** | "Show me what to do, let me log it" — core value | MEDIUM | ✅ Partial (meal only, batch) |
| **Single-screen workflow** | Context switching between pages is friction | HIGH | ❌ Separate pages |
| **Plan adapts to today** | Yesterday's meal plan is irrelevant | MEDIUM | ❌ Weekly only |
| **Always available Regenerate** | "I don't like this suggestion" is natural | LOW | ❌ Hidden when rate-limited |
| **Completion tracking** | "Did I do this already?" — obvious status need | MEDIUM | ❌ Missing |

### Differentiators

| Feature | Value | Complexity |
|---------|-------|------------|
| **Smart alternatives constrained to DB** | Unlike generic planners, substitutes are from user's real food database | MEDIUM |
| **Auto-calculated portions on alternative** | "I want fish instead of chicken" → portion auto-adjusts to match calorie target | MEDIUM |
| **Rate-limit-aware auto-generation** | Auto-gen that respects quota without confusing user | MEDIUM |
| **Unified activity + plan view** | Single page shows both what you planned AND what you actually did | HIGH |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Drag-and-drop meal planning** | Too complex for v1.5, real-time sync issues | Click-based alternatives picker |
| **Meal prep / batch cooking mode** | Different use case from daily logging | Single-day meal focus |
| **Auto-log without confirmation** | User must own their food diary — auto-logging without consent erodes trust | Always require "Complete" toggle |
| **Fitness goal auto-adjustment from completed plans** | Observability → action loop is v2+ scope | Just track completion for now |
| **Calendar view for plans** | Over-engineered for mobile-first | Section-based page is sufficient |
| **Sharing plans** | Out of scope | Not needed |

### Key Decisions Summary

| Decision | Recommended | Rationale |
|----------|-------------|-----------|
| Page merge pattern | Section-based (not tabs) | Mobile-first, less state, contextual |
| Meal plan scope | 1-day only | Higher relevance, lower cost, simpler UX |
| Auto-gen trigger | Immediate on page load | No empty state, respects rate limits |
| Alternative selection | Inline dropdown per item | Lightweight, no modal/dialog complexity |
| Completion tracking | Per-item + "Complete All" | Flexible, handles partial logging |
| Completion reset on regenerate | Yes, regenerating a completed day resets to pending | Clean state model |
| Migrate old 7-day plans? | Read old format, write new format | Backward compatibility during transition |
| Rate-limit for auto-gen | Same rate limit bucket as manual gen | Simple, fair, no new infrastructure |
| Completed day un-log | Optional (v1.5 MVP: skip, defer to v1.6) | Keeps scope manageable |

---

## Sources

- **Existing v1.3 Activity Plan implementation (codebase):** WeeklyPlanPage.jsx, DayCard.jsx, llm.service.js — HIGH confidence
- **Existing v1.4 Meal Plan implementation (codebase):** MealPlanPage.jsx, DayMealCard.jsx, mealPlan.service.js — HIGH confidence
- **Existing Food Log (codebase):** FoodLogPage.jsx — HIGH confidence
- **Existing Activities page (codebase):** ActivitiesPage.jsx, ActivityLogForm.jsx — HIGH confidence

## Appendix: State Differences Between Current and Future

### Current State (v1.4)

```
User visits /weekly-plan → GET /api/weekly-plans
  ├── Plan exists → Display day cards (regenerate available, rate-limited state may block)
  └── No plan → Empty state → Click "Generate" → Plan appears

User visits /meal-plan → GET /api/meal-plans
  ├── Plan exists → Display 7 day cards (log/regenerate per day)
  └── No plan → Empty state → Click "Generate" → Plan appears

User visits /activities → GET /api/activities/recommendations + logs
  └── Manual log form + history
  └── /weekly-plan is a separate page

User visits /food-log → GET /api/food/daily-summary + logs
  └── Manual food search + log form
  └── /meal-plan is a separate page
```

### Future State (v1.5)

```
User visits /activities
  └── GET /api/activities/summary + history
  └── GET /api/weekly-plans (auto-trigger gen if none exists)
  └── Display:
      ├── Activity Summary
      ├── Today's Activity Plan (with complete toggles, always-visible regenerate)
      └── Activity Logging (manual form + history)

User visits /food-log
  └── GET /api/food/daily-summary + logs
  └── GET /api/meal-plans?date=today (auto-trigger gen if none exists)
  └── Display:
      ├── Calorie Summary
      ├── Today's Meal Plan (with complete toggles, alternatives, always-visible regenerate)
      └── Food Logging (manual search + log + history)
```
