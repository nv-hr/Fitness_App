# Project Research Summary

**Project:** Fitness_App — v1.8 UI Consolidation
**Domain:** Health/Fitness — Calendar + Manual Data Entry Page Merge
**Researched:** 2026-06-01
**Confidence:** MEDIUM (due to significant divergence on layout strategy)

## Executive Summary

This milestone merges the standalone Activity Calendar and Meal Calendar pages into their respective manual-log pages (Activity page, Food Log page) — a pure UI restructuring with no new features and no backend changes. Three parallel research agents analyzed the problem from different angles: layout patterns (STACK), industry UX conventions (FEATURES), and codebase architecture (ARCHITECTURE), plus a fourth agent cataloged implementation risks (PITFALLS).

**The central finding is a significant research divergence.** The STACK researcher concluded that **tabs** ("Manual Log" / "Calendar") are the best layout pattern — clean separation, works at 600px max-width, no new dependencies. The FEATURES researcher explicitly calls tabs an **anti-pattern**, citing industry evidence that tabs create the same friction as separate pages, and recommends **scroll-based date-scoped layouts** (horizontal day selector for Food Log, collapsible month grid for Activity). The ARCHITECTURE researcher also rejects tabs, recommending a **Calendar Detail Panel Enhancement** strategy where the calendar stays as primary navigation and manual log features are embedded in the day detail panel slot. All three agree on one thing: **no new dependencies are needed** — the existing React 19 + CSS Grid + TanStack Query + date-fns stack is sufficient.

**The key risk** is dual auto-generation conflict (P-01): merging two pages that each auto-generate plans on mount creates duplicate API calls, rate-limit consumption, and stale data overwrites. This must be resolved by gating auto-generation through a single mechanism. Additionally, 14 existing tests will break and need replacement.

**The recommended path forward:** The divergence is real but can be reconciled by treating the two pages differently — the Activity page benefits from a collapsible month-grid layout (aligning FEATURES and ARCHITECTURE), while the Food Log page can adopt the industry-standard horizontal day selector (aligning FEATURES with simpler implementation). This should be validated during requirements definition before locking in the layout strategy.

## Key Findings

### Recommended Stack

The existing React 19 + Vite 8 + TanStack React Query + date-fns + react-day-picker v9 + CSS Grid (inline styles) stack fully covers the UI consolidation. No new dependencies are needed.

**Core technologies:**
- **React 19 useState**: Tab/selection state management — built-in, no extra libraries
- **CSS display: none** (over conditional rendering): Preserves CalendarPageLayout's internal state (`currentMonth`, `selectedDay`) across view switches
- **TanStack React Query cache** (staleTime: 5min): Prevents re-fetch when switching back to calendar view
- **Existing CalendarPageLayout slot pattern**: `DayDetailPanel` via `children` — already designed for embedding manual log components
- **Existing inline styles**: Tab buttons styled like existing buttons (minHeight 44px, border, borderRadius) — no CSS framework needed

**React 19 `<Activity>` component** (formerly `<Offscreen>`) is a potential optimization but **confidence is LOW** — needs verification against the project's React 19 version before relying on it.

### Expected Features

The industry has converged on **scroll-based single-page layouts scoped to a selected date**, used by MyFitnessPal, Lose It!, Cronometer, and NutriPro. Two distinct patterns emerged:

**For the Activity page (collapsible month grid + daily detail):**
- Month grid at top (collapsible on mobile) with color-coded days
- Below: daily activity log for the selected day
- "Generate Week" stays as a calendar-level action
- Per-section [+] buttons for manual activity logging
- Activity History at bottom (last 7 days from today)

**For the Food Log page (horizontal day selector + scroll log):**
- Horizontal scrolling day-picker strip at top
- Daily summary card below it
- Per-meal-type sections (Breakfast, Lunch, Dinner, Snack) with [+] add buttons
- "Generate Day" button next to date selector
- No monthly grid — food logging is retrospective, not prospective

