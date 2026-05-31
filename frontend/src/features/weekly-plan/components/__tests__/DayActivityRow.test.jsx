import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DayActivityRow from '../DayActivityRow.jsx';

describe('DayActivityRow', () => {
  const baseActivity = {
    activity_id: 1,
    name: 'Running',
    duration_min: 30,
    intensity: 'moderate',
  };

  test('renders activity name', () => {
    render(<DayActivityRow activity={baseActivity} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  test('renders duration and intensity', () => {
    render(<DayActivityRow activity={baseActivity} />);
    expect(screen.getByText(/30min/)).toBeInTheDocument();
    expect(screen.getByText(/moderate/)).toBeInTheDocument();
  });

  test('applies light intensity color (#6b7280)', () => {
    const activity = { ...baseActivity, intensity: 'light' };
    render(<DayActivityRow activity={activity} />);
    const span = screen.getByText(/30min/);
    expect(span).toHaveStyle('color: #6b7280');
  });

  test('applies moderate intensity color (inherit / rgb(0,0,0))', () => {
    render(<DayActivityRow activity={baseActivity} />);
    const span = screen.getByText(/30min/);
    // 'inherit' computes to rgb(0, 0, 0) in jsdom — either is acceptable
    const style = window.getComputedStyle(span);
    expect(['inherit', 'rgb(0, 0, 0)', '#000', 'black']).toContain(style.color);
  });

  test('applies vigorous intensity color (#b45309)', () => {
    const activity = { ...baseActivity, intensity: 'vigorous' };
    render(<DayActivityRow activity={activity} />);
    const span = screen.getByText(/30min/);
    expect(span).toHaveStyle('color: #b45309');
  });
});
