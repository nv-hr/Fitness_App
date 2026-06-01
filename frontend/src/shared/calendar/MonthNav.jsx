import { subMonths, addMonths, format, isSameMonth } from 'date-fns';

const buttonStyle = {
  padding: '0.75rem 1rem',
  minHeight: '44px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '4px',
  background: 'white',
  fontSize: '1rem',
};

/**
 * Month navigation component with prev/next arrow buttons,
 * month/year header, and optional "Today" jump button.
 *
 * Pure presentational — receives all state as props.
 *
 * @param {Object} props
 * @param {Date} props.currentMonth — Currently displayed month
 * @param {function} props.onMonthChange — Called with new Date when navigating (subMonths/addMonths)
 * @param {function} props.onTodayClick — Called when "Today" button is clicked
 */
export default function MonthNav({ currentMonth, onMonthChange, onTodayClick }) {
  const isNotCurrentMonth = !isSameMonth(currentMonth, new Date());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          aria-label="Previous month"
          style={buttonStyle}
        >
          ◀
        </button>

        <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>

        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="Next month"
          style={buttonStyle}
        >
          ▶
        </button>
      </div>

      {isNotCurrentMonth && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onTodayClick}
            aria-label="Go to today"
            style={buttonStyle}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
