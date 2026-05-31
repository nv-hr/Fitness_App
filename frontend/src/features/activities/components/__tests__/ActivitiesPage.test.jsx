import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ActivitiesPage from '../ActivitiesPage.jsx';

// Mock the activityApi module
vi.mock('../../api/activityApi.js', () => ({
  getRecommendations: vi.fn(),
  getAllActivities: vi.fn(),
  getActivityHistory: vi.fn(),
  getActivitySummary: vi.fn(),
  logActivity: vi.fn(),
  deleteActivityLog: vi.fn(),
}));

import { getRecommendations, getAllActivities, getActivityHistory, getActivitySummary } from '../../api/activityApi.js';

describe('ActivitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows Loading... on initial render', () => {
    getRecommendations.mockReturnValue(new Promise(() => {}));
    getAllActivities.mockReturnValue(new Promise(() => {}));
    getActivityHistory.mockReturnValue(new Promise(() => {}));
    getActivitySummary.mockReturnValue(new Promise(() => {}));
    render(<ActivitiesPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders "Activity Recommendations" heading after load', async () => {
    getRecommendations.mockResolvedValue({ data: { activities: [] } });
    getAllActivities.mockResolvedValue({ data: { activities: [] } });
    getActivitySummary.mockResolvedValue(null);
    getActivityHistory.mockResolvedValue([]);
    render(<ActivitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Activity Recommendations')).toBeInTheDocument();
    });
  });

  test('renders "Suggested activities for your fitness goal" text', async () => {
    getRecommendations.mockResolvedValue({ data: { activities: [] } });
    getAllActivities.mockResolvedValue({ data: { activities: [] } });
    getActivitySummary.mockResolvedValue(null);
    getActivityHistory.mockResolvedValue([]);
    render(<ActivitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Suggested activities for your fitness goal')).toBeInTheDocument();
    });
  });

  test('has a Shuffle button', async () => {
    getRecommendations.mockResolvedValue({ data: { activities: [] } });
    getAllActivities.mockResolvedValue({ data: { activities: [] } });
    getActivitySummary.mockResolvedValue(null);
    getActivityHistory.mockResolvedValue([]);
    render(<ActivitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Shuffle')).toBeInTheDocument();
    });
  });

  test('renders recommendations when available', async () => {
    getRecommendations.mockResolvedValue({
      data: {
        activities: [
          { id: 1, name: 'Running', description: 'Cardio', estimated_calories: 300, duration_min: 30 },
        ],
      },
    });
    getAllActivities.mockResolvedValue({ data: { activities: [] } });
    getActivitySummary.mockResolvedValue(null);
    getActivityHistory.mockResolvedValue([]);
    render(<ActivitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  test('renders ActivitySummary when summary is available', async () => {
    getRecommendations.mockResolvedValue({ data: { activities: [] } });
    getAllActivities.mockResolvedValue({ data: { activities: [] } });
    getActivitySummary.mockResolvedValue({
      data: {
        totalActiveMinutes: 30,
        totalCaloriesBurned: 300,
        totalConsumed: 500,
        calorieTarget: 2000,
        netCalories: 200,
        netVsTarget: -1500,
      },
    });
    getActivityHistory.mockResolvedValue({ data: [] });
    render(<ActivitiesPage />);
    await waitFor(() => {
      expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    });
  });
});
