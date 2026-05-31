# Feature Landscape — Calendar-Based Plan UI (v1.7)

**Domain:** Fitness App — Monthly Calendar Views for Activity Plans and Meal Plans
**Researched:** 2026-05-31
**Confidence:** HIGH (multiple health/fitness app patterns confirmed across MyFitnessPal, Strava, TrainingPeaks, Apple Health, habit trackers, and calendar library UX patterns)

---

## Overview

v1.7 replaces the existing section-based plan displays (ActivityPlanSection, DailyMealPlanSection embedded in Activities/Food Log pages) with standalone calendar-driven pages. The core shift: **plans move from "current week/day" sections to a browsable calendar that shows status at a glance across any month, past or future.**

This is a common UX evolution in health apps — once users have a plan generation workflow, they need to see their plan history, check what's upcoming, and understand their consistency over time. A calendar view is the standard solution.

**Key design constraint from PROJECT.md:** No backend API changes. The calendar must work with existing endpoints (`GET /api/activity-plan?date=...`, `GET /api/meal-plan?date=...`, swap, log). This means plan data is fetched per-day rather than per-month, which influences the calendar's data-fetching strategy.

**Two calendar pages:**
- **Activity Calendar** (`/activity-calendar`) — Month grid, color-coded by activity plan status
- **Meal Calendar** (`/meal-calendar`) — Month grid, color-coded by meal plan status

---

## Feature Analysis by Category

### Category A: Calendar Grid Foundation (Shared across both pages)

These are structural components that both calendars share.

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Month grid rendering** | CAL-01, CAL-02 | No calendar exists | 7-column grid (Mon-Sun), 4-6 rows, day numbers with color-coded background |
| **Month navigation** | CAL-01, CAL-02 | No navigation needed (single-week/daily view) | Previous/next month arrows + "Today" button |
| **Today indicator** | CAL-01, CAL-02 | N/A | Today's cell visually distinct (highlighted border or background) |
| **Day click → detail panel** | CAL-01, CAL-02 | N/A | Click day number/cell → opens slide-out or inline panel below calendar showing plan details for that day |
| **Color coding by status** | CAL-01, CAL-02 | N/A | Blue (incomplete/future plan), Green (completed/logged), Grey (past/missed/no data), no fill (future no plan) |
| **Past day read-only** | CAL-05 | N/A | Future/current days are interactive; past days show grey and cannot be modified |
| **Auto-generate on view today** | CAL-04 | Auto-gen on visit for today's plan (existing in ActivityPlanSection/DailyMealPlanSection) | Same behavior: when calendar opens on current month and today has no plan, auto-trigger generation |
| **Generate button** | CAL-03 | Generate button inside section header | Generate button positioned above calendar grid (weekly for activity, daily for meal) |
| **Loading/rate-limit states** | CAL-01, CAL-02 | Inline spinner + rate-limit countdown | Same patterns applied to generate button above calendar |

#### Month Grid Layout

Standard pattern (confirmed by react-big-calendar, shadcn calendar blocks, Apple Health, Strava calendar concepts, habit tracker patterns):

```
┌──────────────────────────────────────────────┐
│  ◀ February 2026 ▶  [Today]      [Generate] │
├────┬────┬────┬────┬────┬────┬────┤
│ Mo │ Tu │ We │ Th │ Fr │ Sa │ Su │
├────┼────┼────┼────┼────┼────┼────┤
│    │    │    │    │    │    │ 1  │
│    │    │    │    │    │    │    │
├────┼────┼────┼────┼────┼────┼────┤
│ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │
│ ██ │ ██ │ ██ │    │ ██ │ ██ │    │
├────┼────┼────┼────┼────┼────┼────┤
│ 9  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
│    │ ██ │ ██ │ ██ │    │ ██ │    │
├────┼────┼────┼────┼────┼────┼────┤
│ 16 │ 17 │ 18 │ 19 │ 20 │ 21 │ 22 │
│ ██ │ ██ │    │ ██ │ ██ │ ██ │    │
├────┼────┼────┼────┼────┼────┼────┤
│ 23 │ 24 │ 25 │ 26 │ 27 │ 28 │    │
│ ██ │ ██ │ ██ │    │ ██ │ ██ │    │
└────┴────┴────┴────┴────┴────┴────┘

Color key:
  Blue ██ = Has plan, incomplete
  Green ██ = Completed/logged
  Grey ██ = Past, no plan or missed
  (no fill) = Future, no plan yet
```

**Day cell anatomy** (shared pattern from habit trackers and calendar UI blocks):

```
┌─────────┐
│   17    │ ← Day number
│         │ ← Optional status dot/indicator
│  ████   │ ← Color-coded background fill
└─────────┘
```

**Key accessibility note:** Don't rely on color alone. Include text indicators or patterns alongside colors. Per UXmatters: "Pair colors with symbols or patterns... Always use high contrast between text and background."

