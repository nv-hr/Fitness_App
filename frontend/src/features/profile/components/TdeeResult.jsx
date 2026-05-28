const activityLabels = {
  sedentary: 'Rarely exercise, sedentary job',
  light: 'Light exercise 1-3x per week',
  moderate: 'Moderate exercise 3-5x per week',
  very_active: 'Intensive exercise 6-7x per week',
  extra_active: 'Daily intense exercise or physical job',
};

const goalLabels = {
  lose_weight: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain_weight: 'Gain Weight',
};

const rateLabels = {
  low: '0.25 kg/week',
  medium: '0.5 kg/week',
  high: '1 kg/week',
};

export default function TdeeResult({ tdee, tdeeRange, calorieTarget, activityLevel, fitnessGoal, calorieRate }) {
  const activityDescription = activityLabels[activityLevel] || activityLevel;
  const goalLabel = goalLabels[fitnessGoal] || fitnessGoal;
  const rateLabel = calorieRate ? rateLabels[calorieRate] : null;

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{'Your Daily Calorie Needs'}</p>
      {tdeeRange && (
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          {tdeeRange.min} - {tdeeRange.max} {'kcal/day'}
        </p>
      )}
      {activityLevel && (
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
          {activityDescription}
        </p>
      )}

      {calorieTarget && (
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{'Daily Calorie Target'}</p>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: '#22C55E',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}>
            {calorieTarget} {'kcal/day'} — {goalLabel}{rateLabel ? ` (${rateLabel})` : ''}
          </span>
        </div>
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9CA3AF', fontStyle: 'italic' }}>
        {'This result is an estimate and not a medical diagnosis.'}
      </p>
    </div>
  );
}
