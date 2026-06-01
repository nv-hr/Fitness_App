import { useState } from 'react';
import { calculateActivityCalories } from './previewCalories.js';

export default function ActivityLogForm({ activity, onSubmit, onCancel }) {
  const [durationMin, setDurationMin] = useState(String(activity.duration_min));
  const [intensity, setIntensity] = useState('moderate');
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const previewCalories = calculateActivityCalories(
    activity.estimated_calories,
    activity.duration_min,
    durationMin,
    intensity
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        activityId: activity.id,
        durationMin: parseInt(durationMin, 10),
        intensity,
        loggedDate,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      background: '#fafafa',
    }}>
      <p style={{ margin: '0 0 0.75rem 0', fontWeight: 'bold', fontSize: '1rem' }}>
        {'Log Activity'}: {activity.name}
      </p>

      <form onSubmit={handleSubmit}>
        {/* Duration */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="durationMin" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            {'Duration (minutes)'}
          </label>
          <input
            id="durationMin"
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            min="1"
            max="1440"
            required
            style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Intensity */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="intensity" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            {'Intensity'}
          </label>
          <select
            id="intensity"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          >
            <option value="light">{'Light'}</option>
            <option value="moderate">{'Moderate'}</option>
            <option value="vigorous">{'Vigorous'}</option>
          </select>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="loggedDate" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            {'Date'}
          </label>
          <input
            id="loggedDate"
            type="date"
            value={loggedDate}
            readOnly
            style={{ display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box', background: '#f3f4f6', cursor: 'not-allowed' }}
          />
        </div>

        {/* Calorie Preview */}
        {previewCalories !== null && (
          <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
            {'Estimated calories burned'}: {previewCalories} kcal
            {intensity !== 'moderate' && (
              <span> ({intensity})</span>
            )}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              minHeight: '44px',
            }}
          >
            {submitting ? 'Logging...' : 'Log Activity'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              minHeight: '44px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
            }}
          >
            {'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}