#### Color Coding System

| Status | Color | Hex (recommended) | Meaning |
|--------|-------|-------------------|---------|
| Incomplete (has plan, not all done) | Blue | `#dbeafe` background, `#2563eb` border | Plan exists, activities/meals pending |
| Completed (all logged/completed) | Green | `#dcfce7` background, `#16a34a` border | All activities logged or meals consumed |
| Past/Missed (past date, no completion) | Grey | `#f3f4f6` background, `#d1d5db` border | Past day with no plan or plan not completed |
| Today | Distinct border | `#3b82f6` border (ring) or bold text | Always visually identifiable |
| Selected | Distinct border | `#6366f1` border / `#eef2ff` background | Currently clicked day |
| Future, no plan | No fill | Transparent / `#ffffff` | Nothing generated yet |

**Color psychology validation:** Green for completed = universally understood (health trackers, habit apps). Blue for pending/incomplete = calm, neutral, widely used (TrainingPeaks, habit trackers). Grey for past/missed = low emphasis, correct (Apple Health, Strava heatmaps). Red avoided because it implies urgency/error — not appropriate for optional missed days.

#### Month Navigation UX

| Control | Behavior | Notes |
|---------|----------|-------|
| ◀ Previous month | Decrement month, keep same day-of-month if valid | Animation: slide left |
| ▶ Next month | Increment month, keep same day-of-month if valid | Animation: slide right |
| "Today" button | Jump to current month, select today's cell | Only visible when not on current month |
| Month/year display | "MMMM yyyy" format (e.g., "February 2026") | Per Strava UX study, month+year dropdown is more intuitive than separate selectors |

**Navigation edge cases:**
- Jump from Jan 31 to Feb → lands on Feb 28 (or 29 in leap year)
- "Today" button hidden when viewing current month
- URL should encode year+month for shareability/browser-back (e.g., `?year=2026&month=5`)

#### Data-Fetching Strategy

Since backend endpoints are per-day (not per-month), the calendar needs a strategy to populate status for each day:

**Option A — Fetch on mount (recommended):**
On calendar mount or month change, fire parallel GET requests for all days in the month that have potential plans. For activities: existing `GET /api/activity-plan?date=...` but only need plan existence, not full data. For meals: existing `GET /api/meal-plan?date=...`.

**Challenges:**
- 28-31 requests per month is expensive
- Rate limits may be hit if each request counts toward limits

**Option B — Batch endpoint (ideal but backend constraint):**
A single `GET /api/activity-plan/month?year=2026&month=5` that returns status summaries for all days. But constraint says no API changes.

