# UI-SPEC: Phase 35 — Activity Calendar Page

## Layout

```
┌─────────────────────────────────────┐
│  Activity Calendar                    │  ← Page title
├─────────────────────────────────────┤
│  [Generate Week]   Last generated... │  ← Generate button + status
├─────────────────────────────────────┤
│  ◀ March 2026 ▶           [Today]    │  ← MonthNav
├─────────────────────────────────────┤
│  Mo Tu We Th Fr Sa Su                │
│  25 26 27 28 29 30 31               │
│  1   2  3  4  5  6   7              │
│  8   9 10 11 12 13 14               │
│ 15 16 17 18 19 20 21               │
│ 22 23 24 25 26 27 28               │
│ 29 30 31  1  2  3   4              │
├─────────────────────────────────────┤
│  Day: Saturday, March 15, 2026       │
│                                      │
│  Running · 45min · moderate          │
│  [Swap]                         [✓] │  ← DayActivityRow + toggle
│  ────────────────────────            │
│  Cycling · 30min · vigorous          │
│  [Swap]                         [✓] │
│  ────────────────────────            │
│  Yoga · 20min · light                │
│  [Swap]                         [✓] │
└─────────────────────────────────────┘
```

## Key Interaction States

| Element | State | Behavior |
|---------|-------|----------|
| Generate Week | Default | "Generate Week" button, green (#16a34a) background when active |
| Generate Week | Loading | Spinner + "Generating..." text, button disabled |
| Generate Week | Rate-limited | "Wait N:NN" countdown, button disabled |
| Day cell | Today + no plan | Blue (incomplete) + today outline indicator |
| Day cell | Planned | Blue (incomplete) if any activity not toggled |
| Day cell | All done | Green (completed) if all activities toggled |
| Day cell | Past + not all done | Grey (missed) |
| Day cell | Selected | Bold outline overlay |
| Detail panel | Empty | "Select a day to view details" |
| Detail panel | Today/Future | Interactive DayActivityRow with swap + toggle |
| Detail panel | Past day | Disabled DayActivityRow — grey text, no buttons |
| Completion toggle | Not done | ○ circle icon, clickable |
| Completion toggle | Completed | ✓ green check icon, clickable to undo |
| Swap | Idle | "Swap" button, green on hover |
| Swap | Loading | Inline spinner animation |
| Swap | Countdown | "Wait N:NN" disabled |
| Calendar | Loading month data | Skeleton placeholder (inherited from CalendarPageLayout) |
| Calendar | Error | Error message with retry option |

## Color System (inherited from Phase 34)

| State | Day Cell | Detail Panel Row |
|-------|----------|-----------------|
| Incomplete | #dbeafe bg | Normal styling |
| Completed | #dcfce7 bg | ✓ check + green text |
| Past incomplete | #f3f4f6 bg | Greyed out, disabled |
| Today | Blue outline | Normal styling |
| Selected | Dark outline | Normal styling |

## Responsive

Same as Phase 34 — 600px max-width desktop, full width mobile.
