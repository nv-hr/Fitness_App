import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TrendPredictionCard from '../TrendPredictionCard.jsx';

vi.mock('../../api/weightApi.js');

vi.mock('../../hooks/useTrendPrediction.js', () => ({
  useTrendPrediction: vi.fn(),
}));

import * as weightApi from '../../api/weightApi.js';
import { useTrendPrediction } from '../../hooks/useTrendPrediction.js';

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

const defaultPrediction = {
  insufficientData: false,
  noGoalSet: false,
  direction: 'losing',
  rateKgPerWeek: -0.5,
  estimatedDate: new Date('2026-12-15'),
  confidence: 0.87,
  kgToGoal: -5,
  colorStatus: 'green',
  statusLabel: 'On Track',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TrendPredictionCard', () => {
  it('renders loading state', () => {
    weightApi.getWeightHistory.mockReturnValue(new Promise(() => {}));
    render(React.createElement(TrendPredictionCard));
    expect(screen.getByText('Calculating trend…')).toBeTruthy();
  });

  it('renders error state', async () => {
    weightApi.getWeightHistory.mockRejectedValue(new Error('Network error'));
    render(React.createElement(TrendPredictionCard));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('renders empty state when no entries', async () => {
    weightApi.getWeightHistory.mockResolvedValue({ data: { entries: [] } });
    render(React.createElement(TrendPredictionCard));
    await waitFor(() => {
      expect(
        screen.getByText('Log more weight entries to see your trend prediction.')
      ).toBeTruthy();
    });
  });

  it('renders insufficient data message with 2 entries', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: { entries: [makeEntry(1, 75), makeEntry(3, 76)] },
    });
    useTrendPrediction.mockReturnValue({
      insufficientData: true,
      noGoalSet: true,
      direction: null,
      rateKgPerWeek: null,
      estimatedDate: null,
      confidence: null,
      kgToGoal: null,
      colorStatus: null,
      statusLabel: null,
    });
    render(React.createElement(TrendPredictionCard));
    await waitFor(() => {
      expect(
        screen.getByText('Log more weight entries to see your trend prediction.')
      ).toBeTruthy();
    });
  });

  it('renders insufficient data when span < 2 weeks', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 75),
          makeEntry(2, 75.5),
          makeEntry(3, 76),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      insufficientData: true,
      noGoalSet: true,
      direction: null,
      rateKgPerWeek: null,
      estimatedDate: null,
      confidence: null,
      kgToGoal: null,
      colorStatus: null,
      statusLabel: null,
    });
    render(React.createElement(TrendPredictionCard));
    await waitFor(() => {
      expect(
        screen.getByText('Log more weight entries to see your trend prediction.')
      ).toBeTruthy();
    });
  });

  it('renders normal losing rate, on-track with green dot', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 76),
          makeEntry(7, 77),
          makeEntry(14, 78),
          makeEntry(21, 79),
          makeEntry(28, 80),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      direction: 'losing',
      rateKgPerWeek: -0.5,
      colorStatus: 'green',
      statusLabel: 'On Track',
      noGoalSet: false,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 70,
          target_date: '2026-12-31',
          fitness_goal: 'lose_weight',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText(/Losing/)).toBeTruthy();
      expect(screen.getByText('On Track')).toBeTruthy();
    });
  });

  it('renders normal gaining rate, on-track with green dot', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 78),
          makeEntry(7, 77),
          makeEntry(14, 76),
          makeEntry(21, 75),
          makeEntry(28, 74),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      direction: 'gaining',
      rateKgPerWeek: 0.5,
      colorStatus: 'green',
      statusLabel: 'On Track',
      noGoalSet: false,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 80,
          target_date: '2026-12-31',
          fitness_goal: 'build_muscle',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText(/Gaining/)).toBeTruthy();
      expect(screen.getByText('On Track')).toBeTruthy();
    });
  });

  it('renders amber (slower than expected) with amber dot', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 76),
          makeEntry(7, 76.05),
          makeEntry(14, 76.1),
          makeEntry(21, 76.15),
          makeEntry(28, 76.2),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      direction: 'losing',
      rateKgPerWeek: -0.05,
      colorStatus: 'amber',
      statusLabel: 'Slower than expected',
      noGoalSet: false,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 70,
          target_date: '2026-12-31',
          fitness_goal: 'lose_weight',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText('Slower than expected')).toBeTruthy();
    });
  });

  it('renders red (off-track) with red dot', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 76),
          makeEntry(7, 75),
          makeEntry(14, 74),
          makeEntry(21, 73),
          makeEntry(28, 72),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      direction: 'gaining',
      rateKgPerWeek: 0.5,
      colorStatus: 'red',
      statusLabel: 'Off Track',
      noGoalSet: false,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 80,
          target_date: '2026-12-31',
          fitness_goal: 'lose_weight',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText('Off Track')).toBeTruthy();
    });
  });

  it('renders rate string only when no goal set', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 75),
          makeEntry(7, 76),
          makeEntry(14, 77),
          makeEntry(21, 78),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      noGoalSet: true,
      colorStatus: 'neutral',
      statusLabel: null,
      estimatedDate: null,
      direction: 'losing',
      rateKgPerWeek: -0.5,
    });
    render(React.createElement(TrendPredictionCard));
    await waitFor(() => {
      // Should show rate string
      expect(screen.getByText(/Losing/)).toBeTruthy();
      // Should NOT show completion date
      expect(screen.queryByText(/Estimated completion/)).toBeNull();
      // Should NOT show status label
      expect(screen.queryByText('On Track')).toBeNull();
    });
  });

  it('renders stable (maintain) with grey dot', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 75),
          makeEntry(7, 75.01),
          makeEntry(14, 74.99),
          makeEntry(21, 75.01),
          makeEntry(28, 75),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      direction: 'stable',
      rateKgPerWeek: -0.001,
      colorStatus: 'green',
      statusLabel: 'On Track',
      noGoalSet: false,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 75,
          target_date: '2026-12-31',
          fitness_goal: 'maintain',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText('Stable weight')).toBeTruthy();
    });
  });

  it('refreshKey triggers re-fetch', async () => {
    weightApi.getWeightHistory.mockResolvedValue({ data: { entries: [] } });
    useTrendPrediction.mockReturnValue({
      insufficientData: true,
      noGoalSet: true,
      direction: null,
      rateKgPerWeek: null,
      estimatedDate: null,
      confidence: null,
      kgToGoal: null,
      colorStatus: null,
      statusLabel: null,
    });
    const { rerender } = render(React.createElement(TrendPredictionCard));
    await waitFor(() => {
      expect(weightApi.getWeightHistory).toHaveBeenCalledTimes(1);
    });
    rerender(React.createElement(TrendPredictionCard, { refreshKey: 1 }));
    await waitFor(() => {
      expect(weightApi.getWeightHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('renders estimated completion date', async () => {
    const estimatedDate = new Date('2026-09-14');
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 76),
          makeEntry(7, 77),
          makeEntry(14, 78),
          makeEntry(21, 79),
          makeEntry(28, 80),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      noGoalSet: false,
      colorStatus: 'green',
      statusLabel: 'On Track',
      estimatedDate,
      direction: 'losing',
      rateKgPerWeek: -0.5,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 70,
          target_date: '2026-12-31',
          fitness_goal: 'lose_weight',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText(/Estimated goal reached/)).toBeTruthy();
    });
  });

  it('renders confidence text', async () => {
    weightApi.getWeightHistory.mockResolvedValue({
      data: {
        entries: [
          makeEntry(1, 76),
          makeEntry(7, 77),
          makeEntry(14, 78),
          makeEntry(21, 79),
          makeEntry(28, 80),
        ],
      },
    });
    useTrendPrediction.mockReturnValue({
      ...defaultPrediction,
      noGoalSet: false,
      colorStatus: 'green',
      statusLabel: 'On Track',
      confidence: 0.87,
    });
    render(
      React.createElement(TrendPredictionCard, {
        profile: {
          target_weight_kg: 70,
          target_date: '2026-12-31',
          fitness_goal: 'lose_weight',
        },
      })
    );
    await waitFor(() => {
      expect(screen.getByText(/Strong fit/)).toBeTruthy();
    });
  });
});
