import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RateLimitedButton from '../RateLimitedButton.jsx';

describe('RateLimitedButton', () => {
  test('renders children text', () => {
    render(<RateLimitedButton>Click Me</RateLimitedButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('button is enabled by default', () => {
    render(<RateLimitedButton>Click Me</RateLimitedButton>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  test('shows "Regenerating..." when isLoading is true', () => {
    render(<RateLimitedButton isLoading={true}>Click Me</RateLimitedButton>);
    expect(screen.getByText('Regenerating...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('shows countdown when retryAfter is set', () => {
    render(<RateLimitedButton retryAfter={65}>Click Me</RateLimitedButton>);
    expect(screen.getByText(/Wait/)).toBeInTheDocument();
    expect(screen.getByText(/1:05/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('calls onClick when button is clicked and not disabled', () => {
    const onClick = vi.fn();
    render(<RateLimitedButton onClick={onClick}>Click Me</RateLimitedButton>);
    screen.getByText('Click Me').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when button is disabled due to loading', () => {
    const onClick = vi.fn();
    render(<RateLimitedButton onClick={onClick} isLoading={true}>Click Me</RateLimitedButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('has minHeight 44px for accessibility', () => {
    render(<RateLimitedButton>Click Me</RateLimitedButton>);
    expect(screen.getByRole('button')).toHaveStyle('minHeight: 44px');
  });
});
