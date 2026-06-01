# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3 — Activity Tracking & Smart Suggestions

**Shipped:** 2026-05-31
**Phases:** 5 | **Plans:** 9 | **Commits:** 110

### What Was Built
- Database schema: `activity_logs` table, `weekly_plans` (JSONB), `intensity_level` ENUM
- Full-stack activity logger: log, view grouped history, delete, daily net calorie summary
- LLM integration: OpenRouter with prompt templates, output validation (Levenshtein), triple-model fallback, in-memory + DB caching
- Weekly plan API: generate, cache-first GET, single-day regeneration with rate limiting
- Weekly plan frontend: expand/collapse DayCards, intensity-color-coded rows, rate-limited regenerate buttons with countdown, 6-state orchestrator
- Comprehensive test suite: 260/260 passing (backend 134, frontend 126)

### What Worked
- **Quick tasks for isolated verification**: OpenRouter API test (260531-baw) caught model ID issues before E2E testing
- **Dependency ordering**: DB schema (13) → independent feature (14) → dependent feature (15) → frontend (16) → testing (17)
- **Code review with --fix**: Fixes applied in dedicated pass before moving to next phase
- **Real LLM E2E test**: Validated actual OpenRouter integration, uncovered primary model returning empty responses
- **Phase 16 multiple plans**: Split into backend endpoints → frontend components → route registration for clean separation

### What Was Inefficient
- **REQUIREMENTS.md traceability stale**: 7/9 items showed "Pending" despite being fully implemented; required user acknowledgement at close
- **Stale quick tasks from earlier milestones**: 21 stale quick task directories accumulated from v1.1/v1.2 — could be cleaned at phase boundaries
- **Frontend test setup friction**: `@testing-library/react` version conflicts required manual dependency resolution

### Patterns Established
- **LLM integration pattern**: OpenAI SDK → OpenRouter base URL → prompt templates → output validation (Levenshtein) → fallback → caching
- **Intensity multiplier pattern**: Server-authoritative multipliers (light=0.7, moderate=1.0, vigorous=1.3) for exercise calorie calculation
- **Cache-first API pattern**: GET returns from in-memory node-cache with `fromCache` flag, avoiding DB queries and rate-limit consumption
- **Three-phase LLM model fallback**: primary → fallback → openrouter/free for resilience

### Key Lessons
1. Keep REQUIREMENTS.md traceability table updated per-phase — never let it go stale across 5 phases
2. Quick tasks should be cleaned up at completion boundaries to avoid audit clutter
3. LLM E2E tests with real API calls are invaluable for catching integration issues (model naming, empty responses, rate limits)
4. Split UI features into plan-sized chunks: API first, components second, routing third

### Cost Observations
- Model mix: 100% Sonnet-equivalent (opencode/default)
- Sessions: ~12 sessions across 5 phases + quick tasks
- Notable: Most efficient execution was Phase 14 (Activity Logger) — single plan, 13 files, no rework

## Milestone: v1.7 — Calendar-Based Plan UI

**Shipped:** 2026-06-01
**Phases:** 4 | **Plans:** 4 | **Commits:** ~164

### What Was Built
- Shared calendar components: CalendarGrid (react-day-picker v9), MonthNav, DayDetailPanel, CalendarPageLayout, useMonthData, calendarUtils — 896 LOC, 33 tests
- Activity Calendar page: month grid view, Generate Week, per-activity swap, completion toggle (○/✓), auto-gen with ref guard, past-day read-only
- Meal Calendar page: month grid view, Generate Day, per-meal-type Log buttons (breakfast/lunch/dinner/snack), auto-gen with ref guard, past-day read-only
- Backend toggle-complete endpoint: POST /api/weekly-plans/toggle-complete with validation
- Cleanup: old WeeklyPlanPage, MealPlanPage, DayCard, DayMealCard, ActivitiesPage components + 32 tests removed
- 141 tests passing across 15 test files (0 failures)

### What Worked
- **Shared calendar component abstraction**: CalendarPageLayout + useMonthData generic hook made both calendar pages easy to build — each just provides its own fetch function
- **Clear state management pattern**: useState for selectedDay/currentMonth, useRef for auto-gen guard, useEffect for side effects — consistent between both pages
- **Parallel milestone phases ordered correctly**: Shared components (34) → activity page (35) → meal page (36) → cleanup (37) with zero rework
- **Code review at phase boundaries**: Phase 34 generated 6 findings that were all fixed before Phase 35 started
- **Per-meal-type log buttons**: Cleaner UX than a monolithic "Log All" button — user chooses which meal to log independently

### What Was Inefficient
- **Autonomous execution without plan files**: Phases 35-37 had PLANNING.md but no formal SUMMARY.md or VERIFICATION.md — made audit harder (had to grep source code for evidence)
- **REQUIREMENTS.md traceability stale (again)**: Same issue as v1.3 — traceability table not updated during execution; 19/27 showed "Pending" despite being done
- **Zero-plan phases**: Phases 36 and 37 technically had "0 plans" which meant no formal plan tracking — better to define at least 1 plan per phase for auditability
- **No commit range extraction**: v1.7 commits interleaved with other work (same day as v1.6 tag), making git range stats less clean

### Patterns Established
- **Calendar day-status model**: Custom CSS Grid + date-fns modifierStyles — color-coded day cells without a full calendar library
- **Per-feature API module pattern**: activityCalendarApi.js wraps weeklyPlanApi.js, exposes only what the calendar page needs (+ new endpoints)
- **Slot-based detail panel**: DayDetailPanel renders children passed from parent — same component, different content per feature page

