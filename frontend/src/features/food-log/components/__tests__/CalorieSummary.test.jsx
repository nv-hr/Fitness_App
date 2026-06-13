import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CalorieSummary from '../CalorieSummary';

describe('CalorieSummary', () => {
  it('renders total consumed calories', () => {
    render(<CalorieSummary totalConsumed={1500} calorieTarget={2000} remaining={500} isExtremeDeficit={false} />);
    expect(screen.getByText('Consumed')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('renders calorie target if provided', () => {
    render(<CalorieSummary totalConsumed={1500} calorieTarget={2000} remaining={500} isExtremeDeficit={false} />);
    expect(screen.getByText('TDEE Target')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('displays excess warning if consumed exceeds target', () => {
    render(<CalorieSummary totalConsumed={2500} calorieTarget={2000} remaining={0} isExtremeDeficit={false} />);
    expect(screen.getByText('Calorie Excess! (+500 kcal)')).toBeInTheDocument();
  });

  it('displays extreme deficit warning if applicable', () => {
    render(<CalorieSummary totalConsumed={1000} calorieTarget={2000} remaining={1000} isExtremeDeficit={true} />);
    expect(screen.getByText(/Nutrition Warning: Your calorie intake is extremely low/)).toBeInTheDocument();
  });
});
