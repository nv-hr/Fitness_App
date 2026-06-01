# Research: UI Consolidation Patterns for Calendar + Data-Entry Page Merge

**Project:** Fitness_App v1.8
**Focus:** Merging standalone Activity Calendar into Activity page, Meal Calendar into Food Log page
**Stack:** React 19 + Vite 8 + TanStack React Query + date-fns + react-day-picker v9 + CSS Grid (inline styles)
**Date:** 2026-06-01
**Mode:** Ecosystem

---

## 1. The Core Question

How do you combine a calendar view with a data-entry view on the same page, given that:

- Both views are already built and tested (Shared calendar: 896 LOC, 33 tests; Feature pages: ~550 LOC each)
- The calendar uses `CalendarPageLayout` which manages its own `currentMonth` / `selectedDay` state internally
- The data-entry view has its own independent state (selected food, portion, meal type, history, etc.)
- The goal is pure UI restructuring — no new features, no backend changes
- Styling constraint: minimal, function over form

---

## 2. Evaluated Layout Patterns

### 2.1 Vertical Scroll Sections (Rejected)

Both views stacked vertically, user scrolls between them.

- **Pros:** No state management needed, no tab switching, everything visible
- **Cons:** Information overload. The existing pages are already long (Activity page: ~192 lines of content, Food Log: ~244 lines, plus calendar with 28-31 day detail rows). Combining them vertically creates a single very long page with poor navigation. On mobile (the primary responsive target at 768px), this is particularly bad.
- **Verdict:** Reject — violates "function over form" by burying content under scroll.

### 2.2 Split Pane / Side-by-Side (Rejected)

Calendar on one side, data entry on the other.

- **Pros:** Both views visible simultaneously
- **Cons:** At 600px max-width (the existing container), there's no room for a split pane. At desktop widths, the app is already constrained to 600px. A split would force both panes under 300px — too narrow for either view. Would require breaking the existing max-width constraint.
- **Verdict:** Reject — incompatible with existing layout constraints.

### 2.3 Accordion / Collapsible Sections (Rejected)

Both views available, collapsed by default, user expands one at a time.

- **Pros:** Space-efficient, user controls visibility
- **Cons:** Hides content behind an extra click. The two views (manual log, calendar) are peers with equal priority, not supplementary sections. An accordion implies one is primary and the other is auxiliary. Both are primary features.
- **Verdict:** Reject — wrong semantic for peer views.

### 2.4 Modal / Overlay Calendar (Rejected)

Data-entry page stays primary; calendar opens as a modal/overlay on button click.

- **Pros:** Data entry uninterrupted
- **Cons:** Calendar feels like a secondary popup, not a core view. Hides calendar context. Extra interaction to open/close. Poor for frequent switching.
- **Verdict:** Reject — diminishes the calendar's role as a first-class feature.

### 2.5 Tabs (Selected) ✅

Two tabs at the top: "Manual Log" and "Calendar". Only one view visible at a time. Tab state managed via `useState` with string identifier.

- **Pros:**
  - Clean separation of concerns — each view gets full width
  - Works perfectly at 600px max-width and mobile
  - No new dependencies needed
  - Familiar UX pattern (every web app has tabs)
  - Each view keeps its independent state naturally
  - Easy to implement — `useState` + conditional render
- **Cons:**
  - Calendar state (`currentMonth`, `selectedDay`) is lost on tab switch if using conditional unmounting (mitigable)
  - One extra click to switch between views
- **Verdict:** Best fit for the use case.

---

## 3. Tab Implementation Options

### 3.1 Simple `useState` + Conditional Render (Recommended)

```jsx
const [activeTab, setActiveTab] = useState('log');

// In JSX:
<button onClick={() => setActiveTab('log')}>Manual Log</button>
<button onClick={() => setActiveTab('calendar')}>Calendar</button>

{activeTab === 'log' && <ManualLogSection />}
{activeTab === 'calendar' && <CalendarSection />}
```

- **Zero new dependencies.** Works with React 19 out of the box.
- Matches the existing code style (inline styles, simple hooks, no abstraction layers).
- Tab buttons styled like the existing inline buttons (minHeight 44px for mobile, border, borderRadius, etc.)
- **Risk:** Conditional rendering unmounts the CalendarSection on tab switch, resetting `currentMonth` and `selectedDay` in `CalendarPageLayout`.

### 3.2 `useState` + CSS Visibility (Preserves Calendar State)

```jsx
<div style={{ display: activeTab === 'log' ? 'block' : 'none' }}>
  <ManualLogSection />
</div>
<div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
  <CalendarSection />
</div>
```

- Preserves all internal state in both views across tab switches
- TanStack React Query won't re-fetch cached data within staleTime (5 min)
- Calendar auto-generation effects run on mount — need to guard against running when hidden
- **Risk:** Both views mount on initial page load, doubling initial API calls. Mitigation: wrap in `useEffect` that only fires when tab activates, or use `Activity` component.

