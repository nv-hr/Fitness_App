# Phase 46: Trend Prediction — Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Linear regression on weight history entries to produce estimated completion date, trend direction/rate string, and color-coded status indicator. Displayed as a dedicated card on the progress dashboard.

Requirements: TRND-01, TRND-02, TRND-03

</domain>

<decisions>
## Implementation Decisions

### Regression Location
- **Frontend-only.** Custom hook (`useTrendPrediction`) performs linear regression (OLS) on data fetched via existing `getWeightHistory()` from `weightApi.js`.
- No new backend endpoint, no backend changes.
- Hook signature: `useTrendPrediction(weightEntries, profile)` → `{ rateKgPerWeek, direction, estimatedDate, confidence, kgToGoal, colorStatus }`

### Direction Logic (goal-aware)
- `lose_weight`: negative slope → "losing X kg/week" (on-track)
- `build_muscle` / `gain_weight`: positive slope → "gaining X kg/week" (on-track)
- `maintain`: slope near zero → "stable" (on-track)
- Opposite direction → always red + "gaining" / "losing" (accurate verb)
- Direction verb comes from actual data, not goal (e.g., losing weight when trying to gain still says "losing" but red)

### Color Thresholds (rate-based)
Expected rate = `(currentWeight - targetWeightKg) / (targetDate - today)` in kg/week (absolute value):
- Green: actual rate ≥ 80% of expected rate
- Amber: actual rate ≥ 40% of expected rate
- Red: below 40% of expected rate, or slope in opposite direction of goal
- No target set: show raw rate string, neutral color (default text), no completion date

### UI Placement
- Dedicated `TrendPredictionCard` component at `frontend/src/features/progress/components/TrendPredictionCard.jsx`
- Placed in `ProgressPage` between `WeightTrendChart` and `WeightHistoryTable`
- Card shows: rate string, estimated completion date (or "N/A" if no goal), color-coded status indicator
- Follows existing inline styles pattern, matches card styling of sibling components

### States
- Insufficient data (<3 entries OR <2 weeks span): "Log more weight entries to see your trend" message
- No entries: same as insufficient but contextual
- Normal (3+ entries, 2+ weeks): full prediction display
- No target set: show rate string only, no color, no date

### Caching
- No caching needed — computation is O(n) on small datasets (max ~200 entries), runs on every render via hook

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/features/progress/api/weightApi.js` — `getWeightHistory(limit=50)` fetches weight entries
- `frontend/src/features/progress/components/ProgressPage.jsx` — dashboard layout, accepts `profile` prop
- Profile object shape: `{ target_weight_kg, target_date, fitness_goal, weight_kg, height_cm, ... }`
- Inline styles pattern used by WeightEntryCard, WeightTrendChart, WeightHistoryTable

### Established Patterns
- Feature-based components under `features/progress/components/`
- Custom hooks for stateful logic (see `useMonthData` pattern in calendar)
- Vitest with `vi.mock` for test mocking
- `successResponse(res, data)` on backend (not needed since frontend-only)

### Edge Cases Known
- `logged_date` is a date (no time component) — one entry per day from UPSERT
- Weight entries sorted DESC in API — hook must reverse to ASC for regression
- `target_date` is a string (ISO date) — must parse with `new Date()`
- Decimal precision: rate rounded to 1 decimal place (e.g., "0.5 kg/week")

</code_context>

<specifics>
## Specific Ideas

- Linear regression formula: slope = (nΣxy - ΣxΣy) / (nΣx² - (Σx)²) where x = days since first entry, y = weight_kg
- Estimated date: today + (kgToGoal / abs(rateKgPerWeek)) * 7 days
- Rate string: "Losing 0.5 kg/week" or "Gaining 0.3 kg/week" or "Stable"
- Color applied as text color or small dot indicator, matching card styling
- confidence = r² (coefficient of determination), shown as text only when useful

</specifics>

<deferred>
## Deferred Ideas

- LLM-powered commentary on trends (not in scope — pure math approach decided)
- Backend trend endpoint for future mobile/API consumers (deferred)

</deferred>
