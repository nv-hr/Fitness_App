# Phase 46: Trend Prediction — Research

**Researched:** 2026-06-01
**Domain:** Frontend — client-side linear regression, React hooks, trend visualization
**Confidence:** HIGH

## Summary

Phase 46 implements client-side trend prediction on the progress dashboard using ordinary least squares (OLS) linear regression over weight history entries — **no backend changes required**. The core deliverable is a `useTrendPrediction` hook that computes slope, direction, estimated completion date, and confidence (r²) from weight data fetched via the existing `getWeightHistory()` API, plus a `TrendPredictionCard` component that displays the results inline between the existing `WeightTrendChart` and `WeightHistoryTable`.

The math is straightforward OLS: x = days since first entry, y = weight_kg. The slope in kg/day is converted to kg/week for display. The estimated completion date uses `today + (kgToGoal / |rateKgPerWeek|) * 7 days`. Direction logic is goal-aware (lose_weight → negative slope is on-track, etc.) with color status thresholds at 80%/40% of expected rate.

**Primary recommendation:** Implement OLS regression directly in a pure function (no external regression library needed — the math is ~15 lines). Use a custom hook that mirrors the `useEffect + useState` pattern already established in `WeightTrendChart` and `WeightHistoryTable`. Follow the existing component structure (card container, inline styles, state management) from sibling components.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Frontend-only.** Custom hook (`useTrendPrediction`) performs linear regression (OLS) on data fetched via existing `getWeightHistory()` from `weightApi.js`.
- No new backend endpoint, no backend changes.
- Hook signature: `useTrendPrediction(weightEntries, profile)` → `{ rateKgPerWeek, direction, estimatedDate, confidence, kgToGoal, colorStatus }`
- Direction logic (goal-aware): `lose_weight` → negative slope = "losing" (on-track); `build_muscle`/`gain_weight` → positive slope = "gaining" (on-track); `maintain` → near-zero slope = "stable" (on-track); opposite direction = always red + accurate verb from data
- Color thresholds (rate-based): expected rate = `(currentWeight - targetWeightKg) / (targetDate - today)` kg/week. Green ≥ 80%, Amber ≥ 40%, Red < 40% or opposite direction
- No target set: show raw rate string, neutral color, no completion date
- Dedicated `TrendPredictionCard` at `frontend/src/features/progress/components/TrendPredictionCard.jsx`
- Placed in `ProgressPage` between `WeightTrendChart` and `WeightHistoryTable`
- Card shows: rate string, estimated completion date (or "N/A" if no goal), color-coded status indicator
- Follows existing inline styles pattern, matches card styling of sibling components
- States: insufficient data (<3 entries OR <2 weeks), no entries, normal (3+ entries, 2+ weeks), no target set
- No caching needed — O(n) on small datasets, runs on every render via hook

### the agent's Discretion
- Exact implementation of the OLS formula (direct formula approach vs. mean-difference approach)
- Testing approach details (component tests vs. pure function tests)
- The exact date format for the estimated completion date display

