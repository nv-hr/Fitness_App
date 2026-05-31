import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FallbackBanner from '../FallbackBanner.jsx';

describe('FallbackBanner', () => {
  test('returns null for status "active"', () => {
    const { container } = render(<FallbackBanner status="active" />);
    expect(container.innerHTML).toBe('');
  });

  test('returns null for null status', () => {
    const { container } = render(<FallbackBanner status={null} />);
    expect(container.innerHTML).toBe('');
  });

  test('returns null for undefined status', () => {
    const { container } = render(<FallbackBanner />);
    expect(container.innerHTML).toBe('');
  });

  test('renders fallback message for status "fallback"', () => {
    render(<FallbackBanner status="fallback" />);
    expect(screen.getByText(/backup plan/)).toBeInTheDocument();
  });

  test('renders unavailable message for status "unavailable"', () => {
    render(<FallbackBanner status="unavailable" />);
    expect(screen.getByText(/No activity history available to generate a plan/)).toBeInTheDocument();
  });

  test('uses amber background colors', () => {
    render(<FallbackBanner status="fallback" />);
    const banner = screen.getByText(/backup plan/).closest('div');
    expect(banner).toHaveStyle('background: #fffbeb');
  });
});
