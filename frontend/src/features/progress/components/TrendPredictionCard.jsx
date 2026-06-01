import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getWeightHistory } from '../api/weightApi.js';
import { useTrendPrediction } from '../hooks/useTrendPrediction.js';

const DOT_COLORS = {
  green: '#065f46',
  amber: '#d97706',
  red: '#dc2626',
  neutral: '#666',
};

const LABEL_COLORS = {
  green: '#065f46',
  amber: '#d97706',
  red: '#dc2626',
};

export default function TrendPredictionCard({ profile, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getWeightHistory(90)
      .then((response) => {
        if (!cancelled) {
          setEntries(response.data.entries || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load weight data. Try refreshing the page.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const prediction = useTrendPrediction(entries, profile);

  // --- Render states ---

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    background: '#fafafa',
  };

  const headingStyle = {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    fontWeight: 600,
  };

  // Loading state
  if (loading && entries.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={headingStyle}>Trend Prediction</h3>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
          Calculating trend...
        </div>
      </div>
    );
  }

  // Error state
  if (error && entries.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={headingStyle}>Trend Prediction</h3>
        <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>
      </div>
    );
  }

  // Empty / Insufficient data state
  if (entries.length === 0 || prediction.insufficientData) {
    return (
      <div style={cardStyle}>
        <h3 style={headingStyle}>Trend Prediction</h3>
        <p
          style={{
            color: '#666',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          Log more weight entries to see your trend.
        </p>
      </div>
    );
  }

  // Has data
  const rateText =
    prediction.direction === 'stable'
      ? 'Stable'
      : prediction.direction === 'losing'
        ? `Losing ${Math.abs(prediction.rateKgPerWeek).toFixed(1)} kg/week`
        : `Gaining ${Math.abs(prediction.rateKgPerWeek).toFixed(1)} kg/week`;

  const dotColor = DOT_COLORS[prediction.colorStatus] || '#666';
  const labelColor = LABEL_COLORS[prediction.colorStatus] || '#666';

  // Determine if we're in the "stable" (maintain) special state
  const isStable = prediction.direction === 'stable';

  // Confidence text
  let confidenceText = '';
  if (prediction.confidence !== null) {
    if (prediction.confidence >= 0.7) {
      confidenceText = '(strong fit)';
    } else if (prediction.confidence >= 0.4) {
      confidenceText = '(moderate fit)';
    } else {
      confidenceText = '(weak fit)';
    }
  }

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>Trend Prediction</h3>

      {/* No goal set: rate string only, no dot, no label, no date */}
      {prediction.noGoalSet ? (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              {rateText}
            </span>
          </div>
        </>
      ) : /* Stable (maintain goal with near-zero slope) */
      isStable ? (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  marginRight: '0.5rem',
                  background: '#666',
                }}
              />
              {rateText}
            </span>
          </div>
          {confidenceText && (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#666',
                marginTop: '0.25rem',
              }}
            >
              Confidence: {prediction.confidence?.toFixed(2)} {confidenceText}
            </p>
          )}
        </>
      ) : (
        /* Normal data state: has prediction, has goal, not stable */
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  marginRight: '0.5rem',
                  background: dotColor,
                }}
              />
              {rateText}
            </span>
            {prediction.statusLabel && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: labelColor,
                }}
              >
                {prediction.statusLabel}
              </span>
            )}
          </div>

          {prediction.estimatedDate && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#374151',
                marginTop: '0.25rem',
              }}
            >
              Estimated completion:{' '}
              {format(prediction.estimatedDate, 'MMM d, yyyy')}
            </p>
          )}

          {confidenceText && (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#666',
                marginTop: '0.25rem',
              }}
            >
              Confidence: {prediction.confidence?.toFixed(2)} {confidenceText}
            </p>
          )}
        </>
      )}
    </div>
  );
}
