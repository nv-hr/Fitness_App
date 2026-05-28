import { describe, it, expect } from '@jest/globals';
import { calculateBmi, getBmiCategory, calculateBmr, calculateTdee, getTdeeRange, getCalorieTarget } from '../../src/services/profile.service.js';

describe('calculateBmi', () => {
  it('70kg/175cm -> 22.9', () => {
    expect(calculateBmi(70, 175)).toBe(22.9);
  });

  it('50kg/160cm -> 19.5', () => {
    expect(calculateBmi(50, 160)).toBe(19.5);
  });

  it('rounds to 1 decimal place', () => {
    expect(calculateBmi(100, 180)).toBe(30.9);
  });
});

describe('getBmiCategory', () => {
  it('< 18.5 is underweight', () => {
    expect(getBmiCategory(18.4)).toBe('underweight');
  });

  it('18.5 is normal', () => {
    expect(getBmiCategory(18.5)).toBe('normal');
  });

  it('22.9 is normal (upper bound)', () => {
    expect(getBmiCategory(22.9)).toBe('normal');
  });

  it('23 is overweight', () => {
    expect(getBmiCategory(23)).toBe('overweight');
  });

  it('24.9 is overweight (upper bound)', () => {
    expect(getBmiCategory(24.9)).toBe('overweight');
  });

  it('25 is obese', () => {
    expect(getBmiCategory(25)).toBe('obese');
  });

  it('30 is obese', () => {
    expect(getBmiCategory(30)).toBe('obese');
  });
});

describe('calculateBmr', () => {
  it('male 70kg/175cm/30 -> 1648.75', () => {
    expect(calculateBmr(70, 175, 30, 'male')).toBe(1648.75);
  });

  it('female 65kg/165cm/28 -> 1380.25', () => {
    expect(calculateBmr(65, 165, 28, 'female')).toBe(1380.25);
  });
});

describe('calculateTdee', () => {
  it('male 70kg/175cm/30/moderate -> 2556', () => {
    expect(calculateTdee(70, 175, 30, 'male', 'moderate')).toBe(2556);
  });

  it('sedentary: 1979', () => {
    expect(calculateTdee(70, 175, 30, 'male', 'sedentary')).toBe(1979);
  });

  it('returns null for missing activityLevel', () => {
    expect(calculateTdee(70, 175, 30, 'male', null)).toBeNull();
  });

  it('returns null for unknown activityLevel', () => {
    expect(calculateTdee(70, 175, 30, 'male', 'unknown')).toBeNull();
  });
});

describe('getTdeeRange', () => {
  it('2000 -> {min:1800, max:2200}', () => {
    expect(getTdeeRange(2000)).toEqual({ min: 1800, max: 2200 });
  });
});

describe('getCalorieTarget', () => {
  it('maintain returns TDEE unchanged', () => {
    expect(getCalorieTarget(2000, 'maintain', 'medium')).toBe(2000);
  });

  it('lose_weight/medium subtracts 550', () => {
    expect(getCalorieTarget(2500, 'lose_weight', 'medium')).toBe(1950);
  });

  it('gain_weight/low adds 275', () => {
    expect(getCalorieTarget(2000, 'gain_weight', 'low')).toBe(2275);
  });

  it('lose_weight null rate defaults 550', () => {
    expect(getCalorieTarget(2000, 'lose_weight', null)).toBe(1450);
  });

  it('gain_weight/high adds 1100', () => {
    expect(getCalorieTarget(2000, 'gain_weight', 'high')).toBe(3100);
  });
});
