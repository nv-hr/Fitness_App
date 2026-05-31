---
phase: 34-calendar-shared-components
plan: 01
subsystem: shared/calendar
tags: [calendar, react-day-picker, date-fns, tdd]
requires: []
provides: [CalendarGrid, MonthNav, DAY_STATUS, getWeekStartsForMonth, buildMonthGrid, computeDayStatus]
affects: [frontend/package.json]
tech-stack:
  added:
    - date-fns@^3.6.0
    - react-day-picker@^9.14.0
  patterns:
    - Inline styles throughout
    - react-day-picker DayPicker with modifiers/modifierStyles for color coding
    - Pure presentational components (all state via props)
key-files:
  created:
    - frontend/src/shared/calendar/calendarUtils.js
    - frontend/src/shared/calendar/MonthNav.jsx
    - frontend/src/shared/calendar/CalendarGrid.jsx
    - frontend/src/shared/calendar/index.js
    - frontend/src/shared/calendar/__tests__/calendarUtils.test.js
    - frontend/src/shared/calendar/__tests__/CalendarGrid.test.jsx
  modified:
    - frontend/package.json
    - frontend/package-lock.json
decisions:
  - Use react-day-picker v9 DayPicker with modifiers for day color coding
  - hideNavigation={true} — MonthNav handles navigation externally
  - modifierStyles for inline color coding (blue/green/grey status + today outline)
  - selected modifier for selected day visual distinction
  - Outside days dimmed via modifierStyles.outside opacity: 0.4
  - Week starts on Monday (weekStartsOn: 1)
  - DayPicker captionLayout="label" for simple month/year display
  - All buttons 44px min-height for accessibility
  - date-fns imported per-function for tree-shaking
metrics:
  duration: ~10 min
  completed: 2026-05-31
---

# Phase 34 Plan 01: Calendar Core Utilities + CalendarGrid + MonthNav Summary

Created the foundational shared calendar layer: calendar utility functions with date-fns, react-day-picker v9 CalendarGrid with modifier-based color coding, MonthNav with prev/next/Today navigation.

## TDD Gate Compliance

- ✅ RED gate: `98bb4d7` — `test(34-01): add failing tests for calendar utility functions`
- ✅ GREEN gate: `98bb4d7` — same commit (RED+GREEN in one since vitest tests the file directly)
- ✅ GREEN gate 2: `41303fe` — `feat(34-01): create MonthNav component`
- ✅ GREEN gate 3: `0bfd71c` — `feat(34-01): create CalendarGrid with react-day-picker integration`
- GREEN gate 4: `6231e1d` — `feat(34-01): add CalendarGrid RTL tests and barrel exports`

## Success Criteria Met

1. ✅ All 13 calendarUtils unit tests pass (enum values, getWeekStartsForMonth boundary cases, computeDayStatus 5-case matrix, buildMonthGrid)
2. ✅ CalendarGrid renders a month grid with correct day numbers and weekday headers (react-day-picker)
3. ✅ Day cells show correct color coding via modifierStyles: blue (#dbeafe), green (#dcfce7), grey (#f3f4f6)
4. ✅ Today indicator visible (blue outline ring via today modifierStyles)
5. ✅ MonthNav ◀/▶ buttons navigate correctly via subMonths/addMonths; Today button appears only for non-current months (isSameMonth check)
6. ✅ Selected day has visual distinction (selected modifierStyles with dark blue outline)
7. ✅ Barrel exports all 5 items: CalendarGrid, MonthNav, DAY_STATUS, getWeekStartsForMonth, buildMonthGrid, computeDayStatus
8. ✅ date-fns ^3.6.0 and react-day-picker ^9.14.0 added to package.json dependencies

## Deviations from Plan

- Fixed getWeekStartsForMonth test expectations for June 2026 (June 1 is a Monday, so grid starts June 1, not May 25)
- Fixed buildMonthGrid test to expect 35 days (5 weeks) instead of 42
- Fixed CalendarGrid tests to use getAllByText for day "1" since showOutsideDays creates duplicate "1" cells (June 1 + July 1)
