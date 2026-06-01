import { format } from 'date-fns';

/**
 * Day detail panel component with slot-based children rendering.
 * Shows date info when a day is selected, placeholder otherwise.
 *
 * @param {Object} props
 * @param {Date|null} props.selectedDay — Currently selected day (null = no selection)
 * @param {React.ReactNode} props.children — Content rendered below date header when day selected
 */
export default function DayDetailPanel({ selectedDay, children }) {
  return (
    <div style={{ padding: '1rem 0', minHeight: '100px' }}>
      {selectedDay ? (
        <>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
            Selected day: {format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </h3>
          {children}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
          Select a day to view details
        </div>
      )}
    </div>
  );
}
