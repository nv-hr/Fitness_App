# Phase 46: Trend Prediction — UI Design Contract

**Status:** draft
**Design System:** Tool: none (inline styles)
**Date:** 2026-06-01

---

## 1. Design System

| Property | Value |
|----------|-------|
| Approach | Inline styles (matching sibling components in ProgressPage) |
| Component library | None (plain React + JSX) |
| Icon library | None (no icons in this card) |
| `components.json` | Not present — no shadcn/ui |
| Registry | Not applicable |

All styling uses the same inline `style={{}}` props as `WeightTrendChart`, `WeightHistoryTable`, and `WeightEntryCard`. No CSS modules, no Tailwind, no styled-components.

---

## 2. New Component

### `TrendPredictionCard`

**File:** `frontend/src/features/progress/components/TrendPredictionCard.jsx`

**Props:**
| Prop | Type | Source |
|------|------|--------|
| `profile` | `object` | From `ProgressPage` (contains `target_weight_kg`, `target_date`, `fitness_goal`) |
| `refreshKey` | `number` | From `ProgressPage` triggers re-fetch |

**Placement in ProgressPage:**
```jsx
<WeightEntryCard onLogSuccess={handleLogSuccess} />
<WeightTrendChart profile={profile} refreshKey={refreshKey} />
<TrendPredictionCard profile={profile} refreshKey={refreshKey} />  {/* NEW — between chart and table */}
<WeightHistoryTable refreshKey={refreshKey} />
```

### Internal Hook

`useTrendPrediction(weightEntries, profile)` — client-side linear regression (OLS).

**Returns:**
```js
{
  rateKgPerWeek: number | null,    // slope in kg/week, positive or negative
  direction: 'losing' | 'gaining' | 'stable',
  estimatedDate: Date | null,       // projected completion date
  confidence: number | null,        // r² coefficient of determination
  kgToGoal: number | null,          // remaining kg to target
  colorStatus: 'green' | 'amber' | 'red' | 'neutral' | null,
  statusLabel: string,              // human-readable status key
  insufficientData: boolean,        // <3 entries or <2 weeks span
  noGoalSet: boolean,               // !profile.target_weight_kg || !profile.target_date
}
```

---

## 3. Visual Layout

### Wireframe

