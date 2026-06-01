---
status: draft
phase: 38
phase_name: Route Cleanup & Calendar Infrastructure
design_system: inline-styles
last_updated: "2026-06-01"
---

# UI-SPEC: Phase 38 — Route Cleanup & Calendar Infrastructure

## Overview

This phase is infrastructure-heavy with **minimal visual changes**. It mechanically prepares the codebase for the Food Log merge (Phase 39) and Activity merge (Phase 40) by:

1. Removing the `/meal-calendar` route with a client-side redirect to `/food-log`
2. Updating the DashboardPlaceholder nav link (removing "Meal Calendar" entry)
3. Extracting `<ActivityCalendarSection>` and `<MealCalendarSection>` wrapper components that preserve **exact existing visual appearance**
4. Adding an optional `defaultDay` prop to `CalendarPageLayout` (developer API, no visual change)
5. Fixing PROJECT.md route references

**Visual impact is limited to:**
- One nav link removed from the DashboardPlaceholder
- Extracted sections render identically to current calendar pages

---

## Design System Context

| Property | Value | Source |
|----------|-------|--------|
| **Tool** | `none` (inline styles) | Confirmed by codebase scan — no CSS modules, no Tailwind, no styled-components |
| **Approach** | Manual inline `style={}` objects throughout | Established pattern across all components |
| **Responsive** | `useResponsive()` hook — `isMobile` drives `maxWidth` / `flexDirection` switches | Established pattern |

---

## 1. Visual Change — Nav Link Removal

### Current State (DashboardPlaceholder in `Router.jsx`)

The nav renders four link buttons in a flex container:

| Link Label | Route | Visual Style |
|-----------|-------|-------------|
| Profile, BMI & TDEE | `/profile` | `padding: 0.75rem 1rem`, `border: 1px solid #ccc`, `border-radius: 4px`, `color: #333`, `min-height: 44px` |
| Log Food | `/food-log` | Same style as above |
| Meal Calendar | `/meal-calendar` | Same style as above |
| Activity Recommendations | `/activities` | Same style as above |

### Target State

**Remove** the "Meal Calendar" link (line 69-71 of Router.jsx). The remaining three links are unchanged:

| Link Label | Route | Visual Style |
|-----------|-------|-------------|
| Profile, BMI & TDEE | `/profile` | Unchanged |
| Log Food | `/food-log` | Unchanged |
| Activity Recommendations | `/activities` | Unchanged |

**Rationale:** The `/meal-calendar` route is being removed. The "Log Food" link already provides navigation to `/food-log`. No label change needed for "Log Food" — it stays as-is.

### Visual Style Preservation
- Same `border: 1px solid #ccc`, `border-radius: 4px`, `color: #333`, `min-height: 44px` touch targets
- Same `flexWrap: 'wrap'`, `flexDirection: isMobile ? 'column' : 'row'` layout
- Same `gap: 0.5rem` spacing between links

---

## 2. Route Redirect — Client-Side

### Visual Impact
- **None.** The `<Navigate to="/food-log" replace />` in Router.jsx is a zero-rendering component. Users navigating directly to `/meal-calendar` see a transparent redirect to `/food-log` with no intermediate visual state.

---

## 3. Component Extraction — Visual Preservation Contract

### Extraction Scope

| Extracted Component | Source File | Target Location | Preserved Visuals |
|--------------------|------------|-----------------|-------------------|
| `ActivityCalendarSection` | `ActivityCalendarPage.jsx` (347 LOC) | `features/activities/components/ActivityCalendarSection.jsx` | **Exact copy** of all inline style objects |
| `MealCalendarSection` | `MealCalendarPage.jsx` (294 LOC) | `features/food-log/components/MealCalendarSection.jsx` | **Exact copy** of all inline style objects |

### Visual Elements Preserved (Both Sections)

| Element | Style | Notes |
|---------|-------|-------|
| **Page title** | `fontSize: '1.5rem'`, `fontWeight: 700` | "Activity Calendar" / "Meal Calendar" heading unchanged |
| **Generate button (enabled)** | `background: '#16a34a'`, `color: '#fff'`, `border: 1px solid #16a34a`, `borderRadius: 4px`, `padding: 0.75rem 1rem`, `minHeight: 44px`, `fontWeight: bold`, `fontSize: 0.875rem`, `width: 100%` | Unchanged — "Generate Week" / "Generate Day" label |
| **Generate button (generating)** | `background: '#f3f4f6'`, `color: '#666'`, `border: 1px solid #e5e7eb`, `cursor: not-allowed` | Unchanged — "Generating..." label |
| **Generate button (rate-limited)** | Same as disabled but shows countdown text | Unchanged |
| **CalendarPageLayout** | Max-width 600px, gap 4px, centered | Passthrough — no style changes |
| **Day detail panel content** | All nested inline styles for meal rows, activity rows, empty states | Preserved by extracting children + render logic together |
| **Loading state** | `textAlign: center`, `padding: '2rem'`, `color: '#9ca3af'` | Unchanged |
| **Error state** | `color: '#991b1b'`, `backgroundColor: '#fef2f2'`, `border: 1px solid #fecaca`, `borderRadius: 4px` | Unchanged |
| **Toast notification** | Fixed position `top: 1rem`, `right: 1rem`, red bg/white text pattern (MealCalendarSection) | Unchanged |
| **Outer wrapper** | `maxWidth: isMobile ? '100%' : '600px'`, `margin: 0 auto`, `padding: 0 0 2rem` | Unchanged |

### Props Interface (New Wrappers)

```jsx
// Both sections accept the same minimal prop shape:
{
  dayStatusMap,  // Map<string, string> — passthrough to CalendarPageLayout
  loading,       // boolean
  error,         // Error | null
  onDaySelect,   // function(day) — from CalendarPageLayout
  onMonthChange, // function(month) — from CalendarPageLayout
}
```

