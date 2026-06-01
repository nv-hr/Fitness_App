import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DayDetailPanel from '../DayDetailPanel.jsx';

describe('DayDetailPanel', () => {
  test('shows placeholder when no day selected', () => {
    render(<DayDetailPanel selectedDay={null} />);
    expect(screen.getByText('Select a day to view details')).toBeInTheDocument();
  });

  test('shows formatted date when day selected', () => {
    const date = new Date(2026, 2, 15); // March 15, 2026
    render(<DayDetailPanel selectedDay={date} />);
    expect(screen.getByText(/Selected day:/)).toBeInTheDocument();
    expect(screen.getByText(/March 15, 2026/)).toBeInTheDocument();
  });

  test('renders children slot when day selected', () => {
    const date = new Date(2026, 2, 15);
    render(
      <DayDetailPanel selectedDay={date}>
        <div data-testid="child-content">Day details go here</div>
      </DayDetailPanel>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  test('does not render children when no day selected', () => {
    render(
      <DayDetailPanel selectedDay={null}>
        <div data-testid="child-content">Should not appear</div>
      </DayDetailPanel>
    );
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });
});