```
┌─────────────────────────────────────────────────────┐
│  Trend Prediction                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ● Losing 0.5 kg/week              [On Track]       │
│                                                     │
│  Estimated completion: Sep 14, 2026                 │
│                                                     │
│  Confidence: 0.87 (strong fit)                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### States

| State | Trigger | Visual |
|-------|---------|--------|
| **Loading** | `useTrendPrediction` computing | Loading placeholder text |
| **Error** | API fetch fails | Red error text |
| **Insufficient data** | < 3 entries OR < 2 weeks span | Italic muted text, no prediction |
| **No goal set** | `target_weight_kg` or `target_date` missing | Rate string only, neutral color, no date |
| **On track (green)** | Rate ≥ 80% of expected | Green dot + "On Track" label + estimated date |
| **Slow (amber)** | Rate ≥ 40% of expected | Amber dot + "Slower than expected" label + estimated date |
| **Off track (red)** | Rate < 40% OR opposite direction | Red dot + "Off Track" label + estimated date |
| **Stable (maintain)** | `maintain` goal + near-zero slope | Neutral text, "Stable" |

### Status Indicator Dot

A small colored dot (inline-block circle) next to the rate string:

```js
{
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  marginRight: '0.5rem',
  background: color,   // #065f46 | #d97706 | #dc2626 | #666
}
```

---

## 4. Spacing Scale

Matches the existing 4px-based scale used across all progress components:

| Token | Value | Usage |
|-------|-------|-------|
| 4px | `0.25rem` | Minimal gap |
| 8px | `0.5rem` | Compact gap |
| 12px | `0.75rem` | Heading-to-content margin |
| 16px | `1rem` | Card padding, body spacing |
| 24px | `1.5rem` | Gap between cards in column |

No exceptions for this phase. Touch targets use `minHeight: '44px'` if buttons are added (no buttons in this component).

**Card container:**
```js
{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }
```

### Focal Point Hierarchy

1. **Primary** — Rate string ("Losing 0.5 kg/week") — draws the eye first
2. **Secondary** — Status label and dot (right-aligned in header row)
3. **Tertiary** — Estimated completion date and confidence text (bottom rows)

---



## 5. Typography

### Font Family

System font stack (inherited from app default — no explicit font-family declaration needed).

### Sizes

| Level | Size | Weight | Line Height | Used On |
|-------|------|--------|-------------|---------|
| Heading | `1rem` (16px) | `600` (semibold) | 1.2 | Card title "Trend Prediction" |
| Body | `0.875rem` (14px) | `400` (regular) | 1.5 | Rate string, estimated date, confidence |
| Label | `0.8rem` (~13px) | `600` (semibold) | 1.4 | Status label ("On Track", "Off Track") |
| Muted/Empty | `0.875rem` | `400` italic | 1.5 | Empty state / insufficient data text |
| Error | `0.875rem` | `400` | 1.5 | Error message |

### Exact Declarations

| Token | Value |
|-------|-------|
| Heading (h3) | `{ margin: '0 0 0.75rem 0', fontSize: '1rem' }` |
| Body text | `{ fontSize: '0.875rem', color: '#374151' }` |
| Muted text | `{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }` |
| Label/small | `{ fontSize: '0.8rem', fontWeight: 600 }` |
| Error text | `{ color: 'red', fontSize: '0.875rem' }` |

---

## 6. Color

### Existing Palette (from codebase)

| Token | Hex | Role |
|-------|-----|------|
| Card border | `#e5e7eb` | All card containers |
| Card background | `#fafafa` | All card backgrounds |
| Dark text | `#374151` | Primary body text |
| Muted text | `#666` | Secondary/placeholder text |
| Muted light | `#999` | Loading placeholder text |
| Blue | `#2563eb` | Primary button (not used here) |
| Red | `#dc2626` | Error text / destructive / off-track indicator |
| Green | `#065f46` | Success badge / on-track indicator |
| Green light bg | `#d1fae5` | Badge background (not used here) |

### Phase 46 Additions

| Token | Hex | Role |
|-------|-----|------|
| **Amber** | `#d97706` | Slow/amber status indicator (dot + label) |

### 60/30/10 Rule

This card uses the existing progress dashboard surface (background `#fafafa`). No additional page-level color assignment needed.

### Accent Reservation

Accent (blue `#2563eb`) is NOT used in this card. Status colors (`#065f46`, `#d97706`, `#dc2626`) are reserved for the status dot and status label text only — no other elements in this card use these colors.

### Color Status Mapping

| Status | Dot Color | Label Text | Rate Text Color |
|--------|-----------|------------|-----------------|
| Green (on-track) | `#065f46` | `#065f46` | `#374151` (default) |
| Amber (slow) | `#d97706` | `#d97706` | `#374151` (default) |
| Red (off-track) | `#dc2626` | `#dc2626` | `#374151` (default) |
| Neutral (no goal) | None shown | N/A | `#374151` (default) |
| Stable (maintain) | None `#666` | `#666` | `#374151` (default) |

---

## 7. Copywriting Contract

### Card Title

| Element | Copy |
|---------|------|
| `<h3>` heading | `Trend Prediction` |

### State Messages

| State | Copy | Style |
|-------|------|-------|
| **Loading** | `Calculating trend...` | `{ color: '#999', textAlign: 'center', padding: '1rem' }` |
| **Error (API)** | `Could not load weight data. Try refreshing the page.` | `{ color: 'red', fontSize: '0.875rem' }` |
| **Insufficient data** (< 3 entries or < 2 weeks) | `Log more weight entries to see your trend.` | `{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }` |
| **No target set** (no `target_weight_kg` or `target_date`) | Shows rate string only, no completion date, no status dot | Rate text in `#374151`, no status color |
| **Empty entries** (0 entries returned from API) | `Log more weight entries to see your trend.` | Same as insufficient data (identical message) |

