import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'WeeklyPlanPage.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('WeeklyPlanPage', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function WeeklyPlanPage')).toBe(true);
  });

  test('imports child components: DayCard, EmptyStatePlan, FallbackBanner', () => {
    expect(content.includes("from './DayCard.jsx'")).toBe(true);
    expect(content.includes("from './EmptyStatePlan.jsx'")).toBe(true);
    expect(content.includes("from './FallbackBanner.jsx'")).toBe(true);
  });

  test('imports API functions: getWeeklyPlan, generateWeeklyPlan, regenerateDay', () => {
    expect(content.includes('getWeeklyPlan')).toBe(true);
    expect(content.includes('generateWeeklyPlan')).toBe(true);
    expect(content.includes('regenerateDay')).toBe(true);
  });

  test('uses useState and useEffect for state management', () => {
    expect(content.includes('useState')).toBe(true);
    expect(content.includes('useEffect')).toBe(true);
  });

  test('renders "Loading..." for loading state', () => {
    expect(content.includes("'Loading...'")).toBe(true);
  });

  test('renders "Weekly Activity Plan" heading for active plan', () => {
    expect(content.includes("'Weekly Activity Plan'")).toBe(true);
  });

  test('renders "Try Again" button in error state', () => {
    expect(content.includes("'Try Again'")).toBe(true);
  });

  test('renders rate-limit countdown UI for genRetryAfter state', () => {
    expect(content.includes('genRetryAfter')).toBe(true);
    expect(content.includes("'Wait'")).toBe(true);
  });

  test('renders EmptyStatePlan when no plan exists', () => {
    expect(content.includes('<EmptyStatePlan')).toBe(true);
    expect(content.includes('!plan')).toBe(true);
  });

  test('getMonday function computes correct Monday from dates', () => {
    expect(content.includes('function getMonday')).toBe(true);
    expect(content.includes('getUTCDay')).toBe(true);
    expect(content.includes('getUTCDate')).toBe(true);
  });
});
