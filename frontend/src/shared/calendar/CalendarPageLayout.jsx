import { useState, useEffect, useCallback } from 'react';
import { startOfMonth } from 'date-fns';
import MonthNav from './MonthNav.jsx';
import CalendarGrid from './CalendarGrid.jsx';
import DayDetailPanel from './DayDetailPanel.jsx';
import { useResponsive } from '../../shared/hooks/useResponsive.js';

/**
 * CalendarPageLayout — Top-level layout composing MonthNav + CalendarGrid
 * + DayDetailPanel slot. Manages internal state for currentMonth and
 * selectedDay.
 *
 * @param {Object} props
 * @param {Map<string, string>} props.dayStatusMap — Precomputed day status map
 * @param {boolean} props.loading — Whether data is being fetched
 * @param {Error|null} props.error — Fetch error (rendered as inline error banner)
 * @param {function} [props.onMonthChange] — Optional external month change callback
 * @param {function} [props.onDaySelect] — Optional external day select callback
 * @param {React.ReactNode} props.children — Content rendered in DayDetailPanel slot
 */
export default function CalendarPageLayout({
  dayStatusMap,
  loading,
  error,
  defaultDay = null,
  onMonthChange: externalOnMonthChange,
  onDaySelect: externalOnDaySelect,
  children,
}) {
  // Internal state
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  const { isMobile } = useResponsive();

  // Handle month navigation
  const handleMonthChange = useCallback((month) => {
    const normalized = startOfMonth(month);
    setCurrentMonth(normalized);
    setSelectedDay(null); // Reset selection on month change per spec
    if (externalOnDaySelect) externalOnDaySelect(null); // Notify parent to clear stale selectedDay (IN-01)
    if (externalOnMonthChange) externalOnMonthChange(normalized);
  }, [externalOnMonthChange, externalOnDaySelect]);

  // Handle Today button click
  const handleTodayClick = useCallback(() => {
    const normalized = startOfMonth(new Date());
    setCurrentMonth(normalized);
    setSelectedDay(null);
    if (externalOnDaySelect) externalOnDaySelect(null); // Notify parent to clear stale selectedDay (IN-01)
    if (externalOnMonthChange) externalOnMonthChange(normalized);
  }, [externalOnMonthChange, externalOnDaySelect]);

  // Handle day selection
  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
    if (externalOnDaySelect) externalOnDaySelect(day);
  }, [externalOnDaySelect]);

  // Sync selectedDay whenever defaultDay prop changes (always-sync behavior)
  // Notifies parent via externalOnDaySelect so parent stays in sync with internal state
  useEffect(() => {
    if (defaultDay) {
      setSelectedDay(defaultDay);
      if (externalOnDaySelect) externalOnDaySelect(defaultDay);
    }
  }, [defaultDay, externalOnDaySelect]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      maxWidth: isMobile ? '100%' : '600px',
      margin: '0 auto',
    }}>
      <MonthNav
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onTodayClick={handleTodayClick}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Loading...
        </div>
      ) : error ? (
        <div
          role="alert"
          style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#991b1b',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}
        >
          Failed to load calendar data. {error.message || 'Unknown error'}
        </div>
      ) : (
        <CalendarGrid
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
          dayStatusMap={dayStatusMap}
        />
      )}

      <DayDetailPanel selectedDay={selectedDay}>
        {children}
      </DayDetailPanel>
    </div>
  );
}