**Table-stakes UX expectations (both pages):**
- Date context always visible (date navigator + section headers)
- Quick entry per section (not just global FAB)
- Meaningful empty states ("No activities logged yet. Tap + to add one.")
- Summary at top, detail below
- Days with logged data have visual indicators
- Today button to jump back

**Defer (v2+):**
- Shared global "selected date" across pages (URL param or context) — not in scope for v1.8
- Scroll position memory / collapsibility persistence — nice-to-have
- Swipe-between-days gesture — adds complexity beyond "minimal"
- "Copy from yesterday" quick-entry — valuable but scope creep

### Architecture Approach

**Critical architectural fact: CalendarPageLayout is uncontrolled.** It owns its own `currentMonth` and `selectedDay` state internally (via `useState`), and notifies the parent via `onMonthChange`/`onDaySelect` callbacks. The parent cannot control or preset the selected day — it can only react. This means:

1. On initial page load, no day is selected (`selectedDay = null`), so the DayDetailPanel shows "Select a day" — and manual log data for today would not load automatically
2. Adding an optional `defaultDay` prop to CalendarPageLayout is the recommended minimal fix (backward-compatible, defaults to `null`)
3. The parent tracks `selectedDate` separately (derived from `onDaySelect`) to drive API fetches for manual log data

**Major components:**
1. **CalendarPageLayout** (shared/calendar/) — Uncontrolled state owner for month/day selection. Contains MonthNav + CalendarGrid + DayDetailPanel (slot).
2. **CalendarGrid** (shared/calendar/) — Pure presentational, wraps react-day-picker. No changes needed.
3. **DayDetailPanel** (shared/calendar/) — Slot-based children renderer. Target for embedding manual log forms. No changes needed.
4. **useMonthData / useMonthMealData** (hooks) — Independent TanStack Query hooks for day-status color mapping. No cache conflict. No changes needed.
5. **ActivityCalendarPage** (features/activities/) — Already at `/activities` route. Needs manual log features added to DayDetailPanel slot. `ActivitiesPage.jsx` is dead code — extract patterns, then delete.
6. **MealCalendarPage** (features/food-log/) — Will be merged into FoodLogPage. Delete after merge. Route redirect from `/meal-calendar` → `/food-log`.
7. **FoodLogPage** (features/food-log/) — Currently today-only. Needs date-awareness and CalendarPageLayout embedding.

**Route changes needed:**
| Current Route | Action |
|---|---|
| `/activities` | Enhance with manual log features (stays) |
| `/food-log` | Enhance with calendar/date navigation (stays) |
| `/meal-calendar` | Remove + add `<Navigate to="/food-log" replace />` redirect |

**Note:** PROJECT.md mentions `/activity-calendar` route removal (UI-03), but ARCHITECTURE research confirms that route doesn't exist — the activity calendar is served at `/activities`. The PROJECT.md entry needs correction.

### Critical Pitfalls

1. **P-01: Dual Auto-Generation Conflict** — Two independent auto-generation systems (Calendar page + PlanSection) fire on mount, causing duplicate API calls and rate-limit hits. **Prevention:** Deactivate PlanSection's auto-gen; Calendar's auto-gen takes precedence with tab-visibility guard (`isActive` prop).

2. **P-02: 14 Tests Will Break** — `ActivityCalendarPage.test.jsx` (7 tests) and `MealCalendarPage.test.jsx` (7 tests) test page-level elements that move or disappear. `ActivitiesPage.test.jsx` (5 tests) is also at risk. **Prevention:** Don't just delete — migrate useful assertions to new merged-page test files.

3. **P-04: State Explosion** — Merging two page-level components creates 18-19 `useState` variables with 33+ `setState` call sites in one render cycle. **Prevention:** Extract calendar section into its own wrapper component with minimal props interface; use `React.memo`; consider `useReducer` for calendar state.