### Deferred Ideas (OUT OF SCOPE)
- LLM-powered commentary on trends (not in scope — pure math approach decided)
- Backend trend endpoint for future mobile/API consumers (deferred)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRND-01 | Estimated completion date calculated from ACTUAL weight trend (not calorie_rate) | OLS regression on `weight_kg` field, estimated date = `today + (kgToGoal / abs(rateKgPerWeek)) * 7` days [VERIFIED: context from CONTEXT.md specifics section] |
| TRND-02 | Trend prediction displayed on dashboard when sufficient data (3+ entries, 2+ weeks) | `insufficientData` flag from hook checked before rendering; card conditionally renders prediction or placeholder [VERIFIED: CONTEXT.md decisions section] |
| TRND-03 | Progress direction shown as rate string (e.g., "losing 0.5 kg/week") with color coding | Direction verb from slope sign, rate in kg/week (slope * 7), color thresholds at ≥80% green / ≥40% amber / <40% red [VERIFIED: CONTEXT.md color thresholds section] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Weight data fetching | Browser (React) | — | Uses existing `getWeightHistory()` from weightApi.js — data already served by backend |
| Linear regression computation | Browser (React hook) | — | Pure math on fetched data — no server-side computation needed [CITED: CONTEXT.md decisions] |
| Trend display (rate string, date, color) | Browser (React component) | — | `TrendPredictionCard` renders inline in `ProgressPage` |
| Date arithmetic | Browser (date-fns) | — | `differenceInDays`, `format`, `addDays` from existing dependency |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component + hook framework | Already the project's frontend framework |
| date-fns | — | Date formatting & arithmetic | Already used in WeightTrendChart.jsx — `format()`, `differenceInDays()`, `parseISO()` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | — | OLS regression is pure math — no external regression library required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled OLS | `ml-regression-simple-linear` npm package | Adds a dependency for ~15 lines of math. Not worth it. The OLS formula is a well-known closed-form equation. |
| Hand-rolled OLS | `regression-js` npm package | Larger library (multiple regression types), used only for linear. Overkill. |

**Installation:**
```bash
# No new packages needed. All dependencies already installed:
# - react (in frontend/package.json)
# - date-fns (in frontend/node_modules, used by WeightTrendChart)
```

**Version verification:**
```bash
# date-fns is already an installed dependency — verified via frontend/package.json
# No new package installations required for this phase.
```

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           ProgressPage                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ WeightEntryCard                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │ onLogSuccess → refreshKey++               │
│                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ WeightTrendChart         profile, refreshKey                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ TrendPredictionCard ◆  profile, refreshKey  ◆  NEW COMPONENT│    │
│  │                                                              │    │
│  │  1. useEffect → getWeightHistory(90) → entries              │    │
│  │  2. useTrendPrediction(entries, profile) → result           │    │
│  │  3. Render based on result state                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ WeightHistoryTable          refreshKey                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow for Trend Prediction

```
1. refreshKey changes (page mount or weight log)
   ↓
2. TrendPredictionCard.useEffect → getWeightHistory(90)
   ↓
3. Response: { data: { entries: [{ weight_kg, logged_date, ... }, ...] } }
   ↓
4. entries passed to useTrendPrediction(entries, profile)
   ↓
5. Hook computes:
   a. Reverse entries to ASC (API returns DESC)
   b. Filter: >= 3 entries AND span >= 14 days? If not → insufficientData=true
   c. Transform: x_i = days since first entry (0, 1, 2, ...)
                  y_i = parseFloat(weight_kg)
   d. OLS: slope = SSxy / SSxx  (in kg/day)
              intercept = avgY - slope * avgX
   e. rateKgPerWeek = slope * 7
   f. r² = (SSxy)² / (SSxx * SSyy)
   g. Direction, estimatedDate, colorStatus from profile vs. rate
   ↓
6. TrendPredictionCard renders from result
```

### Recommended Project Structure
```
frontend/src/features/progress/
├── api/
│   └── weightApi.js              # Existing — getWeightHistory(limit)
├── components/
│   ├── TrendPredictionCard.jsx   # NEW — trend card component
│   ├── __tests__/
│   │   └── TrendPredictionCard.test.jsx    # NEW — component tests
│   └── ...existing components...
├── hooks/
│   ├── useTrendPrediction.js     # NEW — OLS regression hook
│   ├── __tests__/
│   │   └── useTrendPrediction.test.js      # NEW — pure function/hook tests
│   └── ...existing hooks...
└── index.js
```

