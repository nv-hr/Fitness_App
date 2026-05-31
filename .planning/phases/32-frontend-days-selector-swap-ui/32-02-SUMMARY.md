---
phase: 32-frontend-days-selector-swap-ui
plan: 02
type: execute
subsystem: frontend
tags: [days-selector, rest-day-cards, swap-button, weekly-plan, wiring]
requires: [32-01]
provides: [Days selector panel, rest day card rendering, Swap button per activity, WeeklyPlanPage full wiring]
affects:
  - frontend/src/features/weekly-plan/components/DayCard.jsx
  - frontend/src/features/weekly-plan/components/DayActivityRow.jsx
  - frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx
tech-stack:
  added: [inline CSS spinner animation via document.head style injection, swap countdown useEffect pattern]
  patterns: [inline-styles, no-semicolons-ASI, single-quotes, 2-space-indent, useState/useEffect/useCallback hooks]
key-files:
  created: []
  modified:
    - frontend/src/features/weekly-plan/components/DayCard.jsx
    - frontend/src/features/weekly-plan/components/DayActivityRow.jsx
    - frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx
decisions:
  - D-12: Swap countdown managed at WeeklyPlanPage level via swapRetryAfter state + useEffect interval, passed down through DayCard to DayActivityRow — same pattern as regeneration rate limiting
  - D-13: Toast is managed as a single { message } state object (replaces previous toast on new error), rendered in all 5 return branches for comprehensive coverage
  - D-14: handleSwap guards against concurrent swaps by checking swapRetryAfter > 0 before proceeding; per-activity loading via swappingActivityId (only spinner on the swapped row)
metrics:
  duration: ~3 min
  completed_date: 2026-05-31
---

# Phase 32 Plan 02: Days Selector, Rest Day Cards, Swap Buttons, WeeklyPlanPage Wiring — Summary

**One-liner:** Full wiring of the days selector (EmptyStatePlan, already committed), rest day card mode (DayCard), Swap button with spinner/rate-limited states (DayActivityRow), and swap handler/toast/availableDays passthrough in WeeklyPlanPage.

## Tasks

### Task 1: Update EmptyStatePlan.jsx — Add days selector ✅
*Already committed in prior execution (`5724d3c`).* The component has:
- Expandable days selector panel below "Generate" button (collapsed by default)
- 7 checkboxes: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Pre-selected: Mon, Tue, Thu, Sat (= 4 days, valid range)
- Validation: hint shows count in grey (4-6) or red warning (<4 or >6)
- Generate button disabled when count < 4 or > 6
- `onGenerate(selectedCount)` passes count to parent

### Task 2: Update DayCard.jsx and DayActivityRow.jsx ✅
**DayCard.jsx:**
- Rest day mode: when `day.rest_day === true`, renders a static green card (#f0fdf4 bg, #bbf7d0 border) with "Rest Day — {date}" header and recovery message
- Normal (non-rest) days: passes `onSwap`, `isSwapping`, `swapRetryAfter` props through to DayActivityRow
- Accepts new props: `dayIndex`, `onSwapActivity`, `swappingActivityId`, `swapRetryAfter`

**DayActivityRow.jsx:**
- Swap button with 4 states: idle (green "Swap"), hover (darker bg #dcfce7), swapping (CSS spinner, row opacity 0.6), rate-limited ("Wait M:SS", opacity 0.5)
- CSS spinner animation via injected `@keyframes swap-spin` in `<style>` tag (with SSR guard via `typeof document !== 'undefined'`)
- `calories_burned` display added alongside existing duration/intensity
- Accepts new props: `onSwap`, `isSwapping`, `swapRetryAfter`

### Task 3: Wire WeeklyPlanPage.jsx ✅
- **Imports:** Added `Toast` from `./Toast.jsx`, `swapActivity` from API module
- **New state:** `swappingActivityId` (number|null), `swapRetryAfter` (number|null), `toast` ({message}|null)
- **Swap countdown effect:** `useEffect` with `setInterval(1000)` decrements `swapRetryAfter`; cleanup on unmount
- **handleGenerate:** Now accepts `availableDays` parameter, passes to `generateWeeklyPlan(weekStart, availableDays)`
- **handleSwap:** Calls `swapActivity`, updates plan on success; rate-limited errors set `swapRetryAfter` + show toast; "not found" errors show specific toast; general errors show fallback toast
- **Toast rendering:** Added `{toast && <Toast .../>}` at top of all 5 return branches (loading, error, rate-limited, empty state, active plan)
- **DayCard props:** Updated to pass `dayIndex`, `onSwapActivity={handleSwap}`, `swappingActivityId`, `swapRetryAfter`

## Success Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Days selector panel appears below Generate button, starts collapsed | ✅ (committed earlier) |
| 2 | 7 checkboxes (Mon-Sun), default: Mon/Tue/Thu/Sat | ✅ |
| 3 | Validation hint shows count in grey (4-6) or red warning | ✅ |
| 4 | Generate button disabled when count outside 4-6 range | ✅ |
| 5 | onGenerate passes selectedDays.size to parent | ✅ |
| 6 | DayCard renders rest day card (green bg, rest message) when day.rest_day === true | ✅ |
| 7 | DayCard passes onSwap, swappingActivityId, swapRetryAfter to DayActivityRow | ✅ |
| 8 | DayActivityRow shows "Swap" (idle), spinner (swapping), countdown (rate-limited) | ✅ |
| 9 | WeeklyPlanPage.handleSwap manages swappingActivityId, calls swapActivity, updates plan on success | ✅ |
| 10 | Swap errors display Toast at top; rate-limited errors show toast + countdown | ✅ |
| 11 | Toast renders in all 5 return branches of WeeklyPlanPage | ✅ |
| 12 | Generate button disabled during generation AND when count invalid | ✅ (committed earlier) |
| 13 | All components load without module resolution errors; 37/37 tests pass; Vite build succeeds | ✅ |

## Deviations from Plan

**None** — Plan executed exactly as specified. Task 1 and Task 2 code was already present in the working tree from prior execution; Task 3 wiring completes the plan.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: client-side-document-write | DayActivityRow.jsx | Injects `<style>` element via `document.head.appendChild` with SSR guard (`typeof document !== 'undefined'`). Style content is hardcoded (no user input). Consistent with accepted pattern for CSS-in-JS animation injection. |

## TDD Gate Compliance

N/A — Plan type is `execute`, not `tdd`.

## Known Stubs

None.

## Self-Check: PASSED

- File `frontend/src/features/weekly-plan/components/DayCard.jsx` — rest day mode ✅, onSwapActivity props ✅
- File `frontend/src/features/weekly-plan/components/DayActivityRow.jsx` — Swap button with spinner ✅
- File `frontend/src/features/weekly-plan/components/WeeklyPlanPage.jsx` — handleSwap ✅, toast state ✅, DayCard props ✅
- Commit `251fdcf` exists ✅
- 37/37 component tests pass ✅
- Vite build compiles without errors ✅
