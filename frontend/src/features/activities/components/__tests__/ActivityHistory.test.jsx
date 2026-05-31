import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityHistory from '../ActivityHistory.jsx';

const mockHistory = [
  {
    logged_date: '2026-01-05',
    total_minutes: 75,
    total_burned: 450,
    entries: [
      { id: 1, activity_name: 'Running', duration_min: 30, intensity: 'moderate', calories_burned: 300 },
      { id: 2, activity_name: 'Yoga', duration_min: 45, intensity: 'light', calories_burned: 150 },
    ],
  },
  {
    logged_date: '2026-01-04',
    total_minutes: 30,
    total_burned: 200,
    entries: [
      { id: 3, activity_name: 'Cycling', duration_min: 30, intensity: 'vigorous', calories_burned: 200 },
    ],
  },
];

describe('ActivityHistory', () => {
  test('renders "Activity History" heading', () => {
    render(<ActivityHistory history={[]} onDelete={vi.fn()} />);
    expect(screen.getByText('Activity History')).toBeInTheDocument();
  });

  test('renders "No activity logged yet" for empty history', () => {
    render(<ActivityHistory history={[]} onDelete={vi.fn()} />);
    expect(screen.getByText('No activity logged yet')).toBeInTheDocument();
  });

  test('renders logged dates when history has entries', () => {
    render(<ActivityHistory history={mockHistory} onDelete={vi.fn()} />);
    expect(screen.getByText('2026-01-05')).toBeInTheDocument();
    expect(screen.getByText('2026-01-04')).toBeInTheDocument();
  });

  test('renders duration and calories per day', () => {
    render(<ActivityHistory history={mockHistory} onDelete={vi.fn()} />);
    expect(screen.getByText(/75/)).toBeInTheDocument();
    expect(screen.getByText(/450/)).toBeInTheDocument();
  });

  test('renders delete buttons and entry details when expanded', () => {
    render(<ActivityHistory history={mockHistory} onDelete={vi.fn()} />);
    // Click to expand first day
    const dateHeader = screen.getByText('2026-01-05');
    fireEvent.click(dateHeader.closest('div'));
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getAllByText('Delete').length).toBe(2);
  });

  test('calls onDelete with entry id when delete is clicked', () => {
    const onDelete = vi.fn();
    render(<ActivityHistory history={mockHistory} onDelete={onDelete} />);
    // Expand and click delete
    const dateHeader = screen.getByText('2026-01-05');
    fireEvent.click(dateHeader.closest('div'));
    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test('has collapsible toggle ▲/▼', () => {
    render(<ActivityHistory history={mockHistory} onDelete={vi.fn()} />);
    // Both days show ▼ when collapsed
    expect(screen.getAllByText('▼').length).toBe(2);
    const dateHeader = screen.getByText('2026-01-05');
    fireEvent.click(dateHeader.closest('div'));
    expect(screen.getAllByText('▲').length).toBe(1);
    expect(screen.getAllByText('▼').length).toBe(1);
  });
});