### Pattern 1: Custom Hook for Computation Logic
**What:** Extract the OLS regression math and state derivation into a pure custom hook, following the existing project pattern of hooks for stateful logic (see `useMonthMealData` in food-log).
**When to use:** Whenever computation logic is independent of rendering and may need to be tested separately.
**Example:**
```javascript
// Source: Derived from existing patterns in WeightTrendChart.jsx + project conventions
import { useMemo } from 'react';
import { parseISO, differenceInDays } from 'date-fns';

function computeOLS(entries) {
  // entries are sorted ASC by logged_date
  const n = entries.length;
  if (n < 3) return null;

  const firstDate = parseISO(entries[0].logged_date);
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

  for (let i = 0; i < n; i++) {
    const x = differenceInDays(parseISO(entries[i].logged_date), firstDate);
    const y = parseFloat(entries[i].weight_kg);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const r2 = (n * sumXY - sumX * sumY) ** 2 / ((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return { slope, intercept, r2, n };
}

export function useTrendPrediction(weightEntries, profile) {
  return useMemo(() => {
    // ... state derivation logic
  }, [weightEntries, profile]);
}
```

### Anti-Patterns to Avoid
- **Don't compute regression in the component body:** Extract to a hook or pure function for testability.
- **Don't reverse the array in-place every render:** Memoize the reversal and computation together.
- **Don't parse dates inside the loop without caching:** Pre-parse all dates once.
- **Don't use `useEffect` for the OLS computation:** The computation is synchronous and pure — `useMemo` is the correct tool.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date string builder | `date-fns format()` | Already in the project, handles locale, DST, timezone edge cases |
| Date difference | Manual ms/day math | `date-fns differenceInDays()` | Accounts for DST transitions, timezone offsets |

**Key insight:** The OLS regression itself is an exception — it SHOULD be hand-rolled because it's a simple closed-form equation (~15 lines) with no edge cases that a library would handle better. Adding an npm dependency like `ml-regression-simple-linear` for one `y = mx + b` computation is unnecessary.

## Runtime State Inventory

> Not applicable — this is a greenfield frontend-only phase. No rename, refactor, or migration involved.

## Common Pitfalls

