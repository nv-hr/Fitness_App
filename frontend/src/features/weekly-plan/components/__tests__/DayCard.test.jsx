import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DayCard from '../DayCard.jsx';

const mockDay = {
  date: '2026-01-05',
  activities: [
    { activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' },
    { activity_id: 2, name: 'Yoga', duration_min: 45, intensity: 'light' },
  ],
};

describe('DayCard', () => {
  test('renders day header with formatted date', () => {
    render(<DayCard day={mockDay} />);
    expect(screen.getByText('Monday, January 5')).toBeInTheDocument();
  });

  test('renders activity count and total minutes in collapsed state', () => {
    render(<DayCard day={mockDay} />);
    expect(screen.getByText(/2 activities/)).toBeInTheDocument();
    expect(screen.getByText(/75min total/)).toBeInTheDocument();
  });

  test('shows expand arrow (▼) when collapsed', () => {
    render(<DayCard day={mockDay} />);
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  test('toggles expand/collapse on header click', () => {
    render(<DayCard day={mockDay} />);
    const header = screen.getByText('Monday, January 5').closest('div');
    fireEvent.click(header);
    expect(screen.getByText('▲')).toBeInTheDocument();
    expect(screen.queryByText('▼')).not.toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  test('shows "No activities scheduled" when day has no activities', () => {
    const emptyDay = { date: '2026-01-06', activities: [] };
    render(<DayCard day={emptyDay} />);
    const header = screen.getByText(/Tuesday, January 6/);
    fireEvent.click(header);
    expect(screen.getByText('No activities scheduled for this day')).toBeInTheDocument();
  });

  test('renders Regenerate Day button inside expanded section', () => {
    render(<DayCard day={mockDay} />);
    const header = screen.getByText('Monday, January 5').closest('div');
    fireEvent.click(header);
    expect(screen.getByText('Regenerate Day')).toBeInTheDocument();
  });

  test('shows correct activity count grammar for single activity', () => {
    const singleDay = { date: '2026-01-06', activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }] };
    render(<DayCard day={singleDay} />);
    expect(screen.getByText(/1 activity/)).toBeInTheDocument();
  });
});
