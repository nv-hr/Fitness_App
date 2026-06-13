import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayActivityRow } from '../../../../shared/ui';

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
    expect(screen.getByText(/30\s*mins/i)).toBeInTheDocument();
    expect(screen.getByText(/Moderate/i)).toBeInTheDocument();
  });

  test('renders light intensity text', () => {
    const activity = { ...baseActivity, intensity: 'light' };
    render(<DayActivityRow activity={activity} />);
    expect(screen.getByText(/Light/i)).toBeInTheDocument();
  });

  test('renders moderate intensity text', () => {
    render(<DayActivityRow activity={baseActivity} />);
    expect(screen.getByText(/Moderate/i)).toBeInTheDocument();
  });

  test('renders vigorous intensity text', () => {
    const activity = { ...baseActivity, intensity: 'vigorous' };
    render(<DayActivityRow activity={activity} />);
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });
});

describe('DayActivityRow completion toggle', () => {
  const baseActivity = {
    activity_id: 1,
    name: 'Running',
    duration_min: 30,
    intensity: 'moderate',
  };

  test('renders Active toggle when completed=false', () => {
    render(<DayActivityRow activity={baseActivity} onToggle={() => {}} completed={false} />);
    const toggle = screen.getByRole('button', { name: /mark completed/i });
    expect(toggle).toBeInTheDocument();
  });

  test('renders Done toggle when completed=true', () => {
    render(<DayActivityRow activity={baseActivity} onToggle={() => {}} completed={true} />);
    const toggle = screen.getByRole('button', { name: /mark incomplete/i });
    expect(toggle).toBeInTheDocument();
  });

  test('calls onToggle when toggle button clicked', () => {
    const onToggle = vi.fn();
    render(<DayActivityRow activity={baseActivity} onToggle={onToggle} completed={false} />);
    fireEvent.click(screen.getByRole('button', { name: /mark completed/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('does disable toggle when disableToggle=true', () => {
    render(<DayActivityRow activity={baseActivity} disableToggle={true} completed={false} />);
    const toggle = screen.getByRole('button', { name: /mark completed/i });
    expect(toggle).toBeDisabled();
  });
});

describe('DayActivityRow disabled state', () => {
  const baseActivity = {
    activity_id: 1,
    name: 'Running',
    duration_min: 30,
    intensity: 'moderate',
  };

  test('Swap button is disabled when disableSwap=true', () => {
    render(<DayActivityRow activity={baseActivity} disableSwap={true} />);
    const swapBtn = screen.getByText(/Swap/i).closest('button');
    expect(swapBtn).toBeDisabled();
  });

  test('shows Done text when completed', () => {
    render(<DayActivityRow activity={baseActivity} disableToggle={true} completed={true} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  test('shows activity name', () => {
    render(<DayActivityRow activity={baseActivity} disableToggle={true} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  test('shows duration and intensity', () => {
    render(<DayActivityRow activity={baseActivity} disableToggle={true} />);
    expect(screen.getByText(/30\s*mins/i)).toBeInTheDocument();
    expect(screen.getByText(/Moderate/i)).toBeInTheDocument();
  });
});