### 3.3 React 19 `<Activity>` Component (Ideal — If Available)

```jsx
import { Activity, useState } from 'react';

<Activity mode={activeTab === 'log' ? 'visible' : 'hidden'}>
  <ManualLogSection />
</Activity>
<Activity mode={activeTab === 'calendar' ? 'visible' : 'hidden'}>
  <CalendarSection />
</Activity>
```

- React 19 feature (formerly `<Offscreen>` in experimental builds)
- Keeps inactive components mounted but stops their rendering work
- Best of both worlds — state preserved, no unnecessary renders
- **CONFIDENCE: LOW** — This feature was experimental in React 18 and may have been renamed or not yet stable in React 19. The project uses React 19 (`"react": "^19.0.0"` from v1.7 data). **Must verify** that `<Activity>` is available in the project's React version before relying on it.

### Recommendation: Start with Option 3.2 (CSS display)

| Criterion | 3.1 Conditional | 3.2 CSS display | 3.3 Activity |
|-----------|-----------------|-----------------|--------------|
| Complexity | Simplest | Simple | Requires check |
| State preservation | No | Yes | Yes |
| Library needed | None | None | None (built-in) |
| Initial render cost | Only active tab | Both tabs | Both tabs (no render) |
| Auto-gen side effects | Clean | Needs guard | Needs guard |

**Start with CSS display approach (3.2).** It requires no new patterns, preserves calendar state, and the auto-generation guard is already handled in the standalone pages via `monthNavRef` — just extend the same pattern to guard against running when hidden.

---

## 4. Integration with Existing Shared Calendar Components

The shared calendar components are already designed for re-use:

### `CalendarPageLayout` (shared/calendar/CalendarPageLayout.jsx)

```jsx
<CalendarPageLayout
  dayStatusMap={dayStatusMap}
  loading={loading}
  error={error}
  onMonthChange={handleMonthChange}
  onDaySelect={handleDaySelect}
>
  {/* Day detail panel content — rendered inside DayDetailPanel */}
</CalendarPageLayout>
```

- **Manages its own internal state** for `currentMonth` and `selectedDay` via `useState`
- Exposes `onMonthChange` / `onDaySelect` as external notification callbacks
- Accepts `children` which renders in the `DayDetailPanel` slot
- Has internal `isMobile` via `useResponsive()`

**Integration pattern for merged page:**

```jsx
function CalendarSection() {
  // Same logic as the existing standalone calendar page
  const [selectedDay, setSelectedDay] = useState(null);
  const dayStatusMap = /* useMonthData or useMonthMealData */;
  
  return (
    <CalendarPageLayout
      dayStatusMap={dayStatusMap}
      onDaySelect={setSelectedDay}
      ...
    >
      {selectedDay && <DayDetailContent />}
    </CalendarPageLayout>
  );
}
```

The `CalendarSection` component wraps the existing standalone page logic as a self-contained child. This keeps the merge minimal — the parent page only needs tab state + conditional rendering.

### `useMonthData` and `useMonthMealData` Hooks

- **Do NOT share state** between the manual log view and the calendar view
- They use independent `useQueries` with different query keys (`['calendarMonthData', weekStart]` vs `['monthMealData', dateStr]`)
- **No cache conflict** — both hooks can coexist on the same page without interfering
- When the calendar tab is hidden via CSS display, TanStack React Query will still cache the data; switching back shows cached data (within 5-min staleTime)

### `DayDetailPanel` Slot Pattern

The existing `CalendarPageLayout` uses a `children` slot for DayDetailPanel content. This slot pattern is already designed for embedding — no changes needed.

---

## 5. State Management Analysis

### Tab State (New)

```jsx
const [activeTab, setActiveTab] = useState('log');
// or: const [activeTab, setActiveTab] = useState('calendar');
```

- Component-level `useState` is sufficient
- No URL query params needed (milestone says "no new features" — URL persistence is a future enhancement)
- No context/provider needed — tab state is local to the merged page

### Calendar State (Existing — Internal to CalendarPageLayout)

- `currentMonth` (Date) — managed inside `CalendarPageLayout`
- `selectedDay` (Date|null) — managed inside `CalendarPageLayout`
- These reset only if the component unmounts
- CSS display approach preserves them across tab switches

### Manual Log State (Existing — in ActivitiesPage / FoodLogPage)

- Independent of calendar state
- No cross-contamination with calendar views
- Must remain mounted to preserve form state (selected food, portion, etc.)

### Calendar Data (TanStack React Query)

- `dayStatusMap` is computed from `useQueries` results
- React Query handles caching automatically
- Switching tabs does not invalidate the query cache

---

## 6. Auto-Generation Behavior

The standalone calendar pages have auto-generation effects:

**ActivityCalendarPage (lines 97-139):**
```jsx
useEffect(() => {
  if (monthNavRef.current) { monthNavRef.current = false; return; }
  // ... auto-gen if viewing today's month
}, [currentMonth]);
```

