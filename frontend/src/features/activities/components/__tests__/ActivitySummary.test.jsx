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

  test('renders no activity text when all zeros', () => {
    const summary = { totalActiveMinutes: 0, totalCaloriesBurned: 0, totalConsumed: 0, calorieTarget: 2000, netCalories: 0, netVsTarget: null };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/You haven't logged any workouts today/)).toBeInTheDocument();
  });

  test('renders active minutes and burned when activity exists', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 500, calorieTarget: 2000, netCalories: 200, netVsTarget: -1500 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText('Workout Duration')).toBeInTheDocument();
    expect(screen.getByText('Calories Burned')).toBeInTheDocument();
    expect(screen.getByText('Logged Meals')).toBeInTheDocument();
    expect(screen.getByText('BMR Goal')).toBeInTheDocument();
  });

  test('renders "Healthy Deficit Monitored" when netVsTarget is 0', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 500, calorieTarget: 2000, netCalories: 200, netVsTarget: 0 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/Healthy Deficit Monitored/)).toBeInTheDocument();
  });

  test('renders "Surplus" when netVsTarget is positive', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 2500, calorieTarget: 2000, netCalories: 2200, netVsTarget: 200 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/Surplus/)).toBeInTheDocument();
  });

  test('renders "Deficit" when netVsTarget is negative', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 1500, calorieTarget: 2000, netCalories: 1200, netVsTarget: -800 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText('Deficit Goal Met (Good!)')).toBeInTheDocument();
  });

  test('shows net calories value', () => {
    const summary = { totalActiveMinutes: 30, totalCaloriesBurned: 300, totalConsumed: 1500, calorieTarget: 2000, netCalories: 1200, netVsTarget: -800 };
    render(<ActivitySummary summary={summary} />);
    expect(screen.getByText(/Daily Net Calories/)).toBeInTheDocument();
    expect(screen.getByText(/1200/)).toBeInTheDocument();
  });
});
