import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressPage from '../ProgressPage.jsx';

vi.mock('../../api/weightApi.js');

import * as weightApi from '../../api/weightApi.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProgressPage', () => {
  it('renders heading', () => {
    weightApi.getWeightHistory.mockReturnValue(new Promise(() => {}));
    render(React.createElement(ProgressPage));
    expect(screen.getByText('Progress')).toBeTruthy();
  });

  it('renders all three sections', () => {
    weightApi.getWeightHistory.mockReturnValue(new Promise(() => {}));
    render(React.createElement(ProgressPage));
    expect(screen.getByText('Weight Trend')).toBeTruthy();
    expect(screen.getByText('Weight History')).toBeTruthy();
    expect(screen.getAllByText('Log Weight').length).toBe(2);
  });

  it('refetches history and chart after weight log', async () => {
    weightApi.getWeightHistory.mockResolvedValue({ data: { entries: [] } });
    weightApi.logWeight.mockResolvedValue({ data: {} });
    render(React.createElement(ProgressPage));
    await waitFor(() => {
      expect(weightApi.getWeightHistory).toHaveBeenCalled();
    });
    await userEvent.type(screen.getByLabelText('Weight (kg)'), '75');
    const buttons = screen.getAllByText('Log Weight');
    const submitBtn = buttons.find((b) => b.tagName === 'BUTTON');
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(weightApi.logWeight).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(weightApi.getWeightHistory.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