**MealCalendarPage (lines 62-93):**
```jsx
useEffect(() => {
  if (monthNavRef.current) { monthNavRef.current = false; return; }
  // ... auto-gen if viewing today's month
}, [currentMonth]);
```

**Integration concern:** When the page initially loads with `activeTab === 'log'`, the calendar section shouldn't auto-generate. Solutions:
1. **Guard with tab state:** Add `if (activeTab !== 'calendar') return;` in the auto-gen effect
2. **Defer mounting:** Only render calendar section when tab is active (Option 3.1 approach)
3. **CSS display:** Auto-gen fires on mount regardless of visibility

**Recommendation:** Pass `isActive` prop to CalendarSection. The auto-gen effect checks `isActive` before firing. This wraps the existing auto-gen guard with an additional tab-visibility guard.

---

## 7. Tab Button Styling

Existing button style (from MonthNav, ActivityCalendarPage, etc.):

```js
const tabButtonStyle = {
  padding: '0.75rem 1rem',
  minHeight: '44px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '4px',
  background: 'white',
  fontSize: '1rem',
};

const activeTabButtonStyle = {
  ...tabButtonStyle,
  background: '#16a34a',  // green accent (matches existing button colors)
  color: '#fff',
  borderColor: '#16a34a',
};
```

No tab library needed — simple buttons with active/inactive styles match the existing aesthetic.

---

## 8. Sufficiency of Existing Stack

| Need | How It's Handled | Status |
|------|-----------------|--------|
| Tab state | `useState` from React 19 | Built-in |
| Tab switching | Conditional rendering or CSS display | Built-in |
| Layout (600px max-width) | Existing inline `maxWidth: 600px` + `margin: 0 auto` | Reuse as-is |
| Responsive / mobile | Existing `useResponsive()` hook | Reuse as-is |
| Calendar grid | `CalendarPageLayout` + `CalendarGrid` + `MonthNav` | Reuse as-is |
| Calendar data fetching | `useMonthData` / `useMonthMealData` via TanStack Query | Reuse as-is |
| Calendar day detail | `DayDetailPanel` slot with `children` | Reuse as-is |
| Inline styles | Existing pattern | Reuse as-is |
| Tab button styling | Inline styles (same as existing buttons) | No new CSS |

**No new dependencies are needed.** The existing React 19 + CSS Grid + inline styles + TanStack React Query + date-fns stack fully covers the UI consolidation.

---

## 9. What Would Not Be Used

The existing stack includes React Hook Form and Zod. These are **not relevant** to the UI consolidation — they're used for the profile form and BMI/TDEE calculators. The tab UI doesn't need form validation.

---

## 10. Confidence Assessment

| Claim | Confidence | Source |
|-------|-----------|--------|
| Tabs are the best layout pattern for this merge | HIGH | Codebase analysis, UX pattern evaluation |
| `useState` is sufficient for tab state | HIGH | React 19 documentation |
| CSS display approach preserves calendar state | HIGH | Standard React behavior |
| No new dependencies needed | HIGH | Full dependency audit of existing codebase |
| `CalendarPageLayout` slots fit the embedded pattern | HIGH | Existing CalendarPageLayout implementation |
| React 19 `<Activity>` is available for hidden-mode rendering | LOW | Not verified in project's React version |
| TanStack Query cache prevents re-fetch on tab switch | HIGH | Existing staleTime: 5min configuration |

---

## 11. Summary & Recommendation

**Pattern:** Tabs with `useState('log')` state, CSS `display: none` for inactive tab content to preserve calendar state.

**Tab labels:** "Manual Log" / "Calendar" (or "Log" / "Calendar" for brevity).

**Component structure for each merged page:**

```
MergedPage (ActivitiesPage / FoodLogPage)
├── h2 title (existing)
├── [error/success messages] (existing)
├── Tab buttons: [Manual Log] [Calendar]
│
├── ManualLogSection (existing content, display:block when active)
│   ├── CalorieSummary / ActivitySummary (existing)
│   ├── FoodSearch / ActivityRecommendations (existing)
│   └── FoodLogTable / ActivityHistory (existing)
│
└── CalendarSection (new wrapper, display:block when active)
    ├── Generate button row (from standalone page)
    ├── CalendarPageLayout
    │   ├── MonthNav
    │   ├── CalendarGrid (react-day-picker)
    │   └── DayDetailPanel (children slot)
    └── day detail content (from standalone page)
```

**No new libraries.** No new build tooling. Pure React `useState` + existing shared components.

**Key integration points to handle:**
1. Calendar auto-generation must be gated by tab visibility
2. Both views' state remains independent (no cross-contamination)
3. TanStack Query cache serves calendar data when tab becomes visible again
4. Route removal of `/activity-calendar` and `/meal-calendar` in Router.jsx
