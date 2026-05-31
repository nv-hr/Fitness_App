import { useState, useCallback } from 'react';
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
 * @param {Error|null} props.error — Fetch error (display handled by parent)
 * @param {function} [props.onMonthChange] — Optional external month change callback
 * @param {React.ReactNode} props.children — Content rendered in DayDetailPanel slot
 */
export default function CalendarPageLayout({
  dayStatusMap,
  loading,
  error,
  onMonthChange: externalOnMonthChange,
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
    if (externalOnMonthChange) externalOnMonthChange(normalized);
  }, [externalOnMonthChange]);

  // Handle Today button click
  const handleTodayClick = useCallback(() => {
    const normalized = startOfMonth(new Date());
    setCurrentMonth(normalized);
    setSelectedDay(null);
    if (externalOnMonthChange) externalOnMonthChange(normalized);
  }, [externalOnMonthChange]);

  // Handle day selection
  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
  }, []);

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
