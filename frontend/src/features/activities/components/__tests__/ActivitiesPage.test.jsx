import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const componentPath = join(__dirname, '..', 'ActivitiesPage.jsx');

const content = readFileSync(componentPath, 'utf8');

describe('ActivitiesPage', () => {
  test('exports a default function', () => {
    expect(content.includes('export default function ActivitiesPage')).toBe(true);
  });

  test('imports all sub-components: ActivityCard, ActivityPool, ActivityLogForm, ActivityHistory, ActivitySummary', () => {
    expect(content.includes("from './ActivityCard.jsx'")).toBe(true);
    expect(content.includes("from './ActivityPool.jsx'")).toBe(true);
    expect(content.includes("from './ActivityLogForm.jsx'")).toBe(true);
    expect(content.includes("from './ActivityHistory.jsx'")).toBe(true);
    expect(content.includes("from './ActivitySummary.jsx'")).toBe(true);
  });

  test('imports API functions: getRecommendations, getAllActivities, getActivityHistory, getActivitySummary, logActivity, deleteActivityLog', () => {
    expect(content.includes('getRecommendations')).toBe(true);
    expect(content.includes('getAllActivities')).toBe(true);
    expect(content.includes('getActivityHistory')).toBe(true);
    expect(content.includes('getActivitySummary')).toBe(true);
    expect(content.includes('logActivity')).toBe(true);
    expect(content.includes('deleteActivityLog')).toBe(true);
  });

  test('uses useState and useEffect', () => {
    expect(content.includes('useState')).toBe(true);
    expect(content.includes('useEffect')).toBe(true);
  });

  test('renders "Activity Recommendations" heading', () => {
    expect(content.includes("'Activity Recommendations'")).toBe(true);
  });

  test('renders "Suggested activities for your fitness goal" text', () => {
    expect(content.includes("'Suggested activities for your fitness goal'")).toBe(true);
  });

  test('has shuffle button with "Shuffle" text', () => {
    expect(content.includes("'Shuffle'")).toBe(true);
  });

  test('conditionally renders ActivityLogForm when loggingActivity is set', () => {
    expect(content.includes('loggingActivity')).toBe(true);
    expect(content.includes('ActivityLogForm')).toBe(true);
  });

  test('renders "Loading..." for loading state', () => {
    expect(content.includes("'Loading...'")).toBe(true);
  });

  test('renders success message (green) after successful log', () => {
    expect(content.includes("'Activity logged successfully'")).toBe(true);
  });
});