**Option C — Fetch-on-demand with lazy load:**
Show grid immediately (all days blank/no-fill). On mount, fetch the selected day (today's) plan and populate that cell. As user clicks days, fetch and populate. On month change, prefetch a few days. Only fetch plan data for visible+clicked days.

**Recommended: Option A with optimizations:**
1. Use `Promise.allSettled` to fire all 28-31 requests in parallel (they're independent)
2. Each endpoint returns cached plan immediately (fromCache: true) — no rate-limit impact if plan exists
3. Days without plans return 404/null quickly — no generation triggered
4. Only today's day triggers auto-generation (existing behavior)
5. Cache month's status data in React state/memory to avoid re-fetching on month re-visit

This is the standard pattern — TrainingPeaks and MyFitnessPal both load month data in bulk on navigation. The backend's `fromCache` flag (v1.3) makes this feasible without rate-limit problems.

---

### Category B: Activity Calendar Specifics (CAL-01, CAL-03, CAL-06)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Activity detail panel** | CAL-01 | DayCard component shows activities list with expand/collapse | Day click → panel showing same DayCard content (activities list, swap, complete toggle) |
| **Generate weekly button** | CAL-03 | Generate button in ActivityPlanSection generates single week | "Generate Week" button above calendar → generates plan for current week (Mon-Sun containing selected/today day) |
| **Swap activity** | CAL-06 | DayActivityRow has swap button → LLM replaces single activity | Same swap UX preserved in day detail panel |
| **Completion toggle** | CAL-01 | ActivityPlanSection has log button per activity | Same log toggle in day detail panel, with status reflected in calendar cell color |
| **Remove deprecated interactions** | CAL-08 | Single-day regenerate, old format handling | Remove: single-day regenerate button, old-format migration UI. Keep: swap |

#### What "Week" Means for Generate

The "Generate Week" button needs a clear scope:

```
Current week containing [selected day OR today]:
  Mon Tue Wed Thu Fri Sat Sun
  [─────── generated week ───────]
```

- If a day is selected, generate week containing that day
- If no day selected (or today), generate week containing today
- Week always runs Monday–Sunday (consistent with existing v1.6 variable-day plan format)
- The `availableDays` selector from v1.6 should be shown when Generate is clicked (or as a pre-generate step)
- After generation, the calendar updates to show plan status for all days in the generated week

**UX flow:**
```
User clicks "Generate Week" →
  Show days selector (Mon-Sun checkboxes, same as v1.6) →
  User selects available days, confirms →
  Generation API called →
  On success: calendar refreshes, generated days show blue (incomplete)
```

#### Day Detail Panel (Activity)

```
┌──────────────────────────────────────────────┐
│  Monday, February 17, 2026                   │
│  [Close]                                     │
├──────────────────────────────────────────────┤
│  Morning Jog        30min moderate    [Swap] │
│  ✓ Logged (45 kcal)                [Unlog]  │
│                                              │
│  Bodyweight Circuit  20min vigorous  [Swap]  │
│  [ ] Log to activity log           [Log]     │
│                                              │
│  ───────────────────────                     │
│  Total: 2 activities · 50 min                │
│  Calories: ~210 kcal                         │
│                                              │
│  [Mark All Complete]                         │
└──────────────────────────────────────────────┘
```

**Rules:**
- Same components reused: `DayActivityRow` for activity rows, swap button (with rate limit)
- "Mark All Complete" → batch logs all uncompleted activities
- Individual "Log" → logs single activity (existing `logActivities` API with single index)
- "Unlog" → removes from log (existing delete API or toggle)
- Past days (grey) show content but all actions disabled — view-only
- Rest days show the green "Rest Day" card (same as existing DayCard rest_day variant)

---

### Category C: Meal Calendar Specifics (CAL-02, CAL-03, CAL-07)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Meal detail panel** | CAL-02 | DailyMealPlanSection shows today's meals inline | Day click → panel showing same meal plan content (breakfast, lunch, dinner, snack with log actions) |
| **Generate daily button** | CAL-03 | Generate button in DailyMealPlanSection | "Generate Day" button above calendar → generates meal plan for selected day (or today if none selected) |
| **Log meal** | CAL-07 | DailyMealPlanSection has per-meal log button | Same per-meal "Log" action in day detail panel, with status reflected in calendar cell color |
| **Remove deprecated interactions** | CAL-08 | Meal plan alternative selector (not part of this release) | Remove alternative selector (it was v1.5, never existed in shipped code). Keep log interaction only. |

#### What "Day" Means for Generate

The "Generate Day" button generates a meal plan for a specific date:

```
User clicks "Generate Day" →
  Generation API called for selected date (or today) →
  On success: calendar refreshes, that day shows blue (incomplete)
  If today: auto-show detail panel with generated meals
```

- Generate always produces a 1-day meal plan (existing v1.5 pattern)
- If user clicks a different day's cell and that day has no plan, the generate button changes context to that day
- Generate button disabled for past dates (grey, read-only)

#### Day Detail Panel (Meal)

```
┌──────────────────────────────────────────────┐
│  Monday, February 17, 2026                   │
│  [Close]                                     │
├──────────────────────────────────────────────┤
│  ☀ Breakfast          420 kcal               │
│  ├─ Rolled oats 200g (180 kcal)  ✓ Logged   │
│  └─ Milk 150ml (240 kcal)       ✓ Logged    │
│                                              │
│  ☀ Lunch              650 kcal               │
│  ├─ Chicken 200g (330 kcal)      [Log]      │
│  └─ Rice 200g (260 kcal)         [Log]      │
│                                              │
│  ☀ Dinner             600 kcal               │
│  ├─ Salmon 180g (310 kcal)       [Log]      │
│  └─ Vegetables 200g (90 kcal)    [Log]      │
│                                              │
│  ☀ Snack              250 kcal               │
│  ├─ Greek yogurt 200g (250 kcal) [Log]      │
│                                              │
│  ───────────────────────                     │
│  Total: 4 meals · 1,920 kcal                 │
│                                              │
│  [Log All Meals]                             │
└──────────────────────────────────────────────┘
```

**Rules:**
- Same data model as existing DailyMealPlanSection: meals grouped by `meal_type` with items array
- Each item has: name, portion, calories, `logged` status
- "Log" button per item → existing `logMeals(today, [mealType])` API
- "Log All Meals" → batch logs all meal types
- Past days show content view-only (no log buttons)
- No alternative item swapping (removed per CAL-08)

---

### Category D: Auto-Generate on View Today (CAL-04)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Auto-gen on view today** | CAL-04 | ActivityPlanSection + DailyMealPlanSection auto-gen when visiting page | Both calendars: when landing on current month with no plan for today, auto-trigger generation for the relevant plan type |

**Behavior rules:**

```
Calendar mounts on current month →
  Check if today has plan (activity or meal, depending on page) →
    ├── Has plan → Display cell with color accordingly
    │
    └── No plan → Auto-trigger generate API
            │
            ├── Success → Update today's cell color, show detail panel
            │
            ├── Rate-limited → Show rate-limit countdown on generate button
            │
            └── Error → Show error state, allow manual retry
```

**Key UX rules (carried forward from v1.5 pattern):**
1. Auto-generation fires silently — subtle inline indicator on the generate button
2. Manual "Generate" button always available — doesn't wait for auto-gen
3. "Today" button auto-re-checks when navigating back to current month
4. Rate-limit countdown on generate button (same as existing `RateLimitedButton` component)

**Auto-gen trigger conditions:**

| Condition | Behavior |
|-----------|----------|
| Viewing current month, today has no plan | Auto-generate for today |
| Viewing past month | No auto-gen (past is read-only) |
| Viewing future month | No auto-gen (generate on demand via button) |
| Plan exists but different day selected | Display selected day's plan (if exists) or empty state |
| User just generated (within rate limit) | Don't auto-gen, show existing plan |

---

### Category E: Past Days Read-Only (CAL-05)

| Feature | Target | Current State | Desired State |
|---------|--------|---------------|---------------|
| **Past day interaction** | CAL-05 | Current plan sections only show today — no past day concept | Past days appear grey, clickable for view-only detail, no interactive actions enabled |

**Definition of "past":** Any date before today (UTC-based). Determined client-side via `new Date().toISOString().split('T')[0]` comparison.

**UX rules:**
1. Past day cells render with grey background (`#f3f4f6`)
2. Clicking a past day opens the detail panel in read-only mode
3. All action buttons (Log, Swap, Generate, Mark Complete) are hidden or disabled
4. Past days with completed plans show green (honoring the completion status), but still non-interactive
5. Past days with incomplete plans show grey (missed)
6. "Today" is the boundary — today is interactive, yesterday is not

This is consistent with every major fitness app's approach to past entries (MyFitnessPal, TrainingPeaks, Apple Health).

---

## UX Patterns Inventory

### Pattern 1: Calendar Grid with Status Colors

**What:** Month grid where each day cell's background color indicates plan status.
**When:** Both Activity and Meal Calendar pages.
**Components:**
- CalendarHeader — month/year display + navigation arrows + "Today" + Generate button
- CalendarGrid — 7-column CSS grid, day cells
- CalendarDayCell — individual day with number + color status
- CalendarDayName — header row (Mon-Sun)

**States per day cell:**

| State | Appearance | Clickable? | Detail panel shows |
|-------|------------|------------|-------------------|
| Future, no plan | No fill (white) | Yes | "No plan yet. Click Generate to create one." |
| Future, has plan, incomplete | Blue (`#dbeafe`) | Yes | Activity/meal cards with actions |
| Future, has plan, completed | Green (`#dcfce7`) | Yes | Activity/meal cards, all logged |
| Today, no plan | White with today ring | Yes | "Generating..." or "Click Generate" |
| Today, has plan | Blue or Green with today ring | Yes | Activity/meal cards |
| Past, had plan, completed | Green | Yes (read-only) | View-only plan detail |
| Past, had plan, not completed | Grey (`#f3f4f6`) | Yes (read-only) | View-only detail, "Not completed" |
| Past, no plan | Grey (lighter `#f9fafb`) | Yes (read-only) | "No plan for this day" |
| Selected | Distinct border/ring | — | Always open detail panel |
| Outside current month | Dimmed/transparent | Optional (can navigate) | N/A |

### Pattern 2: Day Detail Panel

**What:** Slide-out or inline panel below calendar that shows full plan detail for the selected day.
**When:** User clicks any day cell.

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Calendar Grid                                │
├──────────────────────────────────────────────┤
│  Detail Panel                                 │
│  ┌────────────────────────────────────────┐  │
│  │  [Date header]              [Close ✕] │  │
│  │                                        │  │
│  │  [Plan content — activity cards or     │  │
│  │   meal items with log/swap actions]    │  │
│  │                                        │  │
│  │  [Summary — totals, calories]          │  │
│  │                                        │  │
│  │  [Action bar — Mark Complete, Log All] │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**States:**

| State | Panel Content |
|-------|---------------|
| Loading | "Loading plan for [date]..." with spinner |
| Has plan (future/today) | Activity cards or meal items with interactive buttons |
| Has plan (past) | Same cards/items, all buttons disabled/hidden |
| No plan (future), can generate | "No plan for [date]. [Generate]" button |
| No plan (past) | "No plan for this date." static message |
| Generating | Inline "Generating..." spinner |
| Rate-limited | "Generation rate-limited. Please wait X:XX." countdown |
| Error | Error message with retry button |

**Transition:** On day click, panel slides down from calendar (CSS transition `max-height` or `transform`). Selection state updates immediately. Panel should not cause page scroll jump — calendar maintains position.

### Pattern 3: Generate Button (Contextual)

**What:** Primary action button above calendar that triggers plan generation.
**When:** Always visible (but state changes based on context).

**Activity Calendar:** "Generate Week" — generates plan for the week containing the selected day (or today).
**Meal Calendar:** "Generate Day" — generates plan for the selected day (or today).

**Button states:**

| State | Label | Behavior |
|-------|-------|----------|
| Default | "Generate Week" / "Generate Day" | Click → days selector (activity) or direct gen (meal) |
| Generating (activity) | "Generating Week..." | Spinner, disabled |
| Generating (meal) | "Generating..." | Spinner, disabled |
| Rate-limited (activity) | "Wait X:XX" | Disabled, countdown |
| Rate-limited (meal) | "Wait X:XX" | Disabled, countdown |
| Past date selected | Hidden/disabled | Cannot generate for past |

### Pattern 4: Month Navigation

**What:** Controls to switch between months.
**When:** Always visible in calendar header.

**Controls:**
- ◀ (left arrow): Previous month
- Month/Year title (clickable, optional): Month/year picker (stretch goal)
- ▶ (right arrow): Next month
- "Today" button: Jump to current month (only shown when not on current month)

**Behavior:**
- Arrow clicks navigate one month at a time
- URL updates with `?year=YYYY&month=M` for deep-linkable state
- Calendar re-fetches plan status data for new month
- Selected day resets to first day of month (or today if current month)
- Detail panel closes on month change

---

## Table Stakes vs Differentiators vs Anti-Features

### Table Stakes (Users Expect These)

Features users expect from a calendar-based health plan view. Missing these = feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Month grid with day numbers** | Every calendar starts here — non-negotiable | LOW | Standard 7-column grid, 42 cells max |
| **Current day highlighted** | Users need to orient themselves immediately | LOW | Distinct border or background on today |
| **Status color coding** | Primary value of calendar view — "how am I doing at a glance" | LOW | Blue/green/grey per consistent scheme |
| **Click day to see details** | Fundamental calendar interaction pattern | MEDIUM | Slide-out or inline panel |
| **Navigate between months** | Users need to check past/future plans | LOW | Previous/next arrows + Today button |
| **Read-only past days** | Cannot edit the past — baseline expectation | LOW | Grey styling, disabled actions |
| **Generate button visible** | Users need to initiate plan creation | LOW | Contextual "Generate Week" / "Generate Day" |
| **Auto-gen on empty today** | "Why do I have to click Generate?" — existing v1.5 pattern | MEDIUM | Carry forward existing behavior |
| **Loading states** | Skeleton/loading indicators during data fetch | LOW | Existing patterns from current pages |
| **Rate-limit UX** | LLM generation is rate-limited — user must know why button is disabled | MEDIUM | Existing RateLimitedButton pattern |
| **Activity swap preserved** | Core interaction from v1.6 — removing it breaks workflow | MEDIUM | Same DayActivityRow swap in detail panel |
| **Meal log preserved** | Core interaction from v1.4/1.5 — one-click log to food diary | MEDIUM | Same per-meal log in detail panel |
| **Past/completed data visible historically** | "What did I do last Tuesday?" — basic archival need | MEDIUM | Past day click shows view-only plan |
| **"Generate" for activity means weekly** | v1.6 established weekly activity plans — consistent | MEDIUM | Generate creates Mon-Sun week |
| **"Generate" for meal means daily** | v1.5 established 1-day meal plans — consistent | LOW | Generate creates single-day plan |
| **Error state for failed load** | Network/API failures — user needs feedback | LOW | Error message + retry |
| **Empty state for no plan** | Clicking future day without plan — user needs guidance | LOW | "No plan — click Generate" message |

### Differentiators (Competitive Advantage)

Features that set this calendar UX apart from generic planners or competitors.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **LLM-generated plans accessible through calendar history** | Past months show what the AI recommended — unique compared to manual-only planners | MEDIUM | Existing backend, just rendered in calendar |
| **Per-activity swap in calendar detail** | Can change individual activities from within calendar view — no need to regenerate entire week | MEDIUM | Existing v1.6 swap, just re-placed |
| **Unified completion status across calendar and logs** | Calendar shows what you planned AND what you actually did — integrated view | HIGH | Requires cross-referencing plan data with activity_logs / food_logs tables |
| **Two calendar types (activity + meal) in single app** | Most apps do one or the other — having both with consistent visual language is uncommon | MEDIUM | Shared calendar components reduce duplication |
| **Auto-gen context-aware (generates for the week/day you're viewing)** | Not just "generate for today" but generates for the temporal context you're browsing | MEDIUM | Generate button adapts based on selected day |
| **Color coding distinguishes "has plan" from "completed" from "missed"** | Three-way status (vs binary completed/not) gives richer feedback | LOW | Simple three-color scheme but adds significant value |
| **Month navigation persists selection — can browse and compare** | Compare your plan adherence across months | MEDIUM | URL-based month state, easy to implement |
| **Rest days visually distinct in calendar** | v1.6 rest day concept integrated into calendar cells | LOW | Check rest_day flag, potentially show "R" or dot |

### Anti-Features (Explicitly NOT Building)

Features that seem useful but would add cost/risk without commensurate value for v1.7.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Drag-and-drop activity scheduling** | Users want to rearrange activities visually | Requires complex DnD library + real-time state sync + backend changes (constraint: no API changes) | Click-based swap (existing) |
| **Week/agenda view toggle** | More view options = more flexibility | Adds significant component complexity; month grid alone is sufficient for plan overview | Single month view optimized for the use case |
| **Custom activity entry from calendar** | Users want to add ad-hoc activities | Out of scope (PROJECT.md: "Custom activity entry — deferred") | Activity pool + manual log remain on Activities page |
| **Edit logged entries from calendar** | Fix mistakes inline | Delete-and-recreate is sufficient per project decision | Keep existing delete-from-history pattern |
| **Streak counter / GitHub heatmap** | Motivational gamification | Separate feature, not core to plan viewing; adds state complexity | Stretch goal for later milestone |
| **Month-to-month comparison charts** | Trend analysis | v2+ feature; would need new analytics queries | Not needed for v1.7 |
| **Infinite scroll year view** | See entire year at once | Performance heavy, adds scroll complexity, not common in health apps | Single month with navigation |
| **Recurring plan templates** | "Same plan every week" | LLM generation is inherently variable — templating adds schema complexity | Generate new each week, or store favorite plan |
| **Export calendar to iCal/PDF** | Share or print plan | Edge use case, extra library dependency, not core | Defer to v2+
| **Dark mode for calendar** | Aesthetic preference | Minor styling concern; no semantic value | If existing app supports dark mode, calendar inherits |
| **Animations/transitions between months** | Polished feel | Adds render complexity, potential for glitches | Simple instant swap or simple CSS transition |

---

## Feature Dependencies

### Component Dependencies

```
Category A: Calendar Grid Foundation
    └── requires──> date-fns (for date math, month grid generation)
    └── requires──> Existing use of date-fns in frontend (already in dependencies)

ActivityCalendarPage
    ├── requires──> Category A (Calendar Grid Foundation)
    ├── requires──> DayCard component (activity card rendering, swap, log)
    ├── requires──> DayActivityRow (per-activity display with swap button)
    ├── requires──> activityPlanApi (getActivityPlan, generateActivityPlan, logActivities)
    ├── requires──> RateLimitedButton (rate-limit UX for swap and generate)
    └── enhances──> ActivityPlanSection (replaces it — ActivityPlanSection is NO LONGER RENDERED)

MealCalendarPage
    ├── requires──> Category A (Calendar Grid Foundation)
    ├── requires──> MealRow component (meal item display with log action)
    ├── requires──> dailyMealPlanApi (getDailyMealPlan, generateDailyMealPlan, logMeals)
    ├── requires──> RateLimitedButton (rate-limit UX for generate)
    └── enhances──> DailyMealPlanSection (replaces it — DailyMealPlanSection is NO LONGER RENDERED)
```

### Data Dependencies

```
Calendar Status Computation
    ├── requires──> Plan data (activity or meal) per day from backend
    ├── requires──> Completed status: plan's `logged: true` per item or batch
    └── requires──> Cannot determine "missed" without knowing user had a plan (plan exists + past date + not completed)

Activity Calendar Cell Status:
    ├── Plan exists + all activities logged    → Green (completed)
    ├── Plan exists + some/none logged         → Blue (incomplete)
    ├── No plan exists + past date             → Grey (missed/no data)
    └── No plan exists + future/today          → White (no plan, may auto-gen)

Meal Calendar Cell Status:
    ├── Plan exists + all meals logged         → Green (completed)
    ├── Plan exists + some/none logged         → Blue (incomplete)
    ├── No plan exists + past date             → Grey (missed/no data)
    └── No plan exists + future/today          → White (no plan, may auto-gen)
```

### Dependency Graph

```
v1.7 Calendar Features
    │
    ├── [A] Calendar Grid Foundation
    │   └── requires: date-fns (existing)
    │
    ├── [B1] Activity Calendar
    │   ├── requires: [A]
    │   ├── requires: DayCard, DayActivityRow (existing, from weekly-plan/)
    │   ├── requires: activityPlanApi (existing)
    │   └── replaces: ActivityPlanSection (remove)
    │
    ├── [B2] Meal Calendar
    │   ├── requires: [A]
    │   ├── requires: MealRow (existing, from meal-plan/)
    │   ├── requires: dailyMealPlanApi (existing)
    │   └── replaces: DailyMealPlanSection (remove)
    │
    ├── [C] Remove Deprecated Interactions
    │   └── requires: [B1] and [B2] implemented first (as replacement)
    │
    ├── [D] Navigation Updates
    │   └── requires: [B1] and [B2] (new routes must exist)
    │
    └── [E] Test Updates
        └── requires: all of the above
```

### Dependency Notes

- **[A] Calendar Grid Foundation must come before [B1] and [B2]:** Both calendar pages share the same grid component. Build it once, reuse.
- **[B1] Activity Calendar and [B2] Meal Calendar are independent:** Can be built in parallel or sequentially after [A]. They share the grid but differ in detail panel content and plan type.
- **[C] Remove deprecated interactions should come AFTER [B1] and [B2]:** The old sections must be replaced before their interactions can be removed. This includes removing `ActivityPlanSection.jsx` and `DailyMealPlanSection.jsx` from the Activities/Food Log pages, and deleting associated tests for removed features.
- **[D] Navigation updates after pages exist:** Routes `/activity-calendar` and `/meal-calendar` must exist before dashboard links can point to them.
- **No API changes needed:** This is stated as a hard constraint in PROJECT.md. All data fetching uses existing endpoints.

---

## Complexity Matrix

| Feature | Backend Changes | Frontend Changes | Test Changes | Overall |
|---------|----------------|------------------|--------------|---------|
| A1: Calendar Grid Component | None | MEDIUM (new shared CalendarGrid component, month navigation, day cell rendering) | HIGH (new component tests) | **MEDIUM** |
| A2: Per-Day Status Fetching | None | MEDIUM (batch fetch for 28-31 days, status computation, caching) | MEDIUM (fetch logic, status derivation) | **MEDIUM** |
| B1: Activity Calendar Page | None | HIGH (new page, integrate Grid + DayCard, generate-week flow, replace ActivityPlanSection) | HIGH (page integration, interactions) | **HIGH** |
| B2: Meal Calendar Page | None | HIGH (new page, integrate Grid + MealRow, generate-day flow, replace DailyMealPlanSection) | HIGH (page integration, interactions) | **HIGH** |
| C1: Remove Deprecated Interactions | None | LOW (delete old sections, remove regenerate-day button, remove alternative selector) | HIGH (remove associated tests) | **MEDIUM** |
| C2: Route/Nav Updates | None | LOW (add `/activity-calendar`, `/meal-calendar` routes, update nav links) | LOW (route tests) | **LOW** |
| C3: Past Day Read-Only | None | LOW (date comparison, conditionally disable buttons in detail panel) | MEDIUM (past-day behavior tests) | **LOW-MEDIUM** |

### Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **28-31 parallel requests on month load** | Performance: UI may stutter; rate limiter may trigger | MEDIUM | Use `Promise.allSettled`, cache results, add brief loading state spinner on first load |
| **Calendar grid CSS complexity** | Cross-browser layout issues, responsive breakpoints | MEDIUM | CSS Grid (browser-native, widely supported), test at 3 viewport widths |
| **Day cell click conflicts** | User clicks day number vs empty cell space | LOW | Make entire cell clickable (min 44px touch target) |
| **Date/timezone inconsistencies** | "Today" computation differs between server and client | MEDIUM | Use client-side UTC date for display; dates sent to backend as ISO strings (already proven pattern in existing code) |
| **Auto-gen on month load fires more than intended** | Rate limit consumed too fast | MEDIUM | autoGenGuard ref pattern (already exists in ActivityPlanSection/DailyMealPlanSection) |
| **Removing ActivityPlanSection breaks existing interactions** | Users lose ability to see plan on Activities page | HIGH | Calendar page BECOMES the activity plan view — full replacement, not addition |
| **Calendar detail panel reuses old components with unexpected side effects** | DayCard or MealRow may dispatch actions not intended for calendar context | MEDIUM | Wrap/adapt components; test interactions specifically in calendar context |
| **Month navigation loses selected day state** | User navigates months, returns, selection lost | LOW | Store `selectedDate` in React state + URL params |

---

## MVP Definition

### v1.7 Launch With

Minimum viable calendar plan UI. These are the features that make the calendar useful.

- [x] **Month grid foundation** — CalendarGrid component with day cells, day name headers, month navigation
- [x] **Status color coding** — Blue (incomplete), Green (completed), Grey (past/missed), Today highlight
- [x] **Activity Calendar page** — `/activity-calendar` route, grid + detail panel with DayCard content
- [x] **Meal Calendar page** — `/meal-calendar` route, grid + detail panel with MealRow content
- [x] **Generate Week button (activity)** — Above activity calendar, generates Mon-Sun week for context
- [x] **Generate Day button (meal)** — Above meal calendar, generates single-day plan
- [x] **Auto-generate on view today** — If today has no plan, auto-trigger generation
- [x] **Past day read-only** — Grey rendering, disabled actions
- [x] **Day click → detail panel** — Slide-out/inline panel showing plan content
- [x] **Activity swap in detail panel** — Same DayActivityRow swap button (v1.6)
- [x] **Meal log in detail panel** — Same per-meal log button (v1.4/1.5)
- [x] **Navigation update** — Update dashboard nav to point to calendar pages
- [x] **Remove old sections** — Remove ActivityPlanSection and DailyMealPlanSection from Activities/Food Log pages

### Add After Validation (v1.7.x within milestone)

Features to add once core calendar is working.

- [ ] **Month picker dropdown** — Click month/year title to jump to specific month (not just arrows)
- [ ] **Legend/key** — Visual color legend explaining blue/green/grey
- [ ] **Week numbers** — Show ISO week number on each row (left column)
- [ ] **Day count summaries** — "12 completed, 3 missed this month" below calendar
- [ ] **Selected day persists through generate** — After generating, keep detail panel open showing new content
- [ ] **URL-based month state** — `?year=2026&month=5` for deep linking and back-button support

### Future Consideration (v2+)

Features to defer until calendar UX is validated.

- [ ] **Week/agenda view** — Additional view modes beyond month grid
- [ ] **Streak counter heatmap** — GitHub-style contribution graph
- [ ] **Month-over-month comparison** — "You completed 75% of activities this month vs 60% last month"
- [ ] **Calendar export (iCal/PDF)** — Share plan externally
- [ ] **Drag-and-drop rescheduling** — Move planned activities between days
- [ ] **Year overview** — 12-month mini-grid view
- [ ] **Custom day notes/reflection** — "Felt tired today" text entry attached to date

---

## Shared Calendar Component API

### Proposed Component Interface

Since both activity and meal calendars share the same grid, navigation, and status display logic, a shared `CalendarGrid` component should be created:

```jsx
// Shared calendar component props
<CalendarGrid
  year={2026}
  month={5}  // 0-indexed (0=January)
  selectedDate="2026-05-17"
  onSelectDate={(dateStr) => {}}
  getDayStatus={(dateStr) => {
    // Returns: 'no-plan' | 'incomplete' | 'completed' | 'past-missed'
  }}
  renderDayContent={(dateStr) => {
    // Optional: render content inside each day cell (e.g., activity count dot)
  }}
  renderDayDetail={(dateStr, status) => {
    // Renders the detail panel below calendar for selected day
  }}
  generateButton={{
    label: 'Generate Week' | 'Generate Day',
    onClick: () => {},
    disabled: boolean,
    loading: boolean,
    retryAfter: number | null,
  }}
/>
```

This separation keeps calendar logic reusable while letting each page customize detail panel rendering and generate behavior.

---

## Sources

- **Existing v1.3-1.6 codebase (codebase):** WeeklyPlanPage.jsx, DayCard.jsx, DayActivityRow.jsx, activityPlanApi.js — HIGH confidence
- **Existing v1.4-1.5 codebase (codebase):** DailyMealPlanSection.jsx, MealRow.jsx, dailyMealPlanApi.js — HIGH confidence
- **Existing v1.6 ActivityPlanSection.jsx (codebase):** Section-based plan display being replaced — HIGH confidence
- **react-big-calendar (npm/gh):** Month view pattern, date-fns localizer, event/day click handling — HIGH confidence
- **shadcn/ui calendar blocks (shadcn.io):** Monthly view with event dots, habit tracker, training program, meal planner patterns — MEDIUM confidence (design inspiration)
- **Habit tracker calendar patterns (RapidNative):** Day cell states, color coding (blue=incomplete, green=completed), today highlight, streak display — MEDIUM confidence
- **TrainingPeaks color coding (user voice):** Three-way status (completed, incomplete, missed), complaints about color ambiguity (red for both over-completion and missed) — MEDIUM confidence
- **Strava calendar UX case study (mreniewicki.com):** Month/year dropdown usability testing, day selection pattern, integration with activity history — HIGH confidence
- **MyFitnessPal redesign analysis (Medium):** Calendar/diary patterns, progress visualization, color use for nutrition data — MEDIUM confidence
- **Apple Health / Strava heatmap patterns (multiple sources):** Color-coded activity density, monthly grid navigation — MEDIUM confidence
- **Color psychology for fitness apps (UXmatters, PaletteRx):** Green=completion, Blue=calm/neutral, Grey=inactive — HIGH confidence
- **@gentleduck/calendar (GitHub):** `buildCalendarMonth` pure function pattern, day cell metadata (isToday, isOutside, isWeekend) — MEDIUM confidence
- **UX Patterns (uxpatterns.dev):** Calendar View pattern — header, date grid, event cell, selection state — HIGH confidence

---
*Feature research for: Calendar-Based Plan UI (v1.7)*
*Researched: 2026-05-31*
