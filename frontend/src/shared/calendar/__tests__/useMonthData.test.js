import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMonthData } from '../hooks/useMonthData.js';

// Mock calendarUtils
vi.mock('../calendarUtils.js', () => ({
  getWeekStartsForMonth: vi.fn(),
  buildMonthGrid: vi.fn(),
  computeDayStatus: vi.fn(),
  DAY_STATUS: {
    INCOMPLETE: 'incomplete',
    COMPLETED: 'completed',
    PAST_INCOMPLETE: 'pastIncomplete',
  },
}));

import { getWeekStartsForMonth, buildMonthGrid, computeDayStatus } from '../calendarUtils.js';

// Helper to create a wrapper with QueryClientProvider (no JSX)
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useMonthData', () => {
  const mockDate = new Date(2026, 5, 15); // June 15, 2026

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return empty grid so existing tests are not affected
    buildMonthGrid.mockReturnValue([]);
  });

  test('calls getWeekStartsForMonth with the provided date', () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 4, 25), // Mon May 25
      new Date(2026, 5, 1),  // Mon Jun 1
      new Date(2026, 5, 8),  // Mon Jun 8
      new Date(2026, 5, 15), // Mon Jun 15
      new Date(2026, 5, 22), // Mon Jun 22
    ]);

    const fetchWeekFn = vi.fn().mockResolvedValue({ plan: { days: [] } });
    renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    expect(getWeekStartsForMonth).toHaveBeenCalledWith(mockDate);
  });

  test('creates N queries (one per weekStart) via useQueries', () => {
    const mockWeekStarts = [
      new Date(2026, 4, 25),
      new Date(2026, 5, 1),
      new Date(2026, 5, 8),
      new Date(2026, 5, 15),
      new Date(2026, 5, 22),
    ];
    getWeekStartsForMonth.mockReturnValue(mockWeekStarts);

    const fetchWeekFn = vi.fn().mockResolvedValue({ plan: { days: [] } });
    const { result } = renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    // 5 weekStarts → 5 queries
    expect(fetchWeekFn).toHaveBeenCalledTimes(5);
  });

  test('fetchWeekFn is invoked for each weekStart with correct date string', () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 4, 25),
      new Date(2026, 5, 1),
    ]);

    const fetchWeekFn = vi.fn().mockResolvedValue({ plan: { days: [] } });
    renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    expect(fetchWeekFn).toHaveBeenCalledWith('2026-05-25');
    expect(fetchWeekFn).toHaveBeenCalledWith('2026-06-01');
  });

  test('dayStatusMap contains entries for all returned plan days', async () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 4, 25),
    ]);

    const mockPlanData = {
      plan: {
        days: [
          { date: '2026-05-25', completed: true },
          { date: '2026-05-26', completed: false },
        ],
      },
    };

    computeDayStatus.mockImplementation((dateStr, planDay, isPast) => {
      if (planDay && planDay.completed) return 'completed';
      if (isPast) return 'pastIncomplete';
      return 'incomplete';
    });

    const fetchWeekFn = vi.fn().mockResolvedValue(mockPlanData);
    const { result } = renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // buildMonthGrid returns [] so only API-returned days populate the map
    expect(result.current.dayStatusMap.size).toBe(2);
    expect(result.current.dayStatusMap.get('2026-05-25')).toBe('completed');
    expect(result.current.dayStatusMap.get('2026-05-26')).toBeDefined();
  });

  test('dayStatusMap fills in defaults for grid days not present in API data', async () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 4, 25),
    ]);

    // Today is May 31, 2026 (system date during test execution).
    // Mock buildMonthGrid to return 3 days:
    // - May 25 (Mon) — present in API data, completed
    // - May 26 (Tue) — present in API data, past/incomplete
    // - May 27 (Wed) — NOT in API data, past (isPast=true) → PAST_INCOMPLETE
    buildMonthGrid.mockReturnValue([
      new Date(2026, 4, 25), // Mon May 25
      new Date(2026, 4, 26), // Tue May 26
      new Date(2026, 4, 27), // Wed May 27 — missing from API data
    ]);

    const mockPlanData = {
      plan: {
        days: [
          { date: '2026-05-25', completed: true },
          { date: '2026-05-26', completed: false },
        ],
      },
    };

    computeDayStatus.mockImplementation((dateStr, planDay, isPast) => {
      if (planDay && planDay.completed) return 'completed';
      if (isPast) return 'pastIncomplete';
      return 'incomplete';
    });

    const fetchWeekFn = vi.fn().mockResolvedValue(mockPlanData);
    const { result } = renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2 API days + 1 grid day filled with default = 3 total
    expect(result.current.dayStatusMap.size).toBe(3);
    // API-returned day (completed, past)
    expect(result.current.dayStatusMap.get('2026-05-25')).toBe('completed');
    // API-returned day (past, not completed → PAST_INCOMPLETE)
    expect(result.current.dayStatusMap.get('2026-05-26')).toBe('pastIncomplete');
    // Grid-filled day (missing from API, past → PAST_INCOMPLETE)
    expect(result.current.dayStatusMap.get('2026-05-27')).toBe('pastIncomplete');
  });

  test('loading is true when queries are resolving, false after resolution', async () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 5, 1),
    ]);

    // Create a delayed promise to test loading state
    let resolvePromise;
    const fetchWeekFn = vi.fn().mockReturnValue(new Promise(resolve => {
      resolvePromise = resolve;
    }));

    const { result } = renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Resolve the query
    resolvePromise({ plan: { days: [] } });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test('error contains first error when a query fails', async () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 5, 1),
      new Date(2026, 5, 8),
    ]);

    const fetchWeekFn = vi.fn()
      .mockResolvedValueOnce({ plan: { days: [] } })
      .mockRejectedValue(new Error('Network error')); // reject consistently (retry:1 will retry once)

    const { result } = renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    // Wait for all queries to resolve/reject (including retries)
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    }, { timeout: 5000 });

    expect(result.current.error.message).toBe('Network error');
  });

  test('refetch triggers all queries to re-fetch', async () => {
    getWeekStartsForMonth.mockReturnValue([
      new Date(2026, 5, 1),
    ]);

    const fetchWeekFn = vi.fn().mockResolvedValue({ plan: { days: [] } });
    const { result } = renderHook(() => useMonthData(mockDate, fetchWeekFn), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.refetch();

    // After refetch is called, the query should re-run
    await waitFor(() => {
      expect(fetchWeekFn).toHaveBeenCalledTimes(2); // 1 initial + 1 refetch
    });
  });
});
