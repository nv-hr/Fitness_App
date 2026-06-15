import { useMemo } from 'react';
import { parseISO, differenceInDays, addDays } from 'date-fns';

function determineTrendStatus(hasGoal, profile, daysUntilTarget, rateKgPerWeek, kgToGoal) {
  if (!hasGoal || daysUntilTarget <= 0) {
    return { colorStatus: 'neutral', statusLabel: null };
  }

  const goal = profile.fitness_goal;
  const isOnTrack =
    (goal === 'lose_weight' && rateKgPerWeek < 0) ||
    (goal === 'build_muscle' && rateKgPerWeek > 0) ||
    (goal === 'gain_weight' && rateKgPerWeek > 0) ||
    (goal === 'maintain' && Math.abs(rateKgPerWeek) < 0.1);

  if (goal === 'maintain') {
    if (Math.abs(rateKgPerWeek) < 0.1) return { colorStatus: 'green', statusLabel: 'On Track' };
    if (Math.abs(rateKgPerWeek) < 0.25) return { colorStatus: 'amber', statusLabel: 'Slower than expected' };
    return { colorStatus: 'red', statusLabel: 'Off Track' };
  }

  if (!isOnTrack) {
    return { colorStatus: 'red', statusLabel: 'Off Track' };
  }

  const expectedRate = kgToGoal / (daysUntilTarget / 7);
  const ratio = expectedRate !== 0 ? Math.abs(rateKgPerWeek) / Math.abs(expectedRate) : 0;

  if (ratio >= 0.8) return { colorStatus: 'green', statusLabel: 'On Track' };
  if (ratio >= 0.4) return { colorStatus: 'amber', statusLabel: 'Slower than expected' };
  return { colorStatus: 'red', statusLabel: 'Off Track' };
}

/**
 * Ordinary Least Squares linear regression.
 * @param {{ x: number, y: number }[]} points
 * @returns {{ slope: number, intercept: number, r2: number } | null}
 */
export function linearRegressionOLS(points) {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const numeratorR2 = n * sumXY - sumX * sumY;
  const denomR2 = (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY);
  const r2 = denomR2 > 0 ? (numeratorR2 * numeratorR2) / denomR2 : 0;

  return { slope, intercept, r2 };
}

/**
 * React hook that performs trend prediction on weight history entries.
 * @param {{ weight_kg: string, logged_date: string }[]} weightEntries
 * @param {{ target_weight_kg?: number, target_date?: string, fitness_goal?: string, weight_kg?: string } | null} profile
 * @returns {object} Prediction result
 */
export function useTrendPrediction(weightEntries, profile) {
  return useMemo(() => {
    const n = weightEntries.length;

    // Guard: insufficient data if less than 3 entries
    if (n < 3) {
      return {
        insufficientData: true,
        noGoalSet: !profile?.target_weight_kg || !profile?.target_date,
        direction: null,
        rateKgPerWeek: null,
        estimatedDate: null,
        confidence: null,
        kgToGoal: null,
        colorStatus: null,
        statusLabel: null,
      };
    }

    // Sort ASC by logged_date localeCompare — do NOT mutate original array
    const sorted = [...weightEntries].sort((a, b) =>
      a.logged_date.localeCompare(b.logged_date)
    );

    // Check date span >= 14 days
    const firstDate = parseISO(sorted[0].logged_date);
    const lastDate = parseISO(sorted[sorted.length - 1].logged_date);
    const spanDays = differenceInDays(lastDate, firstDate);

    if (spanDays < 14) {
      return {
        insufficientData: true,
        noGoalSet: !profile?.target_weight_kg || !profile?.target_date,
        direction: null,
        rateKgPerWeek: null,
        estimatedDate: null,
        confidence: null,
        kgToGoal: null,
        colorStatus: null,
        statusLabel: null,
      };
    }

    // Build points for OLS: x = days since first entry, y = weight_kg
    const points = sorted.map((e) => ({
      x: differenceInDays(parseISO(e.logged_date), firstDate),
      y: parseFloat(e.weight_kg),
    }));

    const result = linearRegressionOLS(points);
    if (!result) {
      return {
        insufficientData: true,
        noGoalSet: !profile?.target_weight_kg || !profile?.target_date,
        direction: null,
        rateKgPerWeek: null,
        estimatedDate: null,
        confidence: null,
        kgToGoal: null,
        colorStatus: null,
        statusLabel: null,
      };
    }

    const rateKgPerWeek = result.slope * 7;
    const direction =
      rateKgPerWeek < -0.01
        ? 'losing'
        : rateKgPerWeek > 0.01
          ? 'gaining'
          : 'stable';

    const currentWeight = parseFloat(weightEntries[0].weight_kg);
    const hasGoal = profile?.target_weight_kg && profile?.target_date;
    const noGoalSet = !hasGoal;

    // Compute kgToGoal
    const kgToGoal = hasGoal
      ? parseFloat(profile.target_weight_kg) - currentWeight
      : null;

    // Determine colorStatus and statusLabel
    const targetDate = hasGoal ? parseISO(profile.target_date) : null;
    const daysUntilTarget = targetDate ? differenceInDays(targetDate, new Date()) : 0;
    const { colorStatus, statusLabel } = determineTrendStatus(hasGoal, profile, daysUntilTarget, rateKgPerWeek, kgToGoal);

    // Compute estimatedDate
    let estimatedDate = null;
    if (
      colorStatus !== 'neutral' &&
      colorStatus !== null &&
      rateKgPerWeek !== 0
    ) {
      const daysToGoal = Math.abs(kgToGoal / rateKgPerWeek) * 7;
      // If kgToGoal and rateKgPerWeek have opposite signs, moving away from goal
      if (kgToGoal * rateKgPerWeek >= 0) {
        estimatedDate = addDays(new Date(), Math.round(daysToGoal));
      }
    }

    // Compute confidence (r²)
    const confidence = result.r2 !== undefined ? Math.round(result.r2 * 100) / 100 : null;

    return {
      insufficientData: false,
      noGoalSet,
      direction,
      rateKgPerWeek,
      estimatedDate,
      confidence,
      kgToGoal,
      colorStatus,
      statusLabel,
    };
  }, [weightEntries, profile]);
}
