import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'ActivityHistory.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('ActivityHistory', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function ActivityHistory')).toBe(true);
  });

  test('renders "Activity History" heading', () => {
    expect(content.includes("'Activity History'")).toBe(true);
  });

  test('renders "No activity logged yet" for empty history', () => {
    expect(content.includes("'No activity logged yet'")).toBe(true);
  });

  test('renders delete buttons when history has entries', () => {
    expect(content.includes("'Delete'")).toBe(true);
    expect(content.includes("onDelete(entry.id)")).toBe(true);
  });

  test('renders duration and calories per entry', () => {
    expect(content.includes('duration_min')).toBe(true);
    expect(content.includes('calories_burned')).toBe(true);
  });

  test('renders logged date for each entry', () => {
    expect(content.includes('day.logged_date')).toBe(true);
  });

  test('has collapsible entries with ▲/▼ toggle', () => {
    expect(content.includes("'▲'")).toBe(true);
    expect(content.includes("'▼'")).toBe(true);
  });
});
