import { useState } from 'react';
import { logWeight } from '../api/weightApi.js';

export default function WeightEntryCard({ onLogSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const [weightKg, setWeightKg] = useState('');
  const [loggedDate, setLoggedDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLog = async () => {
    const w = parseFloat(weightKg);
    if (isNaN(w) || w < 2 || w > 300) {
      setError('Weight must be between 2-300 kg');
      return;
    }
    if (!loggedDate) {
      setError('Date is required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await logWeight({ weightKg: w, loggedDate, notes });
      setSuccessMsg('Weight logged successfully');
      setWeightKg('');
      setNotes('');
      if (onLogSuccess) onLogSuccess();
    } catch (err) {
      setError(err.message || 'Failed to log weight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Log Weight</h3>
      {error && <p style={{ color: 'red', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{successMsg}</p>}
      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="wl-date" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Date</label>
        <input
          id="wl-date"
          type="date"
          value={loggedDate}
          onChange={(e) => setLoggedDate(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', boxSizing: 'border-box', minHeight: '44px' }}
        />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="wl-weight" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Weight (kg)</label>
        <input
          id="wl-weight"
          type="number"
          step="0.1"
          min="2"
          max="300"
          placeholder="0.0"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', boxSizing: 'border-box', minHeight: '44px' }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="wl-notes" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Notes</label>
        <textarea
          id="wl-notes"
          rows="2"
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '0.75rem 0.5rem', boxSizing: 'border-box', minHeight: '44px', resize: 'vertical' }}
        />
      </div>
      <button
        onClick={handleLog}
        disabled={loading}
        style={{ width: '100%', padding: '0.75rem', minHeight: '44px', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Logging...' : 'Log Weight'}
      </button>
    </div>
  );
}