### Key Lessons
1. Even "0 plan" phases should have at least 1 plan entry for audit traceability
2. REQUIREMENTS.md must be updated per-phase to avoid end-of-milestone gaps — automate if possible
3. Shared component extraction pays off immediately when consumed by multiple feature pages in same milestone
4. Auto-gen with useRef guard is a clean pattern — test that monthNavRef behavior is covered

### Cost Observations
- Model mix: 100% default (opencode/deepseek-v4-flash-free)
- Sessions: ~5 sessions across 4 phases
- Notable: Phase 37 cleanup was the most satisfying — deleting 32 old tests and 5+ stale files

## Milestone: v1.9 — Progress Tracking

**Shipped:** 2026-06-01
**Phases:** 5 | **Plans:** 6 | **Commits:** 29

### What Was Built
- Database schema: weight_logs table with UPSERT, profiles ALTER for goal columns, backfill migration
- Weight logging full-stack: weight log API (CRUD, auto-log on profile update, UPSERT), goal validation (2-300kg, date >= today, direction match)
- Frontend weight entry form, history table with delete, goal fields in profile form
- Weight Trend Chart: Recharts LineChart with goal reference line, 30/60/90 day date range filter, all state handling
- Progress Dashboard: /progress route with coordinated sub-components (chart, entry, history, goal, prediction)
- Trend Prediction: OLS linear regression, 7-state TrendPredictionCard (color-coded green/amber/red), estimated completion date
- 175 tests passing across all components

### What Worked
- **Single-day execution**: All 5 phases completed in one day — focused execution with no context switching
- **Clean phase dependency chain**: Phase 42 (schema) → 43 (API + UI) → 44 (chart) → 45 (dashboard) → 46 (prediction)
- **OLS regression over ML**: Simple linear algebra for trend prediction — no model dependencies, no API calls, predictable results
- **Per-requirement SUMMARY.md tracking**: Each phase documented exactly which requirements it fulfilled, making milestone close verification straightforward
- **Quick tasks for post-ship polish**: Date restriction (260601-dr1), plan regeneration fix, non-today indicator cleanup — all tracked as quick tasks outside phase plans

### What Was Inefficient
- **REQUIREMENTS.md traceability not updated during execution**: All 27 requirements still showed "Pending" in the source file despite being fully implemented — same recurring issue from v1.3 and v1.7
- **Phases archived before milestone close**: Phase directories (42-46) moved to milestones/v1.9-phases via `/gsd-cleanup` before `/gsd-complete-milestone` ran, causing the SDK to report 0 phases/plans
- **No formal UAT pass**: Trend prediction state coverage was verified by tests but not manually reviewed end-to-end
- **DASH-02 deferred**: Summary card (current weight, starting weight, change, kg to goal, % complete) not implemented — documented in STATE.md as deferred

### Patterns Established
- **OLS regression for trend estimation**: Exported pure function `linearRegressionOLS()` for testability, wrapped in `useTrendPrediction` hook with 7-state output
- **Color-coded status system**: Green (≥80% expected), Amber (≥40%), Red (<40% or opposite direction) — reusable for future progress metrics
- **refreshKey coordination pattern**: Parent ProgressPage holds `refreshKey` state, passed to child components — any child can trigger coordinated refetch

### Key Lessons
1. Keep requirements traceability updated per-phase — stalled since v1.3, needs automation
2. Run cleanup after milestone close, not before — SDK `milestone.complete` needs phase directories to calculate stats
3. DASH-02 should have been caught at Phase 45 execution gates, not deferred at close
4. Post-ship quick tasks work well for polish items discovered during end-of-milestone testing
5. Phase 46 (Trend Prediction) had the most test code (15KB hooks + 11KB component) relative to implementation — good pattern for algorithmic features

### Cost Observations
- Model mix: 100% default (opencode/deepseek-v4-flash-free)
- Sessions: ~3 sessions across 5 phases + quick tasks + milestone close
- Notable: Fastest phase was Phase 42 (schema migration) — single plan, pure SQL, no rework

---

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 12 | Initial build |
| v1.1 | 3 | 9 | International + English migration |
| v1.2 | 4 | 13 | Supabase PostgreSQL migration |
| v1.3 | 5 | 9 | Activity tracking + LLM integration |
| v1.7 | 4 | 4 | Calendar-based plan UI + cleanup |
| v1.9 | 5 | 6 | Progress tracking + trend prediction |

### Cumulative Quality

| Milestone | Tests | Files Changed | LOC Added |
|-----------|-------|---------------|-----------|
| v1.0 | ~38 UAT | — | — |
| v1.1 | — | 18 | +1,228 |
| v1.2 | 105+ | 62 | +4,419 |
| v1.3 | 260 | 110 | +13,786 |
| v1.7 | 141 | 161 | +1,650 |
| v1.9 | 175 | 305 | +9,482 |

### Top Lessons (Verified Across Milestones)

1. **Dependency ordering**: Build foundational layers (DB, auth) before feature layers for clean execution
2. **Phase granularity matters**: 1-plan phases (DB schema, Activity Logger) execute faster than multi-plan phases due to reduced coordination overhead
3. **Requirements doc hygiene**: Traceability tables must be updated synchronously with phase completion to avoid false gaps at milestone close
4. **Autonomous phase auditability**: Even "0 plan" phases need a SUMMARY.md or equivalent for the milestone audit
