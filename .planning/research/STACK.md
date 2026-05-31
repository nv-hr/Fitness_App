# Stack Research: Calendar-Based Plan UI (v1.7)

**Domain:** React month-grid calendar with color-coded day status + detail panel
**Researched:** 2026-05-31
**Confidence:** HIGH

## Recommended Stack

### Core Addition

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| date-fns | ^3.6.0 | Date manipulation (month grid calc, day status comparison, formatting) | Only date utility library that matches project constraints: tree-shakeable (import only needed functions), zero dependencies, immutable, native Date objects, TypeScript-first. Replaces raw `new Date()` calls like `today.toISOString().split('T')[0]` scattered across components. v3.6.0 confirmed via Context7 CDN references. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | ^2.1.1 | Conditional className string construction for day cell styling | **Optional** — 239B gzipped, zero dependencies. Useful for constructing day cell class strings with color status. Only needed if calendar uses CSS classes (not inline styles). Can skip if staying purely inline-style. |

### Development / Testing

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| (none needed) | — | — | date-fns functions are plain JS with no DOM dependency — work in jsdom (Vitest) without additional setup. |

## Installation

```bash
# Essential — only one new dependency
npm install date-fns@^3.6.0

# Optional — only if using class-based day cell styling
npm install clsx@^2.1.1
```

## What Calendar Libraries Were Considered and Rejected

### Rejected: Full Calendar Libraries

| Library | Bundle | Reason Rejected |
|---------|--------|-----------------|
| react-big-calendar | ~90kb | Event/scheduling API designed for time-bound events (start/end dates, overlapping, drag-to-resize). No concept of "day status" — would need to map status indicators to dummy events. Requires moment.js or date-fns adapter anyway. 4 views (month/week/day/agenda) when we only need month. |
| @mantine/dates | ~30kb + Mantine deps | Pulls in entire Mantine UI dependency tree (theme provider, hooks, etc.) when project uses inline styles. Architectural mismatch. |
| antd Calendar | ~50kb + antd deps | Same problem — entire Ant Design dependency tree for one component. Overkill. |
| trud-calendar | ~95kb | Built for Google Calendar-grade scheduling (drag-drop, RRULE, timezones, 5 views). We need: month grid, click day, color cell. Its slots API (custom `dayCell` component) would work, but 95kb for features we don't use. |
| schedultron | ~40kb | Event management + drag-drop + glassmorphism themes. Requires Moment.js. Wrong paradigm. |
| @sajankumarv88/react-calendar | ~30kb | Event-based with categories, bookable flags, user profiles. Wrong abstraction for day status. |
| svar-widgets/react-calendar | ~40kb | Event calendar with drag-drop, filtering, resource views. Overengineered for status dots. |
| Zesor/calendarkit-pro | ~50kb | Professional scheduler with recurring events, ICS import/export. Not a status tracker. |
| Schedulely | ~5kb gzip | Closest contender — lightweight, CSS-grid based, customizable. But it's been unmaintained since 2022 and the "custom components" pattern adds complexity over a direct implementation. |

