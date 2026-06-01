import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('DayActivityRow completion toggle', () => {
  const baseActivity = {
    activity_id: 1,
    name: 'Running',
    duration_min: 30,
    intensity: 'moderate',
  };

  test('renders ○ toggle when completed=false', () => {
    render(<DayActivityRow activity={baseActivity} onToggle={() => {}} completed={false} />);
    const toggle = screen.getByRole('button', { name: /mark as completed/i });
    expect(toggle).toBeInTheDocument();
  });

  test('renders ✓ toggle when completed=true', () => {
    render(<DayActivityRow activity={baseActivity} onToggle={() => {}} completed={true} />);
    const toggle = screen.getByRole('button', { name: /mark as incomplete/i });
    expect(toggle).toBeInTheDocument();
  });

  test('calls onToggle when toggle button clicked', () => {
    const onToggle = vi.fn();
    render(<DayActivityRow activity={baseActivity} onToggle={onToggle} completed={false} />);
    fireEvent.click(screen.getByRole('button', { name: /mark as completed/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('does not render toggle when disabled=true', () => {
    render(<DayActivityRow activity={baseActivity} disabled={true} completed={false} />);
    expect(screen.queryByRole('button', { name: /mark as/i })).not.toBeInTheDocument();
  });
});

describe('DayActivityRow disabled state', () => {
  const baseActivity = {
    activity_id: 1,
    name: 'Running',
    duration_min: 30,
    intensity: 'moderate',
  };

  test('hides Swap button when disabled', () => {
    render(<DayActivityRow activity={baseActivity} disabled={true} />);
    expect(screen.queryByText(/Swap/i)).not.toBeInTheDocument();
  });

  test('shows ✓ indicator when disabled and completed', () => {
    render(<DayActivityRow activity={baseActivity} disabled={true} completed={true} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  test('shows activity name even when disabled', () => {
    render(<DayActivityRow activity={baseActivity} disabled={true} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  test('shows duration and intensity even when disabled', () => {
    render(<DayActivityRow activity={baseActivity} disabled={true} />);
    expect(screen.getByText(/30min/)).toBeInTheDocument();
    expect(screen.getByText(/moderate/)).toBeInTheDocument();
  });
});
