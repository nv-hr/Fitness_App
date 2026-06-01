# Plan 43-02: Frontend Weight Logging & Goal Fields - Summary

**Status:** Complete
**Requirements:** WLOG-04, WLOG-05, WLOG-06, GOAL-01, GOAL-02

## What Was Built

| File | Purpose |
|------|---------|
| `frontend/src/features/progress/api/weightApi.js` | HTTP functions: logWeight, getWeightHistory, deleteWeightEntry |
| `frontend/src/features/progress/components/WeightEntryCard.jsx` | Inline card: date input (defaults today), weight input (step 0.1), notes textarea, Log Weight button |
| `frontend/src/features/progress/components/WeightHistoryTable.jsx` | Table with Date/Weight/Source badge/Delete; loading, empty, error states; refreshKey prop |
| `frontend/src/features/profile/api/profileApi.js` | Updated: sends targetWeightKg/targetDate in createProfile and updateProfile |
| `frontend/src/features/profile/components/ProfileForm.jsx` | Updated: goal section (Target Weight + Target Date) shown on existing profiles only |

## Key Design Points
- Goal fields shown only on existing profiles (`{isUpdate && ...}`)
- Source badges: Auto = blue/grey, Manual = green
- WeightEntryCard accepts `onLogSuccess` callback for parent refresh
- WeightHistoryTable accepts `refreshKey` prop for parent-triggered refresh