The sections are **self-contained** — they own their internal API fetching (for selected-day plan data), generate button state, and auto-generation logic. The props are purely for CalendarPageLayout wiring.

### ActivityCalendarSection — Additional Internal State

The activity section carries all existing internal state and handlers:
- `selectedDay`, `currentMonth`, `dayPlan`, `planLoading`, `generating`, `genRetryAfter`
- `swappingActivityId`, `swapRetryAfter`, `toast`, `completedActivities`
- `handleGenerateWeek`, `handleSwap`, `handleToggleComplete`
- Auto-generation effect (gated by `monthNavRef`)

### MealCalendarSection — Additional Internal State

The meal section carries all existing internal state and handlers:
- `selectedDay`, `currentMonth`, `dayPlan`, `planLoading`, `generating`, `genRetryAfter`
- `loggingMeal`, `toast`
- `handleGenerateDay`, `handleLogMeal`
- Auto-generation effect (gated by `monthNavRef`)

---

## 4. CalendarPageLayout — defaultDay Prop

### Developer API (No Visual Change)

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `defaultDay` | `Date \| null` | `null` | When provided, initializes `selectedDay` state and re-syncs on every prop change via `useEffect` |

**Implementation contract:**
- Add `useEffect` that sets `selectedDay` whenever `defaultDay` changes
- `null` means no selection (current behavior — backward compatible)
- Non-null value auto-selects that day in the calendar grid and populates the detail panel

**Visual impact:** None when `defaultDay` is `null` (default). When set, the selected day highlights visually per existing `CalendarGrid` behavior (blue/green/grey color coding applies normally).

---

## 5. Copywriting

| Element | Current Text | New Text | Reasoning |
|---------|-------------|----------|-----------|
| Nav link (removed) | "Meal Calendar" | *(removed entirely)* | Route `/meal-calendar` deleted; "/food-log" already covered by "Log Food" link |
| Nav link (unchanged) | "Log Food" | "Log Food" | No change — already points to `/food-log` |
| Activity section title | "Activity Calendar" | "Activity Calendar" | No change — preserved in extracted section |
| Meal section title | "Meal Calendar" | "Meal Calendar" | No change — preserved in extracted section |

**No destructive actions, no empty states, no error state copy changes in this phase.**

---

## 6. Inline Style Token Reference

These tokens are sourced from the existing codebase and must remain **unchanged** by this phase. Extracted components must preserve every value.

### Colors

```js
// Primary actions (generate, log buttons)
primary:  '#16a34a'           // green — enabled button bg + border
primaryHover: (not specified) // no hover style defined

// Backgrounds
surface:       '#fff'         // white — card backgrounds
disabledBg:    '#f3f4f6'      // light gray — disabled state
errorBg:       '#fef2f2'      // light red — error banner
errorBorder:   '#fecaca'      // red border — error banner

// Text
body:          '#333'         // primary text
secondaryText: '#666'         // secondary/meta text
mutedText:     '#9ca3af'      // placeholder, loading, empty state text
errorText:     '#991b1b'      // error messages
white:         '#fff'         // button label (green bg)

// Borders
defaultBorder: '#ccc'         // nav link borders
lightBorder:   '#e5e7eb'      // card borders, disabled state borders
```

### Typography

```js
// Page title (h2)
titleSize:    '1.5rem'   // 24px
titleWeight:  700        // bold

// Body default (inherited from browser)
bodySize:     '1rem'     // 16px (default)

// Small / meta text
smallSize:    '0.875rem' // 14px — button labels, error banner
xsSize:       '0.8rem'   // ~13px — calorie totals
detailSize:   '0.85rem'  // ~14px — meal item details

// Button labels
buttonWeight: 'bold'     // functionally 700

// Line heights: implicit browser default (~1.2)
```

### Spacing (8-point approximation)

```js
xs:   '0.25rem'  // 4px
sm:   '0.5rem'   // 8px
md:   '0.75rem'  // 12px
lg:   '1rem'     // 16px
xl:   '2rem'     // 32px
2xl:  '2rem 0'   // 32px vertical padding (empty state)
```

### Layout

```js
maxWidth:     isMobile ? '100%' : '600px'
borderRadius: '4px'
minTouch:     '44px'     // accessible touch target min-height
```

---

## 7. No Visual Changes By Task

| Task | Visual Change? | Details |
|------|---------------|---------|
| Remove `/meal-calendar` route | No | Transparent `<Navigate>` redirect |
| Update DashboardPlaceholder nav | **Yes** — one link removed | "Meal Calendar" removed; 3 links remain |
| Extract ActivityCalendarSection | No | Exact style copy from ActivityCalendarPage |
| Extract MealCalendarSection | No | Exact style copy from MealCalendarPage |
| Add `defaultDay` to CalendarPageLayout | No | Developer API — `null` default preserves behavior |
| Fix PROJECT.md route references | No | Documentation only |

---

## 8. Verification Checklist

- [ ] DashboardPlaceholder shows 3 nav links (Profile/Log Food/Activities), not 4
- [ ] Remaining nav links use identical inline styles to current state
- [ ] Navigating to `/meal-calendar` redirects to `/food-log` with no flash/loading state
- [ ] `ActivityCalendarSection` renders identical DOM and inline styles to `ActivityCalendarPage`
- [ ] `MealCalendarSection` renders identical DOM and inline styles to `MealCalendarPage`
- [ ] `CalendarPageLayout` with `defaultDay={null}` selects no day (backward compatible)
- [ ] `CalendarPageLayout` with `defaultDay={new Date()}` auto-selects today
- [ ] Original `ActivityCalendarPage` and `MealCalendarPage` re-export their sections until Phase 39/40
