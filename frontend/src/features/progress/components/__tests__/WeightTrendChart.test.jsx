import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WeightTrendChart from '../WeightTrendChart.jsx';

vi.mock('../../api/weightApi.js');

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  const MockResponsiveContainer = ({ children }) => (
    <div style={{ width: 800, height: 300 }}>{children}</div>
  );
  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

import * as weightApi from '../../api/weightApi.js';

const today = new Date();

function makeEntry(daysAgo, weight) {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: daysAgo,
    weight_kg: String(weight),
    logged_date: d.toISOString().split('T')[0],
    source: 'manual',
    notes: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WeightTrendChart', () => {
  it('renders loading state', () => {
    weightApi.getWeightHistory.mockReturnValue(new Promise(() => {}));
    render(React.createElement(WeightTrendChart));
    expect(screen.getByText('Loading chart…')).toBeTruthy();
  });

  it('renders error state', async () => {
    weightApi.getWeightHistory.mockRejectedValue(new Error('API error'));
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(screen.getByText('API error')).toBeTruthy();
    });
  });

  it('renders empty state when no entries', async () => {
    weightApi.getWeightHistory.mockResolvedValue({ data: { entries: [] } });
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(screen.getByText(/No weight data yet/)).toBeTruthy();
    });
  });

  it('renders insufficient data message with 1 entry', async () => {
    weightApi.getWeightHistory.mockResolvedValue({ data: { entries: [makeEntry(1, 75)] } });
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(screen.getByText(/Log at least 2 entries/)).toBeTruthy();
    });
  });

  it('renders recharts chart with 2+ entries', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(1, 75), makeEntry(2, 76)] },
    });
    const { container } = render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      const wrapper = container.querySelector('.recharts-wrapper');
      expect(wrapper).toBeTruthy();
    });
  });

  it('renders chart with data when profile has target_weight_kg', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(1, 75), makeEntry(2, 76)] },
    });
    const { container } = render(React.createElement(WeightTrendChart, { profile: { target_weight_kg: 70 } }));
    await waitFor(() => {
      const wrapper = container.querySelector('.recharts-wrapper');
      expect(wrapper).toBeTruthy();
    });
  });

  it('does not show goal line when profile is not provided', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(1, 75), makeEntry(2, 76)] },
    });
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(screen.queryByText(/Goal:/)).toBeNull();
    });
  });

  it('date range filter leaves only in-range entries', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(5, 75), makeEntry(40, 76), makeEntry(80, 77)] },
    });
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(screen.getByText('30d')).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByText(/Log at least 2 entries/)).toBeTruthy();
    });
  });

  it('active range button has highlighted style', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(1, 75), makeEntry(2, 76)] },
    });
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      const btn30 = screen.getByText('30d');
      expect(btn30.className).toMatch(/bg-emerald-700/);
    });
  });

  it('refreshKey triggers re-fetch', async () => {
    weightApi.getWeightHistory.mockResolvedValue({ data: { entries: [] } });
    const { rerender } = render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(weightApi.getWeightHistory).toHaveBeenCalledTimes(1);
    });
    rerender(React.createElement(WeightTrendChart, { refreshKey: 1 }));
    await waitFor(() => {
      expect(weightApi.getWeightHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('shows no-data-in-range when entries exist but outside range', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(100, 75), makeEntry(95, 76)] },
    });
    render(React.createElement(WeightTrendChart));
    await waitFor(() => {
      expect(screen.getByText(/No data in the selected range/)).toBeTruthy();
    });
  });
});
