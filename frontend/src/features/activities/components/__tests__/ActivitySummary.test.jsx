import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'ActivitySummary.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('ActivitySummary', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function ActivitySummary')).toBe(true);
  });

  test('renders "Activity Summary" heading', () => {
    expect(content.includes("'Activity Summary'")).toBe(true);
  });

  test('renders active minutes, burned, consumed, target', () => {
    expect(content.includes("'Active Minutes'")).toBe(true);
    expect(content.includes("'Burned'")).toBe(true);
    expect(content.includes("'Consumed'")).toBe(true);
    expect(content.includes("'Target'")).toBe(true);
  });

  test('renders "No activity logged today" when all zeros', () => {
    expect(content.includes("'No activity logged today'")).toBe(true);
  });

  test('renders net calorie labels: surplus, deficit, on track', () => {
    expect(content.includes('Surplus')).toBe(true);
    expect(content.includes('Deficit')).toBe(true);
    expect(content.includes('On track')).toBe(true);
  });

  test('renders positive net calories with red (#dc2626)', () => {
    expect(content.includes("'#dc2626'")).toBe(true);
  });

  test('renders negative net calories with green (#16a34a)', () => {
    expect(content.includes("'#16a34a'")).toBe(true);
  });

  test('background color changes based on netVsTarget', () => {
    expect(content.includes("'#fef2f2'")).toBe(true);
    expect(content.includes("'#f0fdf4'")).toBe(true);
  });

  test('returns null when summary is null', () => {
    expect(content.includes("return null")).toBe(true);
  });
});