4. **P-09: Past-Day UX Inconsistency** — Calendar enforces past-day read-only, but the target log form has no concept of "selected day" and always shows today. Selecting a past day on the calendar leaves the log form showing today's data. **Prevention:** Connect log form's target date to calendar's `selectedDay`; disable logging for past days; show "no data" for future days.

5. **P-05: CalendarPageLayout's Dual State Ownership** — Internal state (`currentMonth`/`selectedDay`) plus external callbacks (`onMonthChange`/`onDaySelect`) create two sources of truth that can diverge when the parent programmatically changes the month. **Prevention:** Make CalendarPageLayout optionally controlled (accept `currentMonth`/`selectedDay` as props when provided, use internal state otherwise) — backward-compatible minimal change.

6. **P-12: Scroll Position Loss** — Merged pages could reach 1800-2600px of content. DayDetailPanel expansion/collapse shifts content below. **Prevention:** Wrap calendar section in a container with `max-height` + `overflow-y: auto`; collapsible calendar on mobile; keep DayDetailPanel within the calendar section container.

## Implications for Roadmap

### Phase 1: Route Configuration & Export Cleanup
**Rationale:** Safe mechanical changes that don't affect component logic. Do this first to unblock everything else.
**Delivers:** Updated Router.jsx, barrel exports, navigation links, redirect setup.
**Addresses:** UI-03 (route removal)
**Avoids:** P-03 (broken navigation links), P-11 (import path restructuring)
**Specific work:**
- Remove `MealCalendarPage` from food-log barrel export (keep redirect export)
- Add `<Route path="/meal-calendar" element={<Navigate to="/food-log" replace />} />`
- Update DashboardPlaceholder `/meal-calendar` link → `/food-log`
- Update PROJECT.md to correct route names (`/activities` not `/activity-calendar`)
- **Research flag: LOW** — standard React Router config, well-documented patterns

### Phase 2: Component Extraction & CalendarPageLayout Enhancement
**Rationale:** Must happen before merging to avoid state explosion (P-04) and enable clean integration.
**Delivers:** Extracted `<ActivityCalendarSection>` and `<MealCalendarSection>` wrapper components; CalendarPageLayout `defaultDay` prop; singleton style injection utility.
**Addresses:** Architectural prerequisite for both merges
**Avoids:** P-04 (state explosion), P-05 (dual state ownership), P-07 (style injection duplication)
**Specific work:**
- Extract calendar section from ActivityCalendarPage into `<ActivityCalendarSection>` wrapper (self-contained state)
- Extract calendar section from MealCalendarPage into `<MealCalendarSection>` wrapper
- Add optional `defaultDay` prop to CalendarPageLayout (backward-compatible)
- Extract swap-spin style injection into singleton utility
- **Research flag: LOW-MEDIUM** — component extraction is standard React, but CalendarPageLayout's internal state makes extraction slightly nuanced. May need `/gsd-discuss-phase` during planning to confirm extraction boundaries.

### Phase 3: Food Log Merge (Structural — Higher Risk)
**Rationale:** Architectural risk is highest here (date-awareness generalization, CalendarPageLayout embedding in a non-calendar page). Starting here surfaces issues early.
**Delivers:** Merged FoodLogPage with calendar navigation and date-aware manual logging.
**Addresses:** UI-02 (Meal Calendar → Food Log)
**Avoids:** P-01 (dual auto-gen — deactivate DailyMealPlanSection auto-gen), P-09 (past-day consistency — connect log form date to selectedDay)
**Specific work:**
- Add `selectedDate` state to FoodLogPage, initialize to today
- Add `handleDaySelect` callback
- Embed CalendarPageLayout **OR** horizontal day selector — **THIS IS THE KEY DECISION POINT** (see decision flag below)
- Wire DayDetailPanel slot: meal plan + compact log form
- Generalize API calls from `today` to `selectedDate`
- Keep CalorieHistory date-agnostic (still from today)
- **Decision point:** Layout pattern for this page — tabs (STACK), month grid in DayDetailPanel (ARCHITECTURE), or horizontal day selector (FEATURES). Recommend horizontal day selector (industry pattern for retrospective logging), but needs validation.
- **Research flag: MEDIUM-HIGH** — this is the riskiest phase. Recommend `/gsd-research-phase` or thorough `/gsd-discuss-phase` before planning to resolve the layout divergence.