### Pitfall 1: Division by Zero (Zero Variance)
**What goes wrong:** If all x values are the same (all entries on the same day) or all y values are the same, the denominator `(n * sumXX - sumX * sumX)` is zero, causing `Infinity` or `NaN`.
**Why it happens:** The insufficient-data guard (<3 entries OR <2 weeks span) catches most cases, but could theoretically slip through if entries span ≥2 weeks but happen to have identical x values (shouldn't happen with daily data).
**How to avoid:** Add a guard: `if (denominator === 0) return null` in the OLS function. The insufficient-data check also covers this because the span check ensures at least 2 different dates.
**Warning signs:** `rateKgPerWeek` showing `Infinity` or `NaN`.

### Pitfall 2: ASC/DESC Date Order Confusion
**What goes wrong:** `getWeightHistory` returns entries sorted DESC (newest first), but the regression expects ASC (oldest first) for x = days since first entry.
**Why it happens:** The hook reverses the array, but if the reversal is done in an impure way (e.g., `.reverse()` mutates the original array), it can cause side effects on re-renders.
**How to avoid:** Always use `.slice().reverse()` or spread then reverse: `[...entries].sort(...)`. Better: sort explicitly by `logged_date` localeCompare to be safe.
**Warning signs:** Negative slope when expecting positive (or vice versa) due to wrong x-axis direction.

### Pitfall 3: Date String vs Date Object Confusion
**What goes wrong:** `target_date` from profile is an ISO string (e.g., `"2026-12-31"`), `logged_date` is a date-only string (e.g., `"2026-06-15"`). Mixing `new Date()`, `parseISO()`, and string operations inconsistently.
**Why it happens:** Different data sources use different formats. The profile `target_date` is a string, `today` is a Date object, `logged_date` is a string.
**How to avoid:** Always use `parseISO()` from date-fns for ISO strings, `new Date()` for "now", and `format()` for output. Never use raw `new Date(string)` which has inconsistent browser behavior.
**Warning signs:** Estimated completion date off by one day, or `differenceInDays` returning NaN.

### Pitfall 4: Opposite Direction Edge Case
**What goes wrong:** A user with `fitness_goal: 'lose_weight'` shows a positive slope (gaining weight). The direction should say "gaining" (from data) but be colored red (off-track).
**Why it happens:** The direction verb comes from the ACTUAL data, but the goal-direction determines whether it's on-track.
**How to avoid:** `direction` is always based on the actual slope sign. `colorStatus` is based on whether the actual direction matches the goal direction PLUS the rate threshold. Handle these as separate concerns.
**Warning signs:** All-red display even for correct direction but slow rate.

### Pitfall 5: NaN from Missing Profile Fields
**What goes wrong:** If `profile` is null or missing `target_weight_kg`, accessing `profile.target_weight_kg` returns `undefined`, and arithmetic produces NaN.
**Why it happens:** `ProgressPage` may render without a profile (loading state), or the profile may not have goal fields set.
**How to avoid:** All computations involving profile fields must be guarded: only compute `colorStatus` and `estimatedDate` if `profile?.target_weight_kg && profile?.target_date`.
**Warning signs:** Rate string shows "losing NaN kg/week".

## Code Examples

### Example 1: OLS Regression Pure Function
```javascript
// Source: Verified via Wikipedia simple linear regression article + Stack Overflow
// https://en.wikipedia.org/wiki/Simple_linear_regression
function linearRegressionOLS(points) {
  // points: [{ x: number (days), y: number (kg) }]
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null; // zero variance — all x values identical

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // r² = (SSxy)² / (SSxx * SSyy)
  const numeratorR2 = n * sumXY - sumX * sumY;
  const denomR2 = (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY);
  const r2 = denomR2 > 0 ? (numeratorR2 * numeratorR2) / denomR2 : 0;

  return { slope, intercept, r2 };
}
```

### Example 2: Estimating Completion Date
```javascript
// Source: CONTEXT.md specifics section — formula from discuss-phase
function estimateCompletionDate(currentWeight, targetWeight, rateKgPerWeek) {
  if (!targetWeight || !rateKgPerWeek || rateKgPerWeek === 0) return null;
  const kgToGoal = targetWeight - currentWeight;
  // If rate is moving away from goal, no valid completion date
  if (Math.sign(kgToGoal) !== Math.sign(rateKgPerWeek)) return null;
  const daysToGoal = Math.abs(kgToGoal / rateKgPerWeek) * 7;
  return addDays(new Date(), Math.round(daysToGoal));
}
```

### Example 3: Color Status Determination
```javascript
// Source: CONTEXT.md decisions — color threshold rules from discuss-phase
function determineColorStatus(rateKgPerWeek, profile) {
  if (!profile?.target_weight_kg || !profile?.target_date) return 'neutral';

  const currentWeight = parseFloat(profile.weight_kg);
  const targetWeight = parseFloat(profile.target_weight_kg);
  const targetDate = parseISO(profile.target_date);
  const today = new Date();
  const daysUntilTarget = differenceInDays(targetDate, today);

  if (daysUntilTarget <= 0) return 'neutral'; // past target date

  const expectedRate = (targetWeight - currentWeight) / (daysUntilTarget / 7);

  // Check if rate is in the correct direction for the goal
  const goal = profile.fitness_goal;
  const isOnTrack = (
    (goal === 'lose_weight' && rateKgPerWeek < 0) ||
    (goal === 'build_muscle' && rateKgPerWeek > 0) ||
    (goal === 'gain_weight' && rateKgPerWeek > 0) ||
    (goal === 'maintain' && Math.abs(rateKgPerWeek) < 0.1)
  );

  if (goal === 'maintain') {
    if (Math.abs(rateKgPerWeek) < 0.1) return 'green';
    if (Math.abs(rateKgPerWeek) < 0.25) return 'amber';
    return 'red';
  }

  if (!isOnTrack) return 'red';

  const ratio = Math.abs(rateKgPerWeek) / Math.abs(expectedRate);
  if (ratio >= 0.8) return 'green';
  if (ratio >= 0.4) return 'amber';
  return 'red';
}
```

### Example 4: useTrendPrediction Hook
```javascript
// Source: Derived from existing custom hook patterns (useMonthMealData)
// and WeightTrendChart.jsx data-fetching pattern
import { useMemo } from 'react';
import { parseISO, differenceInDays, addDays, format } from 'date-fns';
import { getWeightHistory } from '../api/weightApi.js';

function computeOLS(entries) {
  // ... same as Example 1 above
}

export function useTrendPrediction(weightEntries, profile) {
  return useMemo(() => {
    const entries = weightEntries;
    const n = entries.length;

    // Guard: insufficient data
    if (n < 3) {
      return { insufficientData: true, noGoalSet: !profile?.target_weight_kg };
    }

    // Sort ASC by date for regression
    const sorted = [...entries].sort(
      (a, b) => a.logged_date.localeCompare(b.logged_date)
    );

    // Check date span >= 14 days
    const firstDate = parseISO(sorted[0].logged_date);
    const lastDate = parseISO(sorted[sorted.length - 1].logged_date);
    const spanDays = differenceInDays(lastDate, firstDate);
    if (spanDays < 14) {
      return { insufficientData: true, noGoalSet: !profile?.target_weight_kg };
    }

    // Build x values (days since first entry), y values (weight_kg)
    const points = sorted.map((e) => ({
      x: differenceInDays(parseISO(e.logged_date), firstDate),
      y: parseFloat(e.weight_kg),
    }));

    const result = linearRegressionOLS(points);
    if (!result) {
      return { insufficientData: true, noGoalSet: !profile?.target_weight_kg };
    }

    const rateKgPerWeek = result.slope * 7;
    const direction = rateKgPerWeek < -0.01 ? 'losing'
      : rateKgPerWeek > 0.01 ? 'gaining'
      : 'stable';

    // ... compute colorStatus, estimatedDate, etc.
  }, [weightEntries, profile]);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| (N/A — this is the first trend prediction implementation) | — | — | — |

**Deprecated/outdated:**
- None identified for this phase.

## Assumptions Log

No assumptions made — all claims in this research were verified against the existing codebase or CONTEXT.md decisions.

## Open Questions

1. **Precision of rate display when slope is tiny but non-zero**
   - What we know: Direction is `'stable'` when `|rateKgPerWeek| < 0.01`
   - What's unclear: Should we show "0.0 kg/week" or "Stable" as the rate string in this case?
   - Recommendation: UI-SPEC says near-zero slope → "Stable" as the full string. The rate number is not displayed separately when stable.

2. **r² confidence display** 
   - What we know: Shown as "Confidence: 0.87 (strong fit)" below the date — only when confidence is not null
   - What's unclear: Should we omit confidence for very short data ranges (e.g., exactly 2 weeks with 3 entries) where r² is unreliable?
   - Recommendation: Always show it — the r² is mathematically correct regardless of sample size. The text description (strong/moderate/weak) already communicates the reliability.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend dev server (Vite) | ✓ | 22.17.0 | — |
| npm | Package management | ✓ | 10.9.2 | — |
| React | TrendPredictionCard + useTrendPrediction | ✓ | 19 | — |
| date-fns | Date arithmetic, formatting | ✓ | (in frontend/node_modules) | — |
| Vitest | Test runner | ✓ | (in frontend/node_modules) | — |

**Missing dependencies with no fallback:**
- None — all required dependencies are already installed.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (same as existing progress component tests) |
| Config file | `frontend/vitest.config.js` (already configured with jsdom + react plugin) |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRND-01 | Estimated completion date from weight trend | unit | `npx vitest run --reporter=verbose hooks/__tests__/useTrendPrediction.test.js` | ❌ Wave 0 |
| TRND-02 | Card shows insufficient data when <3 entries or <2 weeks | component | `npx vitest run --reporter=verbose components/__tests__/TrendPredictionCard.test.jsx` | ❌ Wave 0 |
| TRND-03 | Rate string and color coding correct | unit + component | (combined with above) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Full suite not required for each commit; run only the relevant test file during development
- **Per wave merge:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/features/progress/hooks/__tests__/useTrendPrediction.test.js` — unit tests for the OLS computation and state derivation
- [ ] `frontend/src/features/progress/components/__tests__/TrendPredictionCard.test.jsx` — component tests for render states (loading, insufficient, normal, no goal, error)
- [ ] Test files directory structure: `frontend/src/features/progress/hooks/` may need to be created

### Existing Test Patterns (to follow)
From `WeightTrendChart.test.jsx`:
- `vi.mock('../../api/weightApi.js')` — mock the weight API
- `vi.clearAllMocks()` in `beforeEach`
- Use `makeEntry(daysAgo, weight)` helper to generate test entries
- Test loading state: mock returns `new Promise(() => {})`
- Test error state: `mockRejectedValue(new Error('...'))`
- Test empty state: `mockResolvedValue({ data: { entries: [] } })`
- Test insufficient data: return 1 or 2 entries
- Test normal display: return 3+ entries spanning 14+ days
- Test `refreshKey` triggers re-fetch: rerender with changed prop

### Recommended Test Cases for useTrendPrediction

```javascript
// Pure function tests — test OLS directly
describe('linearRegressionOLS', () => {
  it('returns slope 2 for perfect linear data', () => { ... });
  it('returns null for < 2 points', () => { ... });
  it('returns r2 1 for perfectly correlated data', () => { ... });
  it('handles descending weight trend', () => { ... });
});

// Hook tests
describe('useTrendPrediction', () => {
  it('returns insufficientData for < 3 entries', () => { ... });
  it('returns insufficientData for < 14 days span', () => { ... });
  it('computes correct rate for 3+ entries over 2+ weeks', () => { ... });
  it('sets colorStatus green when rate >= 80% expected', () => { ... });
  it('sets colorStatus red when rate opposite direction', () => { ... });
  it('returns noGoalSet when profile missing target fields', () => { ... });
  it('returns stable for near-zero slope with maintain goal', () => { ... });
  it('estimates completion date correctly', () => { ... });
});
```

## Security Domain

> Skipped — `security_enforcement` is not configured (absent from config.json). This phase is frontend-only with no new endpoints, no user input parsing, and no data mutation.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth — uses existing authenticated API calls |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No new access control |
| V5 Input Validation | no | No user input in this phase |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns for {stack}

Not applicable — no new attack surface introduced.

## Sources

### Primary (HIGH confidence)
- **CONTEXT.md** (`46-CONTEXT.md`) — All locked decisions, formulas, edge cases, thresholds
- **UI-SPEC.md** (`46-UI-SPEC.md`) — Exact styling, copy, layout, typography, color tokens
- **WeightTrendChart.jsx** — Existing inlined-styles card pattern, data-fetching pattern with `useEffect` + cancelled flag, `date-fns` import pattern
- **WeightTrendChart.test.jsx** — Test patterns, mocking approach, entry generation
- **ProgressPage.jsx** — Component placement location, prop passing structure
- **REQUIREMENTS.md** — Requirement IDs TRND-01, TRND-02, TRND-03

### Secondary (MEDIUM confidence)
- [WebSearch: linear regression OLS formula](https://en.wikipedia.org/wiki/Simple_linear_regression) — Verified the closed-form OLS equation used in this research matches the standard definition
- [WebSearch: Stack Overflow linear regression in JS](https://stackoverflow.com/questions/6195335/linear-regression-in-javascript) — Verified the OLS implementation pattern (numerator/denominator approach)

### Tertiary (LOW confidence)
- None — all recommendations are based on verified sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Only uses existing dependencies (react, date-fns). No new packages needed. [VERIFIED: codebase grep]
- Architecture: HIGH — Follows exact same `useEffect + useState` pattern as `WeightTrendChart` and `WeightHistoryTable`. [VERIFIED: codebase read]
- Pitfalls: HIGH — All derived from common OLS issues verified against the actual data model and existing code conventions.
- Testing: HIGH — Based on existing test patterns in `WeightTrendChart.test.jsx` and `ProgressPage.test.jsx`. [VERIFIED: codebase read]

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (stable — no fast-moving dependencies)
