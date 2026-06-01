import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ActivityCalendarPage from '../../ActivityCalendarPage.jsx';

// Mock the API module
vi.mock('../../api/activityCalendarApi.js', () => ({
  getWeeklyPlan: vi.fn(),
  generateWeeklyPlan: vi.fn(),
  swapActivity: vi.fn(),
  toggleActivityComplete: vi.fn(),
}));

// Mock useMonthData
vi.mock('../../../../shared/calendar/hooks/useMonthData.js', () => ({
  useMonthData: vi.fn(() => ({
    dayStatusMap: new Map(),
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock CalendarPageLayout to accept onDaySelect and render children in day panel
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

// Mock Toast
vi.mock('../../../weekly-plan/components/Toast.jsx', () => ({
  default: function MockToast({ message }) {
    return <div data-testid="toast">{message}</div>;
  },
}));

// Mock useResponsive
vi.mock('../../../../shared/hooks/useResponsive.js', () => ({
  useResponsive: () => ({ isMobile: false }),
}));

// Mock DayActivityRow
vi.mock('../../../weekly-plan/components/DayActivityRow.jsx', () => ({
  default: function MockDayActivityRow({ activity, onSwap, isSwapping, swapRetryAfter, onToggle, disabled, completed }) {
    return (
      <div data-testid="day-activity-row"
        data-activity-id={activity.activity_id}
        data-disabled={disabled}
        data-completed={completed}>
        <span>{activity.name}</span>
        {!disabled && <button data-testid={`swap-${activity.activity_id}`} onClick={onSwap}>Swap</button>}
        {!disabled && (
          <button data-testid={`toggle-${activity.activity_id}`} onClick={onToggle}>
            {completed ? '✓' : '○'}
          </button>
        )}
        {disabled && completed && <span data-testid="completed-indicator">✓</span>}
      </div>
    );
  },
}));

import { getWeeklyPlan, generateWeeklyPlan } from '../../api/activityCalendarApi.js';
import { useMonthData } from '../../../../shared/calendar/hooks/useMonthData.js';

describe('ActivityCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWeeklyPlan.mockResolvedValue({ data: { plan: null } });
    generateWeeklyPlan.mockResolvedValue({ data: { plan: { days: [] } } });
  });

  test('renders page title', async () => {
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Activity Calendar')).toBeInTheDocument();
    });
  });

  test('renders Generate Week button', async () => {
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Generate Week')).toBeInTheDocument();
    });
  });

  test('renders CalendarPageLayout with calendar grid', async () => {
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-page-layout')).toBeInTheDocument();
    });
  });

  test('shows Generating... when plan is being generated', async () => {
    generateWeeklyPlan.mockReturnValue(new Promise(() => {}));
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });
  });

  test('calls generateWeeklyPlan on Generate Week click', async () => {
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText('Generate Week')).toBeInTheDocument();
    });
    // Note: auto-generation useEffect calls generateWeeklyPlan once on mount
    // (empty dayStatusMap means today has no status, triggering auto-gen).
    // The click fires a second call, so we expect 2 total.
    fireEvent.click(screen.getByText('Generate Week'));
    await waitFor(() => {
      expect(generateWeeklyPlan).toHaveBeenCalledTimes(2);
    });
  });

  test('day detail panel shows empty state when no day selected', async () => {
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-detail-panel')).toBeInTheDocument();
    });
  });

  test('renders with loading state from useMonthData', async () => {
    useMonthData.mockReturnValue({
      dayStatusMap: new Map(),
      loading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-page-layout')).toBeInTheDocument();
    });
  });

  test('renders with error state from useMonthData', async () => {
    useMonthData.mockReturnValue({
      dayStatusMap: new Map(),
      loading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });
    render(<ActivityCalendarPage />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-page-layout')).toBeInTheDocument();
    });
  });
});