### Phase 4: Activity Merge (Additive — Lower Risk)
**Rationale:** Calendar structure is already at `/activities`. Adding manual log forms to DayDetailPanel slot is purely additive. Components exist in dead code.
**Delivers:** Merged ActivityCalendarPage with manual activity logging in day detail panel.
**Addresses:** UI-01 (Activity Calendar → Activity page)
**Avoids:** P-01 (dual auto-gen — deactivate ActivityPlanSection auto-gen), P-09 (past-day consistency)
**Specific work:**
- Resurrect `ActivityLogForm` from dead `ActivitiesPage.jsx`, make date-aware
- Add summary/history state to ActivityCalendarPage
- Add summary fetch to `onDaySelect` effect
- Enhance DayDetailPanel: ActivityLogForm + recommendations
- Add compact "Today's Activity Summary" banner above calendar
- Add ActivityHistory at bottom
- Delete dead `ActivitiesPage.jsx`
- **Decision point:** Layout pattern — collapsible month grid (FEATURES/ARCHITECTURE) vs tabs (STACK). Recommend collapsible month grid since this page already has one and users expect planning/overview for workouts.
- **Research flag: LOW** — additive changes, well-understood patterns, components already exist in dead code

### Phase 5: Test Restructuring
**Rationale:** Tests must be updated alongside or immediately after the merge, not deferred. Shared component tests are safe; page-level tests need full replacement.
**Delivers:** Merged-page test files that verify combined behavior.
**Addresses:** P-02 (14 breaking tests)
**Avoids:** Test gaps and regressions
**Specific work:**
- Replace `ActivityCalendarPage.test.jsx` → `MergedActivityPage.test.jsx` (or comprehensive `ActivityPage.test.jsx`)
- Replace `MealCalendarPage.test.jsx` → `MergedFoodLogPage.test.jsx` (or comprehensive `FoodLogPage.test.jsx`)
- Update `ActivitiesPage.test.jsx` assertions
- Verify all 33 shared calendar component tests + remaining safe test files still pass
- Run full test suite before merge commit
- **Research flag: LOW** — standard test restructuring, well-documented patterns from existing test files

### Phase Ordering Rationale

1. **Route config first** — safe mechanical changes unblock everything. Low risk, high dependency.
2. **Component extraction second** — prerequisite for clean merging. Must happen before Phase 3 and 4 to avoid state explosion.
3. **Food Log merge third** — highest architectural risk (date-awareness, CalendarPageLayout embedding). Doing this first surfaces structural issues while they can still be fixed.
4. **Activity merge fourth** — additive, lower risk. Can proceed faster after lessons from Food Log merge.
5. **Tests last** — but test files should be updated per-phase during Phases 3 and 4. Phase 5 is a final audit and full suite run.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Food Log Merge):** **Layout strategy is unresolved.** Three conflicting recommendations exist (tabs, month grid in DayDetailPanel, horizontal day selector). Needs requirements validation before planning. Recommend `/gsd-discuss-phase` with explicit layout trade-off analysis.
- **React 19 `<Activity>` component:** Confidence is LOW. If Phase 3 considers using it, must verify availability in the project's React 19 version first.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Route Config):** Well-documented React Router v6 patterns
- **Phase 5 (Test Restructuring):** Standard Vitest patterns, existing test files as reference

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All researchers agree: no new dependencies needed. Existing React 19 + TanStack Query + date-fns stack is sufficient. Verified against codebase. |
| Features | MEDIUM | Strong industry consensus from 6+ health apps, but the concrete layout recommendation diverges from the other two research streams. Recommended pattern (horizontal day selector for Food Log, collapsible month grid for Activity) needs validation against project constraints. |
| Architecture | HIGH | All findings verified against actual source code. CalendarPageLayout's uncontrolled state, dead code status, route reality — all confirmed. |
| Pitfalls | HIGH | Codebase analysis + test inspection + state variable counting — all verified against actual source. Auto-gen conflict, test impact, state explosion counts are factual. |

