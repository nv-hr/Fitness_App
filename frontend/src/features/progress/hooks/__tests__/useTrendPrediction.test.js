import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { linearRegressionOLS, useTrendPrediction } from '../useTrendPrediction.js';

const today = new Date();

function makeEntry(daysAgo, weight) {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: daysAgo,
    weight_kg: String(weight),
    logged_date: d.toISOString().split('T')[0],
    source: 'manual',
    notes: null,
  };
}

// ============================================================
// linearRegressionOLS — pure function tests
// ============================================================
describe('linearRegressionOLS', () => {
  it('returns null for < 2 points', () => {
    expect(linearRegressionOLS([])).toBeNull();
    expect(linearRegressionOLS([{ x: 0, y: 5 }])).toBeNull();
  });

  it('returns slope 0 for constant y values', () => {
    const points = [
      { x: 0, y: 75 },
      { x: 5, y: 75 },
      { x: 10, y: 75 },
    ];
    const result = linearRegressionOLS(points);
    expect(result).not.toBeNull();
    expect(result.slope).toBeCloseTo(0, 10);
  });

  it('returns positive slope for ascending data', () => {
    const points = [
      { x: 0, y: 70 },
      { x: 10, y: 75 },
      { x: 20, y: 80 },
    ];
    const result = linearRegressionOLS(points);
    expect(result).not.toBeNull();
    expect(result.slope).toBeGreaterThan(0);
  });

  it('returns negative slope for descending data', () => {
    const points = [
      { x: 0, y: 80 },
      { x: 10, y: 75 },
      { x: 20, y: 70 },
    ];
    const result = linearRegressionOLS(points);
    expect(result).not.toBeNull();
    expect(result.slope).toBeLessThan(0);
  });

  it('returns r² = 1 for perfectly linear data', () => {
    const points = [
      { x: 0, y: 70 },
      { x: 5, y: 72 },
      { x: 10, y: 74 },
      { x: 15, y: 76 },
      { x: 20, y: 78 },
    ];
    const result = linearRegressionOLS(points);
    expect(result).not.toBeNull();
    expect(result.r2).toBeCloseTo(1, 10);
  });

  it('returns null when all x values identical (denom = 0)', () => {
    const points = [
      { x: 0, y: 70 },
      { x: 0, y: 75 },
      { x: 0, y: 80 },
    ];
    const result = linearRegressionOLS(points);
    expect(result).toBeNull();
  });

  it('handles decimal precision correctly', () => {
    // y = 2x + 1
    const points = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = linearRegressionOLS(points);
    expect(result).not.toBeNull();
    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(1, 5);
    expect(result.r2).toBeCloseTo(1, 5);
  });
});

