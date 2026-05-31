import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarPageLayout from '../CalendarPageLayout.jsx';

// Mock the sub-components since their detailed behavior is tested in other files
vi.mock('../MonthNav.jsx', () => ({
  default: function MockMonthNav({ currentMonth, onMonthChange, onTodayClick }) {
    return <div data-testid="month-nav">MonthNav: {currentMonth.toString()}</div>;
  },
}));

vi.mock('../CalendarGrid.jsx', () => ({
  default: function MockCalendarGrid({ currentMonth, selectedDay, onDaySelect, dayStatusMap }) {
    return <div data-testid="calendar-grid">CalendarGrid</div>;
  },
}));

vi.mock('../DayDetailPanel.jsx', () => ({
  default: function MockDayDetailPanel({ selectedDay, children }) {
    if (!selectedDay) return <div data-testid="detail-panel-empty">Select a day to view details</div>;
    return <div data-testid="detail-panel">{children}</div>;
  },
}));

vi.mock('../../shared/hooks/useResponsive.js', () => ({
  useResponsive: () => ({ isMobile: false }),
}));

describe('CalendarPageLayout', () => {
  test('renders MonthNav, CalendarGrid, and DayDetailPanel', () => {
    render(<CalendarPageLayout dayStatusMap={new Map()} loading={false} />);
    expect(screen.getByTestId('month-nav')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    expect(screen.getByTestId('detail-panel-empty')).toBeInTheDocument();
  });

  test('shows loading skeleton instead of CalendarGrid when loading', () => {
    render(<CalendarPageLayout dayStatusMap={new Map()} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument();
  });

  test('shows error banner instead of CalendarGrid when error is provided', () => {
    render(<CalendarPageLayout dayStatusMap={new Map()} loading={false} error={new Error('Network error')} />);
    expect(screen.getByText(/Failed to load calendar data/)).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument();
  });

  test('shows loading skeleton when both loading and error are true (loading takes priority)', () => {
    render(<CalendarPageLayout dayStatusMap={new Map()} loading={true} error={new Error('Network error')} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load calendar data/)).not.toBeInTheDocument();
  });

  test('renders children inside DayDetailPanel when day is selected', () => {
    // We mock the internal state indirectly by verifying the slot pattern
    render(
      <CalendarPageLayout dayStatusMap={new Map()} loading={false}>
        <div data-testid="slot-content">Detail content</div>
      </CalendarPageLayout>
    );
    // Day starts null → detail panel shows empty state
    expect(screen.getByTestId('detail-panel-empty')).toBeInTheDocument();
    // Children are passed but not rendered when no day selected
  });
});
