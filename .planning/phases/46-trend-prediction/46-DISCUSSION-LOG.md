# Phase 46: Trend Prediction — Discussion Log

**Date:** 2026-06-01

## Areas Discussed

### 1. Regression Location: Backend vs Frontend
**Options presented:**
- Backend: New `GET /api/progress/weight/trend` endpoint — reusable, consistent, has profile + weight data in one place
- Frontend: Client-side custom hook — simpler, no new endpoint

**User selection:** Frontend
**Notes:** Phase 46 becomes frontend-only. No backend endpoint needed. Custom `useTrendPrediction` hook consumes existing `getWeightHistory()` data + `profile` prop.

### 2. Direction Logic per Goal Type
**Presented:**
- lose_weight → negative slope on-track
- build_muscle/gain_weight → positive slope on-track
- maintain → near-zero on-track

**User selection:** Yes, looks good.

**Notes:** Direction verb comes from actual data (not goal). Opposite direction always = red.

### 3. Color Thresholds (Green/Amber/Red)
**Options presented:**
- Schedule-based: projected date vs target_date
- Rate-based: actual vs expected kg/week
- Both

**User selection:** Rate-based
**Thresholds decided:**
- Green: ≥80% of expected rate
- Amber: ≥40%
- Red: <40% or opposite direction

**Notes:** Expected rate = `(currentWeight - targetWeightKg) / (targetDate - today)`.

### 4. UI Placement & Component Design
**Options presented:**
- Dedicated card below chart (Recommended)
- Status bar above chart
- Inline in chart

**User selection:** Dedicated card below chart (Recommended)
**Notes:** `TrendPredictionCard.jsx` placed between `WeightTrendChart` and `WeightHistoryTable`. Inline styles, matching sibling card pattern.

## Deferred Ideas
- LLM-powered commentary on trends (not in scope for this phase)
- Backend trend endpoint for future API consumers