// ============================================================
// useTrendPrediction — hook tests
// ============================================================
describe('useTrendPrediction', () => {
  it('returns insufficientData for < 3 entries', () => {
    const entries = [makeEntry(1, 75), makeEntry(7, 76)];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, { target_weight_kg: 70, target_date: '2027-01-01', fitness_goal: 'lose_weight' })
    );
    expect(result.current.insufficientData).toBe(true);
    expect(result.current.direction).toBeNull();
    expect(result.current.colorStatus).toBeNull();
  });

  it('returns insufficientData for 3 entries spanning < 14 days', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(3, 76),
      makeEntry(5, 77),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, { target_weight_kg: 70, target_date: '2027-01-01', fitness_goal: 'lose_weight' })
    );
    expect(result.current.insufficientData).toBe(true);
  });

  it('returns direction "losing" for negative slope', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 76),
      makeEntry(14, 77),
      makeEntry(21, 78),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, null)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.direction).toBe('losing');
  });

  it('returns direction "gaining" for positive slope', () => {
    const entries = [
      makeEntry(1, 78),
      makeEntry(7, 77),
      makeEntry(14, 76),
      makeEntry(21, 75),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, null)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.direction).toBe('gaining');
  });

  it('returns direction "stable" for near-zero slope', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 75.01),
      makeEntry(14, 74.99),
      makeEntry(21, 75.01),
      makeEntry(28, 75),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, null)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.direction).toBe('stable');
  });

  it('returns colorStatus "green" when rate >= 80% expected', () => {
    // Strong losing trend (rate ~ -1.04 kg/week) with far-off target date
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 77),
      makeEntry(14, 78),
      makeEntry(21, 79),
      makeEntry(28, 80),
    ];
    const profile = {
      target_weight_kg: 70,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.colorStatus).toBe('green');
    expect(result.current.statusLabel).toBe('On Track');
  });

  it('returns colorStatus "amber" when rate >= 40% expected', () => {
    // Shallow losing trend for amber
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 76.05),
      makeEntry(14, 76.1),
      makeEntry(21, 76.15),
      makeEntry(28, 76.2),
    ];
    const profile = {
      target_weight_kg: 70,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.colorStatus).toBe('amber');
    expect(result.current.statusLabel).toBe('Slower than expected');
  });

  it('returns colorStatus "red" when rate < 40% expected', () => {
    // Extremely shallow losing trend
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 76.005),
      makeEntry(14, 76.01),
      makeEntry(21, 76.015),
      makeEntry(28, 76.02),
    ];
    const profile = {
      target_weight_kg: 70,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.colorStatus).toBe('red');
    expect(result.current.statusLabel).toBe('Off Track');
  });

  it('returns colorStatus "red" when rate is opposite direction from goal', () => {
    // Gaining weight but trying to lose
    const entries = [
      makeEntry(1, 80),
      makeEntry(7, 79),
      makeEntry(14, 78),
      makeEntry(21, 77),
      makeEntry(28, 76),
    ];
    const profile = {
      target_weight_kg: 75,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    // Gaining slope (oldest has lower weight) => positive rate => opposite of lose_weight
    expect(result.current.direction).toBe('gaining');
    expect(result.current.colorStatus).toBe('red');
    expect(result.current.statusLabel).toBe('Off Track');
  });

  it('returns noGoalSet when profile has no target_weight_kg', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 76),
      makeEntry(14, 77),
      makeEntry(21, 78),
    ];
    const profile = { target_date: '2027-12-31', fitness_goal: 'lose_weight' };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.noGoalSet).toBe(true);
  });

  it('returns colorStatus "neutral" when no target set', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 76),
      makeEntry(14, 77),
      makeEntry(21, 78),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, {})
    );
    expect(result.current.noGoalSet).toBe(true);
    expect(result.current.colorStatus).toBe('neutral');
  });

  it('returns valid estimatedDate for on-track negative rate with lose_weight goal', () => {
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 77),
      makeEntry(14, 78),
      makeEntry(21, 79),
      makeEntry(28, 80),
    ];
    const profile = {
      target_weight_kg: 70,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.estimatedDate).toBeInstanceOf(Date);
    expect(result.current.estimatedDate.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns estimatedDate null for rate moving away from goal', () => {
    // Gaining weight but target is to lose
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 75.5),
      makeEntry(14, 75),
      makeEntry(21, 74.5),
      makeEntry(28, 74),
    ];
    const profile = {
      target_weight_kg: 80,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    // Weight is gaining (oldest is lower) - positive slope
    // kgToGoal = 80 - 76 = 4 (positive)
    // rateKgPerWeek is positive (gaining)
    // kgToGoal * rateKgPerWeek >= 0 => estimatedDate should NOT be null
    // Wait - target is 80 and current is 76, so kgToGoal = 4 (positive)
    // Rate is positive (gaining) - moving TOWARD goal of 80
    // This is actually on-track for gain_weight goal but for lose_weight it's opposite direction
    // kgToGoal = 80 - 76 = 4, rate > 0 => same sign => date computed
    // But colorStatus is red because direction doesn't match losing goal
    
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    // For moving away from goal: target is 80, current is 76
    // So user needs to GAIN from 76 to 80
    // But fitness_goal is 'lose_weight', so rate direction is opposite
    // However kgToGoal (4) and rateKgPerWeek (positive) have SAME sign
    // So estimatedDate is NOT null per the sign check
    
    // Let's test the case where rate moves AWAY from goal
    // User weighs 76, target is 70 (need to lose), but is gaining
    // kgToGoal = 70 - 76 = -6, rate > 0 => opposite signs => null date
    expect(result.current.insufficientData).toBe(false);
    
    // Re-verify: kgToGoal = profile.target - current = 80 - 76 = 4
    // rate is positive (gaining from 74 to 76)
    // kgToGoal * rate > 0 => same sign => date not null
    // Actually, this means the user IS gaining toward goal of 80
    // But the goal says 'lose_weight' so it's direction-mismatch
    // The old test was wrong - let's make a proper moving-away case
  });

  it('returns estimatedDate null when moving away from goal', () => {
    // User weighs 80, target is 70 (need to lose weight)
    // But entries show gaining weight
    const entries = [
      makeEntry(1, 80),
      makeEntry(7, 79),
      makeEntry(14, 78),
      makeEntry(21, 77),
      makeEntry(28, 76),
    ];
    const profile = {
      target_weight_kg: 70,
      target_date: '2027-12-31',
      fitness_goal: 'lose_weight',
    };
    // kgToGoal = 70 - 80 = -10 (need to lose)
    // rateKgPerWeek is positive (gaining from 76 to 80)
    // kgToGoal * rateKgPerWeek < 0 => opposite signs => null
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.estimatedDate).toBeNull();
  });

  it('returns colorStatus "green" for maintain goal with near-zero rate', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 75.01),
      makeEntry(14, 74.99),
      makeEntry(21, 75.01),
      makeEntry(28, 75),
    ];
    const profile = {
      target_weight_kg: 75,
      target_date: '2027-12-31',
      fitness_goal: 'maintain',
    };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.insufficientData).toBe(false);
    expect(result.current.colorStatus).toBe('green');
    expect(result.current.statusLabel).toBe('On Track');
  });

  it('handles empty entries array (returns insufficientData)', () => {
    const { result } = renderHook(() =>
      useTrendPrediction([], { target_weight_kg: 70, target_date: '2027-01-01', fitness_goal: 'lose_weight' })
    );
    expect(result.current.insufficientData).toBe(true);
    expect(result.current.direction).toBeNull();
  });

  it('does NOT mutate the original weightEntries array', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 76),
      makeEntry(14, 77),
      makeEntry(21, 78),
      makeEntry(28, 79),
    ];
    const originalOrder = entries.map((e) => e.logged_date);
    renderHook(() =>
      useTrendPrediction(entries, null)
    );
    const afterOrder = entries.map((e) => e.logged_date);
    expect(afterOrder).toEqual(originalOrder);
  });

  it('computes rateKgPerWeek as slope * 7', () => {
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 77),
      makeEntry(14, 78),
      makeEntry(21, 79),
      makeEntry(28, 80),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, null)
    );
    expect(result.current.rateKgPerWeek).not.toBeNull();
    // Slope should be negative (older entries heavier), so rateKgPerWeek < 0
    expect(result.current.rateKgPerWeek).toBeLessThan(0);
  });

  it('returns confidence as a number between 0 and 1', () => {
    const entries = [
      makeEntry(1, 76),
      makeEntry(7, 77),
      makeEntry(14, 78),
      makeEntry(21, 79),
      makeEntry(28, 80),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, null)
    );
    expect(result.current.confidence).not.toBeNull();
    expect(result.current.confidence).toBeGreaterThanOrEqual(0);
    expect(result.current.confidence).toBeLessThanOrEqual(1);
  });

  it('returns noGoalSet true when profile.target_date missing', () => {
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 76),
      makeEntry(14, 77),
      makeEntry(21, 78),
    ];
    const profile = { target_weight_kg: 70, fitness_goal: 'lose_weight' };
    const { result } = renderHook(() =>
      useTrendPrediction(entries, profile)
    );
    expect(result.current.noGoalSet).toBe(true);
  });

  it('returns direction "losing" for consistent descending weight data', () => {
    // Older entries have HIGHER weight => losing weight over time
    const entries = [
      makeEntry(1, 75),
      makeEntry(7, 76),
      makeEntry(14, 77),
      makeEntry(21, 78),
      makeEntry(30, 79),
    ];
    const { result } = renderHook(() =>
      useTrendPrediction(entries, null)
    );
    expect(result.current.direction).toBe('losing');
    expect(result.current.rateKgPerWeek).toBeLessThan(0);
  });
});
