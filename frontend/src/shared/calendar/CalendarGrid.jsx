import { DayPicker } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { DAY_STATUS } from './calendarUtils.js';

/**
 * Calendar grid component wrapping react-day-picker v9 DayPicker
 * with modifier-based color coding for day statuses.
 *
 * Pure presentational — receives precomputed dayStatusMap.
 *
 * @param {Object} props
 * @param {Date} props.currentMonth — Currently displayed month
 * @param {function} props.onMonthChange — Called with new Date month
 * @param {Date|null} props.selectedDay — Currently selected day
 * @param {function} props.onDaySelect — Called when a day is clicked
 * @param {Map<string, string>} props.dayStatusMap — Map of 'YYYY-MM-DD' → DAY_STATUS
 */
export default function CalendarGrid({
  currentMonth,
  onMonthChange,
  selectedDay,
  onDaySelect,
  dayStatusMap,
}) {
  const today = new Date();

  // Guard: if dayStatusMap is a plain object (not Map), convert defensively
  // and warn in development to help consumers fix their types.
  const normalizedMap = (() => {
    if (dayStatusMap instanceof Map) return dayStatusMap;
    if (dayStatusMap && typeof dayStatusMap === 'object') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'CalendarGrid: dayStatusMap must be a Map instance. Received object — converting via Object.entries().'
        );
      }
      return new Map(Object.entries(dayStatusMap));
    }
    return new Map();
  })();

  // Define custom modifiers based on normalizedMap
  const modifiers = {
    incomplete: (day) => normalizedMap.get(format(day, 'yyyy-MM-dd')) === DAY_STATUS.INCOMPLETE,
    completed: (day) => normalizedMap.get(format(day, 'yyyy-MM-dd')) === DAY_STATUS.COMPLETED,
    pastIncomplete: (day) => normalizedMap.get(format(day, 'yyyy-MM-dd')) === DAY_STATUS.PAST_INCOMPLETE,
    today: (day) => isSameDay(day, today),
  };

  // Modifier styles for color coding (per UI-SPEC)
  const modifierStyles = {
    incomplete: { backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px' },
    completed: { backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px' },
    pastIncomplete: { backgroundColor: '#f3f4f6', color: '#9ca3af', borderRadius: '4px' },
    today: { outline: '2px solid #2563eb', outlineOffset: '2px', borderRadius: '4px' },
    selected: { outline: '2px solid #1e40af', outlineOffset: '-2px', borderRadius: '4px' },
    outside: { opacity: 0.4 },
  };

  return (
    <DayPicker
      mode="single"
      selected={selectedDay}
      onSelect={onDaySelect}
      month={currentMonth}
      onMonthChange={onMonthChange}
      modifiers={modifiers}
      modifierStyles={modifierStyles}
      weekStartsOn={1} // Monday
      showOutsideDays={true}
      hideNavigation={true} // MonthNav handles navigation externally
      captionLayout="label"
    />
  );
}
