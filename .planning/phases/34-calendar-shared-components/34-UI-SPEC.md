# UI-SPEC: Phase 34 — Calendar Shared Components

## Layout Structure

```
┌─────────────────────────────────────┐
│  ◀ March 2026 ▶           [Today]  │  ← MonthNav
├─────────────────────────────────────┤
│  Mo Tu We Th Fr Sa Su                │  ← Weekday headers
│  25 26 27 28 29 30 31               │
│  1   2  3  4  5  6   7              │  ← Day cells (react-day-picker)
│  8   9 10 11 12 13 14               │
│ 15 16 17 18 19 20 21               │
│ 22 23 24 25 26 27 28               │
│ 29 30 31  1  2  3   4              │
├─────────────────────────────────────┤
│  [Day Detail Panel — slot]          │  ← populated by parent page
│                                      │
│  Selected day: March 15, 2026       │
│                                      │
│  (Activity/Meal content goes here)   │
└─────────────────────────────────────┘
```

## Color System

| State | Meaning | Color | CSS |
|-------|---------|-------|-----|
| Incomplete | Future planned day, not completed | `#1E90FF` (DodgerBlue) | `{ backgroundColor: '#dbeafe', color: '#1e40af' }` |
| Completed | All items for day are done | `#22C55E` (Green) | `{ backgroundColor: '#dcfce7', color: '#166534' }` |
| Past incomplete | Past day, items were not completed | `#D1D5DB` (Grey) | `{ backgroundColor: '#f3f4f6', color: '#9ca3af' }` |
| Today (overlay) | Current date indicator | Ring/tint | `{ outline: '2px solid', outlineColor: '#2563eb', outlineOffset: '2px' }` |
| Selected day | Currently clicked | Border change | `{ outline: '2px solid #1e40af', outlineOffset: '-2px' }` |

Priority: Selected > Today > Status color (selected+status combine).

## Component Specifications

### CalendarPageLayout
- Full-width container, max-width 600px (matches existing responsive pattern)
- Flex column: MonthNav → CalendarGrid → DayDetailPanel (slot)
- No padding between sections
- Style: `{ display: 'flex', flexDirection: 'column', gap: '4px' }`

### MonthNav
- Display: flex, space-between, center aligned
- Left: prev button `<`
- Center: "Month Year" (e.g. "March 2026")
- Right: next button `>`
- Below nav or at right side: "Today" button to jump to current month
- Style matches existing link buttons: `{ padding: '0.75rem 1rem', minHeight: '44px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }`

### CalendarGrid (wraps react-day-picker DayPicker)
- react-day-picker `mode="single"` with `selected` state
- `modifiers` prop defines: `{ incomplete: ..., completed: ..., pastIncomplete: ..., today: ... }`
- `modifierStyles` maps each modifier to inline style
- `fromMonth`/`toMonth` optional — no date range restrictions
- `onMonthChange` callback updates currentMonth state
- Week starts on Monday (first day of week: 1)
- **Today button**: When not viewing current month, show "Today" button in MonthNav

### Day Cell States
- Each day cell renders react-day-picker's default cell with modifier-based styling
- Days outside current month are dimmed (lower opacity)
- Past days without plan data → default to "past incomplete" (grey)
- Future days without plan data → "incomplete/planned" (blue)
- Today without plan data → today indicator + blue (incomplete)
- Loading state → no dot/badge, day still clickable
- Error state → red tint on affected days (optional, edge case)

### DayDetailPanel (slot)
- Renders when a day is selected (selectedDay !== null)
- Shows: "Selected day: {formattedDate}"
- Below text: `{children}` slot for parent page content
- When no day selected: "Select a day to view details"
- Empty state: centred text, muted colour
- Style: `{ padding: '1rem 0', minHeight: '100px' }`

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>768px) | 600px max-width container, centered |
| Mobile (≤768px) | Full width, 1rem padding |
| Calendar grid | react-day-picker handles responsive cell sizing automatically |

## Accessibility

- All buttons have `minHeight: 44px` for touch targets (existing pattern)
- Month nav buttons have `aria-label="Previous month"` / `aria-label="Next month"`
- Day cells have default react-day-picker aria attributes
- Today button has `aria-label="Go to today"`
- Color coding is visual-only — no critical information conveyed solely by color
- Keyboard navigation via react-day-picker built-in keyboard support

## Animation

- Month transition: instant (no animation preference stated)
- Day selection: instant
- Detail panel: instant appear / disappear

## Existing Pattern Integration

- Max-width container matches `ResponsiveLayout` pattern from `Router.jsx` (600px desktop, full mobile)
- Inline styles throughout, no CSS modules
- `useResponsive` hook available for any responsive adjustments
- Button styling matches existing nav links: `{ padding: '0.75rem 1rem', minHeight: '44px', border: '1px solid #ccc', borderRadius: '4px' }`
