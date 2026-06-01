import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MealCalendarPage from '../MealCalendarPage.jsx';

vi.mock('../../api/dailyMealPlanApi.js', () => ({
  getDailyMealPlan: vi.fn(),
  generateDailyMealPlan: vi.fn(),
  logMeals: vi.fn(),
}));

vi.mock('../../hooks/useMonthMealData.js', () => ({
  useMonthMealData: vi.fn(() => ({
    dayStatusMap: new Map(),
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('../../../../shared/calendar/CalendarPageLayout.jsx', () => ({
  default: function MockCalendarPageLayout({ dayStatusMap, loading, error, onMonthChange, onDaySelect, children }) {
    return (
      <div data-testid="calendar-page-layout">
        <div data-testid="mock-month-nav">MonthNav</div>
        <div data-testid="mock-calendar-grid">CalendarGrid</div>
        <div data-testid="mock-detail-panel">
          {children || <div>Select a day to view details</div>}
        </div>
      </div>
    );
  },
}));

vi.mock('../../../../shared/hooks/useResponsive.js', () => ({
  useResponsive: () => ({ isMobile: false }),
}));

import { getDailyMealPlan, generateDailyMealPlan } from '../../api/dailyMealPlanApi.js';
import { useMonthMealData } from '../../hooks/useMonthMealData.js';

describe('MealCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDailyMealPlan.mockResolvedValue({ data: { plan: null } });
    generateDailyMealPlan.mockResolvedValue({ data: { plan: null } });
  });

  test('renders page title', async () => {
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Meal Calendar')).toBeInTheDocument();
    });
  });

  test('renders Generate Day button', async () => {
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Generate Day')).toBeInTheDocument();
    });
  });

  test('renders CalendarPageLayout', async () => {
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-page-layout')).toBeInTheDocument();
    });
  });

  test('shows Generating... while generating', async () => {
    generateDailyMealPlan.mockReturnValue(new Promise(() => {}));
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });
  });

  test('calls generateDailyMealPlan on Generate Day click', async () => {
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Generate Day')).toBeInTheDocument();
    });
    // Auto-gen fires once on mount, click fires second
    fireEvent.click(screen.getByText('Generate Day'));
    await waitFor(() => {
      expect(generateDailyMealPlan).toHaveBeenCalledTimes(2);
    });
  });

  test('detail panel shows placeholder when no day selected', async () => {
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-detail-panel')).toBeInTheDocument();
    });
  });

  test('renders with loading state', async () => {
    useMonthMealData.mockReturnValue({
      dayStatusMap: new Map(),
      loading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-page-layout')).toBeInTheDocument();
    });
  });

  test('renders with error state', async () => {
    useMonthMealData.mockReturnValue({
      dayStatusMap: new Map(),
      loading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });
    render(<MealCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-page-layout')).toBeInTheDocument();
    });
  });
});
