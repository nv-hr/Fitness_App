export default function ActivitySummary({ summary }) {
  if (!summary) {
    return null;
  }

  const { totalActiveMinutes, totalCaloriesBurned, totalConsumed, calorieTarget, netCalories, netVsTarget } = summary;
  const hasActivity = totalActiveMinutes > 0 || totalCaloriesBurned > 0;

  // Color-coded net display
  let netStatus = 'on_track';
  let netLabel = '';
  let netColor = '#16a34a';

  if (netVsTarget !== null && netVsTarget !== undefined) {
    if (netVsTarget > 0) {
      netStatus = 'surplus';
      netLabel = `Surplus: +${netVsTarget} kcal`;
      netColor = '#dc2626';
    } else if (netVsTarget < 0) {
      netStatus = 'deficit';
      netLabel = `Deficit: ${netVsTarget} kcal`;
      netColor = '#16a34a';
    } else {
      netLabel = 'On track: 0 kcal';
    }
  }

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
      background: netVsTarget > 0 ? '#fef2f2' : '#f0fdf4',
    }}>
      <h4 style={{ margin: '0 0 0.75rem 0' }}>{'Activity Summary'}</h4>

      {!hasActivity && (
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {'No activity logged today'}
        </p>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {hasActivity && (
          <>
            <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{'Active Minutes'}</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{totalActiveMinutes} {'min'}</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{'Burned'}</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{totalCaloriesBurned} {'kcal'}</div>
            </div>
          </>
        )}
        <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>{'Consumed'}</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{totalConsumed} {'kcal'}</div>
        </div>
        {calorieTarget && (
          <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>{'Target'}</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{calorieTarget} {'kcal'}</div>
          </div>
        )}
      </div>

      {/* Net Calories Display */}
      {netVsTarget !== null && netVsTarget !== undefined && (
        <div style={{
          padding: '0.5rem',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1rem',
          color: netColor,
        }}>
          {netLabel}
          <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#666', marginTop: '0.25rem' }}>
            {'Net'}: {netCalories} {'kcal'}
          </div>
        </div>
      )}
    </div>
  );
}
