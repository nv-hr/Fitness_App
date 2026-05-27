import { validateCustomFoodData, validateFoodData } from '../src/services/food.service.js';
import { ValidationError } from '../src/utils/errors.js';

describe('validateCustomFoodData (Phase 7: D-09)', () => {
  describe('valid input', () => {
    test('accepts name and calories_per_100g without category', () => {
      const result = validateCustomFoodData({
        name: 'Nasi Goreng',
        calories_per_100g: 150,
      });
      expect(result).toEqual({
        name: 'Nasi Goreng',
        calories_per_100g: 150,
        category: 'other',
      });
    });

    test('accepts explicit category when provided', () => {
      const result = validateCustomFoodData({
        name: 'Ayam Bakar',
        calories_per_100g: 200,
        category: 'proteins',
      });
      expect(result.category).toBe('proteins');
    });

    test('trims whitespace from name', () => {
      const result = validateCustomFoodData({
        name: '  Soto Ayam  ',
        calories_per_100g: 80,
      });
      expect(result.name).toBe('Soto Ayam');
    });
  });

  describe('validation errors', () => {
    test('throws when name is empty', () => {
      expect(() =>
        validateCustomFoodData({ name: '', calories_per_100g: 100 })
      ).toThrow(ValidationError);
    });

    test('throws when name is missing', () => {
      expect(() =>
        validateCustomFoodData({ calories_per_100g: 100 })
      ).toThrow(ValidationError);
    });

    test('throws when name exceeds 100 characters', () => {
      expect(() =>
        validateCustomFoodData({
          name: 'a'.repeat(101),
          calories_per_100g: 100,
        })
      ).toThrow(ValidationError);
    });

    test('throws when calories_per_100g is negative', () => {
      expect(() =>
        validateCustomFoodData({ name: 'Test', calories_per_100g: -1 })
      ).toThrow(ValidationError);
    });

    test('throws when calories_per_100g exceeds 5000', () => {
      expect(() =>
        validateCustomFoodData({ name: 'Test', calories_per_100g: 5001 })
      ).toThrow(ValidationError);
    });

    test('throws when calories_per_100g is missing', () => {
      expect(() =>
        validateCustomFoodData({ name: 'Test' })
      ).toThrow(ValidationError);
    });
  });
});

describe('validateFoodData (unchanged)', () => {
  test('still requires category for existing callers', () => {
    expect(() =>
      validateFoodData({ name: 'Test', calories_per_100g: 100 })
    ).toThrow(ValidationError);
  });
});
