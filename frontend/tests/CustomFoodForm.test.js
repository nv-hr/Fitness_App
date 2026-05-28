import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'src', 'features', 'food-log', 'components', 'CustomFoodForm.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('CustomFoodForm (Phase 7: D-09)', () => {
  describe('zod schema', () => {
    test('does NOT contain z.enum (category removed)', () => {
      expect(content.includes('z.enum')).toBe(false);
    });

    test('schema contains name field', () => {
      expect(content.includes("register('name')")).toBe(true);
    });

    test('schema contains calories_per_100g field', () => {
      expect(content.includes("register('calories_per_100g')")).toBe(true);
    });
  });

  describe('form JSX', () => {
    test('does NOT contain category select element', () => {
      expect(content.includes('<select')).toBe(false);
    });

    test('does NOT contain category defaultValues', () => {
      expect(content.includes("defaultValues: { category")).toBe(false);
    });

    test('still contains submit button', () => {
      expect(content.includes('type="submit"')).toBe(true);
    });

    test('still contains cancel button', () => {
      expect(content.includes('onCancel')).toBe(true);
    });
  });
});
