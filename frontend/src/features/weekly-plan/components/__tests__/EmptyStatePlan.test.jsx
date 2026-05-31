import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyStatePlan from '../EmptyStatePlan.jsx';

describe('EmptyStatePlan', () => {
  test('renders "No Weekly Plan Yet" heading', () => {
    render(<EmptyStatePlan />);
    expect(screen.getByText('No Weekly Plan Yet')).toBeInTheDocument();
  });

  test('renders "Generate My Weekly Plan" button', () => {
    render(<EmptyStatePlan />);
    expect(screen.getByText('Generate My Weekly Plan')).toBeInTheDocument();
  });

  test('calls onGenerate when button is clicked', () => {
    const onGenerate = vi.fn();
    render(<EmptyStatePlan onGenerate={onGenerate} />);
    fireEvent.click(screen.getByText('Generate My Weekly Plan'));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  test('button is disabled when isGenerating is true', () => {
    render(<EmptyStatePlan isGenerating={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('shows "Generating your plan..." when isGenerating', () => {
    render(<EmptyStatePlan isGenerating={true} />);
    expect(screen.getByText('Generating your plan...')).toBeInTheDocument();
  });

  test('shows description text by default', () => {
    render(<EmptyStatePlan />);
    expect(screen.getByText(/personalized weekly activity plan/)).toBeInTheDocument();
  });

  test('uses green (#16a34a) background for button', () => {
    render(<EmptyStatePlan />);
    const button = screen.getByRole('button');
    expect(button).toHaveStyle('background: #16a34a');
  });
});
