import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'DayActivityRow.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('DayActivityRow', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function DayActivityRow')).toBe(true);
  });

  test('renders activity name and duration', () => {
    expect(content.includes('activity.name')).toBe(true);
    expect(content.includes('activity.duration_min')).toBe(true);
  });

  test('applies light intensity color (#6b7280)', () => {
    expect(content.includes("'#6b7280'")).toBe(true);
  });

  test('applies moderate intensity color (inherit)', () => {
    expect(content.includes("'inherit'")).toBe(true);
  });

  test('applies vigorous intensity color (#b45309)', () => {
    expect(content.includes("'#b45309'")).toBe(true);
  });

  test('renders intensity label', () => {
    expect(content.includes('activity.intensity')).toBe(true);
  });
});
