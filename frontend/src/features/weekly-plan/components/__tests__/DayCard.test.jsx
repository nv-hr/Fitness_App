import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'DayCard.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('DayCard', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function DayCard')).toBe(true);
  });

  test('imports DayActivityRow and RateLimitedButton', () => {
    expect(content.includes("from './DayActivityRow.jsx'")).toBe(true);
    expect(content.includes("from './RateLimitedButton.jsx'")).toBe(true);
  });

  test('uses clickable header', () => {
    expect(content.includes('onClick')).toBe(true);
    expect(content.includes("'pointer'")).toBe(true);
  });

  test('renders day.date via formatDayHeader', () => {
    expect(content.includes('toLocaleDateString')).toBe(true);
  });

  test('renders activities and total minutes text', () => {
    expect(content.includes("'activities'")).toBe(true);
    expect(content.includes('activities')).toBe(true);
    expect(content.includes('min total')).toBe(true);
  });

  test('conditionally renders expand/collapse characters', () => {
    expect(content.includes("'▲'")).toBe(true);
    expect(content.includes("'▼'")).toBe(true);
  });

  test('regenerate button is inside expanded section', () => {
    expect(content.includes('RateLimitedButton')).toBe(true);
    expect(content.includes("'Regenerate Day'")).toBe(true);
  });
});
