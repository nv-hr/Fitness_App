import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivitySummary from '../ActivitySummary.jsx';

describe('ActivitySummary', () => {
  test('returns null when summary is null', () => {
    const { container } = render(<ActivitySummary summary={null} />);
    expect(container.innerHTML).toBe('');
  });

  test('returns null when summary is undefined', () => {
    const { container } = render(<ActivitySummary />);
    expect(container.innerHTML).toBe('');
  });

  test('renders "Activity Summary" heading', () => {
    const summary = { totalActiveMinutes: 0, totalCaloriesBurned: 0, totalConsumed: 0, calorieTarget: 2000, netCalories: 0, netVsTarget: null };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText('Activity Summary')).toBeInTheDocument();
  });

  test('renders "No activity logged today" when all zeros', () => {
    const summary = { totalActiveMinutes: 0, totalCaloriesBurned: 0, totalConsumed: 0, calorieTarget: 2000, netCalories: 0, netVsTarget: null };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText('No activity logged today')).toBeInTheDocument();
  });

  test('renders active minutes and burned when activity exists', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 500, calorieTarget: 2000, netCalories: 200, netVsTarget: -1500 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText('Active Minutes')).toBeInTheDocument();
    expect(screen.getByText('Burned')).toBeInTheDocument();
    expect(screen.getByText('Consumed')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  test('renders "On track" when netVsTarget is 0', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 500, calorieTarget: 2000, netCalories: 200, netVsTarget: 0 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/On track/)).toBeInTheDocument();
  });

  test('renders "Surplus" when netVsTarget is positive', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 2500, calorieTarget: 2000, netCalories: 2200, netVsTarget: 200 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/Surplus/)).toBeInTheDocument();
  });

  test('renders "Deficit" when netVsTarget is negative', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 1500, calorieTarget: 2000, netCalories: 1200, netVsTarget: -800 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/Deficit/)).toBeInTheDocument();
  });

  test('shows net calories value', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 1500, calorieTarget: 2000, netCalories: 1200, netVsTarget: -800 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/Net/)).toBeInTheDocument();
    expect(screen.getByText(/1200/)).toBeInTheDocument();
  });
});
