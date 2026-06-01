# Phase 43: Weight Logging & Goal Setting — UI Design Contract

## Weight Entry Card

```
┌─────────────────────────────────────┐
│ Log Weight                          │
│ ┌─────────────────────────────────┐ │
│ │ Date: [2026-06-01    ]          │ │
│ │ Weight: [___._] kg              │ │
│ │ Notes: [Optional...    ]        │ │
│ │                                 │ │
│ │ [Log Weight]                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- Inline card below the weight log form
- Date input defaults to today
- Weight input: number, step 0.1, placeholder "0.0"
- Notes: optional textarea with placeholder "Optional notes"

## Weight History Table

```
┌───────────────────────────────────────────┐
│ Weight History       Sort: Newest first   │
│───────────────────────────────────────────│
│ Date        | Weight | Source |           │
│─────────────|────────|────────|           │
│ 2026-06-01  | 75.2   │ Auto   │ [Delete] │
│ 2026-05-25  | 75.8   │ Manual │ [Delete] │
│ 2026-05-18  | 76.1   │ Auto   │ [Delete] │
│ 2026-05-11  | 76.5   │ Auto   │ [Delete] │
└───────────────────────────────────────────┘
```

- Source badges: "Auto" in blue/grey, "Manual" in green
- Delete button: shown on hover or always visible, with confirmation
- Empty state: "No weight entries yet. Log your first weight above."
- Loading state: skeleton rows

## Goal Fields in Profile Form

Add at bottom of profile form (after Weight Change Rate dropdown):

```
┌───────────────────────────────────┐
│ Goal Settings                     │
│───────────────────────────────────│
│ Target Weight: [___._] kg         │
│ Target Date:   [yyyy-mm-dd    ]   │
└───────────────────────────────────┘
```

- Visually grouped as "Goal Settings" section
- Target weight: number input, step 0.1, min 2, max 300
- Target date: date input, min = today
- Both fields are optional
- Only visible on existing profiles (not on first-time create)
