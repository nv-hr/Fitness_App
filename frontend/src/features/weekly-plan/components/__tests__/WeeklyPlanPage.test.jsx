import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WeeklyPlanPage from '../WeeklyPlanPage.jsx';

// Mock the weeklyPlanApi module
vi.mock('../../api/weeklyPlanApi.js', () => ({
  getWeeklyPlan: vi.fn(),
  generateWeeklyPlan: vi.fn(),
  regenerateDay: vi.fn(),
}));

import { getWeeklyPlan } from '../../api/weeklyPlanApi.js';

const mockPlan = {
  data: {
    plan: {
      status: 'active',
      days: [
        { date: '2026-01-05', activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }] },
        { date: '2026-01-06', activities: [{ activity_id: 2, name: 'Yoga', duration_min: 45, intensity: 'light' }] },
        { date: '2026-01-07', activities: [] },
        { date: '2026-01-08', activities: [{ activity_id: 3, name: 'Cycling', duration_min: 60, intensity: 'vigorous' }] },
        { date: '2026-01-09', activities: [{ activity_id: 1, name: 'Running', duration_min: 20, intensity: 'moderate' }] },
        { date: '2026-01-10', activities: [{ activity_id: 4, name: 'Swimming', duration_min: 30, intensity: 'moderate' }] },
        { date: '2026-01-11', activities: [{ activity_id: 2, name: 'Yoga', duration_min: 30, intensity: 'moderate' }] },
      ],
    },
  },
};

describe('WeeklyPlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows Loading... on initial render', () => {
    getWeeklyPlan.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WeeklyPlanPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders "Weekly Activity Plan" heading when plan is loaded', async () => {
    getWeeklyPlan.mockResolvedValue(mockPlan);
    render(<WeeklyPlanPage />);
    await waitFor(() => {
      expect(screen.getByText('Weekly Activity Plan')).toBeInTheDocument();
    });
  });

  test('renders EmptyStatePlan when no plan exists', async () => {
    getWeeklyPlan.mockResolvedValue({ data: {} }); // no plan in response
    render(<WeeklyPlanPage />);
    await waitFor(() => {
      expect(screen.getByText('No Weekly Plan Yet')).toBeInTheDocument();
    });
  });

  test('renders "Try Again" button in error state when plan fetch fails', async () => {
    getWeeklyPlan.mockRejectedValue(new Error('Network error'));
    render(<WeeklyPlanPage />);
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  test('renders FallbackBanner when plan status is fallback', async () => {
    getWeeklyPlan.mockResolvedValue({
      data: {
        plan: {
          status: 'fallback',
          days: [
            { date: '2026-01-05', activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }] },
            { date: '2026-01-06', activities: [{ activity_id: 2, name: 'Yoga', duration_min: 45, intensity: 'light' }] },
            { date: '2026-01-07', activities: [] },
            { date: '2026-01-08', activities: [{ activity_id: 3, name: 'Cycling', duration_min: 60, intensity: 'vigorous' }] },
            { date: '2026-01-09', activities: [{ activity_id: 1, name: 'Running', duration_min: 20, intensity: 'moderate' }] },
            { date: '2026-01-10', activities: [{ activity_id: 4, name: 'Swimming', duration_min: 30, intensity: 'moderate' }] },
            { date: '2026-01-11', activities: [{ activity_id: 2, name: 'Yoga', duration_min: 30, intensity: 'moderate' }] },
          ],
        },
      },
    });
    render(<WeeklyPlanPage />);
    await waitFor(() => {
      expect(screen.getByText(/backup plan/)).toBeInTheDocument();
    });
  });
});
