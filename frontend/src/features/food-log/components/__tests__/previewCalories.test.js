import { describe, it, expect } from 'vitest';
import { calculatePreviewCalories } from '../previewCalories.js';

describe('calculatePreviewCalories', () => {
  it('returns correct calories for valid input (165 kcal/100g, 150g portion)', () => {
    expect(calculatePreviewCalories(165, '150')).toBe(248);
  });

  it('returns correct calories for 100g portion (exact match)', () => {
    expect(calculatePreviewCalories(200, '100')).toBe(200);
  });

  it('returns correct calories for small portion (50g)', () => {
    expect(calculatePreviewCalories(100, '50')).toBe(50);
  });

  it('returns null when caloriesPer100g is null', () => {
    expect(calculatePreviewCalories(null, '100')).toBeNull();
  });

  it('returns null when caloriesPer100g is 0', () => {
    expect(calculatePreviewCalories(0, '100')).toBeNull();
  });

  it('returns null when portion is empty string', () => {
    expect(calculatePreviewCalories(100, '')).toBeNull();
  });

  it('returns null when portion is non-numeric', () => {
    expect(calculatePreviewCalories(100, 'abc')).toBeNull();
  });

  it('returns null when portion is 0 (below minimum)', () => {
    expect(calculatePreviewCalories(100, '0')).toBeNull();
  });

  it('returns null when portion exceeds 5000g', () => {
    expect(calculatePreviewCalories(100, '5001')).toBeNull();
  });

  it('returns correct calories at boundary (1g minimum)', () => {
    expect(calculatePreviewCalories(100, '1')).toBe(1);
  });

  it('returns correct calories at boundary (5000g maximum)', () => {
    expect(calculatePreviewCalories(100, '5000')).toBe(5000);
  });

  it('rounds to whole number (not floor or ceil)', () => {
    // 165 * 150 / 100 = 247.5 -> Math.round = 248
    expect(calculatePreviewCalories(165, '150')).toBe(248);
    // 165 * 151 / 100 = 249.15 -> Math.round = 249
    expect(calculatePreviewCalories(165, '151')).toBe(249);
  });
});