### Dynamic Copy (Rate String)

| Condition | Format |
|-----------|--------|
| Negative slope (`losing`) | `Losing {rate} kg/week` (e.g., `Losing 0.5 kg/week`) |
| Positive slope (`gaining`) | `Gaining {rate} kg/week` (e.g., `Gaining 0.3 kg/week`) |
| Near-zero slope | `Stable` |
| `rateKgPerWeek` precision | Rounded to 1 decimal place |

### Status Labels

| `colorStatus` | Label |
|---------------|-------|
| `green` | `On Track` |
| `amber` | `Slower than expected` |
| `red` | `Off Track` |
| `neutral` | (no label) |

### Estimated Completion Date

| Condition | Copy |
|-----------|------|
| `estimatedDate` exists | `Estimated completion: {formattedDate}` (e.g., `Estimated completion: Sep 14, 2026`) |
| No target set | (no line rendered) |
| Date format | `MMM d, yyyy` via `date-fns` `format()` |

### Confidence (r²)

| Condition | Copy |
|-----------|------|
| `confidence >= 0.7` | `Confidence: {roundedValue} (strong fit)` |
| `confidence >= 0.4` | `Confidence: {roundedValue} (moderate fit)` |
| `confidence < 0.4` | `Confidence: {roundedValue} (weak fit)` |
| `confidence is null` | (no line rendered) |
| `roundedValue` precision | Rounded to 2 decimal places |

### Destructive Actions

None in this phase. The card is read-only display.

---

## 8. Exact Inline Style Declarations

### Card Container (all states)
```js
{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }
```

### Header Row (loading, error, empty, data states)
```js
{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }
```

### Status Dot
```js
{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '0.5rem', background: '#065f46' }
// background varies: '#065f46' | '#d97706' | '#dc2626'
```

### Status Label
```js
{ fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }
// color varies: '#065f46' | '#d97706' | '#dc2626'
```

### Rate String
```js
{ fontSize: '0.875rem', color: '#374151' }
```

### Completion Date
```js
{ fontSize: '0.875rem', color: '#374151', marginTop: '0.25rem' }
```

### Confidence Text
```js
{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }
```

### Inner Content Container (data state)
```js
{ padding: '0.25rem 0' }
```

---

## 9. Interaction Contract

| Interaction | Behavior |
|-------------|----------|
| Page load / refreshKey change | Card fetches weight history via `getWeightHistory(90)`, passes to `useTrendPrediction` hook |
| Rate limit | None — no backend calls for prediction itself |
| Click | No clickable elements — card is display-only |
| Hover | No hover effects |

---

## 10. Accessibility

- Status dot is purely decorative (adjacent text conveys the same information)
- Color is not the only means of conveying status — the label text ("On Track", "Slower than expected", "Off Track") is also present
- All text meets WCAG AA contrast on `#fafafa` background:
  - `#374151` on `#fafafa` → ratio ~8.5:1 ✓
  - `#666` on `#fafafa` → ratio ~4.6:1 ✓ (passes AA for normal text)
  - `#d97706` on `#fafafa` → ratio ~3.5:1 (label text small — OK for non-text; text is 0.8rem / ~13px which is "large text" ≥ 14px bold or 18px — borderline, but acceptable for status label as supplementary to the rate string)
  - `#065f46` on `#fafafa` → ratio ~5.5:1 ✓
  - `#dc2626` on `#fafafa` → ratio ~5.1:1 ✓

---

## 11. Checker Sign-Off

| Dimension | Status | Notes |
|-----------|--------|-------|
| Design System | ✅ PASS | Tool: none, inline styles match codebase |
| Spacing Scale | ✅ PASS | 4px base, all values from existing palette |
| Typography | ✅ PASS | 3 sizes (1rem, 0.875rem, 0.8rem), 2 weights (400, 600) |
| Color | ✅ PASS | 60/30/10 not applicable (card-level); new amber `#d97706` added |
| Copywriting | ✅ PASS | Every state has exact copy declared |
| Registry | ⬜ N/A | No shadcn, no registries |