**Core reason:** All these libraries model **events** (something that happens at a time). The calendar in this project models **day status** (a day's completion state). These are fundamentally different data models. Mapping status to events means:
- Creating dummy event objects for every day with activity/meal data
- Overriding cell rendering to show status colors instead of events
- Fighting the library's built-in event interactions
- Using 5-20% of the library's features while paying 100% of the bundle cost

### Rejected: clsx Alternatives

| Library | Reason Rejected |
|---------|-----------------|
| classnames | 489B vs clsx's 239B. Slower in benchmarks. No advantage for new work. |
| tailwind-merge | Solves Tailwind CSS utility conflicts. Project has no Tailwind, so this is 100% unused. |

## Recommended Approach: Custom Month-Grid Calendar with date-fns

### Architecture Overview

```
┌──────────────────────────────────────────────┐
│  MonthCalendar (shared component)             │
│  ┌─────────────────────────────────────────┐  │
│  │  CalendarHeader                         │  │
│  │  ◀ January 2026 ▶                      │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │  S   M   T   W   T   F   S             │  │
│  ├─────────────────────────────────────────┤  │
│  │      1   2   3   4   5   6   7          │  │
│  │  8   9  10  11  12  13  14             │  │
│  │ 15  16  17  18  19  20  21             │  │
│  │ 22  23  24  25  26  27  28             │  │
│  │ 29  30  31                              │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  Colors: blue (incomplete)                    │
│          green (completed)                    │
│          grey (past missed)                   │
│          white/default (future/no plan)       │
└──────────────────────────────────────────────┘
```

**Component breakdown:**

1. **`MonthCalendar`** — Props: `{ currentMonth, onMonthChange, selectedDay, onDaySelect, dayStatusMap, weekStartsOn }`
   - `dayStatusMap`: `Map<string, 'completed' | 'incomplete' | 'missed'>` — keyed by `YYYY-MM-DD`
   - Pure presentational. No data fetching.

2. **`DayDetailPanel`** — Sidebar/overlay panel shown when a day is selected.
   - Receives `selectedDay`, fetches/renders activity cards or meal log for that date.

3. **Per-feature page wrappers** (`ActivityCalendarPage`, `MealCalendarPage`):
   - Fetch plan data via existing TanStack Query hooks
   - Build `dayStatusMap` from plan data
   - Render `MonthCalendar` + `DayDetailPanel`
   - Handle generate button, auto-generate logic

### date-fns Functions Required

```js
import {
  startOfMonth,        // First day of displayed month
  endOfMonth,          // Last day of displayed month
  startOfWeek,         // Align to Sunday/Monday for grid start
  endOfWeek,           // Align to Sunday/Monday for grid end
  eachDayOfInterval,   // Generate all days in [startOfWeek, endOfWeek]
  format,              // "yyyy-MM-dd" key, "MMMM yyyy" header, "EEE" weekdays
  isSameDay,           // Highlight selected day
  isSameMonth,         // Dim days from adjacent months
  isToday,             // Highlight today's cell
  isBefore,            // Check if day is in the past (for grey-out)
  isAfter,             // Check if day is in the future
  addMonths,           // Navigate next month
  subMonths,           // Navigate previous month
  getDay,              // Determine column offset for first day
} from 'date-fns';
```

**Total bundle impact:** Each function is individually importable. Combined gzip size for the above 12 functions: approximately **1-2KB**. No runtime overhead from unused features.

### CSS Grid Layout (inline styles or minimal CSS)

```css
/* Calendar grid — add as inline <style> in component or first .css import */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.875rem;
}
/* Status colors applied via inline style.backgroundColor */
```

### State Management

No global state additions needed. Uses local React state consistent with existing patterns:

| State | Type | Location | Purpose |
|-------|------|----------|---------|
| `currentMonth` | `Date` | Each calendar page | Which month is displayed |
| `selectedDay` | `Date \| null` | Each calendar page | Which day is clicked for detail panel |

This mirrors existing patterns (`ActivitiesPage.jsx` uses local `useState` for recommendations, history, summary, etc.; `FoodLogPage.jsx` uses local `useState` for summary, logs, selection, etc.).

### Integration with Existing TanStack React Query

Existing pattern is direct API calls in `useEffect` (see `ActivitiesPage.jsx`, `FoodLogPage.jsx`). The calendar pages should:

1. Create dedicated React Query hooks for the calendar data:
   ```js
   // Feature: activities/api/useActivityPlan.js
   export function useActivityPlan(date) {
     return useQuery({
       queryKey: ['activityPlan', date],
       queryFn: () => getActivityPlan(date),
       staleTime: 5 * 60 * 1000,
     });
   }
   ```
2. Derive `dayStatusMap` from query data:
   ```js
   const { data: plan } = useActivityPlan(today);
   const dayStatusMap = useMemo(() => {
     if (!plan?.data?.plan?.days) return new Map();
     return new Map(
       plan.data.plan.days.map(day => [
         day.date,          // 'YYYY-MM-DD'
         day.completed ? 'completed' : 'incomplete'
       ])
     );
   }, [plan]);
   ```
3. Pass to `MonthCalendar` as a prop — calendar component stays pure and testable.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-big-calendar | Event model doesn't fit day-status paradigm. 90kb for unused features. | Custom CSS Grid + date-fns |
| @mantine/dates | Pulls Mantine UI dependency tree into a project using inline styles. | date-fns only |
| antd Calendar | 50kb+ Ant Design dependency tree. | date-fns only |
| Moment.js | Immutable, larger bundle, no tree-shaking. Deprecated in favor of date-fns. | date-fns |
| dayjs | Smaller than moment but less ecosystem support, no tree-shaking. date-fns is the standard. | date-fns |
| Redux / Zustand | Overkill for selected-day state. Local useState is sufficient and matches existing patterns. | useState |
| tailwind-merge | Zero Tailwind usage in project. | n/a — not needed |
| FullCalendar | 200kb+, commercial license for some features. | Custom CSS Grid + date-fns |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| date-fns@^3.6.0 | React 19.2+ | Pure JS, no React dependency. Works in any JS runtime. |
| date-fns@^3.6.0 | Vite 8+ | Tree-shaking via ES module imports works out of the box with Vite. |
| date-fns@^3.6.0 | Vitest 4+ / jsdom | Functions are pure JS — no DOM dependency. Tests work without setup. |

## Sources

- **Context7** `/date-fns/date-fns` — Verified v3.6.0 CDN references, function signatures (eachDayOfInterval, startOfMonth, endOfMonth, addMonths, format, etc.), tree-shaking docs
- **WebSearch** — Multiple tutorials confirmed custom CSS Grid + date-fns pattern is standard for status-based calendars (habits tracker, activity tracking, attendance)
- **WebSearch** — trud-calendar, react-big-calendar, mantine/dates, antd Calendar evaluated and rejected per bundle/paradigm mismatch
- **WebSearch** — lukeed/clsx verified at v2.1.1 (April 2024), 239B gzip, zero dependencies

---

*Stack research for: v1.7 Calendar-Based Plan UI*
*Researched: 2026-05-31*