**Overall confidence:** MEDIUM

The divergence on layout strategy (tabs vs non-tabs) prevents full confidence in the implementation approach, even though every other dimension is well-understood. The recommended reconciliation (different patterns for different pages) is sensible but unvalidated against the project's constraints.

### Gaps to Address

- **Layout strategy validation:** The central divergence needs resolution. Recommend a mini-discussion (`/gsd-discuss-phase`) comparing three concrete layout mockups (tabs, collapsible month grid, horizontal day selector) against the project's "function over form" and 600px max-width constraints before Phase 3 planning begins.

- **PROJECT.md route correction:** `UI-03` mentions `/activity-calendar` but the actual route is `/activities`. This needs to be corrected in PROJECT.md to avoid confusion.

- **`DailyMealPlanSection` behavior after merge:** If adopting the horizontal day selector pattern (FEATURES recommendation), the `DailyMealPlanSection` (today-only inline plan) needs rethinking — what does it show when viewing a non-today date? This is an unresolved UX detail.

- **Default day selection on page load:** CalendarPageLayout initializes with `selectedDay = null`. For the merged pages, this means no data loads on first visit. Three options exist (accept null state, add `defaultDay` prop, external useEffect to auto-select today) — needs decision.

- **State extraction boundaries:** Phase 2 says "extract calendar section into wrapper component" — the exact boundary (how much state goes inside vs stays in parent) needs clearer definition during planning to avoid extracting too much or too little.

## Sources

### Primary (HIGH confidence — verified against codebase)
- Codebase analysis: `frontend/src/app/Router.jsx` — route structure and navigation
- Codebase analysis: `frontend/src/shared/calendar/CalendarPageLayout.jsx` (106 LOC) — uncontrolled state ownership
- Codebase analysis: `frontend/src/features/activities/ActivityCalendarPage.jsx` (347 LOC) — activity calendar structure
- Codebase analysis: `frontend/src/features/food-log/components/MealCalendarPage.jsx` (294 LOC) — meal calendar structure
- Codebase analysis: `frontend/src/features/food-log/components/FoodLogPage.jsx` (244 LOC) — target page structure
- Codebase analysis: `frontend/src/features/activities/components/ActivitiesPage.jsx` (192 LOC) — confirmed dead code
- Full test suite audit: 15 test files, 141 tests — test impact analysis
- `PROJECT.md` — milestone context and requirements

### Secondary (MEDIUM confidence — industry research)
- MyFitnessPal 2026 Today Tab redesign (support.myfitnesspal.com, April 2026)
- Lose It! Android 2026 redesign (preview.loseitblog.com)
- Cronometer Mobile Daily Report (support.cronometer.com)
- NutriPro (github.com/BALAJIBHARGAV6/NutriPro, Dec 2025)
- NutriTrace (github.com/traceapps/nutritrace, Apr 2026)
- shadcn/ui Calendar Diet Journal block (shadcn.io)
- Clinical App Report — Best Calorie Tracker with Meal Planning 2026
- CalorieBliss — Best Calorie Tracking Apps 2026 comparison

### Tertiary (LOW confidence — needs validation)
- React 19 `<Activity>` (formerly `<Offscreen>`) component availability — not verified against project's React 19 version
- Combined page scroll performance at ~2000px content height — estimated, not measured

---
*Research completed: 2026-06-01*
*Ready for roadmap: yes — with the caveat that the layout strategy divergence must be resolved during requirements definition*
